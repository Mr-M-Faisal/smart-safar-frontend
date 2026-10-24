import Link from "next/link";

export default function NotFound() {
  return <main className="grid min-h-[60vh] place-items-center bg-[#f4f5fb] px-5 py-12 text-[#293553]"><section className="w-full max-w-lg rounded-3xl border border-[#e5e8f2] bg-white p-7 text-center shadow-[0_14px_38px_rgba(53,67,112,.07)]"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#536bb7]">Page not found</p><h1 className="mt-2 text-xl font-semibold">We couldn’t find that page.</h1><Link href="/" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#536bb7] px-5 text-sm font-semibold text-white hover:bg-[#43599f]">Go to Smart Safar</Link></section></main>;
}
