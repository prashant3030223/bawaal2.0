import { supabase, testSupabaseConnection } from './client';
import type { Database } from './client';
import type { Session } from '@supabase/supabase-js';

export type User = Database['public']['Tables']['users']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

export interface RegisterData {
  email: string;
  password: string;
  display_name: string;
  phone_number?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  display_name?: string;
  avatar_url?: string;
  status?: string;
  phone_number?: string;
}

class AuthService {
  private connectionTested = false;
  private connectionError: string | null = null;

  // Test connection before making auth requests
  private async ensureConnection(): Promise<void> {
    if (!this.connectionTested) {
      const result = await testSupabaseConnection();
      this.connectionTested = true;
      if (!result.success) {
        this.connectionError = result.error || 'Connection failed';
        throw new Error(`Supabase connection error: ${this.connectionError}`);
      }
    }
    
    if (this.connectionError) {
      throw new Error(`Supabase connection error: ${this.connectionError}`);
    }
  }

  // Sign up with email and password
  async register(data: RegisterData): Promise<User> {
    await this.ensureConnection();
    
    const { email, password, display_name, phone_number } = data;

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name,
          phone_number,
        },
      },
    });

    if (authError) {
      console.error('Registration auth error:', authError);
      throw new Error(`Registration failed: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('Registration failed: No user data returned');
    }

    // Create user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        display_name,
        phone_number: phone_number || null,
        avatar_url: null,
        status: 'Hey there! I am using Bawaal.',
        last_seen: new Date().toISOString(),
      })
      .select()
      .single();

    if (userError) {
      console.error('Registration profile error:', userError);
      throw new Error(`Profile creation failed: ${userError.message}`);
    }

    // Create default profile settings
    await supabase.from('profiles').insert({
      user_id: authData.user.id,
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
    });

    return userData;
  }

  // Sign in with email and password
  async login(data: LoginData): Promise<User> {
    await this.ensureConnection();
    
    const { email, password } = data;

    console.log('Attempting login for:', email);
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('Login auth error:', authError);
      throw new Error(`Login failed: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('Login failed: No user data returned');
    }

    console.log('Auth successful, fetching user profile...');

    // Get user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      console.error('Login profile error:', userError);
      throw new Error(`User profile not found: ${userError.message}`);
    }

    // Update last seen
    await this.updateLastSeen(authData.user.id);

    console.log('Login successful for user:', userData.display_name);
    return userData;
  }

  // Sign out
  async logout(): Promise<void> {
    await this.ensureConnection();
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  // Get current authenticated user
  async getCurrentUser(): Promise<User | null> {
    try {
      await this.ensureConnection();
    } catch (error) {
      console.warn('Connection error in getCurrentUser:', error);
      return null;
    }
    
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session?.user) {
      return null;
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionData.session.user.id)
      .single();

    if (error) {
      console.error('Error fetching current user:', error);
      return null;
    }

    return userData;
  }

  // Update user profile
  async updateProfile(userId: string, data: UpdateProfileData): Promise<User> {
    await this.ensureConnection();
    
    const { data: userData, error } = await supabase
      .from('users')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      throw new Error(`Profile update failed: ${error.message}`);
    }

    return userData;
  }

  // Update last seen timestamp
  async updateLastSeen(userId: string): Promise<void> {
    try {
      await this.ensureConnection();
    } catch (error) {
      console.warn('Connection error in updateLastSeen:', error);
      return;
    }
    
    await supabase
      .from('users')
      .update({
        last_seen: new Date().toISOString(),
      })
      .eq('id', userId);
  }

  // Reset password
  async resetPassword(email: string): Promise<void> {
    await this.ensureConnection();
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error('Password reset error:', error);
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  // Update password
  async updatePassword(newPassword: string): Promise<void> {
    await this.ensureConnection();
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Password update error:', error);
      throw new Error(`Password update failed: ${error.message}`);
    }
  }

  // Get user profile with settings
  async getUserProfile(userId: string): Promise<{ user: User; profile: Profile }> {
    await this.ensureConnection();
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Get user profile error:', userError);
      throw new Error(`User not found: ${userError.message}`);
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Get profile settings error:', profileError);
      throw new Error(`Profile not found: ${profileError.message}`);
    }

    return {
      user: userData,
      profile: profileData,
    };
  }

  // Check if email exists
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      await this.ensureConnection();
    } catch (error) {
      console.warn('Connection error in checkEmailExists:', error);
      return false;
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking email:', error);
    }

    return !!data;
  }

  // Get session
  async getSession() {
    try {
      await this.ensureConnection();
    } catch (error) {
      console.warn('Connection error in getSession:', error);
      return { data: { session: null }, error: error };
    }
    
    return supabase.auth.getSession();
  }

  // Subscribe to auth changes
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  // Get connection status
  getConnectionStatus(): { tested: boolean; error: string | null } {
    return {
      tested: this.connectionTested,
      error: this.connectionError,
    };
  }
}

export const authService = new AuthService();