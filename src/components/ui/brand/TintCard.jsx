import Link from "next/link";
import Surface from "./Surface";
export default function TintCard({ number, title, description, href, tint = "from-[#eef2ff] to-[#e8f8f5]", className = "" }) {
  return <Link href={href} className="block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-transit-500"><Surface as="div" className={`h-full bg-gradient-to-br ${tint} p-4 ${className}`}><span className="font-mono text-[10px] font-bold text-transit-500">{number} <span className="text-slate-400">/ 03</span></span><h3 className="mt-2 text-sm font-bold text-ink">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-600">{description}</p></Surface></Link>;
}
