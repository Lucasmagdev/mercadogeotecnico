import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { addFavorite, fetchFavoriteIds, removeFavorite } from "@/lib/queries";

export function useFavoriteIds() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["favorite-ids", session?.user.id],
    queryFn: () => fetchFavoriteIds(session!.user.id),
    enabled: !!session,
  });
}

export function useFavoriteToggle(equipmentId: string) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { data: favoriteIds } = useFavoriteIds();
  const isFavorite = favoriteIds?.has(equipmentId) ?? false;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error("not_authenticated");
      if (isFavorite) await removeFavorite(session.user.id, equipmentId);
      else await addFavorite(session.user.id, equipmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-ids", session?.user.id] });
      queryClient.invalidateQueries({ queryKey: ["favorite-equipment", session?.user.id] });
    },
  });

  return { isFavorite, toggle: mutation.mutate, isPending: mutation.isPending, loggedIn: !!session };
}
