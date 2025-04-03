// React and Router imports
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// UI Framework imports
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Components
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProductCard from '../../layouts/ProductCard';

// Icons
import { FiShoppingCart, FiHeart, FiShare2, FiMinus, FiPlus } from "react-icons/fi";

// Config
import API_CONFIG from '../../config/apiConfig.js';

// Redux
import { useSelector } from "react-redux";

// Loader
import { TailSpin } from "react-loader-spinner";

const FashionItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);

  // State hooks
  const [fashionItem, setFashionItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [inventories, setInventories] = useState([]);
  const [availableQuantity, setAvailableQuantity] = useState(0);
  
  // Flag to check if retrieved endpoint should be used
  // Set to false initially since the endpoint seems to be unavailable
  const [useRetrievedEndpoint, setUseRetrievedEndpoint] = useState(false);

  // Parse arrays from server response
  const parseSizes = (sizes) => {
    if (!sizes) return [];
    try {
      if (Array.isArray(sizes)) return sizes.map(s => s.replace(/["\[\]]/g, '').trim());
      const parsed = JSON.parse(sizes);
      if (Array.isArray(parsed)) return parsed.map(s => s.replace(/["\[\]]/g, '').trim());
      return sizes.replace(/["\[\]]/g, '').split(',').map(s => s.trim()).filter(Boolean);
    } catch {
      return sizes.replace(/["\[\]]/g, '').split(',').map(s => s.trim()).filter(Boolean);
    }
  };

  const parseColors = (colors) => {
    if (!colors) return [];
    try {
      if (Array.isArray(colors)) return colors.map(c => c.replace(/["\[\]]/g, '').trim());
      const parsed = JSON.parse(colors);
      if (Array.isArray(parsed)) return parsed.map(c => c.replace(/["\[\]]/g, '').trim());
      return colors.replace(/["\[\]]/g, '').split(',').map(c => c.trim())
        .filter(c => c.startsWith('#') || isValidColorName(c));
    } catch {
      return colors.replace(/["\[\]]/g, '').split(',').map(c => c.trim())
        .filter(c => c.startsWith('#') || isValidColorName(c));
    }
  };

  const isValidColorName = (color) => {
    const validColors = [
      'black', 'white', 'red', 'green', 'blue', 'yellow', 'purple', 'orange',
      'pink', 'brown', 'gray', 'navy', 'teal', 'maroon', 'olive'
    ];
    return validColors.includes(color.toLowerCase());
  };

  const getColorValue = (color) => {
    if (color.startsWith('#')) return color;
    
    const tempEl = document.createElement('div');
    tempEl.style.color = color;
    document.body.appendChild(tempEl);
    const computedColor = window.getComputedStyle(tempEl).color;
    document.body.removeChild(tempEl);
    
    if (computedColor.startsWith('rgb')) {
      const [r, g, b] = computedColor.match(/\d+/g);
      return `#${[r, g, b].map(x => parseInt(x).toString(16).padStart(2, '0')).join('')}`;
    }
    
    return color;
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity > availableQuantity) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Quantity',
        text: `Only ${availableQuantity} items available in stock!`,
      });
      return;
    }
    setQuantity(Math.max(1, newQuantity));
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/default-img.jpg';
    return imagePath.startsWith('http') ? imagePath : `${API_CONFIG.BASE_URL}/${imagePath}`;
  };

  // Fetch item data from backend API
  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch main inventory item
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/inventory/${id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch item data (Status: ${response.status})`);
        }
        const data = await response.json();

        // Fetch retrieved inventory to get the correct quantity
        const retrievedResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVENTORY.RETRIEVED.ALL}`);
        if (!retrievedResponse.ok) {
          throw new Error(`Failed to fetch retrieved inventory (Status: ${retrievedResponse.status})`);
        }
        const retrievedData = await retrievedResponse.json();
        
        // Find this item in retrieved inventory by matching item ID
        const retrievedItem = retrievedData.find(item => item.itemId === id || item._id === id);
        
        // Set available quantity from retrieved inventory
        const availableQty = retrievedItem ? retrievedItem.retrievedQuantity : 0;
        setAvailableQuantity(availableQty);

        // Process the item data
        if (data) {
          const processedItem = {
            ...data,
            Sizes: parseSizes(data.Sizes),
            Colors: parseColors(data.Colors),
          };
          setFashionItem(processedItem);
          
          if (processedItem.Sizes?.length > 0) {
            setSelectedSize(processedItem.Sizes[0]);
          }
          if (processedItem.Colors?.length > 0) {
            setSelectedColor(processedItem.Colors[0]);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching item:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    if (id) {
      fetchItem();
    }
  }, [id]);

  // Fetch recommended inventories
  const fetchInventories = async () => {
    try {
      // Fetch retrieved inventory items only
      const retrievedRes = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVENTORY.RETRIEVED.ALL}`);
      if (!retrievedRes.ok) {
        throw new Error('Failed to fetch recommended items');
      }
      const retrievedData = await retrievedRes.json();

      // Filter items that have prices and quantity, excluding current item
      const validItems = (retrievedData || [])
        .filter(item => 
          item._id !== id && // Exclude current item
          ((item.finalPrice && item.finalPrice > 0) || 
          (item.unitPrice && item.unitPrice > 0)) &&
          item.retrievedQuantity > 0
        )
        .map(item => ({
          ...item,
          quantity: item.retrievedQuantity // Map retrievedQuantity to quantity for ProductCard
        }))
        .slice(0, 4); // Limit to 4 items

      setInventories(validItems);
    } catch (error) {
      console.error("Error fetching inventories:", error);
    }
  };

  useEffect(() => {
    if (!loading && fashionItem) {
      fetchInventories();
    }
  }, [id, loading, fashionItem]);

  const handleAddToCart = () => {
    if (!currentUser) {
      Swal.fire({
        title: "Please log in",
        text: "You need to log in to add items to the cart.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      const cartItem = {
        userId: currentUser._id,
        itemId: id,
        title: fashionItem.ItemName,
        img: getImageUrl(fashionItem.image),
        price: fashionItem.finalPrice || fashionItem.unitPrice,
        quantity,
        size: selectedSize,
        color: selectedColor,
      };

      let cart = JSON.parse(localStorage.getItem("cart")) || [];
      cart.push(cartItem);
      localStorage.setItem("cart", JSON.stringify(cart));

      Swal.fire({
        title: "Item added to cart successfully!",
        text: "Would you like to view your cart or add more items?",
        icon: "success",
        showCancelButton: true,
        confirmButtonText: "Go to Cart",
        cancelButtonText: "Add More",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/cart";
        }
      });
    } catch (error) {
      console.error('Error adding item to cart:', error);
      Swal.fire({
        title: "Error!",
        text: "An error occurred while adding the item to the cart. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const renderRecommendedItems = () => {
    if (inventories.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-16"
      >
        <h2 className="text-2xl font-bold text-center mb-8 relative">
          <span className="relative z-10">You May Also Like</span>
          <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-48 h-3 bg-purple-200 -z-1 rounded-full opacity-50"></span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
          {inventories.map((item) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ProductCard
                id={item._id}
                img={item.image ? `${API_CONFIG.BASE_URL}/${item.image}` : '/default-img.jpg'}
                name={item.ItemName}
                price={item.finalPrice || item.unitPrice}
                category={item.Category}
                brand={item.Brand}
                quantity={item.quantity}
                onClick={() => navigate(`/item/${item._id}`)}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <Navbar />
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8 max-w-6xl pt-24" 
      >
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <TailSpin color="#9333ea" height={50} width={50} />
          </div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : fashionItem ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-2xl shadow-xl p-6 md:p-8">
              {/* Image Section */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative group"
              >
                <img
                  src={getImageUrl(fashionItem.image)}
                  alt={fashionItem.ItemName}
                  className="w-full h-[400px] md:h-[500px] object-cover rounded-xl shadow-lg transform group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { e.target.src = '/default-img.jpg' }}
                />
                <div className="absolute top-4 right-4 flex flex-col gap-3">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2.5 bg-white rounded-full shadow-lg hover:bg-pink-50 transition-colors"
                  >
                    <FiHeart className="text-pink-500 w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2.5 bg-white rounded-full shadow-lg hover:bg-blue-50 transition-colors"
                  >
                    <FiShare2 className="text-blue-500 w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>

              {/* Details Section */}
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col gap-5"
              >
                <div>
                  <motion.h1 
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    className="text-2xl md:text-3xl font-bold text-gray-800 mb-2"
                  >
                    {fashionItem.ItemName}
                  </motion.h1>
                  <motion.div 
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl md:text-2xl font-semibold text-purple-600"
                  >
                    Rs. {(fashionItem.Price || fashionItem.unitPrice || 0).toFixed(2)}
                  </motion.div>
                </div>

                {/* Product Info Grid */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-2 gap-3 bg-gray-50 p-3 md:p-4 rounded-xl"
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="text-gray-500 text-sm">Brand</span>
                    <span className="font-semibold">{fashionItem.Brand || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-gray-500 text-sm">Category</span>
                    <span className="font-semibold">{fashionItem.Category}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-gray-500 text-sm">Style</span>
                    <span className="font-semibold">{fashionItem.Style || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-gray-500 text-sm">Available</span>
                    <span className="font-semibold text-green-600">{availableQuantity} items</span>
                  </div>
                </motion.div>

                {/* Size Selection */}
                {fashionItem.Sizes?.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-2.5"
                  >
                    <label className="text-gray-700 font-medium text-sm">Select Size</label>
                    <div className="flex flex-wrap gap-2">
                      {fashionItem.Sizes.map((size) => (
                        <motion.button
                          key={size}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedSize(size)}
                          className={`px-5 py-2.5 rounded-lg border-2 transition-all ${
                            selectedSize === size
                              ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                              : 'border-gray-200 hover:border-purple-200'
                          }`}
                        >
                          {size}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Color Selection */}
                {fashionItem.Colors?.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-2.5"
                  >
                    <label className="text-gray-700 font-medium text-sm">Select Color</label>
                    <div className="flex flex-wrap gap-3">
                      {fashionItem.Colors.map((color) => (
                        <motion.button
                          key={color}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setSelectedColor(color)}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${
                            selectedColor === color 
                              ? 'ring-2 ring-purple-500 ring-offset-2 scale-110' 
                              : 'hover:ring-2 hover:ring-purple-200 hover:ring-offset-1'
                          }`}
                          style={{ backgroundColor: getColorValue(color) }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Quantity Selection */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex items-center gap-4"
                >
                  <label className="text-gray-700 font-medium text-sm">Quantity</label>
                  <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-lg">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleQuantityChange(quantity - 1)}
                      className="p-1.5 rounded-full bg-white hover:bg-gray-100 transition-colors shadow-sm"
                      disabled={quantity <= 1}
                    >
                      <FiMinus className={quantity <= 1 ? 'text-gray-400' : 'text-gray-600'} />
                    </motion.button>
                    <span className="w-8 text-center font-semibold">{quantity}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleQuantityChange(quantity + 1)}
                      className="p-1.5 rounded-full bg-white hover:bg-gray-100 transition-colors shadow-sm"
                      disabled={quantity >= availableQuantity}
                    >
                      <FiPlus className={quantity >= availableQuantity ? 'text-gray-400' : 'text-gray-600'} />
                    </motion.button>
                  </div>
                  <span className="text-sm text-gray-500">
                    ({availableQuantity} available)
                  </span>
                </motion.div>

                {/* Add to Cart Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mt-4"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddToCart}
                    disabled={availableQuantity === 0}
                    className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg ${
                      availableQuantity === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    <FiShoppingCart className="w-5 h-5" />
                    {availableQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </motion.button>
                </motion.div>
              </motion.div>
            </div>

            {renderRecommendedItems()}
          </>
        ) : null}
      </motion.div>

      <Footer />
    </div>
  );
};

export default FashionItem;