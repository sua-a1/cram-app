import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/server/supabase';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Update the template
    const { data: template, error: templateError } = await serviceClient
      .from('ticket_message_templates')
      .update({
        name: data.name,
        content: data.content,
        category: data.category,
        is_shared: data.is_shared,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('org_id', profile.org_id) // Ensure template belongs to user's org
      .select()
      .single();

    if (templateError) {
      return NextResponse.json(
        { error: `Failed to update template: ${templateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error in PUT /api/templates/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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

    // Delete the template
    const { error: deleteError } = await serviceClient
      .from('ticket_message_templates')
      .delete()
      .eq('id', params.id)
      .eq('org_id', profile.org_id); // Ensure template belongs to user's org

    if (deleteError) {
      return NextResponse.json(
        { error: `Failed to delete template: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/templates/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
