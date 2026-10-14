import { createFileRoute, Outlet } from "@tanstack/react-router";
import { validateAuthSearch } from "@/lib/auth-redirect";

export const Route = createFileRoute("/cadastro")({
  validateSearch: validateAuthSearch,
  component: () => <Outlet />,
});
