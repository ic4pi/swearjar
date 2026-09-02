import { Heart, Coffee } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cashAppTag } from '@/data/siteData';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DonateModal({ isOpen, onClose }: DonateModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display font-black text-2xl flex items-center gap-3">
            <Heart className="w-6 h-6 text-primary" />
            Support the Cause
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <p className="text-muted-foreground text-center">
            Your donation helps fund comedy tours, create awareness content, 
            and support the Tourette&apos;s community.
          </p>

          {/* Cash App Option */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">Donate via Cash App</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Quick, easy, and secure. Every dollar counts!
            </p>
            <a
              href={`https://cash.app/${cashAppTag}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex"
            >
              <Heart className="w-5 h-5 mr-2" />
              {cashAppTag}
            </a>
          </div>

          {/* Other Options */}
          <div className="grid grid-cols-2 gap-4">
            <a
              href="https://patreon.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-all"
            >
              <Coffee className="w-6 h-6 text-primary mb-2" />
              <span className="font-semibold text-sm">Patreon</span>
              <span className="text-xs text-muted-foreground">Monthly</span>
            </a>
            <a
              href={`mailto:tourettesinc@gmail.com`}
              className="flex flex-col items-center p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-all"
            >
              <Heart className="w-6 h-6 text-primary mb-2" />
              <span className="font-semibold text-sm">Other</span>
              <span className="text-xs text-muted-foreground">Contact Us</span>
            </a>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Zack Tippett is dedicated to spreading awareness and education
            about Tourette&apos;s Syndrome through comedy.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
