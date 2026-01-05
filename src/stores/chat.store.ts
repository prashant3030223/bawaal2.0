import { create } from 'zustand'

export interface Message {
    id: string
    conversation_id: string
    sender_id: string
    content: string
    type: 'text' | 'image' | 'video' | 'file' | 'call'
    created_at: string
    is_read: boolean
    is_deleted?: boolean
    deleted_for_all?: boolean
    deleted_by?: string[] // For "Delete for me"
    is_view_once?: boolean
    viewed_by?: string[]
}

export interface Conversation {
    id: string
    name: string | null
    is_group: boolean
    last_message: string | null
    last_message_at: string | null
    unread_count: number
    avatar_url?: string
    other_user?: {
        id: string
        full_name: string
        avatar_url: string
        status: string
    }
}

export interface CallSession {
    id: string
    caller_id: string
    receiver_id: string
    type: 'voice' | 'video'
    status: 'ringing' | 'connected' | 'ended' | 'rejected'
    caller_name?: string
    caller_avatar?: string
    receiver_name?: string
    receiver_avatar?: string
}

interface ChatState {
    conversations: Conversation[]
    activeConversation: Conversation | null
    messages: Message[]
    activeCall: CallSession | null
    incomingCall: CallSession | null
    setConversations: (conversations: Conversation[]) => void
    setActiveConversation: (conversation: Conversation | null) => void
    setMessages: (messages: Message[]) => void
    addMessage: (message: Message) => void
    updateMessage: (id: string, updates: Partial<Message>) => void
    markAllAsRead: () => void
    incrementUnread: (conversationId: string) => void
    setCall: (call: CallSession | null) => void
    setIncomingCall: (call: CallSession | null) => void
    removeConversation: (id: string) => void
    onlineUsers: Set<string>
    setOnlineUsers: (userIds: string[]) => void
    viewingImage: string | null
    setViewingImage: (url: string | null) => void
    updateConversation: (id: string, updates: Partial<Conversation>) => void
    updateLastMessage: (conversationId: string, message: string, time: string) => void
    blockedUsers: string[]
    setBlockedUsers: (userIds: string[]) => void
    typingStatus: Record<string, boolean>
    setTypingStatus: (conversationId: string, isTyping: boolean) => void
    isContactInfoOpen: boolean
    setContactInfoOpen: (isOpen: boolean) => void
}

export const useChatStore = create<ChatState>((set) => ({
    conversations: [],
    activeConversation: null,
    messages: [],
    activeCall: null,
    incomingCall: null,
    blockedUsers: [],
    isContactInfoOpen: false,
    setContactInfoOpen: (isOpen) => set({ isContactInfoOpen: isOpen }),
    setBlockedUsers: (userIds) => set({ blockedUsers: userIds }),
    setConversations: (conversations) => set({ conversations }),
    setActiveConversation: (conversation) => set((state) => {
        const updatedConvs = state.conversations.map(c =>
            c.id === conversation?.id ? { ...c, unread_count: 0 } : c
        )
        return {
            activeConversation: conversation,
            conversations: updatedConvs
        }
    }),
    setMessages: (messages) => set({ messages }),
    addMessage: (message) => set((state) => ({
        messages: state.messages.find(m => m.id === message.id)
            ? state.messages
            : [...state.messages, message]
    })),
    updateMessage: (id, updates) => set((state) => ({
        messages: state.messages.map(m => m.id === id ? { ...m, ...updates } : m)
    })),
    markAllAsRead: () => set((state) => ({
        messages: state.messages.map(m => ({ ...m, is_read: true }))
    })),
    incrementUnread: (conversationId) => set((state) => ({
        conversations: state.conversations.map(c =>
            c.id === conversationId ? { ...c, unread_count: (c.unread_count || 0) + 1 } : c
        )
    })),
    setCall: (call) => set({ activeCall: call }),
    setIncomingCall: (call) => set({ incomingCall: call }),
    updateConversation: (id, updates) => set((state) => ({
        conversations: state.conversations.map(c => c.id === id ? { ...c, ...updates } : c)
    })),
    updateLastMessage: (conversationId, message, time) => set((state) => {
        const conversations = [...state.conversations]
        const updatedIndex = conversations.findIndex(c => c.id === conversationId)
        if (updatedIndex > -1) {
            conversations[updatedIndex] = { ...conversations[updatedIndex], last_message: message, last_message_at: time }
            const [updated] = conversations.splice(updatedIndex, 1)
            conversations.unshift(updated)
        }
        return { conversations }
    }),
    removeConversation: (id) => set((state) => ({
        conversations: state.conversations.filter(c => c.id !== id),
        activeConversation: state.activeConversation?.id === id ? null : state.activeConversation
    })),
    onlineUsers: new Set<string>(),
    setOnlineUsers: (userIds) => set({ onlineUsers: new Set(userIds) }),
    viewingImage: null,
    setViewingImage: (url) => set({ viewingImage: url }),
    typingStatus: {},
    setTypingStatus: (conversationId, isTyping) => set((state) => ({
        typingStatus: { ...state.typingStatus, [conversationId]: isTyping }
    }))
}))