"use client";

import ProfileScreen from "@/components/app/ProfileScreen";
import { Suspense } from "react";

export default function MobileProfilePage() { return <Suspense fallback={<div className="app-screen"><div className="app-empty">Loading profile…</div></div>}><ProfileScreen /></Suspense>; }
