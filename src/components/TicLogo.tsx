/**
 * The animated logo lockup — Zach's mic + "zt" initials mark (small,
 * sized to the text) beside a live-text wordmark: ZACHARIAH in white,
 * TIPPETT in glowing neon cyan, both in Anton. Every six seconds the
 * whole thing has a quick tic: a jitter burst with chromatic ghosts
 * splitting off, then it settles. The logo itself has Tourette's.
 * That's the bit.
 */
export function TicLogo({ className = "h-6" }: { className?: string }) {
  return (
    <span className={`tic-logo relative inline-flex items-center gap-2.5 ${className}`} aria-label="Zachariah Tippett">
      <img
        src="/zt-initials.svg"
        alt=""
        className="h-[125%] w-auto -my-[12.5%] object-contain"
      />
      <span className="relative inline-flex items-baseline gap-[0.3em] whitespace-nowrap text-[1.05em] leading-none font-display">
        <span className="text-white">ZACHARIAH</span>
        {/* neon word with chromatic ghost tics */}
        <span className="relative inline-block">
          <span aria-hidden className="tic-ghost tic-ghost-a absolute inset-0 text-teal">TIPPETT</span>
          <span aria-hidden className="tic-ghost tic-ghost-b absolute inset-0 text-teal">TIPPETT</span>
          <span className="neon-cyan relative">TIPPETT</span>
        </span>
      </span>
    </span>
  );
}
