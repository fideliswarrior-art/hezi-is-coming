import { createFileRoute } from "@tanstack/react-router";
import { PartnerHubPage } from "@/features/partners/pages/PartnerHubPage";

export const Route = createFileRoute("/circuito/$slug")({
  component: CircuitoRouteComponent,
});

function CircuitoRouteComponent() {
  const { slug } = Route.useParams();
  return <PartnerHubPage slug={slug} />;
}
