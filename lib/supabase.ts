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
  alias: string | null; // Auto-generated alias like "DongPH1" for duplicate first names
  status: 'active' | 'winner' | 'eliminated';
  prize_rank: number | null;
  created_at: string;
}

// Helper function to generate alias from full name: "Phạm Hoàng Đông" -> "DongPH"
function generateAliasFromName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return fullName;

  // Last part is the first name (Vietnamese naming convention)
  const firstName = parts[parts.length - 1];

  // Get initials from other parts (family name + middle names)
  const initials = parts.slice(0, -1).map(part => part.charAt(0).toUpperCase()).join('');

  return firstName + initials;
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

// Add a new participant with auto-generated alias
// Returns success with data including alias info for display
export async function addParticipant(name: string): Promise<{
  success: true;
  data: Participant;
  aliasInfo: { alias: string; isDuplicate: boolean }
} | {
  success: false;
  error: 'unknown'
}> {
  // Generate base alias
  const baseAlias = generateAliasFromName(name);

  // Check if this alias already exists, if so add a number suffix
  const { data: existingAliases } = await supabase
    .from('participants')
    .select('alias')
    .ilike('alias', `${baseAlias}%`);

  let finalAlias = baseAlias;
  let isDuplicate = false;

  if (existingAliases && existingAliases.length > 0) {
    isDuplicate = true;
    // Find the highest number suffix
    let maxNum = 0;
    existingAliases.forEach(p => {
      if (p.alias) {
        const match = p.alias.match(new RegExp(`^${baseAlias}(\\d+)?$`, 'i'));
        if (match) {
          const num = match[1] ? parseInt(match[1]) : 1;
          maxNum = Math.max(maxNum, num);
        }
      }
    });
    finalAlias = `${baseAlias}${maxNum + 1}`;
  }

  const { data, error } = await supabase
    .from('participants')
    .insert([{ name, alias: finalAlias, status: 'active' }])
    .select()
    .single();

  if (error) {
    console.error('Error adding participant:', error);
    return { success: false, error: 'unknown' };
  }
  return {
    success: true,
    data,
    aliasInfo: { alias: finalAlias, isDuplicate }
  };
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
