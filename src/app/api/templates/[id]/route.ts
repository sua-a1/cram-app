import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/server/supabase';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const serviceClient = createServiceClient();
    const supabase = await createServerSupabaseClient();

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user's profile with org_id
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('org_id')
      .eq('user_id', session.user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }
    if (!profile?.org_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Verify template exists and belongs to org
    const { data: existingTemplate, error: templateCheckError } = await serviceClient
      .from('ticket_message_templates')
      .select('id')
      .eq('id', params.id)
      .eq('org_id', profile.org_id)
      .single();

    if (templateCheckError) {
      console.error('Template check error:', templateCheckError);
      return NextResponse.json({ error: 'Failed to verify template' }, { status: 500 });
    }
    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
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
      .eq('org_id', profile.org_id)
      .select()
      .single();

    if (templateError) {
      console.error('Template update error:', templateError);
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
    const supabase = await createServerSupabaseClient();

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user's profile with org_id
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('org_id')
      .eq('user_id', session.user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }
    if (!profile?.org_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Verify template exists and belongs to org
    const { data: existingTemplate, error: templateCheckError } = await serviceClient
      .from('ticket_message_templates')
      .select('id')
      .eq('id', params.id)
      .eq('org_id', profile.org_id)
      .single();

    if (templateCheckError) {
      console.error('Template check error:', templateCheckError);
      return NextResponse.json({ error: 'Failed to verify template' }, { status: 500 });
    }
    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Delete the template
    const { error: deleteError } = await serviceClient
      .from('ticket_message_templates')
      .delete()
      .eq('id', params.id)
      .eq('org_id', profile.org_id);

    if (deleteError) {
      console.error('Template delete error:', deleteError);
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
