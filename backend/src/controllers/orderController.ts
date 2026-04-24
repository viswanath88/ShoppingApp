import { Request, Response } from "express";
import prisma from "../prisma";

export async function placeOrder(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Your cart is empty." });
    }

    // Validate stock for all items
    const stockErrors: string[] = [];
    for (const item of cartItems) {
      if (item.quantity > item.product.stock) {
        stockErrors.push(
          `"${item.product.name}" has only ${item.product.stock} in stock (requested ${item.quantity}).`
        );
      }
    }
    if (stockErrors.length > 0) {
      return res.status(400).json({
        error: "Insufficient stock for some items.",
        details: stockErrors,
      });
    }

    const totalAmount = parseFloat(
      cartItems
        .reduce((sum, item) => sum + item.product.price * item.quantity, 0)
        .toFixed(2)
    );

    // Use transaction: create order, create items, reduce stock, clear cart
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          status: "pending",
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
        },
      });

      // Reduce stock for each product
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Clear the user's cart
      await tx.cartItem.deleteMany({ where: { userId } });

      return newOrder;
    });

    const response = {
      message: "Order placed successfully.",
      order: {
        id: order.id,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: parseFloat((item.price * item.quantity).toFixed(2)),
        })),
      },
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ error: "Failed to place order." });
  }
}

export async function getOrders(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = orders.map((order) => ({
      id: order.id,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: parseFloat((item.price * item.quantity).toFixed(2)),
      })),
    }));

    res.json({ orders: formatted });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders." });
  }
}

export async function getOrder(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const orderId = parseInt(req.params.id as string);

    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order ID." });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    // Only owner or admin can view
    if (order.userId !== userId && role !== "admin") {
      return res.status(403).json({ error: "Access denied." });
    }

    res.json({
      id: order.id,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
      user: order.user,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: parseFloat((item.price * item.quantity).toFixed(2)),
      })),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch order." });
  }
}

const VALID_STATUSES = ["pending", "confirmed", "shipped", "delivered"];

export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const orderId = parseInt(req.params.id as string);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order ID." });
    }

    const { status } = req.body;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    const currentIdx = VALID_STATUSES.indexOf(order.status);
    const newIdx = VALID_STATUSES.indexOf(status);

    if (newIdx <= currentIdx) {
      return res.status(400).json({
        error: `Cannot change status from "${order.status}" to "${status}". Status can only move forward.`,
      });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({
      message: `Order status updated to "${status}".`,
      order: {
        id: updated.id,
        totalAmount: updated.totalAmount,
        status: updated.status,
        createdAt: updated.createdAt,
        user: updated.user,
        items: updated.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: parseFloat((item.price * item.quantity).toFixed(2)),
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update order status." });
  }
}
