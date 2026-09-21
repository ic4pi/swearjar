import { useState, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Navigation } from '@/components/Navigation';
import { Cart } from '@/components/Cart';
import { AdminDashboard } from '@/components/AdminDashboard';
import { DonateModal } from '@/components/DonateModal';
import { HeroSection } from '@/sections/HeroSection';
import { VideoSection } from '@/sections/VideoSection';
import { AboutSection } from '@/sections/AboutSection';
import { ProductsSection } from '@/sections/ProductsSection';
import { SupportSection } from '@/sections/SupportSection';
import { PhotosSection } from '@/sections/PhotosSection';
import { ClosingSection } from '@/sections/ClosingSection';
import { Footer } from '@/sections/Footer';
import { NotFoundPage } from '@/components/NotFoundPage';
import type { CartItem } from '@/types';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

gsap.registerPlugin(ScrollTrigger);

function App() {
  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Admin state
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Donate modal state
  const [isDonateOpen, setIsDonateOpen] = useState(false);

  // Check for /dash route
  useEffect(() => {
    if (window.location.pathname === '/dash') {
      setIsAdminOpen(true);
    }
  }, []);

  // Simple admin shortcut: Ctrl+Shift+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+D to open admin dashboard
      if (e.ctrlKey && e.shiftKey && e.key === 'd') {
        e.preventDefault();
        setIsAdminOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Check if route exists (for 404 handling)
  const isValidRoute = () => {
    const validRoutes = ['/', '/about', '/shop', '/support', '/dash'];
    return validRoutes.includes(window.location.pathname);
  };

  // Cart functions
  const handleUpdateQuantity = useCallback((index: number, delta: number) => {
    setCartItems((prev) => {
      const updated = [...prev];
      updated[index].quantity += delta;

      if (updated[index].quantity <= 0) {
        updated.splice(index, 1);
      }

      return updated;
    });
  }, []);

  const handleRemoveItem = useCallback((index: number) => {
    setCartItems((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
    toast.info('Item removed from cart');
  }, []);

  // Global scroll snap for pinned sections
  useEffect(() => {
    // Wait for all ScrollTriggers to be created
    const timer = setTimeout(() => {
      const pinned = ScrollTrigger.getAll()
        .filter((st) => st.vars.pin)
        .sort((a, b) => a.start - b.start);

      const maxScroll = ScrollTrigger.maxScroll(window);

      if (!maxScroll || pinned.length === 0) return;

      const pinnedRanges = pinned.map((st) => ({
        start: st.start / maxScroll,
        end: (st.end ?? st.start) / maxScroll,
        center: (st.start + ((st.end ?? st.start) - st.start) * 0.5) / maxScroll,
      }));

      ScrollTrigger.create({
        snap: {
          snapTo: (value: number) => {
            const inPinned = pinnedRanges.some(
              (r) => value >= r.start - 0.02 && value <= r.end + 0.02
            );
            if (!inPinned) return value;

            const target = pinnedRanges.reduce(
              (closest, r) =>
                Math.abs(r.center - value) < Math.abs(closest - value)
                  ? r.center
                  : closest,
              pinnedRanges[0]?.center ?? 0
            );
            return target;
          },
          duration: { min: 0.15, max: 0.35 },
          delay: 0,
          ease: 'power2.out',
        },
      });
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="relative min-h-screen bg-background">
      {/* Navigation */}
      <Navigation
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
        onDonateClick={() => setIsDonateOpen(true)}
      />

      {/* Main Content */}
      <main className="relative">
        {isValidRoute() ? (
          <>
            <HeroSection />
            <VideoSection />
            <ProductsSection />
            <AboutSection onDonateClick={() => setIsDonateOpen(true)} />
            <SupportSection onDonateClick={() => setIsDonateOpen(true)} />
            <PhotosSection />
            <ClosingSection />
          </>
        ) : (
          <NotFoundPage />
        )}
        <Footer />
      </main>

      {/* Cart Drawer */}
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />

      {/* Admin Dashboard */}
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      {/* Donate Modal */}
      <DonateModal
        isOpen={isDonateOpen}
        onClose={() => setIsDonateOpen(false)}
      />

      {/* Toast notifications */}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          },
        }}
      />
    </div>
  );
}

export default App;
