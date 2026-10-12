import dynamic from "next/dynamic";

const LiveMapExperience = dynamic(() => import("@/components/map/LiveMapExperience"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[70vh] w-full bg-[#f4f5fb] px-4 py-8 sm:px-8 sm:py-12 lg:px-12 flex items-center justify-center">
      <div className="h-[60vh] min-h-[420px] w-full max-w-[1440px] rounded-[1.75rem] bg-[#e6e9f4] animate-pulse" />
    </div>
  ),
});

export default function LiveMapPage() {
  return (
    <div className="h-full w-full">
      <LiveMapExperience />
    </div>
  );
}
