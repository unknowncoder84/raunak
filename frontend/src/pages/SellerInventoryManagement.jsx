import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, Plus, Edit, Trash2, ArrowLeft, Search, Filter,
  Download, RefreshCw, Eye, AlertCircle, CheckCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import supabaseService from '../services/supabaseService';

/**
 * Comprehensive Seller Inventory Management
 * Full CRUD operations for all 200+ products
 */
export default function SellerInventoryManagement({ user }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const productsPerPage = 20;

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const sellerId = user.email || user.id;
      
      // Initialize demo products first
      const { initializeDemoProducts } = await import('../data/sampleProducts');
      initializeDemoProducts();
      
      // Get products from supabaseService (includes localStorage products)
      let data = await supabaseService.getSellerProducts(sellerId);
      
      // If no products found, also check the main products list
      if (data.length === 0) {
        console.log('📦 No seller-specific products, loading all products...');
        const allProducts = await supabaseService.getProducts();
        // Filter by seller (case-insensitive)
        const sellerIdLower = sellerId?.toLowerCase();
        data = allProducts.filter(p => 
          p.seller_id?.toLowerCase() === sellerIdLower || 
          p.seller_email?.toLowerCase() === sellerIdLower
        );
      }
      
      setProducts(data);
      console.log(`📦 Loaded ${data.length} products for inventory`);
      
      // If still no products, force initialize
      if (data.length === 0) {
        console.log('🎬 Force initializing demo products...');
        const demoProducts = initializeDemoProducts();
        // Filter for current seller
        const sellerIdLower = sellerId?.toLowerCase();
        const sellerProducts = demoProducts.filter(p => 
          p.seller_email?.toLowerCase() === sellerIdLower
        );
        setProducts(sellerProducts);
        console.log(`✅ Initialized ${sellerProducts.length} demo products`);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (productData) => {
    try {
      const newProduct = {
        id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...productData,
        seller_id: user.id || user.email,
        seller_email: user.email,
        seller_name: user.storeName || user.name || 'Seller',
        blockchain_verified: true,
        created_at: new Date().toISOString()
      };

      const result = await supabaseService.addProduct(newProduct);
      
      if (result.success) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        toast.success('Product added successfully!');
        await loadProducts();
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    }
  };

  const handleUpdateProduct = async (productData) => {
    try {
      // Update in localStorage
      const storedProducts = JSON.parse(localStorage.getItem('w3mart_seller_products') || '[]');
      const index = storedProducts.findIndex(p => p.id === productData.id);
      
      if (index !== -1) {
        storedProducts[index] = { ...storedProducts[index], ...productData, updated_at: new Date().toISOString() };
        localStorage.setItem('w3mart_seller_products', JSON.stringify(storedProducts));
        
        toast.success('Product updated successfully!');
        await loadProducts();
        setShowEditModal(false);
        setSelectedProduct(null);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      // Delete from localStorage
      const storedProducts = JSON.parse(localStorage.getItem('w3mart_seller_products') || '[]');
      const filtered = storedProducts.filter(p => p.id !== productId);
      localStorage.setItem('w3mart_seller_products', JSON.stringify(filtered));
      
      toast.success('Product deleted successfully');
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return product.name.toLowerCase().includes(query) ||
             product.description?.toLowerCase().includes(query) ||
             product.id.toLowerCase().includes(query);
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage);

  // Categories
  const categories = ['all', ...new Set(products.map(p => p.category))];
  const stats = {
    total: products.length,
    inStock: products.filter(p => p.stock > 0).length,
    lowStock: products.filter(p => p.stock > 0 && p.stock <= 10).length,
    outOfStock: products.filter(p => p.stock === 0).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-gray-600">Manage all your products and stock levels</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={loadProducts} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowAddModal(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Products</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">In Stock</p>
                <p className="text-3xl font-bold text-green-600">{stats.inStock}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Low Stock</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.lowStock}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Out of Stock</p>
                <p className="text-3xl font-bold text-red-600">{stats.outOfStock}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-red-600" />
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
                placeholder="Search products by name, description, or ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border rounded-md"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Products Table */}
        {paginatedProducts.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your filters'
                : 'Add your first product to get started'}
            </p>
            <Button onClick={() => setShowAddModal(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </Card>
        ) : (
          <>
            <Card className="overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Image</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Product</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Category</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Price</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Stock</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Status</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.map((product, index) => (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-4 px-4">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-semibold text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-600 line-clamp-1">{product.description}</p>
                            <p className="text-xs text-gray-400 font-mono mt-1">{product.id}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline">{product.category}</Badge>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-semibold text-gray-900">{product.price} ETH</p>
                          {product.discount > 0 && (
                            <Badge variant="destructive" className="text-xs">{product.discount}% OFF</Badge>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <p className={`font-semibold ${
                            product.stock === 0 ? 'text-red-600' :
                            product.stock <= 10 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {product.stock}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={
                            product.stock === 0 ? 'destructive' :
                            product.stock <= 10 ? 'warning' :
                            'success'
                          }>
                            {product.stock === 0 ? 'Out of Stock' :
                             product.stock <= 10 ? 'Low Stock' :
                             'In Stock'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowEditModal(true);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(startIndex + productsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  {[...Array(totalPages)].map((_, i) => (
                    <Button
                      key={i}
                      variant={currentPage === i + 1 ? 'default' : 'outline'}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Add Product Modal */}
        {showAddModal && (
          <ProductModal
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddProduct}
          />
        )}

        {/* Edit Product Modal */}
        {showEditModal && selectedProduct && (
          <ProductModal
            product={selectedProduct}
            onClose={() => {
              setShowEditModal(false);
              setSelectedProduct(null);
            }}
            onSubmit={handleUpdateProduct}
          />
        )}
      </div>
    </div>
  );
}

function ProductModal({ product, onClose, onSubmit }) {
  const [formData, setFormData] = useState(product || {
    name: '',
    description: '',
    price: '',
    category: 'Electronics',
    stock: '',
    image: '',
    discount: 0
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        discount: parseInt(formData.discount) || 0
      };

      await onSubmit(productData);
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (ETH) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.001"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="stock">Stock Quantity *</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Mobiles">Mobiles</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Home">Home Appliances</option>
                  <option value="Books">Books</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>
              <div>
                <Label htmlFor="discount">Discount (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="image">Image URL *</Label>
              <Input
                id="image"
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
                required
              />
              {formData.image && (
                <img src={formData.image} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
