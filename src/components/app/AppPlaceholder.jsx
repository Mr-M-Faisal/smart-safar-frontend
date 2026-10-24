import Link from "next/link";

const appLinks = [
  ["Home", "/m"], ["Map", "/m/map"], ["Routes", "/m/routes"], ["Book", "/m/book"],
  ["Trips", "/m/trips"], ["Account", "/m/account"], ["Driver", "/m/driver"],
];

export default function AppPlaceholder({ title, description = "This screen will be built in the next mobile-app phase." }) {
  return <section className="mx-auto w-full max-w-[430px] px-5 py-8 text-[#293553]">
    <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#536bb7]">Smart Safar · mobile app</p>
    <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
    <p className="mt-2 text-sm leading-6 text-[#68738e]">{description}</p>
    <nav aria-label="Mobile app screen previews" className="mt-6 grid grid-cols-2 gap-2">
      {appLinks.map(([label, href]) => <Link key={href} href={href} className="inline-flex min-h-11 items-center rounded-xl border border-[#e1e5f1] bg-white px-3 text-sm font-medium text-[#465a9c] shadow-sm hover:bg-[#f7f8fc]">{label}<span aria-hidden="true" className="ml-auto">→</span></Link>)}
    </nav>
  </section>;
}
