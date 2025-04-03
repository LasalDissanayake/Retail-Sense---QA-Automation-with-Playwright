import { Link } from 'react-router-dom';
import { FaShoppingCart, FaStar, FaTag } from 'react-icons/fa';
import PropTypes from 'prop-types';

const ProductCard = ({ id, img, name, price = 0, category, brand, quantity = 0, originalPrice, onClick }) => {
  // Calculate discount percentage if originalPrice is provided
  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercentage = hasDiscount 
    ? Math.round(((originalPrice - price) / originalPrice) * 100) 
    : 0;

  // Format price with fallback to 0
  const formatPrice = (value) => {
    const numericValue = Number(value);
    return isNaN(numericValue) ? '0.00' : numericValue.toFixed(2);
  };

  return (
    <div 
      className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col cursor-pointer"
      onClick={onClick}
    >
      <div className="relative overflow-hidden h-60 group">
        <img 
          src={img} 
          alt={name} 
          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-300" 
        />
        
        {/* Stock status badges (right corner) */}
        {quantity <= 0 && (
          <div className="absolute top-0 right-0 bg-red-500 text-white px-3 py-1 m-2 rounded-full text-xs font-medium">
            Out of Stock
          </div>
        )}
        {quantity > 0 && quantity < 5 && (
          <div className="absolute top-0 right-0 bg-orange-500 text-white px-3 py-1 m-2 rounded-full text-xs font-medium">
            Low Stock
          </div>
        )}
        
        {/* Discount badge (left corner) */}
        {hasDiscount && (
          <div className="absolute top-0 left-0 bg-red-500 text-white m-2 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <FaTag className="rotate-180" />
            Save {discountPercentage}%
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className="text-yellow-400 text-xs" />
              ))}
            </div>
            <span className="text-xs">{brand}</span>
          </div>
        </div>
      </div>
      
      <div className="flex-grow flex flex-col p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">{name}</h3>
        <div className="mt-auto">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-purple-600">
              Rs. {formatPrice(price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">
                Rs. {formatPrice(originalPrice)}
              </span>
            )}
          </div>
          {category && (
            <span className="text-sm text-gray-600 mt-1 block">
              {category}
            </span>
          )}
          {brand && (
            <span className="text-sm text-gray-600 block">
              {brand}
            </span>
          )}
        </div>
      </div>
      
      <div className="mt-auto">
        <Link 
          to={`/item/${id}`} 
          className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium ${
            quantity > 0 
              ? 'bg-purple-700 hover:bg-purple-800 text-white' 
              : 'bg-gray-300 cursor-not-allowed text-gray-600'
          } transition-colors duration-300`}
          disabled={quantity <= 0}
        >
          <FaShoppingCart />
          {quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
        </Link>
      </div>
    </div>
  );
};

ProductCard.propTypes = {
  id: PropTypes.string.isRequired,
  img: PropTypes.string,
  name: PropTypes.string.isRequired,
  price: PropTypes.number,
  category: PropTypes.string,
  brand: PropTypes.string,
  quantity: PropTypes.number,
  originalPrice: PropTypes.number,
  onClick: PropTypes.func
};

export default ProductCard;
