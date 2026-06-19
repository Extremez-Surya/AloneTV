import { createClient } from './client';

export interface UserProfile {
  id: string;
  username: string;
  is_premium: boolean;
  created_at?: string;
  email?: string;
  demo?: boolean;
}

/**
 * Safely fetches or creates a user profile row in Supabase for the currently authenticated user.
 * Syncs the state to localStorage so the client app behaves consistently.
 */
export async function syncUserProfile(): Promise<UserProfile | null> {
  if (typeof window === 'undefined') return null;

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Not logged into Supabase. Check if we have a demo session.
      const stored = localStorage.getItem('alonetv_user');
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    }

    // Try fetching the existing profile row
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // If profile doesn't exist (e.g. fresh Magic Link signup), create it
    if (error || !profile) {
      const username = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Watcher';
      
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username,
          is_premium: false
        })
        .select()
        .single();

      if (!insertError && newProfile) {
        profile = newProfile;
      } else {
        console.error('Failed to auto-create user profile row:', insertError);
        // Fallback profile object
        profile = {
          id: user.id,
          username,
          is_premium: false
        };
      }
    }

    const fullProfile: UserProfile = {
      id: profile.id,
      username: profile.username,
      is_premium: Boolean(profile.is_premium),
      created_at: profile.created_at,
      email: user.email,
      demo: false
    };

    // Save to localStorage for quick client access across components
    localStorage.setItem('alonetv_user', JSON.stringify(fullProfile));
    
    // Dispatch event to notify layout headers/views
    window.dispatchEvent(new Event('alonetv_user_changed'));

    return fullProfile;
  } catch (err) {
    console.error('Error syncing user profile:', err);
    return null;
  }
}

/**
 * Updates the user's premium status in both Supabase and localStorage.
 */
export async function updatePremiumStatus(isPremium: boolean): Promise<UserProfile | null> {
  if (typeof window === 'undefined') return null;

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // In Demo Mode, update locally
      const stored = localStorage.getItem('alonetv_user');
      if (stored) {
        const parsed: UserProfile = JSON.parse(stored);
        parsed.is_premium = isPremium;
        localStorage.setItem('alonetv_user', JSON.stringify(parsed));
        window.dispatchEvent(new Event('alonetv_user_changed'));
        return parsed;
      }
      return null;
    }

    // Update in Supabase profiles database table
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({ is_premium: isPremium })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const fullProfile: UserProfile = {
      id: updatedProfile.id,
      username: updatedProfile.username,
      is_premium: Boolean(updatedProfile.is_premium),
      created_at: updatedProfile.created_at,
      email: user.email,
      demo: false
    };

    localStorage.setItem('alonetv_user', JSON.stringify(fullProfile));
    window.dispatchEvent(new Event('alonetv_user_changed'));

    return fullProfile;
  } catch (err) {
    console.error('Failed to update premium status:', err);
    return null;
  }
}

/**
 * Local helper to synchronously read current user state from localStorage
 */
export function getLocalProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('alonetv_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
