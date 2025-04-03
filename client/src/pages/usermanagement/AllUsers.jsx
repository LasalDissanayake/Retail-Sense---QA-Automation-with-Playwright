import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft, FiEdit, FiTrash2, FiSearch } from "react-icons/fi";
import { MdPeople, MdAdd, MdDownload } from "react-icons/md";
import ClipLoader from "react-spinners/ClipLoader";
import Swal from "sweetalert2";
import API_CONFIG from "../../config/apiConfig.js"; // Adjust path as needed
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";

function AllUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState("csv");
  const [userCounts, setUserCounts] = useState({
    total: 0,
    customers: 0,
    managers: 0,
  });

  // Fetch all users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `${API_CONFIG.BASE_URL}/api/users`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || "Failed to fetch users");
      }

      setUsers(result.data); // Assuming backend returns data in a 'data' field
      calculateUserCounts(result.data);
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

  const calculateUserCounts = (userData) => {
    const counts = {
      total: userData.length,
      customers: userData.filter((user) => user.userType === "customer").length,
      managers: userData.filter((user) => user.isManager).length,
    };
    setUserCounts(counts);
  };

  // Handle Delete
  const handleDelete = async (_id) => {
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
          const url = `${API_CONFIG.BASE_URL}/api/users/${_id}`;
          const response = await fetch(url, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || result.message || "Failed to delete user");
          }

          setUsers(users.filter((user) => user._id !== _id));
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "User has been deleted.",
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
  const handleEdit = (_id) => {
    navigate(`/edit-user/${_id}`); // Adjust route as needed
  };

  // Handle Add Navigation
  const handleAdd = () => {
    navigate("/add-user"); // Adjust route as needed
  };

  // Filter users based on search query
  const filteredUsers = users.filter(
    (user) =>
      user.UserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Download CSV
  const downloadCSV = () => {
    const csvContent = [
      ["Username", "Email", "Address", "Mobile", "User Type", "Is Manager"],
      ...filteredUsers.map((user) => [
        user.UserName,
        user.email,
        user.address || "N/A",
        user.mobile,
        user.userType,
        user.isManager ? "Yes" : "No",
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "users_report.csv");
  };

  // Download PDF
  const downloadPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Header
    doc.setFontSize(20).setTextColor(40, 40, 40);
    doc.text("All Users Report", 105, 20, { align: "center" });

    // User Count Cards
    const cardY = 30;
    doc.setFontSize(12).setTextColor(100, 100, 100);
    doc.text(`Total Users: ${userCounts.total}`, 20, cardY);
    doc.text(`Customers: ${userCounts.customers}`, 80, cardY);
    doc.text(`Managers: ${userCounts.managers}`, 140, cardY);

    // Table
    doc.autoTable({
      startY: 40,
      head: [["Username", "Email", "Address", "Mobile", "User Type", "Is Manager"]],
      body: filteredUsers.map((user) => [
        user.UserName,
        user.email,
        user.address || "N/A",
        user.mobile,
        user.userType,
        user.isManager ? "Yes" : "No",
      ]),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [137, 25, 143], textColor: 255 }, // #89198f
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save("users_report.pdf");
  };

  const handleDownload = () => {
    if (reportType === "csv") {
      downloadCSV();
    } else {
      downloadPDF();
    }
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
                <MdPeople className="text-DarkColor" size={24} />
              </div>
              All Users
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

        {/* User Counts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-PrimaryColor p-4 rounded-lg text-DarkColor">
            <h3 className="font-semibold">Total Users</h3>
            <p className="text-2xl">{userCounts.total}</p>
          </div>
          <div className="bg-PrimaryColor p-4 rounded-lg text-DarkColor">
            <h3 className="font-semibold">Customers</h3>
            <p className="text-2xl">{userCounts.customers}</p>
          </div>
          <div className="bg-PrimaryColor p-4 rounded-lg text-DarkColor">
            <h3 className="font-semibold">Managers</h3>
            <p className="text-2xl">{userCounts.managers}</p>
          </div>
        </div>

        {/* Search and Download */}
        <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative w-full md:w-1/3">
            <input
              type="text"
              placeholder="Search users..."
              className="w-full p-3 pl-10 border-2 border-SecondaryColor rounded-lg focus:outline-none focus:ring-2 focus:ring-DarkColor"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-DarkColor" />
          </div>
          <div className="flex space-x-4">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="p-2 border-2 border-SecondaryColor rounded-lg focus:outline-none focus:ring-2 focus:ring-DarkColor"
            >
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
            <button
              onClick={handleDownload}
              className="bg-DarkColor text-white p-2 rounded-lg flex items-center hover:opacity-90 transition-all"
            >
              <MdDownload className="mr-2" />
              Download
            </button>
          </div>
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
          /* Users Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-DarkColor">
              <thead className="bg-PrimaryColor text-DarkColor">
                <tr>
                  <th className="p-4 font-semibold">Username</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Address</th>
                  <th className="p-4 font-semibold">Mobile</th>
                  <th className="p-4 font-semibold">User Type</th>
                  <th className="p-4 font-semibold">Is Manager</th>
                  <th className="p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr
                      key={user._id}
                      className="border-b border-SecondaryColor hover:bg-SecondaryColor/20"
                    >
                      <td className="p-4">{user.UserName}</td>
                      <td className="p-4">{user.email}</td>
                      <td className="p-4">{user.address || "N/A"}</td>
                      <td className="p-4">{user.mobile}</td>
                      <td className="p-4">{user.userType}</td>
                      <td className="p-4">{user.isManager ? "Yes" : "No"}</td>
                      <td className="p-4 flex space-x-2">
                        <button
                          onClick={() => handleEdit(user._id)}
                          className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-all"
                          title="Edit"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
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
                    <td colSpan="7" className="p-4 text-center text-gray-500">
                      No users found
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

export default AllUsers;