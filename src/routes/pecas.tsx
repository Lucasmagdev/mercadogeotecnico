import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/pecas")({
  component: () => <Outlet />,
});
