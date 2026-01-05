import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import ChatPage from './pages/chat/ChatPage'
import { supabase } from '@/api/supabase/client'
import { useAuthStore } from '@/stores/auth.store'

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
    <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="h-full w-full"
    >
        {children}
    </motion.div>
)

function AppRoutes() {
    const user = useAuthStore((state) => state.user)
    const location = useLocation()

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/login" element={<PageWrapper>{user ? <Navigate to="/chat" replace /> : <LoginPage />}</PageWrapper>} />
                <Route path="/register" element={<PageWrapper>{user ? <Navigate to="/chat" replace /> : <RegisterPage />}</PageWrapper>} />
                <Route path="/forgot-password" element={<PageWrapper><ForgotPasswordPage /></PageWrapper>} />
                <Route path="/reset-password" element={<PageWrapper><ResetPasswordPage /></PageWrapper>} />
                <Route path="/chat" element={user ? <ChatPage /> : <Navigate to="/login" replace />} />
                <Route path="/" element={<Navigate to="/chat" replace />} />
                <Route path="*" element={<Navigate to="/chat" replace />} />
            </Routes>
        </AnimatePresence>
    )
}

function App() {
    const setUser = useAuthStore((state) => state.setUser)

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
        })

        // Listen for changes on auth state
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [setUser])

    return (
        <Router>
            <AppRoutes />
        </Router>
    )
}

export default App