import { useState, useEffect } from 'react';
import { ShoppingBag, Heart, Menu, Mic2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

interface NavigationProps {
  cartCount: number;
  onCartClick: () => void;
  onDonateClick: () => void;
  onBookClick: () => void;
}

export function Navigation({ cartCount, onCartClick, onDonateClick, onBookClick }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { label: 'About', id: 'about' },
    { label: 'Shows', id: 'shows' },
    { label: 'Shop', id: 'shop' },
    { label: 'Support', id: 'support' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-background/90 backdrop-blur-md border-b border-border/50'
          : 'bg-transparent'
      }`}
    >
      <nav className="w-full px-6 lg:px-12 py-4 flex items-center justify-between">
        {/* Wordmark - plain text, no logo file. Bold, uppercase, teal accent on the surname. */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="shrink-0 group"
        >
          <span className="font-display font-black tracking-tight text-xl sm:text-2xl lg:text-3xl uppercase">
            <span className="text-white">Zachariah</span>{' '}
            <span className="text-primary group-hover:brightness-110 transition-all">Tippett</span>
          </span>
        </button>

        {/* Desktop Navigation - Unorthodox style */}
        <div className="hidden lg:flex items-center gap-8">
          {/* Main nav links */}
          <div className="flex items-center gap-6">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="nav-link relative group"
              >
                <span className="relative z-10">{link.label}</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-border" />

          {/* Book Button */}
          <Button
            onClick={onBookClick}
            variant="ghost"
            className="font-bold text-sm tracking-wider uppercase hover:text-primary hover:bg-primary/10"
          >
            <Mic2 className="w-4 h-4 mr-2" />
            Book
          </Button>

          {/* Donate Button */}
          <Button
            onClick={onDonateClick}
            variant="ghost"
            className="font-bold text-sm tracking-wider uppercase hover:text-primary hover:bg-primary/10"
          >
            <Heart className="w-4 h-4 mr-2" />
            Donate
          </Button>

          {/* Cart Button */}
          <button
            onClick={onCartClick}
            className="relative p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <button className="p-2 hover:bg-muted rounded-full transition-colors">
              <Menu className="w-6 h-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-80 bg-background/95 backdrop-blur-md">
            <div className="flex flex-col gap-8 mt-8">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="text-2xl font-bold text-left hover:text-primary transition-colors"
                >
                  {link.label}
                </button>
              ))}
              
              <div className="border-t border-border pt-6 space-y-3">
                <Button
                  onClick={() => {
                    onBookClick();
                    setIsMobileMenuOpen(false);
                  }}
                  variant="secondary"
                  className="w-full"
                >
                  <Mic2 className="w-5 h-5 mr-2" />
                  Book
                </Button>
                <Button
                  onClick={() => {
                    onDonateClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full btn-primary"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Donate
                </Button>
              </div>

              <button
                onClick={() => {
                  onCartClick();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 text-lg font-semibold"
              >
                <ShoppingBag className="w-5 h-5" />
                Cart ({cartCount})
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
