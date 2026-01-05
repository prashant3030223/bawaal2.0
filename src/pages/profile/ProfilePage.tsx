import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Edit,
  Camera,
  Save,
  X,
  Globe,
  Lock,
  Users,
  MessageSquare,
  Video,
} from 'lucide-react';
import { format } from 'date-fns';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile, isLoading } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    phone_number: '',
    location: '',
    website: '',
    status: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        phone_number: profile.phone_number || '',
        location: profile.location || '',
        website: profile.website || '',
        status: profile.status || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  return (
    <div className="h-full p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                My Profile
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your personal information and settings
              </p>
            </div>
            <Button
              variant={isEditing ? "outline" : "default"}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Your public profile information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Profile Picture */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <Avatar className="h-32 w-32">
                        <AvatarImage
                          src={profile?.avatar_url || `https://mgx-backend-cdn.metadl.com/generate/images/877561/2026-01-01/ea258078-b9b5-4897-a920-2f93d2eb6b5f.png`}
                          alt={user?.display_name || 'User'}
                        />
                        <AvatarFallback className="text-2xl">
                          {getInitials(user?.display_name || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      {isEditing && (
                        <Button
                          type="button"
                          size="icon"
                          className="absolute bottom-0 right-0 rounded-full"
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                      )}
                      <div className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white dark:border-gray-900 ${getStatusColor(profile?.status || 'online')}`} />
                    </div>
                    
                    {!isEditing && (
                      <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {user?.display_name}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                          {profile?.status || 'Hey there! I am using Bawaal.'}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="display_name">
                          <User className="inline h-4 w-4 mr-2" />
                          Display Name
                        </Label>
                        <Input
                          id="display_name"
                          name="display_name"
                          value={formData.display_name}
                          onChange={handleChange}
                          disabled={!isEditing}
                          placeholder="Your name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">
                          <MessageSquare className="inline h-4 w-4 mr-2" />
                          Status
                        </Label>
                        <Input
                          id="status"
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          disabled={!isEditing}
                          placeholder="Hey there! I am using Bawaal."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">
                        Bio
                      </Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="Tell us about yourself..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone_number">
                          <Phone className="inline h-4 w-4 mr-2" />
                          Phone Number
                        </Label>
                        <Input
                          id="phone_number"
                          name="phone_number"
                          type="tel"
                          value={formData.phone_number}
                          onChange={handleChange}
                          disabled={!isEditing}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">
                          <MapPin className="inline h-4 w-4 mr-2" />
                          Location
                        </Label>
                        <Input
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          disabled={!isEditing}
                          placeholder="Your city"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">
                        <Globe className="inline h-4 w-4 mr-2" />
                        Website
                      </Label>
                      <Input
                        id="website"
                        name="website"
                        type="url"
                        value={formData.website}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>Email</span>
                  </div>
                  <p className="font-medium">{user?.email}</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Member Since</span>
                  </div>
                  <p className="font-medium">
                    {user?.created_at ? format(new Date(user.created_at), 'MMMM d, yyyy') : 'N/A'}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <User className="h-4 w-4 mr-2" />
                    <span>User ID</span>
                  </div>
                  <p className="font-medium text-xs truncate">{user?.id}</p>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Privacy Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm">Profile Visibility</span>
                    </div>
                    <Badge variant="outline">Public</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Lock className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm">Last Seen</span>
                    </div>
                    <Badge variant="outline">Everyone</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm">Read Receipts</span>
                    </div>
                    <Badge variant="outline">Enabled</Badge>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => navigate('/settings')}
                >
                  Manage Privacy
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">42</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Contacts</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">128</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Messages</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">12</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Groups</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">8</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Calls</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/new-chat')}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  New Chat
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/new-group')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Create Group
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/settings')}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Account Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;