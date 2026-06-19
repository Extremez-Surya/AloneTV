import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check executing user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch payments log
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, payments });
  } catch (error: any) {
    console.error('Admin payments GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payments data log' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check executing user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, email, amount, plan_type, status = 'success' } = body;

    if (!email || !amount || !plan_type) {
      return NextResponse.json({ error: 'Missing payment fields (email, amount, plan_type)' }, { status: 400 });
    }

    // Create payment entry
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        user_id: userId || null,
        email,
        amount,
        plan_type,
        status
      })
      .select()
      .single();

    if (error) throw error;

    // Automatically enable user premium on a successful checkout simulation
    if (status === 'success' && userId) {
      await supabase
        .from('profiles')
        .update({ is_premium: true })
        .eq('id', userId);
    }

    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    console.error('Admin payments POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to log simulated payment' },
      { status: 500 }
    );
  }
}
