import { useEffect, useState } from "react";
import { TicLogo } from "./TicLogo";
import { RollButton } from "./RollButton";

const LINKS = [
  { label: "Shows", href: "#shows" },
  { label: "About", href: "#about" },
  { label: "Merch", href: "#merch" },
  { label: "Contact", href: "#contact" },
];

export function Navigation({ onDonate }: { onDonate: () => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? "bg-[#0a0a0b]/85 backdrop-blur-md border-b border-white/10" : ""
        }`}
      >
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-3 md:px-10">
          <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            <TicLogo className="h-5 md:h-6" />
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            {LINKS.map((l) => (
              <button
                key={l.href}
                onClick={() => go(l.href)}
                className="group relative text-sm font-semibold uppercase tracking-[0.15em] text-white/75 transition-colors hover:text-white"
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-teal transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
            <RollButton onClick={onDonate} className="!h-10 !px-5 !text-xs">
              Donate
            </RollButton>
          </nav>

          <button
            className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            <span className={`h-[2px] w-6 bg-white transition-transform duration-300 ${open ? "translate-y-[7px] rotate-45" : ""}`} />
            <span className={`h-[2px] w-6 bg-white transition-opacity duration-300 ${open ? "opacity-0" : ""}`} />
            <span className={`h-[2px] w-6 bg-white transition-transform duration-300 ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
          </button>
        </div>
      </header>

      {/* Mobile overlay menu */}
      <div
        className={`fixed inset-0 z-40 bg-[#0a0a0b]/97 backdrop-blur-xl transition-opacity duration-300 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex h-full flex-col items-start justify-center gap-2 px-8">
          {LINKS.map((l, i) => (
            <button
              key={l.href}
              onClick={() => go(l.href)}
              className={`font-display text-5xl uppercase text-white transition-all duration-500 hover:text-teal ${
                open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
              }`}
              style={{ transitionDelay: `${100 + i * 70}ms` }}
            >
              {l.label}
            </button>
          ))}
          <div className="mt-8">
            <RollButton onClick={() => { setOpen(false); onDonate(); }}>Donate</RollButton>
          </div>
        </div>
      </div>
    </>
  );
}
