import type { FeatureIcon } from "@/content/site";

const PATHS: Record<FeatureIcon | "check", string> = {
  calendar: "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 10h18M8 3v4M16 3v4M7 15h2M11 15h2M15 15h2",
  box: "M3 7l9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10",
  bin: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6",
  bell: "M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0",
  trend: "M3 17l6-6 4 4 8-8M15 7h6v6",
  check: "M4 12.5l5 5 11-11",
};

/** Simple stroke icons (decorative: the text next to them carries the meaning). */
export function Icon({ name, className }: { name: FeatureIcon | "check"; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name]} />
    </svg>
  );
}
