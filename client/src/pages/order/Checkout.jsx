import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { FaCcMastercard } from "react-icons/fa";
import { FaCcVisa } from "react-icons/fa";
import { SiAmericanexpress } from "react-icons/si";

axios.defaults.baseURL = 'http://localhost:3000';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { items, userId, total } = location.state || {};

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    mobile: "",
  });
  const [deliveryInfo, setDeliveryInfo] = useState({
    address: "",
    city: "",
    postalCode: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [cardInfo, setCardInfo] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleDeliveryChange = (e) => {
    const { name, value } = e.target;
    setDeliveryInfo((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    if (name === 'expiryDate') {
      const formattedValue = formatExpiryDate(value);
      setCardInfo((prevState) => ({ ...prevState, [name]: formattedValue }));
    } else {
      setCardInfo((prevState) => ({ ...prevState, [name]: value }));
    }
  };

  const formatExpiryDate = (value) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length >= 2) {
      return cleanValue.slice(0, 2) + '/' + cleanValue.slice(2, 4);
    }
    return cleanValue;
  };

  const getCardType = (cardNumber) => {
    const sanitizedCardNumber = cardNumber.replace(/\D/g, "");
    if (/^(5[1-5]\d{0,14}|2(2[2-9]\d{0,2}|[3-6]\d{0,3}|7[01]\d{0,2}|720\d{0,1}))$/.test(sanitizedCardNumber)) {
      return "Mastercard";
    }
    if (/^4\d{0,15}$/.test(sanitizedCardNumber)) {
      return "Visa";
    }
    if (/^3[47]\d{0,13}$/.test(sanitizedCardNumber)) {
      return "American Express";
    }
    return false;
  };

  const validateForm = () => {
    const phoneRegex = /^0\d{9}$/;
    const nameRegex = /^[A-Za-z\s]+$/;
    const postalCodeRegex = /^\d{5}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Check for empty customer info fields
    for (const [key, value] of Object.entries(customerInfo)) {
      if (!value.trim()) {
        Swal.fire("Validation Error", `Customer ${key} is required.`, "error");
        return false;
      }
    }

    if (!nameRegex.test(customerInfo.name)) {
      Swal.fire("Validation Error", "Customer name cannot contain numbers or special characters.", "error");
      return false;
    }

    if (!emailRegex.test(customerInfo.email)) {
      Swal.fire("Validation Error", "Please enter a valid email address.", "error");
      return false;
    }

    if (!phoneRegex.test(customerInfo.mobile)) {
      Swal.fire("Validation Error", "Mobile number should start with 0 and be 10 digits long.", "error");
      return false;
    }

    // Check for empty delivery info fields
    for (const [key, value] of Object.entries(deliveryInfo)) {
      if (!value.trim()) {
        Swal.fire("Validation Error", `Delivery ${key} is required.`, "error");
        return false;
      }
    }

    if (!postalCodeRegex.test(deliveryInfo.postalCode)) {
      Swal.fire("Validation Error", "Postal code must be exactly 5 digits long.", "error");
      return false;
    }

    if (paymentMethod === "Card") {
      // Check for empty card info fields
      for (const [key, value] of Object.entries(cardInfo)) {
        if (!value.trim()) {
          Swal.fire("Validation Error", `Card ${key} is required.`, "error");
          return false;
        }
      }

      if (!getCardType(cardInfo.cardNumber)) {
        Swal.fire("Validation Error", "Please enter a valid card number.", "error");
        return false;
      }

      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardInfo.expiryDate)) {
        Swal.fire("Validation Error", "Please enter a valid expiry date (MM/YY).", "error");
        return false;
      }

      if (!/^\d{3}$/.test(cardInfo.cvv)) {
        Swal.fire("Validation Error", "Please enter a valid 3-digit CVV.", "error");
        return false;
      }
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    const transformedItems = items.map(item => ({
      itemId: item.itemId,
      quantity: item.quantity || 1,
      price: item.price,
      title: item.title,
      color: item.color || '',
      size: item.size,
      img: item.img
    }));

    const orderData = {
      userId,
      items: transformedItems,
      total,
      customerInfo,
      deliveryInfo,
      paymentMethod,
      cardInfo: paymentMethod === "Card" ? cardInfo : undefined,
    };

    try {
      console.log("Sending order data:", orderData);
      const response = await axios.post("/api/orders/add", orderData);
      localStorage.removeItem("cart");
      setLoading(false);
      Swal.fire("Success", `Order placed successfully! Order ID: ${response.data.orderId}`, "success").then(() => {
        navigate("/my-orders");
      });
    } catch (error) {
      setLoading(false);
      console.error("Order error details:", {
        data: error.response?.data,
        status: error.response?.status,
        orderData: orderData
      });
      Swal.fire("Error", error.response?.data?.error?.[0] || error.response?.data?.message || "Failed to place order. Please try again.", "error");
    }
  };

  return (
    <div>
      <Navbar />
      <div className="min-h-screen p-8 flex flex-col items-center">
        <div className="w-full lg:w-3/4 flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-10 mt-20">
          <div className="w-full lg:w-1/2 space-y-6">
            <h1 className="text-3xl font-semibold mb-4">Order Summary</h1>
            {items && items.length > 0 ? (
              items.map((item) => (
                <div key={item.itemId} className="flex justify-between items-center p-4 border-b">
                  <div className="flex gap-2 items-center">
                    <img src={item.img} alt={item.title} className="w-16 h-16 object-cover rounded" />
                    <div className="flex flex-col">
                      <span className="font-medium">{item.title}</span>
                      <span className="text-gray-500">Color: <button style={{ backgroundColor: item.color }} className="w-5 h-5 rounded-full border-2 " /> Size: {item.size}</span>
                    </div>
                  </div>
                  <span> Qty: {item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))
            ) : (
              <p>No items to display</p>
            )}
            <div className="flex justify-between mt-4 font-semibold">
              <span>Subtotal:</span>
              <span>${total?.toFixed(2) || 0}</span>
            </div>
            <button onClick={() => navigate("/cart")} className="mt-4 w-full bg-gray-300 text-black py-2 rounded-full hover:bg-gray-400 transition duration-300">
              Back to Cart
            </button>
          </div>

          <div className="w-full lg:w-1/2 p-6 bg-gray-100 rounded-lg space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Customer Information</h2>
            <div>
              <input
                type="text"
                name="name"
                placeholder="Name *"
                value={customerInfo.name}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (!/^[a-zA-Z\s]$/.test(e.key) && e.key !== "Backspace" && e.key !== "Tab") {
                    e.preventDefault();
                  }
                }}
                className="w-full p-2 border rounded"
                required
              />
              {!customerInfo.name && <p className="text-red-500 text-xs mt-1">Name is required</p>}
            </div>
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email *"
                value={customerInfo.email}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
              {!customerInfo.email && <p className="text-red-500 text-xs mt-1">Email is required</p>}
              {!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email) && customerInfo.email && (
                <p className="text-red-500 text-xs mt-1">Please enter a valid email address.</p>
              )}
            </div>
            <div>
              <input
                type="text"
                name="mobile"
                placeholder="Mobile No. *"
                value={customerInfo.mobile}
                onChange={handleInputChange}
                maxLength={10}
                onKeyDown={(e) => {
                  if (!/^\d$/.test(e.key) && e.key !== "Backspace" && e.key !== "Tab") {
                    e.preventDefault();
                  }
                }}
                className="w-full p-2 border rounded"
                required
              />
              {!customerInfo.mobile && <p className="text-red-500 text-xs mt-1">Mobile number is required</p>}
              {!/^0\d{9}$/.test(customerInfo.mobile) && customerInfo.mobile && (
                <p className="text-red-500 text-xs mt-1">Please enter a valid mobile number starting with 0 and 10 digits long.</p>
              )}
            </div>

            <h2 className="text-xl font-semibold mt-4 mb-2">Delivery Information</h2>
            <div>
              <input
                type="text"
                name="address"
                placeholder="Address *"
                value={deliveryInfo.address}
                onChange={handleDeliveryChange}
                className="w-full p-2 border rounded"
                required
              />
              {!deliveryInfo.address && <p className="text-red-500 text-xs mt-1">Address is required</p>}
            </div>
            <div>
              <input
                type="text"
                name="city"
                placeholder="City *"
                value={deliveryInfo.city}
                onChange={handleDeliveryChange}
                onKeyDown={(e) => {
                  if (!/^[a-zA-Z\s]$/.test(e.key) && e.key !== "Backspace" && e.key !== "Tab") {
                    e.preventDefault();
                  }
                }}
                className="w-full p-2 border rounded"
                required
              />
              {!deliveryInfo.city && <p className="text-red-500 text-xs mt-1">City is required</p>}
            </div>
            <div>
              <input
                type="text"
                name="postalCode"
                placeholder="Postal Code *"
                value={deliveryInfo.postalCode}
                onChange={handleDeliveryChange}
                onKeyDown={(e) => {
                  if (!/^\d$/.test(e.key) && e.key !== "Backspace" && e.key !== "Tab") {
                    e.preventDefault();
                  }
                }}
                maxLength={5}
                className="w-full p-2 border rounded"
                required
              />
              {!deliveryInfo.postalCode && <p className="text-red-500 text-xs mt-1">Postal code is required</p>}
              {!/^\d{5}$/.test(deliveryInfo.postalCode) && deliveryInfo.postalCode && (
                <p className="text-red-500 text-xs mt-1">Please enter a valid postal code (5 digits).</p>
              )}
            </div>

            <h2 className="text-xl font-semibold mt-4 mb-2">Payment Information</h2>
            <select
              name="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
            </select>

            {paymentMethod === "Card" && (
              <>
                <div>
                  <div className="flex">
                    <input
                      type="text"
                      name="cardNumber"
                      placeholder="Card Number *"
                      value={cardInfo.cardNumber}
                      onChange={handleCardChange}
                      maxLength={16}
                      onKeyDown={(e) => {
                        if (!/^\d$/.test(e.key) && e.key !== "Backspace" && e.key !== "Tab") {
                          e.preventDefault();
                        }
                      }}
                      className="w-full p-2 border rounded"
                      required
                    />
                    <i className="text-3xl ml-5 mt-1">
                      {getCardType(cardInfo.cardNumber) === "Mastercard" && <FaCcMastercard />}
                      {getCardType(cardInfo.cardNumber) === "Visa" && <FaCcVisa />}
                      {getCardType(cardInfo.cardNumber) === "American Express" && <SiAmericanexpress />}
                    </i>
                  </div>
                  {!cardInfo.cardNumber && <p className="text-red-500 text-xs mt-1">Card number is required</p>}
                  {!getCardType(cardInfo.cardNumber) && cardInfo.cardNumber && (
                    <p className="text-red-500 text-xs mt-1">Please enter a valid card number.</p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    name="expiryDate"
                    placeholder="Expiry Date (MM/YY) *"
                    value={cardInfo.expiryDate}
                    onChange={handleCardChange}
                    maxLength={5}
                    onKeyDown={(e) => {
                      if (!/^\d$/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab') {
                        e.preventDefault();
                      }
                    }}
                    className="w-full p-2 border rounded"
                    required
                  />
                  {!cardInfo.expiryDate && <p className="text-red-500 text-xs mt-1">Expiry date is required</p>}
                  {!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardInfo.expiryDate) && cardInfo.expiryDate && (
                    <p className="text-red-500 text-xs mt-1">Please enter a valid expiry date (MM/YY)</p>
                  )}
                </div>
                <div>
                  <input
                    type="password"
                    name="cvv"
                    placeholder="CVV *"
                    value={cardInfo.cvv}
                    maxLength={3}
                    onKeyDown={(e) => {
                      if (!/^\d$/.test(e.key) && e.key !== "Backspace" && e.key !== "Tab") {
                        e.preventDefault();
                      }
                    }}
                    onChange={handleCardChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                  {!cardInfo.cvv && <p className="text-red-500 text-xs mt-1">CVV is required</p>}
                  {!/^\d{3}$/.test(cardInfo.cvv) && cardInfo.cvv && (
                    <p className="text-red-500 text-xs mt-1">Please enter a valid 3-digit CVV</p>
                  )}
                </div>
              </>
            )}

            <button
              onClick={handlePlaceOrder}
              className="mt-6 w-full bg-green-500 text-white py-3 rounded-full hover:bg-green-600 transition duration-300"
              disabled={loading}
            >
              {loading ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;