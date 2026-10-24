import Link from "next/link";
export default function PillButton({ href, children, secondary = false, className = "", ...props }) {
  const classes = `group inline-flex min-h-11 items-center justify-center gap-2 rounded-full ${secondary ? "border border-white/35 bg-white/[0.08] px-4 py-3 text-white backdrop-blur hover:bg-white/[0.16] sm:px-6 sm:py-3.5 sm:text-sm" : "bg-[#536bb7] px-4 py-3 text-white shadow-sm hover:bg-[#43599f] sm:min-h-12 sm:px-6 sm:py-3.5 sm:text-sm"} text-[13px] font-bold transition ${className}`;
  return href ? <Link href={href} className={classes} {...props}>{children}</Link> : <button className={classes} {...props}>{children}</button>;
}
