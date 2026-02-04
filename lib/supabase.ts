import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for Supabase operations
export const uploadPhotoToSupabase = async (
  file: File,
  schoolUuid: string,
  userUuid: string
): Promise<string> => {
  const fileName = `${schoolUuid}/${userUuid}/${Date.now()}-${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('photos')
    .upload(fileName, file);

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return data.path;
};

export const getPhotoUrl = (path: string): string => {
  const { data } = supabase.storage
    .from('photos')
    .getPublicUrl(path);

  return data.publicUrl;
};

export const deletePhotoFromSupabase = async (path: string): Promise<void> => {
  const { error } = await supabase.storage
    .from('photos')
    .remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
};
