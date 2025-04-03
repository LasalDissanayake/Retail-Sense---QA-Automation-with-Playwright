import Inventory from '../models/inventory.model.js';
import RetrievedInventory from '../models/retrievedInventory.model.js';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose'; // Import mongoose for ObjectId validation

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create new inventory item
export const createInventory = async (req, res) => {
    try {
        // Check if either file or image URL is provided
        if (!req.file && !req.body.image) {
            return res.status(400).json({ message: 'Image is required' });
        }

        // Handle image path
        let imagePath;
        if (req.file) {
            // For form uploads, store relative path
            imagePath = path.join('uploads', 'inventory', path.basename(req.file.path)).replace(/\\/g, '/');
        } else {
            // For direct API requests, ensure path is relative
            const absolutePath = req.body.image;
            if (absolutePath.includes('uploads/inventory')) {
                // If already in correct format, use as is
                imagePath = absolutePath;
            } else {
                // Convert absolute path to relative path
                imagePath = path.join('uploads', 'inventory', path.basename(absolutePath)).replace(/\\/g, '/');
            }
        }

        // Parse numeric fields
        const parsedData = {
            ...req.body,
            Quantity: parseInt(req.body.Quantity),
            reorderThreshold: parseInt(req.body.reorderThreshold),
            image: imagePath
        };

        // Handle arrays
        if (req.body.Sizes) {
            parsedData.Sizes = req.body.Sizes.split(',').map(size => size.trim());
        }
        if (req.body.Colors) {
            parsedData.Colors = req.body.Colors.split(',').map(color => color.trim());
        }

        const newInventory = new Inventory(parsedData);
        const savedInventory = await newInventory.save();
        res.status(201).json(savedInventory);
    } catch (error) {
        console.error('Error creating inventory:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Validation Error', 
                errors: Object.values(error.errors).map(err => err.message),
                details: `Error occurred while validating inventory data: ${error.message}`
            });
        }
        res.status(500).json({ 
            message: 'Failed to create inventory item', 
            error: error.message,
            details: `Error occurred while creating inventory item: ${error.message}`
        });
    }
};

export const sendToStore = async (req, res) => {
    try {
      const { id } = req.params;
      const { unitPrice } = req.body;
  
      if (!unitPrice || isNaN(unitPrice)) {
        return res.status(400).json({ 
            message: 'Valid unit price required', 
            details: `Invalid unit price: ${unitPrice}`
        });
      }

      const parsedUnitPrice = parseFloat(unitPrice);
      // Calculate final price (you can adjust this calculation as needed)
      const finalPrice = parsedUnitPrice;
  
      const updatedItem = await RetrievedInventory.findByIdAndUpdate(
        id,
        { 
          $set: { 
            unitPrice: parsedUnitPrice,
            finalPrice: finalPrice
          } 
        },
        { new: true }
      );
  
      if (!updatedItem) {
        return res.status(404).json({ 
            message: 'Item not found', 
            details: `No item found with ID: ${id}`
        });
      }
  
      res.json(updatedItem);
    } catch (error) {
      console.error('Error sending to store:', error);
      res.status(500).json({ 
          message: error.message, 
          details: `Error occurred while sending to store: ${error.message}`
      });
    }
  };

  
// Get all inventory items with pagination
export const getAllInventory = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const [inventoryItems, total] = await Promise.all([
            Inventory.find()
                .skip(skip)
                .limit(parseInt(limit)),
            Inventory.countDocuments()
        ]);

        res.json({
            items: inventoryItems,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error getting all inventory:', error);
        res.status(500).json({ 
            message: 'Failed to fetch inventory items', 
            error: error.message,
            details: `Error occurred while fetching inventory items: ${error.message}`
        });
    }
};

// Get inventory item by ID
export const getInventoryById = async (req, res) => {
    try {
        const { id } = req.params;
        let inventory = null;

        // First try to find by MongoDB _id
        if (mongoose.Types.ObjectId.isValid(id)) {
            inventory = await Inventory.findById(id);
        }
        
        // If not found by _id, try inventoryID
        if (!inventory) {
            const numericId = parseInt(id);
            if (!isNaN(numericId)) {
                inventory = await Inventory.findOne({ inventoryID: numericId });
            }
        }
        
        // If still not found, check retrieved inventory
        if (!inventory && mongoose.Types.ObjectId.isValid(id)) {
            inventory = await RetrievedInventory.findById(id);
        }

        if (!inventory) {
            return res.status(404).json({ 
                message: 'Inventory item not found',
                details: `No inventory found with ID: ${id}`
            });
        }

        res.json(inventory);
    } catch (error) {
        console.error('Error in getInventoryById:', error);
        res.status(500).json({ 
            message: 'Failed to fetch inventory item', 
            error: error.message,
            details: `Error occurred while fetching inventory with ID: ${req.params.id}`
        });
    }
};

// Update inventory item
export const updateInventory = async (req, res) => {
    try {
        // Handle image path if file is uploaded
        let imagePath;
        if (req.file) {
            // For form uploads, store relative path
            imagePath = path.join('uploads', 'inventory', path.basename(req.file.path)).replace(/\\/g, '/');
        } else if (req.body.image) {
            // For direct API requests, ensure path is relative
            const absolutePath = req.body.image;
            if (absolutePath.includes('uploads/inventory')) {
                // If already in correct format, use as is
                imagePath = absolutePath;
            } else {
                // Convert absolute path to relative path
                imagePath = path.join('uploads', 'inventory', path.basename(absolutePath)).replace(/\\/g, '/');
            }
        }

        const updateData = {
            ...req.body,
            ...(imagePath && { image: imagePath }),
            ...(req.body.Sizes && { 
                Sizes: Array.isArray(req.body.Sizes) ? req.body.Sizes : req.body.Sizes.split(',')
            }),
            ...(req.body.Colors && { 
                Colors: Array.isArray(req.body.Colors) ? req.body.Colors : req.body.Colors.split(',')
            })
        };

        const updatedInventory = await Inventory.findOneAndUpdate(
            { inventoryID: parseInt(req.params.id) },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedInventory) {
            return res.status(404).json({ 
                message: 'Inventory item not found',
                details: `No inventory found with ID: ${req.params.id}`
            });
        }

        res.json(updatedInventory);
    } catch (error) {
        console.error('Error updating inventory:', error);
        res.status(400).json({ 
            message: 'Failed to update inventory item', 
            error: error.message,
            details: `Error occurred while updating inventory item: ${error.message}`
        });
    }
};

// Delete inventory item
export const deleteInventory = async (req, res) => {
    try {
        const deletedInventory = await Inventory.findOneAndDelete({ 
            inventoryID: parseInt(req.params.id) 
        });
        
        if (!deletedInventory) {
            return res.status(404).json({ 
                message: 'Inventory item not found',
                details: `No inventory found with ID: ${req.params.id}`
            });
        }

        res.json({ message: 'Inventory item deleted successfully', inventoryID: deletedInventory.inventoryID });
    } catch (error) {
        console.error('Error deleting inventory:', error);
        res.status(500).json({ 
            message: 'Failed to delete inventory item', 
            error: error.message,
            details: `Error occurred while deleting inventory item: ${error.message}`
        });
    }
};

// Get inventory by category
export const getInventoryByCategory = async (req, res) => {
    try {
        const inventoryItems = await Inventory.find({ 
            Category: req.params.category 
        });
        
        if (!inventoryItems.length) {
            return res.status(404).json({ 
                message: 'No items found in this category',
                details: `No items found in category: ${req.params.category}`
            });
        }
        
        res.json(inventoryItems);
    } catch (error) {
        console.error('Error getting inventory by category:', error);
        res.status(500).json({ 
            message: 'Failed to fetch category items', 
            error: error.message,
            details: `Error occurred while fetching category items: ${error.message}`
        });
    }
};

// Get low stock items
export const getLowStockItems = async (req, res) => {
    try {
        const lowStockItems = await Inventory.find({ 
            StockStatus: 'low-stock' 
        });
        
        res.json(lowStockItems);
    } catch (error) {
        console.error('Error getting low stock items:', error);
        res.status(500).json({ 
            message: 'Failed to fetch low stock items', 
            error: error.message,
            details: `Error occurred while fetching low stock items: ${error.message}`
        });
    }
};

// Update stock status
export const updateStockStatus = async (req, res) => {
    try {
        const { inventoryID } = req.params;
        const { Quantity, action, unitPrice } = req.body;

        // Find the inventory item
        const inventoryItem = await Inventory.findOne({ inventoryID: parseInt(inventoryID) });
        if (!inventoryItem) {
            return res.status(404).json({ 
                message: 'Inventory item not found',
                details: `No inventory found with ID: ${inventoryID}`
            });
        }

        // Update quantity
        const newQuantity = parseInt(Quantity);
        if (isNaN(newQuantity) || newQuantity < 0) {
            return res.status(400).json({ 
                message: 'Invalid quantity', 
                details: `Invalid quantity: ${Quantity}`
            });
        }

        // If this is a retrieve action, save to RetrievedInventory
        if (action === 'retrieve') {
            const retrievedQuantity = inventoryItem.Quantity - newQuantity;
            const parsedUnitPrice = inventoryItem.unitPrice || null;
            // Calculate final price when unit price exists
            const finalPrice = parsedUnitPrice ? parsedUnitPrice : null;
            
            const retrievedItem = new RetrievedInventory({
                inventoryID: inventoryItem.inventoryID,
                ItemName: inventoryItem.ItemName,
                Category: inventoryItem.Category,
                retrievedQuantity,
                Brand: inventoryItem.Brand,
                Sizes: inventoryItem.Sizes || [],
                Colors: inventoryItem.Colors || [],
                Gender: inventoryItem.Gender || 'Unisex',
                Style: inventoryItem.Style,
                image: inventoryItem.image,
                unitPrice: parsedUnitPrice,
                finalPrice: finalPrice
            });

            await retrievedItem.save();
        }

        // Update stock status based on new quantity and reorder threshold
        let stockStatus = 'in-stock';
        if (newQuantity <= 0) {
            stockStatus = 'out-of-stock';
        } else if (newQuantity <= inventoryItem.reorderThreshold) {
            stockStatus = 'low-stock';
        }

        // Update the inventory item
        let updateFields = { 
            Quantity: newQuantity, 
            StockStatus: stockStatus 
        };
        
        if (action === 'add' && unitPrice) {
            const parsedUnitPrice = parseFloat(unitPrice);
            updateFields.unitPrice = parsedUnitPrice;
            // Also set the finalPrice (same as unitPrice in this case)
            updateFields.finalPrice = parsedUnitPrice;
        }
        
        const updatedInventory = await Inventory.findOneAndUpdate(
            { inventoryID: parseInt(inventoryID) },
            { $set: updateFields },
            { new: true }
        );

        res.json(updatedInventory);
    } catch (error) {
        console.error('Error updating stock status:', error);
        res.status(400).json({ 
            message: error.message, 
            details: `Error occurred while updating stock status: ${error.message}`
        });
    }
};

// Get all retrieved inventory items
export const getRetrievedInventory = async (req, res) => {
    try {
        const retrievedItems = await RetrievedInventory.find()
            .sort({ retrievedDate: -1 }); // Sort by most recent first

        res.json(retrievedItems);
    } catch (error) {
        console.error('Error getting retrieved inventory:', error);
        res.status(500).json({ 
            message: error.message, 
            details: `Error occurred while getting retrieved inventory: ${error.message}`
        });
    }
};

// Delete retrieved inventory item
export const deleteRetrievedInventory = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the retrieved item first to make sure it exists
        const retrievedItem = await RetrievedInventory.findById(id);
        if (!retrievedItem) {
            return res.status(404).json({ 
                message: 'Retrieved inventory item not found',
                details: `No retrieved inventory found with ID: ${id}`
            });
        }

        // Delete the retrieved item
        await RetrievedInventory.findByIdAndDelete(id);

        res.json({ message: 'Retrieved inventory item deleted successfully' });
    } catch (error) {
        console.error('Error deleting retrieved inventory item:', error);
        res.status(500).json({ 
            message: error.message, 
            details: `Error occurred while deleting retrieved inventory item: ${error.message}`
        });
    }
};

// Update retrieved inventory item's final price
export const updateRetrievedInventoryFinalPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { finalPrice } = req.body;
    
    console.log('Updating final price:', { id, finalPrice, body: req.body });

    if (finalPrice === undefined) {
      return res.status(400).json({ 
          message: 'Final price is required', 
          details: `Final price is required for retrieved inventory item with ID: ${id}`
      });
    }

    const parsedFinalPrice = parseFloat(finalPrice);
    if (isNaN(parsedFinalPrice)) {
      return res.status(400).json({ 
          message: 'Final price must be a valid number', 
          details: `Invalid final price: ${finalPrice}`
      });
    }
    
    // Ensure finalPrice is not negative
    const validFinalPrice = Math.max(0, parsedFinalPrice);
    
    const updatedItem = await RetrievedInventory.findByIdAndUpdate(
      id,
      { $set: { finalPrice: validFinalPrice } },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ 
          message: 'Retrieved inventory item not found',
          details: `No retrieved inventory found with ID: ${id}`
      });
    }

    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating final price:', error);
    res.status(500).json({ 
        message: error.message, 
        details: `Error occurred while updating final price: ${error.message}`
    });
  }
};