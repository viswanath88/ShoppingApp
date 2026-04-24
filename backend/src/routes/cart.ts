import { Router } from "express";
import { body } from "express-validator";
import { handleValidationErrors } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../controllers/cartController";

const router = Router();

// All cart routes require authentication
router.use(authenticate);

// GET /api/cart - Get current user's cart
router.get("/", getCart);

// POST /api/cart - Add item to cart
router.post(
  "/",
  [
    body("productId")
      .isInt({ gt: 0 })
      .withMessage("Product ID must be a positive integer."),
    body("quantity")
      .isInt({ gt: 0 })
      .withMessage("Quantity must be a positive integer."),
    handleValidationErrors,
  ],
  addToCart
);

// PUT /api/cart/:id - Update cart item quantity
router.put(
  "/:id",
  [
    body("quantity")
      .isInt({ gt: 0 })
      .withMessage("Quantity must be a positive integer."),
    handleValidationErrors,
  ],
  updateCartItem
);

// DELETE /api/cart/:id - Remove item from cart
router.delete("/:id", removeCartItem);

// DELETE /api/cart - Clear entire cart
router.delete("/", clearCart);

export default router;
