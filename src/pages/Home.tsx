// src/pages/Home.tsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient'; 
import { Filters } from '../components/Filters'; 
import { ProductCard } from '../components/ProductCard'; 
import { Product as BoltProductType, CartItem, FetchedProduct } from '../types';

// --- 1. Import your new local AI embedding function (FIXED PATH) ---
import { generateEmbedding } from '../lib/geminiEmbeddings'; 


interface HomeProps {
  cartItems: CartItem[];
  addToCart: (product: FetchedProduct, quantity: number) => void; 
  searchQuery: string;
}

export function Home({ addToCart, searchQuery }: HomeProps) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');

  const [fetchedProducts, setFetchedProducts] = useState<FetchedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- 1. Fetch products from Supabase (Now supporting Ollama AI Search) ---
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let data: FetchedProduct[] | null = [];
        let dbError: any = null;

        // If a search query is present, use the AI Semantic Search
        if (searchQuery) {
          
          // --- OLLAMA AI SEARCH (NEW TWO-STEP PROCESS) ---
          
          // 1. Generate the embedding on the client using Ollama
          console.log(`Generating Ollama embedding for: "${searchQuery}"`);
          const queryVector = await generateEmbedding(searchQuery);

          if (queryVector) {
            // 2. Call our new database function with the vector
            console.log("Fetching vector matches from Supabase...");
            const { data: aiData, error: aiError } = await supabase.rpc('match_products_by_vector', {
              query_embedding: queryVector,
              match_threshold: 0.3, // You can adjust this similarity
              match_count: 50       // Get 50 results for the frontend to filter/sort
            });
            data = aiData as FetchedProduct[];
            dbError = aiError;
          } else {
            dbError = { message: "Failed to generate AI embedding." };
          }
          
        } else {
          // --- REGULAR FETCH (Only for Category/No Search) ---
          let query = supabase.from('products').select('*');
          
          // Apply Category Filter
          if (selectedCategory !== 'All') {
            query = query.eq('category', selectedCategory);
          }
          
          const { data: regularData, error: regularError } = await query;
          data = regularData as FetchedProduct[];
          dbError = regularError;
        }

        if (dbError) throw dbError;
        
        // This post-fetch filter now works on BOTH AI results and regular results
        if (selectedCategory !== 'All' && data) {
          data = data.filter(p => p.category === selectedCategory);
        }

        setFetchedProducts(data || []);

      } catch (err: any) {
        console.error("Error fetching products:", err.message);
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };

    // Your debounce logic (this is perfect)
    const searchTimeout = setTimeout(() => {
        fetchProducts();
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(searchTimeout);

  }, [searchQuery, selectedCategory]); // This dependency array is correct


  // --- 2. Filter & Sort Logic (NO CHANGES) ---
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

  // --- 3. Navigation (NO CHANGES) ---
  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  // --- 4. RENDER LOGIC (NO CHANGES) ---
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header text */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {searchQuery ? `AI Results for "${searchQuery}"` : "Discover Amazing Products"}
          </h2>
        <p className="text-gray-600">Browse our curated collection of premium items</p>
      </div>

      {/* Filters component */}
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
          <p className="text-xl text-gray-600">{searchQuery ? "No products found matching your search criteria." : "No products available right now."}</p>
        </div>
      )}

      {/* --- Product Grid --- */}
      {!loading && !error && filteredAndSortedProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedProducts.map((fetchedProduct) => {
            // --- Adaptation Logic ---
             const adaptedProduct: BoltProductType = {
               id: parseInt(fetchedProduct.id.substring(0, 8), 16) || 0, 
               name: fetchedProduct.name,
               price: fetchedProduct.price,
              image: fetchedProduct.image_url || 'https://via.placeholder.com/300?text=No+Image',
               reviews: fetchedProduct.rating ?? 0, 
               rating: fetchedProduct.rating ?? 0, 
               inStock: fetchedProduct.stock_quantity > 0,
               category: fetchedProduct.category || 'Uncategorized',
               description: fetchedProduct.description || '',
               stock_quantity: fetchedProduct.stock_quantity,
              // --- THIS IS THE FIX (removed the stray 'a') ---
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