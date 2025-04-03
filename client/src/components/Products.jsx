import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import ProductCard from '../layouts/ProductCard';
import { FaSpinner, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import API_CONFIG from '../config/apiConfig.js';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Products = () => {
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Custom arrows for the carousel
  const NextArrow = ({ onClick }) => (
    <button 
      className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition-all"
      onClick={onClick}
    >
      <FaArrowRight className="text-purple-800" />
    </button>
  );

  NextArrow.propTypes = {
    onClick: PropTypes.func
  };

  const PrevArrow = ({ onClick }) => (
    <button 
      className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition-all"
      onClick={onClick}
    >
      <FaArrowLeft className="text-purple-800" />
    </button>
  );

  PrevArrow.propTypes = {
    onClick: PropTypes.func
  };

  // Carousel settings
  const settings = {
    dots: true,
    infinite: inventories.length > 3,
    speed: 500,
    slidesToShow: 3, // Reduced from 4 to 3 for larger cards
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      }
    ]
  };

  const fetchInventories = async () => {
    setLoading(true);
    try {
      // Fetch retrieved inventory items only
      const retrievedRes = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVENTORY.RETRIEVED.ALL}`);
      const retrievedData = await retrievedRes.json();

      // Filter items that have unit prices or final prices and have quantity
      const validItems = (retrievedData || [])
        .filter(item => 
          ((item.finalPrice && item.finalPrice > 0) || 
          (item.unitPrice && item.unitPrice > 0)) &&
          item.retrievedQuantity > 0
        )
        .map(item => ({
          ...item,
          quantity: item.retrievedQuantity // Map retrievedQuantity to quantity for ProductCard
        }));

      setInventories(validItems);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching inventories:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventories();
  }, []);

  const handleCardClick = (id) => {
    navigate(`/item/${id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-4xl text-purple-600" />
      </div>
    );
  }

  return (
    <div className="py-8 px-4 md:px-8">
      <h2 className="text-2xl font-bold text-center mb-8 text-purple-800">Featured Products</h2>
      {inventories.length > 0 ? (
        <div className="relative px-10">
          <Slider {...settings}>
            {inventories.map((item) => (
              <div key={item._id} className="px-4">
                <ProductCard
                  id={item._id}
                  img={item.image ? `${API_CONFIG.BASE_URL}/${item.image}` : '/default-img.jpg'}
                  name={item.ItemName}
                  price={item.finalPrice || item.unitPrice}
                  category={item.Category}
                  brand={item.Brand}
                  quantity={item.quantity}
                  onClick={() => handleCardClick(item._id)}
                />
              </div>
            ))}
          </Slider>
        </div>
      ) : (
        <div className="text-center text-gray-500">
          No products available at the moment.
        </div>
      )}
    </div>
  );
};

export default Products;