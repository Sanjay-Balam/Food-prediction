import Image from "next/image";

const LINKS = [
  { href: "#problem", label: "Problem" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
];

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-ink/75 backdrop-blur-md">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#top" aria-label="Logeeca, back to top">
          <Image src="/logeeca-logo-light.png" alt="Logeeca" width={1026} height={202} className="h-7 w-auto" />
        </a>
        <div className="flex items-center gap-8">
          <ul className="hidden items-center gap-8 text-sm text-on-ink-muted md:flex">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="transition-colors hover:text-white">{link.label}</a>
              </li>
            ))}
          </ul>
          <a href="#contact" className="rounded-full bg-mint px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-white">
            Book a demo
          </a>
        </div>
      </nav>
    </header>
  );
}
