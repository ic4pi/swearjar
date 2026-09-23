import { useState } from 'react';
import { Mic2, Send, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emptyForm = { name: '', email: '', phone: '', message: '' };

export function BookingModal({ isOpen, onClose }: BookingModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleClose = () => {
    onClose();
    // Reset after the close animation finishes rather than mid-fade.
    setTimeout(() => {
      setForm(emptyForm);
      setSent(false);
      setError('');
    }, 200);
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Name, email, and a message are required.');
      return;
    }
    setBusy(true);
    try {
      await api.sendMessage({ ...form, type: 'booking' });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display font-black text-2xl flex items-center gap-3">
            <Mic2 className="w-6 h-6 text-primary" />
            Book Zach
          </DialogTitle>
          {!sent && (
            <DialogDescription>
              Clubs, colleges, private events — tell him what you've got.
            </DialogDescription>
          )}
        </DialogHeader>

        {sent ? (
          <div className="py-8 flex flex-col items-center text-center gap-3">
            <CheckCircle2 className="w-12 h-12 text-primary" />
            <p className="font-bold text-lg">Sent.</p>
            <p className="text-muted-foreground text-sm">
              Thanks — Zach's team will get back to you soon.
            </p>
            <Button onClick={handleClose} className="btn-primary mt-2">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="booking-name">Name</Label>
              <Input
                id="booking-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="booking-email">Email</Label>
                <Input
                  id="booking-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@venue.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking-phone">Phone (optional)</Label>
                <Input
                  id="booking-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(555) 555-5555"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="booking-message">Details</Label>
              <Textarea
                id="booking-message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Venue, date, event type, budget — whatever you've got."
                rows={4}
              />
            </div>

            <Button onClick={handleSubmit} className="w-full btn-primary" disabled={busy}>
              <Send className="w-4 h-4 mr-2" />
              {busy ? 'Sending...' : 'Send Booking Request'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
