import { Request, Response } from "express";
import prisma from "../prisma";

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const [totalProducts, totalOrders, totalCustomers, revenueResult] =
      await Promise.all([
        prisma.product.count(),
        prisma.order.count(),
        prisma.user.count({ where: { role: "customer" } }),
        prisma.order.aggregate({ _sum: { totalAmount: true } }),
      ]);

    res.json({
      totalProducts,
      totalOrders,
      totalRevenue: revenueResult._sum.totalAmount ?? 0,
      totalCustomers,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch dashboard stats." });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: {
            include: { product: { select: { name: true, imageUrl: true } } },
          },
        },
      }),
      prisma.order.count(),
    ]);

    const formatted = orders.map((order) => ({
      id: order.id,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
      user: order.user,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productImage: item.product.imageUrl,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      })),
    }));

    res.json({
      orders: formatted,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders." });
  }
};
