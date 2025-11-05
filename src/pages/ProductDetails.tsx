import { useState, useEffect } from 'react'; // <-- Import useEffect
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient'; // <-- Import Supabase
import { Star, ShoppingCart, ArrowLeft, Heart, Share2, Truck, Shield, RotateCcw } from 'lucide-react';
// Remove fake data import: import { products } from '../data/products';
// Remove unused type import: import { Product } from '../types';

// Type for data fetched directly from Supabase (matches Home.tsx)
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

// Props interface (matches what AppRouter.tsx provides)
interface ProductDetailsProps {
  // Accepts FetchedProduct and quantity
  onAddToCart: (product: FetchedProduct, quantity: number) => void;
}

export function ProductDetails({ onAddToCart }: ProductDetailsProps) {
  // --- Use 'productId' to match the route parameter in AppRouter ---
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  // const [selectedImage, setSelectedImage] = useState(0); // Keep if needed for gallery

  // --- NEW: State for fetched product, loading, error ---
  const [product, setProduct] = useState<FetchedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- NEW: Fetch product data based on URL ID ---
  useEffect(() => {
    const fetchProduct = async () => {
      // Check if productId exists from the URL
      if (!productId) {
        setError("Product ID is missing from the URL.");
        setLoading(false);
        return; // Stop if no ID
      }

      setLoading(true);
      setError(null); // Reset error
      try {
        // Fetch the single product matching the ID
        const { data, error: dbError } = await supabase
          .from('products')
          .select('*') // Get all columns
          .eq('id', productId) // Filter by the ID from the URL
          .single(); // Expect only one row

        if (dbError) {
          if (dbError.code === 'PGRST116') { // Specific code for "No rows found"
             setError("Product not found.");
          } else {
            throw dbError; // Throw other database errors
          }
        }
        setProduct(data); // Set the fetched data (or null if not found)

      } catch (err: any) {
        console.error("Error fetching product details:", err.message);
        setError("Failed to load product details. Please try again.");
      } finally {
        setLoading(false); // Stop loading indicator
      }
    };

    fetchProduct();
  }, [productId]); // Re-run this effect if the productId in the URL changes

  // --- UPDATED: Handle Add to Cart ---
  const handleAddToCart = () => {
    // Make sure product data is loaded before adding
    if (product) {
      // Call the onAddToCart function passed down from AppRouter
      // Pass the fetched product data and the selected quantity
      onAddToCart(product, quantity);
    }
  };

  // --- RENDER LOGIC ---

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading product details...</p>
        {/* You could add a spinner here */}
      </div>
    );
  }

  // Show error or "Not Found" message
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-red-600 mb-4">{error || "Product Not Found"}</h2>
          <button
            onClick={() => navigate('/')} // Navigate back to home
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            &larr; Return to Products
          </button>
        </div>
      </div>
    );
  }

  // --- Display Product Details using fetched 'product' state variable ---
  // If you store multiple images, you'll need to fetch them too
  // const images = [product.image_url, product.image_url, product.image_url];
  // const [selectedImage, setSelectedImage] = useState(0); // If using gallery

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')} // Go back to the previous page or home
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Products
        </button>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-6 md:p-8">
            {/* Image Section */}
            <div>
              <div className="aspect-square rounded-lg overflow-hidden mb-4 border bg-gray-100">
                <img
                  // Use image_url from fetched product, provide placeholder
                  src={product.image_url || 'https://via.placeholder.com/600?text=No+Image'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Image gallery thumbnails (Placeholder) */}
              {/*
              <div className="grid grid-cols-3 gap-4">
                {[product.image_url, product.image_url, product.image_url].map((img, idx) => ( // Example using main image multiple times
                  <button
                    key={idx}
                    // onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                       0 === idx ? 'border-emerald-600' : 'border-gray-200' // Update selectedImage logic if used
                    }`}
                  >
                    <img src={img || 'https://via.placeholder.com/150?text=No+Image'} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              */}
            </div>

            {/* Details Section */}
            <div>
              {product.category && ( // Show category if available
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                    {product.category}
                  </span>
                </div>
              )}

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

              {/* Rating (Show if available) */}
              {product.rating !== undefined && product.rating !== null && (
                 <div className="flex items-center gap-4 mb-6">
                   <div className="flex items-center">
                     {[...Array(5)].map((_, idx) => (
                       <Star key={idx} className={`w-5 h-5 ${idx < Math.round(product.rating ?? 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                     ))}
                   </div>
                   <span className="text-lg font-semibold text-gray-900">{product.rating.toFixed(1)}</span>
                   {/* If you add a reviews count column later, display it here */}
                   {/* <span className="text-gray-500">(X reviews)</span> */}
                 </div>
              )}


              <div className="mb-6">
                 {/* Price */}
                <div className="text-4xl font-bold text-gray-900 mb-2">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(product.price)}
                </div>
                 {/* Stock Status */}
                {product.stock_quantity > 0 ? (
                  <span className="text-emerald-600 font-medium">In Stock ({product.stock_quantity} available)</span>
                ) : (
                  <span className="text-red-600 font-medium">Out of Stock</span>
                )}
              </div>

               {/* Description */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                {product.description || "No description available."}
              </p>

              {/* Quantity Selector */}
              <div className="flex items-center gap-4 mb-6">
                 <label className="font-medium">Quantity:</label>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))} // Prevent going below 1
                    disabled={quantity <= 1}
                    className="px-4 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  > - </button>
                  <span className="px-6 py-2 font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={quantity >= product.stock_quantity} // Prevent exceeding stock
                    className="px-4 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  > + </button>
                </div>
              </div>


              {/* Add to Cart & Action Buttons */}
              <div className="flex items-center gap-4">
                 <button
                   onClick={handleAddToCart} // Calls updated handler
                   disabled={product.stock_quantity <= 0} // Check stock
                   className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                     product.stock_quantity > 0
                       ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-98'
                       : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                   }`}
                 >
                   <ShoppingCart className="w-5 h-5" />
                   Add to Cart
                 </button>
                 {/* Wishlist/Share buttons (functionality not implemented) */}
                 <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"> <Heart className="w-5 h-5" /> </button>
                 <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"> <Share2 className="w-5 h-5" /> </button>
              </div>

              {/* Shipping/Payment Icons */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t mt-8 text-center">
                 <div> <Truck className="w-8 h-8 mx-auto text-emerald-600 mb-2" /> <p className="text-sm font-medium text-gray-900">Free Shipping</p> <p className="text-xs text-gray-500">Orders over $50</p> </div>
                 <div> <Shield className="w-8 h-8 mx-auto text-emerald-600 mb-2" /> <p className="text-sm font-medium text-gray-900">Secure Payment</p> <p className="text-xs text-gray-500">100% Protected</p> </div>
                 <div> <RotateCcw className="w-8 h-8 mx-auto text-emerald-600 mb-2" /> <p className="text-sm font-medium text-gray-900">Easy Returns</p> <p className="text-xs text-gray-500">30-day guarantee</p> </div>
              </div>
            </div>
          </div>

           {/* Product Details/Features Section (Uses description) */}
          <div className="border-t p-6 md:p-8 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Details</h2>
             <div className="prose max-w-none text-gray-600">
               <p>{product.description || "Detailed description not available."}</p>
               {/* You could add more structured feature lists here */}
             </div>
          </div>
        </div>

        {/* "You May Also Like" Section (Placeholder) */}
        {/* Needs separate logic to fetch related products */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {/* Placeholder Content */}
             <div className="bg-white rounded-lg shadow-sm p-4 text-center text-gray-400 border">Related Product 1</div>
             <div className="bg-white rounded-lg shadow-sm p-4 text-center text-gray-400 border">Related Product 2</div>
             <div className="bg-white rounded-lg shadow-sm p-4 text-center text-gray-400 border">Related Product 3</div>
             <div className="bg-white rounded-lg shadow-sm p-4 text-center text-gray-400 border">Related Product 4</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Ensure default export if AppRouter uses default import
export default ProductDetails;