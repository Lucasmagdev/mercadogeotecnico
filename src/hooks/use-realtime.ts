import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * Subscribes to postgres_changes (RLS-aware) and invalidates the matching
 * react-query caches, replacing the old short-interval polling.
 */
export function useRealtimeMessages(userId: string | undefined, conversationId?: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`messages-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const convId = (payload.new as { conversation_id?: string }).conversation_id;
          queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
          if (convId) queryClient.invalidateQueries({ queryKey: ["messages", convId] });
        },
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () =>
        queryClient.invalidateQueries({ queryKey: ["conversations", userId] }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // conversationId intentionally not in deps: the channel covers all conversations.
  }, [userId, queryClient]);
}

export function useRealtimeNotifications(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: ["notifications", userId] }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
