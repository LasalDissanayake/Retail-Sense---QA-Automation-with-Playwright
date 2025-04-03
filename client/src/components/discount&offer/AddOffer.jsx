import React, { useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft } from "react-icons/fi";
import { MdLocalOffer } from "react-icons/md";
import { BsPercent, BsCalendarDate, BsTag } from "react-icons/bs";
import { TbDiscount } from "react-icons/tb";
import { RiCoupon3Line } from "react-icons/ri";
import ClipLoader from "react-spinners/ClipLoader";
import API_CONFIG from "../../config/apiConfig.js";

function AddOffer() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    promotionID: "",
    type: "Discount Code", // Default value matches backend enum
    discountValue: "",
    validUntil: "",
    discountPercentage: "",
    promoCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form input changes with basic validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Convert numeric fields to prevent string concatenation issues
    const numericFields = ["promotionID", "discountValue", "discountPercentage", "promoCode"];
    const newValue = numericFields.includes(name) ? value : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  // Handle form submission with improved error handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic client-side validation
    if (formData.discountPercentage < 0 || formData.discountPercentage > 100) {
      setError("Discount percentage must be between 0 and 100");
      setLoading(false);
      return;
    }

    if (formData.discountValue < 0) {
      setError("Discount value cannot be negative");
      setLoading(false);
      return;
    }

    try {
      const promotionData = {
        promotionID: Number(formData.promotionID),
        type: formData.type,
        discountValue: Number(formData.discountValue),
        validUntil: new Date(formData.validUntil).toISOString(),
        discountPercentage: Number(formData.discountPercentage),
        promoCode: Number(formData.promoCode),
      };

      // Use API_CONFIG to construct the URL
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROMOTIONS}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(promotionData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || "Failed to add promotion");
      }

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Promotion added successfully!",
        confirmButtonColor: "#89198f",
      }).then(() => {
        navigate("/offers");
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.message,
        confirmButtonColor: "#89198f",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-PrimaryColor p-6 flex items-center justify-center"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg border-2 border-SecondaryColor">
        {/* Header */}
        <div className="flex items-center mb-8 border-b-2 border-SecondaryColor pb-4">
          <button
            onClick={() => navigate(-1)}
            className="bg-PrimaryColor hover:bg-SecondaryColor text-DarkColor p-2 rounded-full transition-all mr-4"
          >
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-DarkColor flex items-center">
            <div className="bg-PrimaryColor p-2 rounded-full mr-3">
              <MdLocalOffer className="text-DarkColor" size={24} />
            </div>
            Add New Offer
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          {/* Promotion ID */}
          <div className="bg-PrimaryColor p-4 rounded-lg">
            <label className="block text-DarkColor font-medium mb-2 flex items-center">
              <BsTag className="mr-2" />
              Promotion ID
            </label>
            <input
              type="number"
              name="promotionID"
              value={formData.promotionID}
              onChange={handleChange}
              className="w-full p-3 border-2 border-SecondaryColor rounded-lg focus:outline-none focus:ring-2 focus:ring-DarkColor"
              placeholder="Enter unique promotion ID"
              required
              min="1"
            />
          </div>

          {/* Type */}
          <div className="bg-PrimaryColor p-4 rounded-lg">
            <label className="text-DarkColor font-medium mb-2 flex items-center">
              <TbDiscount className="mr-2" size={20} />
              Promotion Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full p-3 border-2 border-SecondaryColor rounded-lg focus:outline-none focus:ring-2 focus:ring-DarkColor bg-white text-DarkColor"
              required
            >
              <option value="Discount Code">Discount Code</option>
              <option value="Loyalty">Loyalty</option>
            </select>
          </div>

          {/* Two column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Discount Value */}
            <div className="bg-PrimaryColor p-4 rounded-lg">
              <label className="text-DarkColor font-medium mb-2 flex items-center">
                <RiCoupon3Line className="mr-2" size={20} />
                Discount Value
              </label>
              <input
                type="number"
                name="discountValue"
                value={formData.discountValue}
                onChange={handleChange}
                className="w-full p-3 border-2 border-SecondaryColor rounded-lg focus:outline-none focus:ring-2 focus:ring-DarkColor"
                placeholder="Enter value"
                required
                min="0"
                step="0.01"
              />
            </div>

            {/* Discount Percentage */}
            <div className="bg-PrimaryColor p-4 rounded-lg">
              <label className="block text-DarkColor font-medium mb-2 flex items-center">
                <BsPercent className="mr-2" size={20} />
                Discount Percentage
              </label>
              <input
                type="number"
                name="discountPercentage"
                value={formData.discountPercentage}
                onChange={handleChange}
                className="w-full p-3 border-2 border-SecondaryColor rounded-lg focus:outline-none focus:ring-2 focus:ring-DarkColor"
                placeholder="Enter percentage"
                required
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>

          {/* Valid Until */}
          <div className="bg-PrimaryColor p-4 rounded-lg">
            <label className="block text-DarkColor font-medium mb-2 flex items-center">
              <BsCalendarDate className="mr-2" size={20} />
              Valid Until
            </label>
            <input
              type="date"
              name="validUntil"
              value={formData.validUntil}
              onChange={handleChange}
              min={new Date().toISOString().split("T")[0]} // Prevent past dates
              className="w-full p-3 border-2 border-SecondaryColor rounded-lg focus:outline-none focus:ring-2 focus:ring-DarkColor bg-white"
              required
            />
          </div>

          {/* Promo Code */}
          <div className="bg-PrimaryColor p-4 rounded-lg">
            <label className="block text-DarkColor font-medium mb-2 flex items-center">
              <MdLocalOffer className="mr-2" size={20} />
              Promo Code
            </label>
            <input
              type="number"
              name="promoCode"
              value={formData.promoCode}
              onChange={handleChange}
              className="w-full p-3 border-2 border-SecondaryColor rounded-lg focus:outline-none focus:ring-2 focus:ring-DarkColor"
              placeholder="Enter promo code"
              required
              min="1"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-DarkColor text-white p-4 rounded-lg flex items-center justify-center hover:opacity-90 transition-all font-bold shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <ClipLoader color="#fff" size={24} className="mr-2" />
            ) : (
              <MdLocalOffer className="mr-2" size={24} />
            )}
            {loading ? "Adding Offer..." : "Add Offer"}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

export default AddOffer;