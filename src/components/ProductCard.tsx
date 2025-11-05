import { Star, ShoppingCart } from 'lucide-react';
import { Product } from '../types'; // Assuming Product type now includes description

interface ProductCardProps {
  product: Product;
  // Note: The onAddToCart here expects 'Product' type from types.ts
  // Ensure the handleAddToCart function passed from Home.tsx is compatible
  // or adjust the type here if needed.
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  // Prevent click event from bubbling up (e.g., if card itself is clickable)
  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop event from triggering parent onClick (like navigate)
    onAddToCart(product);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 group cursor-pointer h-full flex flex-col"> {/* Added h-full and flex flex-col */}
      {/* Image Section */}
      <div className="relative overflow-hidden aspect-square">
        <img
          src={product.image || 'https://via.placeholder.com/300?text=No+Image'} // Added placeholder fallback
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {!product.inStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold text-lg">Out of Stock</span>
          </div>
        )}
        {product.category && ( // Only show category if it exists
          <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
            {product.category}
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="p-4 flex flex-col flex-grow"> {/* Added flex-grow */}
        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-emerald-700 transition-colors">{product.name}</h3>

        {/* --- ADDED DESCRIPTION --- */}
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {product.description || 'No description available.'} {/* Display description */}
        </p>
        {/* --- END DESCRIPTION --- */}

        {/* Rating and Reviews */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center">
            {/* Render stars based on rating */}
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-4 h-4 ${i < Math.round(product.rating ?? 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
            ))}
            {/* Show rating number if available */}
            {product.rating !== undefined && product.rating !== null && (
               <span className="ml-1 text-sm font-medium text-gray-700">{product.rating.toFixed(1)}</span>
            )}
          </div>
          {/* Show reviews count if available */}
          {product.reviews !== undefined && product.reviews !== null && (
             <span className="text-sm text-gray-500">({product.reviews} reviews)</span>
          )}
        </div>

        {/* Price and Add to Cart Button */}
        <div className="flex items-center justify-between mt-auto"> {/* Added mt-auto to push to bottom */}
          <div className="text-xl font-bold text-gray-900">
             {/* Format price using Intl */}
             {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(product.price)}
          </div>
          <button
            onClick={handleAddToCartClick} // Use the specific click handler
            disabled={!product.inStock}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              product.inStock
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}