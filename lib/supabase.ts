import { createClient, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

export interface Participant {
  id: string;
  name: string;
  status: 'active' | 'winner' | 'eliminated';
  prize_rank: number | null;
  created_at: string;
}

// Fetch all participants
export async function getParticipants(): Promise<Participant[]> {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching participants:', error);
    return [];
  }
  return data || [];
}

// Add a new participant (returns error if name already exists)
export async function addParticipant(name: string): Promise<{ success: true; data: Participant } | { success: false; error: 'duplicate' | 'unknown' }> {
  // Check if name already exists (case-insensitive)
  const { data: existing } = await supabase
    .from('participants')
    .select('id')
    .ilike('name', name)
    .limit(1);

  if (existing && existing.length > 0) {
    return { success: false, error: 'duplicate' };
  }

  const { data, error } = await supabase
    .from('participants')
    .insert([{ name, status: 'active' }])
    .select()
    .single();

  if (error) {
    console.error('Error adding participant:', error);
    return { success: false, error: 'unknown' };
  }
  return { success: true, data };
}

// Update participant as winner
export async function setWinner(id: string, prizeRank: number): Promise<boolean> {
  const { error } = await supabase
    .from('participants')
    .update({ status: 'winner', prize_rank: prizeRank })
    .eq('id', id);

  if (error) {
    console.error('Error setting winner:', error);
    return false;
  }
  return true;
}

// Update participant name
export async function updateParticipantName(id: string, newName: string): Promise<boolean> {
  // Check if new name already exists
  const { data: existing } = await supabase
    .from('participants')
    .select('id')
    .ilike('name', newName)
    .neq('id', id)
    .limit(1);

  if (existing && existing.length > 0) {
    return false; // Name already taken by another participant
  }

  const { error } = await supabase
    .from('participants')
    .update({ name: newName })
    .eq('id', id);

  if (error) {
    console.error('Error updating participant name:', error);
    return false;
  }
  return true;
}

// Delete a single participant
export async function deleteParticipant(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('participants')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting participant:', error);
    return false;
  }
  return true;
}

// Reset all participants for a new game
export async function resetGame(): Promise<boolean> {
  const { data, error } = await supabase
    .from('participants')
    .update({ status: 'active', prize_rank: null })
    .not('id', 'is', null)
    .select();

  if (error) {
    console.error('Error resetting game:', error.message, error.code, error.details);
    return false;
  }
  console.log('Reset game successful, updated:', data?.length, 'participants');
  return true;
}

// Delete all participants
export async function clearAllParticipants(): Promise<boolean> {
  const { error } = await supabase
    .from('participants')
    .delete()
    .not('id', 'is', null);

  if (error) {
    console.error('Error clearing participants:', error);
    return false;
  }
  return true;
}

type RealtimeCallback = {
  onInsert?: (participant: Participant) => void;
  onUpdate?: (participant: Participant) => void;
  onDelete?: (participant: Participant) => void;
  onAny?: () => void;
};

// Subscribe to real-time participant changes with direct payload handling
export function subscribeToParticipantsRealtime(callbacks: RealtimeCallback) {
  const channel = supabase
    .channel('participants-realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'participants'
      },
      (payload: RealtimePostgresChangesPayload<Participant>) => {
        console.log('🆕 New participant:', payload.new);
        if (callbacks.onInsert && payload.new) {
          callbacks.onInsert(payload.new as Participant);
        }
        callbacks.onAny?.();
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'participants'
      },
      (payload: RealtimePostgresChangesPayload<Participant>) => {
        console.log('✏️ Updated participant:', payload.new);
        if (callbacks.onUpdate && payload.new) {
          callbacks.onUpdate(payload.new as Participant);
        }
        callbacks.onAny?.();
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'participants'
      },
      (payload: RealtimePostgresChangesPayload<Participant>) => {
        console.log('🗑️ Deleted participant:', payload.old);
        if (callbacks.onDelete && payload.old) {
          callbacks.onDelete(payload.old as Participant);
        }
        callbacks.onAny?.();
      }
    )
    .subscribe((status) => {
      console.log('📡 Realtime subscription status:', status);
    });

  return () => {
    console.log('🔌 Unsubscribing from realtime...');
    supabase.removeChannel(channel);
  };
}

// Legacy function for backward compatibility
export function subscribeToParticipants(callback: (participants: Participant[]) => void) {
  const channel = supabase
    .channel('participants-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'participants'
      },
      async () => {
        const participants = await getParticipants();
        callback(participants);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Game events channel for lock/unlock checkin and wheel sync
export interface GameEvent {
  type: 'checkin_locked' | 'checkin_unlocked' | 'game_reset' | 'winner_announced' | 'wheel_spinning' | 'countdown_start';
  data?: {
    winnerName?: string;
    prizeRank?: number;
    spinTrigger?: number;
    targetRotation?: number;
    countdownSeconds?: number;
  };
}

// Subscribe to game events (broadcast channel)
export function subscribeToGameEvents(callback: (event: GameEvent) => void) {
  const channel = supabase
    .channel('game-events')
    .on('broadcast', { event: 'game_event' }, (payload) => {
      console.log('🎮 Game event received:', payload);
      if (payload.payload) {
        callback(payload.payload as GameEvent);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Broadcast a game event
export async function broadcastGameEvent(event: GameEvent) {
  const channel = supabase.channel('game-events');

  // Wait for channel to be subscribed before sending
  await new Promise<void>((resolve) => {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        resolve();
      }
    });
  });

  const result = await channel.send({
    type: 'broadcast',
    event: 'game_event',
    payload: event
  });

  console.log('📡 Broadcasted game event:', event, 'Result:', result);

  // Keep channel alive briefly to ensure message is sent
  setTimeout(() => {
    supabase.removeChannel(channel);
  }, 1000);
}
