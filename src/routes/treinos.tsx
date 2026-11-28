import { createFileRoute } from "@tanstack/react-router";
import { TreinosPage } from "@/features/partners/pages/TreinosPage";

export const Route = createFileRoute("/treinos")({
  component: TreinosRoute,
});

function TreinosRoute() {
  return <TreinosPage />;
}
