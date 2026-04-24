// Set test env BEFORE any imports
process.env.DATABASE_URL = "file:./test.db";
process.env.JWT_SECRET = "test-secret-key";
process.env.JWT_EXPIRES_IN = "1h";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function resetDatabase() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
}

export async function seedTestData() {
  const hashedPassword = await bcrypt.hash("password123", 10);
  const adminPassword = await bcrypt.hash("admin123", 10);

  const customer = await prisma.user.create({
    data: {
      name: "Test Customer",
      email: "customer@test.com",
      password: hashedPassword,
      role: "customer",
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: "Test Admin",
      email: "admin@test.com",
      password: adminPassword,
      role: "admin",
    },
  });

  const product1 = await prisma.product.create({
    data: {
      name: "Test Headphones",
      description: "Wireless headphones for testing",
      price: 99.99,
      imageUrl: "https://example.com/headphones.jpg",
      category: "Electronics",
      stock: 50,
    },
  });

  const product2 = await prisma.product.create({
    data: {
      name: "Test Book",
      description: "A book about testing",
      price: 19.99,
      imageUrl: "https://example.com/book.jpg",
      category: "Books",
      stock: 100,
    },
  });

  const product3 = await prisma.product.create({
    data: {
      name: "Test Shirt",
      description: "A shirt for testing",
      price: 29.99,
      imageUrl: "https://example.com/shirt.jpg",
      category: "Clothing",
      stock: 0,
    },
  });

  return { customer, admin, product1, product2, product3 };
}

export async function setupTestDb() {
  await resetDatabase();
  return seedTestData();
}

export async function teardownTestDb() {
  await resetDatabase();
  await prisma.$disconnect();
}

export { prisma };
