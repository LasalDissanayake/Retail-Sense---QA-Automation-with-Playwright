import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Swal from "sweetalert2";
import Modal from "react-modal";
import SalesReport from "./SalesReport";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { init, send } from "emailjs-com";
import { Line, Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
} from 'chart.js';

// Import icons for status indicators
import { FaBox, FaTruck, FaCheckCircle, FaClock, FaShippingFast, FaBoxOpen } from "react-icons/fa";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Custom styles for the modal
const customModalStyles = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(5px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    position: 'relative',
    top: 'auto',
    left: 'auto',
    right: 'auto',
    bottom: 'auto',
    maxWidth: '90%',
    width: '900px',
    maxHeight: '90vh',
    margin: '0 auto',
    padding: 0,
    border: 'none',
    borderRadius: '0.75rem',
    backgroundColor: 'white',
    overflow: 'auto'
  }
};

// Custom animations for each status
const statusAnimations = {
  Pending: {
    icon: (isActive) => (
      <motion.div
        animate={{
          rotate: isActive ? 360 : 0,
          scale: isActive ? [1, 1.1, 1] : 1
        }}
        transition={{
          rotate: {
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          },
          scale: {
            duration: 1,
            repeat: Infinity,
            repeatType: "reverse"
          }
        }}
        className={`w-full h-full flex items-center justify-center ${
          isActive ? "text-purple-600" : "text-gray-400"
        }`}
      >
        <FaClock className="w-8 h-8" />
      </motion.div>
    ),
  },
  Processing: {
    icon: (isActive) => (
      <motion.div
        animate={isActive ? {
          scale: [1, 1.2, 1],
          rotate: [0, 10, -10, 0],
          y: [0, -2, 0]
        } : {}}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className={`w-full h-full flex items-center justify-center ${
          isActive ? "text-purple-600" : "text-gray-400"
        }`}
      >
        <FaBox className="w-8 h-8" />
      </motion.div>
    ),
  },
  Shipped: {
    icon: (isActive) => (
      <div className="relative">
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={isActive ? {
            x: [-20, 20],
            scale: [1, 1.1, 1],
            opacity: 1
          } : {
            x: 0,
            scale: 1,
            opacity: 0.5
          }}
          transition={{
            duration: 2,
            repeat: isActive ? Infinity : 0,
            repeatType: "mirror",
            ease: "easeInOut"
          }}
          className={`w-full h-full flex items-center justify-center ${
            isActive ? "text-purple-600" : "text-gray-300"
          }`}
          style={{ perspective: "1000px" }}
        >
          <FaShippingFast className="w-10 h-10" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={isActive ? { 
            opacity: [0, 1, 0],
            x: [-20, 20],
            scale: [0.8, 1, 0.8]
          } : {
            opacity: 0.3,
            x: 0,
            scale: 0.8
          }}
          transition={{
            duration: 2,
            repeat: isActive ? Infinity : 0,
            ease: "linear"
          }}
          className={`absolute inset-0 flex items-center justify-center ${
            isActive ? "text-purple-400" : "text-gray-300"
          }`}
        >
          <FaBoxOpen className="w-10 h-10" />
        </motion.div>
      </div>
    ),
  },
  Delivered: {
    icon: (isActive) => (
      <motion.div
        initial={{ scale: 0 }}
        animate={isActive ? {
          scale: [0, 1.2, 1],
          rotate: [0, 360, 360],
          y: [0, -5, 0]
        } : { scale: 1 }}
        transition={{
          duration: 0.5,
          repeat: isActive ? Infinity : 0,
          repeatDelay: 2,
          ease: "backOut",
        }}
        className={`w-full h-full flex items-center justify-center ${
          isActive ? "text-purple-600" : "text-gray-400"
        }`}
      >
        <FaCheckCircle className="w-8 h-8" />
      </motion.div>
    ),
  },
};

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrder, setFilteredOrder] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [orderStats, setOrderStats] = useState({
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0
  });
  const [itemStats, setItemStats] = useState([]);

  // Calculate order statistics
  useEffect(() => {
    const stats = orders.reduce((acc, order) => {
      acc[order.status.toLowerCase()] = (acc[order.status.toLowerCase()] || 0) + 1;
      return acc;
    }, {});
    setOrderStats({
      pending: stats.pending || 0,
      processing: stats.processing || 0,
      shipped: stats.shipped || 0,
      delivered: stats.delivered || 0
    });
  }, [orders]);

  // Get all months up to current month
  const getAllMonthsInRange = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Get min year from orders and current date
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    const years = orders.map(order => new Date(order.createdAt).getFullYear());
    const minYear = Math.min(...years, currentYear);
    
    // Generate months from min year to current month
    const allMonths = [];
    for (let year = minYear; year <= currentYear; year++) {
      months.forEach((month, monthIndex) => {
        // Only add months up to current month for current year
        if (year < currentYear || (year === currentYear && monthIndex <= currentMonth)) {
          allMonths.push(`${month} ${year}`);
        }
      });
    }
    
    // If no orders or all orders are in future, show only past months of current year
    if (allMonths.length === 0) {
      for (let monthIndex = 0; monthIndex <= currentMonth; monthIndex++) {
        allMonths.push(`${months[monthIndex]} ${currentYear}`);
      }
    }
    
    return allMonths;
  };

  // Calculate item statistics with monthly tracking
  useEffect(() => {
    const itemTrends = {};
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Initialize all months in range (up to current month)
    const allMonthsInRange = getAllMonthsInRange();
    
    // Sort orders by date and filter out future orders
    const currentDate = new Date();
    const sortedOrders = [...orders]
      .filter(order => new Date(order.createdAt) <= currentDate)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Initialize all items with zero values for valid months
    sortedOrders.forEach(order => {
      order.items?.forEach(item => {
        if (item.title && !itemTrends[item.title]) {
          itemTrends[item.title] = {
            months: {},
            totalQuantity: 0,
            totalRevenue: 0
          };
          
          // Initialize months up to current month with zero
          allMonthsInRange.forEach(monthYear => {
            itemTrends[item.title].months[monthYear] = {
              quantity: 0,
              revenue: 0
            };
          });
        }
      });
    });

    // Add actual sales data
    sortedOrders.forEach(order => {
      const date = new Date(order.createdAt);
      const monthYear = `${months[date.getMonth()]} ${date.getFullYear()}`;
      
      order.items?.forEach(item => {
        if (item.title) {
          itemTrends[item.title].months[monthYear].quantity += item.quantity;
          itemTrends[item.title].months[monthYear].revenue += item.price * item.quantity;
          itemTrends[item.title].totalQuantity += item.quantity;
          itemTrends[item.title].totalRevenue += item.price * item.quantity;
        }
      });
    });

    // Get top 5 items by total quantity
    const top5Items = Object.entries(itemTrends)
      .sort(([, a], [, b]) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5)
      .map(([title, data]) => ({
        title,
        ...data
      }));

    setItemStats(top5Items);
  }, [orders]);

  // Chart data for items trend
  const itemTrendData = {
    labels: getAllMonthsInRange(),
    datasets: itemStats.map((item, index) => ({
      label: item.title,
      data: getAllMonthsInRange().map(month => ({
        x: month,
        y: item.months[month]?.quantity || 0
      })),
      borderColor: [
        'rgb(147, 51, 234)',  // Purple
        'rgb(52, 211, 153)',  // Green
        'rgb(59, 130, 246)',  // Blue
        'rgb(249, 115, 22)',  // Orange
        'rgb(236, 72, 153)'   // Pink
      ][index],
      backgroundColor: [
        'rgba(147, 51, 234, 0.2)',
        'rgba(52, 211, 153, 0.2)',
        'rgba(59, 130, 246, 0.2)',
        'rgba(249, 115, 22, 0.2)',
        'rgba(236, 72, 153, 0.2)'
      ][index],
      tension: 0.4,
      fill: true
    }))
  };

  const itemChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 10
        }
      },
      title: {
        display: true,
        text: 'Monthly Sales Trends by Item',
        padding: 10
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const item = itemStats[context.datasetIndex];
            const month = context.label;
            const monthData = item.months[month] || { quantity: 0, revenue: 0 };
            return [
              `${item.title}: ${monthData.quantity} units`,
              `Monthly Revenue: $${monthData.revenue.toFixed(2)}`,
              `Avg. Price: $${monthData.quantity ? (monthData.revenue / monthData.quantity).toFixed(2) : '0.00'}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Month'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Units Sold'
        },
        ticks: {
          precision: 0
        }
      }
    }
  };

  // Chart data for line graph
  const lineChartData = {
    labels: ['Pending', 'Processing', 'Shipped', 'Delivered'],
    datasets: [
      {
        label: 'Order Status Distribution',
        data: [orderStats.pending, orderStats.processing, orderStats.shipped, orderStats.delivered],
        fill: false,
        borderColor: 'rgb(147, 51, 234)',
        tension: 0.3,
        pointBackgroundColor: 'rgb(147, 51, 234)',
      }
    ]
  };

  // Chart data for pie chart
  const pieChartData = {
    labels: ['Pending', 'Processing', 'Shipped', 'Delivered'],
    datasets: [
      {
        data: [orderStats.pending, orderStats.processing, orderStats.shipped, orderStats.delivered],
        backgroundColor: [
          'rgba(255, 206, 86, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(75, 192, 192, 0.7)',
        ],
        borderColor: [
          'rgba(255, 206, 86, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,  
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          padding: 8
        }
      },
      title: {
        display: true,
        text: 'Order Status Trends',
        padding: 10
      },
    },
  };

  const [dates, setDates] = useState([]);

  init("jm1C0XkEa3KYwvYK0");

  const chartRef = useRef();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get("/api/orders");
        if (response.data) {
          setOrders(response.data);
          const allDates = response.data.map((ord) => ord.createdAt.split("T")[0]);
          setDates([...new Set(allDates)]); // Remove duplicates
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to fetch orders. Please try again.',
        });
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    const searchLower = searchValue.toLowerCase();
    const filteredOrders = orders.filter((order) => {
      return (
        order.orderId.toLowerCase().includes(searchLower) ||
        order.userId.toLowerCase().includes(searchLower) ||
        order.customerInfo?.name?.toLowerCase().includes(searchLower) ||
        order.customerInfo?.email?.toLowerCase().includes(searchLower)
      );
    });
    setFilteredOrder(filteredOrders);
  }, [searchValue, orders]);

  const statusOptions = ["Pending", "Processing", "Shipped", "Delivered"];

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(`/api/orders/${orderId}/status`, { status: newStatus });
      // Update local state
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
      
      Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: `Order status has been updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update order status',
      });
    }
  };

  const AnimatedProgressBar = ({ status }) => {
    const getProgress = () => {
      switch (status) {
        case 'Pending': return 25;
        case 'Processing': return 50;
        case 'Shipped': return 75;
        case 'Delivered': return 100;
        default: return 0;
      }
    };

    return (
      <div className="w-full py-8">
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 transform -translate-y-1/2">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${getProgress()}%` }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          </div>

          {/* Status Steps */}
          <div className="relative flex justify-between">
            {statusOptions.map((step, index) => {
              const isActive = statusOptions.indexOf(status) >= index;
              const isCurrent = status === step;
              const StatusIcon = statusAnimations[step]?.icon;
              
              return (
                <div key={step} className="flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      delay: index * 0.2,
                      type: "spring",
                      stiffness: 200,
                      damping: 10
                    }}
                    className={`relative w-16 h-16 rounded-full flex items-center justify-center border-2 z-10 
                      ${isActive 
                        ? 'border-purple-600 bg-purple-50 shadow-lg' 
                        : 'border-gray-300 bg-white'}`}
                  >
                    {StatusIcon && StatusIcon(isActive)}

                    {isCurrent && (
                      <motion.div
                        className="absolute -inset-1 rounded-full border-4 border-purple-400"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ 
                          opacity: [0.5, 0],
                          scale: [0.8, 1.5]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeOut"
                        }}
                      />
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: index * 0.4,
                      type: "spring",
                      stiffness: 100
                    }}
                    className="mt-4 text-center"
                  >
                    <span className={`text-sm font-medium ${
                      isActive ? 'text-purple-600' : 'text-gray-400'
                    }`}>
                      {step}
                    </span>
                    {isCurrent && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-xs text-purple-500 mt-1"
                      >
                        Current Status
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const CustomerOrderHistory = ({ customerEmail }) => {
    const customerOrders = orders.filter(
      order => order.customerInfo?.email === customerEmail
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return (
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Order History</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customerOrders.map((order) => (
                <motion.tr
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <td className="px-4 py-3 text-sm">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">{order.orderId}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold
                      ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'Shipped' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-green-100 text-green-800'}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    ${order.total?.toFixed(2)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const OrderDetailsModal = ({ order, onClose }) => {
    if (!order) return null;

    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Order Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <AnimatedProgressBar status={order.status} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Order Information</h3>
              <div className="space-y-3">
                <p><span className="font-medium">Order ID:</span> {order.orderId}</p>
                <p><span className="font-medium">Payment Method:</span> {order.paymentMethod}</p>
                <p><span className="font-medium">Total Amount:</span> ${order.total?.toFixed(2)}</p>
                <p><span className="font-medium">Order Date:</span> {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Status</h3>
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Customer Information</h3>
              <div className="space-y-3">
                <p><span className="font-medium">Name:</span> {order.customerInfo?.name}</p>
                <p><span className="font-medium">Email:</span> {order.customerInfo?.email}</p>
                <p><span className="font-medium">Phone:</span> {order.customerInfo?.phone}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Delivery Information</h3>
              <div className="space-y-3">
                <p><span className="font-medium">Address:</span> {order.deliveryInfo?.address}</p>
                <p><span className="font-medium">City:</span> {order.deliveryInfo?.city}</p>
                <p><span className="font-medium">Postal Code:</span> {order.deliveryInfo?.postalCode}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="font-semibold text-lg mb-4">Ordered Items</h3>
          <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
            <div className="divide-y divide-gray-200">
              {order.items?.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="py-4 first:pt-0 last:pb-0 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600">Size: {item.size}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">${item.price?.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <CustomerOrderHistory customerEmail={order.customerInfo?.email} />
      </div>
    );
  };

  const deleteOrder = async (orderId) => {
    try {
      const result = await Swal.fire({
        title: 'Delete Order',
        text: 'Are you sure you want to delete this order? This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it',
        cancelButtonText: 'No, keep it',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#89198f',
      });

      if (result.isConfirmed) {
        const response = await axios.delete(`/api/order/delete/${orderId}`);
        
        if (response.data) {
          setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
          
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'The order has been deleted.',
            confirmButtonColor: '#89198f',
          });
        }
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete order. Please try again.',
        confirmButtonColor: '#89198f',
      });
    }
  };

  const getTodayDay = (x) => {
    const today = new Date();
    today.setDate(today.getDate() - x);
    const options = {
      weekday: "long",
    };
    const formattedDate = today.toLocaleDateString("en-CA", options);
    console.log(formattedDate);
    return formattedDate;
  };

  const getDate = (x) => {
    const today = new Date();
    today.setDate(today.getDate() - x);
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };
    const formattedDate = today.toLocaleDateString("en-CA", options);
    const dayOrder = orders.filter((item) =>
      item.createdAt.split("T")[0].includes(formattedDate)
    );
    const lengths = dayOrder.length;
    return lengths;
  };

  const dddf = getDate(27);
  console.log(dddf);

  const xLabels = [
    getTodayDay(0),
    getTodayDay(1),
    getTodayDay(2),
    getTodayDay(3),
    getTodayDay(4),
    getTodayDay(5),
    getTodayDay(6),
  ];

  const uData = [
    getDate(0),
    getDate(1),
    getDate(2),
    getDate(3),
    getDate(4),
    getDate(5),
    getDate(6),
  ];

  const openCard = (order) => {
    setModalIsOpen(true);
    setSelectedOrder(order);
    console.log(selectedOrder);
    console.log("Selected Order:", selectedOrder.customerInfo);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 p-8"
    >
      <h1 className="text-3xl font-bold text-ExtraDarkColor mb-6">
        Order Management
      </h1>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow w-full max-w-xl">
            <h3 className="text-lg font-semibold mb-2">Order Status Trend</h3>
            <div className="h-64">
              <Line data={lineChartData} options={chartOptions} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow w-full max-w-xl">
            <h3 className="text-lg font-semibold mb-2">Order Status Distribution</h3>
            <div className="h-64">
              <Pie data={pieChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="bg-white p-4 rounded-lg shadow w-full">
            <h3 className="text-lg font-semibold mb-2">Monthly Sales Trends by Item</h3>
            <div className="h-64">
              <Line data={itemTrendData} options={itemChartOptions} />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Search by Order ID, Customer ID, Name, or Email"
              className="w-96 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <PDFDownloadLink
              document={<SalesReport orders={filteredOrder} />}
              fileName="sales-report.pdf"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 hover:bg-purple-700"
            >
              {({ loading }) => (
                loading ? "Generating..." : "Generate Report"
              )}
            </PDFDownloadLink>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-4">
            <button
              className={`px-4 py-2 rounded-lg ${
                activeTab === "all"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setActiveTab("all")}
            >
              All Orders
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${
                activeTab === "pending"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setActiveTab("pending")}
            >
              Pending Orders
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(activeTab === "all" ? filteredOrder : filteredOrder.filter(order => order.status === "Pending"))
                .map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.orderId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.userId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-h-20 overflow-y-auto">
                        {order.items?.map((item, index) => (
                          <span key={index} className="text-gray-900">
                            {item.title}
                            {index < order.items.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${order.total?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-sm font-semibold
                          ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'Shipped' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-green-100 text-green-800'}`}
                      >
                        {statusOptions.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button
                        onClick={() => openCard(order)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => deleteOrder(order._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={customModalStyles}
        contentLabel="Order Details"
      >
        <div className="min-h-full w-full">
          <OrderDetailsModal order={selectedOrder} onClose={closeModal} />
        </div>
      </Modal>
    </motion.div>
  );
};

export default OrderManagement;
