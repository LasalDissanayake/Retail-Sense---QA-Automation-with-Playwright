import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiPlus } from 'react-icons/fi';
import { format } from 'date-fns';
import PropTypes from 'prop-types';
import API_CONFIG from '../../config/apiConfig';

const AddDiscount = ({ isOpen, onClose, item, onAddDiscount }) => {
  const [discountData, setDiscountData] = useState({
    type: 'Discount Code',
    discountValue: '',
    discountPercentage: '',
    discountType: 'flat',
    validUntil: '',
    promoCode: '',
    minimumPurchase: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    discountValue: '',
    discountPercentage: '',
    validUntil: '',
    promoCode: '',
    minimumPurchase: ''
  });

  // Reset form when opening the modal
  useEffect(() => {
    if (isOpen) {
      setDiscountData({
        type: 'Discount Code',
        discountValue: '',
        discountPercentage: '',
        discountType: 'flat',
        validUntil: '',
        promoCode: '',
        minimumPurchase: '',
      });
      setErrors({
        discountValue: '',
        discountPercentage: '',
        validUntil: '',
        promoCode: '',
        minimumPurchase: ''
      });
    }
  }, [isOpen]);

  const validateField = (name, value) => {
    switch (name) {
      case 'discountValue':
        if (value === '' || value === null) return 'Discount amount is required';
        if (parseFloat(value) < 0) return 'Discount amount cannot be negative';
        if (item && item.unitPrice && parseFloat(value) > item.unitPrice) 
          return `Discount cannot exceed unit price ($${item.unitPrice.toFixed(2)})`;
        return '';
        
      case 'discountPercentage':
        if (value === '' || value === null) return 'Discount percentage is required';
        if (parseFloat(value) < 1) return 'Discount percentage must be at least 1%';
        if (parseFloat(value) > 100) return 'Discount percentage cannot exceed 100%';
        return '';
        
      case 'validUntil':
        if (!value) return 'Valid until date is required';
        if (new Date(value) < new Date()) return 'Date cannot be in the past';
        return '';
        
      case 'promoCode':
        if (value && !/^[A-Za-z]{2,}.*\d+.*$/.test(value)) 
          return 'Promo code must have at least 2 letters and contain numbers';
        return '';
        
      case 'minimumPurchase':
        if (value && (isNaN(parseFloat(value)) || parseFloat(value) < 0)) 
          return 'Minimum purchase must be a positive number';
        return '';
        
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDiscountData(prev => ({ ...prev, [name]: value }));
    
    // Validate the field
    const errorMessage = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: errorMessage }));
  };

  const validateForm = () => {
    const newErrors = {
      discountValue: discountData.discountType === 'flat' 
        ? validateField('discountValue', discountData.discountValue)
        : '',
      discountPercentage: discountData.discountType === 'percentage'
        ? validateField('discountPercentage', discountData.discountPercentage)
        : '',
      validUntil: validateField('validUntil', discountData.validUntil),
      promoCode: validateField('promoCode', discountData.promoCode),
      minimumPurchase: validateField('minimumPurchase', discountData.minimumPurchase),
    };
    
    setErrors(newErrors);
    
    // Check if there are any errors
    return !Object.values(newErrors).some(error => error);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onAddDiscount(item, discountData);
      // Reset form after successful submission
      setDiscountData({
        type: 'Discount Code',
        discountValue: '',
        discountPercentage: '',
        discountType: 'flat',
        validUntil: '',
        promoCode: '',
        minimumPurchase: '',
      });
    } catch (error) {
      console.error('Error in discount submit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl relative"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <FiX size={24} />
      </button>

      <h2 className="text-2xl font-bold text-purple-800 mb-6 flex items-center">
        <span className="bg-purple-600 text-white p-2 rounded-full mr-3">
          <FiPlus size={20} />
        </span>
        Add Discount
      </h2>

      <div className="mb-6 flex items-start gap-4">
        <img
          src={item?.image ? `${API_CONFIG.BASE_URL}/${item.image}` : '/default-img.jpg'}
          alt={item?.ItemName}
          className="w-20 h-20 object-cover rounded-lg shadow-sm"
          onError={(e) => { e.target.src = '/default-img.jpg'; }}
        />
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{item?.ItemName}</h3>
          <p className="text-gray-600">Category: {item?.Category}</p>
          <p className="text-gray-600">Price: {item?.unitPrice ? `$${item.unitPrice.toFixed(2)}` : '-'}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Promotion Type</label>
          <select
            name="type"
            value={discountData.type}
            onChange={handleChange}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="Discount Code">Discount Code</option>
            <option value="Loyalty">Loyalty</option>
            <option value="Flash Sale">Flash Sale</option>
            <option value="Bundle">Bundle</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type</label>
          <select
            name="discountType"
            value={discountData.discountType}
            onChange={handleChange}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="flat">Flat Amount</option>
            <option value="percentage">Percentage</option>
          </select>
        </div>

        {discountData.discountType === 'flat' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Discount Amount *</label>
            <input
              type="number"
              name="discountValue"
              value={discountData.discountValue}
              onChange={handleChange}
              className={`w-full px-4 py-2 border-2 ${errors.discountValue ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-purple-500`}
              placeholder="Enter amount (e.g., 5)"
              min="0"
              step="0.01"
              required
            />
            {errors.discountValue && (
              <p className="mt-1 text-sm text-red-600">{errors.discountValue}</p>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Discount Percentage *</label>
            <input
              type="number"
              name="discountPercentage"
              value={discountData.discountPercentage}
              onChange={handleChange}
              className={`w-full px-4 py-2 border-2 ${errors.discountPercentage ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-purple-500`}
              placeholder="Enter percentage (e.g., 10)"
              min="1"
              max="100"
              step="1"
              required
            />
            {errors.discountPercentage && (
              <p className="mt-1 text-sm text-red-600">{errors.discountPercentage}</p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Valid Until *</label>
          <input
            type="datetime-local"
            name="validUntil"
            value={discountData.validUntil}
            onChange={handleChange}
            className={`w-full px-4 py-2 border-2 ${errors.validUntil ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-purple-500`}
            min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
            required
          />
          {errors.validUntil && (
            <p className="mt-1 text-sm text-red-600">{errors.validUntil}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Promo Code</label>
          <input
            type="text"
            name="promoCode"
            value={discountData.promoCode}
            onChange={handleChange}
            className={`w-full px-4 py-2 border-2 ${errors.promoCode ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-purple-500`}
            placeholder="Enter promo code (optional)"
          />
          {errors.promoCode && (
            <p className="mt-1 text-sm text-red-600">{errors.promoCode}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Purchase</label>
          <input
            type="number"
            name="minimumPurchase"
            value={discountData.minimumPurchase}
            onChange={handleChange}
            className={`w-full px-4 py-2 border-2 ${errors.minimumPurchase ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-purple-500`}
            placeholder="Enter minimum purchase (optional)"
            min="0"
            step="0.01"
          />
          {errors.minimumPurchase && (
            <p className="mt-1 text-sm text-red-600">{errors.minimumPurchase}</p>
          )}
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          {isSubmitting ? 'Saving...' : 'Save Discount'}
        </button>
      </div>
    </motion.div>
  );
};

AddDiscount.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  item: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    ItemName: PropTypes.string.isRequired,
    Category: PropTypes.string,
    unitPrice: PropTypes.number,
    image: PropTypes.string,
  }),
  onAddDiscount: PropTypes.func.isRequired,
};

export default AddDiscount;
