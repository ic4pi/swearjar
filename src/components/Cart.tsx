import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { CartItem } from '@/types';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (index: number, delta: number) => void;
  onRemoveItem: (index: number) => void;
}

export function Cart({ isOpen, onClose, items, onUpdateQuantity, onRemoveItem }: CartProps) {
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-md bg-card border-border flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-display font-black text-2xl flex items-center gap-3">
            <ShoppingBag className="w-6 h-6" />
            Your Cart
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-auto py-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold text-muted-foreground">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add some merch to support the cause!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={`${item.product.id}-${item.variant}`}
                  className="flex gap-4 bg-background border border-border rounded-lg p-4"
                >
                  {/* Image */}
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded-md"
                  />

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm truncate">{item.product.name}</h4>
                        <p className="text-xs text-muted-foreground">{item.variant}</p>
                      </div>
                      <button
                        onClick={() => onRemoveItem(index)}
                        className="p-1 hover:bg-muted rounded-full transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onUpdateQuantity(index, -1)}
                          className="w-7 h-7 flex items-center justify-center bg-muted rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-semibold w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(index, 1)}
                          className="w-7 h-7 flex items-center justify-center bg-muted rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <span className="font-bold text-primary">
                        ${item.product.price * item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-black text-xl text-primary">${total}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Purchase each item above to check out.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
