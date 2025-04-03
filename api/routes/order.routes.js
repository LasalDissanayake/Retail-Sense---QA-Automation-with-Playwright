import express from 'express';
import Order from '../models/order.model.js';

const router = express.Router();

// Create a new order
router.post('/add', async (req, res) => {
  try {
    const { userId, items, total, customerInfo, deliveryInfo, paymentMethod, cardInfo } = req.body;

    console.log('Received order data:', {
      userId,
      itemsCount: items?.length,
      total,
      paymentMethod,
      hasCustomerInfo: !!customerInfo,
      hasDeliveryInfo: !!deliveryInfo
    });

    // Basic validation
    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      console.error('Basic validation failed:', { userId, items });
      return res.status(400).json({
        success: false,
        message: 'Invalid order data: userId and items array are required',
        debug: { hasUserId: !!userId, hasItems: !!items, isArray: Array.isArray(items) }
      });
    }

    // Validate items structure
    const invalidItems = items.filter(item => {
      const missing = [];
      if (!item.itemId) missing.push('itemId');
      if (!item.quantity) missing.push('quantity');
      if (!item.price) missing.push('price');
      if (!item.title) missing.push('title');
      if (!item.size) missing.push('size');
      if (!item.img) missing.push('img');
      return missing.length > 0 ? { item, missing } : null;
    }).filter(Boolean);

    if (invalidItems.length > 0) {
      console.error('Items validation failed:', invalidItems);
      return res.status(400).json({
        success: false,
        message: 'Invalid items data: missing required fields',
        error: invalidItems.map(({ item, missing }) => 
          `Item "${item.title || 'unknown'}" is missing: ${missing.join(', ')}`
        )
      });
    }

    // Create a new order
    const order = new Order({
      userId,
      items,
      total,
      customerInfo,
      deliveryInfo,
      paymentMethod,
      cardInfo: paymentMethod === 'Card' ? cardInfo : undefined,
      status: 'pending'
    });

    // Save the order
    const savedOrder = await order.save();

    res.status(201).json({
      success: true,
      orderId: savedOrder._id,
      message: 'Order placed successfully'
    });
  } catch (error) {
    console.error('Error creating order:', {
      error: error.message,
      name: error.name,
      errors: error.errors
    });
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      console.error('Validation errors:', validationErrors);
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: validationErrors.map(err => `${err.field}: ${err.message}`)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// Get orders by user ID
router.get('/get/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
      .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
});

// Update order status
router.put('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
});

// Update order status
router.put('/update/:orderId', async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
        error: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    });
  }
});

// Delete order
router.delete('/delete/:orderId', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: error.message
    });
  }
});

export default router;
