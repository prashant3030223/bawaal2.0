import { create } from 'zustand'

interface PremiumFeaturesState {
    // Reactions
    messageReactions: Record<string, any[]>
    setMessageReactions: (messageId: string, reactions: any[]) => void

    // Pinned Messages
    pinnedMessages: any[]
    setPinnedMessages: (messages: any[]) => void

    // Scheduled Messages
    scheduledMessages: any[]
    setScheduledMessages: (messages: any[]) => void

    // Drafts
    drafts: Record<string, string>
    setDraft: (conversationId: string, content: string) => void
    clearDraft: (conversationId: string) => void

    // Theme
    theme: 'light' | 'dark' | 'auto'
    setTheme: (theme: 'light' | 'dark' | 'auto') => void

    // Search
    searchQuery: string
    searchResults: any[]
    setSearchQuery: (query: string) => void
    setSearchResults: (results: any[]) => void

    // UI States
    showPinnedMessages: boolean
    showScheduledMessages: boolean
    showSearchBar: boolean
    setShowPinnedMessages: (show: boolean) => void
    setShowScheduledMessages: (show: boolean) => void
    setShowSearchBar: (show: boolean) => void
}

export const usePremiumFeaturesStore = create<PremiumFeaturesState>((set) => ({
    // Reactions
    messageReactions: {},
    setMessageReactions: (messageId, reactions) =>
        set((state) => ({
            messageReactions: { ...state.messageReactions, [messageId]: reactions }
        })),

    // Pinned Messages
    pinnedMessages: [],
    setPinnedMessages: (messages) => set({ pinnedMessages: messages }),

    // Scheduled Messages
    scheduledMessages: [],
    setScheduledMessages: (messages) => set({ scheduledMessages: messages }),

    // Drafts
    drafts: {},
    setDraft: (conversationId, content) =>
        set((state) => ({
            drafts: { ...state.drafts, [conversationId]: content }
        })),
    clearDraft: (conversationId) =>
        set((state) => {
            const newDrafts = { ...state.drafts }
            delete newDrafts[conversationId]
            return { drafts: newDrafts }
        }),

    // Theme
    theme: 'dark',
    setTheme: (theme) => set({ theme }),

    // Search
    searchQuery: '',
    searchResults: [],
    setSearchQuery: (query) => set({ searchQuery: query }),
    setSearchResults: (results) => set({ searchResults: results }),

    // UI States
    showPinnedMessages: false,
    showScheduledMessages: false,
    showSearchBar: false,
    setShowPinnedMessages: (show) => set({ showPinnedMessages: show }),
    setShowScheduledMessages: (show) => set({ showScheduledMessages: show }),
    setShowSearchBar: (show) => set({ showSearchBar: show }),
}))
