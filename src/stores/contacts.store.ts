import { create } from 'zustand';
import { contactsService } from '@/api/supabase/contacts';
import type { Contact } from '@/api/supabase/contacts';

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

interface ContactsState {
  contacts: ContactWithUser[];
  favorites: ContactWithUser[];
  suggestions: UserSearchResult[];
  isLoading: boolean;
  error: string | null;
  searchResults: UserSearchResult[];
  
  // Actions
  setContacts: (contacts: ContactWithUser[]) => void;
  setFavorites: (favorites: ContactWithUser[]) => void;
  setSuggestions: (suggestions: UserSearchResult[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchResults: (results: UserSearchResult[]) => void;
  
  // Contacts operations
  loadContacts: (userId: string) => Promise<void>;
  loadFavorites: (userId: string) => Promise<void>;
  loadSuggestions: (userId: string) => Promise<void>;
  addContact: (
    userId: string,
    data: {
      contact_user_id: string;
      name: string;
      is_favorite?: boolean;
    }
  ) => Promise<Contact>;
  updateContact: (
    contactId: string,
    data: {
      name?: string;
      is_favorite?: boolean;
    }
  ) => Promise<Contact>;
  removeContact: (contactId: string) => Promise<void>;
  searchUsers: (query: string, excludeUserId?: string) => Promise<UserSearchResult[]>;
  importContacts: (userId: string, phoneNumbers: string[]) => Promise<number>;
  clearError: () => void;
  clearSearchResults: () => void;
}

export const useContactsStore = create<ContactsState>((set, get) => ({
  contacts: [],
  favorites: [],
  suggestions: [],
  isLoading: false,
  error: null,
  searchResults: [],

  setContacts: (contacts) => set({ contacts }),
  setFavorites: (favorites) => set({ favorites }),
  setSuggestions: (suggestions) => set({ suggestions }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setSearchResults: (results) => set({ searchResults: results }),

  loadContacts: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const contacts = await contactsService.getUserContacts(userId);
      set({ contacts, isLoading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load contacts';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  loadFavorites: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const favorites = await contactsService.getFavoriteContacts(userId);
      set({ favorites, isLoading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load favorites';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  loadSuggestions: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const suggestions = await contactsService.getContactSuggestions(userId);
      set({ suggestions, isLoading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load suggestions';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  addContact: async (userId: string, data) => {
    set({ isLoading: true, error: null });
    try {
      const contact = await contactsService.addContact(userId, data);
      
      // Add to contacts list
      set((state) => ({
        contacts: [...state.contacts, contact as ContactWithUser],
        isLoading: false,
      }));

      // If favorite, add to favorites
      if (data.is_favorite) {
        set((state) => ({
          favorites: [...state.favorites, contact as ContactWithUser],
        }));
      }

      // Remove from suggestions if present
      set((state) => ({
        suggestions: state.suggestions.filter(
          (suggestion) => suggestion.id !== data.contact_user_id
        ),
      }));

      return contact;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add contact';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateContact: async (contactId: string, data) => {
    set({ isLoading: true, error: null });
    try {
      const contact = await contactsService.updateContact(contactId, data);
      
      // Update in contacts list
      set((state) => ({
        contacts: state.contacts.map((c) =>
          c.id === contactId ? { ...c, ...contact } as ContactWithUser : c
        ),
        isLoading: false,
      }));

      // Update in favorites if needed
      if (data.is_favorite !== undefined) {
        if (data.is_favorite) {
          set((state) => ({
            favorites: [...state.favorites, contact as ContactWithUser],
          }));
        } else {
          set((state) => ({
            favorites: state.favorites.filter((c) => c.id !== contactId),
          }));
        }
      }

      return contact;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update contact';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  removeContact: async (contactId: string) => {
    set({ isLoading: true, error: null });
    try {
      await contactsService.removeContact(contactId);
      
      // Remove from contacts list
      set((state) => ({
        contacts: state.contacts.filter((c) => c.id !== contactId),
        favorites: state.favorites.filter((c) => c.id !== contactId),
        isLoading: false,
      }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove contact';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  searchUsers: async (query: string, excludeUserId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const results = await contactsService.searchUsers(query, excludeUserId);
      set({ searchResults: results, isLoading: false });
      return results;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  importContacts: async (userId: string, phoneNumbers: string[]) => {
    set({ isLoading: true, error: null });
    try {
      const importedCount = await contactsService.importContacts(userId, phoneNumbers);
      
      // Reload contacts after import
      await get().loadContacts(userId);
      await get().loadFavorites(userId);
      
      set({ isLoading: false });
      return importedCount;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  clearSearchResults: () => set({ searchResults: [] }),
}));