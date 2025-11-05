// src/AppRouter.tsx
import { useState, useEffect, useRef } // <-- IMPORT useRef
  from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { Header } from './components/Header';
import { Cart } from './components/Cart';
import { Home } from './pages/Home';
import { ProductDetails } from './pages/ProductDetails';
import { Login } from './pages/Login';
import { Checkout } from './pages/Checkout';
import { Product as BoltProductType, CartItem } from './types';
import SellerOrders from './pages/SellerOrders'; // <-- 1. IMPORT THIS

// --- IMPORT SELLER PAGES ---
import SellerLayout from './pages/SellerLayout';
import SellerDashboard from './pages/SellerDashboard';
import AddProduct from './pages/AddProduct';

// Type for products fetched from Supabase
type FetchedProduct = {
  id: string;
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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // --- ADD THIS REEFERENCE ---
  // This ref will prevent the auth logic from running twice in StrictMode
  const authEffectHasRun = useRef(false);

  useEffect(() => {
    // --- THIS IS THE FIX ---
    // Only run the auth logic ONCE, even in StrictMode
    if (authEffectHasRun.current === true) {
      return; // Stop the second execution
    }
    authEffectHasRun.current = true; // Mark as run
    // -----------------------


    // 1. Define fetchProfile *inside* useEffect
    const fetchProfile = async (userId: string) => {
      console.log("AppRouter: Fetching profile...");
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .eq('id', userId)
          .single();
        if (error && error.code !== 'PGRST116') throw error;
        setUserProfile(data || null);
      } catch (error: any) {
        console.error("Error fetching profile:", error.message);
        setUserProfile(null);
      } finally {
        console.log("AppRouter: Auth loading finished.");
        setLoadingAuth(false); 
      }
    };

    // 2. Define the main auth handler
    const handleAuth = async () => {
      console.log("AppRouter: Calling handleAuth...");
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        console.log("AppRouter: Got session data.");
        
        const session = sessionData?.session;
        setSession(session);
        
        if (session?.user) {
          console.log("AppRouter: User found, fetching profile.");
          await fetchProfile(session.user.id);
        } else {
          console.log("AppRouter: No user, setting loading to false.");
          setLoadingAuth(false);
        }
      } catch (error: any) {
        console.error("AppRouter Auth ERROR:", error.message);
        setLoadingAuth(false); 
      }
    };
    
    handleAuth(); // Run the check on initial load

    // 3. Listen for future auth changes
    console.log("AppRouter: Setting up auth state listener...");
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("AppRouter: Auth state changed.", _event);
        setSession(session);
        if (session?.user) {
          setLoadingAuth(true); // Show loader while we fetch new profile
          await fetchProfile(session.user.id);
        } else {
          setUserProfile(null);
          setLoadingAuth(false);
        }
      }
    );

    // 4. Cleanup listener
    return () => {
      console.log("AppRouter: Cleaning up auth listener.");
      authListener?.subscription?.unsubscribe();
    };
  }, []); // Empty dependency array is correct

  // --- handleLogout Function ---
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error("Error logging out:", error);
        else {
            setUserProfile(null);
            navigate('/login');
        }
    };

  // --- clearCart Function ---
  const clearCart = () => {
      setCartItems([]);
  };

  // --- addToCart Function (Placeholder) ---
    const addToCart = (productToAdd: FetchedProduct, quantityToAdd: number = 1) => { 
        console.log("Add to cart (placeholder)", productToAdd, quantityToAdd);
    };

  // --- updateQuantity Function (Placeholder) ---
  const updateQuantity = (id: number, quantity: number) => { 
    console.log("Update quantity (placeholder)", id, quantity);
  };

  // --- removeFromCart Function ---
  const removeFromCart = (id: number) => { 
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  // cartCount Calculation
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Loading indicator
  if (loadingAuth) { return <div className="min-h-screen flex items-center justify-center">Loading Application...</div>; }

  // --- JSX ---
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* --- SELLER ROUTES --- */}
        <Route path="/seller" element={<SellerLayout />}>
          <Route index element={<SellerDashboard />} />
          <Route path="products" element={<SellerDashboard />} />
          <Route path="add-product" element={<AddProduct />} />
          <Route path="orders" element={<SellerOrders />} /> {/* <-- 2. ADD THIS ROUTE */}
        </Route>

        {/* --- CUSTOMER ROUTES --- */}
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