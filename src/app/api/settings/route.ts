import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Attempt to fetch from settings table in Supabase
    const { data, error } = await supabase
      .from('settings')
      .select('*');
    
    if (error) throw error;
    
    const settingsMap: Record<string, string> = {};
    (data || []).forEach((row: any) => {
      settingsMap[row.key] = row.value;
    });

    return NextResponse.json({
      success: true,
      maintenance_mode: settingsMap['maintenance_mode'] === 'true',
      global_notice: settingsMap['global_notice'] || ''
    });
  } catch (err: any) {
    console.error('Settings GET error:', err);
    // If table settings is missing (e.g. PGRST205 relation does not exist),
    // or database is unconnected, fall back gracefully to empty settings.
    return NextResponse.json({
      success: true,
      maintenance_mode: false,
      global_notice: ''
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.email !== 'theextremez2.0@gmail.com') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { maintenance_mode, global_notice } = body;

    const upserts = [];
    if (maintenance_mode !== undefined) {
      upserts.push({ key: 'maintenance_mode', value: String(maintenance_mode) });
    }
    if (global_notice !== undefined) {
      upserts.push({ key: 'global_notice', value: String(global_notice) });
    }

    if (upserts.length > 0) {
      const { error } = await supabase
        .from('settings')
        .upsert(upserts, { onConflict: 'key' });
        
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Settings POST error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update system settings logs' },
      { status: 500 }
    );
  }
}
