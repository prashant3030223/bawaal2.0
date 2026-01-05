import React, { useState, useEffect } from 'react'
import { X, User, Phone, Info, Image as ImageIcon, FileText, Music, LayoutGrid, Trash2, ShieldAlert, ArrowLeft, ChevronRight, Bell, Video, Mail, Trash, Search } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { chatService } from '@/api/supabase/chat'

interface ContactInfoSidebarProps {
    isOpen: boolean
    onClose: () => void
    conversation: any
    isBlocked: boolean
    onBlock: () => void
    onClearChat: () => void
}

export default function ContactInfoSidebar({
    isOpen,
    onClose,
    conversation,
    isBlocked,
    onBlock,
    onClearChat
}: ContactInfoSidebarProps) {
    const [activeTab, setActiveTab] = useState<'info' | 'media'>('info')
    const [sharedMedia, setSharedMedia] = useState<any[]>([])

    useEffect(() => {
        if (isOpen && conversation) {
            loadSharedMedia()
        }
    }, [isOpen, conversation])

    const loadSharedMedia = async () => {
        try {
            const media = await chatService.getSharedMedia(conversation.id)
            setSharedMedia(media)
        } catch (err) {
            console.error("Error loading shared media:", err)
        }
    }

    if (!conversation) return null

    const otherUser = conversation.other_user
    const isGroup = conversation.is_group

    return (
        <div className={cn(
            "fixed inset-y-0 right-0 w-full md:w-[420px] bg-[#080808]/95 backdrop-blur-[60px] border-l border-white/10 z-[100] transition-all duration-700 ease-in-out transform shadow-[0_0_100px_rgba(0,0,0,0.8)]",
            isOpen ? "translate-x-0" : "translate-x-full"
        )}>
            {/* Background Ambient Mesh */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] bg-emerald-500/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-cyan-500/10 blur-[100px] rounded-full"></div>
            </div>

            {/* Header */}
            <div className="h-[120px] px-8 flex items-center justify-between bg-white/[0.03] backdrop-blur-3xl border-b border-white/5 relative z-10">
                <div className="flex flex-col">
                    <h2 className="text-2xl font-black tracking-tighter text-white uppercase">{isGroup ? 'Group Info' : 'Contact Info'}</h2>
                    <span className="text-[10px] text-emerald-500 font-black tracking-[0.3em] uppercase mt-1">Details & Identity</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-3 rounded-2xl hover:bg-white/10 text-white/40 hover:text-white transition-all active:scale-95 border border-white/5"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <ScrollArea className="h-[calc(100vh-120px)] relative z-10">
                <div className="p-8 space-y-10">
                    {/* Hero Section */}
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                            <Avatar className="h-44 w-44 rounded-[40px] border-4 border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] transition-all duration-700 group-hover:scale-[1.05] group-hover:rotate-3">
                                <AvatarImage src={isGroup ? conversation.avatar_url : otherUser?.avatar_url} className="object-cover" />
                                <AvatarFallback className="bg-gradient-to-br from-zinc-800 to-black text-5xl font-thin text-white">
                                    {conversation.name?.[0] || 'C'}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-3xl font-black tracking-tight text-white">{conversation.name}</h3>
                            <p className="text-emerald-500 font-black tracking-[0.2em] text-[11px] uppercase opacity-70">
                                {isGroup ? `${conversation.member_count || 0} Members` : (otherUser?.phone_number || 'Omni-Identity Verified')}
                            </p>
                        </div>

                        <div className="flex items-center gap-4 pt-2">
                            <InfoAction icon={<Video className="w-5 h-5" />} label="Video" />
                            <InfoAction icon={<Phone className="w-5 h-5" />} label="Voice" />
                            <InfoAction icon={<Search className="w-5 h-5" />} label="Search" />
                        </div>
                    </div>

                    {/* About Section */}
                    {!isGroup && otherUser?.status && (
                        <div className="bg-white/[0.02] rounded-[32px] p-6 border border-white/5 space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="p-2.5 bg-emerald-500/10 rounded-xl">
                                    <Info className="w-4 h-4 text-emerald-500" />
                                </span>
                                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-white/20">System Status</span>
                            </div>
                            <p className="text-zinc-300 text-[15px] leading-relaxed font-medium pl-1">
                                {otherUser.status}
                            </p>
                        </div>
                    )}

                    {/* Tabs for Media */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-[11px] font-black tracking-[0.4em] uppercase text-white/30">Intelligence Data</h4>
                            <button
                                onClick={() => setActiveTab(activeTab === 'info' ? 'media' : 'info')}
                                className="text-[10px] font-black tracking-widest uppercase text-emerald-500 hover:text-emerald-400 transition-colors"
                            >
                                {activeTab === 'info' ? 'View Media' : 'Back to Info'}
                            </button>
                        </div>

                        {activeTab === 'media' ? (
                            <div className="grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-right-10 duration-500">
                                {sharedMedia.length === 0 ? (
                                    <div className="col-span-3 py-10 text-center text-white/20 text-xs font-black tracking-widest uppercase bg-white/[0.01] rounded-[32px] border border-dashed border-white/5">
                                        No Data Segments Found
                                    </div>
                                ) : (
                                    sharedMedia.map((m, i) => (
                                        <div key={i} className="aspect-square bg-white/5 rounded-2xl overflow-hidden border border-white/10 group cursor-pointer hover:border-emerald-500/50 transition-all duration-500">
                                            <img src={m.content} alt="media" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <SettingsItem icon={<Bell className="w-5 h-5" />} label="Mute Notifications" toggle />
                                <SettingsItem icon={<ShieldAlert className="w-5 h-5" />} label="Encryption Keys" value="Verified" />
                                <SettingsItem icon={<Clock className="w-5 h-5" />} label="Disappearing Messages" value="Off" />
                            </div>
                        )}
                    </div>

                    {/* Critical Actions */}
                    <div className="pt-6 space-y-4">
                        <button
                            onClick={onClearChat}
                            className="w-full h-16 rounded-[28px] bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 flex items-center px-6 gap-4 transition-all group active:scale-[0.98]"
                        >
                            <span className="p-2.5 bg-red-500/10 rounded-xl group-hover:bg-red-500/20 transition-colors">
                                <Trash2 className="w-5 h-5 text-red-400" />
                            </span>
                            <span className="text-sm font-black tracking-widest uppercase text-red-400 group-hover:text-red-300">Clear Terminal</span>
                            <ChevronRight className="w-4 h-4 ml-auto text-white/10 group-hover:text-red-400 transition-all" />
                        </button>

                        {!isGroup && (
                            <button
                                onClick={onBlock}
                                className="w-full h-16 rounded-[28px] bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 flex items-center px-6 gap-4 transition-all group active:scale-[0.98]"
                            >
                                <span className={"p-2.5 bg-red-500/10 rounded-xl group-hover:bg-red-500/20 transition-colors"}>
                                    <ShieldAlert className="w-5 h-5 text-red-500" />
                                </span>
                                <span className={"text-sm font-black tracking-widest uppercase text-red-500 group-hover:text-red-400"}>
                                    {isBlocked ? 'Release Auth' : 'Restrict Access'}
                                </span>
                                <ChevronRight className="w-4 h-4 ml-auto text-white/10 group-hover:text-red-500 transition-all" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-12 text-center text-white/10 text-[10px] font-black tracking-[0.5em] uppercase">
                    Core Intelligence Layer 2.0
                </div>
            </ScrollArea>
        </div>
    )
}

const InfoAction = ({ icon, label }: { icon: any, label: string }) => (
    <div className="flex flex-col items-center gap-2">
        <button className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all active:scale-90 group shadow-xl">
            {React.cloneElement(icon, { className: 'w-6 h-6 group-hover:scale-110 transition-transform' })}
        </button>
        <span className="text-[9px] font-black tracking-widest uppercase text-white/30">{label}</span>
    </div>
)

const SettingsItem = ({ icon, label, value, toggle }: { icon: any, label: string, value?: string, toggle?: boolean }) => (
    <div className="w-full h-16 rounded-[24px] bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 flex items-center px-5 gap-4 transition-all group cursor-pointer">
        <span className="p-2 h-9 w-9 flex items-center justify-center bg-white/5 rounded-xl text-white/30 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all">
            {React.cloneElement(icon, { className: 'w-4 h-4' })}
        </span>
        <span className="text-[13px] font-bold text-white/70 group-hover:text-white transition-colors">{label}</span>
        {value && <span className="ml-auto text-[11px] font-black tracking-widest uppercase text-white/20">{value}</span>}
        {toggle && (
            <div className="ml-auto w-10 h-5 bg-white/10 rounded-full p-1 relative transition-colors group-hover:bg-emerald-500/20">
                <div className="absolute right-1 top-1 bottom-1 w-3 h-3 bg-white/20 rounded-full"></div>
            </div>
        )}
        {!value && !toggle && <ChevronRight className="ml-auto w-4 h-4 text-white/10" />}
    </div>
)

const Clock = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
)
