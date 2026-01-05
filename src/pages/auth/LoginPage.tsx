import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Lock, Mail, ArrowRight } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "@/api/supabase/client"
import { useAuthStore } from "@/stores/auth.store"
import { GoogleLogin, CredentialResponse } from "@react-oauth/google"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()
    const setUser = useAuthStore((state) => state.setUser)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (signInError) throw signInError

            if (data.user) {
                setUser(data.user)
                navigate("/chat")
            }
        } catch (err: any) {
            setError(err.message || "Invalid login credentials")
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLoginSuccess = async (credentialResponse: CredentialResponse) => {
        setGoogleLoading(true)
        setError(null)
        try {
            if (!credentialResponse.credential) {
                throw new Error("No credential received from Google")
            }

            const { data, error: signInError } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: credentialResponse.credential,
            })

            if (signInError) throw signInError

            if (data.user) {
                const { user } = data

                // Robustly ensure user exists in public 'users' table
                const { error: userError } = await supabase.from('users').upsert({
                    id: user.id,
                    email: user.email,
                    display_name: user.user_metadata.full_name || user.user_metadata.name || user.email?.split('@')[0],
                    avatar_url: user.user_metadata.avatar_url || user.user_metadata.picture,
                    status: 'Hey there! I am using Bawaal.',
                    last_seen: new Date().toISOString(),
                }, { onConflict: 'id', ignoreDuplicates: true })

                if (userError) console.error("Error creating public user record:", userError)

                // Ensure default profile settings exist
                const { error: profileError } = await supabase.from('profiles').upsert({
                    user_id: user.id,
                    bio: null,
                    status_text: null,
                    theme_preference: 'system',
                    notification_settings: {
                        message_notifications: true,
                        call_notifications: true,
                        group_notifications: true,
                        sound_enabled: true,
                        vibration_enabled: true,
                    },
                    privacy_settings: {
                        last_seen: 'everyone',
                        profile_photo: 'everyone',
                        status: 'everyone',
                        read_receipts: true,
                    },
                }, { onConflict: 'user_id', ignoreDuplicates: true })

                if (profileError) console.error("Error creating profile settings:", profileError)

                setUser(data.user)
                navigate("/chat")
            }
        } catch (err: any) {
            console.error("Google login error:", err)
            setError(err.message || "Failed to login with Google")
        } finally {
            setGoogleLoading(false)
        }
    }

    const handleGoogleLoginError = () => {
        setError("Google Login Failed")
        setGoogleLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-mesh p-4 font-sans relative overflow-hidden text-white">
            {/* Ambient Background Pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] grayscale invert" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>

            {/* Glowing Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

            <Card className="w-full max-w-[440px] bg-white/[0.03] backdrop-blur-[40px] border border-white/10 text-white shadow-[0_50px_100px_rgba(0,0,0,0.5)] relative z-10 overflow-hidden group hover:border-white/20 transition-all duration-700 rounded-[40px]">
                {/* Refined Gradient Top Border */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500 opacity-50"></div>

                <CardHeader className="space-y-8 flex flex-col items-center pt-14 pb-4">
                    <div className="relative group/logo">
                        <div className="absolute -inset-8 bg-emerald-500/20 rounded-full blur-[40px] group-hover/logo:bg-emerald-500/30 transition-all duration-700 group-hover/logo:scale-125"></div>
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-[30px] rotate-3 flex items-center justify-center shadow-[0_20px_40px_rgba(16,185,129,0.3)] relative z-10 group-hover/logo:rotate-[12deg] transition-all duration-700">
                            <MessageSquare className="w-12 h-12 text-white fill-white drop-shadow-2xl" />
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <CardTitle className="text-5xl font-black tracking-tighter text-white drop-shadow-2xl uppercase">Bawaal</CardTitle>
                        <div className="flex items-center justify-center gap-3">
                            <span className="h-px w-8 bg-white/10"></span>
                            <CardDescription className="text-white/30 text-[10px] font-black tracking-[0.3em] uppercase">
                                Experience Infinity
                            </CardDescription>
                            <span className="h-px w-8 bg-white/10"></span>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-8 pt-8 px-10">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold tracking-wider uppercase p-4 rounded-2xl text-center backdrop-blur-md animate-in slide-in-from-top-4 duration-500">
                                {error}
                            </div>
                        )}
                        <div className="space-y-4">
                            <div className="relative group/input">
                                <div className="absolute inset-0 bg-white/[0.02] rounded-2xl group-focus-within/input:bg-white/[0.05] border border-white/5 transition-all duration-500 group-focus-within/input:ring-4 group-focus-within/input:ring-emerald-500/5 group-focus-within/input:border-emerald-500/30"></div>
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within/input:text-emerald-400 transition-colors z-10" />
                                <Input
                                    type="email"
                                    placeholder="your@email.com"
                                    className="bg-transparent border-none text-white pl-14 h-14 rounded-2xl focus-visible:ring-0 transition-all placeholder:text-white/10 font-medium relative z-10"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-3">
                                <div className="relative group/input">
                                    <div className="absolute inset-0 bg-white/[0.02] rounded-2xl group-focus-within/input:bg-white/[0.05] border border-white/5 transition-all duration-500 group-focus-within/input:ring-4 group-focus-within/input:ring-emerald-500/5 group-focus-within/input:border-emerald-500/30"></div>
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within/input:text-emerald-400 transition-colors z-10" />
                                    <Input
                                        type="password"
                                        placeholder="Your Password"
                                        className="bg-transparent border-none text-white pl-14 h-14 rounded-2xl focus-visible:ring-0 transition-all placeholder:text-white/10 font-medium relative z-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="flex justify-end px-1">
                                    <Link to="/forgot-password" title="Forgot Password" className="text-[11px] font-black tracking-widest uppercase text-emerald-500/80 hover:text-emerald-400 transition-all">
                                        Forgot Key?
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black tracking-[0.2em] uppercase h-14 rounded-2xl transition-all duration-500 transform hover:scale-[1.03] active:scale-[0.97] shadow-[0_15px_30px_rgba(16,185,129,0.3)] border border-white/10"
                            disabled={loading || googleLoading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                    <span>Syncing...</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-3">
                                    Authorize <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </Button>
                    </form>

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/5"></span>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-[#080808] px-6 text-[10px] font-black tracking-[0.3em] uppercase text-white/20">Omni Sign-In</span>
                        </div>
                    </div>

                    <div className="flex justify-center w-full pb-6 transition-all duration-700 hover:scale-[1.05]">
                        <GoogleLogin
                            onSuccess={handleGoogleLoginSuccess}
                            onError={handleGoogleLoginError}
                            theme="filled_black"
                            shape="pill"
                            width="100%"
                            text="continue_with"
                        />
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4 pt-6 pb-12 bg-white/[0.02] border-t border-white/5">
                    <p className="text-xs font-bold text-white/20 tracking-tight">
                        New to the Future?{" "}
                        <Link to="/register" className="text-emerald-500 font-black tracking-widest uppercase hover:text-emerald-400 hover:underline decoration-emerald-500/30 underline-offset-8 transition-all">
                            Initialize
                        </Link>
                    </p>
                </CardFooter>
            </Card>

            <div className="absolute bottom-10 text-white/10 text-[11px] font-black tracking-[0.5em] uppercase pointer-events-none">
                © 2026 BAWAAL // ENTER CORE
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(1.2); }
                }
                .animate-pulse-slow { animation: pulse-slow 12s infinite ease-in-out; }
            `}} />
        </div>
    )
}