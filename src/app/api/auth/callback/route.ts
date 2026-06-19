import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/profile';

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // Successful authentication
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.error('Supabase code exchange error:', error);
    } catch (err) {
      console.error('Failed to exchange code for session:', err);
    }
  }

  // If there's an error, redirect to signin page with error query
  return NextResponse.redirect(`${origin}/signin?error=auth-failed`);
}
