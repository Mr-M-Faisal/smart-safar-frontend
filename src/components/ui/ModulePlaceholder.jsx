import Link from "next/link";
import StatePanel from "./StatePanel";

export default function ModulePlaceholder({ eyebrow, title, description }) {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 lg:px-12">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-transit-700">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl leading-7 text-slate-600">{description}</p>
      <StatePanel variant="empty" title="This module is not connected yet" description="We’ll build and connect this screen in its planned phase." />
      <Link href="/" className="mt-6 inline-flex rounded-xl bg-transit-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-transit-700">Back to home</Link>
    </main>
  );
}
