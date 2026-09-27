"use client";

import { useEffect, useState } from "react";
import SharedTripViewer from "@/components/safety/SharedTripViewer";

export default function SharedTripPage() {
  const [shareToken, setShareToken] = useState("");
  useEffect(() => {
    setShareToken(new URLSearchParams(window.location.search).get("token") || "");
  }, []);
  return <SharedTripViewer shareToken={shareToken}/>;
}
