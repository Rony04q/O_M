import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient'; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; 
import { Package, DollarSign } from 'lucide-react';

// Type for the form data
type ProductFormData = {
  name: string;
  description: string;
  price: string; 
  stock_quantity: string;
  image_url: string;
  category: string;
};

// Assuming category options based on previous data insert
const CATEGORIES = ["Electronics", "Fashion", "Sports", "Home", "Accessories"];

const AddProduct = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    image_url: '',
    category: CATEGORIES[0], 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sellerId, setSellerId] = useState<string | null>(null);

  // --- 1. Fetch Seller ID on load ---
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setSellerId(user.id);
      } else {
        navigate('/login');
      }
    });
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- 2. Handle Form Submission to Supabase ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerId) {
      alert("Seller ID missing. Please log in again.");
      return;
    }
    setIsSubmitting(true);

    try {
      // Validate and prepare data for database
      const priceNumeric = parseFloat(formData.price);
      const stockNumeric = parseInt(formData.stock_quantity);

      if (isNaN(priceNumeric) || priceNumeric <= 0 || isNaN(stockNumeric) || stockNumeric < 0) {
        throw new Error("Please enter valid positive numbers for Price and Stock Quantity.");
      }

      const { error } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          description: formData.description,
          price: priceNumeric,
          stock_quantity: stockNumeric,
          image_url: formData.image_url || null,
          category: formData.category,
          seller_id: sellerId, // <-- Automatically link to current seller
        });

      if (error) throw error;

      alert(`Product "${formData.name}" listed successfully!`);
      // Navigate to the seller's product listing view
      navigate('/seller/products');
      
    } catch (error: any) {
      console.error("Error adding product:", error.message);
      alert(`Failed to add product: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sellerId) {
    return <div className="p-8 text-center text-gray-600">Loading Seller details...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">List a New Product</h1>
      <div className="bg-white rounded-lg shadow-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Product Name & Category */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                type="text" name="name" value={formData.name} onChange={handleChange}
                placeholder="e.g., Ultra-Comfort Headphones" required
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category" name="category" value={formData.category} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              name="description" value={formData.description} onChange={handleChange}
              placeholder="Detailed description, features, and specifications." rows={4} required
            />
          </div>

          {/* Price & Stock */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">Price (₹)</Label>
              <div className="relative">
                 <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                 <Input
                    type="text" name="price" value={formData.price} onChange={handleChange}
                    placeholder="e.g., 2999" required min="0" step="0.01"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
              </div>
            </div>
            <div>
              <Label htmlFor="stock_quantity">Stock Quantity</Label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange}
                  placeholder="e.g., 50" required min="0"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <Label htmlFor="image_url">Image URL (Direct Link)</Label>
            <Input
              type="url" name="image_url" value={formData.image_url} onChange={handleChange}
              placeholder="https://via.placeholder.com/300"
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isSubmitting} className="w-full py-3">
            {isSubmitting ? 'Listing Product...' : 'Publish Product'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;