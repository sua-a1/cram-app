'use server';

import { createServerSupabaseClient } from '@/lib/server/supabase';
import { cookies } from 'next/headers';

interface StorageBucketConfig {
  name: string;
  public: boolean;
  fileSizeLimit: number;
  allowedMimeTypes: string[];
}

const STORAGE_BUCKETS: Record<string, StorageBucketConfig> = {
  'org-documents': {
    name: 'org-documents',
    public: false,
    fileSizeLimit: 52428800, // 50MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown'
    ]
  },
  'public-documents': {
    name: 'public-documents',
    public: true,
    fileSizeLimit: 52428800, // 50MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown'
    ]
  },
  'knowledge-documents': {
    name: 'knowledge-documents',
    public: true,
    fileSizeLimit: 52428800, // 50MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown'
    ]
  }
};

export async function initializeStorage() {
  const cookieStore = cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  try {
    // First check if user has admin privileges
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized: User not authenticated');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (profileError) throw profileError;
    if (profile.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can initialize storage');
    }

    // Simply return success since we'll handle bucket errors during upload
    return { success: true, error: null };
  } catch (error) {
    console.error('Error initializing storage:', error);
    return { success: false, error };
  }
} 
