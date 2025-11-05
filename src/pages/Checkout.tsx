import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, CreditCard, Lock, Truck, MapPin, User, Mail, Phone } from 'lucide-react';
import { CartItem } from '../types'; // Type from types.ts
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Define expected profile data shape
type UserProfileData = {
    id: string;
    full_name: string | null;
    email: string | null;
    address: string | null;
    // Add other fields if available in profiles table (e.g., phone)
};

// Props interface
interface CheckoutProps {
  cartItems: CartItem[];
  clearCart: () => void;
}

export function Checkout({ cartItems, clearCart }: CheckoutProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false); // Loading state for order placement
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    email: '', firstName: '', lastName: '', phone: '',
    address: '', city: '', state: '', zipCode: '', country: 'India',
    cardNumber: '', cardName: '', expiryDate: '', cvv: '',
  });

  // Fetch user profile data if logged in
  useEffect(() => {
    setLoadingProfile(true); // Start loading profile
    const fetchUserData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, address')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error("Error fetching profile for checkout:", error);
            } else if (profile) {
                setUserProfile(profile);
                // Pre-fill form
                setFormData(prev => ({
                    ...prev,
                    email: profile.email || '',
                    firstName: profile.full_name?.split(' ')[0] || '',
                    lastName: profile.full_name?.split(' ').slice(1).join(' ') || '',
                    address: profile.address || '',
                }));
            }
        }
        setLoadingProfile(false); // Finish loading profile attempt
    };
    fetchUserData();
  }, []);

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingThreshold = 500;
  const shippingCost = 50;
  const shipping = subtotal > shippingThreshold ? 0 : shippingCost;
  const taxRate = 0.08;
  const tax = subtotal * taxRate;
  const total = subtotal + shipping + tax;

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- UPDATED: Handle Submit with Order Saving (Focus on product_id_string) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Final Step: Place Order
      setIsProcessing(true);
      try {
          if (!userProfile?.id) { throw new Error("User not logged in or profile not found."); }

          // 1. Insert into 'orders' table
          const { data: orderData, error: orderError } = await supabase
              .from('orders')
              .insert({ customer_id: userProfile.id, total_amount: total, status: 'pending' })
              .select('id').single();
          if (orderError) throw orderError;
          if (!orderData?.id) throw new Error("Failed to create order record.");
          const orderId = orderData.id;

          // 2. Prepare 'order_items' data with validation
          const orderItemsData = cartItems.map(item => {
              // --- VALIDATION AND STRING ID USE ---
              if (!item.product_id_string) {
                  console.error("Missing original product ID for cart item:", item);
                  throw new Error(`Cannot save order: Product ID missing for ${item.name}. Please remove the item and re-add it.`);
              }
              // --- END VALIDATION ---
              return {
                  order_id: orderId,
                  product_id: item.product_id_string, // <-- Uses the correct STRING UUID
                  quantity: item.quantity,
                  price_at_purchase: item.price
              };
          });

          // 3. Insert into 'order_items' table
          const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData);
          if (itemsError) throw itemsError;

          // 4. Success! Clear cart and navigate
          alert('Order placed successfully!');
          clearCart();
          navigate('/');

      } catch (error: any) {
          console.error("Error placing order:", error.message);
          alert("Error placing order: " + error.message);
      } finally {
          setIsProcessing(false);
      }
    }
  };


  // Empty Cart Check
  if (!loadingProfile && cartItems.length === 0 && step !== 3) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-4">Add some items to checkout</p>
          <button onClick={() => navigate('/')} className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors">Continue Shopping</button>
        </div>
      </div>
    );
  }

  // Show general loading state while profile loads initially
  if (loadingProfile && step === 1){
     return <div className="min-h-screen flex items-center justify-center">Loading Checkout...</div>;
  }

  // --- JSX (Full Structure) ---
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        {/* Checkout Header and Steps */}
        <div className="mb-8">
           <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
           {/* Step Indicator */}
           <div className="flex items-center gap-4 mt-4">
               {[1, 2, 3].map((s) => (
                   <div key={s} className="flex items-center">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                           s === step ? 'bg-emerald-600 text-white' : s < step ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'
                       }`}>{s}</div>
                       {s < 3 && <div className="w-16 h-0.5 bg-gray-300 mx-2" />}
                   </div>
               ))}
           </div>
           <div className="flex gap-20 mt-2 ml-1">
               <span className={`text-sm ${step === 1 ? 'text-emerald-600 font-medium' : 'text-gray-500'}`}>Shipping</span>
               <span className={`text-sm ${step === 2 ? 'text-emerald-600 font-medium' : 'text-gray-500'}`}>Payment</span>
               <span className={`text-sm ${step === 3 ? 'text-emerald-600 font-medium' : 'text-gray-500'}`}>Review</span>
           </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Side: Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
              {/* Step 1: Shipping */}
              {step === 1 && (
                 <div className="space-y-6">
                     <div className="flex items-center gap-3 mb-6"><Truck className="w-6 h-6 text-emerald-600" /> <h2 className="text-2xl font-bold">Shipping Information</h2></div>
                     {/* Form Grid */}
                     <div className="grid md:grid-cols-2 gap-4">
                         <div><Label className="block text-sm font-medium text-gray-700 mb-2">First Name</Label><div className="relative"><User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /><Input name="firstName" value={formData.firstName} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" required /></div></div>
                         <div><Label className="block text-sm font-medium text-gray-700 mb-2">Last Name</Label><Input name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" required /></div>
                     </div>
                     <div><Label className="block text-sm font-medium text-gray-700 mb-2">Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /><Input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" required /></div></div>
                     <div><Label className="block text-sm font-medium text-gray-700 mb-2">Phone</Label><div className="relative"><Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /><Input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" required /></div></div>
                     <div><Label className="block text-sm font-medium text-gray-700 mb-2">Address</Label><div className="relative"><MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /><Input name="address" value={formData.address} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" required /></div></div>
                     {/* City/State/Zip Grid */}
                     <div className="grid md:grid-cols-3 gap-4">
                         <div><Label className="block text-sm font-medium text-gray-700 mb-2">City</Label><Input name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" required /></div>
                         <div><Label className="block text-sm font-medium text-gray-700 mb-2">State</Label><Input name="state" value={formData.state} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" required /></div>
                         <div><Label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</Label><Input name="zipCode" value={formData.zipCode} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" required /></div>
                     </div>
                 </div>
              )}
              {/* Step 2: Payment */}
              {step === 2 && (
                 <div className="space-y-6">
                     <div className="flex items-center gap-3 mb-6"><CreditCard className="w-6 h-6 text-emerald-600" /><h2 className="text-2xl font-bold">Payment Information</h2></div>
                     <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3"><Lock className="w-5 h-5 text-emerald-600" /><p className="text-sm text-emerald-800">Your payment information is secure and encrypted</p></div>
                     {/* Payment Inputs (Mock) */}
                     <div><Label className="block text-sm font-medium text-gray-700 mb-2">Card Number</Label><Input name="cardNumber" value={formData.cardNumber} onChange={handleChange} placeholder="1234 5678 9012 3456" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" required /></div>
                     <div><Label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</Label><Input name="cardName" value={formData.cardName} onChange={handleChange} placeholder="John Doe" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" required /></div>
                     <div className="grid grid-cols-2 gap-4">
                         <div><Label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</Label><Input name="expiryDate" value={formData.expiryDate} onChange={handleChange} placeholder="MM/YY" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" required /></div>
                         <div><Label className="block text-sm font-medium text-gray-700 mb-2">CVV</Label><Input name="cvv" value={formData.cvv} onChange={handleChange} placeholder="123" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" required /></div>
                     </div>
                 </div>
              )}
              {/* Step 3: Review */}
              {step === 3 && (
                 <div className="space-y-6">
                     <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Order</h2>
                     {/* Shipping Review */}
                     <div className="border-b pb-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Shipping Address</h3>
                        <p className="text-gray-600">{formData.firstName} {formData.lastName}</p>
                        <p className="text-gray-600">{formData.address}</p>
                        <p className="text-gray-600">{formData.city}, {formData.state} {formData.zipCode}</p>
                        <p className="text-gray-600 mt-2">{formData.email}</p>
                        <p className="text-gray-600">{formData.phone}</p>
                     </div>
                     {/* Payment Review */}
                     <div className="border-b pb-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
                        <div className="flex items-center gap-2">
                           <CreditCard className="w-5 h-5 text-gray-400" />
                           <p className="text-gray-600">Card ending in {formData.cardNumber.slice(-4)}</p>
                        </div>
                     </div>
                     {/* Items Review */}
                     <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                        <div className="space-y-3">
                           {cartItems.map(item => (
                              <div key={item.id} className="flex gap-4">
                                 <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg"/>
                                 <div className="flex-1">
                                   <h4 className="font-medium text-gray-900">{item.name}</h4>
                                   <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                                 </div>
                                 <p className="font-semibold text-gray-900">
                                   {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price * item.quantity)}
                                 </p>
                              </div>
                           ))}
                        </div>
                     </div>
                 </div>
             )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 mt-8">
                {step > 1 && (<button type="button" onClick={() => setStep(step - 1)} disabled={isProcessing} className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Back</button>)}
                <button type="submit" disabled={isProcessing} className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors">
                  {isProcessing ? 'Processing...' : (step === 3 ? 'Place Order' : 'Continue')}
                </button>
              </div>
            </form>
          </div>

          {/* Right Side: Order Summary (Unchanged - Already uses state/props) */}
          <div className="lg:col-span-1">
             <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                 <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>
                 {/* Item List */}
                 <div className="space-y-3 mb-4">{cartItems.map(item => (<div key={item.id} className="flex justify-between text-sm"><span className="text-gray-600 truncate pr-2">{item.name} x {item.quantity}</span><span className="font-medium text-gray-900 whitespace-nowrap">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price * item.quantity)}</span></div>))}</div>
                 {/* Totals */}
                 <div className="border-t pt-4 space-y-2">
                     <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal</span><span className="font-medium text-gray-900">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(subtotal)}</span></div>
                     <div className="flex justify-between text-sm"><span className="text-gray-600">Shipping</span><span className="font-medium text-gray-900">{shipping === 0 ? 'FREE' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(shipping)}</span></div>
                     <div className="flex justify-between text-sm"><span className="text-gray-600">Tax ({ (taxRate * 100).toFixed(0) }%)</span><span className="font-medium text-gray-900">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tax)}</span></div>
                     <div className="border-t pt-2 flex justify-between"><span className="font-bold text-gray-900">Total</span><span className="font-bold text-emerald-600 text-xl">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(total)}</span></div>
                 </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout; // Ensure default export