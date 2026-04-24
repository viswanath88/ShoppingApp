import { Request, Response } from "express";
import prisma from "../prisma";

export async function listProducts(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const search = (req.query.search as string)?.trim();
    const category = (req.query.category as string)?.trim();
    const sort = req.query.sort as string;

    // Build where clause
    const where: any = {};
    if (search) {
      where.name = { contains: search };
    }
    if (category) {
      where.category = category;
    }

    // Build orderBy
    let orderBy: any = { createdAt: "desc" };
    switch (sort) {
      case "price_asc":
        orderBy = { price: "asc" };
        break;
      case "price_desc":
        orderBy = { price: "desc" };
        break;
      case "name_asc":
        orderBy = { name: "asc" };
        break;
      case "name_desc":
        orderBy = { name: "desc" };
        break;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy, skip, take: limit }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products." });
  }
}

export async function getProduct(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid product ID." });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch product." });
  }
}

export async function createProduct(req: Request, res: Response) {
  try {
    const { name, description, price, imageUrl, category, stock } = req.body;

    const product = await prisma.product.create({
      data: { name, description, price, imageUrl, category, stock },
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: "Failed to create product." });
  }
}

export async function updateProduct(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid product ID." });
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Product not found." });
    }

    const { name, description, price, imageUrl, category, stock } = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(category !== undefined && { category }),
        ...(stock !== undefined && { stock }),
      },
    });

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Failed to update product." });
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid product ID." });
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Product not found." });
    }

    await prisma.product.delete({ where: { id } });

    res.json({ message: "Product deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete product." });
  }
}
