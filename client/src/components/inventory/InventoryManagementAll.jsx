// React and Router imports
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// UI Framework imports
import { motion } from "framer-motion";
import ClipLoader from "react-spinners/ClipLoader";
import Swal from "sweetalert2";

// Icons
import { FiArrowLeft, FiEdit, FiTrash2, FiPackage, FiX } from "react-icons/fi";
import { MdAdd, MdInventory, MdFileDownload } from "react-icons/md";

// PDF Generation
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Local imports
import API_CONFIG from "../../config/apiConfig.js";
import axios from 'axios';
import InventoryQuantityModal from "./InventoryQuantityModal";

function InventoryManagementAll() {
  const navigate = useNavigate();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);

  // Search and filter logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(inventoryItems);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = inventoryItems.filter(item => 
        item.ItemName?.toLowerCase().includes(query) ||
        item.Category?.toLowerCase().includes(query) ||
        item.Brand?.toLowerCase().includes(query) ||
        item.Style?.toLowerCase().includes(query)
      );
      setFilteredItems(filtered);
    }
  }, [searchQuery, inventoryItems]);

  // Size rendering logic
  const renderSizes = (sizes) => {
    if (!sizes) return "-";

    const renderSizeContent = (sizeArray) => {
      return (
        <div className="flex flex-wrap gap-1">
          {sizeArray.map((size, index) => (
            <div
              key={index}
              className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-medium"
            >
              {size}
            </div>
          ))}
        </div>
      );
    };

    try {
      const parsedSizes = JSON.parse(sizes);
      if (Array.isArray(parsedSizes)) {
        return renderSizeContent(parsedSizes);
      }
    } catch {
      // If JSON parsing fails, try to split the string
      const sizeArray = sizes
        .split(/[,\s]+/) // Split on commas and whitespace
        .map(s => s.replace(/[^a-zA-Z0-9]/g, ''))
        .filter(s => s)
        .map(s => s.toUpperCase());

      return renderSizeContent([...new Set(sizeArray)]);
    }
  };

  // Color rendering logic
  const renderColors = (colors) => {
    if (!colors) return "-";

    const isValidColor = (color) => {
      const style = new Option().style;
      style.color = color;
      return style.color !== '';
    };

    const renderColorContent = (colorArray) => {
      return (
        <div className="flex gap-1">
          {colorArray.map((color, index) => {
            const colorValue = color.toLowerCase();
            return (
              <div
                key={index}
                className="w-6 h-6 rounded-full border border-gray-300"
                style={{ 
                  backgroundColor: isValidColor(colorValue) ? colorValue : '#cccccc',
                  border: ['white', 'yellow', 'lime'].includes(colorValue) ? '1px solid #d1d5db' : 'none'
                }}
                title={color}
              />
            );
          })}
        </div>
      );
    };

    try {
      const parsedColors = JSON.parse(colors);
      if (Array.isArray(parsedColors)) {
        return renderColorContent(parsedColors);
      }
    } catch {
      // If JSON parsing fails, try to split the string
      const colorArray = colors
        .split(/[,\s]+/) // Split on commas and whitespace
        .map(c => c.replace(/[^a-zA-Z0-9]/g, ''))
        .filter(c => c)
        .map(c => c.toUpperCase());

      return renderColorContent([...new Set(colorArray)]);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    const relativePath = imagePath.replace(/.*uploads[/\\]/, 'uploads/');
    return `${API_CONFIG.BASE_URL}/${relativePath}`;
  };

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVENTORY.BASE}?page=${page}&limit=${limit}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch inventory items");
      }

      setInventoryItems(result.items);
      setTotalPages(result.pages);
    } catch (error) {
      console.error("Fetch Error:", error.message);
      setError(error.message);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.message,
        confirmButtonColor: "#89198f",
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleError = (error) => {
    console.error('Error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.response?.data?.message || 'An error occurred',
      confirmButtonColor: '#89198f',
    });
  };

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#89198f',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        await axios.delete(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVENTORY.BASE}/${id}`);
        setInventoryItems(prev => prev.filter(item => (item.inventoryID || item._id) !== id));
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Item has been deleted.',
          confirmButtonColor: '#89198f',
        });
      }
    } catch (error) {
      handleError(error);
    }
  };

  const handleEdit = (inventoryID) => {
    navigate(`/edit-inventory/${inventoryID}`);
  };

  const handleAdd = () => {
    navigate("/add-inventory");
  };

  const handleQuantityUpdate = (updatedItem) => {
    if (!updatedItem) return;

    setInventoryItems(items =>
      items.map(item =>
        item._id === updatedItem._id ? updatedItem : item
      )
    );

    const stockStatus =
      updatedItem.Quantity <= 0 ? 'out-of-stock' :
        updatedItem.Quantity <= updatedItem.reorderThreshold ? 'low-stock' :
          'in-stock';

    if (stockStatus === 'low-stock') {
      Swal.fire({
        icon: 'warning',
        title: 'Low Stock Alert',
        text: `${updatedItem.ItemName} is running low on stock!`,
        confirmButtonColor: '#89198f',
      });
    }
  };

  const handleManageQuantity = (item) => {
    if (!item) return;
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const getStockStatusClass = (status) => {
    switch (status) {
      case 'in-stock': return 'text-green-600';
      case 'low-stock': return 'text-yellow-600';
      case 'out-of-stock': return 'text-red-600';
      default: return '';
    }
  };

  const renderItemImage = (item) => {
    return (
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
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
    );
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Add title and header
    const title = "Fashion Nexus - Inventory Report";
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();
    
    // Add logo or header image (if available)
    // doc.addImage('/logo.png', 'PNG', 15, 10, 30, 30);
    
    // Title styling
    doc.setFontSize(20);
    doc.setTextColor(89, 25, 143); // Purple color (#59198F)
    doc.text(title, pageWidth / 2, 20, { align: 'center' });
    
    // Date and time
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${date} at ${time}`, pageWidth - 15, 30, { align: 'right' });
    
    // Summary section
    doc.setFontSize(12);
    doc.setTextColor(60);
    const totalItems = inventoryItems.length;
    const totalQuantity = inventoryItems.reduce((sum, item) => sum + (item.Quantity || 0), 0);
    
    doc.text('Inventory Summary:', 15, 40);
    doc.text(`Total Items: ${totalItems}`, 15, 48);
    doc.text(`Total Quantity: ${totalQuantity}`, 15, 56);
    
    // Prepare table data
    const tableData = inventoryItems.map(item => [
      item.ItemName || '-',
      item.Category || '-',
      (item.Quantity || 0).toString(),
      item.Brand || '-',
      item.Style || '-',
      Array.isArray(item.Colors) ? item.Colors.join(', ') : (item.Colors || '-'),
      Array.isArray(item.Sizes) ? item.Sizes.join(', ') : (item.Sizes || '-')
    ]);
    
    // Table styling
    doc.autoTable({
      startY: 70,
      head: [['Name', 'Category', 'Quantity', 'Brand', 'Style', 'Colors', 'Sizes']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [89, 25, 143], // Purple color
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      margin: { top: 70 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 25 }
      }
    });
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    // Save the PDF
    doc.save('FashionNexus-Inventory-Report.pdf');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-PrimaryColor p-6 flex items-center justify-center"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-6xl border-2 border-SecondaryColor min-h-[80vh]">
        <div className="flex items-center justify-between mb-8 border-b-2 border-SecondaryColor pb-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="bg-PrimaryColor hover:bg-SecondaryColor text-DarkColor p-2 rounded-full transition-all mr-4"
            >
              <FiArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-DarkColor flex items-center">
              <div className="bg-PrimaryColor p-2 rounded-full mr-3">
                <MdInventory className="text-DarkColor" size={24} />
              </div>
              Inventory Management
            </h1>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 px-4 py-2 rounded-lg border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <MdFileDownload className="w-5 h-5" />
              Generate Report
            </button>
            <button
              onClick={handleAdd}
              className="bg-DarkColor text-white p-2 rounded-full flex items-center hover:opacity-90 transition-all"
            >
              <MdAdd size={20} className="mr-1" />
              Add New
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <ClipLoader color="#89198f" size={50} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto min-h-[60vh]">
              <table className="w-full text-left text-DarkColor">
                <thead className="bg-PrimaryColor text-DarkColor">
                  <tr>
                    <th className="p-4 font-semibold">ID</th>
                    <th className="p-4 font-semibold">Image</th>
                    <th className="p-4 font-semibold">Item Name</th>
                    <th className="p-4 font-semibold">Category</th>
                    <th className="p-4 font-semibold">Quantity</th>
                    <th className="p-4 font-semibold">Colors</th>
                    <th className="p-4 font-semibold">Sizes</th>
                    <th className="p-4 font-semibold">Reorder Threshold</th>
                    <th className="p-4 font-semibold">Stock Status</th>
                    <th className="p-4 font-semibold">Location</th>
                    <th className="p-4 font-semibold">Brand</th>
                    <th className="p-4 font-semibold">Gender</th>
                    <th className="p-4 font-semibold">Style</th>
                    <th className="p-4 font-semibold">Supplier Name</th>
                    <th className="p-4 font-semibold">Supplier Contact</th>
                    <th className="p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(filteredItems) && filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <tr
                        key={item.inventoryID || item._id}
                        className="border-b border-SecondaryColor hover:bg-SecondaryColor/20"
                      >
                        <td className="p-4">{item.inventoryID || item._id}</td>
                        <td className="p-4">{renderItemImage(item)}</td>
                        <td className="p-4">{item.ItemName || '-'}</td>
                        <td className="p-4">{item.Category || '-'}</td>
                        <td className="p-4">{(item.Quantity || 0).toString()}</td>
                        <td className="p-4">
                          {renderColors(item.Colors || item.colors)}
                        </td>
                        <td className="p-4">
                          {renderSizes(item.Sizes || item.sizes)}
                        </td>
                        <td className="p-4">{item.reorderThreshold || '-'}</td>
                        <td className={`p-4 ${getStockStatusClass(item.StockStatus || '-')}`}>
                          {item.StockStatus || '-'}
                        </td>
                        <td className="p-4">{item.Location || '-'}</td>
                        <td className="p-4">{item.Brand || '-'}</td>
                        <td className="p-4">{item.Gender || '-'}</td>
                        <td className="p-4">{item.Style || '-'}</td>
                        <td className="p-4">{item.SupplierName || '-'}</td>
                        <td className="p-4">{item.SupplierContact || '-'}</td>
                        <td className="p-4 flex space-x-2">
                          <button
                            onClick={() => handleEdit(item.inventoryID || item._id)}
                            className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-all"
                            title="Edit"
                          >
                            <FiEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.inventoryID || item._id)}
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all"
                            title="Delete"
                          >
                            <FiTrash2 size={16} />
                          </button>
                          <button
                            onClick={() => handleManageQuantity(item)}
                            className="bg-purple-500 text-white p-2 rounded-full hover:bg-purple-600 transition-all"
                            title="Manage Quantity"
                          >
                            <FiPackage size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="16" className="p-4 text-center text-gray-500">
                        No inventory items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={handlePrevPage}
                  disabled={page === 1}
                  className={`px-4 py-2 rounded-lg ${page === 1
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-PrimaryColor hover:bg-SecondaryColor text-DarkColor"
                    }`}
                >
                  Previous
                </button>
                <span className="text-DarkColor">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={page === totalPages}
                  className={`px-4 py-2 rounded-lg ${page === totalPages
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-PrimaryColor hover:bg-SecondaryColor text-DarkColor"
                    }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <InventoryQuantityModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onQuantityUpdate={handleQuantityUpdate}
      />
    </motion.div>
  );
}

export default InventoryManagementAll;