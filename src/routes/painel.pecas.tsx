import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/painel/pecas")({
  component: () => <Outlet />,
});
