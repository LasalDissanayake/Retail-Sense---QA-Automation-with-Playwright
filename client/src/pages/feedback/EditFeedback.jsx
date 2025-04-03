import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft, FiStar } from "react-icons/fi";
import { MdFeedback } from "react-icons/md";
import { BsBox, BsChatDots, BsHash } from "react-icons/bs";
import ClipLoader from "react-spinners/ClipLoader";
import Swal from "sweetalert2";
import API_CONFIG from "../../config/apiConfig.js"; // Adjust path as needed

function EditFeedback() {
  const { id } = useParams(); // Get feedback _id from URL
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userID: "",
    productID: "",
    rating: 0,
    comment: "",
    orderID: "",
  });
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch feedback and dropdown data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch feedback by ID
        const feedbackUrl = `${API_CONFIG.BASE_URL}/api/feedbacks/${id}`; // Corrected endpoint
        const feedbackResponse = await fetch(feedbackUrl);
        if (!feedbackResponse.ok) {
          const text = await feedbackResponse.text();
          throw new Error(`Failed to fetch feedback: ${text}`);
        }
        const feedbackResult = await feedbackResponse.json();
        const feedback = feedbackResult.data;

        if (!feedback) {
          throw new Error("Feedback data not found in response");
        }

        setFormData({
          userID: feedback.userID ? feedback.userID.toString() : "",
          productID: feedback.productID || "",
          rating: feedback.rating ? parseInt(feedback.rating, 10) : 0,
          comment: feedback.comment || "",
          orderID: feedback.orderID || "",
        });

        // Fetch users
        const usersResponse = await fetch(`${API_CONFIG.BASE_URL}/api/users`);
        if (!usersResponse.ok) throw new Error("Failed to fetch users");
        const usersResult = await usersResponse.json();
        setUsers(usersResult.data || []);

        // Fetch orders
        const ordersResponse = await fetch(`${API_CONFIG.BASE_URL}/api/orders`);
        if (!ordersResponse.ok) throw new Error("Failed to fetch orders");
        const ordersResult = await ordersResponse.json();
        setOrders(ordersResult.data || []);

        // Fetch products
        const productsResponse = await fetch(`${API_CONFIG.BASE_URL}/api/products`);
        if (!productsResponse.ok) throw new Error("Failed to fetch products");
        const productsResult = await productsResponse.json();
        setProducts(productsResult.data || []);
      } catch (err) {
        console.error("Fetch error:", err.message); // Log for debugging
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

    fetchData();
  }, [id]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle star rating click
  const handleRating = (rating) => {
    setFormData((prev) => ({
      ...prev,
      rating,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (!formData.userID) {
      setError("Please select a User ID");
      setLoading(false);
      return;
    }
    if (!formData.productID) {
      setError("Please select a Product ID");
      setLoading(false);
      return;
    }
    if (formData.rating < 1 || formData.rating > 5) {
      setError("Please select a rating between 1 and 5 stars");
      setLoading(false);
      return;
    }
    if (!formData.orderID) {
      setError("Please select an Order ID");
      setLoading(false);
      return;
    }

    try {
      const feedbackData = {
        userID: Number(formData.userID),
        productID: formData.productID,
        rating: String(formData.rating),
        comment: formData.comment || undefined,
        orderID: formData.orderID,
      };

      const url = `${API_CONFIG.BASE_URL}/api/feedback/${id}`; // Corrected endpoint
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to update feedback: ${text}`);
      }

      const result = await response.json();

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Feedback updated successfully!",
        confirmButtonColor: "#89198f",
      }).then(() => {
        navigate("/feedback");
      });
    } catch (err) {
      console.error("Submit error:", err.message); // Log for debugging
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
              <MdFeedback className="text-DarkColor" size={24} />
            </div>
            Edit Feedback
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <ClipLoader color="#89198f" size={50} />
            </div>
          ) : (
            <>
              {/* User ID Dropdown */}
              <div className="bg-PrimaryColor p-4 rounded-lg">
                <label className="block text-DarkColor font-medium mb-2 flex items-center">
                  <BsHash className="mr-2" size={20} />
                  User ID
                </label>
                <select
                  name="userID"
                  value={formData.userID}
                  onChange={handleChange}
                  className="w-full p-3 border-2 border-SecondaryColor rounded-lg focus:outline-none focus:ring-2 focus:ring-DarkColor bg-white text-DarkColor"
                  required
                >
                  <option value="">Select User ID</option>
                  {users.map((user) => (
                    <option key={user.userID} value={user.userID}>
                      {user.userID} - {user.UserName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product ID Dropdown */}
              <div className="bg-PrimaryColor p-4 rounded-lg">
                <label className="block text-DarkColor font-medium mb-2 flex items-center">
                  <BsBox className="mr-2" size={20} />
                  Product ID
                </label>
                <select
                  name="productID"
                  value={formData.productID}
                  onChange={handleChange}
                  className="w-full p-3 border-2 border-SecondaryColor rounded-lg focus:outline-none focus:ring-2 focus:ring-DarkColor bg-white text-DarkColor"
                  required
                >
                  <option value="">Select Product ID</option>
                  {products.map((product) => (
                    <option key={product.productID} value={product.productID}>
                      {product.productID} - {product.name || "Unnamed Product"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating (Stars) */}
              <div className="bg-PrimaryColor p-4 rounded-lg">
                <label className="block text-DarkColor font-medium mb-2 flex items-center">
                  <FiStar className="mr-2" size={20} />
                  Rating
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                      key={star}
                      size={24}
                      className={`cursor-pointer ${
                        star <= formData.rating ? "text-yellow-400 fill-current" : "text-gray-400"
                      }`}
                      onClick={() => handleRating(star)}
                    />
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="bg-PrimaryColor p-4 rounded-lg">
                <label className="block text-DarkColor font-medium mb-2 flex items-center">
                  <BsChatDots className="mr-2" size={20} />
                  Comment (Optional)
                </label>
                <textarea
                  name="comment"
                  value={formData.comment}
                  onChange={handleChange}
                  className="w-full p-3 border-2 border-SecondaryColor rounded-lg focus:outline-none focus:ring-2 focus:ring-DarkColor"
                  placeholder="Enter your feedback"
                  rows="4"
                />
              </div>

              {/* Order ID Dropdown */}
              <div className="bg-PrimaryColor p-4 rounded-lg">
                <label className="block text-DarkColor font-medium mb-2 flex items-center">
                  <BsHash className="mr-2" size={20} />
                  Order ID
                </label>
                <select
                  name="orderID"
                  value={formData.orderID}
                  onChange={handleChange}
                  className="w-full p-3 border-2 border-SecondaryColor rounded-lg focus:outline-none focus:ring-2 focus:ring-DarkColor bg-white text-DarkColor"
                  required
                >
                  <option value="">Select Order ID</option>
                  {orders.map((order) => (
                    <option key={order.orderID} value={order.orderID}>
                      {order.orderID}
                    </option>
                  ))}
                </select>
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
                  <MdFeedback className="mr-2" size={24} />
                )}
                {loading ? "Updating..." : "Update Feedback"}
              </button>
            </>
          )}
        </form>
      </div>
    </motion.div>
  );
}

export default EditFeedback;