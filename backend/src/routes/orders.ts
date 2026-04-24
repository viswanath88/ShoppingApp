import { Router } from "express";
import { body } from "express-validator";
import { handleValidationErrors } from "../middleware/validate";
import { authenticate, authorizeAdmin } from "../middleware/auth";
import {
  placeOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
} from "../controllers/orderController";

const router = Router();

// All order routes require authentication
router.use(authenticate);

// POST /api/orders - Place order from cart
router.post("/", placeOrder);

// GET /api/orders - Get user's order history
router.get("/", getOrders);

// GET /api/orders/:id - Get specific order
router.get("/:id", getOrder);

// PUT /api/orders/:id/status - Update status (admin only)
router.put(
  "/:id/status",
  authorizeAdmin,
  [
    body("status")
      .isIn(["pending", "confirmed", "shipped", "delivered"])
      .withMessage("Status must be one of: pending, confirmed, shipped, delivered."),
    handleValidationErrors,
  ],
  updateOrderStatus
);

export default router;
