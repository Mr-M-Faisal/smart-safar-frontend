"use client";

export default function GlobalError({ reset }) {
  return <main className="grid min-h-[60vh] place-items-center bg-[#f4f5fb] px-5 py-12 text-[#293553]"><section role="alert" className="w-full max-w-lg rounded-3xl border border-[#e5e8f2] bg-white p-7 text-center shadow-[0_14px_38px_rgba(53,67,112,.07)]"><h1 className="text-xl font-semibold">This page could not load</h1><p className="mt-2 text-sm leading-6 text-[#74809a]">Try again. Your account and saved information have not been changed.</p><button type="button" onClick={() => reset()} className="mt-5 min-h-11 rounded-xl bg-[#536bb7] px-5 text-sm font-semibold text-white hover:bg-[#43599f]">Retry</button></section></main>;
}
