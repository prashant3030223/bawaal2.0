import React, { useState, useRef } from "react"
import { ArrowLeft, Camera, Check, Pencil } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/stores/auth.store"
import { chatService } from "@/api/supabase/chat"
import { cn } from "@/lib/utils"

interface ProfileSidebarProps {
    isOpen: boolean
    onClose: () => void
}

export default function ProfileSidebar({ isOpen, onClose }: ProfileSidebarProps) {
    const { user, refreshUser } = useAuthStore()
    const [isEditingName, setIsEditingName] = useState(false)
    const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "")
    const [status, setStatus] = useState(user?.user_metadata?.status || "Hey there! I am using Bawaal.")
    const [isEditingStatus, setIsEditingStatus] = useState(false)
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Sync input states when user data is refreshed
    React.useEffect(() => {
        if (user?.user_metadata) {
            setFullName(user.user_metadata.full_name || "")
            setStatus(user.user_metadata.status || "Hey there! I am using Bawaal.")
        }
    }, [user?.user_metadata])

    const handleUpdateProfile = async (updates: any) => {
        if (!user) return
        setLoading(true)
        try {
            await chatService.updateUserProfile(user.id, updates)
            await refreshUser()
            setIsEditingName(false)
            setIsEditingStatus(false)
        } catch (err: any) {
            console.error("Error updating profile:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file && user) {
            // Check file size (limit to 2MB for example)
            if (file.size > 2 * 1024 * 1024) {
                alert("File size is too large. Please choose an image under 2MB.")
                return
            }

            setLoading(true)
            try {
                const avatarUrl = await chatService.uploadAvatar(user.id, file)
                await chatService.updateUserProfile(user.id, { avatar_url: avatarUrl })
                await refreshUser()
            } catch (err: any) {
                console.error("Error uploading photo:", err)
                alert("Failed to update profile photo. Please try again.")
            } finally {
                setLoading(false)
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }
            }
        }
    }

    return (
        <div className={cn(
            "absolute inset-0 bg-[#080808]/95 backdrop-blur-3xl z-[100] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] transform",
            isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            {/* GOAT Level Background Mesh */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/20 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/20 blur-[100px] rounded-full"></div>
            </div>

            {/* Header - Ultra Modern */}
            <div className="h-[120px] bg-white/[0.03] backdrop-blur-3xl flex items-end p-8 gap-8 text-white border-b border-white/5 relative z-10">
                <button onClick={onClose} className="mb-1 p-2.5 rounded-full hover:bg-white/10 transition-all active:scale-90 group">
                    <ArrowLeft className="w-6 h-6 text-emerald-500 group-hover:scale-110" />
                </button>
                <div className="flex flex-col mb-1">
                    <span className="text-2xl font-black tracking-tight uppercase">Profile</span>
                    <span className="text-[10px] text-white/30 font-black tracking-[0.2em] uppercase">Your Identity</span>
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col items-center py-10 px-8 gap-10 overflow-y-auto h-[calc(100%-120px)] relative z-10 scrollbar-none">
                {/* Avatar Section */}
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <Avatar className="h-[220px] w-[220px] border-4 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-all duration-700 relative z-10">
                        <AvatarImage src={user?.user_metadata?.avatar_url} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-zinc-800 to-black text-6xl font-light text-white/20">
                            {user?.user_metadata?.full_name?.[0] || "?"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-all duration-500 text-center px-4 z-20 backdrop-blur-sm">
                        <Camera className="w-10 h-10 mb-2 text-emerald-400" />
                        <span className="text-[10px] font-black tracking-widest uppercase">Update Photo</span>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </div>

                {/* Name Section */}
                <div className="w-full space-y-6">
                    <div className="space-y-2 group/field">
                        <span className="text-emerald-500/80 text-[11px] font-black tracking-widest uppercase ml-1">Display Name</span>
                        <div className="flex items-center justify-between group h-14 border-b border-white/5 focus-within:border-emerald-500/50 transition-all duration-500 bg-white/[0.02] rounded-2xl px-5 hover:bg-white/[0.05]">
                            {isEditingName ? (
                                <Input
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    autoFocus
                                    className="bg-transparent border-none text-white p-0 focus-visible:ring-0 text-lg font-bold tracking-tight"
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateProfile({ full_name: fullName })}
                                />
                            ) : (
                                <span className="text-white text-lg font-bold tracking-tight truncate">{user?.user_metadata?.full_name}</span>
                            )}
                            <button
                                onClick={() => isEditingName ? handleUpdateProfile({ full_name: fullName }) : setIsEditingName(true)}
                                className="p-2 rounded-xl hover:bg-emerald-500/10 text-white/30 hover:text-emerald-500 transition-all active:scale-90"
                            >
                                {isEditingName ? <Check className="w-6 h-6" /> : <Pencil className="w-5 h-5" />}
                            </button>
                        </div>
                        <p className="text-white/30 text-[11px] font-medium leading-relaxed px-1">
                            This is your official Bawaal profile name.
                        </p>
                    </div>

                    {/* Status Section */}
                    <div className="space-y-2 group/field">
                        <span className="text-emerald-500/80 text-[11px] font-black tracking-widest uppercase ml-1">About</span>
                        <div className="flex items-center justify-between group h-20 border-b border-white/5 focus-within:border-emerald-500/50 transition-all duration-500 bg-white/[0.02] rounded-2xl px-5 items-start py-4 hover:bg-white/[0.05]">
                            {isEditingStatus ? (
                                <textarea
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    autoFocus
                                    className="bg-transparent border-none text-white/80 p-0 focus:ring-0 text-[15px] font-medium resize-none flex-1 h-full scrollbar-none"
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleUpdateProfile({ status })}
                                />
                            ) : (
                                <span className="text-white/80 text-[15px] font-medium leading-relaxed line-clamp-2">{user?.user_metadata?.status || "Hey there! I am using Bawaal."}</span>
                            )}
                            <button
                                onClick={() => isEditingStatus ? handleUpdateProfile({ status }) : setIsEditingStatus(true)}
                                className="p-2 rounded-xl hover:bg-emerald-500/10 text-white/30 hover:text-emerald-500 transition-all active:scale-90 shrink-0"
                            >
                                {isEditingStatus ? <Check className="w-6 h-6" /> : <Pencil className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center transition-all animate-in fade-in">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin shadow-[0_0_20px_rgba(16,185,129,0.3)]"></div>
                        <span className="text-[10px] font-black tracking-[0.3em] uppercase text-emerald-500">Syncing...</span>
                    </div>
                </div>
            )}
        </div>
    )
}
