import { Request, Response } from "express";
import prisma from "../prisma";

function formatCart(items: any[]) {
  const cartItems = items.map((item) => ({
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    product: {
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      imageUrl: item.product.imageUrl,
      category: item.product.category,
      stock: item.product.stock,
    },
    subtotal: parseFloat((item.product.price * item.quantity).toFixed(2)),
  }));

  const total = parseFloat(
    cartItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)
  );

  return { items: cartItems, itemCount: cartItems.length, total };
}

export async function getCart(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;

    const items = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { id: "asc" },
    });

    res.json(formatCart(items));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cart." });
  }
}

export async function addToCart(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { productId, quantity } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    const newQuantity = existingItem
      ? existingItem.quantity + quantity
      : quantity;

    if (newQuantity > product.stock) {
      return res.status(400).json({
        error: `Insufficient stock. Only ${product.stock} available${existingItem ? ` (${existingItem.quantity} already in cart)` : ""}.`,
      });
    }

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: { userId, productId, quantity },
      });
    }

    const items = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { id: "asc" },
    });

    res.status(existingItem ? 200 : 201).json(formatCart(items));
  } catch (error) {
    res.status(500).json({ error: "Failed to add item to cart." });
  }
}

export async function updateCartItem(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const itemId = parseInt(req.params.id as string);
    const { quantity } = req.body;

    if (isNaN(itemId)) {
      return res.status(400).json({ error: "Invalid cart item ID." });
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, userId },
      include: { product: true },
    });

    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found." });
    }

    if (quantity > cartItem.product.stock) {
      return res.status(400).json({
        error: `Insufficient stock. Only ${cartItem.product.stock} available.`,
      });
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    const items = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { id: "asc" },
    });

    res.json(formatCart(items));
  } catch (error) {
    res.status(500).json({ error: "Failed to update cart item." });
  }
}

export async function removeCartItem(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const itemId = parseInt(req.params.id as string);

    if (isNaN(itemId)) {
      return res.status(400).json({ error: "Invalid cart item ID." });
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, userId },
    });

    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found." });
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    const items = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { id: "asc" },
    });

    res.json(formatCart(items));
  } catch (error) {
    res.status(500).json({ error: "Failed to remove cart item." });
  }
}

export async function clearCart(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;

    await prisma.cartItem.deleteMany({ where: { userId } });

    res.json({ items: [], itemCount: 0, total: 0, message: "Cart cleared." });
  } catch (error) {
    res.status(500).json({ error: "Failed to clear cart." });
  }
}
