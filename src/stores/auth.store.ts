import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/api/supabase/client'
import { chatService } from '@/api/supabase/chat'

interface AuthState {
    user: User | null
    loading: boolean
    setUser: (user: User | null) => void
    signOut: () => Promise<void>
    updateUser: (updates: Partial<User>) => void
    refreshUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    loading: true,
    setUser: (user) => set({ user, loading: false }),
    signOut: async () => {
        // Optimistic update for instant UI feedback
        set({ user: null, loading: false })

        try {
            // Run cleanup tasks in parallel without blocking UI
            // We don't await these because the user has already "logged out" locally
            await Promise.allSettled([
                chatService.leaveGlobalPresence(),
                supabase.auth.signOut()
            ])

            // Clear any local storage manually if needed (Supabase usually handles this)
            localStorage.removeItem('sb-access-token')
            localStorage.removeItem('sb-refresh-token')
        } catch (error) {
            console.error("Error during background sign out:", error)
        }
    },
    updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
    })),
    refreshUser: async () => {
        // Force refresh user data from server
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) console.error("Refresh User Error:", error)
        set({ user, loading: false })
    }
}))