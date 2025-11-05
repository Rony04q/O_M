import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient'; 
import { Filters } from '../components/Filters'; 
import { ProductCard } from '../components/ProductCard'; 
import { Product as BoltProductType, CartItem, FetchedProduct } from '../types'; // Using updated types

// Note: FetchedProduct type definition should be defined once in types.ts

interface HomeProps {
  cartItems: CartItem[];
  addToCart: (product: FetchedProduct, quantity: number) => void; // Updated prop signature
  searchQuery: string;
}

export function Home({ addToCart, searchQuery }: HomeProps) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');

  const [fetchedProducts, setFetchedProducts] = useState<FetchedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- 1. Fetch products from Supabase ---
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        let query = supabase.from('products').select('*');
        
        // Apply Search Filter (Case-Insensitive)
        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`); 
        }

        // Apply Category Filter
        if (selectedCategory !== 'All') {
          query = query.eq('category', selectedCategory);
        }
        
        const { data, error: dbError } = await query;

        if (dbError) throw dbError;
        setFetchedProducts(data || []);

      } catch (err: any) {
        console.error("Error fetching products:", err.message);
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchQuery, selectedCategory]); 


  // --- 2. Filter & Sort Logic (useMemo handles only sorting) ---
  const filteredAndSortedProducts = useMemo(() => {
    let sorted = [...fetchedProducts]; 

    switch (sortBy) {
      case 'price-low': sorted.sort((a, b) => a.price - b.price); break;
      case 'price-high': sorted.sort((a, b) => b.price - a.price); break;
      case 'rating': sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
      default: break;
    }
    return sorted;
  }, [sortBy, fetchedProducts]); 

  // --- 3. Navigation ---
  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  // --- 4. RENDER LOGIC ---
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header text */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Discover Amazing Products</h2>
        <p className="text-gray-600">Browse our curated collection of premium items</p>
      </div>

      {/* Filters component remains the same */}
      <Filters
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {loading && <div className="text-center py-16"><p className="text-xl text-gray-600">Loading products...</p></div>}
      {error && <div className="text-center py-16"><p className="text-xl text-red-600 bg-red-100 p-4 rounded-md">{error}</p></div>}
      
      {!loading && !error && filteredAndSortedProducts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-xl text-gray-600">{fetchedProducts.length === 0 ? "No products available right now." : "No products found matching your criteria"}</p>
        </div>
      )}

      {/* --- Product Grid --- */}
      {!loading && !error && filteredAndSortedProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedProducts.map((fetchedProduct) => {
            // --- Adaptation Logic (The final required structure) ---
             const adaptedProduct: BoltProductType = {
               // Must match BoltProductType (number ID is a known conflict)
               id: parseInt(fetchedProduct.id.substring(0, 8), 16) || 0, // Keep this conversion
               name: fetchedProduct.name,
               price: fetchedProduct.price,
               image: fetchedProduct.image_url || 'https://via.placeholder.com/300?text=No+Image',
               reviews: fetchedProduct.rating ?? 0, 
               rating: fetchedProduct.rating ?? 0, 
               inStock: fetchedProduct.stock_quantity > 0,
               category: fetchedProduct.category || 'Uncategorized',
               description: fetchedProduct.description || '', // Ensure this is only included if needed by ProductCard
               stock_quantity: fetchedProduct.stock_quantity,
               product_id_string: fetchedProduct.id,
             };

            return (
              <div key={fetchedProduct.id} onClick={() => handleProductClick(fetchedProduct.id)}>
                <ProductCard product={adaptedProduct} onAddToCart={() => addToCart(fetchedProduct, 1)} />
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}