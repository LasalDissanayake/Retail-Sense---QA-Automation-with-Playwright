// models/Order.js
import mongoose from "mongoose";

// Define the Order Schema
const orderSchema = new mongoose.Schema({
  // Reference to the user who placed the order
  userId: {
    type: String, // Using String assuming User model uses string IDs
    ref: "User",  // References the User model
    required: true,
    index: true   // Added index for faster queries
  },

  // Array of items in the order
  items: [
    {
      itemId: {
        type: String,
        ref: "Item",  // References the Item/Product model
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,     // Ensures quantity is positive
      },
      price: {
        type: Number,
        required: true,
        min: 0      // Ensures price isn't negative
      },
      title: {
        type: String,
        required: true,
        trim: true  // Removes unnecessary whitespace
      },
      color: {
        type: String,
        trim: true
      },
      size: {
        type: String,
        enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], // Specific clothing sizes
        required: true  // Made required for clothing items
      },
      img: {
        type: String,
        required: true,
        trim: true    // URL or path to item image
      }
    }
  ],

  // Total cost of the order
  total: {
    type: Number,
    required: true,
    min: 0,
    // Could be calculated from items in a pre-save hook
  },

  // Customer information for delivery
  customerInfo: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'] // Basic email validation
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{10}$/, 'Please enter a valid 10-digit mobile number'] // Example validation
    }
  },

  // Delivery information
  deliveryInfo: {
    address: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{5}$/, 'Please enter a valid 5-digit postal code'] // Example validation
    }
  },

  // Payment method selection
  paymentMethod: {
    type: String,
    enum: ["Cash", "Card"],
    required: true
  },

  // Card information (only populated if paymentMethod is "Card")
  cardInfo: {
    cardNumber: {
      type: String,
      required: function() { return this.paymentMethod === "Card"; },
      trim: true
    },
    expiryDate: {
      type: String,
      required: function() { return this.paymentMethod === "Card"; },
      match: [/^(0[1-9]|1[0-2])\/\d{2}$/, 'Use MM/YY format'] // Example MM/YY format
    },
    cvv: {
      type: String,
      required: function() { return this.paymentMethod === "Card"; },
      match: [/^\d{3,4}$/, 'CVV must be 3 or 4 digits']
    }
  },

  // Unique order identifier
  orderId: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    } // Auto-generated unique ID
  },

  // Order creation timestamp
  createdAt: {
    type: Date,
    default: Date.now
  },

  // Order status tracking
  status: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
    default: "pending"
  }
}, {
  // Enable automatic timestamps
  timestamps: true
});

// Pre-save hook to calculate total if needed
orderSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }
  next();
});

// Create and export the Order model
const Order = mongoose.model("Order", orderSchema);
export default Order;