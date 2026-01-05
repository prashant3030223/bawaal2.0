import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useChatStore } from '@/stores/chat.store';
import { useContactsStore } from '@/stores/contacts.store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Users,
  Phone,
  Video,
  Search,
  Calendar,
  Image as ImageIcon,
  File,
  Music,
  Plus,
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Settings,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { conversations, onlineUsers, setConversations } = useChatStore();
  const { contacts, favorites } = useContactsStore();

  useEffect(() => {
    // If not logged in, redirect to login
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-mesh text-white perspective-1000 overflow-hidden relative">
      {/* Dynamic Background Kinetic Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] bg-emerald-500/10 blur-[120px] rounded-full animate-orb"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[150px] rounded-full animate-orb" style={{ animationDelay: '-5s' }}></div>
        <div className="absolute top-[40%] right-[30%] w-[25%] h-[25%] bg-purple-500/10 blur-[100px] rounded-full animate-orb" style={{ animationDelay: '-10s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10 md:py-16">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 animate-in fade-in slide-in-from-top-10 duration-1000">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black tracking-[0.3em] uppercase text-emerald-400">System Verified</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight">
              Welcome to the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400">Bawaal Intelligence</span> Hub
            </h1>
            <p className="text-white/40 max-w-xl text-lg font-medium leading-relaxed">
              Your decentralized neural network for seamless communication. <br className="hidden md:block" />
              Secure. High-Fidelity. Limitless.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[32px] flex items-center gap-5 transition-all hover:bg-white/10 group cursor-pointer" onClick={() => navigate('/chat')}>
              <div className="relative">
                <Avatar className="h-16 w-16 border-2 border-emerald-500/30 group-hover:scale-110 transition-transform duration-500">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-zinc-800 text-white font-bold">{user?.user_metadata?.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-[#080808] rounded-full"></div>
              </div>
              <div className="flex flex-col pr-4">
                <span className="font-black tracking-tight text-xl">{user?.user_metadata?.full_name || 'Agent'}</span>
                <span className="text-[10px] font-black tracking-widest uppercase text-emerald-500">Core Operator</span>
              </div>
            </div>
          </div>
        </header>

        {/* Intelligence Grids */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <StatCard icon={<MessageSquare />} label="Active Protocols" value={conversations.length} color="emerald" />
          <StatCard icon={<Users />} label="Neural Connections" value={contacts.length} color="cyan" />
          <StatCard icon={<Globe />} label="Global Presence" value={onlineUsers.size} color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content - Conversations */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex flex-col">
                <h2 className="text-2xl font-black tracking-tighter uppercase">Recent Transmissions</h2>
                <span className="text-[10px] text-white/20 font-black tracking-[0.3em] uppercase">Encrypted Data Stream</span>
              </div>
              <button
                onClick={() => navigate('/chat')}
                className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all active:scale-95 group"
              >
                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {conversations.length === 0 ? (
                <div className="h-[400px] bg-white/[0.02] border border-dashed border-white/10 rounded-[40px] flex flex-col items-center justify-center text-center p-10 animate-in fade-in zoom-in-95 duration-700">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-6">
                    <Zap className="w-10 h-10 text-emerald-500 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-black tracking-tight mb-2 uppercase">Protocol Empty</h3>
                  <p className="text-white/30 max-w-xs text-sm">Initiate your first communication link to begin data synchronisation.</p>
                </div>
              ) : (
                conversations.slice(0, 5).map((conv: any, i) => (
                  <div
                    key={conv.id}
                    onClick={() => navigate('/chat')}
                    className="goat-card-hover group bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-[32px] p-6 flex items-center gap-6 cursor-pointer animate-in fade-in slide-in-from-left duration-700"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="relative">
                      <Avatar className="h-16 w-16 border-2 border-white/10 group-hover:border-emerald-500/30 transition-all duration-500">
                        <AvatarImage src={conv.other_user?.avatar_url || conv.avatar_url} />
                        <AvatarFallback className="bg-zinc-800">{conv.name?.[0]}</AvatarFallback>
                      </Avatar>
                      {onlineUsers.has(conv.other_user?.id) && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#080808] animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xl font-black tracking-tight group-hover:text-emerald-400 transition-colors uppercase">{conv.name}</span>
                        <span className="text-[10px] font-black tracking-widest text-white/20">
                          {conv.last_message_at ? format(new Date(conv.last_message_at), 'HH:mm') : 'Active'}
                        </span>
                      </div>
                      <p className="text-white/40 text-sm truncate font-medium">
                        {conv.last_message || "Secure endpoint established..."}
                      </p>
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 bg-white/5 rounded-2xl group-hover:bg-emerald-500/20 transition-all group-hover:translate-x-1">
                      <ChevronRight className="w-6 h-6 text-white/20 group-hover:text-emerald-500" />
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => navigate('/chat')}
              className="w-full h-20 bg-white/5 border border-white/10 rounded-[32px] flex items-center justify-center gap-4 group hover:bg-white/10 transition-all duration-500"
            >
              <span className="text-sm font-black tracking-[0.4em] uppercase text-white/30 group-hover:text-white transition-colors">Access All Terminals</span>
              <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-emerald-400 group-hover:translate-x-2 transition-all" />
            </button>
          </div>

          {/* Sidebar Section */}
          <div className="lg:col-span-4 space-y-8">
            {/* Quick Actions Card */}
            <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 space-y-8 animate-in fade-in slide-in-from-right-10 duration-1000">
              <div className="space-y-1">
                <h3 className="text-xl font-black tracking-tighter uppercase">Quick Link</h3>
                <span className="text-[10px] text-emerald-500 font-black tracking-[0.3em] uppercase">Priority Executive</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <QuickActionButton icon={<MessageSquare className="w-5 h-5 text-emerald-400" />} label="New DM" onClick={() => navigate('/chat')} />
                <QuickActionButton icon={<Users className="w-5 h-5 text-cyan-400" />} label="New Core" onClick={() => navigate('/chat')} />
                <QuickActionButton icon={<Phone className="w-5 h-5 text-purple-400" />} label="Voice" onClick={() => navigate('/chat')} />
                <QuickActionButton icon={<Settings className="w-5 h-5 text-zinc-400" />} label="Config" onClick={() => navigate('/chat')} />
              </div>
            </div>

            {/* Neural Favorites */}
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-1000" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between px-2">
                <div className="flex flex-col">
                  <h2 className="text-xl font-black tracking-tighter uppercase">Neural Priority</h2>
                  <span className="text-[10px] text-white/20 font-black tracking-[0.3em] uppercase">High Affinity Links</span>
                </div>
              </div>

              <div className="space-y-3">
                {favorites.length === 0 ? (
                  <div className="p-8 bg-white/[0.01] border border-dashed border-white/5 rounded-[32px] text-center">
                    <span className="text-[10px] font-black tracking-widest text-white/20 uppercase">No Affinity established</span>
                  </div>
                ) : (
                  favorites.slice(0, 4).map((fav: any) => (
                    <div key={fav.id} className="goat-card-hover bg-white/[0.02] border border-white/5 rounded-3xl p-4 flex items-center gap-4 cursor-pointer group">
                      <Avatar className="h-12 w-12 border border-white/10 group-hover:border-emerald-500/30 transition-all duration-500">
                        <AvatarImage src={fav.contact_user?.avatar_url} />
                        <AvatarFallback className="bg-zinc-800">{fav.contact_user?.display_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-bold tracking-tight truncate group-hover:text-emerald-400 transition-colors uppercase">{fav.name}</span>
                        <span className="text-[10px] font-black text-white/20 uppercase truncate">Identity Verified</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* System Security */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-[40px] p-8 space-y-4 shimmer-container animate-in fade-in slide-in-from-bottom-10 duration-1000" style={{ animationDelay: '400ms' }}>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-lg font-black tracking-tight uppercase">System Integrity</h3>
              <p className="text-white/40 text-xs leading-relaxed font-medium">
                All communication protocols are active and monitored for maximum security throughput.
              </p>
              <div className="pt-2">
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-4/5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[9px] font-black tracking-widest uppercase text-white/20">Security Clearance</span>
                  <span className="text-[9px] font-black tracking-widest uppercase text-emerald-500">Level 4 ALPHA</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-20 pt-10 border-t border-white/5 text-center space-y-4">
          <div className="text-[10px] font-black tracking-[0.5em] uppercase text-white/10">Core Intelligence Layer 2.0 // Bawaal Web Interface</div>
          <p className="text-[9px] font-medium text-white/20 uppercase tracking-widest">Distributed Neural Architecture engineered for extreme performance and absolute privacy.</p>
        </footer>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
  const colors = {
    emerald: 'from-emerald-500/20 to-emerald-500/0 text-emerald-500',
    cyan: 'from-cyan-500/20 to-cyan-500/0 text-cyan-500',
    purple: 'from-purple-500/20 to-purple-500/0 text-purple-500'
  }
  return (
    <div className="goat-card-hover bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 relative overflow-hidden group">
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-1000", (colors as any)[color])}></div>
      <div className="relative z-10 space-y-6">
        <div className={cn("w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-all group-hover:scale-110", `text-${color}-500`)}>
          {React.cloneElement(icon as React.ReactElement, { className: 'w-7 h-7' })}
        </div>
        <div>
          <div className="text-4xl font-black tracking-tighter mb-1">{value}</div>
          <div className="text-[10px] font-black tracking-[0.2em] uppercase text-white/30">{label}</div>
        </div>
      </div>
    </div>
  )
}

function QuickActionButton({ icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-3 p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 group"
    >
      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-xl">
        {icon}
      </div>
      <span className="text-[9px] font-black tracking-widest uppercase text-white/30 group-hover:text-white transition-colors">{label}</span>
    </button>
  )
}