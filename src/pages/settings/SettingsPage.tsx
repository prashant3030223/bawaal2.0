import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Globe,
  HelpCircle,
  LogOut,
  Moon,
  Smartphone,
  MessageSquare,
  Video,
  Download,
  Trash2,
} from 'lucide-react';

interface SettingsState {
  // Notification settings
  messageNotifications: boolean;
  callNotifications: boolean;
  groupNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  
  // Privacy settings
  lastSeen: string;
  profilePhoto: string;
  status: string;
  readReceipts: boolean;
  
  // Appearance settings
  theme: string;
  fontSize: string;
  chatWallpaper: string;
  
  // Storage settings
  autoDownloadPhotos: string;
  autoDownloadVideos: string;
  autoDownloadDocuments: string;
  saveToCameraRoll: boolean;
}

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const [settings, setSettings] = useState<SettingsState>({
    // Notification settings
    messageNotifications: true,
    callNotifications: true,
    groupNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    
    // Privacy settings
    lastSeen: 'everyone',
    profilePhoto: 'everyone',
    status: 'everyone',
    readReceipts: true,
    
    // Appearance settings
    theme: 'system',
    fontSize: 'medium',
    chatWallpaper: 'default',
    
    // Storage settings
    autoDownloadPhotos: 'wifi',
    autoDownloadVideos: 'wifi',
    autoDownloadDocuments: 'wifi',
    saveToCameraRoll: true,
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSettingChange = (key: keyof SettingsState, value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // In a real app, you would save settings to the backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Settings saved:', settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = (type: string) => {
    if (confirm(`Are you sure you want to clear all ${type}? This action cannot be undone.`)) {
      console.log(`Clearing ${type} data...`);
    }
  };

  return (
    <div className="h-full p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Customize your Bawaal experience
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => document.getElementById('account')?.scrollIntoView()}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Account
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => document.getElementById('notifications')?.scrollIntoView()}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => document.getElementById('privacy')?.scrollIntoView()}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Privacy
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => document.getElementById('appearance')?.scrollIntoView()}
                  >
                    <Palette className="mr-2 h-4 w-4" />
                    Appearance
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => document.getElementById('storage')?.scrollIntoView()}
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Storage & Data
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => document.getElementById('help')?.scrollIntoView()}
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help
                  </Button>
                </nav>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/profile')}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="account" className="space-y-6">
              <TabsList className="grid grid-cols-2 lg:grid-cols-6">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="privacy">Privacy</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="storage">Storage</TabsTrigger>
                <TabsTrigger value="help">Help</TabsTrigger>
              </TabsList>

              {/* Account Settings */}
              <TabsContent value="account">
                <Card id="account">
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>
                      Manage your account information and security
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="displayName">Display Name</Label>
                          <Input
                            id="displayName"
                            defaultValue={user?.display_name || ''}
                            placeholder="Your display name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          defaultValue={user?.email || ''}
                          placeholder="you@example.com"
                          disabled
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Email cannot be changed
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-semibold">Security</h3>
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start">
                          Change Password
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          Two-Factor Authentication
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          Linked Devices
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-semibold text-red-600">Danger Zone</h3>
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          className="w-full justify-start text-red-600 hover:text-red-700"
                          onClick={() => handleClearData('account')}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Account
                        </Button>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Deleting your account will remove all your data permanently.
                          This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notification Settings */}
              <TabsContent value="notifications">
                <Card id="notifications">
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>
                      Control how and when you receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Message Notifications</Label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Receive notifications for new messages
                          </p>
                        </div>
                        <Switch
                          checked={settings.messageNotifications}
                          onCheckedChange={(checked) =>
                            handleSettingChange('messageNotifications', checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Call Notifications</Label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Receive notifications for incoming calls
                          </p>
                        </div>
                        <Switch
                          checked={settings.callNotifications}
                          onCheckedChange={(checked) =>
                            handleSettingChange('callNotifications', checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Group Notifications</Label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Receive notifications for group activities
                          </p>
                        </div>
                        <Switch
                          checked={settings.groupNotifications}
                          onCheckedChange={(checked) =>
                            handleSettingChange('groupNotifications', checked)
                          }
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-semibold">Notification Sounds</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Sound</Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Play sound for notifications
                            </p>
                          </div>
                          <Switch
                            checked={settings.soundEnabled}
                            onCheckedChange={(checked) =>
                              handleSettingChange('soundEnabled', checked)
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Vibration</Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Vibrate for notifications
                            </p>
                          </div>
                          <Switch
                            checked={settings.vibrationEnabled}
                            onCheckedChange={(checked) =>
                              handleSettingChange('vibrationEnabled', checked)
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-semibold">Notification Preview</h3>
                      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Preview how notifications will appear on your device
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Privacy Settings */}
              <TabsContent value="privacy">
                <Card id="privacy">
                  <CardHeader>
                    <CardTitle>Privacy Settings</CardTitle>
                    <CardDescription>
                      Control who can see your information and activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Last Seen & Online</Label>
                        <select
                          className="w-full p-2 border rounded-md"
                          value={settings.lastSeen}
                          onChange={(e) =>
                            handleSettingChange('lastSeen', e.target.value)
                          }
                        >
                          <option value="everyone">Everyone</option>
                          <option value="contacts">My Contacts</option>
                          <option value="nobody">Nobody</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Profile Photo</Label>
                        <select
                          className="w-full p-2 border rounded-md"
                          value={settings.profilePhoto}
                          onChange={(e) =>
                            handleSettingChange('profilePhoto', e.target.value)
                          }
                        >
                          <option value="everyone">Everyone</option>
                          <option value="contacts">My Contacts</option>
                          <option value="nobody">Nobody</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Status</Label>
                        <select
                          className="w-full p-2 border rounded-md"
                          value={settings.status}
                          onChange={(e) =>
                            handleSettingChange('status', e.target.value)
                          }
                        >
                          <option value="everyone">Everyone</option>
                          <option value="contacts">My Contacts</option>
                          <option value="nobody">Nobody</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Read Receipts</Label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Send read receipts when you view messages
                          </p>
                        </div>
                        <Switch
                          checked={settings.readReceipts}
                          onCheckedChange={(checked) =>
                            handleSettingChange('readReceipts', checked)
                          }
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-semibold">Blocked Contacts</h3>
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start">
                          View Blocked List
                        </Button>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Manage contacts you've blocked
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Appearance Settings */}
              <TabsContent value="appearance">
                <Card id="appearance">
                  <CardHeader>
                    <CardTitle>Appearance Settings</CardTitle>
                    <CardDescription>
                      Customize the look and feel of Bawaal
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Theme</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            variant={settings.theme === 'light' ? 'default' : 'outline'}
                            onClick={() => handleSettingChange('theme', 'light')}
                          >
                            Light
                          </Button>
                          <Button
                            variant={settings.theme === 'dark' ? 'default' : 'outline'}
                            onClick={() => handleSettingChange('theme', 'dark')}
                          >
                            Dark
                          </Button>
                          <Button
                            variant={settings.theme === 'system' ? 'default' : 'outline'}
                            onClick={() => handleSettingChange('theme', 'system')}
                          >
                            System
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Font Size</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            variant={settings.fontSize === 'small' ? 'default' : 'outline'}
                            onClick={() => handleSettingChange('fontSize', 'small')}
                          >
                            Small
                          </Button>
                          <Button
                            variant={settings.fontSize === 'medium' ? 'default' : 'outline'}
                            onClick={() => handleSettingChange('fontSize', 'medium')}
                          >
                            Medium
                          </Button>
                          <Button
                            variant={settings.fontSize === 'large' ? 'default' : 'outline'}
                            onClick={() => handleSettingChange('fontSize', 'large')}
                          >
                            Large
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Chat Wallpaper</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            variant={settings.chatWallpaper === 'default' ? 'default' : 'outline'}
                            onClick={() => handleSettingChange('chatWallpaper', 'default')}
                          >
                            Default
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => navigate('/settings/wallpaper')}
                          >
                            Custom
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleSettingChange('chatWallpaper', 'solid')}
                          >
                            Solid Color
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-semibold">Preview</h3>
                      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                          <div>
                            <p className="font-medium">Sample Chat</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              This is how your chats will look
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Storage Settings */}
              <TabsContent value="storage">
                <Card id="storage">
                  <CardHeader>
                    <CardTitle>Storage & Data Settings</CardTitle>
                    <CardDescription>
                      Manage your storage and data usage
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Auto-Download Media</h3>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Photos</Label>
                          <select
                            className="w-full p-2 border rounded-md"
                            value={settings.autoDownloadPhotos}
                            onChange={(e) =>
                              handleSettingChange('autoDownloadPhotos', e.target.value)
                            }
                          >
                            <option value="never">Never</option>
                            <option value="wifi">Wi-Fi Only</option>
                            <option value="always">Always</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>Videos</Label>
                          <select
                            className="w-full p-2 border rounded-md"
                            value={settings.autoDownloadVideos}
                            onChange={(e) =>
                              handleSettingChange('autoDownloadVideos', e.target.value)
                            }
                          >
                            <option value="never">Never</option>
                            <option value="wifi">Wi-Fi Only</option>
                            <option value="always">Always</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>Documents</Label>
                          <select
                            className="w-full p-2 border rounded-md"
                            value={settings.autoDownloadDocuments}
                            onChange={(e) =>
                              handleSettingChange('autoDownloadDocuments', e.target.value)
                            }
                          >
                            <option value="never">Never</option>
                            <option value="wifi">Wi-Fi Only</option>
                            <option value="always">Always</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-semibold">Storage Usage</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Messages</span>
                          <span className="font-semibold">1.2 GB</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Photos</span>
                          <span className="font-semibold">850 MB</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Videos</span>
                          <span className="font-semibold">2.1 GB</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Documents</span>
                          <span className="font-semibold">150 MB</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between font-semibold">
                          <span>Total</span>
                          <span>4.3 GB</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-semibold">Data Management</h3>
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleClearData('cache')}
                        >
                          Clear Cache
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleClearData('media')}
                        >
                          Clear All Media
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleClearData('messages')}
                        >
                          Clear All Messages
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Help Settings */}
              <TabsContent value="help">
                <Card id="help">
                  <CardHeader>
                    <CardTitle>Help & Support</CardTitle>
                    <CardDescription>
                      Get help and learn more about Bawaal
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start">
                          <HelpCircle className="mr-2 h-4 w-4" />
                          Help Center
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Globe className="mr-2 h-4 w-4" />
                          Contact Us
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Smartphone className="mr-2 h-4 w-4" />
                          App Info
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Download className="mr-2 h-4 w-4" />
                          Check for Updates
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-semibold">About Bawaal</h3>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Version: 1.0.0
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Build: 2026.01.01
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          © 2026 Bawaal Inc. All rights reserved.
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-semibold">Legal</h3>
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start">
                          Terms of Service
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          Privacy Policy
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          Open Source Licenses
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Save Button */}
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                {isLoading ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;