// src/AppRouter.tsx
import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { Header } from './components/Header';
import { Cart } from './components/Cart';
import { Home } from './pages/Home';
import { ProductDetails } from './pages/ProductDetails';
import { Login } from './pages/Login';
import { Checkout } from './pages/Checkout';
import { Product as BoltProductType, CartItem } from './types'; // Use updated types

// Type for products fetched from Supabase
type FetchedProduct = {
  id: string; // Original string UUID
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  stock_quantity: number;
  category?: string;
  rating?: number;
};

// User Profile Type
type UserProfile = {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string | null;
} | null;


export function AppRouter() {
  // --- States ---
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // --- NEW SAFE useEffect to handle auth state changes ---
  useEffect(() => {
    const handleAuth = async () => {
      // 1. Get initial session with safety check
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session; // Use optional chaining for safety

      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoadingAuth(false);
      }
    };
    
    handleAuth(); // Run once initially

    // 2. Listen for future auth changes (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setUserProfile(null);
          setLoadingAuth(false);
        }
      }
    );

    // 3. Cleanup listener on component unmount
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []); // Run only once on mount

  // --- fetchProfile Function (Unchanged) ---
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      setUserProfile(data);
    } catch (error: any) {
      console.error("Error fetching profile:", error.message);
      setUserProfile(null);
    } finally {
      setLoadingAuth(false);
    }
  };

  // --- Logout, Cart Logic, etc. (Remain the same) ---
  const handleLogout = async () => { /* ... existing logic ... */ };
  const clearCart = () => { /* ... existing logic ... */ };
  const addToCart = (productToAdd: FetchedProduct, quantityToAdd: number = 1) => { /* ... existing logic ... */ };
  const updateQuantity = (id: number, quantity: number) => { /* ... existing logic ... */ };
  const removeFromCart = (id: number) => { /* ... existing logic ... */ };
  
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Loading indicator
  if (loadingAuth) { return <div>Loading Application...</div>; }

  // --- JSX ---
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <>
              <Header
                userProfile={userProfile}
                onLogout={handleLogout}
                cartCount={cartCount}
                onCartClick={() => setIsCartOpen(true)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
              <Routes>
                 <Route path="/" element={ <Home cartItems={cartItems} addToCart={addToCart} searchQuery={searchQuery} /> } />
                 <Route path="/product/:productId" element={<ProductDetails onAddToCart={addToCart} />} />
                 <Route path="/checkout" element={<Checkout cartItems={cartItems} clearCart={clearCart} />} />
              </Routes>
              <Cart
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                items={cartItems}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeFromCart}
              />
            </>
          }
        />
      </Routes>
    </>
  );
}