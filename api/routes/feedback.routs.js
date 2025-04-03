import express from 'express';
import * as feedbackController from '../controllers/feedback.controller.js';

const router = express.Router();

// Define routes
router.post('/', feedbackController.createFeedback);
router.get('/', feedbackController.getAllFeedback);
router.get('/product/:id', feedbackController.getFeedbackByProductID);
router.get('/:id', feedbackController.getFeedbackByCustomerID);
router.get('/product/:id', feedbackController.getAverageRating);
router.put('/:id', feedbackController.updateFeedback);
router.delete('/:id', feedbackController.deleteFeedback);


export default router;