export default function Surface({ as: Tag = "section", className = "", children, ...props }) {
  return <Tag className={`rounded-[1.35rem] border border-white/80 bg-gradient-to-br from-white via-[#f8f9ff] to-[#eef2ff] p-4 shadow-[0_12px_34px_rgba(62,76,125,.08)] sm:p-5 ${className}`} {...props}>{children}</Tag>;
}
