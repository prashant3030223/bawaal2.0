import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { callsService } from '@/api/supabase/calls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Phone,
  Video,
  PhoneOutgoing,
  PhoneIncoming,
  PhoneMissed,
  Filter,
  Search,
  MoreVertical,
  Calendar,
  Clock,
  Users,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface CallUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
  phone_number: string | null;
}

interface Call {
  id: string;
  caller_id: string;
  recipient_id: string;
  type: 'voice' | 'video';
  status: 'ringing' | 'active' | 'ended' | 'missed' | 'rejected';
  started_at: string;
  answered_at?: string;
  ended_at?: string;
  duration?: number;
  caller?: CallUser;
  recipient?: CallUser;
}

const CallsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [calls, setCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCallHistory();
  }, [user]);

  const loadCallHistory = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const callHistory = await callsService.getUserCallHistory(user.id);
      setCalls(callHistory);
    } catch (error) {
      console.error('Failed to load call history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startCall = async (type: 'voice' | 'video', recipientId: string) => {
    if (!user) return;
    
    try {
      const call = await callsService.startCall(user.id, {
        recipient_id: recipientId,
        type,
      });
      navigate(`/call/${type}/${call.id}`);
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  };

  const getCallIcon = (call: Call) => {
    const isOutgoing = call.caller_id === user?.id;
    
    if (call.status === 'missed') {
      return <PhoneMissed className="h-4 w-4 text-red-500" />;
    }
    
    if (call.status === 'rejected') {
      return <PhoneMissed className="h-4 w-4 text-red-500" />;
    }
    
    return isOutgoing ? (
      <PhoneOutgoing className="h-4 w-4 text-green-500" />
    ) : (
      <PhoneIncoming className="h-4 w-4 text-blue-500" />
    );
  };

  const getCallStatusText = (call: Call) => {
    const isOutgoing = call.caller_id === user?.id;
    
    switch (call.status) {
      case 'ended':
        return isOutgoing ? 'Outgoing' : 'Incoming';
      case 'missed':
        return 'Missed';
      case 'rejected':
        return 'Rejected';
      default:
        return call.status.charAt(0).toUpperCase() + call.status.slice(1);
    }
  };

  const getCallDuration = (call: Call) => {
    if (call.duration) {
      const minutes = Math.floor(call.duration / 60);
      const seconds = call.duration % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return '--:--';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredCalls = calls.filter((call) => {
    if (activeTab === 'missed' && call.status !== 'missed') return false;
    if (activeTab === 'outgoing' && call.caller_id !== user?.id) return false;
    if (activeTab === 'incoming' && call.caller_id === user?.id) return false;
    
    if (searchQuery) {
      const otherUser = call.caller_id === user?.id ? call.recipient : call.caller;
      const name = otherUser?.display_name?.toLowerCase() || '';
      const phone = otherUser?.phone_number?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      return name.includes(query) || phone.includes(query);
    }
    
    return true;
  });

  const getCallStats = () => {
    const total = calls.length;
    const missed = calls.filter(call => call.status === 'missed').length;
    const outgoing = calls.filter(call => call.caller_id === user?.id).length;
    const incoming = total - outgoing;
    
    return { total, missed, outgoing, incoming };
  };

  const stats = getCallStats();

  return (
    <div className="h-full p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Calls
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Your call history and statistics
              </p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => navigate('/new-chat')}>
                <Phone className="mr-2 h-4 w-4" />
                New Call
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search calls by name or phone number..."
                className="pl-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <div className="flex items-center justify-between">
                    <TabsList>
                      <TabsTrigger value="all">
                        All Calls ({calls.length})
                      </TabsTrigger>
                      <TabsTrigger value="missed">
                        <PhoneMissed className="mr-2 h-4 w-4" />
                        Missed ({stats.missed})
                      </TabsTrigger>
                      <TabsTrigger value="outgoing">
                        <PhoneOutgoing className="mr-2 h-4 w-4" />
                        Outgoing ({stats.outgoing})
                      </TabsTrigger>
                      <TabsTrigger value="incoming">
                        <PhoneIncoming className="mr-2 h-4 w-4" />
                        Incoming ({stats.incoming})
                      </TabsTrigger>
                    </TabsList>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {filteredCalls.length} calls
                    </div>
                  </div>
                </Tabs>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                      <p className="mt-4 text-gray-600 dark:text-gray-400">
                        Loading call history...
                      </p>
                    </div>
                  ) : filteredCalls.length === 0 ? (
                    <div className="text-center py-12">
                      <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        {searchQuery
                          ? 'No calls found matching your search'
                          : activeTab === 'missed'
                          ? 'No missed calls'
                          : 'No call history yet'}
                      </p>
                      {!searchQuery && (
                        <Button onClick={() => navigate('/new-chat')}>
                          Make your first call
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredCalls.map((call) => {
                        const otherUser = call.caller_id === user?.id ? call.recipient : call.caller;
                        const isMissed = call.status === 'missed';
                        
                        return (
                          <div
                            key={call.id}
                            className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                            onClick={() => {
                              if (otherUser) {
                                navigate(`/chat/${otherUser.id}`);
                              }
                            }}
                          >
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="relative">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage
                                    src={otherUser?.avatar_url || `https://mgx-backend-cdn.metadl.com/generate/images/877561/2026-01-01/ea258078-b9b5-4897-a920-2f93d2eb6b5f.png`}
                                    alt={otherUser?.display_name || 'User'}
                                  />
                                  <AvatarFallback>
                                    {getInitials(otherUser?.display_name || 'U')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-1">
                                  {call.type === 'voice' ? (
                                    <Phone className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                                  ) : (
                                    <Video className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className={`font-medium ${isMissed ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
                                    {otherUser?.display_name || 'Unknown'}
                                  </h4>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                      {formatDistanceToNow(new Date(call.started_at), { addSuffix: true })}
                                    </span>
                                    {call.duration && call.status === 'ended' && (
                                      <Badge variant="outline">
                                        {getCallDuration(call)}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2 mt-1">
                                  {getCallIcon(call)}
                                  <span className={`text-sm ${isMissed ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {getCallStatusText(call)}
                                  </span>
                                  {call.status === 'ended' && call.duration && (
                                    <>
                                      <Separator orientation="vertical" className="h-4" />
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {call.type === 'voice' ? 'Voice call' : 'Video call'}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startCall('voice', otherUser?.id || '');
                                }}
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startCall('video', otherUser?.id || '');
                                }}
                              >
                                <Video className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>
                  Start a new call quickly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    className="w-full justify-start"
                    onClick={() => navigate('/new-chat')}
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    New Voice Call
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/new-chat')}
                  >
                    <Video className="mr-2 h-4 w-4" />
                    New Video Call
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/contacts')}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Call Contact
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Call Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Call Statistics</CardTitle>
                <CardDescription>
                  Your call activity overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Calls</span>
                    <span className="font-semibold">{stats.total}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Voice Calls</span>
                    <span className="font-semibold">
                      {calls.filter(call => call.type === 'voice').length}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Video Calls</span>
                    <span className="font-semibold">
                      {calls.filter(call => call.type === 'video').length}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Missed Calls</span>
                    <span className="font-semibold text-red-600">{stats.missed}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Duration</span>
                    <span className="font-semibold">
                      {calls.reduce((total, call) => total + (call.duration || 0), 0)}s
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Contacts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Frequent Contacts</CardTitle>
                <CardDescription>
                  People you call often
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  {calls.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No frequent contacts yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Array.from(new Set(calls.map(call => 
                        call.caller_id === user?.id ? call.recipient_id : call.caller_id
                      ))).slice(0, 5).map((userId) => {
                        const userCalls = calls.filter(call => 
                          call.caller_id === userId || call.recipient_id === userId
                        );
                        const lastCall = userCalls[0];
                        const otherUser = lastCall?.caller_id === userId ? lastCall.caller : lastCall?.recipient;
                        
                        return (
                          <div
                            key={userId}
                            className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                            onClick={() => navigate(`/chat/${userId}`)}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={otherUser?.avatar_url || `https://mgx-backend-cdn.metadl.com/generate/images/877561/2026-01-01/ea258078-b9b5-4897-a920-2f93d2eb6b5f.png`}
                                alt={otherUser?.display_name || 'User'}
                              />
                              <AvatarFallback>
                                {getInitials(otherUser?.display_name || 'U')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="ml-3 flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                {otherUser?.display_name || 'Unknown'}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {userCalls.length} calls
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                startCall('voice', userId);
                              }}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallsPage;