import { useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteData';

export function DonateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings } = useSiteSettings();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const cashTag = settings.cashAppTag.replace(/^\$/, '');

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-5" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-[#0a0a0b]/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md border-2 border-white/20 bg-[#111112] p-8">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 text-white/50 transition-colors hover:text-teal">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>

        <p className="font-hand text-2xl text-teal">every dollar fuels the mission</p>
        <h3 className="display-md mt-1">Fuel the funny</h3>
        <p className="mt-3 text-sm leading-relaxed text-white/65">
          Donations keep the shows, the awareness work, and the "1 in 100" conversation going.
        </p>

        <div className="mt-7 space-y-3">
          <a
            href={`https://cash.app/${cashTag}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between border-2 border-teal bg-teal/10 px-5 py-4 transition-colors hover:bg-teal hover:text-[#0a0a0b]"
          >
            <span className="font-bold uppercase tracking-widest text-sm">Cash App</span>
            <span className="font-display text-xl">{settings.cashAppTag}</span>
          </a>
          {settings.patreonUrl && (
            <a
              href={settings.patreonUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between border-2 border-white/25 px-5 py-4 transition-colors hover:border-teal hover:text-teal"
            >
              <span className="font-bold uppercase tracking-widest text-sm">Patreon</span>
              <span className="text-white/60">Monthly support →</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings } = useSiteSettings();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-5" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-[#0a0a0b]/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg border-2 border-white/20 bg-[#111112] p-8">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 text-white/50 transition-colors hover:text-teal">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>

        <p className="font-hand text-2xl text-teal">pick a lane</p>
        <h3 className="display-md mt-1">Get in touch</h3>

        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <a
            href={`mailto:${settings.contactEmail}?subject=${encodeURIComponent('General inquiry')}`}
            className="group border-2 border-white/25 p-6 transition-colors duration-300 hover:border-teal"
          >
            <div className="font-display text-xl uppercase">General inquiries</div>
            <p className="mt-2 text-sm text-white/60">Questions, kind words, awareness stuff, whatever's on your mind.</p>
            <span className="mt-4 inline-block text-xs font-bold uppercase tracking-[0.2em] text-teal opacity-0 transition-opacity group-hover:opacity-100">
              {settings.contactEmail} →
            </span>
          </a>
          <a
            href={`mailto:${settings.bookingEmail}?subject=${encodeURIComponent('Booking: Zachariah Tippett')}&body=${encodeURIComponent('Venue / event:\nDate:\nCity:\nAudience size:\nBudget range:\n')}`}
            className="group border-2 border-teal/60 bg-teal/5 p-6 transition-colors duration-300 hover:border-teal hover:bg-teal/10"
          >
            <div className="font-display text-xl uppercase text-teal">Booking</div>
            <p className="mt-2 text-sm text-white/60">Clubs, colleges, corporate, festivals — bring the show to your stage.</p>
            <span className="mt-4 inline-block text-xs font-bold uppercase tracking-[0.2em] text-teal opacity-0 transition-opacity group-hover:opacity-100">
              {settings.bookingEmail} →
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
