"use client";
// Login provider for the web. Only this file and feed.ts know it's Supabase.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return client;
}

/** Emails a 6-digit login code (and creates the account the first time). */
export async function sendLoginCode(email: string) {
  const { error } = await supabase().auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) throw new Error(error.message);
}

export async function verifyLoginCode(email: string, code: string) {
  const { error } = await supabase().auth.verifyOtp({ email, token: code, type: "email" });
  if (error) throw new Error("That code is wrong or has expired. Request a new one.");
}

export async function getToken(): Promise<string | null> {
  const { data } = await supabase().auth.getSession();
  return data.session?.access_token ?? null;
}

export async function signOut() {
  await supabase().auth.signOut();
}
