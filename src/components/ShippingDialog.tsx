import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { ShippingInfo } from '@/types';

interface ShippingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (info: ShippingInfo) => void;
}

const EMPTY: ShippingInfo = {
  full_name: '',
  email: '',
  phone: '',
  address_1: '',
  address_2: '',
  city: '',
  state: '',
  postcode: '',
  country: 'US',
};

const REQUIRED_FIELDS: (keyof ShippingInfo)[] = [
  'full_name', 'email', 'phone', 'address_1', 'city', 'state', 'postcode', 'country',
];

export function ShippingDialog({ open, onOpenChange, onSubmit }: ShippingDialogProps) {
  const [info, setInfo] = useState<ShippingInfo>(EMPTY);

  const update = (field: keyof ShippingInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setInfo((prev) => ({ ...prev, [field]: e.target.value }));

  const isValid = REQUIRED_FIELDS.every((field) => info[field]?.trim());

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit(info);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Shipping details</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" value={info.full_name} onChange={update('full_name')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={info.email} onChange={update('email')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={info.phone} onChange={update('phone')} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="address_1">Address</Label>
            <Input id="address_1" value={info.address_1} onChange={update('address_1')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="address_2">Address line 2 (optional)</Label>
            <Input id="address_2" value={info.address_2} onChange={update('address_2')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={info.city} onChange={update('city')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="state">State</Label>
              <Input id="state" value={info.state} onChange={update('state')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="postcode">ZIP / Postcode</Label>
              <Input id="postcode" value={info.postcode} onChange={update('postcode')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={info.country} onChange={update('country')} placeholder="US" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!isValid} className="w-full">
            Continue to payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
