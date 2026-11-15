/** Small uppercase section label with a short accent rule. */
export function Eyebrow({ children, onDark = false }: { children: React.ReactNode; onDark?: boolean }) {
  return (
    <p className={`flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] ${onDark ? "text-mint" : "text-teal"}`}>
      <span aria-hidden="true" className={`h-0.5 w-7 rounded ${onDark ? "bg-mint" : "bg-teal"}`} />
      {children}
    </p>
  );
}
