import { Router } from "express";
import { authenticate, authorizeAdmin } from "../middleware/auth";
import { getDashboardStats, getAllOrders } from "../controllers/adminController";

const router = Router();

router.use(authenticate, authorizeAdmin);

// GET /api/admin/stats
router.get("/stats", getDashboardStats);

// GET /api/admin/orders
router.get("/orders", getAllOrders);

export default router;
