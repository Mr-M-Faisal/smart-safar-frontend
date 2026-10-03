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
      <section className="hero-scene relative isolate mx-auto grid min-h-[calc(100svh-76px)] max-w-[1600px] items-center gap-6 px-[var(--layout-gutter)] py-6 sm:gap-8 sm:px-8 sm:py-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-14 lg:px-12 lg:py-16">
        <div className="animate-enter relative z-10 max-w-2xl">
          <div className="hero-eyebrow mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-[#1e2d55]/45 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[#a5f1df] backdrop-blur-md sm:mb-7 sm:px-3.5 sm:text-[10px] sm:tracking-[0.18em]">
            <span className="h-1.5 w-1.5 rounded-full bg-aqua" /> Faisalabad, one stop closer
          </div>
          <h1 className="home-hero-title text-[length:var(--font-hero,clamp(2.1rem,9vw,2.9rem))] leading-[var(--line-hero,.98)] sm:text-[length:var(--font-hero,clamp(2.75rem,6.3vw,4.5rem))] lg:text-[length:var(--font-hero,clamp(3rem,6.5vw,6.3rem))] font-semibold text-white">Find your way<br />through <span className="font-serif font-normal italic text-aqua">Faisalabad.</span></h1>
          <p className="home-hero-copy mt-3 max-w-lg text-white/80 sm:mt-7">See routes, check bus updates, and plan your next trip across the city.</p>
          <div className="mt-5 flex flex-wrap items-center gap-2.5 sm:mt-9 sm:gap-3">
            <Link href="/live-map" className="group inline-flex min-h-11 items-center gap-2.5 rounded-full bg-[#536bb7] px-4 py-3 text-[13px] font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#43599f] sm:min-h-12 sm:gap-3 sm:px-6 sm:py-3.5 sm:text-sm">
              Explore live map <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link href="/routes" className="inline-flex min-h-11 items-center rounded-full border border-white/35 bg-white/[0.08] px-4 py-3 text-[13px] font-semibold text-white backdrop-blur transition hover:bg-white/[0.16] sm:px-6 sm:py-3.5 sm:text-sm">Browse routes</Link>
          </div>
          <div className="hero-facts mt-5 flex flex-wrap gap-x-4 gap-y-2.5 border-t border-white/20 pt-4 text-[11px] font-medium text-white/75 sm:mt-10 sm:gap-x-6 sm:gap-y-3 sm:pt-5 sm:text-xs">
            <span className="flex items-center gap-2"><span className="text-aqua">✳</span> Live bus locations</span>
            <span className="flex items-center gap-2"><span className="text-electric">◷</span> Arrival estimates</span>
            <span className="flex items-center gap-2"><span className="text-[#ffad69]">◉</span> Seat updates</span>
          </div>
        </div>

        <div className="animate-enter-delay relative mx-auto w-full max-w-[620px] lg:ml-auto">
          <div className="clock-tower-card group relative overflow-hidden rounded-[1.35rem] border border-white/30 bg-[#192b58] shadow-[0_20px_52px_rgba(0,0,0,.28)] sm:rounded-[2rem] sm:shadow-[0_35px_100px_rgba(0,0,0,.34)]">
            <img src="/images/faisalabad-clock-tower.jpg" alt="Ghanta Ghar, Faisalabad’s historic Clock Tower at sunset" className="clock-tower-photo h-[220px] w-full object-cover object-center sm:h-[300px] lg:h-[460px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#101d3c]/85 via-transparent to-[#101d3c]/10" />
            <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-white sm:inset-x-7 sm:bottom-7">
              <div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#a8efdf]">The heart of Lyallpur</p><p className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Ghanta Ghar</p><p className="mt-1 text-xs text-white/75">Faisalabad, Punjab</p><p className="mt-1 text-[9px] text-white/60">Photo · Government of Punjab</p></div>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/35 bg-white/15 text-xl backdrop-blur">⌖</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#dce1f1] bg-[#f1f2fa] px-[var(--layout-gutter)] py-[var(--section-space)] text-[#25304f] sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1360px]">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:mb-9 sm:flex-row sm:items-end sm:gap-4">
            <RevealOnScroll><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#536bb7]">Your city, in reach</p><h2 className="mt-2 text-[clamp(1.7rem,7vw,2.25rem)] font-semibold tracking-tight text-[#25304f] sm:mt-3 sm:text-4xl">A better trip starts here.</h2></RevealOnScroll>
            <RevealOnScroll className="max-w-sm text-sm leading-6 text-[#67738e]">Simple tools for the everyday journeys that keep Faisalabad moving.</RevealOnScroll>
          </div>
          <div className="grid gap-px rounded-3xl border border-white/70 bg-white/70 md:grid-cols-2 lg:grid-cols-3">
            {highlights.map((item) => (
              <RevealOnScroll key={item.number} style={{ "--reveal-delay": `${Number(item.number) * 100}ms` }}>
                {item.booking ? <BookingLink href={item.href} className={`group block h-full rounded-2xl border border-white/80 bg-gradient-to-br ${item.tint} p-4 shadow-[0_12px_34px_rgba(62,76,125,.08)] transition duration-300 hover:-translate-y-2 hover:border-[#bfcaf0] hover:shadow-[0_24px_45px_rgba(62,76,125,.16)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#536bb7] sm:p-6 lg:p-8`}>
                  <span className="flex items-center justify-between"><span className="font-mono text-xs text-[#7184c3]">{item.number} <span className="ml-1 text-[#a7aec1]">/ 03</span></span><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/80 text-xl text-[#536bb7] shadow-sm transition duration-300 group-hover:rotate-[-6deg] group-hover:scale-110">{item.icon}</span></span>
                  <h3 className="mt-4 text-lg font-semibold text-[#25304f] transition-colors group-hover:text-[#536bb7] sm:mt-7 sm:text-xl">{item.title}</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-[#67738e] sm:mt-3">{item.text}</p>
                  <span className="mt-4 inline-flex min-h-11 items-center gap-2 text-xs font-bold text-[#536bb7] sm:mt-6">{item.label}<span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span></span>
                </BookingLink> : <Link href={item.href} className={`group block h-full rounded-2xl border border-white/80 bg-gradient-to-br ${item.tint} p-4 shadow-[0_12px_34px_rgba(62,76,125,.08)] transition duration-300 hover:-translate-y-2 hover:border-[#bfcaf0] hover:shadow-[0_24px_45px_rgba(62,76,125,.16)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#536bb7] sm:p-6 lg:p-8`}>
                  <span className="flex items-center justify-between"><span className="font-mono text-xs text-[#7184c3]">{item.number} <span className="ml-1 text-[#a7aec1]">/ 03</span></span><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/80 text-xl text-[#536bb7] shadow-sm transition duration-300 group-hover:rotate-[-6deg] group-hover:scale-110">{item.icon}</span></span>
                  <h3 className="mt-4 text-lg font-semibold text-[#25304f] transition-colors group-hover:text-[#536bb7] sm:mt-7 sm:text-xl">{item.title}</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-[#67738e] sm:mt-3">{item.text}</p>
                  <span className="mt-4 inline-flex min-h-11 items-center gap-2 text-xs font-bold text-[#536bb7] sm:mt-6">{item.label}<span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span></span>
                </Link>}
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-[var(--layout-gutter)] py-[var(--section-space)] text-[#25304f] sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[1360px] items-center gap-8 lg:grid-cols-[.75fr_1.25fr] lg:gap-12">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#536bb7]">Know the way around</p><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Faisalabad, at a glance.</h2><p className="mt-4 max-w-lg text-sm leading-7 text-[#67738e]">Explore the local transit network around familiar places, from Ghanta Ghar to neighbourhood stops. Choose a route to see its journey and the buses serving it.</p><Link href="/routes" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#536bb7] px-5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#43599f]">Explore city routes <span aria-hidden="true">→</span></Link></div>
          <div className="relative h-[320px] overflow-hidden rounded-[1.75rem] border border-[#e5e9f4] bg-[#e9edf7] p-2 shadow-[0_18px_48px_rgba(53,67,112,.12)] sm:h-[430px] sm:p-3"><HomeRouteMap /></div>
        </div>
      </section>
    </main>
  );
}
