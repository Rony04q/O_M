import { useState, useEffect, useRef }
  from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { Header } from './components/Header';
import { Cart } from './components/Cart';
import { Home } from './pages/Home';
import { ProductDetails } from './pages/ProductDetails';
import { Login } from './pages/Login';
import { Checkout } from './pages/Checkout';
// --- 1. THIS IMPORT IS NOW THE SINGLE SOURCE OF TRUTH ---
import { Product as BoltProductType, CartItem, FetchedProduct } from './types'; 
import SellerOrders from './pages/SellerOrders';
import ProfilePage from './pages/ProfilePage';
// --- IMPORT SELLER PAGES ---
import SellerLayout from './pages/SellerLayout';
import SellerDashboard from './pages/SellerDashboard';
import AddProduct from './pages/AddProduct';

// (We no longer need to define FetchedProduct or CartItem here, assuming they are in 'types.ts')

// User Profile Type
type UserProfile = {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string | null;
} | null;


export function AppRouter() {
  // --- This now uses the imported CartItem type ---
  const [cartItems, setCartItems] = useState<CartItem[]>([]); 
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const authEffectHasRun = useRef(false);

  // ... (useEffect and auth logic remains the same) ...
  useEffect(() => {
    if (authEffectHasRun.current === true) {
      return;
    }
    authEffectHasRun.current = true;

    // 1. Define fetchProfile
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
  }, []); 

  // --- handleLogout Function ---
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error("Error logging out:", error);
        else {
            navigate('/login');
        }
    };

  // --- clearCart Function ---
  const clearCart = () => {
      setCartItems([]);
  };

  // --- 2. THIS IS THE FIXED addToCart FUNCTION ---
  const addToCart = (productToAdd: FetchedProduct, quantityToAdd: number = 1) => {
    
    // --- ADAPTATION LOGIC ---
    // Convert FetchedProduct to the BoltProductType structure
    // This is the structure the components expect
    const adaptedProduct: BoltProductType = {
        // This conversion logic must match what your components expect
        id: parseInt(productToAdd.id.substring(0, 8), 16) || 0, // number id
        name: productToAdd.name,
        price: productToAdd.price,
        image: productToAdd.image_url || 'https://via.placeholder.com/300?text=No+Image',
        reviews: productToAdd.rating ?? 0, 
        rating: productToAdd.rating ?? 0, 
        inStock: productToAdd.stock_quantity > 0,
        category: productToAdd.category || 'Uncategorized',
        description: productToAdd.description || '',
        stock_quantity: productToAdd.stock_quantity,
        product_id_string: productToAdd.id, // keep the string id
    };
    // --- END ADAPTATION ---

    setCartItems((prevItems) => {
      // Use the numeric ID for matching
      const existingItem = prevItems.find((item) => item.id === adaptedProduct.id);

      if (existingItem) {
        // Item already in cart, update quantity
        return prevItems.map((item) =>
          item.id === adaptedProduct.id
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item
        );
      } else {
        // Item not in cart, add new item
        // Add the adapted product (which is a BoltProductType)
        // and the quantity to make it a CartItem
        return [...prevItems, { ...adaptedProduct, quantity: quantityToAdd }];
      }
    });
    setIsCartOpen(true); // Open the cart to show the user
  };


  // --- 3. THESE FUNCTIONS ARE NOW CORRECT ---
  // They use 'number' for the ID, which matches the adapted 'BoltProductType' ID
 const updateQuantity = (id: number, quantity: number) => { 
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: quantity } : item
      ).filter(item => item.quantity > 0) // Also remove if quantity is 0
    );
  };

  const removeFromCart = (id: number) => { 
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };
  // --- END OF FIXES ---

  // cartCount Calculation
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Loading indicator
  if (loadingAuth) { return <div className="min-h-screen flex items-center justify-center">Loading Application...</div>; }

   // --- JSX (No changes, this part is correct) ---
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* --- SELLER ROUTES --- */}
        <Route path="/seller" element={<SellerLayout />}>
          <Route index element={<SellerDashboard />} />
          <Route path="products" element={<SellerDashboard />} />
          <Route path="add-product" element={<AddProduct />} />
          <Route path="orders" element={<SellerOrders />} />
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
NT               <Route path="/profile" element={<ProfilePage />} />
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
  Options     
      </Routes>
    </>
  );
}