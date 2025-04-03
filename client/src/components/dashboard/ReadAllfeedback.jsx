import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiStar, FiEdit, FiTrash2, FiSearch } from "react-icons/fi";
import { MdFeedback, MdDownload } from "react-icons/md";
import ClipLoader from "react-spinners/ClipLoader";
import Swal from "sweetalert2";
import API_CONFIG from "../../config/apiConfig.js";
import jsPDF from "jspdf";
import "jspdf-autotable";

function ReadAllFeedback() {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all feedback on component mount
  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `${API_CONFIG.BASE_URL}/api/feedbacks`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || "Failed to fetch feedback");
      }

      setFeedbacks(result.data);
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

  // Render star rating
  const renderStars = (rating) => {
    const numRating = parseInt(rating, 10);
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            size={16}
            className={star <= numRating ? "text-yellow-400 fill-current" : "text-gray-400"}
          />
        ))}
      </div>
    );
  };

  // Handle Edit
  const handleEdit = (id) => {
    navigate(`/editfeedback/${id}`);
  };

  // Handle Delete
  const handleDelete = async (id) => {
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
          const url = `${API_CONFIG.BASE_URL}/api/feedbacks/${id}`;
          const response = await fetch(url, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || result.message || "Failed to delete feedback");
          }

          setFeedbacks(feedbacks.filter((feedback) => feedback._id !== id));
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Feedback has been deleted.",
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

  // Filter feedbacks by comment
  const filteredFeedbacks = feedbacks.filter((feedback) =>
    feedback.comment?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Download PDF Report
  const downloadPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Header
    doc.setFontSize(28).setFont("helvetica", "bold").setTextColor(137, 25, 143);
    doc.text("Feedback Report", 105, 20, { align: "center" });

    // Subtitle
    doc.setFontSize(18).setFont("helvetica", "normal").setTextColor(40, 40, 40);
    doc.text("Detailed Feedback Information", 105, 30, { align: "center" });

    // Divider Line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 42, 190, 42);

    // Report Date
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.setFontSize(10).setTextColor(100, 100, 100);
    doc.text(`Generated on: ${currentDate}`, 20, 48);

    // Detailed Feedback Table
    const tableColumn = [
      "#",
      "Feedback ID",
      "User ID",
      "Product ID",
      "Rating",
      "Comment",
      "Order ID",
    ];
    const tableRows = filteredFeedbacks.map((feedback, index) => [
      index + 1,
      feedback.feedbackID || feedback._id,
      feedback.userID,
      feedback.productID,
      feedback.rating,
      feedback.comment || "N/A",
      feedback.orderID,
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: {
        fillColor: [137, 25, 143], // Dark purple header
        textColor: [255, 255, 255], // White text
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 245, 245] }, // Light gray for alternate rows
    });

    // Footer with Page Numbers
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(100, 100, 100);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    }

    doc.save(`Feedback_Report_${currentDate}.pdf`);
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
                <MdFeedback className="text-DarkColor" size={24} />
              </div>
              All Feedback
            </h1>
          </div>
        </div>

        {/* Search and Download */}
        <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0 md:space-x-4">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative w-full md:w-1/3"
          >
            <input
              type="text"
              placeholder="Search by comment..."
              className="w-full p-3 pl-10 border-2 border-SecondaryColor rounded-lg focus:outline-none focus:ring-2 focus:ring-DarkColor"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-DarkColor" />
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex space-x-4"
          >
            <button
              onClick={downloadPDF}
              className="bg-DarkColor text-white p-2 rounded-lg flex items-center hover:opacity-90 transition-all"
            >
              <MdDownload className="mr-2" />
              Download PDF
            </button>
          </motion.div>
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
          /* Feedback Table */
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="overflow-x-auto rounded-lg shadow-lg"
          >
            <table className="w-full text-left text-DarkColor">
              <thead className="bg-PrimaryColor text-DarkColor">
                <tr>
                  <th className="p-4 font-semibold">Feedback ID</th>
                  <th className="p-4 font-semibold">User ID</th>
                  <th className="p-4 font-semibold">Product ID</th>
                  <th className="p-4 font-semibold">Rating</th>
                  <th className="p-4 font-semibold">Comment</th>
                  <th className="p-4 font-semibold">Order ID</th>
                  <th className="p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredFeedbacks.length > 0 ? (
                    filteredFeedbacks.map((feedback) => (
                      <motion.tr
                        key={feedback._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b border-SecondaryColor hover:bg-SecondaryColor/20"
                      >
                        <td className="p-4">{feedback.feedbackID || feedback._id}</td>
                        <td className="p-4">{feedback.userID}</td>
                        <td className="p-4">{feedback.productID}</td>
                        <td className="p-4">{renderStars(feedback.rating)}</td>
                        <td className="p-4">{feedback.comment || "N/A"}</td>
                        <td className="p-4">{feedback.orderID}</td>
                        <td className="p-4 flex space-x-2">
                          <button
                            onClick={() => handleEdit(feedback._id)}
                            className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-all"
                            title="Edit"
                          >
                            <FiEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(feedback._id)}
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all"
                            title="Delete"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="p-4 text-center text-gray-500">
                        No feedback found
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default ReadAllFeedback;