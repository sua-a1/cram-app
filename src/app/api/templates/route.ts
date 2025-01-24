import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/server/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const serviceClient = createServiceClient();
    const supabase = createServerSupabaseClient();

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user's profile with org_id
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('org_id')
      .eq('user_id', session.user.id)
      .single();

    if (profileError || !profile?.org_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Create the template
    const { data: template, error: templateError } = await serviceClient
      .from('ticket_message_templates')
      .insert({
        name: data.name,
        content: data.content,
        category: data.category,
        is_shared: data.is_shared,
        org_id: profile.org_id,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (templateError) {
      return NextResponse.json(
        { error: `Failed to create template: ${templateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error in POST /api/templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
