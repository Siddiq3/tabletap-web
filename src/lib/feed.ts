"use client";
// Live order signal. Swap this file to use AWS AppSync / API Gateway WebSockets later;
// the board only needs "something changed" and reloads from the API.
import { supabase } from "./auth";

export function subscribeToOrders(restaurantId: string, onChange: () => void, scope = "orders"): () => void {
  const channel = supabase()
    .channel(`${scope}:${restaurantId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "staff_calls", filter: `restaurant_id=eq.${restaurantId}` }, onChange)
    .subscribe();
  return () => {
    void supabase().removeChannel(channel);
  };
}
