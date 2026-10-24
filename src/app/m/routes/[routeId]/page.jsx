import AppPlaceholder from "@/components/app/AppPlaceholder";

export default function MobileRouteDetailPage({ params }) {
  return <AppPlaceholder title="Route details" description={`View stops and buses for route ${params.routeId}.`} />;
}
