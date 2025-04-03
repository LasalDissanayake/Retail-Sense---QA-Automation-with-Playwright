import express from 'express';
import * as promotionController from '../controllers/promotion.controllers.js';
const router = express.Router();

// Use the controller functions with the promotionController prefix
router.post('/', promotionController.createPromotion);
router.get('/', promotionController.getAllPromotions);
router.get('/:id', promotionController.getPromotionById);
router.put('/:id', promotionController.updatePromotion);
router.delete('/:id', promotionController.deletePromotion);
router.get('/check/:promotionID/:productID', promotionController.checkPromotionDiscount); // Fixed this line

export default router;