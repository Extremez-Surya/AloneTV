import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// NOTE: Next.js cache revalidation
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check executing user and verify admin authorization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow either hardcoded superuser email OR DB flag `is_admin=true` (safer for real deployments).
    const isHardcodedAdmin = user.email === 'theextremez2.0@gmail.com';

    let isDbAdmin = false;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();
      isDbAdmin = Boolean(profile?.is_admin);
    } catch {
      // If profiles table doesn't exist, fall back to hardcoded email.
    }

    if (!isHardcodedAdmin && !isDbAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }


    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    if (action === 'clear_payments') {
      // Delete all transaction records in payments table
      const { error } = await supabase
        .from('payments')
        .delete()
        .neq('status', 'nonexistent_status_to_delete_all_rows'); // delete query needs filter to satisfy supabase safety constraints
      
      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Transaction logs deleted successfully.' });
    }

    if (action === 'clear_profiles') {
      // Delete all user profiles except the admin
      const { error } = await supabase
        .from('profiles')
        .delete()
        .neq('email', 'theextremez2.0@gmail.com');
      
      if (error) throw error;
      return NextResponse.json({ success: true, message: 'All user accounts deleted successfully (Admin retained).' });
    }

    if (action === 'clear_settings') {
      // Truncate settings logs
      const { error } = await supabase
        .from('settings')
        .delete()
        .neq('key', 'nonexistent_key_to_delete_all');
      
      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Settings database cleared.' });
    }

    if (action === 'clear_cache') {
      // Best-effort: revalidate key app routes so server components re-fetch.
      // (Supabase/localStorage buffers cannot be purged from server.)
      const targets = [
        '/',
        '/admin',
        '/watch',
        '/watchlist',
        '/profile',
        '/settings',
      ];

      for (const t of targets) {
        try {
          revalidatePath(t);
        } catch (e) {
          // ignore per-target failures
        }
      }

      return NextResponse.json({ success: true, message: 'Cache revalidation triggered (best-effort).' });
    }

    if (action === 'clear_reviews') {
      // Reviews are stored client-side in this project.
      return NextResponse.json({ success: true, message: 'clear_reviews is local-only in this app; client cache cleared by the admin UI.' });
    }

    if (action === 'reset_history') {
      // History/watchlist are stored client-side in this project.
      return NextResponse.json({ success: true, message: 'reset_history is local-only in this app; client cache cleared by the admin UI.' });
    }

    return NextResponse.json({ error: `Invalid action parameter: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('Admin system action error:', error);
    return NextResponse.json(
      { error: error.message || 'System operation failed' },
      { status: 500 }
    );
  }
}
