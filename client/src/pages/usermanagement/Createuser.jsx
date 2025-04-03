import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import navigate
import { motion } from "framer-motion";
import { FiArrowLeft } from "react-icons/fi";
import { MdPersonAdd } from "react-icons/md"; // Icon for user creation
import { BsPerson, BsEnvelope, BsLock, BsHouse, BsPhone } from "react-icons/bs";
import ClipLoader from "react-spinners/ClipLoader";
import Swal from "sweetalert2";
import API_CONFIG from "../../config/apiConfig.js"; // Adjust path as needed

function CreateUser() {
  const navigate = useNavigate(); // Initialize navigate
  const [formData, setFormData] = useState({
    UserName: "",
    email: "",
    password: "",
    address: "",
    mobile: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic client-side validation
    if (!/^\d{10}$/.test(formData.mobile)) {
      setError("Mobile number must be 10 digits");
      setLoading(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const userData = {
        UserName: formData.UserName,
        email: formData.email,
        password: formData.password,
        address: formData.address || undefined, // Optional field
        mobile: Number(formData.mobile),
      };

      const url = `${API_CONFIG.BASE_URL}/api/users`; // Adjust endpoint as needed
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || "Failed to create user");
      }

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "User created successfully!",
        confirmButtonColor: "#89198f",
      }).then(() => {
        navigate("/"); // Navigate to home page after successful creation
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: err.message,
        confirmButtonColor: "#89198f",
      });
      setError(err.message);
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
              <MdPersonAdd className="text-DarkColor" size={24} />
            </div>
            Create New User
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          {/* UserName */}
          <div className="bg-PrimaryColor p-4 rounded-lg">
            <label className="block text-DarkColor font-medium mb-2 flex items-center">
              <BsPerson className="mr-2" size={20} />
              Username
            </label>
            <input
              type="text"
              name="UserName"
              value={formData.UserName}
              onChange={handleChange}
              className="w-full p-3 border-2 border-SecondaryColor rounded-lg focus:outline-none focus:ring-2 focus:ring-DarkColor"
              placeholder="Enter username"
              required
            />
          </div>

          {/* Email */}
          <div className="bg-PrimaryColor p-4 rounded-lg">
            <label className="block text-DarkColor font-medium mb-2 flex items-center">
              <BsEnvelope className="mr-2" size={20} />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border-2 border-SecondaryColor rounded-lg focus:outline-none focus:ring-2 focus:ring-DarkColor"
              placeholder="Enter email"
              required
            />
          </div>

          {/* Password */}
          <div className="bg-PrimaryColor p-4 rounded-lg">
            <label className="block text-DarkColor font-medium mb-2 flex items-center">
              <BsLock className="mr-2" size={20} />
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 border-2 border-SecondaryColor rounded-lg focus:outline-none focus:ring-2 focus:ring-DarkColor"
              placeholder="Enter password"
              required
            />
          </div>

          {/* Address */}
          <div className="bg-PrimaryColor p-4 rounded-lg">
            <label className="block text-DarkColor font-medium mb-2 flex items-center">
              <BsHouse className="mr-2" size={20} />
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full p-3 border-2 border-SecondaryColor rounded-lg focus:outline-none focus:ring-2 focus:ring-DarkColor"
              placeholder="Enter address"
            />
          </div>

          {/* Mobile */}
          <div className="bg-PrimaryColor p-4 rounded-lg">
            <label className="block text-DarkColor font-medium mb-2 flex items-center">
              <BsPhone className="mr-2" size={20} />
              Mobile
            </label>
            <input
              type="number"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              className="w-full p-3 border-2 border-SecondaryColor rounded-lg focus:outline-none focus:ring-2 focus:ring-DarkColor"
              placeholder="Enter mobile number"
              required
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
              <MdPersonAdd className="mr-2" size={24} />
            )}
            {loading ? "Creating User..." : "Create User"}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

export default CreateUser;
