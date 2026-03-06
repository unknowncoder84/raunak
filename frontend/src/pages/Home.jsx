import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, TrendingDown, Package, ShoppingCart, Search, SlidersHorizontal, Heart, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import supabaseService from '../services/supabaseService';
import { useCart } from '../contexts/CartContext';

/**
 * Home Page - Product grid with Flipkart-inspired design
 */
export default function Home({ user, isDemoMode, searchQuery, selectedCategory }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState(selectedCategory || 'All');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10 });
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
    loadWishlist();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      setCategoryFilter(selectedCategory);
    }
  }, [selectedCategory]);

  const loadProducts = async () => {
    setLoading(true);
    // W3 Mart Standard: 1.5-second skeleton loading for realistic feel
    await new Promise(resolve => setTimeout(resolve, 1500));
    const data = await supabaseService.getProducts();
    setProducts(data || []); // Ensure it's always an array
    setLoading(false);
  };

  const loadWishlist = () => {
    const saved = JSON.parse(localStorage.getItem('w3mart_wishlist') || '[]');
    setWishlist(saved);
  };

  const toggleWishlist = (product) => {
    const isInWishlist = wishlist.some(item => item.id === product.id);
    let newWishlist;
    
    if (isInWishlist) {
      newWishlist = wishlist.filter(item => item.id !== product.id);
      toast.info('Removed from wishlist');
    } else {
      newWishlist = [...wishlist, product];
      toast.success('Added to wishlist ❤️');
    }
    
    setWishlist(newWishlist);
    localStorage.setItem('w3mart_wishlist', JSON.stringify(newWishlist));
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => item.id === productId);
  };

  const categories = ['All', 'Mobiles', 'Fashion', 'Electronics', 'Home', 'Books', 'Sports', 'Gaming'];
  
  // Filter by category - with safety check
  let filteredProducts = categoryFilter === 'All' 
    ? (products || [])
    : (products || []).filter(p => p.category === categoryFilter);

  // Filter by search query (both prop and local)
  const activeSearchQuery = searchQuery || localSearchQuery;
  if (activeSearchQuery && activeSearchQuery.trim()) {
    const query = activeSearchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.seller_name.toLowerCase().includes(query)
    );
  }

  // Filter by price range
  filteredProducts = filteredProducts.filter(p => {
    const price = parseFloat(p.price);
    return price >= priceRange.min && price <= priceRange.max;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return parseFloat(a.price) - parseFloat(b.price);
      case 'price-high':
        return parseFloat(b.price) - parseFloat(a.price);
      case 'discount':
        return (b.discount || 0) - (a.discount || 0);
      case 'newest':
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Scrolling Advertisement Banner */}
      <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-white py-2 overflow-hidden">
        <div className="scrolling-banner">
          <div className="scrolling-content">
            <span className="banner-item">🔥 MEGA SALE: Up to 50% OFF on Electronics!</span>
            <span className="banner-item">⚡ FREE Shipping on orders above 0.1 ETH</span>
            <span className="banner-item">🎁 New User Offer: Get 20% OFF on first purchase</span>
            <span className="banner-item">🛡️ 100% Blockchain Verified Products</span>
            <span className="banner-item">💎 Exclusive Deals: Limited Time Only!</span>
            <span className="banner-item">🚀 Fast Delivery with Escrow Protection</span>
            {/* Duplicate for seamless loop */}
            <span className="banner-item">🔥 MEGA SALE: Up to 50% OFF on Electronics!</span>
            <span className="banner-item">⚡ FREE Shipping on orders above 0.1 ETH</span>
            <span className="banner-item">🎁 New User Offer: Get 20% OFF on first purchase</span>
            <span className="banner-item">🛡️ 100% Blockchain Verified Products</span>
            <span className="banner-item">💎 Exclusive Deals: Limited Time Only!</span>
            <span className="banner-item">🚀 Fast Delivery with Escrow Protection</span>
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 text-white py-12 animate-gradient">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-slide-up" data-testid="hero-title">
              Blockchain-Powered Shopping
            </h1>
            <p className="text-lg text-blue-100 mb-6 animate-slide-up-delay">
              Every transaction secured by smart contracts. Every payment in escrow until delivery. Zero fraud, complete transparency.
            </p>
            <div className="flex flex-wrap gap-4 animate-slide-up-delay-2">
              <Feature icon={<ShieldCheck />} text="Escrow Protected" />
              <Feature icon={<Package />} text="Verified Reviews" />
              <Feature icon={<TrendingDown />} text="Best Prices" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search Bar */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for products, brands, categories..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-12 w-full"
              />
              {localSearchQuery && (
                <button
                  onClick={() => setLocalSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 h-12"
            >
              <SlidersHorizontal className="h-5 w-5" />
              Filters
            </Button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-12 px-4 border rounded-md bg-white"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="discount">Highest Discount</option>
              <option value="newest">Newest First</option>
            </select>

            {/* Wishlist Link */}
            {user && (
              <Link to="/wishlist">
                <Button variant="outline" className="flex items-center gap-2 h-12">
                  <Heart className="h-5 w-5" />
                  Wishlist ({wishlist.length})
                </Button>
              </Link>
            )}
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range (ETH)
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: parseFloat(e.target.value) || 0 })}
                      className="w-24"
                    />
                    <span className="text-gray-500">to</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: parseFloat(e.target.value) || 10 })}
                      className="w-24"
                    />
                  </div>
                </div>

                {/* Results Count */}
                <div className="flex items-end">
                  <div className="text-sm text-gray-600">
                    <strong>{sortedProducts.length}</strong> products match your filters
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="mt-4 flex justify-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setLocalSearchQuery('');
                    setPriceRange({ min: 0, max: 10 });
                    setSortBy('featured');
                    setCategoryFilter('All');
                  }}
                  className="text-sm"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white border-b sticky top-[140px] z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-[#2874f0] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                data-testid={`category-${cat.toLowerCase().replace(' ', '-')}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            <div className="mb-4 text-gray-600">
              Showing {sortedProducts.length} products
              {categoryFilter !== 'All' && ` in ${categoryFilter}`}
              {activeSearchQuery && ` matching "${activeSearchQuery}"`}
            </div>
            {sortedProducts.length === 0 ? (
              <div className="text-center py-20">
                <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedProducts.map((product, index) => (
                  <div 
                    key={product.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <ProductCard product={product} user={user} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Feature({ icon, text }) {
  return (
    <div className="flex items-center space-x-2 bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-full">
      <div className="h-5 w-5">{icon}</div>
      <span className="font-medium">{text}</span>
    </div>
  );
}

function ProductCard({ product, user }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = () => {
    const saved = JSON.parse(localStorage.getItem('w3mart_wishlist') || '[]');
    setWishlist(saved);
  };

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.info('Please login to add to wishlist');
      return;
    }

    const isInWishlist = wishlist.some(item => item.id === product.id);
    let newWishlist;
    
    if (isInWishlist) {
      newWishlist = wishlist.filter(item => item.id !== product.id);
      toast.info('Removed from wishlist');
    } else {
      newWishlist = [...wishlist, product];
      toast.success('Added to wishlist ❤️');
    }
    
    setWishlist(newWishlist);
    localStorage.setItem('w3mart_wishlist', JSON.stringify(newWishlist));
  };

  const isInWishlist = wishlist.some(item => item.id === product.id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/');
      return;
    }
    if (user.role === 'seller') {
      return;
    }
    addToCart(product);
  };

  return (
    <Link to={`/product/${product.id}`}>
      <div className="product-card bg-white rounded-lg shadow-md overflow-hidden cursor-pointer" data-testid={`product-card-${product.id}`}>
        {/* Image */}
        <div className="relative">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-56 object-cover"
          />
          {product.blockchain_verified && (
            <Badge 
              className="absolute top-3 left-3 bg-green-500 text-white verified-badge"
              data-testid="blockchain-badge"
            >
              <ShieldCheck className="h-3 w-3 mr-1" />
              Blockchain Verified
            </Badge>
          )}
          {product.discount > 0 && (
            <Badge className="absolute top-3 right-3 bg-red-500 text-white">
              {product.discount}% OFF
            </Badge>
          )}
          
          {/* Wishlist Heart Button */}
          {user && (
            <button
              onClick={toggleWishlist}
              className={`absolute bottom-3 right-3 p-2 rounded-full shadow-lg transition-all ${
                isInWishlist 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white text-gray-600 hover:bg-red-50'
              }`}
            >
              <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2" data-testid="product-name">
            {product.name}
          </h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>

          {/* Price */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-gray-900" data-testid="product-price">
                  {product.price} ETH
                </span>
                {product.discount > 0 && (
                  <span className="text-sm text-gray-500 line-through">
                    {(product.price / (1 - product.discount / 100)).toFixed(3)} ETH
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">by {product.seller_name}</p>
            </div>
          </div>

          {/* Stock */}
          <div className="mb-3 pb-3 border-b">
            <p className="text-xs text-gray-600">
              <Package className="h-3 w-3 inline mr-1" />
              {product.stock} in stock
            </p>
          </div>

          {/* Add to Cart Button */}
          {user && user.role === 'buyer' && (
            <Button
              onClick={handleAddToCart}
              className="w-full bg-[#ff9f00] hover:bg-[#e68a00] text-white"
              size="sm"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          )}
        </div>
      </div>
    </Link>
  );
}

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <Skeleton className="w-full h-56" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}