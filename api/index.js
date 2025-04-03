import express from 'express';
import mongoose from 'mongoose';
import promotionRoutes from './routes/promotion.routes.js';
import InventoryRoutes from './routes/inventory.routes.js';
import UserRoutes from './routes/user.route.js';
import FeedbackRoutes from './routes/feedback.routs.js';
import authRoutes from './routes/auth.routs.js';
import orderRoutes from './routes/order.routes.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors'; 
import fs from 'fs';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();

// Middleware
app.use(express.json()); 
app.use(cors({ 
 origin: 'http://localhost:5174',
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  allowedHeaders: ['Content-Type'], 
}));

// Serve static files from the root uploads directory
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir, {
  fallthrough: true, // Pass to next middleware if file not found
  index: false, // Disable directory indexing
}));

// Ensure uploads directory exists
const ensureUploadsDir = () => {
    const dirs = ['inventory', 'promotions'];
    dirs.forEach(dir => {
        const fullPath = path.join(uploadsDir, dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            console.log(`Created directory: ${fullPath}`);
        }
    });
};
ensureUploadsDir();

// Routes
app.use('/api/promotions', promotionRoutes);
app.use('/api/inventory', InventoryRoutes);
app.use('/api/users', UserRoutes);
app.use('/api/feedback', FeedbackRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

// MongoDB Connection
const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI is not defined in the .env file');
        }
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1); // Exit process with failure
    }
};

// Start server
const PORT = process.env.PORT || 3000;
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});