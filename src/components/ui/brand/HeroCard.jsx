import EyebrowPill from "./EyebrowPill";
export default function HeroCard({ eyebrow, title, description, actions, facts, children, titleClassName = "", descriptionClassName = "", className = "" }) {
  return <section className={`relative overflow-hidden rounded-[1.5rem] border border-white/20 bg-gradient-to-br from-[#17264b] via-[#26386e] to-[#40599f] p-5 text-white shadow-[0_18px_45px_rgba(31,48,100,.22)] sm:p-6 ${className}`}>
    {eyebrow && <EyebrowPill>{eyebrow}</EyebrowPill>}
    {title && <h2 className={`mt-3 text-[1.7rem] font-semibold leading-tight tracking-[-.035em] sm:text-3xl ${titleClassName}`}>{title}</h2>}
    {description && <p className={`mt-2 max-w-xl text-sm leading-6 text-white/80 ${descriptionClassName}`}>{description}</p>}
    {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
    {facts && <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/20 pt-3 text-[10px] font-medium text-white/75">{facts.map((fact) => <span key={fact}>· {fact}</span>)}</div>}
    {children}
  </section>;
}
