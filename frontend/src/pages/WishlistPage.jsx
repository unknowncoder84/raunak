import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useCart } from '../contexts/CartContext';

/**
 * Wishlist Page - Saved products for later
 */
export default function WishlistPage({ user }) {
  const [wishlist, setWishlist] = useState([]);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadWishlist();
  }, [user, navigate]);

  const loadWishlist = () => {
    const saved = JSON.parse(localStorage.getItem('w3mart_wishlist') || '[]');
    setWishlist(saved);
  };

  const removeFromWishlist = (productId) => {
    const newWishlist = wishlist.filter(item => item.id !== productId);
    setWishlist(newWishlist);
    localStorage.setItem('w3mart_wishlist', JSON.stringify(newWishlist));
    toast.info('Removed from wishlist');
  };

  const handleAddToCart = (product) => {
    if (user.role === 'seller') {
      toast.error('Sellers cannot add products to cart');
      return;
    }
    addToCart(product);
    toast.success('Added to cart');
  };

  const clearWishlist = () => {
    if (window.confirm('Clear all items from wishlist?')) {
      setWishlist([]);
      localStorage.setItem('w3mart_wishlist', JSON.stringify([]));
      toast.success('Wishlist cleared');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-500 fill-current" />
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
            <Badge variant="secondary" className="text-lg">
              {wishlist.length} items
            </Badge>
          </div>
          
          {wishlist.length > 0 && (
            <Button
              variant="outline"
              onClick={clearWishlist}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        {/* Empty State */}
        {wishlist.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-sm">
            <Heart className="h-20 w-20 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Save items you love to buy them later
            </p>
            <Link to="/">
              <Button>
                <Package className="h-4 w-4 mr-2" />
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Product Image */}
                <Link to={`/product/${product.id}`}>
                  <div className="relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-56 object-cover"
                    />
                    {product.discount > 0 && (
                      <Badge className="absolute top-3 right-3 bg-red-500 text-white">
                        {product.discount}% OFF
                      </Badge>
                    )}
                  </div>
                </Link>

                {/* Product Details */}
                <div className="p-4">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600">
                      {product.name}
                    </h3>
                  </Link>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold text-gray-900">
                      {product.price} ETH
                    </span>
                    {product.discount > 0 && (
                      <span className="text-sm text-gray-500 line-through">
                        {(product.price / (1 - product.discount / 100)).toFixed(4)} ETH
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {user.role !== 'seller' && (
                      <Button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1"
                        size="sm"
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Add to Cart
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => removeFromWishlist(product.id)}
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
