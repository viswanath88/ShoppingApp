import { Router } from "express";
import { body, query } from "express-validator";
import { handleValidationErrors } from "../middleware/validate";
import { authenticate, authorizeAdmin } from "../middleware/auth";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";

const router = Router();

// GET /api/products - List with pagination, search, filter, sort
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer."),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100."),
    query("sort")
      .optional()
      .isIn(["price_asc", "price_desc", "name_asc", "name_desc"])
      .withMessage("Sort must be one of: price_asc, price_desc, name_asc, name_desc."),
    handleValidationErrors,
  ],
  listProducts
);

// GET /api/products/:id - Get single product
router.get("/:id", getProduct);

// POST /api/products - Create (admin only)
router.post(
  "/",
  authenticate,
  authorizeAdmin,
  [
    body("name").trim().notEmpty().withMessage("Name is required.")
      .isLength({ max: 200 }).withMessage("Name must not exceed 200 characters."),
    body("description").trim().notEmpty().withMessage("Description is required."),
    body("price").isFloat({ gt: 0 }).withMessage("Price must be a positive number."),
    body("imageUrl").optional().trim().isURL().withMessage("Image URL must be a valid URL."),
    body("category").trim().notEmpty().withMessage("Category is required."),
    body("stock").isInt({ min: 0 }).withMessage("Stock must be a non-negative integer."),
    handleValidationErrors,
  ],
  createProduct
);

// PUT /api/products/:id - Update (admin only)
router.put(
  "/:id",
  authenticate,
  authorizeAdmin,
  [
    body("name").optional().trim().notEmpty().withMessage("Name cannot be empty.")
      .isLength({ max: 200 }).withMessage("Name must not exceed 200 characters."),
    body("description").optional().trim().notEmpty().withMessage("Description cannot be empty."),
    body("price").optional().isFloat({ gt: 0 }).withMessage("Price must be a positive number."),
    body("imageUrl").optional().trim().isURL().withMessage("Image URL must be a valid URL."),
    body("category").optional().trim().notEmpty().withMessage("Category cannot be empty."),
    body("stock").optional().isInt({ min: 0 }).withMessage("Stock must be a non-negative integer."),
    handleValidationErrors,
  ],
  updateProduct
);

// DELETE /api/products/:id - Delete (admin only)
router.delete("/:id", authenticate, authorizeAdmin, deleteProduct);

export default router;
