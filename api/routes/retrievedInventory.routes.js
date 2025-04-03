import { Router } from 'express';
import * as inventoryController from '../controllers/inventory.controller.js';

const router = Router();

// Add this route to your existing routes
router.put('/:id', inventoryController.updateRetrievedInventoryFinalPrice);

export default router;