import { supabase } from './client'

export const premiumFeaturesService = {
    // ==================== MESSAGE REACTIONS ====================

    async addReaction(messageId: string, userId: string, emoji: string) {
        const { data, error } = await supabase
            .from('message_reactions')
            .insert({ message_id: messageId, user_id: userId, emoji })
            .select()
            .single()

        if (error) throw error
        return data
    },

    async removeReaction(messageId: string, userId: string, emoji: string) {
        const { error } = await supabase
            .from('message_reactions')
            .delete()
            .match({ message_id: messageId, user_id: userId, emoji })

        if (error) throw error
    },

    async getMessageReactions(messageId: string) {
        const { data, error } = await supabase
            .from('message_reactions')
            .select('*, user:users(id, username, avatar_url)')
            .eq('message_id', messageId)

        if (error) throw error
        return data || []
    },

    // ==================== PINNED MESSAGES ====================

    async pinMessage(conversationId: string, messageId: string, userId: string) {
        const { data, error } = await supabase
            .from('pinned_messages')
            .insert({
                conversation_id: conversationId,
                message_id: messageId,
                pinned_by: userId
            })
            .select()
            .single()

        if (error) throw error
        return data
    },

    async unpinMessage(conversationId: string, messageId: string) {
        const { error } = await supabase
            .from('pinned_messages')
            .delete()
            .match({ conversation_id: conversationId, message_id: messageId })

        if (error) throw error
    },

    async getPinnedMessages(conversationId: string) {
        const { data, error } = await supabase
            .from('pinned_messages')
            .select(`
                *,
                message:messages(
                    id,
                    content,
                    type,
                    sender_id,
                    created_at,
                    sender:users(username, avatar_url)
                )
            `)
            .eq('conversation_id', conversationId)
            .order('pinned_at', { ascending: false })

        if (error) throw error
        return data || []
    },

    // ==================== SCHEDULED MESSAGES ====================

    async scheduleMessage(conversationId: string, senderId: string, content: string, scheduledFor: Date, type = 'text') {
        const { data, error } = await supabase
            .from('scheduled_messages')
            .insert({
                conversation_id: conversationId,
                sender_id: senderId,
                content,
                type,
                scheduled_for: scheduledFor.toISOString()
            })
            .select()
            .single()

        if (error) throw error
        return data
    },

    async getScheduledMessages(conversationId: string, userId: string) {
        const { data, error } = await supabase
            .from('scheduled_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .eq('sender_id', userId)
            .eq('sent', false)
            .order('scheduled_for', { ascending: true })

        if (error) throw error
        return data || []
    },

    async deleteScheduledMessage(id: string) {
        const { error } = await supabase
            .from('scheduled_messages')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    async updateScheduledMessage(id: string, updates: { content?: string, scheduled_for?: Date }) {
        const updateData: any = {}
        if (updates.content) updateData.content = updates.content
        if (updates.scheduled_for) updateData.scheduled_for = updates.scheduled_for.toISOString()

        const { data, error } = await supabase
            .from('scheduled_messages')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // ==================== MESSAGE DRAFTS ====================

    async saveDraft(conversationId: string, userId: string, content: string) {
        const { data, error } = await supabase
            .from('message_drafts')
            .upsert({
                conversation_id: conversationId,
                user_id: userId,
                content,
                updated_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) throw error
        return data
    },

    async getDraft(conversationId: string, userId: string) {
        const { data, error } = await supabase
            .from('message_drafts')
            .select('*')
            .eq('conversation_id', conversationId)
            .eq('user_id', userId)
            .single()

        if (error && error.code !== 'PGRST116') throw error
        return data
    },

    async deleteDraft(conversationId: string, userId: string) {
        const { error } = await supabase
            .from('message_drafts')
            .delete()
            .match({ conversation_id: conversationId, user_id: userId })

        if (error) throw error
    },

    // ==================== USER THEMES ====================

    async saveTheme(userId: string, theme: string, customColors?: any) {
        const { data, error } = await supabase
            .from('user_themes')
            .upsert({
                user_id: userId,
                theme,
                custom_colors: customColors,
                updated_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) throw error
        return data
    },

    async getTheme(userId: string) {
        const { data, error } = await supabase
            .from('user_themes')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (error && error.code !== 'PGRST116') throw error
        return data || { theme: 'dark', custom_colors: null }
    },

    // ==================== MESSAGE SEARCH ====================

    async searchMessages(conversationId: string, query: string, dateFilter?: { from?: Date, to?: Date }) {
        let queryBuilder = supabase
            .from('messages')
            .select('*, sender:users(username, avatar_url)')
            .eq('conversation_id', conversationId)
            .ilike('content', `%${query}%`)
            .order('created_at', { ascending: false })

        if (dateFilter?.from) {
            queryBuilder = queryBuilder.gte('created_at', dateFilter.from.toISOString())
        }
        if (dateFilter?.to) {
            queryBuilder = queryBuilder.lte('created_at', dateFilter.to.toISOString())
        }

        const { data, error } = await queryBuilder

        if (error) throw error
        return data || []
    }
}
