import React, { useEffect, useRef, useState } from 'react'
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Camera, X, Minimize2, Maximize2, UserPlus, Search, MonitorUp, RefreshCcw } from 'lucide-react'
import { useChatStore, CallSession } from '@/stores/chat.store'
import { useAuthStore } from '@/stores/auth.store'
import { chatService } from '@/api/supabase/chat'
import { callService } from '@/api/supabase/calls'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { supabase } from '@/api/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'

// Core reliable sound assets
const DIALTONE_URL = "/sounds/dialtone.mp3?v=" + new Date().getTime()
const RINGTONE_URL = "/sounds/ringtone.mp3?v=" + new Date().getTime()
const END_CALL_URL = "/sounds/whatsapp_end_call.mp3"

const PC_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' }
    ]
}

const MEDIA_CONSTRAINTS = {
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
    },
    video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
        facingMode: 'user'
    }
}

export default function CallOverlay() {
    const { activeCall, incomingCall, setCall, setIncomingCall } = useChatStore()
    const { user } = useAuthStore()

    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
    const [isMuted, setIsMuted] = useState(false)
    const [isVideoOff, setIsVideoOff] = useState(false)
    const [callDuration, setCallDuration] = useState(0)
    const [isMinimized, setIsMinimized] = useState(false)
    const [isAddUserOpen, setIsAddUserOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [userSearchResults, setUserSearchResults] = useState<any[]>([])
    const [isAddingUser, setIsAddingUser] = useState<string | null>(null)
    const [isScreenSharing, setIsScreenSharing] = useState(false)
    const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
    const [currentCameraId, setCurrentCameraId] = useState<string>("")

    // Audio elements refs to maintain single instance
    const dialAudio = useRef<HTMLAudioElement | null>(null)
    const ringAudio = useRef<HTMLAudioElement | null>(null)
    const endCallAudio = useRef<HTMLAudioElement | null>(null)

    const pcRef = useRef<RTCPeerConnection | null>(null)
    const localVideoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)
    const durationIntervalRef = useRef<any>(null)
    const candidateQueue = useRef<RTCIceCandidateInit[]>([])
    const callLoggedRef = useRef<boolean>(false) // Prevent duplicate messages

    const currentCall = activeCall || incomingCall
    const isCaller = activeCall?.caller_id === user?.id
    const displayName = isCaller ? currentCall?.receiver_name : currentCall?.caller_name
    const displayAvatar = isCaller ? currentCall?.receiver_avatar : currentCall?.caller_avatar

    // Fetch available cameras
    useEffect(() => {
        const getCameras = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices()
                const cameras = devices.filter(d => d.kind === 'videoinput')
                setAvailableCameras(cameras)
                if (cameras.length > 0) {
                    setCurrentCameraId(cameras[0].deviceId)
                }
            } catch (e) {
                console.error("Error fetching cameras", e)
            }
        }
        if (currentCall?.type === 'video') {
            getCameras()
        }
    }, [currentCall?.type])

    // Preload audio and setup
    useEffect(() => {
        dialAudio.current = new Audio(DIALTONE_URL)
        ringAudio.current = new Audio(RINGTONE_URL)
        endCallAudio.current = new Audio(END_CALL_URL)

        dialAudio.current.loop = true
        ringAudio.current.loop = true
        endCallAudio.current.loop = false // Play only once

        return () => {
            dialAudio.current?.pause()
            ringAudio.current?.pause()
            endCallAudio.current?.pause()
        }
    }, [])

    // 1. Audio Control Effect
    useEffect(() => {
        if (!currentCall) {
            dialAudio.current?.pause()
            if (dialAudio.current) dialAudio.current.currentTime = 0
            ringAudio.current?.pause()
            if (ringAudio.current) ringAudio.current.currentTime = 0
            return
        }

        // Reset flag for new call
        callLoggedRef.current = false

        if (currentCall.status === 'ringing') {
            if (isCaller) {
                dialAudio.current?.play().catch(() => console.log("Dialtone blocked by browser"))
            } else {
                ringAudio.current?.play().catch(() => console.log("Ringtone blocked by browser"))
            }
        } else {
            dialAudio.current?.pause()
            ringAudio.current?.pause()
        }
    }, [currentCall?.status, isCaller])

    // 2. Timer Effect
    useEffect(() => {
        if (currentCall?.status === 'connected') {
            durationIntervalRef.current = setInterval(() => setCallDuration(p => p + 1), 1000)
        } else {
            clearInterval(durationIntervalRef.current)
            setCallDuration(0)
        }
        return () => clearInterval(durationIntervalRef.current)
    }, [currentCall?.status])

    // 3. Global Status Listener
    useEffect(() => {
        if (!currentCall) return

        const statusSub = supabase.channel(`call_status:${currentCall.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'calls',
                filter: `id=eq.${currentCall.id}`
            }, (payload) => {
                const updated = payload.new as any
                if (updated.status === 'ended' || updated.status === 'rejected') {
                    handleCleanup()
                } else if (updated.status === 'connected') {
                    if (isCaller && activeCall?.status === 'ringing') {
                        setCall({ ...activeCall, status: 'connected' })
                    }
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(statusSub)
        }
    }, [currentCall?.id, isCaller, activeCall?.status])

    // 4. WebRTC Connection Effect
    useEffect(() => {
        if (!currentCall || currentCall.status !== 'connected') return

        let signalChannel: any = null

        const initWebRTC = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: currentCall.type === 'video' ? MEDIA_CONSTRAINTS.video : false,
                    audio: MEDIA_CONSTRAINTS.audio
                })
                setLocalStream(stream)
                if (localVideoRef.current) localVideoRef.current.srcObject = stream

                const pc = new RTCPeerConnection(PC_CONFIG)
                pcRef.current = pc

                stream.getTracks().forEach(track => pc.addTrack(track, stream))

                pc.ontrack = (e) => {
                    const rStr = e.streams[0]
                    setRemoteStream(rStr)
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = rStr
                        remoteVideoRef.current.play().catch(err => console.error("Remote playback error", err))
                    }
                }

                signalChannel = supabase.channel(`call_signaling:${currentCall.id}`)

                pc.onicecandidate = (e) => {
                    if (e.candidate) {
                        signalChannel.send({
                            type: 'broadcast',
                            event: 'signal',
                            payload: { type: 'candidate', candidate: e.candidate, senderId: user?.id }
                        })
                    }
                }

                signalChannel.on('broadcast', { event: 'signal' }, async ({ payload }: any) => {
                    if (payload.senderId === user?.id) return

                    try {
                        if (payload.type === 'offer') {
                            await pc.setRemoteDescription(new RTCSessionDescription(payload.offer))
                            const ans = await pc.createAnswer()
                            await pc.setLocalDescription(ans)
                            signalChannel.send({
                                type: 'broadcast',
                                event: 'signal',
                                payload: { type: 'answer', answer: ans, senderId: user?.id }
                            })
                            // Process queued ICE candidates
                            while (candidateQueue.current.length > 0) {
                                const cand = candidateQueue.current.shift()
                                if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand))
                            }
                        } else if (payload.type === 'answer') {
                            await pc.setRemoteDescription(new RTCSessionDescription(payload.answer))
                            while (candidateQueue.current.length > 0) {
                                const cand = candidateQueue.current.shift()
                                if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand))
                            }
                        } else if (payload.type === 'candidate') {
                            if (pc.remoteDescription) {
                                await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
                            } else {
                                candidateQueue.current.push(payload.candidate)
                            }
                        }
                    } catch (err) {
                        console.error("Signaling sync error:", err)
                    }
                })

                signalChannel.subscribe(async (status: string) => {
                    if (status === 'SUBSCRIBED' && isCaller) {
                        // Caller initiates
                        const offer = await pc.createOffer()
                        await pc.setLocalDescription(offer)
                        signalChannel.send({
                            type: 'broadcast',
                            event: 'signal',
                            payload: { type: 'offer', offer, senderId: user?.id }
                        })
                    }
                })
            } catch (err) {
                console.error("Critical Call Error:", err)
                handleEndCall()
            }
        }

        initWebRTC()

        return () => {
            if (signalChannel) supabase.removeChannel(signalChannel)
        }
    }, [currentCall?.id, currentCall?.status])

    // 5. Local Video Sync Effect
    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream
        }
    }, [localStream, isMinimized])

    // 6. Remote Video Sync Effect
    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream
        }
    }, [remoteStream, isMinimized])

    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            // Stop sharing, revert to camera
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        ...MEDIA_CONSTRAINTS.video,
                        deviceId: currentCameraId ? { exact: currentCameraId } : undefined
                    },
                    audio: MEDIA_CONSTRAINTS.audio
                })

                // Replace track in peer connection
                if (pcRef.current && localStream) {
                    const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video')
                    if (sender) sender.replaceTrack(stream.getVideoTracks()[0])
                }

                setLocalStream(stream)
                setIsScreenSharing(false)
            } catch (e) {
                console.error("Error reverting to camera", e)
            }
        } else {
            // Start sharing screen
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })

                // Handle user manually stopping screen share via browser UI
                stream.getVideoTracks()[0].onended = () => {
                    toggleScreenShare() // Revert to camera
                }

                // Replace track
                if (pcRef.current && localStream) {
                    const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video')
                    if (sender) sender.replaceTrack(stream.getVideoTracks()[0])
                }

                setLocalStream(stream)
                setIsScreenSharing(true)
            } catch (e) {
                console.error("Error starting screen share", e)
            }
        }
    }

    const switchCamera = async () => {
        if (availableCameras.length < 2) return

        const currentIndex = availableCameras.findIndex(c => c.deviceId === currentCameraId)
        const nextIndex = (currentIndex + 1) % availableCameras.length
        const nextCameraId = availableCameras[nextIndex].deviceId

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    ...MEDIA_CONSTRAINTS.video,
                    deviceId: { exact: nextCameraId }
                },
                audio: MEDIA_CONSTRAINTS.audio
            })

            if (pcRef.current && localStream) {
                const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video')
                if (sender) sender.replaceTrack(stream.getVideoTracks()[0])
            }

            setLocalStream(stream)
            setCurrentCameraId(nextCameraId)
            // Ensure mirrored effect is off for back cameras on mobile (simplified assumption)
            setIsVideoOff(false)

        } catch (e) {
            console.error("Error switching camera", e)
        }
    }

    const handleSearchUsers = async (query: string) => {
        setSearchQuery(query)
        if (query.length < 2 || !user) {
            setUserSearchResults([])
            return
        }
        try {
            const results = await chatService.searchUsers(query, user.id)
            setUserSearchResults(results)
        } catch (err) {
            console.error("Error searching users:", err)
        }
    }

    const handleAddUser = async (userId: string) => {
        setIsAddingUser(userId)
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        // In a real app, this would call callService.inviteUser(currentCall.id, userId)
        // For now, we simulate success
        setIsAddingUser(null)

        // Update UI to show sent state (locally for this session)
        setUserSearchResults(prev => prev.map(u =>
            u.id === userId ? { ...u, hasSentInvite: true } : u
        ))
    }

    const logCall = async (status: string) => {
        if (!currentCall || !user) return

        // Only caller logs to avoid duplicates (Receiver updates status, Caller listens and logs)
        if (!isCaller) return

        // Prevent duplicate logging
        if (callLoggedRef.current) {
            console.log('Call already logged, skipping duplicate')
            return
        }
        callLoggedRef.current = true

        try {
            // Find conversation between these users
            const { data: members1 } = await supabase
                .from('conversation_members')
                .select('conversation_id')
                .eq('user_id', currentCall.caller_id)

            if (!members1) return

            const convIds = members1.map(m => m.conversation_id)
            const { data: shared } = await supabase
                .from('conversation_members')
                .select('conversation_id')
                .in('conversation_id', convIds)
                .eq('user_id', currentCall.receiver_id)

            if (!shared || shared.length === 0) return

            const conversationId = shared[0].conversation_id

            let logText = ""
            const callTypeLabel = currentCall.type === 'video' ? 'Video' : 'Voice'

            if (status === 'rejected') {
                logText = `Declined ${callTypeLabel} Call`
            } else if (status === 'ended' && callDuration === 0) {
                logText = `Missed ${callTypeLabel} Call`
            } else {
                const mins = Math.floor(callDuration / 60)
                const secs = callDuration % 60
                const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
                logText = `${callTypeLabel} Call ended (${durationStr})`
            }

            // Insert call log message
            await supabase.from('messages').insert([{
                conversation_id: conversationId,
                sender_id: currentCall.caller_id,
                content: logText,
                type: 'call',
                is_read: false
            }])

            // Update conversation last message
            await supabase.from('conversations').update({
                last_message: logText,
                last_message_at: new Date().toISOString()
            }).eq('id', conversationId)

        } catch (err) {
            console.error("Call logging error:", err)
        }
    }

    const handleCleanup = async () => {
        // Play end call sound
        if (endCallAudio.current) {
            endCallAudio.current.currentTime = 0
            endCallAudio.current.play().catch(e => console.log('End call sound failed:', e))
        }

        if (currentCall) {
            await logCall(currentCall.status)
        }

        pcRef.current?.close()
        pcRef.current = null
        localStream?.getTracks().forEach(t => t.stop())
        setLocalStream(null)
        setRemoteStream(null)
        setCall(null)
        setIncomingCall(null)
        dialAudio.current?.pause()
        ringAudio.current?.pause()
        candidateQueue.current = []
        setIsMinimized(false)
        setIsScreenSharing(false)
    }

    const handleAccept = async () => {
        if (!incomingCall) return
        try {
            await callService.updateCallStatus(incomingCall.id, 'connected')
            setCall({ ...incomingCall, status: 'connected' })
            setIncomingCall(null)
            ringAudio.current?.pause()
        } catch (err) {
            console.error("Accept error:", err)
        }
    }

    const handleReject = async () => {
        if (!incomingCall) return
        await callService.updateCallStatus(incomingCall.id, 'rejected')
        handleCleanup()
    }

    const handleEndCall = async () => {
        if (!currentCall) return
        await callService.updateCallStatus(currentCall.id, 'ended')
        handleCleanup()
    }

    const toggleMute = () => {
        if (localStream) {
            const track = localStream.getAudioTracks()[0]
            if (track) { track.enabled = isMuted; setIsMuted(!isMuted) }
        }
    }

    const toggleVideo = () => {
        if (localStream) {
            const track = localStream.getVideoTracks()[0]
            if (track) { track.enabled = isVideoOff; setIsVideoOff(!isVideoOff) }
        }
    }

    const formatDuration = () => {
        const mins = Math.floor(callDuration / 60)
        const secs = callDuration % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (!currentCall) return null

    // Minimized View
    if (isMinimized) {
        return (
            <div className="fixed bottom-4 right-4 w-60 h-80 bg-[#0b141a] z-[200] rounded-xl overflow-hidden shadow-2xl border border-white/10 animate-in slide-in-from-bottom-5 duration-300 flex flex-col group">
                <div className="relative flex-1 bg-[#111b21]">
                    {currentCall.type === 'video' && remoteStream && currentCall.status === 'connected' ? (
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4">
                            <Avatar className="h-20 w-20 mb-3">
                                <AvatarImage src={displayAvatar} />
                                <AvatarFallback>{displayName?.[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-white font-medium truncate w-full text-center">{displayName}</span>
                            <span className="text-[#00a884] text-xs mt-1">{formatDuration()}</span>
                        </div>
                    )}

                    {/* Controls Overlay on Hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button onClick={toggleMute} className={cn("p-2 rounded-full", isMuted ? "bg-red-500 text-white" : "bg-white/10 text-white")}>
                            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>
                        {currentCall.type === 'video' && (
                            <button onClick={toggleVideo} className={cn("p-2 rounded-full", isVideoOff ? "bg-red-500 text-white" : "bg-white/10 text-white")}>
                                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                            </button>
                        )}
                        <button onClick={() => setIsMinimized(false)} className="p-2 bg-white/10 rounded-full text-white">
                            <Maximize2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="h-12 bg-[#202c33] flex items-center justify-center px-4">
                    <button onClick={handleEndCall} className="w-full flex items-center justify-center gap-2 text-red-500 font-medium text-sm hover:bg-white/5 py-1.5 rounded-lg transition-colors">
                        <PhoneOff className="w-4 h-4" /> End Call
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-[#0b141a] z-[200] flex flex-col font-sans overflow-hidden animate-in fade-in duration-700">
            {/* Dynamic Mesh Background - GOAT Level Aesthetics */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-emerald-600/10 blur-[120px] rounded-full animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-cyan-600/10 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '-5s' }}></div>
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-purple-600/5 blur-[100px] rounded-full animate-pulse-slow" style={{ animationDelay: '-2s' }}></div>
            </div>

            {/* Top Bar - Floating Glass */}
            <div className="absolute top-6 left-0 right-0 z-50 flex items-center justify-between px-6 pointer-events-none">
                <div className="pointer-events-auto bg-black/20 backdrop-blur-xl border border-white/10 rounded-full p-1.5 transition-all hover:bg-white/10">
                    <button onClick={() => setIsMinimized(true)} className="p-2 text-white/80 hover:text-white transition-colors rounded-full">
                        <Minimize2 className="w-5 h-5" />
                    </button>
                </div>


            </div>

            <div className="flex-1 relative flex items-center justify-center overflow-hidden h-full">
                {/* Remote Video Stream */}
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={cn(
                        "w-full h-full object-cover transition-opacity duration-1000",
                        (currentCall.type === 'video' && remoteStream && currentCall.status === 'connected') ? "opacity-100" : "opacity-0 absolute"
                    )}
                />

                {/* Voice Call / Waiting UI - Premium Centerpiece */}
                {!(currentCall.type === 'video' && remoteStream && currentCall.status === 'connected') && (
                    <div className="flex flex-col items-center z-10 text-center animate-in fade-in zoom-in-95 duration-1000">
                        <div className="relative mb-16 group">
                            {/* Animated Pulse Rings - GOAT Level */}
                            {currentCall.status === 'ringing' && (
                                <>
                                    <div className="absolute -inset-16 border border-emerald-500/20 rounded-full animate-[ping_3s_infinite] opacity-20"></div>
                                    <div className="absolute -inset-12 border border-emerald-500/30 rounded-full animate-[pulse_2s_infinite] opacity-30"></div>
                                    <div className="absolute -inset-8 border border-emerald-500/40 rounded-full animate-[pulse_3s_infinite] opacity-40"></div>
                                </>
                            )}

                            <div className="relative z-10 p-3 rounded-full border border-white/20 bg-white/5 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.5)] transform transition-transform duration-700 group-hover:scale-105">
                                <Avatar className="h-44 w-44 md:h-64 md:w-64 shadow-2xl ring-4 ring-white/10">
                                    <AvatarImage src={displayAvatar} className="object-cover" />
                                    <AvatarFallback className="text-8xl bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-white font-thin">
                                        {displayName?.[0]}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Status Icon Overlay */}
                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-3 rounded-full shadow-lg border-4 border-[#0b141a]">
                                    {currentCall.type === 'video' ? <Video className="w-6 h-6 text-white" /> : <Phone className="w-6 h-6 text-white" />}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-white text-5xl md:text-7xl font-extralight tracking-tight drop-shadow-2xl animate-in slide-in-from-bottom-5 duration-700">
                                {displayName}
                            </h2>
                            <div className="flex flex-col items-center gap-4">
                                {currentCall.status === 'ringing' ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="px-6 py-2 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-bold tracking-[0.3em] uppercase backdrop-blur-md border border-emerald-500/20 animate-pulse transition-all">
                                            {isCaller ? 'Bawaal Calling...' : 'Incoming Call...'}
                                        </span>
                                        <p className="text-white/40 text-xs tracking-widest uppercase font-medium">Secure End-to-End Encrypted</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-emerald-400 text-3xl md:text-4xl font-light tracking-[0.25em] tabular-nums drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                                            {formatDuration()}
                                        </span>
                                        <p className="text-white/30 text-[10px] tracking-[0.5em] uppercase font-bold">On Air</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Local PiP (Small Video Preview) - Premium Glass Look */}
                {currentCall.type === 'video' && localStream && (
                    <div className="absolute top-24 right-4 w-28 h-40 md:w-40 md:h-56 bg-black/40 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-white/20 z-20 group transition-all hover:scale-105 duration-300">
                        <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror" />
                        {isVideoOff && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                <VideoOff className="w-8 h-8 text-white/40" />
                            </div>
                        )}
                        {/* Screen Share Indicator */}
                        {isScreenSharing && (
                            <div className="absolute top-2 left-2 bg-red-500/80 backdrop-blur-md rounded-full p-1.5 animate-pulse z-10 shadow-glow-red" title="Sharing Screen">
                                <MonitorUp className="w-3 h-3 text-white" />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Controls Area - Premium Floating Island */}
            <div className="absolute bottom-12 left-0 right-0 z-[100] flex items-center justify-center px-4">
                <div className="bg-[#1c1c1e]/60 backdrop-blur-3xl border border-white/10 rounded-[40px] px-8 py-5 md:px-12 md:py-6 flex items-center justify-center gap-6 md:gap-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 hover:bg-[#1c1c1e]/80 hover:scale-[1.02]">
                    {incomingCall && incomingCall.status === 'ringing' ? (
                        <div className="flex items-center justify-center gap-16 md:gap-24 animate-in slide-in-from-bottom-10 duration-700">
                            <button onClick={handleReject} className="flex flex-col items-center gap-3 group">
                                <div className="bg-red-500 text-white p-5 md:p-6 rounded-full shadow-[0_10px_30px_rgba(239,68,68,0.4)] group-hover:scale-110 group-active:scale-95 transition-all duration-300">
                                    <PhoneOff className="w-8 h-8 md:w-10 md:h-10" />
                                </div>
                                <span className="text-white/50 text-[10px] font-bold tracking-[0.2em] uppercase group-hover:text-red-400 transition-colors">Decline</span>
                            </button>
                            <button onClick={handleAccept} className="flex flex-col items-center gap-3 group">
                                <div className="bg-emerald-500 text-white p-5 md:p-6 rounded-full shadow-[0_10px_30px_rgba(16,185,129,0.4)] group-hover:scale-110 group-active:scale-95 transition-all duration-300 animate-[bounce_2s_infinite]">
                                    {incomingCall.type === 'video' ? <Video className="w-8 h-8 md:w-10 md:h-10" /> : <Phone className="w-8 h-8 md:w-10 md:h-10" />}
                                </div>
                                <span className="text-white/50 text-[10px] font-bold tracking-[0.2em] uppercase group-hover:text-emerald-400 transition-colors">Accept</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-4 md:gap-8">
                            <ControlButton
                                active={isMuted}
                                onClick={toggleMute}
                                icon={isMuted ? <MicOff className="w-6 h-6 md:w-7 md:h-7" /> : <Mic className="w-6 h-6 md:w-7 md:h-7" />}
                                activeClass="bg-red-500/20 border-red-500/50 text-red-500"
                                label="Mute"
                            />

                            {currentCall.type === 'video' && (
                                <>
                                    <ControlButton
                                        active={isVideoOff}
                                        onClick={toggleVideo}
                                        icon={isVideoOff ? <VideoOff className="w-6 h-6 md:w-7 md:h-7" /> : <Video className="w-6 h-6 md:w-7 md:h-7" />}
                                        activeClass="bg-red-500/20 border-red-500/50 text-red-500"
                                        label="Camera"
                                    />

                                    <ControlButton
                                        active={isScreenSharing}
                                        onClick={toggleScreenShare}
                                        icon={<MonitorUp className="w-6 h-6 md:w-7 md:h-7" />}
                                        activeClass="bg-emerald-500/20 border-emerald-500/50 text-emerald-500"
                                        label="Share"
                                    />

                                    {availableCameras.length > 1 && (
                                        <ControlButton
                                            active={false}
                                            onClick={switchCamera}
                                            icon={<RefreshCcw className="w-6 h-6 md:w-7 md:h-7" />}
                                            label="Flip"
                                        />
                                    )}
                                </>
                            )}

                            <button
                                onClick={handleEndCall}
                                className="bg-red-500 hover:bg-red-600 text-white p-5 md:p-6 rounded-full shadow-[0_10px_30px_rgba(239,68,68,0.5)] transition-all duration-300 hover:scale-110 active:scale-90 group md:ml-6"
                            >
                                <PhoneOff className="w-8 h-8 md:w-10 md:h-10 fill-current group-hover:rotate-90 transition-transform duration-500" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Participant Dialog - Premium Glass */}
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogContent className="bg-[#111b21]/90 backdrop-blur-xl border border-white/10 text-white w-[90%] max-w-sm rounded-2xl shadow-2xl shadow-black/50">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-light tracking-wide text-white/90 text-center pb-2">Add Participant</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="relative group">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40 group-focus-within:text-emerald-400 transition-colors" />
                            <Input
                                placeholder="Search..."
                                className="bg-black/20 border border-white/10 text-white pl-10 h-11 rounded-xl focus-visible:ring-1 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 transition-all placeholder:text-white/20"
                                value={searchQuery}
                                onChange={(e) => handleSearchUsers(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="h-[250px] pr-2">
                            <div className="space-y-2">
                                {userSearchResults.map((u) => (
                                    <div
                                        key={u.id}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-white/5 group"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="relative">
                                                <Avatar className="h-10 w-10 border border-white/10 group-hover:border-emerald-500/30 transition-colors">
                                                    <AvatarImage src={u.avatar_url} />
                                                    <AvatarFallback className="bg-white/10 text-white/60">{u.full_name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                {/* Online Indicator if needed, simplified here */}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-white/90 font-medium block truncate text-sm">{u.full_name}</span>
                                                <span className="text-xs text-white/40 truncate block">{u.status || "Hey there!"}</span>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={u.hasSentInvite || isAddingUser === u.id}
                                            onClick={() => handleAddUser(u.id)}
                                            className={cn(
                                                "h-8 px-4 rounded-lg transition-all font-medium text-xs tracking-wide",
                                                u.hasSentInvite
                                                    ? "bg-transparent text-emerald-400 hover:bg-transparent"
                                                    : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-500/20"
                                            )}
                                        >
                                            {isAddingUser === u.id ? <span className="animate-pulse">Adding...</span> : (u.hasSentInvite ? "Sent" : "Add")}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    )
}

const ControlButton = ({ active, onClick, icon, activeClass = "", label }: any) => (
    <div className="flex flex-col items-center gap-2">
        <button
            onClick={onClick}
            className={cn(
                "p-4 md:p-5 rounded-full transition-all duration-300 border backdrop-blur-md shadow-lg group relative overflow-hidden",
                active
                    ? activeClass
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 hover:scale-110"
            )}
        >
            {icon}
            {/* Visual Ripple Effect on Hover */}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </button>
        <span className="text-white/30 text-[9px] font-bold tracking-widest uppercase">{label}</span>
    </div>
)

