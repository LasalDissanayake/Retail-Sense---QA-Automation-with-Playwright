import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { FiEdit, FiSearch, FiDownload, FiTrash, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { MdLocalOffer } from "react-icons/md";
import Swal from 'sweetalert2';
import API_CONFIG from '../../config/apiConfig';
import EditDiscount from './EditDiscount';
import PropTypes from 'prop-types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';

const ItemsforDiscount = () => {
  const [retrievedItems, setRetrievedItems] = useState([]);
  const [discountedItems, setDiscountedItems] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);

  // Get promotion details for a specific item, regardless of active status
  const getItemPromotion = (itemId) => {
    const itemIdStr = itemId.toString();
    const promo = promotions.find(promo => {
      // Check if applicableProducts contains the itemId, handling objects or strings
      const hasProduct = promo.applicableProducts.some(product => {
        // If product is an object (e.g., RetrievedInventory), use _id; otherwise, use the value directly
        const productId = typeof product === 'object' && product._id ? product._id.toString() : product.toString();
        return productId === itemIdStr;
      });
      return hasProduct;
    });
    return promo || null;
  };

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
      
      // Store all promotions
      setPromotions(promotionData);

      // Filter items that have ANY promotions applied to them (active or inactive)
      if (parsedItems.length > 0 && promotionData.length > 0) {
        const itemsWithDiscounts = parsedItems.filter(item => {
          return promotionData.some(promo => {
            return promo.applicableProducts.some(product => {
              const productId = typeof product === 'object' && product._id 
                ? product._id.toString() 
                : product.toString();
              return productId === item._id.toString();
            });
          });
        });
        setDiscountedItems(itemsWithDiscounts);
      } else {
        setDiscountedItems([]);
      }

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

  // Filter items based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredItems(discountedItems);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = discountedItems.filter(item => 
        item.ItemName?.toLowerCase().includes(lowercasedSearch) ||
        item.Category?.toLowerCase().includes(lowercasedSearch) ||
        item.inventoryID?.toString().includes(lowercasedSearch)
      );
      setFilteredItems(filtered);
    }
  }, [searchTerm, discountedItems]);

  // Handle editing a promotion
  const handleUpdateDiscount = async (item, discountData) => {
    try {
      const existingPromo = getItemPromotion(item._id);
      if (!existingPromo) {
        throw new Error("No promotion found to update");
      }

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

  // Handle deleting a promotion
  const handleDeletePromotion = async (item) => {
    try {
      const existingPromo = getItemPromotion(item._id);
      if (!existingPromo) {
        throw new Error("No promotion found to delete");
      }

      // Show confirmation dialog
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `You are about to remove the discount from "${item.ItemName}"`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#89198f',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      });

      if (!result.isConfirmed) {
        return;
      }

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROMOTIONS}/${existingPromo.promotionID}`;
      const response = await axios.delete(url);
      console.log('Discount Delete Response:', response.data);

      // Reset the finalPrice in RetrievedInventory to the original unitPrice
      try {
        const finalPriceResponse = await axios.put(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVENTORY.RETRIEVED.SINGLE(item._id)}`, 
          { finalPrice: item.unitPrice }
        );
        console.log('Final price reset response:', finalPriceResponse.data);
      } catch (finalPriceError) {
        console.error('Error resetting final price:', finalPriceError);
      }

      setPromotions(prev => prev.filter(p => p.promotionID !== existingPromo.promotionID));

      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Discount has been removed successfully.',
        confirmButtonColor: '#89198f',
      });

      await fetchData();
    } catch (error) {
      console.error('Error deleting discount:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || error.message || 'Failed to delete discount',
        confirmButtonColor: '#89198f',
      });
    }
  };

  // Handle toggling promotion active status
  const handleToggleStatus = async (item) => {
    try {
      // Find promotion for this item (including inactive ones)
      const promo = getItemPromotion(item._id);
      
      if (!promo) {
        throw new Error("No promotion found to update status");
      }

      const newStatus = !promo.isActive;
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROMOTIONS}/${promo.promotionID}`;
      
      // If activating the promotion, we need to update the finalPrice
      if (newStatus) {
        // Calculate finalPrice based on discount type and amount
        let finalPrice = item.unitPrice || 0;
        if (promo.discountType === 'flat' && promo.discountValue) {
          finalPrice = Math.max(0, finalPrice - promo.discountValue);
        } else if (promo.discountType === 'percentage' && promo.discountPercentage) {
          const discountAmount = (finalPrice * promo.discountPercentage) / 100;
          finalPrice = Math.max(0, finalPrice - discountAmount);
        }
        
        // Update the item's finalPrice only if activating the promotion
        try {
          await axios.put(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVENTORY.RETRIEVED.SINGLE(item._id)}`, 
            { finalPrice: finalPrice }
          );
        } catch (finalPriceError) {
          console.error('Error updating final price:', finalPriceError);
        }
      } else {
        // If deactivating, reset finalPrice to unit price
        try {
          await axios.put(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVENTORY.RETRIEVED.SINGLE(item._id)}`, 
            { finalPrice: item.unitPrice }
          );
        } catch (finalPriceError) {
          console.error('Error resetting final price:', finalPriceError);
        }
      }
      
      // Update the promotion's isActive status
      const response = await axios.put(url, { 
        ...promo,
        isActive: newStatus 
      });
      
      console.log('Status Toggle Response:', response.data);
      
      // Update local state
      setPromotions(prev => 
        prev.map(p => (p.promotionID === promo.promotionID ? {...p, isActive: newStatus} : p))
      );
      
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: `Discount ${newStatus ? 'activated' : 'deactivated'} successfully!`,
        confirmButtonColor: '#89198f',
      });
      
      // Refresh data to get up-to-date information
      await fetchData();
      
    } catch (error) {
      console.error('Error toggling promotion status:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || error.message || 'Failed to toggle discount status',
        confirmButtonColor: '#89198f',
      });
    }
  };
  
  // Get ALL promotions for an item (active and inactive)
  const getAllItemPromotions = (itemId) => {
    const itemIdStr = itemId.toString();
    return promotions.filter(promo => {
      return promo.applicableProducts.some(product => {
        const productId = typeof product === 'object' && product._id ? product._id.toString() : product.toString();
        return productId === itemIdStr;
      });
    });
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/default-img.jpg';
    const relativePath = imagePath.replace(/.*uploads[/\\]/, 'uploads/');
    return `${API_CONFIG.BASE_URL}/${relativePath}`;
  };

  // Generate PDF report
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.setTextColor(89, 25, 143); // Purple color
    doc.text('Discounted Items Report', 14, 22);
    
    // Add date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy')}`, 14, 30);
    
    const tableColumn = ["Item Name", "Category", "Original Price", "Discount", "Final Price"];
    
    const tableRows = filteredItems.map(item => {
      const promo = getItemPromotion(item._id);
      const discountInfo = promo ? 
        (promo.discountType === 'flat' ? `$${promo.discountValue}` : `${promo.discountPercentage}%`) : 
        'None';
      
      const discountAmount = promo?.discountType === 'flat'
        ? promo.discountValue || 0
        : promo?.discountType === 'percentage' && item.unitPrice
        ? (item.unitPrice * (promo.discountPercentage || 0)) / 100
        : 0;
      
      const finalPrice = item.finalPrice || (item.unitPrice - discountAmount);
      
      return [
        item.ItemName,
        item.Category,
        item.unitPrice ? `$${item.unitPrice.toFixed(2)}` : '-',
        discountInfo,
        `$${finalPrice.toFixed(2)}`
      ];
    });
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
        lineColor: [89, 25, 143],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [89, 25, 143],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 250]
      }
    });
    
    doc.save(`Discounted-Items-Report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'PDF report has been downloaded',
      confirmButtonColor: '#89198f',
    });
  };
  
  // Generate CSV report
  const generateCSV = () => {
    // Create CSV headers
    const headers = ['Item Name', 'Category', 'Original Price', 'Discount', 'Final Price', 'Valid Until'];
    
    // Create CSV rows
    const csvData = filteredItems.map(item => {
      const promo = getItemPromotion(item._id);
      const discountInfo = promo ? 
        (promo.discountType === 'flat' ? `$${promo.discountValue}` : `${promo.discountPercentage}%`) : 
        'None';
      
      const discountAmount = promo?.discountType === 'flat'
        ? promo.discountValue || 0
        : promo?.discountType === 'percentage' && item.unitPrice
        ? (item.unitPrice * (promo.discountPercentage || 0)) / 100
        : 0;
      
      const finalPrice = item.finalPrice || (item.unitPrice - discountAmount);
      const validUntil = promo?.validUntil ? format(new Date(promo.validUntil), 'yyyy-MM-dd') : 'N/A';
      
      return [
        item.ItemName,
        item.Category,
        item.unitPrice ? item.unitPrice.toFixed(2) : '-',
        discountInfo,
        finalPrice.toFixed(2),
        validUntil
      ].join(',');
    });
    
    // Combine headers and rows
    const csvContent = [headers.join(','), ...csvData].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `Discounted-Items-Report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'CSV report has been downloaded',
      confirmButtonColor: '#89198f',
    });
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
          Items with Discounts
        </h2>
        
        {/* Search and Export Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="relative w-full md:w-1/3 flex items-center">
            <FiSearch className="absolute left-3 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search by name, category, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:border-SecondaryColor focus:outline-none"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 bg-SecondaryColor text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
            >
              <FiDownload size={18} />
              Download PDF
            </button>
            <button
              onClick={generateCSV}
              className="flex items-center gap-2 bg-PrimaryColor text-DarkColor border-2 border-SecondaryColor px-4 py-2 rounded-lg hover:bg-SecondaryColor hover:text-white transition-colors"
            >
              <FiDownload size={18} />
              Download CSV
            </button>
          </div>
        </div>
        
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
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const promo = getItemPromotion(item._id);
                  const isActive = promo?.isActive || false;
                  const discountAmount =
                    promo?.discountType === 'flat'
                      ? promo?.discountValue || 0
                      : promo?.discountType === 'percentage' && item.unitPrice
                      ? (item.unitPrice * (promo?.discountPercentage || 0)) / 100
                      : 0;

                  return (
                    <tr
                      key={item._id}
                      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${!isActive ? 'bg-gray-50' : ''}`}
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
                          <div className={`${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                            <span>
                              {promo.discountType === 'flat'
                                ? `$${promo.discountValue || 0} off`
                                : `${promo.discountPercentage || 0}% off`}
                            </span>
                            <span className="block text-sm text-gray-600">
                              Discount Amount: ${discountAmount.toFixed(2)}
                            </span>
                            <span className={`block text-sm font-semibold ${isActive ? 'text-purple-600' : 'text-gray-500'}`}>
                              Final Price: ${isActive && item.finalPrice ? item.finalPrice.toFixed(2) : (item.unitPrice - (isActive ? discountAmount : 0)).toFixed(2)}
                            </span>
                            {promo.validUntil && (
                              <span className="block text-sm text-gray-500">
                                Until: {format(new Date(promo.validUntil), 'MMM dd, yyyy')}
                              </span>
                            )}
                            <span className={`block text-xs mt-1 font-medium ${isActive ? 'text-green-500' : 'text-red-500'}`}>
                              Status: {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500">No discount</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setIsEditModalOpen(true);
                            }}
                            className="p-2 text-DarkColor hover:text-SecondaryColor transition-colors"
                            title="Edit Discount"
                          >
                            <FiEdit size={20} />
                          </button>
                          <button
                            onClick={() => handleDeletePromotion(item)}
                            className="p-2 text-DarkColor hover:text-red-500 transition-colors"
                            title="Delete Discount"
                          >
                            <FiTrash size={20} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(item)}
                            className={`p-2 ${isActive ? 'text-green-500 hover:text-gray-500' : 'text-gray-400 hover:text-green-500'} transition-colors`}
                            title={isActive ? "Deactivate Discount" : "Activate Discount"}
                          >
                            {isActive ? <FiToggleRight size={20} /> : <FiToggleLeft size={20} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    {searchTerm ? "No matching items found" : "No items with discounts found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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

export default ItemsforDiscount;