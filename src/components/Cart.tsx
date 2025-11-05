import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { CartItem } from '../types'; // Type for items in the cart

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
}

export function Cart({ isOpen, onClose, items, onUpdateQuantity, onRemoveItem }: CartProps) {
  const navigate = useNavigate();
  // Calculate total, ensuring price and quantity are numbers
  const total = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);

  // Don't render if closed
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ease-in-out"
        onClick={onClose} // Close cart when clicking overlay
        aria-hidden="true"
      />
      {/* Cart Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0"> {/* Add transform classes if you want a slide-in effect */}
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Shopping Cart</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-lg transition-colors"
            aria-label="Close cart"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Cart Content */}
        {items.length === 0 ? (
          // Empty Cart View
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                {/* Simple Cart Icon for empty state */}
                <svg className="w-20 h-20 sm:w-24 sm:h-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-lg text-gray-600">Your cart is empty</p>
               <button
                  onClick={onClose} // Button to close and continue shopping
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Start Shopping
                </button>
            </div>
          </div>
        ) : (
          // Cart Items View
          <>
            {/* List of Items */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 bg-gray-50 p-3 sm:p-4 rounded-lg border">
                    <img
                      src={item.image || 'https://via.placeholder.com/150?text=No+Image'} // Use placeholder if image missing
                      alt={item.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{item.name}</h3>
                      {/* --- UPDATED Currency --- */}
                      <p className="text-emerald-600 font-bold mt-1 text-sm sm:text-base">
                         {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price)}
                      </p>
                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-2">
                         <div className="flex items-center gap-1 border rounded">
                            <button
                                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-l transition-colors disabled:opacity-50"
                                disabled={item.quantity <= 1} // Disable minus if quantity is 1
                                aria-label="Decrease quantity"
                            > <Minus className="w-3 h-3 sm:w-4 sm:h-4" /> </button>
                            <span className="w-8 text-center font-medium text-sm sm:text-base">{item.quantity}</span>
                            <button
                                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-r transition-colors disabled:opacity-50"
                                // Optional: Disable plus if quantity >= stock (if stock is available on item)
                                disabled={item.stock_quantity !== undefined && item.quantity >= item.stock_quantity}
                                aria-label="Increase quantity"
                            > <Plus className="w-3 h-3 sm:w-4 sm:h-4" /> </button>
                         </div>
                         {/* Remove Button */}
                         <button
                            onClick={() => onRemoveItem(item.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                            aria-label="Remove item"
                         > <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" /> </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart Footer / Summary */}
            <div className="border-t p-4 sm:p-6 bg-gray-50">
              <div className="flex justify-between text-base sm:text-lg mb-4">
                <span className="font-medium text-gray-700">Subtotal</span>
                {/* --- UPDATED Currency --- */}
                <span className="font-bold text-gray-900">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(total)}
                </span>
              </div>
              <p className="text-xs text-gray-500 text-center mb-4">Shipping and taxes calculated at checkout.</p>
              <button
                onClick={() => {
                  onClose(); // Close the cart sidebar
                  navigate('/checkout'); // Go to checkout page
                }}
                className="w-full bg-emerald-600 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors active:scale-98 text-sm sm:text-base"
              >
                Proceed to Checkout
              </button>
              <button
                onClick={onClose} // Just close the cart
                className="w-full mt-3 text-emerald-700 py-2 rounded-lg font-semibold hover:underline text-sm sm:text-base"
              >
                or Continue Shopping
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}