import type { ReactNode } from "react";

type RollButtonProps = {
  children: ReactNode;
  variant?: "teal" | "outline" | "ghost";
  href?: string;
  onClick?: () => void;
  className?: string;
  external?: boolean;
};

/**
 * Pill button whose label rolls upward on hover, revealing a duplicate
 * from below — the classic text-roll micro-interaction.
 */
export function RollButton({ children, variant = "teal", href, onClick, className = "", external }: RollButtonProps) {
  const styles =
    variant === "teal"
      ? "bg-teal text-[#0a0a0b] hover:bg-white"
      : variant === "outline"
        ? "border-2 border-white/70 text-white hover:border-teal hover:text-teal"
        : "text-white/80 hover:text-teal px-0";

  const inner = (
    <span className="roll-window">
      <span className="roll-track">
        <span>{children}</span>
        <span aria-hidden>{children}</span>
      </span>
    </span>
  );

  const cls = `btn-roll ${styles} ${className}`;

  if (href) {
    return (
      <a href={href} onClick={onClick} className={cls} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}
