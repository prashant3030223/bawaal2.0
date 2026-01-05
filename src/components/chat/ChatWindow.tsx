import React, { useState, useEffect, useRef } from "react"
import { Search, MoreVertical, Paperclip, Smile, Mic, Send, Lock, Check, CheckCheck, X, Image as ImageIcon, Camera, File as FileIcon, Trash2, Play, Pause, Video, Phone, ArrowLeft, ShieldAlert } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useChatStore, Message } from "@/stores/chat.store"
import { useAuthStore } from "@/stores/auth.store"
import { chatService } from "@/api/supabase/chat"
import { cn } from "@/lib/utils"
import { supabase } from "@/api/supabase/client"
import { callService } from "@/api/supabase/calls"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Audio instances with better configuration
const sendSound = new Audio("/sounds/sent_tone.mp3?v=" + new Date().getTime())
const receiveSound = new Audio("https://raw.githubusercontent.com/AnshRathod/whatsapp-clone/master/client/public/sounds/received.mp3")

// Configure audio
sendSound.volume = 0.5
receiveSound.volume = 0.7
sendSound.preload = 'auto'
receiveSound.preload = 'auto'

const COMMON_EMOJIS = ["😀", "😂", "🥰", "😍", "🤩", "😘", "😜", "🤑", "🤔", "🙄", "🤐", "😴", "😎", "🥺", "😭", "😤", "🔥", "💯", "🙏", "👍", "❤️", "✨", "🙌", "😂"]

// Voice Message Player Component - Bawaal Style
const VoicePlayer = ({ url }: { url: string }) => {
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnded = () => setPlaying(false);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlay = () => {
        if (playing) {
            audioRef.current?.pause();
        } else {
            audioRef.current?.play();
        }
        setPlaying(!playing);
    };

    const toggleSpeed = () => {
        const speeds = [1, 1.5, 2];
        const currentIndex = speeds.indexOf(playbackRate);
        const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
        setPlaybackRate(nextSpeed);
        if (audioRef.current) {
            audioRef.current.playbackRate = nextSpeed;
        }
    };

    const formatTime = (time: number) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="flex items-center gap-2 py-2 px-2 w-[200px] sm:w-[260px] md:w-[300px] transition-all">

            <button
                onClick={togglePlay}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-105 flex-shrink-0"
            >
                {playing ? (
                    <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white text-white" />
                ) : (
                    <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white text-white ml-0.5" />
                )}
            </button>

            <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
                {/* Waveform visualization */}
                <div className="flex items-center gap-0.5 h-6 sm:h-8 w-full">
                    {[...Array(30)].map((_, i) => {
                        const height = Math.random() * 100;
                        const isPassed = (i / 30) * 100 < progress;
                        return (
                            <div
                                key={i}
                                className="flex-1 rounded-full transition-all duration-100"
                                style={{
                                    height: `${20 + height * 0.6}%`,
                                    backgroundColor: isPassed ? '#00a884' : 'rgba(255,255,255,0.3)',
                                    minWidth: '2px'
                                }}
                            />
                        );
                    })}
                </div>

                {/* Duration */}
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-white/70 px-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Playback speed */}
            {playing && (
                <button
                    onClick={toggleSpeed}
                    className="text-[10px] font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full transition-all"
                >
                    {playbackRate}x
                </button>
            )}

            <audio
                ref={audioRef}
                src={url}
                className="hidden"
            />
        </div>
    );
};

export default function ChatWindow() {
    const { activeConversation, messages, addMessage, setMessages, updateMessage, markAllAsRead, setActiveConversation, removeConversation, onlineUsers, setViewingImage, typingStatus, setContactInfoOpen } = useChatStore()
    const { user } = useAuthStore()

    const [inputText, setInputText] = useState("")
    const [loading, setLoading] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [showMediaOptions, setShowMediaOptions] = useState(false)

    const isOtherUserOnline = activeConversation?.other_user ? onlineUsers.has(String(activeConversation.other_user.id)) : false;
    const isOtherUserTyping = activeConversation ? !!typingStatus[activeConversation.id] : false;











    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isViewOnce, setIsViewOnce] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [isBlocked, setIsBlocked] = useState(false)
    const { setCall } = useChatStore()

    // Voice Recording State
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const timerRef = useRef<any>(null)

    const scrollRef = useRef<HTMLDivElement>(null)
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)
    const documentInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setShowEmojiPicker(false)
        setShowMediaOptions(false)
        setSelectedImage(null)
        setImagePreview(null)
        setIsRecording(false)
        setRecordingTime(0)
        setIsBlocked(false)

        if (activeConversation && user) {
            loadMessages()
            chatService.markAsRead(activeConversation.id, user.id)
            markAllAsRead()

            // Check if user is blocked
            if (activeConversation.other_user) {
                chatService.isUserBlocked(user.id, activeConversation.other_user.id)
                    .then(blocked => setIsBlocked(blocked))
            }

            const msgChannel = supabase
                .channel(`chat:${activeConversation.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${activeConversation.id}`
                }, (payload) => {
                    const newMsg = payload.new as any
                    const state = useChatStore.getState()

                    if (state.blockedUsers.includes(newMsg.sender_id)) return

                    if (newMsg.sender_id !== user.id) {
                        addMessage(newMsg)
                        // Play notification sound
                        receiveSound.currentTime = 0
                        receiveSound.play()
                            .then(() => console.log('Notification sound played'))
                            .catch(err => console.log('Sound blocked by browser:', err))
                        chatService.markAsRead(activeConversation.id, user.id)
                    }
                })
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${activeConversation.id}`
                }, (payload) => {
                    updateMessage(payload.new.id, payload.new as any)
                })
                .subscribe()

            return () => {
                supabase.removeChannel(msgChannel)
                if (activeConversation && user) {
                    chatService.sendTypingStatus(activeConversation.id, user.id, false)
                }
            }
        }
    }, [activeConversation?.id, user?.id])

    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
            if (scrollContainer) {
                scrollContainer.scrollTo({
                    top: scrollContainer.scrollHeight,
                    behavior: 'smooth'
                })
            }
        }
    }, [messages, isOtherUserTyping])

    const loadMessages = async () => {
        if (!activeConversation) return
        setLoading(true)
        try {
            const data = await chatService.getMessages(activeConversation.id, user?.id)
            setMessages(data)
        } catch (err) {
            console.error("Error loading messages:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (val: string) => {
        setInputText(val)
        if (!activeConversation || !user) return

        // Send typing=true
        chatService.sendTypingStatus(activeConversation.id, user.id, true)

        // Clear existing timeout
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

        // Set timeout to send typing=false
        typingTimeoutRef.current = setTimeout(() => {
            chatService.sendTypingStatus(activeConversation.id, user.id, false)
        }, 3000)
    }

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if ((!inputText.trim() && !selectedImage) || !activeConversation || !user) return

        const content = inputText.trim()
        setInputText("")
        setShowEmojiPicker(false)

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        chatService.sendTypingStatus(activeConversation.id, user.id, false)

        // Optimistic update for text
        let tempId = 'temp-' + Date.now()
        if (!selectedImage) {
            const tempMsg: Message = {
                id: tempId,
                conversation_id: activeConversation.id,
                sender_id: user.id,
                content: content,
                type: 'text',
                created_at: new Date().toISOString(),
                is_read: false
            }
            addMessage(tempMsg)
            // Also update conversation list last message
            useChatStore.getState().updateLastMessage(activeConversation.id, content, tempMsg.created_at)
        }

        try {
            if (selectedImage) {
                setIsUploading(true)
                const publicUrl = await chatService.uploadFile(selectedImage)
                const newMessage = await chatService.sendMessage(activeConversation.id, user.id, publicUrl, 'image', isViewOnce)
                addMessage(newMessage)
                setSelectedImage(null)
                setImagePreview(null)
                setIsViewOnce(false)
                setIsUploading(false)
                useChatStore.getState().updateLastMessage(activeConversation.id, "Sent an image", newMessage.created_at)
            } else {
                const newMessage = await chatService.sendMessage(activeConversation.id, user.id, content)
                // Replace temp message with real one
                setMessages(useChatStore.getState().messages.map(m => m.id === tempId ? newMessage : m))
            }
            sendSound.play().catch(() => { })
        } catch (err: any) {
            console.error("Error sending message:", err)
            setIsUploading(false)
            // Remove temp message on error
            if (!selectedImage) {
                setMessages(useChatStore.getState().messages.filter(m => m.id !== tempId))
            }
        }
    }

    const handleDeleteMessage = async (messageId: string, mode: 'me' | 'everyone') => {
        if (!user) return
        try {
            await chatService.deleteMessage(messageId, mode, user.id)
            if (mode === 'everyone') {
                updateMessage(messageId, { content: 'This message was deleted', is_deleted: true, deleted_for_all: true })
            } else {
                // For "Delete for me", we filter it out from the current message list
                const filteredMessages = messages.filter(m => m.id !== messageId)
                setMessages(filteredMessages)
            }
        } catch (err: any) {
            console.error("Delete error:", err)
        }
    }

    const handleInitiateCall = async (type: 'voice' | 'video') => {
        if (!activeConversation || !user || !activeConversation.other_user) return
        try {
            const call = await callService.initiateCall(user.id, activeConversation.other_user.id, type)
            setCall({
                ...call,
                caller_name: user?.user_metadata?.full_name || 'You',
                caller_avatar: user?.user_metadata?.avatar_url,
                receiver_name: activeConversation.other_user.full_name,
                receiver_avatar: activeConversation.other_user.avatar_url
            })
        } catch (err) {
            console.error("Call init error:", err)
        }
    }

    const handleBlockUser = async () => {
        if (!activeConversation?.other_user || !user) return
        try {
            const state = useChatStore.getState()
            if (isBlocked) {
                await chatService.unblockUser(user.id, activeConversation.other_user.id)
                setIsBlocked(false)
                state.setBlockedUsers(state.blockedUsers.filter(id => id !== activeConversation.other_user?.id))
            } else {
                await chatService.blockUser(user.id, activeConversation.other_user.id)
                setIsBlocked(true)
                state.setBlockedUsers([...state.blockedUsers, activeConversation.other_user.id])
            }
        } catch (err) {
            console.error('Block/unblock error:', err)
        }
    }

    const handleViewOnce = async (msg: any) => {
        if (!user || !msg.is_view_once || msg.viewed_by?.includes(user.id)) return
        // In real app, we'd delete the file or mark it. Here we mark it viewed.
        try {
            const viewedBy = [...(msg.viewed_by || []), user.id]
            await supabase.from('messages').update({ viewed_by: viewedBy }).eq('id', msg.id)
            updateMessage(msg.id, { viewed_by: viewedBy })
        } catch (err) {
            console.error("View once err:", err)
        }
    }

    // Voice Recording Functions
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            })
            const recorder = new MediaRecorder(stream)
            mediaRecorderRef.current = recorder
            audioChunksRef.current = []

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data)
            }

            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                await uploadVoiceMessage(audioBlob)
                stream.getTracks().forEach(track => track.stop())
            }

            recorder.start()
            setIsRecording(true)
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)
        } catch (err) {
            console.error("Mic access denied:", err)
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            clearInterval(timerRef.current)
            setRecordingTime(0)
        }
    }

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.onstop = null // Don't upload
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            clearInterval(timerRef.current)
            setRecordingTime(0)
        }
    }

    const uploadVoiceMessage = async (blob: Blob) => {
        if (!activeConversation || !user) return
        setIsUploading(true)
        try {
            const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
            const publicUrl = await chatService.uploadFile(file)
            const newMessage = await chatService.sendMessage(activeConversation.id, user.id, publicUrl, 'file') // Using 'file' type for audio for now
            addMessage(newMessage)
            sendSound.play().catch(() => { })
        } catch (err) {
            console.error("Voice upload error:", err)
        } finally {
            setIsUploading(false)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedImage(file)
            setImagePreview(URL.createObjectURL(file))
            setShowMediaOptions(false)
        }
    }

    const addEmoji = (emoji: string) => {
        setInputText(prev => prev + emoji)
    }

    if (!activeConversation) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-transparent text-center p-10 select-none relative overflow-hidden animate-in fade-in duration-700">
                {/* Orbital Animation Background */}
                <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                    <div className="w-[500px] h-[500px] border border-emerald-500/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
                    <div className="absolute w-[350px] h-[350px] border border-cyan-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                    <div className="absolute w-[200px] h-[200px] bg-emerald-500/5 blur-3xl rounded-full animate-pulse"></div>
                </div>

                <div className="relative z-10 group cursor-default">
                    <div className="w-28 h-28 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-3xl rotate-6 group-hover:rotate-12 transition-all duration-500 shadow-[0_0_50px_rgba(16,185,129,0.3)] flex items-center justify-center mb-10">
                        <Send className="w-12 h-12 text-white fill-white/20" />
                    </div>
                </div>

                <h2 className="text-5xl font-extralight text-white mb-6 tracking-tight drop-shadow-xl">Bawaal <span className="font-bold text-emerald-400">Web</span></h2>
                <p className="text-white/60 max-w-md leading-relaxed text-lg font-light">
                    Experience the future of communication.<br />
                    Fast. Secure. Beautiful.
                </p>

                <div className="mt-12 flex items-center gap-2 text-white/30 text-xs tracking-[0.2em] uppercase">
                    <Lock className="w-3 h-3" /> End-to-end encrypted
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-transparent perspective-1000">
            {/* Ambient Kinetic Background Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[150px] rounded-full animate-orb"></div>
                <div className="absolute bottom-[10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full animate-orb" style={{ animationDelay: '-12s' }}></div>
            </div>
            {/* Header - Ultra-Modern Floating Glass */}
            <div className="absolute top-4 left-4 right-4 h-[75px] md:h-[85px] px-4 md:px-8 flex items-center justify-between bg-white/[0.03] backdrop-blur-[40px] rounded-[28px] border border-white/10 z-[50] shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-700 animate-in slide-in-from-top-10">
                <div className="flex items-center gap-3 md:gap-5 cursor-pointer group" onClick={() => setContactInfoOpen(true)}>
                    {/* Mobile back button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setActiveConversation(null); }}
                        className="md:hidden p-2.5 -ml-1 text-emerald-500 hover:text-emerald-400 rounded-full hover:bg-emerald-500/10 transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>

                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <Avatar
                            className="h-12 w-12 md:h-14 md:w-14 border-2 border-white/10 group-hover:border-emerald-500/30 transition-all duration-500 shadow-2xl cursor-pointer group-hover:scale-110"
                            onClick={(e) => {
                                e.stopPropagation()
                                setViewingImage(activeConversation.other_user?.avatar_url || activeConversation.avatar_url || null)
                            }}
                        >
                            <AvatarImage src={activeConversation.other_user?.avatar_url || activeConversation.avatar_url} className="object-cover transition-transform duration-700 group-hover:scale-110" />
                            <AvatarFallback className="bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-white text-xl font-light">
                                {activeConversation.name?.[0] || "C"}
                            </AvatarFallback>
                        </Avatar>
                        {isOtherUserOnline && (
                            <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-[3.5px] border-[#080808] rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]"></span>
                        )}
                    </div>

                    <div className="flex flex-col min-w-0">
                        <span className="text-white font-bold text-[17px] md:text-xl leading-tight tracking-tight group-hover:text-emerald-400 transition-all duration-300 truncate max-w-[140px] sm:max-w-md">{activeConversation.name}</span>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "text-[10px] md:text-[11px] font-bold tracking-[0.15em] uppercase transition-all truncate",
                                isOtherUserTyping ? "text-emerald-400 animate-pulse" : (isOtherUserOnline ? "text-emerald-500" : "text-white/30")
                            )}>
                                {isOtherUserTyping ? "Typing..." : (isOtherUserOnline ? "Online" : "Offline")}
                            </span>
                            {isOtherUserOnline && !isOtherUserTyping && (
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-5">
                    {!isBlocked && (
                        <div className="flex items-center gap-1 md:gap-2">
                            <HeaderAction icon={<Video className="w-5 h-5" />} onClick={() => handleInitiateCall('video')} color="emerald" title="Video Call" />
                            <HeaderAction icon={<Phone className="w-5 h-5" />} onClick={() => handleInitiateCall('voice')} color="emerald" title="Voice Call" />
                        </div>
                    )}
                    <div className="w-px h-8 bg-white/10 hidden sm:block mx-2"></div>
                    <div className="hidden sm:flex items-center gap-1">
                        <HeaderAction icon={<Search className="w-5 h-5" />} onClick={() => { }} title="Search Chat" />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-3 rounded-2xl text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-xl">
                                <MoreVertical className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-black/60 backdrop-blur-3xl border border-white/10 text-white w-64 p-2 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] mr-6 mt-4 animate-in fade-in zoom-in-95">
                            <DropdownMenuItem className="hover:bg-white/10 cursor-pointer py-3 rounded-xl px-4 focus:bg-white/10 focus:text-white bg-transparent text-white font-semibold text-sm transition-all" onClick={() => setActiveConversation(null)}>
                                <X className="w-4 h-4 mr-3 text-white/40" /> Close chat
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-white/10 cursor-pointer py-3 rounded-xl px-4 focus:bg-white/10 focus:text-white bg-transparent text-white font-semibold text-sm transition-all" onClick={async () => {
                                if (!user) return
                                try { await chatService.clearMessages(activeConversation.id, user.id); setMessages([]) } catch (err) { }
                            }}>
                                <Trash2 className="w-4 h-4 mr-3 text-white/40" /> Clear messages
                            </DropdownMenuItem>
                            {activeConversation?.other_user && (
                                <DropdownMenuItem className="hover:bg-red-500/20 cursor-pointer py-3 rounded-xl px-4 text-red-500 focus:bg-red-500/20 focus:text-red-500 mt-1 font-bold text-sm transition-all" onClick={handleBlockUser}>
                                    <ShieldAlert className="w-4 h-4 mr-3" /> {isBlocked ? 'Unblock user' : 'Block user'}
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="hover:bg-red-500/20 cursor-pointer py-2.5 rounded-lg px-3 text-red-500 focus:bg-red-500/20 focus:text-red-500" onClick={async () => {
                                if (!user || !activeConversation) return
                                try {
                                    await chatService.deleteConversation(activeConversation.id, user.id);
                                    removeConversation(activeConversation.id);
                                    setActiveConversation(null);
                                } catch (err) { }
                            }}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete chat
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Messages Area - GOAT Level Aesthetics */}
            <ScrollArea ref={scrollRef} className="flex-1 px-4 md:px-8 relative pt-24 md:pt-32 pb-32 z-10 scroll-smooth">
                {/* Subtle Pattern Background */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] grayscale invert" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>

                <div className="flex flex-col gap-4 max-w-6xl mx-auto py-8">
                    {messages.map((msg: Message) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex flex-col group/msg animate-in slide-in-from-bottom-5 duration-500",
                                msg.sender_id === user?.id ? "items-end" : "items-start"
                            )}
                        >
                            <div className={cn(
                                "max-w-[85%] md:max-w-[70%] relative group/bubble p-1.5 rounded-[22px] transition-all duration-500 shadow-2xl",
                                msg.sender_id === user?.id
                                    ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-tr-none shadow-[0_10px_30px_rgba(16,185,129,0.2)]"
                                    : "bg-white/[0.08] backdrop-blur-3xl text-zinc-100 rounded-tl-none border border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                            )}>
                                {/* Dropdown Trigger Overlay */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className={cn(
                                            "absolute top-2 opacity-0 group-hover/bubble:opacity-100 transition-all p-1.5 text-white/50 hover:text-white rounded-full hover:bg-black/20 z-20",
                                            msg.sender_id === user?.id ? "left-2" : "right-2"
                                        )}>
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-black/60 backdrop-blur-3xl border border-white/10 text-white rounded-2xl p-1.5 shadow-2xl animate-in zoom-in-95">
                                        <DropdownMenuItem onClick={() => handleDeleteMessage(msg.id, 'me')} className="hover:bg-white/10 cursor-pointer rounded-xl py-2 px-3 text-sm font-semibold transition-all">
                                            <Trash2 className="w-4 h-4 mr-2 opacity-50" /> Delete for me
                                        </DropdownMenuItem>
                                        {msg.sender_id === user?.id && !msg.is_deleted && (
                                            <DropdownMenuItem onClick={() => handleDeleteMessage(msg.id, 'everyone')} className="hover:bg-red-500/20 cursor-pointer text-red-400 rounded-xl py-2 px-3 text-sm font-bold transition-all mt-0.5">
                                                <ShieldAlert className="w-4 h-4 mr-2" /> Delete for everyone
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <div className="p-2 sm:p-3">
                                    {msg.is_deleted ? (
                                        <div className="flex items-center gap-3 px-1 py-1 opacity-50 italic text-[14px]">
                                            <X className="w-4 h-4" />
                                            <span>This message was deleted</span>
                                        </div>
                                    ) : msg.is_view_once ? (
                                        <div className="flex flex-col gap-3 p-2 min-w-[220px]">
                                            {msg.viewed_by?.includes(user?.id || "") ? (
                                                <div className="flex items-center gap-3 py-3 border border-dashed border-white/10 rounded-2xl px-4 bg-black/20">
                                                    <ImageIcon className="w-6 h-6 text-white/20" />
                                                    <span className="text-white/30 font-bold tracking-tight">Opened</span>
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() => handleViewOnce(msg)}
                                                    className="flex items-center gap-4 bg-white/10 border border-white/20 p-4 rounded-2xl cursor-pointer hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all group/vo shadow-xl active:scale-95"
                                                >
                                                    <div className="w-10 h-10 rounded-full border-2 border-emerald-400 flex items-center justify-center text-emerald-400 font-black shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover/vo:scale-110 transition-transform">1</div>
                                                    <span className="font-bold text-emerald-50 text-[15px] tracking-tight">View Once Photo</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : msg.type === 'image' ? (
                                        <div className="max-w-sm overflow-hidden rounded-[18px] mb-2 cursor-pointer transition-all duration-500 hover:scale-[1.02] border border-white/10 shadow-2xl relative group/img" onClick={() => setViewingImage(msg.content)}>
                                            <img src={msg.content} alt="Media" className="w-full h-auto object-cover max-h-[500px]" />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity"></div>
                                        </div>
                                    ) : msg.type === 'call' ? (
                                        <div className="flex items-center gap-4 py-2 px-2">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl shrink-0 rotate-3 group-hover:rotate-0 transition-transform duration-500",
                                                msg.content.includes('Missed') ? "bg-red-500/20 text-red-500" : "bg-emerald-500/20 text-emerald-400"
                                            )}>
                                                {msg.content.includes('Video') ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[15px] tracking-tight">{msg.content}</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1">
                                                    {msg.sender_id === user?.id ? 'Outgoing' : 'Incoming'}
                                                </span>
                                            </div>
                                        </div>
                                    ) : msg.content.includes('.webm') || msg.content.includes('.mp3') ? (
                                        <VoicePlayer url={msg.content} />
                                    ) : (
                                        <p className="text-[16px] leading-[1.6] px-2 font-medium break-words whitespace-pre-wrap">{msg.content}</p>
                                    )}

                                    <div className="flex items-center justify-end gap-2 mt-2 px-1">
                                        <span className="text-[10px] font-black tracking-widest uppercase opacity-40">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        {msg.sender_id === user?.id && (
                                            <div className="relative flex items-center">
                                                <CheckCheck className={cn("w-4 h-4 transition-colors", msg.is_read ? "text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" : "text-white/20")} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isOtherUserTyping && (
                        <div className="flex justify-start mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="bg-white/5 backdrop-blur-[40px] px-5 py-4 rounded-[22px] rounded-tl-none flex items-center gap-2 border border-white/5 shadow-2xl">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-duration:800ms]"></span>
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-duration:800ms] [animation-delay:200ms]"></span>
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-duration:800ms] [animation-delay:400ms]"></span>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea >

            {/* Media/Image Preview - Floating Glass Panel */}
            {
                imagePreview && (
                    <div className="absolute inset-x-4 bottom-24 bg-black/80 backdrop-blur-2xl z-30 p-6 border border-white/10 rounded-2xl flex flex-col items-center gap-4 animate-in slide-in-from-bottom duration-300 shadow-2xl">
                        <div className="relative group">
                            <img src={imagePreview} alt="Preview" className="max-h-80 rounded-xl shadow-2xl border border-white/10" />
                            <button onClick={() => { setSelectedImage(null); setImagePreview(null); setIsViewOnce(false); }} className="absolute -top-4 -right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg hover:scale-110 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setIsViewOnce(!isViewOnce)}
                                className={cn(
                                    "absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg backdrop-blur-sm border border-white/10",
                                    isViewOnce ? "bg-emerald-500 text-white" : "bg-black/60 text-white/80 hover:bg-black/80"
                                )}
                                title="Toggle View Once"
                            >
                                <span className="text-lg font-bold">1</span>
                            </button>
                        </div>
                        <p className="text-white/60 text-sm font-medium">Ready to send</p>
                    </div>
                )
            }

            {/* Blocked User Message */}
            {
                isBlocked && (
                    <div className="absolute bottom-4 left-4 right-4 h-[60px] flex items-center justify-center bg-red-500/10 backdrop-blur-xl border border-red-500/20 z-20 rounded-2xl">
                        <div className="flex items-center gap-3 text-red-200">
                            <span className="text-sm font-medium">You blocked this contact.</span>
                            <button
                                onClick={handleBlockUser}
                                className="bg-red-500/20 hover:bg-red-500/30 text-white px-3 py-1 rounded-full text-xs font-bold transition-colors border border-red-500/30"
                            >
                                Unblock
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Input Area - GOAT Level Floating Island */}
            {
                !isBlocked && (
                    <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 w-[92%] max-w-5xl z-40 transition-all duration-500">
                        {showEmojiPicker && (
                            <div className="absolute bottom-full mb-4 left-0 bg-black/40 backdrop-blur-3xl p-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 grid grid-cols-6 sm:grid-cols-9 gap-2 animate-in slide-in-from-bottom-5 fade-in duration-500 w-full sm:w-auto overflow-y-auto max-h-72 scrollbar-none">
                                {COMMON_EMOJIS.map((e, i) => (
                                    <button key={i} onClick={() => addEmoji(e)} className="text-2xl hover:bg-white/10 p-2 rounded-2xl transition-all hover:scale-125 active:scale-95">{e}</button>
                                ))}
                            </div>
                        )}

                        {showMediaOptions && (
                            <div className="absolute bottom-full mb-6 left-0 sm:left-4 bg-black/60 backdrop-blur-3xl p-3 rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-white/10 flex flex-col gap-1.5 w-[calc(100vw-40px)] sm:w-72 animate-in slide-in-from-bottom-8 fade-in duration-700 origin-bottom-left z-[60]">
                                <MediaOptionButton
                                    onClick={() => fileInputRef.current?.click()}
                                    icon={<ImageIcon className="w-6 h-6" />}
                                    title="Gallery"
                                    desc="Send high-res photos"
                                    color="from-purple-500 to-indigo-600"
                                />
                                <MediaOptionButton
                                    onClick={() => cameraInputRef.current?.click()}
                                    icon={<Camera className="w-6 h-6" />}
                                    title="Camera"
                                    desc="Instant capture"
                                    color="from-pink-500 to-rose-600"
                                />
                                <MediaOptionButton
                                    onClick={() => documentInputRef.current?.click()}
                                    icon={<FileIcon className="w-6 h-6" />}
                                    title="Document"
                                    desc="PDFs, ZIPs & more"
                                    color="from-blue-500 to-cyan-600"
                                />
                            </div>
                        )}

                        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[35px] p-2 flex items-center gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5 transition-all duration-500 focus-within:ring-emerald-500/40 focus-within:bg-white/[0.05] group">
                            {isRecording ? (
                                <div className="flex-1 flex items-center justify-between px-6 h-14 animate-in fade-in duration-500">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]"></div>
                                            <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce"></div>
                                        </div>
                                        <span className="text-white font-mono font-bold text-lg tracking-widest tabular-nums">{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button onClick={cancelRecording} className="text-white/40 hover:text-red-400 transition-all text-xs font-black tracking-widest uppercase px-5 py-2 hover:bg-red-500/10 rounded-full active:scale-95">Cancel</button>
                                        <button onClick={stopRecording} className="bg-emerald-500 hover:bg-emerald-400 text-white rounded-full px-8 py-2.5 text-xs font-black tracking-widest uppercase shadow-[0_5px_20px_rgba(16,185,129,0.4)] transition-all hover:scale-105 active:scale-90">Finish</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => { setShowMediaOptions(!showMediaOptions); setShowEmojiPicker(false); }}
                                        className={cn(
                                            "w-11 h-11 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-500 active:scale-90 shrink-0",
                                            showMediaOptions ? "bg-emerald-500 text-white rotate-45" : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                                        )}
                                    >
                                        <Paperclip className="w-5 h-5 md:w-6 md:h-6" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowMediaOptions(false); }}
                                        className={cn(
                                            "w-11 h-11 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-500 active:scale-90 shrink-0",
                                            showEmojiPicker ? "bg-yellow-500/20 text-yellow-400" : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-yellow-400"
                                        )}
                                    >
                                        <Smile className="w-5 h-5 md:w-6 md:h-6" />
                                    </button>

                                    <form onSubmit={handleSendMessage} className="flex-1">
                                        <Input
                                            value={inputText}
                                            onChange={(e) => handleInputChange(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                            placeholder="Type something bawaal..."
                                            className="bg-transparent border-none text-white h-11 md:h-14 text-[15px] md:text-[17px] font-medium focus:ring-0 placeholder:text-white/20 px-2 transition-all"
                                            autoComplete="off"
                                        />
                                    </form>

                                    {(inputText.trim() || selectedImage) ? (
                                        <button
                                            type="button"
                                            onClick={() => handleSendMessage()}
                                            className="w-11 h-11 md:w-14 md:h-14 bg-gradient-to-tr from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 rounded-full flex items-center justify-center transition-all duration-500 shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:scale-110 active:scale-90 group shrink-0"
                                        >
                                            <Send className="w-4 h-4 md:w-6 md:h-6 text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500" />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={startRecording}
                                            className="w-11 h-11 md:w-14 md:h-14 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full flex items-center justify-center transition-all duration-500 active:scale-90 group shrink-0 relative overflow-hidden"
                                        >
                                            <Mic className="w-4 h-4 md:w-6 md:h-6 text-white/40 group-hover:text-white group-hover:scale-110 transition-all z-10" />
                                            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        </button>
                                    )}
                                </>
                            )}

                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileSelect} />
                            <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileSelect} />
                            <input type="file" ref={documentInputRef} className="hidden" accept=".pdf,.doc,.docx,.txt,.zip,.rar" onChange={handleFileSelect} />
                        </div>
                    </div>
                )
            }
        </div >
    )
}
const HeaderAction = ({ icon, onClick, color = "white", title }: any) => (
    <button
        onClick={onClick}
        title={title}
        className={cn(
            "p-2.5 md:p-3 rounded-2xl transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg",
            color === "emerald"
                ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white shadow-emerald-500/20"
                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
        )}
    >
        {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5 md:w-6 md:h-6" })}
    </button>
)

const MediaOptionButton = ({ onClick, icon, title, desc, color }: any) => (
    <button
        onClick={onClick}
        className="group flex items-center gap-4 p-4 hover:bg-white/[0.08] rounded-[2rem] transition-all duration-300 w-full text-left active:scale-[0.98]"
    >
        <div className={cn(
            "w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-all duration-500 shrink-0",
            color
        )}>
            {icon}
        </div>
        <div className="flex flex-col min-w-0">
            <span className="text-white font-bold text-[15px] group-hover:text-emerald-400 transition-colors">{title}</span>
            <span className="text-white/40 text-[11px] font-medium leading-tight group-hover:text-white/60 transition-colors line-clamp-1">{desc}</span>
        </div>
    </button>
)

