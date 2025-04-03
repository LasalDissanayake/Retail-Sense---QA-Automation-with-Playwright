import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPlus, FiMinus } from 'react-icons/fi';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import API_CONFIG from '../../config/apiConfig.js';
import { useNavigate } from 'react-router-dom';

const InventoryQuantityModal = ({ isOpen, onClose, item, onQuantityUpdate }) => {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState('');

  if (!isOpen || !item) return null;

  const handleSubmit = async (action) => {
    if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Quantity',
        text: 'Please enter a valid positive number for quantity',
        confirmButtonColor: '#89198f',
      });
      return;
    }

    const quantityChange = parseInt(quantity);
    const newQuantity = action === 'add' 
      ? item.Quantity + quantityChange
      : item.Quantity - quantityChange;

    if (newQuantity < 0) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Operation',
        text: 'Cannot reduce stock below zero',
        confirmButtonColor: '#89198f',
      });
      return;
    }

    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVENTORY.BASE}/${item.inventoryID}/stock-status`;
      const updateData = {
        Quantity: newQuantity,
        action, // Add action type (add/retrieve)
      };

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update quantity');
      }

      onQuantityUpdate(result);

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: `Successfully ${action === 'add' ? 'added' : 'retrieved'} ${quantity} items`,
        confirmButtonColor: '#89198f',
      }).then(() => {
        setQuantity('');
        onClose();
        if (action === 'retrieve') {
          navigate('/retrieved-inventory');
        }
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#89198f',
      });
    }
  };

  // Helper function to get proper image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    const relativePath = imagePath.replace(/.*uploads[/\\]/, 'uploads/');
    return `${API_CONFIG.BASE_URL}/${relativePath}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border-2 border-SecondaryColor"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-DarkColor hover:text-SecondaryColor transition-colors"
            >
              <FiX size={24} />
            </button>

            {/* Title */}
            <h2 className="text-2xl font-bold text-DarkColor mb-6 flex items-center">
              <div className="bg-PrimaryColor p-2 rounded-full mr-3">
                <FiPlus className="text-DarkColor" size={20} />
              </div>
              Manage Quantity: {item.ItemName}
            </h2>

            {/* Item Details */}
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.ItemName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%23cccccc"/><text x="50%" y="50%" font-size="12" text-anchor="middle" dy=".3em" fill="%23666666">No Image</text></svg>`;
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-DarkColor">{item.ItemName}</h3>
                  <p className="text-gray-600">Current Stock: {item.Quantity}</p>
                  <p className="text-gray-600">Reorder Threshold: {item.reorderThreshold}</p>
                  <p className="text-gray-600">Status: {item.StockStatus}</p>
                </div>
              </div>
            </div>

            {/* Quantity Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-DarkColor mb-2">
                Quantity to Add/Retrieve
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2 border-2 border-SecondaryColor rounded-lg focus:ring-2 focus:ring-DarkColor focus:border-transparent bg-PrimaryColor text-DarkColor"
                placeholder="Enter quantity"
                min="1"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => handleSubmit('add')}
                className="flex-1 bg-DarkColor text-white py-2 px-4 rounded-lg hover:opacity-90 transition-colors flex items-center justify-center gap-2"
              >
                <FiPlus size={20} />
                Add Stock
              </button>
              <button
                onClick={() => handleSubmit('retrieve')}
                className="flex-1 bg-SecondaryColor text-DarkColor py-2 px-4 rounded-lg hover:opacity-90 transition-colors flex items-center justify-center gap-2"
              >
                <FiMinus size={20} />
                Retrieve
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// PropTypes validation
InventoryQuantityModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onQuantityUpdate: PropTypes.func.isRequired,
  item: PropTypes.shape({
    inventoryID: PropTypes.number.isRequired,
    ItemName: PropTypes.string.isRequired,
    Category: PropTypes.string.isRequired,
    Quantity: PropTypes.number.isRequired,
    reorderThreshold: PropTypes.number.isRequired,
    StockStatus: PropTypes.string.isRequired,
    Brand: PropTypes.string.isRequired,
    Sizes: PropTypes.arrayOf(PropTypes.string).isRequired,
    Colors: PropTypes.arrayOf(PropTypes.string).isRequired,
    Gender: PropTypes.string.isRequired,
    Style: PropTypes.string.isRequired,
    image: PropTypes.string,
  }),
};

export default InventoryQuantityModal;