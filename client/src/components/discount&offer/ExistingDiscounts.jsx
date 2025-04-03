import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { FiPlus, FiEdit } from 'react-icons/fi';
import { MdLocalOffer } from "react-icons/md";
import Swal from 'sweetalert2';
import API_CONFIG from '../../config/apiConfig'; // Adjust path as needed
import AddDiscount from './AddDiscount';
import EditDiscount from './EditDiscount';
import PropTypes from 'prop-types';

const DiscountTable = () => {
  const [retrievedItems, setRetrievedItems] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch RetrievedInventory and Promotions
  const fetchData = async () => {
    try {
      const retrievedResponse = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVENTORY.RETRIEVED.ALL}`);
      console.log('Retrieved Response:', retrievedResponse.data);
      const retrievedData = retrievedResponse.data.data || retrievedResponse.data || [];
      const parsedItems = retrievedData.map(item => {
        const sizesString = item.Sizes ? item.Sizes.join('') : '[]';
        const colorsString = item.Colors ? item.Colors.join('') : '[]';
        const cleanSizesString = sizesString.replace(/\\/g, '').replace(/^\[|\]$/g, '');
        const cleanColorsString = colorsString.replace(/\\/g, '').replace(/^\[|\]$/g, '');
        const sizes = cleanSizesString ? cleanSizesString.split(',') : [];
        const colors = cleanColorsString ? cleanColorsString.split(',') : [];
        return { ...item, Sizes: sizes, Colors: colors };
      });
      setRetrievedItems(parsedItems);

      const promotionResponse = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROMOTIONS}`);
      console.log('Promotions Response:', promotionResponse.data);
      const promotionData = promotionResponse.data.data || promotionResponse.data || [];
      setPromotions(promotionData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch data',
        confirmButtonColor: '#89198f',
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get promotion details for a specific item
  const getItemPromotion = (itemId) => {
    const itemIdStr = itemId.toString();
    const promo = promotions.find(promo => {
      // Check if applicableProducts contains the itemId, handling objects or strings
      const hasProduct = promo.applicableProducts.some(product => {
        // If product is an object (e.g., RetrievedInventory), use _id; otherwise, use the value directly
        const productId = typeof product === 'object' && product._id ? product._id.toString() : product.toString();
        return productId === itemIdStr;
      });
      console.log(`Checking promotion for item ${itemIdStr}:`, promo, 'Applicable Products:', promo?.applicableProducts);
      return hasProduct;
    });
    return promo || null;
  };

  // Handle adding/updating a promotion
  const handleAddDiscount = async (item, discountData) => {
    try {
      const existingPromo = getItemPromotion(item._id);
      const url = existingPromo
        ? `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROMOTIONS}/${existingPromo.promotionID}`
        : `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROMOTIONS}`;
      const method = existingPromo ? 'put' : 'post';

      // Calculate finalPrice based on discount type and amount
      let finalPrice = item.unitPrice || 0;
      if (discountData.discountType === 'flat' && discountData.discountValue) {
        finalPrice = Math.max(0, finalPrice - parseFloat(discountData.discountValue));
      } else if (discountData.discountType === 'percentage' && discountData.discountPercentage) {
        const discountAmount = (finalPrice * parseFloat(discountData.discountPercentage)) / 100;
        finalPrice = Math.max(0, finalPrice - discountAmount);
      }

      // Ensure finalPrice is a valid number
      finalPrice = isNaN(finalPrice) ? 0 : finalPrice;
      
      console.log('Calculated finalPrice:', finalPrice);

      const promotionData = {
        promotionID: existingPromo ? existingPromo.promotionID : Date.now(),
        type: discountData.type,
        discountValue: discountData.discountType === 'flat' ? parseFloat(discountData.discountValue) : undefined,
        discountPercentage: discountData.discountType === 'percentage' ? parseFloat(discountData.discountPercentage) : undefined,
        discountType: discountData.discountType,
        validUntil: discountData.validUntil,
        promoCode: discountData.promoCode || `DISC${item.inventoryID}`,
        applicableProducts: [item._id],
        minimumPurchase: parseFloat(discountData.minimumPurchase) || 0,
      };

      const response = await axios({
        method,
        url,
        data: promotionData,
      });

      console.log('Discount Response:', response.data);

      // Update the finalPrice in RetrievedInventory - ensure we're sending valid JSON
      try {
        const finalPriceResponse = await axios.put(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVENTORY.RETRIEVED.SINGLE(item._id)}`, 
          { finalPrice: finalPrice }
        );
        console.log('Final price update response:', finalPriceResponse.data);
      } catch (finalPriceError) {
        console.error('Error updating final price:', finalPriceError);
        console.log('Error details:', finalPriceError.response?.data);
      }

      const newPromo = response.data.data || response.data;
      if (method === 'post') {
        setPromotions(prev => [...prev, newPromo]);
      } else {
        setPromotions(prev =>
          prev.map(p => (p.promotionID === existingPromo.promotionID ? newPromo : p))
        );
      }

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: `Discount ${existingPromo ? 'updated' : 'added'} successfully!`,
        confirmButtonColor: '#89198f',
      });

      await fetchData();

      setIsAddModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error managing discount:', error);
      console.log('Error details:', error.response?.data);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to manage discount',
        confirmButtonColor: '#89198f',
      });
    }
  };

  // Handle editing a promotion
  const handleUpdateDiscount = async (item, discountData) => {
    try {
      const existingPromo = getItemPromotion(item._id);
      if (!existingPromo) {
        throw new Error("No promotion found to update");
      }

      // Rest of the update logic is the same as handleAddDiscount
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROMOTIONS}/${existingPromo.promotionID}`;
      
      // Calculate finalPrice based on discount type and amount
      let finalPrice = item.unitPrice || 0;
      if (discountData.discountType === 'flat' && discountData.discountValue) {
        finalPrice = Math.max(0, finalPrice - parseFloat(discountData.discountValue));
      } else if (discountData.discountType === 'percentage' && discountData.discountPercentage) {
        const discountAmount = (finalPrice * parseFloat(discountData.discountPercentage)) / 100;
        finalPrice = Math.max(0, finalPrice - discountAmount);
      }

      // Ensure finalPrice is a valid number
      finalPrice = isNaN(finalPrice) ? 0 : finalPrice;
      
      console.log('Calculated finalPrice:', finalPrice);

      const promotionData = {
        promotionID: existingPromo.promotionID,
        type: discountData.type,
        discountValue: discountData.discountType === 'flat' ? parseFloat(discountData.discountValue) : undefined,
        discountPercentage: discountData.discountType === 'percentage' ? parseFloat(discountData.discountPercentage) : undefined,
        discountType: discountData.discountType,
        validUntil: discountData.validUntil,
        promoCode: discountData.promoCode || `DISC${item.inventoryID}`,
        applicableProducts: [item._id],
        minimumPurchase: parseFloat(discountData.minimumPurchase) || 0,
      };

      const response = await axios.put(url, promotionData);
      console.log('Discount Update Response:', response.data);

      // Update the finalPrice in RetrievedInventory
      try {
        const finalPriceResponse = await axios.put(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVENTORY.RETRIEVED.SINGLE(item._id)}`, 
          { finalPrice: finalPrice }
        );
        console.log('Final price update response:', finalPriceResponse.data);
      } catch (finalPriceError) {
        console.error('Error updating final price:', finalPriceError);
      }

      const updatedPromo = response.data.data || response.data;
      setPromotions(prev =>
        prev.map(p => (p.promotionID === existingPromo.promotionID ? updatedPromo : p))
      );

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Discount updated successfully!',
        confirmButtonColor: '#89198f',
      });

      await fetchData();

      setIsEditModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error updating discount:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || error.message || 'Failed to update discount',
        confirmButtonColor: '#89198f',
      });
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/default-img.jpg';
    const relativePath = imagePath.replace(/.*uploads[/\\]/, 'uploads/');
    return `${API_CONFIG.BASE_URL}/${relativePath}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-PrimaryColor p-6"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-7xl mx-auto border-2 border-SecondaryColor">
        <h2 className="text-2xl font-bold text-DarkColor mb-6 flex items-center">
          <div className="bg-PrimaryColor p-2 rounded-full mr-3">
            <MdLocalOffer className="text-DarkColor" size={24} />
          </div>
          Discount Management
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-700">
            <thead className="bg-PrimaryColor text-DarkColor">
              <tr>
                <th className="p-4 font-semibold rounded-tl-lg">Image</th>
                <th className="p-4 font-semibold">Item Name</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Quantity</th>
                <th className="p-4 font-semibold">Unit Price</th>
                <th className="p-4 font-semibold">Current Discount</th>
                <th className="p-4 font-semibold rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody>
              {retrievedItems.length > 0 ? (
                retrievedItems.map((item) => {
                  const promo = getItemPromotion(item._id);
                  const discountAmount =
                    promo?.discountType === 'flat'
                      ? promo.discountValue || 0
                      : promo?.discountType === 'percentage' && item.unitPrice
                      ? (item.unitPrice * (promo.discountPercentage || 0)) / 100
                      : 0;

                  return (
                    <tr
                      key={item._id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4">
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.ItemName}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => { e.target.src = '/default-img.jpg'; }}
                        />
                      </td>
                      <td className="p-4">{item.ItemName}</td>
                      <td className="p-4">{item.Category}</td>
                      <td className="p-4">{item.retrievedQuantity}</td>
                      <td className="p-4">{item.unitPrice ? `$${item.unitPrice.toFixed(2)}` : '-'}</td>
                      <td className="p-4">
                        {promo ? (
                          <div className="text-green-600">
                            <span>
                              {promo.discountType === 'flat'
                                ? `$${promo.discountValue || 0} off`
                                : `${promo.discountPercentage || 0}% off`}
                            </span>
                            <span className="block text-sm text-gray-600">
                              Discount Amount: ${discountAmount.toFixed(2)}
                            </span>
                            <span className="block text-sm text-purple-600 font-semibold">
                              Final Price: ${item.finalPrice ? item.finalPrice.toFixed(2) : (item.unitPrice - discountAmount).toFixed(2)}
                            </span>
                            {promo.validUntil && (
                              <span className="block text-sm text-gray-500">
                                Until: {format(new Date(promo.validUntil), 'MMM dd, yyyy')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">No discount</span>
                        )}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            if (promo) {
                              setIsEditModalOpen(true);
                            } else {
                              setIsAddModalOpen(true);
                            }
                          }}
                          className="p-2 text-DarkColor hover:text-SecondaryColor transition-colors"
                          title={promo ? 'Edit Discount' : 'Add Discount'}
                        >
                          {promo ? <FiEdit size={20} /> : <FiPlus size={20} />}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    No retrieved items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsAddModalOpen(false)}
          >
            <AddDiscount 
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              item={selectedItem}
              onAddDiscount={handleAddDiscount}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsEditModalOpen(false)}
          >
            <EditDiscount 
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              item={selectedItem}
              onUpdateDiscount={handleUpdateDiscount}
              existingPromo={getItemPromotion(selectedItem._id)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DiscountTable;