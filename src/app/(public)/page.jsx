import Link from "next/link";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import HomeRouteMap from "@/components/map/HomeRouteMap";
import BookingLink from "@/components/layout/BookingLink";

const highlights = [
  { number: "01", title: "Find your route", text: "Explore Faisalabad routes and the stops along your way.", href: "/routes", label: "Browse routes", tint: "from-[#eef2ff] to-white", icon: "↗" },
  { number: "02", title: "Follow the bus", text: "See buses and route stops together on the live map.", href: "/live-map", label: "Open live map", tint: "from-[#e8f8f5] to-white", icon: "⌖" },
  { number: "03", title: "Travel informed", text: "Choose a seat and check your booking details.", href: "/passenger", booking: true, label: "Book a seat", tint: "from-[#fff3e8] to-white", icon: "▣" },
];

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <section className="hero-scene relative isolate mx-auto grid min-h-[calc(100svh-76px)] max-w-[1600px] items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:gap-14 lg:px-12 lg:py-16">
        <div className="animate-enter relative z-10 max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/25 bg-[#1e2d55]/45 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a5f1df] backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-aqua" /> Faisalabad, one stop closer
          </div>
          <h1 className="text-[clamp(3rem,6.5vw,6.3rem)] font-semibold leading-[.94] tracking-[-.065em] text-white">Find your way<br />through <span className="font-serif font-normal italic text-aqua">Faisalabad.</span></h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-white/80 sm:text-lg sm:leading-8">See routes, check bus updates, and plan your next trip across the city.</p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/live-map" className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-[#536bb7] px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#43599f]">
              Explore live map <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link href="/routes" className="rounded-full border border-white/35 bg-white/[0.08] px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/[0.16]">Browse routes</Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/20 pt-5 text-xs font-medium text-white/75">
            <span className="flex items-center gap-2"><span className="text-aqua">✳</span> Live bus locations</span>
            <span className="flex items-center gap-2"><span className="text-electric">◷</span> Arrival estimates</span>
            <span className="flex items-center gap-2"><span className="text-[#ffad69]">◉</span> Seat updates</span>
          </div>
        </div>

        <div className="animate-enter-delay relative mx-auto w-full max-w-[620px] lg:ml-auto">
          <div className="clock-tower-card group relative overflow-hidden rounded-[2rem] border border-white/30 bg-[#192b58] shadow-[0_35px_100px_rgba(0,0,0,.34)]">
            <img src="/images/faisalabad-clock-tower.jpg" alt="Ghanta Ghar, Faisalabad’s historic Clock Tower at sunset" className="clock-tower-photo h-[340px] w-full object-cover object-center sm:h-[460px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#101d3c]/85 via-transparent to-[#101d3c]/10" />
            <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 text-white sm:inset-x-7 sm:bottom-7">
              <div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#a8efdf]">The heart of Lyallpur</p><p className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Ghanta Ghar</p><p className="mt-1 text-xs text-white/75">Faisalabad, Punjab</p></div>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/35 bg-white/15 text-xl backdrop-blur">⌖</span>
            </div>
          </div>
          <p className="mt-3 text-right text-[10px] font-medium text-white/65">Clock Tower photo · Government of Punjab</p>
        </div>
      </section>

      <section className="border-t border-[#dce1f1] bg-[#f1f2fa] px-5 py-16 text-[#25304f] sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-[1360px]">
          <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <RevealOnScroll><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#536bb7]">Your city, in reach</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#25304f] sm:text-4xl">A better trip starts here.</h2></RevealOnScroll>
            <RevealOnScroll className="max-w-sm text-sm leading-6 text-[#67738e]">Simple tools for the everyday journeys that keep Faisalabad moving.</RevealOnScroll>
          </div>
          <div className="grid gap-px rounded-3xl border border-white/70 bg-white/70 md:grid-cols-3">
            {highlights.map((item) => (
              <RevealOnScroll key={item.number} style={{ "--reveal-delay": `${Number(item.number) * 100}ms` }}>
                {item.booking ? <BookingLink href={item.href} className={`group block h-full rounded-2xl border border-white/80 bg-gradient-to-br ${item.tint} p-6 shadow-[0_12px_34px_rgba(62,76,125,.08)] transition duration-300 hover:-translate-y-2 hover:border-[#bfcaf0] hover:shadow-[0_24px_45px_rgba(62,76,125,.16)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#536bb7] sm:p-8`}> 
                  <span className="flex items-center justify-between"><span className="font-mono text-xs text-[#7184c3]">{item.number} <span className="ml-1 text-[#a7aec1]">/ 03</span></span><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/80 text-xl text-[#536bb7] shadow-sm transition duration-300 group-hover:rotate-[-6deg] group-hover:scale-110">{item.icon}</span></span>
                  <h3 className="mt-7 text-xl font-semibold text-[#25304f] transition-colors group-hover:text-[#536bb7]">{item.title}</h3>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-[#67738e]">{item.text}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-[#536bb7]">{item.label}<span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span></span>
                </BookingLink> : <Link href={item.href} className={`group block h-full rounded-2xl border border-white/80 bg-gradient-to-br ${item.tint} p-6 shadow-[0_12px_34px_rgba(62,76,125,.08)] transition duration-300 hover:-translate-y-2 hover:border-[#bfcaf0] hover:shadow-[0_24px_45px_rgba(62,76,125,.16)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#536bb7] sm:p-8`}>
                  <span className="flex items-center justify-between"><span className="font-mono text-xs text-[#7184c3]">{item.number} <span className="ml-1 text-[#a7aec1]">/ 03</span></span><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/80 text-xl text-[#536bb7] shadow-sm transition duration-300 group-hover:rotate-[-6deg] group-hover:scale-110">{item.icon}</span></span>
                  <h3 className="mt-7 text-xl font-semibold text-[#25304f] transition-colors group-hover:text-[#536bb7]">{item.title}</h3>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-[#67738e]">{item.text}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-[#536bb7]">{item.label}<span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span></span>
                </Link>}
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 text-[#25304f] sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto grid max-w-[1360px] items-center gap-8 lg:grid-cols-[.75fr_1.25fr] lg:gap-12">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#536bb7]">Know the way around</p><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Faisalabad, at a glance.</h2><p className="mt-4 max-w-lg text-sm leading-7 text-[#67738e]">Explore the local transit network around familiar places, from Ghanta Ghar to neighbourhood stops. Choose a route to see its journey and the buses serving it.</p><Link href="/routes" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#536bb7] px-5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#43599f]">Explore city routes <span aria-hidden="true">→</span></Link></div>
          <div className="relative h-[320px] overflow-hidden rounded-[1.75rem] border border-[#e5e9f4] bg-[#e9edf7] p-2 shadow-[0_18px_48px_rgba(53,67,112,.12)] sm:h-[430px] sm:p-3"><HomeRouteMap /><div className="pointer-events-none absolute left-5 top-5 z-[500] rounded-xl border border-white/80 bg-white/90 px-4 py-3 shadow-lg backdrop-blur"><p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#7185c6]">Transit network</p><p className="mt-1 text-xs font-semibold text-[#293553]">Faisalabad · route map</p></div></div>
        </div>
      </section>
    </main>
  );
}
