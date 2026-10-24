"use client";

import { useEffect, useMemo, useState } from "react";
import qr from "@/lib/pwa/qrCode.cjs";

export default function QrCode({ value }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const matrix = useMemo(() => ready ? qr.createQrMatrix(value) : null, [ready, value]);
  if (!matrix) return <span aria-hidden="true" className="mx-auto block h-44 w-44 rounded-xl bg-white"/>;
  const cells = [];
  matrix.forEach((row, y) => row.forEach((dark, x) => { if (dark) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />); }));
  return <svg role="img" aria-label="QR code to open the Smart Safar app" viewBox="-4 -4 41 41" className="mx-auto h-44 w-44 rounded-xl bg-white p-3 text-[#172449]" shapeRendering="crispEdges">{cells}</svg>;
}
