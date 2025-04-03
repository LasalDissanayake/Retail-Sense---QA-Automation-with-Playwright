import mongoose, { Schema } from 'mongoose';

// Define a counter schema for auto-incrementing IDs
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

// Define the Inventory schema
const inventorySchema = new mongoose.Schema({
  inventoryID: {
    type: Number,
    unique: true // Primary key, ensures uniqueness
    // removed required: true since we'll auto-generate it
  },
  ItemName: {
    type: String,
    required: true,
  },
  Category: {
    type: String,
    required: true,
  },
  reorderThreshold: {
    type: Number,
    required: true // Integer for the minimum stock level before reordering
  },
  Quantity: {
    type: Number,
    required: true // Current stock quantity
  },
  Location: {
    type: String,
    required: true // Location of the item (e.g., "Warehouse A", "Aisle 5")
  },
  StockStatus: {
    type: String,
    enum: ['in-stock', 'low-stock', 'out-of-stock'], // Restricted to these values
    required: true
  },
  Brand: {
    type: String,
    required: true // Brand name (e.g., "Nike", "Levi's")
  },
  Sizes: [String],
  Colors: [String],
  Gender: {
    type: String,
    enum: ['Men', 'Women', 'Unisex'], // Target gender
    required: true
  },
  Style: {
    type: String,
    enum: ['Casual', 'Formal', 'Athletic'], // Style or design type
    required: true
  },
  SupplierName: {
    type: String,
    required: true,
  },
  SupplierContact: {
    type: String,
    required: true,
  },
  image: {
    type: String, // URL to the image or file path
    required: true
  },
  unitPrice: {
    type: Number,
    min: 0,
    default: null
  },
  // haveOffer: {
  //   type: Boolean,
  //   default: false,
  // }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Pre-save middleware to auto-increment inventoryID
inventorySchema.pre('save', async function(next) {
  const doc = this;
  
  // Only increment if it's a new document (not being updated)
  if (doc.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'inventoryID' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      
      doc.inventoryID = counter.seq;
      next();
    } catch (error) {
      return next(error);
    }
  } else {
    next();
  }
});

// Create the model
const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;