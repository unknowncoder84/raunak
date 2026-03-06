import { useState, useEffect } from 'react';
import { Star, Package, User, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import supabaseService from '../services/supabaseService';

/**
 * Seller Reviews Page - View all reviews for seller's products
 */
export default function SellerReviews({ user }) {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState('all');

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    // Get seller's products
    const sellerProducts = await supabaseService.getSellerProducts(user.id);
    setProducts(sellerProducts);

    // Get reviews for all products
    const allReviews = [];
    for (const product of sellerProducts) {
      const productReviews = await supabaseService.getProductReviews(product.id);
      allReviews.push(...productReviews.map(r => ({ ...r, product_name: product.name })));
    }
    setReviews(allReviews);
    setLoading(false);
  };

  const filteredReviews = selectedProduct === 'all'
    ? reviews
    : reviews.filter(r => r.product_id === selectedProduct);

  const averageRating = filteredReviews.length > 0
    ? (filteredReviews.reduce((sum, r) => sum + r.rating, 0) / filteredReviews.length).toFixed(1)
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: filteredReviews.filter(r => r.rating === rating).length,
    percentage: filteredReviews.length > 0
      ? (filteredReviews.filter(r => r.rating === rating).length / filteredReviews.length) * 100
      : 0
  }));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Customer Reviews ⭐
        </h1>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Rating</p>
                <p className="text-3xl font-bold text-gray-900">{averageRating}</p>
                <div className="flex items-center mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= averageRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Reviews</p>
                <p className="text-3xl font-bold text-gray-900">{filteredReviews.length}</p>
                <p className="text-sm text-gray-600 mt-2">Across all products</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Products Reviewed</p>
                <p className="text-3xl font-bold text-gray-900">
                  {new Set(filteredReviews.map(r => r.product_id)).size}
                </p>
                <p className="text-sm text-gray-600 mt-2">Out of {products.length} products</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <User className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Rating Distribution */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Rating Distribution</h2>
          <div className="space-y-3">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center space-x-3">
                <div className="flex items-center w-20">
                  <span className="text-sm font-medium text-gray-700">{rating}</span>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 ml-1" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-yellow-400 h-3 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Product Filter */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Filter by Product</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setSelectedProduct('all')}
              variant={selectedProduct === 'all' ? 'default' : 'outline'}
              size="sm"
            >
              All Products ({reviews.length})
            </Button>
            {products.map(product => {
              const productReviewCount = reviews.filter(r => r.product_id === product.id).length;
              return (
                <Button
                  key={product.id}
                  onClick={() => setSelectedProduct(product.id)}
                  variant={selectedProduct === product.id ? 'default' : 'outline'}
                  size="sm"
                >
                  {product.name} ({productReviewCount})
                </Button>
              );
            })}
          </div>
        </Card>

        {/* Reviews List */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Customer Reviews ({filteredReviews.length})
          </h2>

          {filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-600">
                {selectedProduct === 'all'
                  ? 'Reviews will appear here when customers review your products'
                  : 'No reviews for this product yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="border-b pb-6 last:border-b-0 last:pb-0">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3">
          <div className="bg-gray-200 rounded-full p-2">
            <User className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{review.user_name}</h4>
            <div className="flex items-center mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {review.rating}.0
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            {new Date(review.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {review.product_name && (
        <Badge variant="outline" className="mb-3">
          <Package className="h-3 w-3 mr-1" />
          {review.product_name}
        </Badge>
      )}

      <p className="text-gray-700 leading-relaxed">{review.comment}</p>
    </div>
  );
}
