import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft, FiEdit, FiTrash2 } from "react-icons/fi";
import { MdLocalOffer, MdAdd } from "react-icons/md";
import ClipLoader from "react-spinners/ClipLoader";
import API_CONFIG from "../../config/apiConfig.js"; // Adjust path as needed
import Swal from "sweetalert2";

function PromotionReport() {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch promotions on component mount
  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROMOTIONS}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || "Failed to fetch promotions");
      }

      setPromotions(result.data); // Assuming backend returns data in a 'data' field
    } catch (err) {
      setError(err.message);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: err.message,
        confirmButtonColor: "#89198f",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (promotionID) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#89198f",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROMOTIONS}/${promotionID}`;
          const response = await fetch(url, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || result.message || "Failed to delete promotion");
          }

          setPromotions(promotions.filter((promo) => promo.promotionID !== promotionID));
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Promotion has been deleted.",
            confirmButtonColor: "#89198f",
          });
        } catch (err) {
          Swal.fire({
            icon: "error",
            title: "Error!",
            text: err.message,
            confirmButtonColor: "#89198f",
          });
        }
      }
    });
  };

  // Handle Edit Navigation
  const handleEdit = (promotionID) => {
    navigate(`/edit-promotion/${promotionID}`); // Adjust route as needed
  };

  // Handle Add Navigation
  const handleAdd = () => {
    navigate("/add-offer"); // Assuming this is your AddOffer route
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-PrimaryColor p-6 flex items-center justify-center"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl border-2 border-SecondaryColor">
        {/* Header */}
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
                <MdLocalOffer className="text-DarkColor" size={24} />
              </div>
              Promotion Report
            </h1>
          </div>
          <button
            onClick={handleAdd}
            className="bg-DarkColor text-white p-2 rounded-full flex items-center hover:opacity-90 transition-all"
          >
            <MdAdd size={20} className="mr-1" />
            Add New
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <ClipLoader color="#89198f" size={50} />
          </div>
        ) : (
          /* Promotions Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-DarkColor">
              <thead className="bg-PrimaryColor text-DarkColor">
                <tr>
                  <th className="p-4 font-semibold">Promotion ID</th>
                  <th className="p-4 font-semibold">Type</th>
                  <th className="p-4 font-semibold">Discount Value</th>
                  <th className="p-4 font-semibold">Discount %</th>
                  <th className="p-4 font-semibold">Promo Code</th>
                  <th className="p-4 font-semibold">Valid Until</th>
                  <th className="p-4 font-semibold">Created Date</th>
                  <th className="p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promotions.length > 0 ? (
                  promotions.map((promo) => (
                    <tr
                      key={promo.promotionID}
                      className="border-b border-SecondaryColor hover:bg-SecondaryColor/20"
                    >
                      <td className="p-4">{promo.promotionID}</td>
                      <td className="p-4">{promo.type}</td>
                      <td className="p-4">{promo.discountValue}</td>
                      <td className="p-4">{promo.discountPercentage}%</td>
                      <td className="p-4">{promo.promoCode}</td>
                      <td className="p-4">
                        {new Date(promo.validUntil).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        {new Date(promo.promoCreatedDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 flex space-x-2">
                        <button
                          onClick={() => handleEdit(promo.promotionID)}
                          className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-all"
                          title="Edit"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(promo.promotionID)}
                          className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all"
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="p-4 text-center text-gray-500">
                      No promotions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default PromotionReport;