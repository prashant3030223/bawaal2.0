import React, { useState } from "react"
import { ArrowLeft, ArrowRight, Camera, Search, User, X, Check } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuthStore } from "@/stores/auth.store"
import { chatService } from "@/api/supabase/chat"
import { cn } from "@/lib/utils"

interface NewGroupSidebarProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: (conversation: any) => void
}

export default function NewGroupSidebar({ isOpen, onClose, onSuccess }: NewGroupSidebarProps) {
    const { user } = useAuthStore()
    const [step, setStep] = useState(1) // 1: Select Members, 2: Group Info
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [selectedMembers, setSelectedMembers] = useState<any[]>([])
    const [groupName, setGroupName] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSearch = async (query: string) => {
        setSearchQuery(query)
        if (query.length < 2 || !user) {
            setSearchResults([])
            return
        }
        try {
            const results = await chatService.searchUsers(query, user.id)
            setSearchResults(results)
        } catch (err) {
            console.error(err)
        }
    }

    const toggleMember = (u: any) => {
        if (selectedMembers.find(m => m.id === u.id)) {
            setSelectedMembers(selectedMembers.filter(m => m.id !== u.id))
        } else {
            setSelectedMembers([...selectedMembers, u])
        }
    }

    const handleCreateGroup = async () => {
        if (!user || !groupName.trim() || selectedMembers.length === 0) return
        setLoading(true)
        try {
            const memberIds = selectedMembers.map(m => m.id)
            const conv = await chatService.createGroup(user.id, groupName, memberIds)
            onSuccess(conv)
            handleClose()
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setStep(1)
        setSearchQuery("")
        setSearchResults([])
        setSelectedMembers([])
        setGroupName("")
        onClose()
    }

    return (
        <div className={cn(
            "absolute inset-0 bg-[#080808]/95 backdrop-blur-3xl z-[100] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] transform",
            isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            {/* GOAT Level Background Mesh */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/20 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/20 blur-[100px] rounded-full"></div>
            </div>

            {/* Header - Ultra Modern */}
            <div className="h-[130px] bg-white/[0.03] backdrop-blur-3xl flex items-end p-8 gap-8 text-white border-b border-white/5 relative z-10">
                <button onClick={step === 1 ? handleClose : () => setStep(1)} className="mb-1 p-2.5 rounded-full hover:bg-white/10 transition-all active:scale-90 group">
                    <ArrowLeft className="w-6 h-6 text-emerald-500 group-hover:scale-110" />
                </button>
                <div className="flex flex-col mb-1 flex-1">
                    <span className="text-2xl font-black tracking-tight uppercase">New Group</span>
                    {step === 1 && (
                        <span className="text-[10px] text-white/30 font-black tracking-[0.2em] uppercase mt-1">
                            {selectedMembers.length > 0 ? `${selectedMembers.length} Members Chosen` : "Add Participants"}
                        </span>
                    )}
                    {step === 2 && (
                        <span className="text-[10px] text-white/30 font-black tracking-[0.2em] uppercase mt-1">Finalize Group Details</span>
                    )}
                </div>
            </div>

            {step === 1 ? (
                <div className="flex flex-col h-[calc(100%-130px)] relative z-10 overflow-hidden">
                    {/* Selected Members Chips */}
                    <div className={cn(
                        "transition-all duration-500 overflow-hidden",
                        selectedMembers.length > 0 ? "max-h-40 opacity-100 p-6 border-b border-white/5 bg-white/[0.02]" : "max-h-0 opacity-0"
                    )}>
                        <ScrollArea className="w-full">
                            <div className="flex flex-wrap gap-3">
                                {selectedMembers.map(m => (
                                    <div key={m.id} className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl pl-1.5 pr-3 py-1.5 flex items-center gap-2 group/chip animate-in zoom-in-95 duration-300">
                                        <Avatar className="h-7 w-7 border border-emerald-500/20 shadow-lg">
                                            <AvatarImage src={m.avatar_url} />
                                            <AvatarFallback className="bg-emerald-500 text-[10px] font-bold">{m.full_name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs font-bold text-emerald-50 tracking-tight">{m.full_name.split(' ')[0]}</span>
                                        <button onClick={() => toggleMember(m)} className="hover:bg-red-500/20 rounded-lg p-0.5 transition-colors">
                                            <X className="w-3.5 h-3.5 text-emerald-500 group-hover/chip:text-red-400" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Search Field */}
                    <div className="p-6">
                        <div className="relative group/search">
                            <div className="absolute inset-0 bg-white/[0.02] rounded-[28px] group-hover/search:bg-white/[0.05] transition-all duration-500 border border-white/5 group-focus-within/search:border-emerald-500/30 group-focus-within/search:ring-4 group-focus-within/search:ring-emerald-500/5"></div>
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within/search:text-emerald-500 transition-colors z-10" />
                            <Input
                                placeholder="Search friends to add..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="bg-transparent border-none text-white pl-16 h-14 text-[15px] font-medium tracking-tight focus-visible:ring-0 placeholder:text-white/10 relative z-10"
                            />
                        </div>
                    </div>

                    {/* Results */}
                    <ScrollArea className="flex-1 px-2">
                        <div className="py-2 space-y-1">
                            {searchResults.map(u => {
                                const isSelected = !!selectedMembers.find(m => m.id === u.id);
                                return (
                                    <button
                                        key={u.id}
                                        onClick={() => toggleMember(u)}
                                        className={cn(
                                            "w-full flex items-center gap-5 px-6 py-4 rounded-[28px] transition-all duration-500 text-left relative overflow-hidden group/item",
                                            isSelected ? "bg-emerald-500/10" : "hover:bg-white/[0.03]"
                                        )}
                                    >
                                        <div className="relative">
                                            <Avatar className="h-14 w-14 border-2 border-white/10 shadow-xl group-hover/item:scale-105 transition-transform duration-500">
                                                <AvatarImage src={u.avatar_url} className="object-cover" />
                                                <AvatarFallback className="bg-zinc-800 text-white/50">{u.full_name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            {isSelected && (
                                                <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-[3px] border-[#080808] z-20 shadow-lg animate-in zoom-in-50">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col min-w-0">
                                            <span className={cn("font-bold text-lg tracking-tight transition-colors", isSelected ? "text-emerald-400" : "text-white")}>{u.full_name}</span>
                                            <span className="text-xs text-white/30 font-medium truncate mt-1">{u.status || "Hey there! Lets connect."}</span>
                                        </div>
                                        <div className={cn(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                                            isSelected ? "bg-emerald-500 border-emerald-500 scale-110 shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "border-white/10 group-hover/item:border-emerald-500/50"
                                        )}>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </ScrollArea>

                    {/* Next Button - Floating Action */}
                    <div className={cn(
                        "absolute bottom-10 right-10 transition-all duration-700 transform",
                        selectedMembers.length > 0 ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
                    )}>
                        <button
                            onClick={() => setStep(2)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-white w-16 h-16 rounded-[24px] flex items-center justify-center shadow-[0_20px_50px_rgba(16,185,129,0.4)] transition-all hover:scale-110 active:scale-90 group/btn"
                        >
                            <ArrowRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center py-10 px-8 gap-12 overflow-y-auto h-[calc(100%-130px)] relative z-10 scrollbar-none">
                    {/* Group Icon */}
                    <div className="relative group cursor-pointer">
                        <div className="absolute -inset-6 bg-emerald-500/20 rounded-full blur-[40px] opacity-20 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <div className="relative w-[220px] h-[220px] bg-white/[0.03] border-4 border-dashed border-white/10 rounded-full flex flex-col items-center justify-center text-white/20 group-hover:bg-white/[0.05] group-hover:border-emerald-500/50 transition-all duration-700 shadow-2xl">
                            <Camera className="w-12 h-12 mb-3 text-emerald-500/50 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-black tracking-widest uppercase text-center px-6">Group Avatar</span>
                        </div>
                    </div>

                    {/* Group Name */}
                    <div className="w-full space-y-3 group/field">
                        <span className="text-emerald-500/80 text-[11px] font-black tracking-widest uppercase ml-1">Group Title</span>
                        <div className="border-b border-white/5 focus-within:border-emerald-500 transition-all duration-700 bg-white/[0.02] rounded-2xl px-6 py-4 hover:bg-white/[0.05]">
                            <Input
                                placeholder="Give this group a name..."
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                autoFocus
                                className="bg-transparent border-none text-white p-0 focus-visible:ring-0 text-[20px] font-black tracking-tight h-10 placeholder:text-white/10"
                            />
                        </div>
                        <p className="text-white/20 text-[11px] font-medium leading-relaxed px-1">
                            This title will be visible to all {selectedMembers.length + 1} participants.
                        </p>
                    </div>

                    {/* Finish Button */}
                    <div className="pt-8">
                        <button
                            onClick={handleCreateGroup}
                            disabled={!groupName.trim() || loading}
                            className={cn(
                                "h-16 px-12 rounded-[28px] flex items-center gap-4 transition-all duration-500 font-black tracking-widest uppercase shadow-2xl group/final",
                                (!groupName.trim() || loading)
                                    ? "bg-white/5 text-white/10 scale-95 cursor-not-allowed"
                                    : "bg-emerald-500 text-white hover:bg-emerald-400 hover:scale-105 active:scale-95 shadow-emerald-500/40"
                            )}
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Create Group</span>
                                    <Check className="w-6 h-6 group-hover/final:scale-125 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
