export default function EyebrowPill({ children, className = "", size = "default" }) {
  const sizing = size === "hero" ? "mb-4 px-3 py-2 text-[12px] tracking-[0.08em] sm:mb-7 sm:px-3.5 sm:text-sm sm:tracking-[0.1em]" : "px-3 py-1.5 text-[10px] tracking-[.12em]";
  return <span className={`inline-flex items-center gap-2 rounded-full border border-white/25 bg-[#1e2d55]/45 ${sizing} font-bold uppercase text-[#a5f1df] backdrop-blur-md ${className}`}><span className="h-1.5 w-1.5 rounded-full bg-aqua" aria-hidden="true"/>{children}</span>;
}
