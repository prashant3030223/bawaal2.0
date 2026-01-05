import { useEffect } from "react"
import ChatSidebar from "@/components/chat/ChatSidebar"
import ChatWindow from "@/components/chat/ChatWindow"
import { chatService } from "@/api/supabase/chat"
import { useChatStore } from "@/stores/chat.store"
import { useAuthStore } from "@/stores/auth.store"
import { supabase } from "@/api/supabase/client"
import { callService } from "@/api/supabase/calls"
import CallOverlay from "@/components/chat/CallOverlay"
import ContactInfoSidebar from "@/components/chat/ContactInfoSidebar"

// Audio instances
// Audio instances
const receiveSound = new Audio("/sounds/message_tone.mp3?v=" + new Date().getTime())

export default function ChatPage() {
    const { user } = useAuthStore()
    const { setConversations, activeConversation, incrementUnread, setIncomingCall, setOnlineUsers, setTypingStatus, conversations, isContactInfoOpen, setContactInfoOpen, blockedUsers, setBlockedUsers, setMessages } = useChatStore()

    // Global Presence & Call Listener
    useEffect(() => {
        if (user) {
            // Subscribe to global presence
            const presenceChannel = chatService.subscribeToGlobalPresence(user.id, (userIds) => {
                setOnlineUsers(userIds)
            })

            const callChannel = callService.subscribeToCalls(user.id, async (payload) => {
                if (payload.status === 'ringing') {
                    // Fetch caller details to display name/avatar
                    try {
                        const { data: callerData } = await supabase
                            .from('users')
                            .select('full_name, avatar_url')
                            .eq('id', payload.caller_id)
                            .single()

                        setIncomingCall({
                            ...payload,
                            caller_name: callerData?.full_name || 'Unknown',
                            caller_avatar: callerData?.avatar_url
                        })
                    } catch (error) {
                        console.error("Error fetching caller details", error)
                        setIncomingCall(payload)
                    }
                }
            })

            return () => {
                chatService.leaveGlobalPresence()
                supabase.removeChannel(callChannel)
            }
        }
    }, [user])

    // Messages & Memberships Listener
    useEffect(() => {
        if (user) {
            loadConversations()
            chatService.getBlockedUsers(user.id).then(ids => {
                useChatStore.getState().setBlockedUsers(ids)
            })

            if ("Notification" in window && Notification.permission === "default") {
                Notification.requestPermission()
            }

            // Subscription to handle new conversation additions (Group/DM)
            const membershipChannel = supabase
                .channel(`memberships:${user.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'conversation_members',
                    filter: `user_id=eq.${user.id}`
                }, () => {
                    loadConversations()
                })
                .subscribe()

            // Subscription for messages
            const messageChannel = supabase
                .channel('global_messages')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                }, (payload) => {
                    const newMsg = payload.new as any
                    const state = useChatStore.getState()

                    // Filter blocked users
                    if (state.blockedUsers.includes(newMsg.sender_id)) return

                    // Check if the user is a participant of the conversation
                    const isParticipant = state.conversations.some(c => c.id === newMsg.conversation_id)

                    if (isParticipant && newMsg.sender_id !== user.id) {
                        // Play sound if not in active chat
                        if (state.activeConversation?.id !== newMsg.conversation_id) {
                            receiveSound.play().catch(() => { })
                            incrementUnread(newMsg.conversation_id)

                            if (Notification.permission === "granted" && document.hidden) {
                                new Notification("New Message", {
                                    body: newMsg.content,
                                    icon: "/favicon.svg"
                                })
                            }
                        }

                        // Optimize: Instead of full reload, update locally
                        state.updateLastMessage(newMsg.conversation_id, newMsg.content, newMsg.created_at)
                    }
                })
                .subscribe()

            return () => {
                supabase.removeChannel(membershipChannel)
                supabase.removeChannel(messageChannel)
            }
        }
    }, [user])

    const loadConversations = async () => {
        if (!user) return
        try {
            const data = await chatService.getConversations(user.id)
            setConversations(data)
        } catch (err) {
            console.error("Error loading conversations:", err)
        }
    }

    // Typing status listener for all conversations
    useEffect(() => {
        if (user && conversations.length > 0) {
            const typingChannels = conversations.map(conv => {
                return chatService.subscribeToTyping(conv.id, (payload) => {
                    if (payload.payload.userId !== user.id) {
                        setTypingStatus(conv.id, payload.payload.isTyping)

                        // WhatsApp Style: If user stops typing or browser closes, clear it after 5s
                        if (payload.payload.isTyping) {
                            setTimeout(() => {
                                setTypingStatus(conv.id, false)
                            }, 5000)
                        }
                    }
                })
            })

            return () => {
                typingChannels.forEach(channel => supabase.removeChannel(channel))
            }
        }
    }, [user, conversations.map(c => c.id).join(',')])

    return (
        <div className="flex h-screen bg-mesh overflow-hidden relative text-white">
            {/* Ambient Background Effects - Even more subtle for goat level */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen animate-pulse-slow" style={{ animationDelay: '4s' }}></div>

            {/* Mobile: Show sidebar OR chat window based on activeConversation */}
            {/* Desktop: Show both side by side relative for z-index */}
            <div className={`${activeConversation ? 'hidden md:flex' : 'flex'} w-full md:w-auto z-10`}>
                <ChatSidebar />
            </div>
            <div className={`${activeConversation ? 'flex' : 'hidden md:flex'} flex-1 z-10`}>
                <ChatWindow />
            </div>

            <CallOverlay />

            <ContactInfoSidebar
                isOpen={isContactInfoOpen}
                onClose={() => setContactInfoOpen(false)}
                conversation={activeConversation}
                isBlocked={activeConversation?.other_user ? blockedUsers.includes(activeConversation.other_user.id) : false}
                onBlock={async () => {
                    if (!activeConversation?.other_user || !user) return
                    const otherId = activeConversation.other_user.id
                    const isAlreadyBlocked = blockedUsers.includes(otherId)
                    try {
                        if (isAlreadyBlocked) {
                            await chatService.unblockUser(user.id, otherId)
                            setBlockedUsers(blockedUsers.filter(id => id !== otherId))
                        } else {
                            await chatService.blockUser(user.id, otherId)
                            setBlockedUsers([...blockedUsers, otherId])
                        }
                    } catch (err) {
                        console.error("Error toggling block:", err)
                    }
                }}
                onClearChat={async () => {
                    if (!activeConversation || !user) return
                    if (confirm("Are you sure you want to clear all messages in this protocol?")) {
                        try {
                            await chatService.clearMessages(activeConversation.id, user.id)
                            setMessages([])
                        } catch (err) {
                            console.error("Error clearing chat:", err)
                        }
                    }
                }}
            />

            {/* Global Image Viewer Overlay */}
            {useChatStore(state => state.viewingImage) && (
                <div
                    className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-4 animate-in fade-in duration-300"
                    onClick={() => useChatStore.getState().setViewingImage(null)}
                >
                    <div className="relative group max-w-[90vw] max-h-[90vh]">
                        <button
                            onClick={() => useChatStore.getState().setViewingImage(null)}
                            className="absolute -top-12 right-0 md:-right-12 text-white/50 hover:text-white transition-colors p-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                        <img
                            src={useChatStore.getState().viewingImage!}
                            alt="Profile View"
                            className="w-full h-full max-w-[500px] max-h-[500px] object-cover rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

        </div>
    )
}