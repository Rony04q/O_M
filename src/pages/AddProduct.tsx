// src/pages/AddProduct.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// --- IMPORT THE NEW SERVICE ---
import { generateEmbedding } from '../lib/geminiEmbeddings';

export default function AddProduct() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in to add a product.');
      setLoading(false);
      return;
    }

    // 1. Combine text for AI
    const combinedText = `${name}. ${description}`;

    // 2. Generate the Embedding (AI step)
    const embeddingVector = await generateEmbedding(combinedText);
    
    if (!embeddingVector) {
        setError("AI Service failed to generate product embedding. Product not added.");
        setLoading(false);
        return;
    }

    // 3. Create the new product object (including the embedding)
    const newProduct = {
      name,
      description,
      price: parseFloat(price),
      stock_quantity: parseInt(stockQuantity, 10),
      image_url: imageUrl || null,
      seller_id: user.id,
      embedding: embeddingVector, // <-- SEND THE GEMINI VECTOR
    };

    // 4. Insert into the database
    const { error: insertError } = await supabase
      .from('products')
      .insert(newProduct);

    setLoading(false);

    if (insertError) {
      console.error('Error adding product:', insertError.message);
      setError(insertError.message);
    } else {
      // Success!
      setName('');
      setDescription('');
      setPrice('');
      setStockQuantity('');
      setImageUrl('');
      navigate('/seller/products'); // Go to product list
    }
  };

  // ... rest of the return statement (JSX) remains the same
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Add a New Product
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                step="1"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                required
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="image_url">Image URL (Optional)</Label>
            <Input
              id="image_url"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.png"
              className="mt-1"
            />
          </div>

          {error && (
            <p className="text-sm font-medium text-red-600">
              Error: {error}
            </p>
          )}

          <div className="pt-2">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Generating Embedding & Adding Product...' : 'Add Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}