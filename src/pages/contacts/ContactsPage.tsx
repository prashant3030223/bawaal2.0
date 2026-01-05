import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useContactsStore } from '@/stores/contacts.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  UserPlus,
  Phone,
  Video,
  Star,
  MoreVertical,
  Filter,
  Import,
  Users,
  UserCheck,
} from 'lucide-react';

interface ContactUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
  status: string | null;
  phone_number: string | null;
}

interface ContactWithUser {
  id: string;
  user_id: string;
  contact_user_id: string;
  name: string;
  is_favorite: boolean;
  created_at: string;
  contact_user: ContactUser;
}

const ContactsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    contacts,
    favorites,
    suggestions,
    searchResults,
    isLoading,
    loadContacts,
    loadFavorites,
    loadSuggestions,
    searchUsers,
    addContact,
    removeContact,
    updateContact,
    clearSearchResults,
  } = useContactsStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadContacts(user.id);
      loadFavorites(user.id);
      loadSuggestions(user.id);
    }
  }, [user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && user) {
      await searchUsers(searchQuery, user.id);
    }
  };

  const handleAddContact = async (contactUserId: string, name: string) => {
    if (!user) return;
    
    try {
      await addContact(user.id, {
        contact_user_id: contactUserId,
        name,
        is_favorite: false,
      });
      clearSearchResults();
    } catch (error) {
      console.error('Failed to add contact:', error);
    }
  };

  const handleToggleFavorite = async (contactId: string, isFavorite: boolean) => {
    try {
      await updateContact(contactId, {
        is_favorite: !isFavorite,
      });
    } catch (error) {
      console.error('Failed to update contact:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    if (activeTab === 'favorites') {
      return contact.is_favorite;
    }
    return true;
  });

  return (
    <div className="h-full p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Contacts
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your contacts and connect with people
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => navigate('/new-chat')}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
              <Button variant="outline">
                <Import className="mr-2 h-4 w-4" />
                Import
              </Button>
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search contacts by name or phone number..."
                className="pl-12 pr-12"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!e.target.value.trim()) {
                    clearSearchResults();
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => {
                  setSearchQuery('');
                  clearSearchResults();
                }}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <div className="flex items-center justify-between">
                    <TabsList>
                      <TabsTrigger value="all" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        All Contacts ({contacts.length})
                      </TabsTrigger>
                      <TabsTrigger value="favorites" className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Favorites ({favorites.length})
                      </TabsTrigger>
                    </TabsList>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {filteredContacts.length} contacts
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
                        Loading contacts...
                      </p>
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        {activeTab === 'favorites' 
                          ? 'No favorite contacts yet'
                          : 'No contacts yet'}
                      </p>
                      <Button onClick={() => navigate('/new-chat')}>
                        Add your first contact
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredContacts.map((contact) => {
                        const typedContact = contact as ContactWithUser;
                        const contactUser = typedContact.contact_user;
                        return (
                          <div
                            key={contact.id}
                            className={`flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${
                              selectedContact === contact.id ? 'bg-gray-100 dark:bg-gray-800' : ''
                            }`}
                            onClick={() => {
                              setSelectedContact(contact.id);
                              navigate(`/chat/${contact.contact_user_id}`);
                            }}
                          >
                            <div className="relative">
                              <Avatar className="h-12 w-12">
                                <AvatarImage
                                  src={contactUser?.avatar_url || `https://mgx-backend-cdn.metadl.com/generate/images/877561/2026-01-01/ea258078-b9b5-4897-a920-2f93d2eb6b5f.png`}
                                  alt={contact.name}
                                />
                                <AvatarFallback>
                                  {getInitials(contact.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 ${getStatusColor(contactUser?.status || 'online')}`} />
                            </div>
                            <div className="ml-3 flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                    {contact.name}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {contactUser?.status || 'Hey there! I am using Bawaal.'}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/call/voice/${contact.contact_user_id}`);
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
                                      navigate(`/call/video/${contact.contact_user_id}`);
                                    }}
                                  >
                                    <Video className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleFavorite(contact.id, contact.is_favorite);
                                    }}
                                  >
                                    <Star className={`h-4 w-4 ${contact.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                                  </Button>
                                </div>
                              </div>
                              {contactUser?.phone_number && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {contactUser.phone_number}
                                </p>
                              )}
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
            {/* Search Results */}
            {searchResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Search Results</CardTitle>
                  <CardDescription>
                    {searchResults.length} users found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={user.avatar_url || `https://mgx-backend-cdn.metadl.com/generate/images/877561/2026-01-01/ea258078-b9b5-4897-a920-2f93d2eb6b5f.png`}
                              alt={user.display_name}
                            />
                            <AvatarFallback>
                              {getInitials(user.display_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-3 flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {user.display_name}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {user.status || 'User'}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddContact(user.id, user.display_name)}
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Suggestions</CardTitle>
                <CardDescription>
                  People you may know
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  {suggestions.length === 0 ? (
                    <div className="text-center py-8">
                      <UserPlus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No suggestions available
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {suggestions.slice(0, 5).map((suggestion) => (
                        <div
                          key={suggestion.id}
                          className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={suggestion.avatar_url || `https://mgx-backend-cdn.metadl.com/generate/images/877561/2026-01-01/ea258078-b9b5-4897-a920-2f93d2eb6b5f.png`}
                              alt={suggestion.display_name}
                            />
                            <AvatarFallback>
                              {getInitials(suggestion.display_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-3 flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              {suggestion.display_name}
                            </h4>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddContact(suggestion.id, suggestion.display_name)}
                          >
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Contacts</span>
                    <span className="font-semibold">{contacts.length}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Favorites</span>
                    <span className="font-semibold">{favorites.length}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Online Now</span>
                    <span className="font-semibold text-green-600">
                      {contacts.filter(c => {
                        const typedContact = c as ContactWithUser;
                        return typedContact.contact_user?.status === 'online';
                      }).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactsPage;