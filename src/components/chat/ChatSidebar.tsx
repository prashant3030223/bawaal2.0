import React, { useState, useMemo } from "react"
import { Search, MoreVertical, MessageSquare, Filter, User, Users, LogOut, Mic } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useChatStore } from "@/stores/chat.store"
import { useAuthStore } from "@/stores/auth.store"
import { chatService } from "@/api/supabase/chat"
import { ScrollArea } from "@/components/ui/scroll-area"
import ProfileSidebar from "./ProfileSidebar"
import NewGroupSidebar from "./NewGroupSidebar"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from "@/api/supabase/client"
import { cn } from "@/lib/utils"

export default function ChatSidebar() {
    const { conversations, activeConversation, setActiveConversation, setConversations, setViewingImage, onlineUsers, typingStatus } = useChatStore()
    const { user, signOut } = useAuthStore()
    const [searchQuery, setSearchQuery] = useState("")
    const [userSearchResults, setUserSearchResults] = useState<any[]>([])
    const [isNewChatOpen, setIsNewChatOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [isNewGroupOpen, setIsNewGroupOpen] = useState(false)
    const [sidebarSearch, setSidebarSearch] = useState("")

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

    const startNewChat = async (otherUser: any) => {
        if (!user) return
        try {
            const conv = await chatService.createConversation(user.id, otherUser.id)
            const updatedConvs = await chatService.getConversations(user.id)
            setConversations(updatedConvs)
            const fullConv = updatedConvs.find(c => c.id === conv.id)
            setActiveConversation(fullConv || conv)
            setIsNewChatOpen(false)
            setSearchQuery("")
            setUserSearchResults([])
        } catch (err: any) {
            console.error("Error starting new chat:", err)
        }
    }

    const handleGroupCreated = async (conv: any) => {
        if (!user) return
        const updatedConvs = await chatService.getConversations(user.id)
        setConversations(updatedConvs)
        const fullConv = updatedConvs.find(c => c.id === conv.id)
        setActiveConversation(fullConv || conv)
        setIsNewGroupOpen(false)
    }



    const filteredConversations = useMemo(() => {
        return conversations.filter(c =>
            c.name?.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
            c.last_message?.toLowerCase().includes(sidebarSearch.toLowerCase())
        )
    }, [conversations, sidebarSearch])

    return (
        <div className="w-full md:w-[420px] h-full flex flex-col bg-[#050505]/60 backdrop-blur-[50px] border-r border-white/5 z-30 relative overflow-hidden transition-all duration-500 shadow-2xl">
            {/* Ambient Pulse Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-emerald-500/10 blur-[100px] rounded-full animate-orb"></div>
                <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-cyan-500/10 blur-[100px] rounded-full animate-orb" style={{ animationDelay: '-10s' }}></div>
            </div>
            <ProfileSidebar isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
            <NewGroupSidebar isOpen={isNewGroupOpen} onClose={() => setIsNewGroupOpen(false)} onSuccess={handleGroupCreated} />

            {/* Header - Glass Strip */}
            <div className="h-[70px] px-5 py-3 flex items-center justify-between bg-white/5 backdrop-blur-md border-b border-white/5 shadow-sm z-20">
                <Avatar
                    className="h-11 w-11 cursor-pointer hover:opacity-80 transition-all hover:scale-105 ring-2 ring-transparent hover:ring-emerald-500/50"
                    onClick={() => setIsProfileOpen(true)}
                >
                    <AvatarImage src={user?.user_metadata?.avatar_url} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-cyan-500 text-white">
                        <User className="w-5 h-5" />
                    </AvatarFallback>
                </Avatar>

                <div className="flex items-center gap-5 text-zinc-400">
                    <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                        <DialogTrigger asChild>
                            <button className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-all duration-300 group relative">
                                <MessageSquare className="w-5 h-5" />
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                            </button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#111b21]/95 backdrop-blur-xl border border-white/10 text-white shadow-2xl rounded-2xl w-[90%] max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-light tracking-wide text-white/90 pb-2 border-b border-white/10">New Chat</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-3 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                                    <Input
                                        placeholder="Search name or number..."
                                        className="bg-black/30 border border-white/5 text-white pl-11 h-11 rounded-xl focus-visible:ring-1 focus-visible:ring-emerald-500/50 transition-all"
                                        value={searchQuery}
                                        onChange={(e) => handleSearchUsers(e.target.value)}
                                    />
                                </div>
                                <ScrollArea className="h-[400px] pr-2">
                                    <div className="space-y-2">
                                        {userSearchResults.map((u) => (
                                            <button
                                                key={u.id}
                                                onClick={() => startNewChat(u)}
                                                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all duration-200 text-left group border border-transparent hover:border-white/5"
                                            >
                                                <div className="relative">
                                                    <Avatar
                                                        className="h-12 w-12 border border-white/10 group-hover:border-emerald-500/30 transition-colors cursor-pointer hover:scale-105"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setViewingImage(u.avatar_url || null)
                                                        }}
                                                    >
                                                        <AvatarImage src={u.avatar_url} className="object-cover" />
                                                        <AvatarFallback className="bg-white/5 text-zinc-400">{u.full_name?.[0] || "?"}</AvatarFallback>
                                                    </Avatar>
                                                    {onlineUsers.has(String(u.id)) && (
                                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#111b21] rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col flex-1 pb-1">
                                                    <span className="text-white font-medium group-hover:text-emerald-400 transition-colors">{u.full_name}</span>
                                                    <span className="text-xs text-zinc-500 line-clamp-1 group-hover:text-zinc-400">
                                                        {u.status || "Hey there! I am using Bawaal."}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-all duration-300">
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1a2328]/95 backdrop-blur-xl border border-white/10 text-white w-56 py-2 rounded-xl shadow-2xl mr-2">
                            <DropdownMenuItem
                                onClick={() => setIsNewGroupOpen(true)}
                                className="px-4 py-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 text-white/90 focus:bg-white/5 focus:text-white"
                            >
                                <Users className="w-4 h-4 text-emerald-400" />
                                <span>New group</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setIsProfileOpen(true)}
                                className="px-4 py-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 text-white/90 focus:bg-white/5 focus:text-white"
                            >
                                <User className="w-4 h-4" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={signOut}
                                className="px-4 py-3 hover:bg-red-500/10 cursor-pointer flex items-center gap-3 text-red-400 focus:bg-red-500/10 focus:text-red-400"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Search - Modern Pill */}
            <div className="px-5 py-4">
                <div className="relative group">
                    <div className="absolute inset-0 bg-emerald-500/10 rounded-xl blur-lg transition-opacity opacity-0 group-focus-within:opacity-100"></div>
                    <div className="relative flex items-center bg-black/30 border border-white/5 rounded-xl h-11 px-4 focus-within:ring-1 focus-within:ring-emerald-500/50 focus-within:border-emerald-500/50 transition-all">
                        <Search className="w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors mr-3" />
                        <Input
                            placeholder="Search or start new chat"
                            value={sidebarSearch}
                            onChange={(e) => setSidebarSearch(e.target.value)}
                            className="bg-transparent border-none text-white h-full p-0 placeholder:text-zinc-600 focus-visible:ring-0 text-sm"
                        />
                        <Filter className="w-4 h-4 text-zinc-600 hover:text-white cursor-pointer transition-colors ml-2" />
                    </div>
                </div>
            </div>

            {/* Chats List - Floating Cards */}
            <ScrollArea className="flex-1 px-3 pb-2">
                <div className="flex flex-col gap-1">
                    {filteredConversations.length === 0 ? (
                        <div className="p-10 text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500 opacity-50">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center relative">
                                <div className="absolute inset-0 bg-emerald-500/10 blur-xl rounded-full"></div>
                                <MessageSquare className="w-8 h-8 text-zinc-500" />
                            </div>
                            <p className="text-zinc-500 text-sm tracking-wide">Start a new conversation</p>
                        </div>
                    ) : (
                        filteredConversations.map((conv) => (
                            <ConversationItem
                                key={conv.id}
                                conv={conv}
                                activeConversationId={activeConversation?.id}
                                onlineUsers={onlineUsers}
                                typingStatus={typingStatus[conv.id]}
                                onClick={() => setActiveConversation(conv)}
                                onViewAvatar={(url: string | null) => setViewingImage(url)}
                            />
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}

const ConversationItem = React.memo(({ conv, activeConversationId, onlineUsers, typingStatus, onClick, onViewAvatar }: any) => {
    const isActive = activeConversationId === conv.id
    const isOnline = !conv.is_group && conv.other_user && onlineUsers.has(String(conv.other_user.id))

    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center gap-4 px-5 py-4 cursor-pointer rounded-2xl transition-all duration-500 border border-transparent group relative mx-2 mb-1",
                isActive
                    ? "bg-white/10 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md"
                    : "hover:bg-white/[0.05] hover:translate-x-1"
            )}
        >
            {/* Active Indicator - Glow Standard */}
            {isActive && (
                <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 h-8 w-[4px] bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)] z-10"></div>
            )}

            <div className="relative">
                <Avatar
                    className="h-14 w-14 border-2 border-white/5 shadow-xl group-hover:scale-105 transition-all duration-500 cursor-pointer overflow-hidden"
                    onClick={(e) => {
                        e.stopPropagation()
                        onViewAvatar(conv.other_user?.avatar_url || conv.avatar_url || null)
                    }}
                >
                    <AvatarImage src={conv.other_user?.avatar_url || conv.avatar_url} className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    <AvatarFallback className="bg-gradient-to-br from-zinc-800 to-black text-white text-lg font-light">
                        {conv.is_group ? <Users className="w-6 h-6" /> : (conv.name?.[0] || "C")}
                    </AvatarFallback>
                </Avatar>
                {isOnline && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-[3px] border-[#0c1317] rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                )}
            </div>

            <div className="flex-1 flex flex-col justify-center min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                        "font-semibold text-[15px] truncate mr-2 transition-colors tracking-tight",
                        isActive ? "text-white" : "text-zinc-100 group-hover:text-emerald-400"
                    )}>{conv.name}</span>
                    <span className={cn(
                        "text-[10px] font-medium whitespace-nowrap transition-colors tracking-widest uppercase",
                        conv.unread_count > 0 ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-400"
                    )}>
                        {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <p className={cn(
                        "text-[13px] truncate flex-1 transition-colors leading-relaxed",
                        typingStatus ? "text-emerald-400 font-bold" : (isActive ? "text-white/70" : "text-zinc-400/80 group-hover:text-zinc-300")
                    )}>
                        {typingStatus ? (
                            <span className="flex items-center gap-1"><span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce"></span>typing...</span>
                        ) : (
                            conv.last_message?.includes('.webm') || conv.last_message?.includes('.mp3')
                                ? <span className="flex items-center gap-1 text-emerald-500/80"><Mic className="w-3.5 h-3.5" /> Voice message</span>
                                : conv.last_message || <span className="text-zinc-600 italic">No messages yet</span>
                        )}
                    </p>
                    {conv.unread_count > 0 && (
                        <div className="ml-2 bg-emerald-500 text-white text-[10px] font-black min-w-[20px] h-[20px] rounded-full flex items-center justify-center px-1.5 shadow-[0_4px_12px_rgba(16,185,129,0.4)] animate-in zoom-in duration-500">
                            {conv.unread_count}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
})
