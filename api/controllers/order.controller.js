import Order from "../models/order.model.js";
import { v4 as uuidv4 } from "uuid";

export const createOrder = async (req, res) => {
  try {
    const { userId, items, total, customerInfo, deliveryInfo, paymentMethod, cardInfo } = req.body;

    if (!userId || !items || !total || !customerInfo || !deliveryInfo || !paymentMethod) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items array cannot be empty" });
    }
    if (paymentMethod === "Card" && (!cardInfo || !cardInfo.cardNumber)) {
      return res.status(400).json({ message: "Card information is required" });
    }

    const orderId = `ORD-${uuidv4().slice(0, 6).toUpperCase()}`;
    const newOrder = new Order({
      userId,
      items,
      total,
      customerInfo,
      deliveryInfo,
      paymentMethod,
      cardInfo: paymentMethod === "Card" ? cardInfo : undefined,
      orderId,
    });

    const savedOrder = await newOrder.save();
    res.status(201).json({ message: "Order created successfully", orderId: savedOrder.orderId });
  } catch (error) {
    res.status(500).json({ message: "Server error creating order" });
  }
};

export const OrderByUser = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId });
    if (!orders.length) return res.status(404).json({ message: "No orders found" });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching orders" });
  }
};

export const AllOrder = async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching all orders" });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting order" });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "processing", "shipped", "delivered", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const order = await Order.findOneAndUpdate(
      { orderId: req.params.orderId },
      { status },
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error updating status" });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const updates = req.body;
    delete updates.orderId; // Prevent orderId modification
    const order = await Order.findOneAndUpdate(
      { orderId: req.params.orderId },
      updates,
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error updating order" });
  }
};