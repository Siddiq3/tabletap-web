"use client";
// Login provider for the web. Only this file and feed.ts know it's Supabase.
// Logins go through the backend (api.login / api.signup); we just hand the returned session to Supabase,
// which then refreshes the token by itself.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/contract";

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    // detectSessionInUrl: the password-reset email link lands on /reset-password with a recovery session
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}

export async function setSession(s: AuthSession) {
  const { error } = await supabase().auth.setSession({ access_token: s.accessToken, refresh_token: s.refreshToken });
  if (error) throw new Error("Could not log you in. Try again.");
}

export async function getToken(): Promise<string | null> {
  const { data } = await supabase().auth.getSession();
  return data.session?.access_token ?? null;
}

/** Login address of the account on this device; used to re-check the password ("Continue as owner"). */
export async function loginEmail(): Promise<string | null> {
  const { data } = await supabase().auth.getSession();
  return data.session?.user.email ?? null;
}

/** /reset-password: true once the email link's recovery session is in place. */
export async function waitForRecoverySession(): Promise<boolean> {
  for (let i = 0; i < 20; i++) {
    if (await getToken()) return true;
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

export async function updatePassword(password: string) {
  const { error } = await supabase().auth.updateUser({ password });
  if (error) throw new Error("Could not change the password. Open the link from the email again.");
}

export async function signOut() {
  await supabase().auth.signOut();
}
