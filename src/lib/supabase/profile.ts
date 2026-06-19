import { createClient } from './client';

export interface UserProfile {
  id: string;
  username: string;
  is_premium: boolean;
  is_admin: boolean;
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
          is_premium: false,
          is_admin: false,
          email: user.email
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
          is_premium: false,
          is_admin: false,
          email: user.email
        };
      }
    }

    const isUserAdmin = user.email === 'theextremez2.0@gmail.com';
    const emailNeedsUpdate = !profile.email || profile.email !== user.email;
    
    // Auto-align database profile row with the permanent admin rule and sync email
    if (profile && (Boolean(profile.is_admin) !== isUserAdmin || emailNeedsUpdate)) {
      try {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({ 
            is_admin: isUserAdmin,
            email: user.email 
          })
          .eq('id', user.id)
          .select()
          .single();
        
        if (!updateError && updatedProfile) {
          profile = updatedProfile;
        }
      } catch (dbErr) {
        console.error('Failed to sync DB admin role/email status:', dbErr);
      }
    }

    const fullProfile: UserProfile = {
      id: profile.id,
      username: profile.username,
      is_premium: Boolean(profile.is_premium),
      is_admin: isUserAdmin,
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
        
        // Also sync inside the mock profiles list if it exists
        syncDemoMockProfiles(parsed);
        
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
      is_admin: Boolean(updatedProfile.is_admin),
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
 * Helper to update admin status (mainly for manual testing in settings)
 */
export async function updateAdminStatus(isAdmin: boolean): Promise<UserProfile | null> {
  if (typeof window === 'undefined') return null;

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const stored = localStorage.getItem('alonetv_user');
      if (stored) {
        const parsed: UserProfile = JSON.parse(stored);
        parsed.is_admin = isAdmin;
        localStorage.setItem('alonetv_user', JSON.stringify(parsed));
        window.dispatchEvent(new Event('alonetv_user_changed'));
        
        syncDemoMockProfiles(parsed);
        
        return parsed;
      }
      return null;
    }

    const isUserAdmin = user.email === 'theextremez2.0@gmail.com';
    const finalIsAdmin = isUserAdmin ? isAdmin : false;

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({ is_admin: finalIsAdmin })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    const fullProfile: UserProfile = {
      id: updatedProfile.id,
      username: updatedProfile.username,
      is_premium: Boolean(updatedProfile.is_premium),
      is_admin: isUserAdmin && Boolean(updatedProfile.is_admin),
      created_at: updatedProfile.created_at,
      email: user.email,
      demo: false
    };

    localStorage.setItem('alonetv_user', JSON.stringify(fullProfile));
    window.dispatchEvent(new Event('alonetv_user_changed'));

    return fullProfile;
  } catch (err) {
    console.error('Failed to update admin status:', err);
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

/**
 * Syncs demo profile status changes back into the simulated mock profiles list.
 */
function syncDemoMockProfiles(updatedUser: UserProfile) {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem('alonetv_mock_profiles');
    if (stored) {
      const list: UserProfile[] = JSON.parse(stored);
      const idx = list.findIndex(u => u.id === updatedUser.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updatedUser };
        localStorage.setItem('alonetv_mock_profiles', JSON.stringify(list));
      }
    }
  } catch (e) {
    console.error('Failed to sync demo mock profiles list:', e);
  }
}

/* =========================================================================
   ADMIN ACTIONS (DB + Local Fallback Mocks)
   ========================================================================= */

/**
 * Admin action: Fetch all user profiles (with Demo Mode fallback)
 */
export async function fetchProfiles(): Promise<UserProfile[]> {
  if (typeof window !== 'undefined') {
    const localUser = getLocalProfile();
    if (localUser?.demo) {
      let mockList = localStorage.getItem('alonetv_mock_profiles');
      if (!mockList) {
        const initialMocks: UserProfile[] = [
          { id: 'demo-user-id', username: 'Demo Watcher (You)', email: 'demo@example.com', is_premium: localUser.is_premium, is_admin: localUser.is_admin, created_at: new Date().toISOString(), demo: true },
          { id: 'mock-user-1', username: 'Sarah Jenkins', email: 'sarah.j@example.com', is_premium: true, is_admin: false, created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), demo: true },
          { id: 'mock-user-2', username: 'Alex Mercer', email: 'alex.m@example.com', is_premium: false, is_admin: false, created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(), demo: true },
          { id: 'mock-user-3', username: 'David Miller', email: 'david.miller@example.com', is_premium: true, is_admin: false, created_at: new Date(Date.now() - 3600000 * 24 * 14).toISOString(), demo: true },
          { id: 'mock-user-4', username: 'Jessica Rabbit', email: 'jessica@example.rabbit', is_premium: false, is_admin: false, created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(), demo: true }
        ];
        localStorage.setItem('alonetv_mock_profiles', JSON.stringify(initialMocks));
        return initialMocks;
      }
      return JSON.parse(mockList);
    }
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map((p: any) => ({
      id: p.id,
      username: p.username,
      is_premium: Boolean(p.is_premium),
      is_admin: Boolean(p.is_admin),
      created_at: p.created_at,
      email: p.email // Note: Auth email lookup may require admin/rpc settings, fallbacks exist
    }));
  } catch (err) {
    console.error('Failed to fetch user profiles for admin:', err);
    return [];
  }
}

/**
 * Admin action: Toggle premium status for a user
 */
export async function adminTogglePremium(userId: string, isPremium: boolean): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const localUser = getLocalProfile();
    if (localUser?.demo) {
      // Handle Demo Mode
      try {
        const stored = localStorage.getItem('alonetv_mock_profiles');
        if (stored) {
          const list: UserProfile[] = JSON.parse(stored);
          const updated = list.map(u => u.id === userId ? { ...u, is_premium: isPremium } : u);
          localStorage.setItem('alonetv_mock_profiles', JSON.stringify(updated));
          
          // If we upgraded "ourselves", sync the main user state
          if (userId === localUser.id) {
            localUser.is_premium = isPremium;
            localStorage.setItem('alonetv_user', JSON.stringify(localUser));
            window.dispatchEvent(new Event('alonetv_user_changed'));
          }
          return true;
        }
      } catch (err) {
        console.error(err);
      }
      return false;
    }
  }

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ is_premium: isPremium })
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to update user premium status as admin:', err);
    return false;
  }
}

/**
 * Admin action: Toggle admin status for a user
 */
export async function adminToggleAdmin(userId: string, isAdmin: boolean): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const localUser = getLocalProfile();
    if (localUser?.demo) {
      // Handle Demo Mode
      try {
        const stored = localStorage.getItem('alonetv_mock_profiles');
        if (stored) {
          const list: UserProfile[] = JSON.parse(stored);
          const updated = list.map(u => u.id === userId ? { ...u, is_admin: isAdmin } : u);
          localStorage.setItem('alonetv_mock_profiles', JSON.stringify(updated));
          
          // If we modified "ourselves", sync main user state
          if (userId === localUser.id) {
            localUser.is_admin = isAdmin;
            localStorage.setItem('alonetv_user', JSON.stringify(localUser));
            window.dispatchEvent(new Event('alonetv_user_changed'));
          }
          return true;
        }
      } catch (err) {
        console.error(err);
      }
      return false;
    }
  }

  // Reject promoting any other user account to admin
  if (isAdmin) {
    console.warn('Security alert: Promotion of arbitrary users to admin status is disabled.');
    return false;
  }

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: false })
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to demote user admin status:', err);
    return false;
  }
}

/**
 * Admin action: Delete a user profile row
 */
export async function adminDeleteUser(userId: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const localUser = getLocalProfile();
    if (localUser?.demo) {
      try {
        const stored = localStorage.getItem('alonetv_mock_profiles');
        if (stored) {
          const list: UserProfile[] = JSON.parse(stored);
          const updated = list.filter(u => u.id !== userId);
          localStorage.setItem('alonetv_mock_profiles', JSON.stringify(updated));
          
          // If we deleted "ourselves", sign out
          if (userId === localUser.id) {
            localStorage.removeItem('alonetv_user');
            window.dispatchEvent(new Event('alonetv_user_changed'));
            window.location.href = '/';
          }
          return true;
        }
      } catch (err) {
        console.error(err);
      }
      return false;
    }
  }

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to delete user profile row as admin:', err);
    return false;
  }
}
