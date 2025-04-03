import Promotion from '../models/promotion.model.js';
import RetrievedInventory from '../models/retrievedInventory.model.js';

// Create a new promotion
export const createPromotion = async (req, res) => {
    try {
        const promotionData = req.body;
        if (!promotionData.promotionID) {
            return res.status(400).json({ success: false, message: 'promotionID is required' });
        }
        if (promotionData.applicableProducts && promotionData.applicableProducts.length > 0) {
            const products = await RetrievedInventory.find({ '_id': { $in: promotionData.applicableProducts } });
            if (products.length !== promotionData.applicableProducts.length) {
                return res.status(400).json({ success: false, message: 'Some applicableProducts do not exist in RetrievedInventory' });
            }
        }
        const newPromotion = new Promotion(promotionData);
        const savedPromotion = await newPromotion.save();
        res.status(201).json({ success: true, data: savedPromotion, message: 'Promotion created successfully' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message, message: 'Error creating promotion' });
    }
};

// Get all promotions
export const getAllPromotions = async (req, res) => {
    try {
        const promotions = await Promotion.find().populate('applicableProducts');
        res.status(200).json({ success: true, data: promotions, message: 'Promotions retrieved successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, message: 'Error retrieving promotions' });
    }
};

// Get a single promotion by promotionID
export const getPromotionById = async (req, res) => {
    try {
        const promotion = await Promotion.findOne({ promotionID: req.params.id }).populate('applicableProducts');
        if (!promotion) {
            return res.status(404).json({ success: false, message: 'Promotion not found' });
        }
        res.status(200).json({ success: true, data: promotion, message: 'Promotion retrieved successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, message: 'Error retrieving promotion' });
    }
};

// Update a promotion
export const updatePromotion = async (req, res) => {
    try {
        if (req.body.applicableProducts && req.body.applicableProducts.length > 0) {
            const products = await RetrievedInventory.find({ '_id': { $in: req.body.applicableProducts } });
            if (products.length !== req.body.applicableProducts.length) {
                return res.status(400).json({ success: false, message: 'Some applicableProducts do not exist in RetrievedInventory' });
            }
        }
        const updatedPromotion = await Promotion.findOneAndUpdate(
            { promotionID: req.params.id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedPromotion) {
            return res.status(404).json({ success: false, message: 'Promotion not found' });
        }
        res.status(200).json({ success: true, data: updatedPromotion, message: 'Promotion updated successfully' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message, message: 'Error updating promotion' });
    }
};

// Delete a promotion
export const deletePromotion = async (req, res) => {
    try {
        const deletedPromotion = await Promotion.findOneAndDelete({ promotionID: req.params.id });
        if (!deletedPromotion) {
            return res.status(404).json({ success: false, message: 'Promotion not found' });
        }
        res.status(200).json({ success: true, data: deletedPromotion, message: 'Promotion deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, message: 'Error deleting promotion' });
    }
};

// Check promotion discount application on a product
export const checkPromotionDiscount = async (req, res) => {
    try {
        const { promotionID, productID } = req.params;
        const promotion = await Promotion.findOne({ promotionID });
        if (!promotion) {
            return res.status(404).json({ success: false, message: 'Promotion not found' });
        }
        const product = await RetrievedInventory.findById(productID);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found in RetrievedInventory' });
        }
        const isApplicable = promotion.applicableProducts.some(id => id.equals(product._id)) ||
            promotion.applicableCategories.includes(product.Gender);
        if (!isApplicable) {
            return res.status(400).json({ success: false, message: 'This promotion does not apply to the specified product' });
        }
        let discountedPrice = product.unitPrice || 0;
        if (promotion.discountType === 'flat' && promotion.discountValue) {
            discountedPrice = Math.max(0, discountedPrice - promotion.discountValue);
        } else if (promotion.discountType === 'percentage' && promotion.discountPercentage) {
            discountedPrice *= (1 - promotion.discountPercentage / 100);
        }
        res.status(200).json({
            success: true,
            data: {
                originalPrice: product.unitPrice,
                discountedPrice,
                promotion: promotion.promoCode,
                product: product.ItemName
            },
            message: 'Discount calculated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, message: 'Error checking promotion discount' });
    }
};