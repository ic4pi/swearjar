import { Heart } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { label: 'Privacy', href: '#' },
    { label: 'Terms', href: '#' },
    { label: 'Accessibility', href: '#' },
    { label: 'Contact', href: 'mailto:tourettesinc@gmail.com' },
  ];

  return (
    <footer className="bg-background border-t border-border py-8 z-70">
      <div className="w-full px-6 lg:px-16 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Copyright */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-primary fill-primary" />
            <span>by Zachariah Tippett</span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            © {currentYear} Zachariah Tippett. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
