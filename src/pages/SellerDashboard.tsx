// src/pages/SellerDashboard.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

// This type should match your products table schema
type Product = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  stock_quantity: number;
};

export default function SellerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      
      // 1. Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 2. Fetch products owned by this user
        //    IMPORTANT: Change 'user_id' if your column name is different!
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('seller_id', user.id); // <-- CHANGE THIS if your column is named 'seller_id' etc.

        if (error) {
          console.error('Error fetching products:', error.message);
        } else {
          setProducts(data as Product[]);
        }
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  // Helper component for the loading state
  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">My Products</h1>
        <p>Loading your products...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Products</h1>
        <Button asChild>
          <Link to="/seller/add-product">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="text-center p-10 bg-white rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold">No products found.</h2>
          <p className="text-gray-500 mt-2">
            Click "Add New Product" to get started!
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {products.map((product) => (
              <li key={product.id} className="p-4 flex items-center space-x-4">
                <img
                  src={product.image_url || 'https://via.placeholder.com/80'}
                  alt={product.name}
                  className="w-20 h-20 rounded-md object-cover bg-gray-100"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                  <p className="text-sm text-gray-500">
                    Stock: {product.stock_quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-800">
                    ${product.price.toFixed(2)}
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Edit
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}