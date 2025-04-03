import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft } from "react-icons/fi";
import { MdPerson } from "react-icons/md"; // Icon for user details
import { BsPerson, BsEnvelope, BsHouse, BsPhone } from "react-icons/bs";
import ClipLoader from "react-spinners/ClipLoader";
import Swal from "sweetalert2";
import API_CONFIG from "../../config/apiConfig.js"; // Adjust path as needed

function OneUser() {
  const { id } = useParams(); // Get userID from URL
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = `${API_CONFIG.BASE_URL}/api/users/${id}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || result.message || "Failed to fetch user");
        }

        setUser(result.data); // Assuming data is nested in 'data'
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

    fetchUser();
  }, [id]);

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
              <MdPerson className="text-DarkColor" size={24} />
            </div>
            User Details
          </h1>
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
        ) : user ? (
          /* User Details */
          <div className="space-y-6">
            {/* User ID */}
            <div className="bg-PrimaryColor p-4 rounded-lg">
              <div className="flex items-center text-DarkColor">
                <BsPerson className="mr-2" size={20} />
                <span className="font-medium">User ID:</span>
                <span className="ml-2">{user.userID}</span>
              </div>
            </div>

            {/* Username */}
            <div className="bg-PrimaryColor p-4 rounded-lg">
              <div className="flex items-center text-DarkColor">
                <BsPerson className="mr-2" size={20} />
                <span className="font-medium">Username:</span>
                <span className="ml-2">{user.UserName}</span>
              </div>
            </div>

            {/* Email */}
            <div className="bg-PrimaryColor p-4 rounded-lg">
              <div className="flex items-center text-DarkColor">
                <BsEnvelope className="mr-2" size={20} />
                <span className="font-medium">Email:</span>
                <span className="ml-2">{user.email}</span>
              </div>
            </div>

            {/* Address */}
            <div className="bg-PrimaryColor p-4 rounded-lg">
              <div className="flex items-center text-DarkColor">
                <BsHouse className="mr-2" size={20} />
                <span className="font-medium">Address:</span>
                <span className="ml-2">{user.address || "N/A"}</span>
              </div>
            </div>

            {/* Mobile */}
            <div className="bg-PrimaryColor p-4 rounded-lg">
              <div className="flex items-center text-DarkColor">
                <BsPhone className="mr-2" size={20} />
                <span className="font-medium">Mobile:</span>
                <span className="ml-2">{user.mobile}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-DarkColor">No user data available</div>
        )}
      </div>
    </motion.div>
  );
}

export default OneUser;