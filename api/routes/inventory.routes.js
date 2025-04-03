import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
    createInventory,
    sendToStore,
    getAllInventory,
    getInventoryById,
    updateInventory,
    deleteInventory,
    getInventoryByCategory,
    getLowStockItems,
    updateStockStatus,
    getRetrievedInventory,
    deleteRetrievedInventory,
    updateRetrievedInventoryFinalPrice
} from '../controllers/inventory.controller.js';

const router = express.Router();

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
const inventoryUploadsDir = path.join(uploadsDir, 'inventory');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(inventoryUploadsDir)) {
    fs.mkdirSync(inventoryUploadsDir);
}

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, inventoryUploadsDir);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now();
        cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, ''));
    }
});

// File filter to only accept images
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    return cb(null, false);
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5MB limit
    }
});

// Additional routes - these need to be BEFORE the /:id route to avoid conflicts
router.get('/category/:category', getInventoryByCategory);
router.get('/status/low-stock', getLowStockItems);

// Basic routes
router.get('/', getAllInventory);
router.get('/:id', getInventoryById);
router.post('/', upload.single('image'), createInventory);
router.put('/:id', upload.single('image'), updateInventory);
router.delete('/:id', deleteInventory);
router.post('/send-to-store/:id', sendToStore);

// Stock status update route - updated to handle both add and retrieve
router.put('/:inventoryID/stock-status', updateStockStatus);

// Retrieved inventory routes
router.get('/retrieved/all', getRetrievedInventory);
router.delete('/retrieved/:id', deleteRetrievedInventory);
router.put('/retrieved/:id', updateRetrievedInventoryFinalPrice);

export default router;