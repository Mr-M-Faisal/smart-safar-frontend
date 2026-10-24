import ProfileScreen from "@/components/app/ProfileScreen";
import { Suspense } from "react";
export default function DesktopProfilePage() { return <Suspense fallback={<div className="app-empty">Loading profile…</div>}><ProfileScreen/></Suspense>; }
