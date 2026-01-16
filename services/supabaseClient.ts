
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// NOTE: Ideally these are in process.env or import.meta.env. 
// For this demo, we check if they exist.
const supabaseUrl = 'https://pfibqddazgugggtrjymr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmaWJxZGRhemd1Z2dndHJqeW1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzg3MTIsImV4cCI6MjA4MzYxNDcxMn0.6yfcoo49-QCiNiZrljIV32OFWWp9XMHgHoWNnoypn78';

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn("Supabase keys not found. Auth will run in MOCK mode.");
}

export { supabase };

export const isSupabaseConfigured = (): boolean => {
  return !!supabase;
};

// Helper function to convert Base64 to Blob
export const base64ToBlob = (base64: string): Blob | null => {
  try {
    const arr = base64.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    console.error("Error converting base64 to blob", e);
    return null;
  }
};

/**
 * Carica un'immagine in formato Base64 nello storage di Supabase
 * @param base64 L'immagine in stringa Base64
 * @param bucket Il nome del bucket storage
 * @param path Il percorso/nome del file nel bucket
 * @returns L'URL pubblico dell'immagine caricata
 */
export const uploadImage = async (base64: string, bucket: string, path: string): Promise<string | null> => {
  if (!supabase) return null;
  
  const blob = base64ToBlob(base64);
  if (!blob) return null;

  const fileName = `${path}-${Date.now()}.png`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, blob, {
      contentType: blob.type,
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error("Error uploading image to storage:", error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return publicUrl;
};
