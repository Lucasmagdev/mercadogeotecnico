import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, Trash2, Lock, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth-provider";
import { deleteReview, fetchCompanyReviews, upsertReview } from "@/lib/queries";
import { cn } from "@/lib/utils";

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("flex items-center gap-0.5", className)} aria-label={`${value} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "h-4 w-4",
            n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
          )}
        />
      ))}
    </span>
  );
}

export function CompanyReviews({
  companyId,
  ownerId,
  companySlug,
}: {
  companyId: string;
  ownerId: string;
  companySlug: string;
}) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user.id;
  const isOwner = userId === ownerId;

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", companyId],
    queryFn: () => fetchCompanyReviews(companyId),
  });

  const myReview = reviews.find((r) => r.author_id === userId);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  function startEdit() {
    setRating(myReview?.rating ?? 0);
    setComment(myReview?.comment ?? "");
    setEditing(true);
    setError("");
  }

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["reviews", companyId] });
    queryClient.invalidateQueries({ queryKey: ["company", companySlug] });
    queryClient.invalidateQueries({ queryKey: ["companies-approved"] });
  }

  const save = useMutation({
    mutationFn: () => upsertReview(companyId, rating, comment.trim()),
    onSuccess: () => {
      setEditing(false);
      refresh();
    },
    onError: () => setError("Não foi possível salvar a avaliação. Tente novamente."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onSuccess: refresh,
  });

  const showForm = editing || (!myReview && session && !isOwner);

  return (
    <div className="space-y-6">
      {/* Form */}
      {!session ? (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          <Link
            to="/entrar"
            className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
          >
            <Lock className="h-4 w-4" /> Entre
          </Link>{" "}
          para avaliar esta empresa.
        </div>
      ) : isOwner ? (
        <p className="text-sm text-muted-foreground">Você não pode avaliar a própria empresa.</p>
      ) : showForm ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="font-semibold">{myReview ? "Editar sua avaliação" : "Avaliar empresa"}</p>
          <div
            className="mt-3 flex items-center gap-1"
            role="radiogroup"
            aria-label="Nota de 1 a 5"
            onMouseLeave={() => setHoverRating(0)}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                onMouseEnter={() => setHoverRating(n)}
                onClick={() => setRating(n)}
              >
                <Star
                  className={cn(
                    "h-7 w-7 transition-colors",
                    n <= (hoverRating || rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/40",
                  )}
                />
              </button>
            ))}
          </div>
          <Textarea
            rows={3}
            className="mt-3"
            placeholder="Conte como foi sua experiência com esta empresa (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          <div className="mt-3 flex gap-2">
            <Button disabled={rating === 0 || save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? "Salvando..." : "Publicar avaliação"}
            </Button>
            {myReview && (
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            )}
          </div>
        </div>
      ) : myReview ? (
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3 text-sm">
            <Stars value={myReview.rating} />
            <span className="text-muted-foreground">Sua avaliação</span>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={startEdit}>
              <Pencil className="h-3.5 w-3.5" /> Editar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive"
              disabled={remove.isPending}
              onClick={() => remove.mutate(myReview.id)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Excluir
            </Button>
          </div>
        </div>
      ) : null}

      {/* List */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando avaliações...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma avaliação publicada ainda. Seja o primeiro a avaliar.
        </p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                  {r.author_name.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-semibold">{r.author_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Stars value={r.rating} />
                    <span>
                      {new Date(r.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
              {r.comment && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.comment}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
