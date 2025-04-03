import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiPlus, FiX } from "react-icons/fi";
import { HexColorPicker } from "react-colorful";
import Swal from "sweetalert2";
import API_CONFIG from "../../config/apiConfig.js";

const CATEGORIES = ['Clothing', 'Accessories', 'Footwear', 'Bags', 'Sportswear', 'Seasonal', 'Kids', 'Formal Wear', 'Casual Wear', 'Lingerie'];
const LOCATIONS = ['Warehouse', 'Stockroom', 'Backroom Storage', 'Retail Floor'];
const STYLES = ['Casual', 'Formal', 'Athletic'];

function UpdateInventory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ItemName: '',
    Category: '',
    Location: '',
    Quantity: '',
    Brand: '',
    Sizes: [],
    Colors: [],
    Gender: '',
    Style: '',
    reorderThreshold: '',
    StockStatus: 'in-stock',
    SupplierName: '',
    SupplierContact: '',
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [colorInput, setColorInput] = useState('#000000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Parsing functions for sizes and colors
  const parseSizes = (sizes) => {
    if (!sizes) return [];
    try {
      const parsed = JSON.parse(sizes);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return sizes.split(/[,/[\]'"\\]/)
        .map(s => s.trim().toUpperCase())
        .filter(Boolean);
    }
    return [];
  };

  const parseColors = (colors) => {
    if (!colors) return [];
    try {
      const parsed = JSON.parse(colors);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return colors.split(/[,/[\]'"\\]/)
        .map(c => c.trim().toUpperCase())
        .filter(c => /^#[0-9A-F]{6}$/i.test(c));
    }
    return [];
  };

  // Fetch inventory item on mount
  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      try {
        const url = `${API_CONFIG.BASE_URL}/api/inventory/${id}`;
        console.log('Fetching inventory from:', url); // Debug log
        
        const response = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const result = await response.json();
        console.log('Server response:', result); // Debug log

        if (!response.ok) {
          throw new Error(result.details || result.message || 'Failed to fetch inventory item');
        }

        if (!result) {
          throw new Error('No data received from server');
        }

        // Convert numeric strings to numbers
        const numericFields = ['Quantity', 'reorderThreshold'];
        numericFields.forEach(field => {
          if (result[field]) {
            result[field] = Number(result[field]);
          }
        });

        setFormData({
          ItemName: result.ItemName || '',
          Category: result.Category || '',
          Location: result.Location || '',
          Quantity: result.Quantity || 0,
          Brand: result.Brand || '',
          Sizes: parseSizes(result.Sizes),
          Colors: parseColors(result.Colors),
          Gender: result.Gender || '',
          Style: result.Style || '',
          reorderThreshold: result.reorderThreshold || 0,
          StockStatus: result.StockStatus || 'in-stock',
          SupplierName: result.SupplierName || '',
          SupplierContact: result.SupplierContact || '',
          image: null,
        });

        setImagePreview(result.image ? `${API_CONFIG.BASE_URL}/${result.image}` : null);
      } catch {
        console.error('Error fetching inventory'); // Debug log
        Swal.fire({
          icon: "error",
          title: "Error Loading Item",
          text: 'Failed to fetch inventory item',
          showConfirmButton: true,
          confirmButtonText: 'Try Again',
          showCancelButton: true,
          cancelButtonText: 'Go Back'
        }).then((result) => {
          if (result.isConfirmed) {
            fetchInventory(); // Retry
          } else {
            navigate('/manager/inventory-management'); // Go back
          }
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInventory();
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No item ID provided",
        confirmButtonText: 'Go Back'
      }).then(() => {
        navigate('/manager/inventory-management');
      });
      setLoading(false);
    }
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Only restrict non-numeric input for these fields
    if ((name === 'reorderThreshold' || name === 'Quantity') && !/^\d*$/.test(value)) {
      return; // Only block non-numeric input
    }

    // Convert ItemName to uppercase
    if (name === 'ItemName') {
      setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleInputBlur = (e) => {
    const { name, value } = e.target;
    if (!value) return; // Don't validate empty fields on blur
    
    // Validation for reorderThreshold
    if (name === 'reorderThreshold') {
      if (parseInt(value) < 100) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Input',
          text: 'Re-order threshold must be at least 100',
          confirmButtonColor: '#89198f',
        });
      }
    }

    // Validation for Quantity
    if (name === 'Quantity') {
      if (parseInt(value) < 110) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Input',
          text: 'Quantity must be greater than 110',
          confirmButtonColor: '#89198f',
        });
      }
    }

    // Validation for SupplierContact (email)
    if (name === 'SupplierContact') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Email',
          text: 'Please enter a valid email address',
          confirmButtonColor: '#89198f',
        });
      }
    }

    // Validation for SupplierName
    if (name === 'SupplierName') {
      if (/^\d+$/.test(value) || /^[^a-zA-Z0-9]+$/.test(value)) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Supplier Name',
          text: 'Supplier name cannot contain only numbers or special characters',
          confirmButtonColor: '#89198f',
        });
      }
    }
  };

  const handleSizeToggle = (size) => {
    setFormData((prev) => ({
      ...prev,
      Sizes: prev.Sizes.includes(size) 
        ? prev.Sizes.filter((s) => s !== size) 
        : [...prev.Sizes, size.toUpperCase()],
    }));
  };

  const handleAddSize = (e) => {
    if (e.key === 'Enter') {
      const newSize = e.target.value.trim().toUpperCase();
      if (newSize) {
        setFormData(prev => ({ ...prev, Sizes: [...prev.Sizes, newSize] }));
      }
      e.target.value = '';
    }
  };

  const handleAddColor = () => {
    const colorToAdd = colorInput.toUpperCase();
    if (/^#[0-9A-F]{6}$/i.test(colorToAdd) && !formData.Colors.includes(colorToAdd)) {
      setFormData((prev) => ({ ...prev, Colors: [...prev.Colors, colorToAdd] }));
      setCurrentColor('#000000');
      setColorInput('#000000');
      setShowColorPicker(false);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Color',
        text: 'Please enter a valid hex color code (e.g., #FF0000)',
        confirmButtonColor: '#89198f',
      });
    }
  };

  const handleRemoveColor = (colorToRemove) => {
    setFormData((prev) => ({
      ...prev,
      Colors: prev.Colors.filter((color) => color !== colorToRemove),
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleColorChange = (newColor) => {
    setCurrentColor(newColor);
    setColorInput(newColor);
  };

  const handleColorInputChange = (e) => {
    const value = e.target.value;
    setColorInput(value);
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      setCurrentColor(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Check all required fields
    const requiredFields = [
      { field: 'ItemName', label: 'Item Name' },
      { field: 'Category', label: 'Category' },
      { field: 'Location', label: 'Location' },
      { field: 'Quantity', label: 'Quantity' },
      { field: 'Brand', label: 'Brand' },
      { field: 'Gender', label: 'Gender' },
      { field: 'Style', label: 'Style' },
      { field: 'reorderThreshold', label: 'Re-order Threshold' },
      { field: 'SupplierName', label: 'Supplier Name' },
      { field: 'SupplierContact', label: 'Supplier Contact' },
      { field: 'Colors', label: 'Colors' },
      { field: 'Sizes', label: 'Sizes' }
    ];

    const missingFields = requiredFields.filter((field) => {
      if (Array.isArray(formData[field.field])) {
        return formData[field.field].length === 0;
      }
      return !formData[field.field];
    });

    if (missingFields.length > 0) {
      Swal.fire({
        icon: 'error',
        title: 'Required Fields Missing',
        text: `Please fill in: ${missingFields.map(f => f.label).join(', ')}`,
        confirmButtonColor: '#89198f',
      });
      return;
    }

    // Additional validations
    const validations = [
      {
        condition: parseInt(formData.reorderThreshold) < 100,
        message: 'Re-order threshold must be at least 100'
      },
      {
        condition: parseInt(formData.Quantity) < 110,
        message: 'Quantity must be greater than 110'
      },
      {
        condition: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.SupplierContact),
        message: 'Please enter a valid email address for Supplier Contact'
      },
      {
        condition: /^\d+$/.test(formData.SupplierName) || /^[^a-zA-Z0-9]+$/.test(formData.SupplierName),
        message: 'Supplier name cannot contain only numbers or special characters'
      }
    ];

    const failedValidation = validations.find(v => v.condition);
    if (failedValidation) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: failedValidation.message,
        confirmButtonColor: '#89198f',
      });
      return;
    }

    if (!formData.image && !imagePreview) {
      Swal.fire({
        icon: 'error',
        title: 'Image Required',
        text: 'Please upload an image for the inventory item',
        confirmButtonColor: '#89198f',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Check for duplicate item name (only if name was changed)
      const checkResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVENTORY.BASE}/check-duplicate?itemName=${encodeURIComponent(formData.ItemName)}&excludeId=${id}`, {
        method: 'GET'
      });

      const checkResult = await checkResponse.json();
      if (checkResult.isDuplicate) {
        Swal.fire({
          icon: 'error',
          title: 'Duplicate Item',
          text: 'An item with this name already exists. Please use a different name.',
          confirmButtonColor: '#89198f',
        });
        setIsSubmitting(false);
        return;
      }

      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'Sizes' || key === 'Colors') {
          formDataToSend.append(key, JSON.stringify(value));
        } else if (key === 'image' && value) {
          formDataToSend.append(key, value);
        } else if (key !== 'image') {
          formDataToSend.append(key, value);
        }
      });

      const url = `${API_CONFIG.BASE_URL}/api/inventory/${id}`;
      const response = await fetch(url, {
        method: "PUT",
        body: formDataToSend,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.details || result.message || 'Failed to update inventory item');

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Inventory item updated successfully!',
        confirmButtonColor: '#89198f',
      }).then(() => {
        navigate('/manager/inventory-management');
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#89198f',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8"
    >
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-all"
          >
            <FiArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-extrabold text-purple-800 flex items-center">
            <span className="mr-3 bg-purple-600 text-white p-2 rounded-full">
              <FiPlus size={24} />
            </span>
            Update Inventory Item
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <svg className="animate-spin h-10 w-10 text-purple-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h-8z" />
              </svg>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Inventory ID</label>
                <input
                  type="text"
                  value={id}
                  className="mt-1 w-full p-3 rounded-lg border-2 border-gray-200 bg-gray-100 text-gray-700"
                  readOnly
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="relative group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Item Image</label>
                    <div className="flex items-center justify-center w-full h-64 bg-gray-100 rounded-xl border-2 border-dashed border-purple-300 hover:border-purple-500 transition-all">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="h-60 w-full object-cover rounded-xl"
                            onError={(e) => {
                              e.target.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%23cccccc"/><text x="50%" y="50%" font-size="12" text-anchor="middle" dy=".3em" fill="%23666666">No Image</text></svg>`;
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setFormData((prev) => ({ ...prev, image: null }));
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FiX size={16} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center cursor-pointer">
                          <FiPlus className="text-purple-500 h-12 w-12" />
                          <span className="mt-2 text-sm font-medium text-purple-600">Upload Image</span>
                          <input
                            type="file"
                            name="image"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Item Name</label>
                    <input
                      type="text"
                      name="ItemName"
                      value={formData.ItemName}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      className="mt-1 w-full p-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      placeholder="e.g., Classic T-Shirt"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Category</label>
                    <select
                      name="Category"
                      value={formData.Category}
                      onChange={handleInputChange}
                      className="mt-1 w-full p-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white"
                      required
                    >
                      <option value="">Select Category</option>
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Location</label>
                    <select
                      name="Location"
                      value={formData.Location}
                      onChange={handleInputChange}
                      className="mt-1 w-full p-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white"
                      required
                    >
                      <option value="">Select Location</option>
                      {LOCATIONS.map((location) => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Sizes</label>
                  <div className="flex flex-wrap gap-3 mb-2">
                    {[...new Set(formData.Sizes)].map((size) => (
                      <motion.button
                        key={size}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSizeToggle(size)}
                        className={`px-3 py-1 rounded-full flex items-center justify-center text-sm font-medium transition-all shadow-sm
                          ${formData.Sizes.includes(size)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {size}
                        <FiX className="ml-1 text-xs" />
                      </motion.button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add custom size (press Enter)"
                    onKeyDown={handleAddSize}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Colors</label>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {formData.Colors.map((color) => (
                      <div key={color} className="relative group">
                        <div
                          className="w-10 h-10 rounded-full border-2 border-gray-200 shadow-sm"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(color)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiX size={12} />
                        </button>
                      </div>
                    ))}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowColorPicker(true)}
                      className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-purple-600 hover:bg-gray-200 shadow-sm"
                    >
                      <FiPlus size={16} />
                    </motion.button>
                  </div>

                  <AnimatePresence>
                    {showColorPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute z-20 p-4 bg-white rounded-xl shadow-xl border border-gray-200"
                      >
                        <HexColorPicker color={currentColor} onChange={handleColorChange} />
                        <input
                          type="text"
                          value={colorInput}
                          onChange={handleColorInputChange}
                          className="mt-3 w-full p-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                          placeholder="#HEXCODE"
                          maxLength={7}
                        />
                        <div className="mt-3 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowColorPicker(false)}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleAddColor}
                            className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                          >
                            Add Color
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Brand</label>
                  <input
                    type="text"
                    name="Brand"
                    value={formData.Brand}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    placeholder="e.g., Nike"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700">Gender</label>
                  <select
                    name="Gender"
                    value={formData.Gender}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700">Style</label>
                  <select
                    name="Style"
                    value={formData.Style}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white"
                    required
                  >
                    <option value="">Select Style</option>
                    {STYLES.map((style) => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700">Quantity</label>
                  <input
                    type="number"
                    name="Quantity"
                    value={formData.Quantity}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    min="0"
                    className="mt-1 w-full p-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    placeholder="e.g., 50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700">Reorder Threshold</label>
                  <input
                    type="number"
                    name="reorderThreshold"
                    value={formData.reorderThreshold}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    min="0"
                    className="mt-1 w-full p-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    placeholder="e.g., 10"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700">Stock Status</label>
                  <select
                    name="StockStatus"
                    value={formData.StockStatus}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white"
                    required
                  >
                    <option value="in-stock">In Stock</option>
                    <option value="low-stock">Low Stock</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700">Supplier Name</label>
                  <input
                    type="text"
                    name="SupplierName"
                    value={formData.SupplierName}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    className="mt-1 w-full p-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    placeholder="e.g., Fashion Co."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700">Supplier Contact</label>
                  <input
                    type="text"
                    name="SupplierContact"
                    value={formData.SupplierContact}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    className="mt-1 w-full p-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    placeholder="e.g., +1 123-456-7890"
                    required
                  />
                </div>
              </div>

              <div className="pt-6">
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h-8z" />
                      </svg>
                      Updating...
                    </span>
                  ) : (
                    'Update Inventory Item'
                  )}
                </motion.button>
              </div>
            </>
          )}
        </form>
      </div>
    </motion.div>
  );
}

export default UpdateInventory;