import { supabase } from './client'

export const callService = {
    async initiateCall(callerId: string, receiverId: string, type: 'voice' | 'video') {
        const { data, error } = await supabase
            .from('calls')
            .insert([{
                caller_id: callerId,
                receiver_id: receiverId,
                type,
                status: 'ringing'
            }])
            .select()
            .single()

        if (error) throw error
        return data
    },

    async updateCallStatus(callId: string, status: 'connected' | 'ended' | 'rejected') {
        const { error } = await supabase
            .from('calls')
            .update({ status })
            .eq('id', callId)

        if (error) throw error
    },

    subscribeToCalls(userId: string, onIncomingCall: (payload: any) => void) {
        return supabase
            .channel(`user_calls:${userId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'calls',
                filter: `receiver_id=eq.${userId}`
            }, (payload) => {
                onIncomingCall(payload.new)
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'calls',
                filter: `receiver_id=eq.${userId}`
            }, (payload) => {
                onIncomingCall(payload.new)
            })
            .subscribe()
    },

    subscribeToSignaling(callId: string, onSignal: (payload: any) => void) {
        return supabase
            .channel(`call_signaling:${callId}`)
            .on('broadcast', { event: 'signal' }, (payload) => {
                onSignal(payload.payload)
            })
            .subscribe()
    },

    async sendSignal(callId: string, signalData: any) {
        await supabase
            .channel(`call_signaling:${callId}`)
            .send({
                type: 'broadcast',
                event: 'signal',
                payload: signalData
            })
    }
}