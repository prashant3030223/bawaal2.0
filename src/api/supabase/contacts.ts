import { supabase } from './client';
import type { Database } from './client';

export type Contact = Database['public']['Tables']['contacts']['Row'];

export interface CreateContactData {
  contact_user_id: string;
  name: string;
  is_favorite?: boolean;
}

export interface UpdateContactData {
  name?: string;
  is_favorite?: boolean;
}

interface UserSearchResult {
  id: string;
  display_name: string;
  avatar_url: string | null;
  status: string | null;
  phone_number: string | null;
}

interface ContactWithUser extends Contact {
  contact_user: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    status: string | null;
    last_seen: string;
    phone_number: string | null;
  };
}

class ContactsService {
  // Get user's contacts
  async getUserContacts(userId: string): Promise<ContactWithUser[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        contact_user:users!contacts_contact_user_id_fkey (
          id,
          display_name,
          avatar_url,
          status,
          last_seen,
          phone_number
        )
      `)
      .eq('user_id', userId)
      .order('is_favorite', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch contacts: ${error.message}`);
    }

    return data as ContactWithUser[];
  }

  // Add a new contact
  async addContact(userId: string, data: CreateContactData): Promise<Contact> {
    const { contact_user_id, name, is_favorite = false } = data;

    // Check if contact already exists
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', userId)
      .eq('contact_user_id', contact_user_id)
      .single();

    if (existingContact) {
      throw new Error('Contact already exists');
    }

    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, display_name')
      .eq('id', contact_user_id)
      .single();

    if (userError) {
      throw new Error(`User not found: ${userError.message}`);
    }

    // Create contact
    const { data: contactData, error } = await supabase
      .from('contacts')
      .insert({
        user_id: userId,
        contact_user_id,
        name: name || userData.display_name,
        is_favorite,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add contact: ${error.message}`);
    }

    return contactData;
  }

  // Update contact
  async updateContact(
    contactId: string,
    data: UpdateContactData
  ): Promise<Contact> {
    const { data: contactData, error } = await supabase
      .from('contacts')
      .update(data)
      .eq('id', contactId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update contact: ${error.message}`);
    }

    return contactData;
  }

  // Remove contact
  async removeContact(contactId: string): Promise<void> {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId);

    if (error) {
      throw new Error(`Failed to remove contact: ${error.message}`);
    }
  }

  // Search users by name or phone number
  async searchUsers(query: string, excludeUserId?: string): Promise<UserSearchResult[]> {
    let searchQuery = supabase
      .from('users')
      .select('id, display_name, avatar_url, status, phone_number')
      .or(`display_name.ilike.%${query}%,phone_number.ilike.%${query}%`)
      .limit(20);

    if (excludeUserId) {
      searchQuery = searchQuery.neq('id', excludeUserId);
    }

    const { data, error } = await searchQuery;

    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }

    return data || [];
  }

  // Get contact by user ID
  async getContactByUserId(userId: string, contactUserId: string): Promise<Contact | null> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .eq('contact_user_id', contactUserId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching contact:', error);
    }

    return data;
  }

  // Get favorite contacts
  async getFavoriteContacts(userId: string): Promise<ContactWithUser[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        contact_user:users!contacts_contact_user_id_fkey (
          id,
          display_name,
          avatar_url,
          status,
          last_seen
        )
      `)
      .eq('user_id', userId)
      .eq('is_favorite', true)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch favorite contacts: ${error.message}`);
    }

    return data as ContactWithUser[];
  }

  // Check if user is in contacts
  async isUserInContacts(userId: string, contactUserId: string): Promise<boolean> {
    const { data } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', userId)
      .eq('contact_user_id', contactUserId)
      .single();

    return !!data;
  }

  // Get contact suggestions (users not in contacts)
  async getContactSuggestions(userId: string, limit: number = 10): Promise<UserSearchResult[]> {
    // Get all users except current user and existing contacts
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, display_name, avatar_url, status')
      .neq('id', userId)
      .limit(50);

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    // Get existing contacts
    const { data: existingContacts } = await supabase
      .from('contacts')
      .select('contact_user_id')
      .eq('user_id', userId);

    const existingContactIds = new Set(
      existingContacts?.map(contact => contact.contact_user_id) || []
    );

    // Filter out existing contacts
    const suggestions = allUsers
      .filter(user => !existingContactIds.has(user.id))
      .slice(0, limit);

    return suggestions as UserSearchResult[];
  }

  // Import contacts from phone numbers
  async importContacts(userId: string, phoneNumbers: string[]): Promise<number> {
    let importedCount = 0;

    for (const phoneNumber of phoneNumbers) {
      // Find user by phone number
      const { data: userData } = await supabase
        .from('users')
        .select('id, display_name')
        .eq('phone_number', phoneNumber)
        .single();

      if (userData && userData.id !== userId) {
        try {
          // Check if already in contacts
          const existingContact = await this.getContactByUserId(userId, userData.id);
          
          if (!existingContact) {
            // Add to contacts
            await this.addContact(userId, {
              contact_user_id: userData.id,
              name: userData.display_name,
              is_favorite: false,
            });
            importedCount++;
          }
        } catch (error) {
          console.error(`Failed to import contact ${phoneNumber}:`, error);
        }
      }
    }

    return importedCount;
  }
}

export const contactsService = new ContactsService();