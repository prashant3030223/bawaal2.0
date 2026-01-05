import { supabase } from './client'

export const chatService = {
    async getConversations(userId: string) {
        // Fetch conversations where user is a member, including the conversation details
        // and other members in one go using Supabase joins
        const { data, error } = await supabase
            .from('conversation_members')
            .select(`
                conversation_id,
                conversations (
                    id,
                    name,
                    is_group,
                    last_message,
                    last_message_at
                )
            `)
            .eq('user_id', userId)

        if (error) throw error

        const conversations = data
            .filter(item => item.conversations)
            .map(item => item.conversations as any)

        // Enhance with other user info and unread count
        const detailedConversations = await Promise.all(conversations.map(async (conv: any) => {
            // Get other user for private chats
            let otherUserData = null;
            if (!conv.is_group) {
                const { data: members } = await supabase
                    .from('conversation_members')
                    .select(`
                        user_id,
                        users:user_id (*)
                    `)
                    .eq('conversation_id', conv.id)
                    .neq('user_id', userId)
                    .limit(1)

                if (members && members.length > 0) {
                    otherUserData = (members[0] as any).users;
                }
            }

            // Get unread count
            const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conv.id)
                .neq('sender_id', userId)
                .eq('is_read', false)

            return {
                ...conv,
                unread_count: count || 0,
                name: !conv.is_group && otherUserData ? otherUserData.full_name : conv.name,
                other_user: otherUserData
            }
        }))

        return detailedConversations.sort((a, b) => {
            const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
            const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
            return timeB - timeA
        })
    },

    async getMessages(conversationId: string, userId?: string) {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })

        if (error) throw error

        // WhatsApp Style: Filter out messages deleted for this specific user
        if (userId && data) {
            return data.filter(msg => {
                const deletedBy = msg.deleted_by || []
                return !deletedBy.includes(userId)
            })
        }
        return data || []
    },

    async markAsRead(conversationId: string, userId: string) {
        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .neq('sender_id', userId)
            .eq('is_read', false)

        if (error) console.error("Error marking as read:", error)
    },

    async uploadFile(file: File) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('chat-media')
            .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
            .from('chat-media')
            .getPublicUrl(filePath)

        return publicUrl
    },

    async uploadAvatar(userId: string, file: File) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('chat-media')
            .upload(filePath, file, { upsert: true })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
            .from('chat-media')
            .getPublicUrl(filePath)

        return publicUrl
    },

    async updateUserProfile(userId: string, updates: { full_name?: string, avatar_url?: string, status?: string }) {
        // Update users table
        const { error: userError } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)

        if (userError) throw userError

        // Update auth metadata
        const { error: authError } = await supabase.auth.updateUser({
            data: updates
        })

        if (authError) throw authError
    },

    async sendMessage(conversationId: string, senderId: string, content: string, type: 'text' | 'image' | 'video' | 'file' = 'text', isViewOnce = false) {
        const { data, error } = await supabase
            .from('messages')
            .insert([
                {
                    conversation_id: conversationId,
                    sender_id: senderId,
                    content,
                    type,
                    is_view_once: isViewOnce
                }
            ])
            .select()

        if (error) throw error

        await supabase
            .from('conversations')
            .update({
                last_message: type === 'image' ? (isViewOnce ? '📷 View Once Photo' : '📷 Photo') : content,
                last_message_at: new Date().toISOString()
            })
            .eq('id', conversationId)

        return data[0]
    },

    async deleteMessage(messageId: string, mode: 'me' | 'everyone', userId: string) {
        if (mode === 'everyone') {
            const { error } = await supabase
                .from('messages')
                .update({
                    content: 'This message was deleted',
                    is_deleted: true,
                    deleted_for_all: true
                })
                .eq('id', messageId)
            if (error) throw error
        } else {
            // Soft delete for me - In a real app we'd use a join table or array
            // Here we'll simulate it by updating a 'deleted_by' array column if it exists
            // Or just mark it locally. For now, let's try to update the DB if possible.
            const { data: msg } = await supabase.from('messages').select('deleted_by').eq('id', messageId).single()
            const deletedBy = msg?.deleted_by || []
            if (!deletedBy.includes(userId)) {
                const { error } = await supabase
                    .from('messages')
                    .update({ deleted_by: [...deletedBy, userId] })
                    .eq('id', messageId)
                if (error) throw error
            }
        }
    },

    async searchUsers(query: string, currentUserId: string) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .neq('id', currentUserId)
            .ilike('full_name', `%${query}%`)
            .limit(10)

        if (error) throw error
        return data
    },

    async findConversation(userId1: string, userId2: string) {
        const { data: members1 } = await supabase
            .from('conversation_members')
            .select('conversation_id')
            .eq('user_id', userId1)

        if (!members1 || members1.length === 0) return null

        const convIds = members1.map(m => m.conversation_id)
        const { data: shared } = await supabase
            .from('conversation_members')
            .select('conversation_id')
            .in('conversation_id', convIds)
            .eq('user_id', userId2)

        if (!shared || shared.length === 0) return null

        const sharedIds = shared.map(s => s.conversation_id)
        const { data: convs } = await supabase
            .from('conversations')
            .select('*')
            .in('id', sharedIds)
            .eq('is_group', false)
            .limit(1)

        return convs && convs.length > 0 ? convs[0] : null
    },

    async createConversation(userId: string, otherUserId: string, isGroup = false) {
        if (!isGroup) {
            const existing = await this.findConversation(userId, otherUserId)
            if (existing) return existing
        }

        const { data: conv, error: convError } = await supabase
            .from('conversations')
            .insert([{ is_group: isGroup }])
            .select()
            .single()

        if (convError) throw convError

        await supabase
            .from('conversation_members')
            .insert([
                { conversation_id: conv.id, user_id: userId },
                { conversation_id: conv.id, user_id: otherUserId }
            ])

        return conv
    },

    async createGroup(creatorId: string, name: string, memberIds: string[]) {
        // 1. Create conversation record
        const { data: conv, error: convError } = await supabase
            .from('conversations')
            .insert([{
                name,
                is_group: true,
                created_at: new Date().toISOString()
            }])
            .select()
            .single()

        if (convError) throw convError

        // 2. Add members (including creator)
        const members = [creatorId, ...memberIds].map(id => ({
            conversation_id: conv.id,
            user_id: id
        }))

        const { error: memberError } = await supabase
            .from('conversation_members')
            .insert(members)

        if (memberError) throw memberError

        return conv
    },

    async addGroupMembers(conversationId: string, memberIds: string[]) {
        const members = memberIds.map(id => ({
            conversation_id: conversationId,
            user_id: id
        }))

        const { error } = await supabase
            .from('conversation_members')
            .insert(members)

        if (error) throw error
    },

    async updateGroupProfile(conversationId: string, updates: { name?: string, avatar_url?: string }) {
        const { error } = await supabase
            .from('conversations')
            .update(updates)
            .eq('id', conversationId)

        if (error) throw error
    },

    async clearMessages(conversationId: string, userId: string) {
        // WhatsApp Style: Clear chat only for the current user
        // We add the userId to the deleted_by array for all existing messages
        const { data: messages } = await supabase
            .from('messages')
            .select('id, deleted_by')
            .eq('conversation_id', conversationId)

        if (messages && messages.length > 0) {
            // Perform updates in batches to avoid overwhelming the connection
            const updates = messages.map(msg => {
                const deletedBy = msg.deleted_by || []
                if (!deletedBy.includes(userId)) {
                    return supabase
                        .from('messages')
                        .update({ deleted_by: [...deletedBy, userId] })
                        .eq('id', msg.id)
                }
                return null
            }).filter(Boolean)

            await Promise.all(updates as any)
        }
    },

    async deleteConversation(conversationId: string, userId: string) {
        // WhatsApp Style: Delete chat for me (clear messages and remove membership)
        try {
            await this.clearMessages(conversationId, userId)
        } catch (err) {
            console.error("Error clearing messages during conversation delete:", err)
        }

        const { error } = await supabase
            .from('conversation_members')
            .delete()
            .eq('conversation_id', conversationId)
            .eq('user_id', userId)

        if (error) throw error
    },

    async blockUser(userId: string, blockedUserId: string) {
        const { error } = await supabase
            .from('blocked_users')
            .insert([{ user_id: userId, blocked_user_id: blockedUserId }])
        if (error) throw error
    },

    async unblockUser(userId: string, blockedUserId: string) {
        const { error } = await supabase
            .from('blocked_users')
            .delete()
            .eq('user_id', userId)
            .eq('blocked_user_id', blockedUserId)
        if (error) throw error
    },

    async getSharedMedia(conversationId: string) {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .in('type', ['image', 'doc', 'video'])
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    },

    async getBlockedUsers(userId: string) {
        const { data, error } = await supabase
            .from('blocked_users')
            .select('blocked_user_id')
            .eq('user_id', userId)

        if (error) throw error
        return data.map(row => row.blocked_user_id)
    },

    async isUserBlocked(userId: string, otherUserId: string) {
        const { data, error } = await supabase
            .from('blocked_users')
            .select('*')
            .or(`and(user_id.eq.${userId},blocked_user_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},blocked_user_id.eq.${userId})`)

        if (error) return false
        return data && data.length > 0
    },

    subscribeToMessages(conversationId: string, callback: (payload: any) => void) {
        return supabase
            .channel(`messages:${conversationId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`
            }, callback)
            .subscribe()
    },

    subscribeToPresence(conversationId: string, userId: string, onSync: (state: any) => void) {
        const channel = supabase.channel(`presence:${conversationId}`, {
            config: {
                presence: {
                    key: userId,
                },
            },
        })

        channel
            .on('presence', { event: 'sync' }, () => {
                onSync(channel.presenceState())
            })
            .on('presence', { event: 'join' }, () => {
                onSync(channel.presenceState())
            })
            .on('presence', { event: 'leave' }, () => {
                onSync(channel.presenceState())
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        online_at: new Date().toISOString(),
                        user_id: userId
                    })
                }
            })

        return channel
    },

    activePresenceChannel: null as any,
    activeTypingChannels: {} as Record<string, any>,

    async sendTypingStatus(conversationId: string, userId: string, isTyping: boolean) {
        let channel = this.activeTypingChannels[conversationId]

        if (!channel) {
            channel = supabase.channel(`typing:${conversationId}`)
            this.activeTypingChannels[conversationId] = channel

            return new Promise((resolve) => {
                channel.subscribe((status: string) => {
                    if (status === 'SUBSCRIBED') {
                        channel.send({
                            type: 'broadcast',
                            event: 'typing',
                            payload: { userId, isTyping },
                        })
                        resolve(true)
                    }
                })
            })
        }

        return channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId, isTyping },
        })
    },

    subscribeToTyping(conversationId: string, callback: (payload: any) => void) {
        return supabase
            .channel(`typing:${conversationId}`)
            .on('broadcast', { event: 'typing' }, callback)
            .subscribe()
    },

    subscribeToGlobalPresence(userId: string, onSync: (userIds: string[]) => void) {
        if (this.activePresenceChannel) {
            supabase.removeChannel(this.activePresenceChannel)
        }

        const channel = supabase.channel('global_presence', {
            config: {
                presence: {
                    key: userId,
                },
            },
        })

        this.activePresenceChannel = channel

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState()
                const userIds = Object.keys(state)
                onSync(userIds)
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user_id: userId,
                        online_at: new Date().toISOString(),
                    })
                }
            })

        return channel
    },

    async leaveGlobalPresence() {
        if (this.activePresenceChannel) {
            try {
                await this.activePresenceChannel.untrack()
                supabase.removeChannel(this.activePresenceChannel)
                this.activePresenceChannel = null
            } catch (err) {
                console.error("Error leaving global presence:", err)
            }
        }

        // Also clean up typing channels
        Object.values(this.activeTypingChannels).forEach(channel => {
            supabase.removeChannel(channel)
        })
        this.activeTypingChannels = {}
    }
}