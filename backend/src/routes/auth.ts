import { Router } from "express";
import { body } from "express-validator";
import { handleValidationErrors } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { register, login, getProfile } from "../controllers/authController";

const router = Router();

// POST /api/auth/register
router.post(
  "/register",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required.")
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters."),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required.")
      .isEmail()
      .withMessage("Please provide a valid email address.")
      .normalizeEmail(),
    body("password")
      .notEmpty()
      .withMessage("Password is required.")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long."),
    handleValidationErrors,
  ],
  register
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required.")
      .isEmail()
      .withMessage("Please provide a valid email address.")
      .normalizeEmail(),
    body("password")
      .notEmpty()
      .withMessage("Password is required."),
    handleValidationErrors,
  ],
  login
);

// GET /api/auth/profile (protected)
router.get("/profile", authenticate, getProfile);

export default router;
