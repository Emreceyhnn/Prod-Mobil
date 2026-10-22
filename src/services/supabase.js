import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Supabase URL/KEY bulunamadı. .env dosyasında EXPO_PUBLIC_SUPABASE_URL ve EXPO_PUBLIC_SUPABASE_KEY tanımlı olmalı."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Supabase'in ham "Network request failed" / "fetch failed" hatalarını
 * kullanıcıya anlamlı bir Türkçe mesaja çevirir. Diğer hatalar (RLS,
 * constraint vb.) olduğu gibi döner.
 */
export function toFriendlyDbError(error) {
  if (!error) return error;
  const message = error.message || String(error);
  if (/network request failed|fetch failed|failed to fetch/i.test(message)) {
    return new Error("Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.");
  }
  return error instanceof Error ? error : new Error(message);
}
