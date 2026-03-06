import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Star, Package, User, Calendar, ArrowLeft, Search, 
  MessageSquare, TrendingUp, Award, Filter
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import supabaseService from '../services/supabaseService';

/**
 * Comprehensive Seller Reviews Management
 * Groups reviews by product with ratings and management options
 */
export default function SellerReviewsManagement({ user }) {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      // Get seller's products
      const sellerId = user.email || user.id;
      const sellerProducts = await supabaseService.getSellerProducts(sellerId);
      setProducts(sellerProducts);

      // Get reviews for all products
      const allReviews = [];
      for (const product of sellerProducts) {
        const productReviews = await supabaseService.getProductReviews(product.id);
        allReviews.push(...productReviews.map(r => ({ 
          ...r, 
          product_name: product.name,
          product_image: product.image,
          product_id: product.id
        })));
      }
      
      setReviews(allReviews);
      console.log(`📊 Loaded ${allReviews.length} reviews for ${sellerProducts.length} products`);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  // Group reviews by product
  const groupedReviews = products.map(product => {
    const productReviews = reviews.filter(r => r.product_id === product.id);
    const avgRating = productReviews.length > 0
      ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1)
      : 0;
    
    return {
      product,
      reviews: productReviews,
      totalReviews: productReviews.length,
      avgRating: parseFloat(avgRating),
      ratingDistribution: {
        5: productReviews.filter(r => r.rating === 5).length,
        4: productReviews.filter(r => r.rating === 4).length,
        3: productReviews.filter(r => r.rating === 3).length,
        2: productReviews.filter(r => r.rating === 2).length,
        1: productReviews.filter(r => r.rating === 1).length
      }
    };
  }).filter(group => {
    if (selectedProduct !== 'all' && group.product.id !== selectedProduct) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return group.product.name.toLowerCase().includes(query) ||
             group.reviews.some(r => r.comment?.toLowerCase().includes(query));
    }
    return true;
  });

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : 0;

  const handleRespondToReview = (review) => {
    setSelectedReview(review);
    setShowResponseModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/seller/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reviews Management</h1>
              <p className="text-gray-600">Manage customer feedback and ratings</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Reviews</p>
                <p className="text-3xl font-bold text-gray-900">{totalReviews}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Rating</p>
                <p className="text-3xl font-bold text-gray-900">{avgRating}</p>
                <div className="flex items-center mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= avgRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Products Reviewed</p>
                <p className="text-3xl font-bold text-gray-900">
                  {groupedReviews.filter(g => g.totalReviews > 0).length}
                </p>
                <p className="text-sm text-gray-500 mt-1">of {products.length} products</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">5-Star Reviews</p>
                <p className="text-3xl font-bold text-gray-900">
                  {reviews.filter(r => r.rating === 5).length}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {totalReviews > 0 ? ((reviews.filter(r => r.rating === 5).length / totalReviews) * 100).toFixed(0) : 0}% of total
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center space-x-2">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search reviews or products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="px-4 py-2 border rounded-md"
              >
                <option value="all">All Products ({totalReviews})</option>
                {products.map(product => {
                  const count = reviews.filter(r => r.product_id === product.id).length;
                  return (
                    <option key={product.id} value={product.id}>
                      {product.name} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </Card>

        {/* Reviews by Product */}
        {groupedReviews.length === 0 ? (
          <Card className="p-12 text-center">
            <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No reviews found</h3>
            <p className="text-gray-600">
              {selectedProduct === 'all' 
                ? 'Reviews will appear here when customers review your products'
                : 'No reviews for this product yet'}
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupedReviews.map((group, index) => (
              <motion.div
                key={group.product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ProductReviewGroup 
                  group={group} 
                  onRespond={handleRespondToReview}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Response Modal */}
        {showResponseModal && selectedReview && (
          <ResponseModal
            review={selectedReview}
            onClose={() => {
              setShowResponseModal(false);
              setSelectedReview(null);
            }}
            onSubmit={(response) => {
              toast.success('Response sent to customer');
              setShowResponseModal(false);
              setSelectedReview(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function ProductReviewGroup({ group, onRespond }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card className="overflow-hidden">
      {/* Product Header */}
      <div 
        className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 cursor-pointer hover:from-blue-100 hover:to-purple-100 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src={group.product.image}
              alt={group.product.name}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{group.product.name}</h3>
              <div className="flex items-center space-x-4 mt-1">
                <div className="flex items-center">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="font-semibold text-gray-900">{group.avgRating}</span>
                  <span className="text-gray-600 ml-1">({group.totalReviews} reviews)</span>
                </div>
                <Badge variant="outline">{group.product.category}</Badge>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-2">
              {[5, 4, 3, 2, 1].map(rating => (
                <div key={rating} className="text-center">
                  <div className="text-xs text-gray-600">{rating}★</div>
                  <div className="text-sm font-semibold">{group.ratingDistribution[rating]}</div>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm">
              {expanded ? 'Hide' : 'Show'} Reviews
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {expanded && (
        <div className="p-6 space-y-4">
          {group.reviews.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No reviews yet for this product</p>
          ) : (
            group.reviews.map((review) => (
              <ReviewCard key={review.id} review={review} onRespond={onRespond} />
            ))
          )}
        </div>
      )}
    </Card>
  );
}

function ReviewCard({ review, onRespond }) {
  return (
    <div className="border-b pb-4 last:border-b-0 last:pb-0">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3">
          <div className="bg-gray-200 rounded-full p-2">
            <User className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{review.user_name || 'Customer'}</h4>
            <div className="flex items-center mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-gray-600">{review.rating}.0</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <Calendar className="h-4 w-4 mr-1" />
            {new Date(review.created_at).toLocaleDateString()}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onRespond(review)}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Respond
          </Button>
        </div>
      </div>

      <p className="text-gray-700 leading-relaxed ml-11">{review.comment}</p>
      
      {review.response && (
        <div className="ml-11 mt-3 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900 mb-1">Your Response:</p>
          <p className="text-sm text-gray-700">{review.response}</p>
        </div>
      )}
    </div>
  );
}

function ResponseModal({ review, onClose, onSubmit }) {
  const [response, setResponse] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (response.trim()) {
      onSubmit(response);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="w-full max-w-2xl">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Respond to Review</h2>
          
          {/* Review Preview */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-2">
              <User className="h-5 w-5 text-gray-600 mr-2" />
              <span className="font-semibold">{review.user_name || 'Customer'}</span>
              <div className="flex items-center ml-auto">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-gray-700">{review.comment}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Response
              </label>
              <Textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Thank you for your feedback..."
                rows={4}
                required
              />
            </div>

            <div className="flex space-x-3">
              <Button type="submit" className="flex-1">
                Send Response
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
