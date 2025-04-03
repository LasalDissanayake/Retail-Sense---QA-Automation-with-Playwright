import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiSearch, FiTrash2 } from "react-icons/fi";
import { MdPeople, MdAdd, MdDownload } from "react-icons/md";
import ClipLoader from "react-spinners/ClipLoader";
import Swal from "sweetalert2";
import API_CONFIG from "../../config/apiConfig.js";
import jsPDF from "jspdf";
import "jspdf-autotable";
import AddUserPopup from "./AddUserPopup";

function AllUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all"); // New state for role filter
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userCounts, setUserCounts] = useState({
    total: 0,
    customers: 0,
    managers: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
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

      setUsers(result.data);
      calculateUserCounts(result.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to fetch users.",
        confirmButtonColor: "#89198f",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateUserCounts = (userData) => {
    const counts = {
      total: userData.length,
      customers: userData.filter((user) => user.role === "customer").length,
      managers: userData.filter((user) => user.role === "admin").length,
    };
    setUserCounts(counts);
  };

  const deleteUser = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#89198f",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const url = `${API_CONFIG.BASE_URL}/api/users/${id}`;
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

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "The user has been deleted.",
          confirmButtonColor: "#89198f",
        });
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: "There was an error deleting the user.",
          confirmButtonColor: "#89198f",
        });
      }
    }
  };

  //report 

  const downloadPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Header
    doc.setFontSize(28).setFont("helvetica", "bold").setTextColor(137, 25, 143);
    doc.text("User Report", 105, 20, { align: "center" });

    // Subtitle
    doc.setFontSize(18).setFont("helvetica", "normal").setTextColor(40, 40, 40);
    doc.text("Detailed User Information", 105, 30, { align: "center" });

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

    // Detailed User Table
    const tableColumn = ["#", "Username", "Email", "Address", "Mobile", "Role"];
    const tableRows = filteredUsers.map((user, index) => [
      index + 1,
      user.UserName,
      user.email,
      user.address || "N/A",
      user.mobile,
      user.role === "admin" ? "Manager" : "Customer",
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 55 + 25 + 10, // Adjusted for removed cards
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: {
        fillColor: [137, 25, 143],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
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

    doc.save(`User_Report_${currentDate}.pdf`);
  };

  //search
  
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.UserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole =
      roleFilter === "all" ||
      (roleFilter === "customer" && user.role === "customer") ||
      (roleFilter === "manager" && user.role === "admin");
    return matchesSearch && matchesRole;
  });

  const CountCard = ({ title, count, icon }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-PrimaryColor p-4 rounded-lg text-DarkColor flex items-center space-x-4 w-64"
    >
      <div className="bg-DarkColor p-3 rounded-full">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-2xl font-bold">{count}</p>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-PrimaryColor p-6 flex items-center justify-center"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl border-2 border-SecondaryColor">
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
            onClick={() => setIsAddUserOpen(true)}
            className="bg-DarkColor text-white p-2 rounded-full flex items-center hover:opacity-90 transition-all"
          >
            <MdAdd size={20} className="mr-1" />
            Add New
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <CountCard
            title="Customers"
            count={userCounts.customers}
            icon={<MdPeople className="text-white text-2xl" />}
          />
          <CountCard
            title="Managers"
            count={userCounts.managers}
            icon={<MdPeople className="text-white text-2xl" />}
          />
        </div>

        <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0 md:space-x-4">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative w-full md:w-1/3"
          >
            <input
              type="text"
              placeholder="Search users..."
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
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="p-2 border-2 border-SecondaryColor rounded-lg focus:outline-none focus:ring-2 focus:ring-DarkColor"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customers</option>
              <option value="manager">Managers</option>
            </select>
            <button
              onClick={downloadPDF}
              className="bg-DarkColor text-white p-2 rounded-lg flex items-center hover:opacity-90 transition-all"
            >
              <MdDownload className="mr-2" />
              Download PDF
            </button>
          </motion.div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <ClipLoader color="#89198f" size={50} />
          </div>
        ) : (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="overflow-x-auto rounded-lg shadow-lg"
          >
            <table className="w-full text-left text-DarkColor">
              <thead className="bg-PrimaryColor text-DarkColor">
                <tr>
                  <th className="p-4 font-semibold">Username</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Address</th>
                  <th className="p-4 font-semibold">Mobile</th>
                  <th className="p-4 font-semibold">Role</th>
                  <th className="p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <motion.tr
                        key={user._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b border-SecondaryColor hover:bg-SecondaryColor/20"
                      >
                        <td className="p-4">{user.UserName}</td>
                        <td className="p-4">{user.email}</td>
                        <td className="p-4">{user.address || "N/A"}</td>
                        <td className="p-4">{user.mobile}</td>
                        <td className="p-4">{user.role === "admin" ? "Manager" : "Customer"}</td>
                        <td className="p-4 flex space-x-2">
                          <button
                            onClick={() => deleteUser(user._id)}
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
                      <td
                        colSpan="6"
                        className="p-4 text-center text-gray-500"
                      >
                        No users found
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </motion.div>
        )}

        {isAddUserOpen && (
          <AddUserPopup
            closePopup={() => setIsAddUserOpen(false)}
            refreshUsers={fetchUsers}
          />
        )}
      </div>
    </motion.div>
  );
}

export default AllUsers;