export default function BrandMark({ size = "md", tone = "light", className = "" }) {
  const dimensions = size === "header" ? "h-10 w-10 sm:h-11 sm:w-11" : size === "sm" ? "h-10 w-10" : "h-11 w-11";
  const surface = tone === "dark" ? "border-white/25 bg-white/10 text-[#a8efdf]" : "border-[#7186cc]/25 bg-gradient-to-br from-[#293d75] via-[#536bb7] to-[#3e559c] text-white shadow-[0_7px_18px_rgba(40,57,111,.22)]";
  return <span className={`brand-mark inline-grid shrink-0 place-items-center rounded-2xl border ${dimensions} ${surface} ${className}`} aria-hidden="true">
    <svg viewBox="0 0 48 48" fill="none" className="h-[74%] w-[74%]">
      <path d="M24 4.8c-7.3 0-13.2 5.8-13.2 13.1C10.8 28.1 24 42.7 24 42.7s13.2-14.6 13.2-24.8C37.2 10.6 31.3 4.8 24 4.8Z" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round" />
      <path d="m16.8 25.7 5.1-5.1 4.4 3.3 5-7" stroke="#83ead4" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16.8" cy="25.7" r="2.1" fill="#fff" />
      <circle cx="31.3" cy="16.9" r="2.4" fill="#ffbd83" stroke="#fff" strokeWidth="1.2" />
      <circle cx="26.3" cy="23.9" r="1.7" fill="#83ead4" />
    </svg>
  </span>;
}