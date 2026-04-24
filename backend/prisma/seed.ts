import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // Create users with hashed passwords
  const adminPassword = await bcrypt.hash("admin123", 10);
  const customerPassword = await bcrypt.hash("customer123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@shopapp.com",
      password: adminPassword,
      role: "admin",
    },
  });

  const customer = await prisma.user.create({
    data: {
      name: "Jane Smith",
      email: "jane@example.com",
      password: customerPassword,
      role: "customer",
    },
  });

  // Create 15 products across 4 categories
  await prisma.product.createMany({
    data: [
      // Electronics (4 products)
      {
        name: "Wireless Noise-Cancelling Headphones",
        description:
          "Premium over-ear headphones with active noise cancellation, 30-hour battery life, and hi-res audio support.",
        price: 249.99,
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
        category: "Electronics",
        stock: 45,
      },
      {
        name: '4K Ultra HD Smart TV 55"',
        description:
          "55-inch 4K UHD Smart TV with HDR10+, Dolby Vision, built-in streaming apps, and voice control.",
        price: 599.99,
        imageUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop",
        category: "Electronics",
        stock: 20,
      },
      {
        name: "Bluetooth Portable Speaker",
        description:
          "Waterproof portable speaker with 360-degree sound, 12-hour playtime, and USB-C charging.",
        price: 79.99,
        imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop",
        category: "Electronics",
        stock: 100,
      },
      {
        name: "Mechanical Gaming Keyboard",
        description:
          "RGB backlit mechanical keyboard with Cherry MX Red switches, programmable macros, and aluminum frame.",
        price: 149.99,
        imageUrl: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=400&fit=crop",
        category: "Electronics",
        stock: 60,
      },

      // Clothing (4 products)
      {
        name: "Classic Fit Cotton Polo Shirt",
        description:
          "Breathable 100% cotton polo shirt with ribbed collar and two-button placket. Available in multiple colors.",
        price: 34.99,
        imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
        category: "Clothing",
        stock: 200,
      },
      {
        name: "Slim Fit Stretch Denim Jeans",
        description:
          "Modern slim-fit jeans with 2% elastane for comfort stretch. Dark indigo wash with classic 5-pocket design.",
        price: 59.99,
        imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop",
        category: "Clothing",
        stock: 150,
      },
      {
        name: "Lightweight Running Shoes",
        description:
          "Engineered mesh upper with responsive foam cushioning. Ideal for daily training and long-distance runs.",
        price: 89.99,
        imageUrl: "https://images.unsplash.com/photo-1560243563-062bfc001d68?w=400&h=400&fit=crop",
        category: "Clothing",
        stock: 80,
      },
      {
        name: "Wool Blend Winter Coat",
        description:
          "Double-breasted wool blend overcoat with satin lining, notch lapels, and interior pockets.",
        price: 199.99,
        imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=400&fit=crop",
        category: "Clothing",
        stock: 35,
      },

      // Books (4 products)
      {
        name: "The Pragmatic Programmer",
        description:
          "Classic software development book covering topics from personal responsibility and career development to architectural techniques. 20th Anniversary Edition.",
        price: 44.99,
        imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop",
        category: "Books",
        stock: 120,
      },
      {
        name: "Atomic Habits",
        description:
          "Proven framework for improving every day. Learn how tiny changes in behavior can lead to remarkable results in your life.",
        price: 16.99,
        imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop",
        category: "Books",
        stock: 250,
      },
      {
        name: "Dune: Deluxe Edition",
        description:
          "Frank Herbert's epic science fiction masterpiece in a beautiful hardcover collector's edition with gilded edges.",
        price: 29.99,
        imageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=400&fit=crop",
        category: "Books",
        stock: 70,
      },
      {
        name: "Designing Data-Intensive Applications",
        description:
          "Deep dive into the internals of modern data systems. Covers replication, partitioning, transactions, and distributed systems.",
        price: 39.99,
        imageUrl: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=400&fit=crop",
        category: "Books",
        stock: 90,
      },

      // Home & Kitchen (3 products)
      {
        name: "Stainless Steel French Press",
        description:
          "Double-wall insulated French press coffee maker. Brews 34oz of rich, full-bodied coffee. Dishwasher safe.",
        price: 29.99,
        imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop",
        category: "Home & Kitchen",
        stock: 130,
      },
      {
        name: "Non-Stick Cookware Set (10-Piece)",
        description:
          "Complete kitchen cookware set with ceramic non-stick coating. Includes frying pans, saucepans, stockpot, and lids.",
        price: 119.99,
        imageUrl: "https://images.unsplash.com/photo-1583845112239-97ef1341b271?w=400&h=400&fit=crop",
        category: "Home & Kitchen",
        stock: 40,
      },
      {
        name: "Memory Foam Throw Pillow Set",
        description:
          "Set of 2 premium memory foam throw pillows with removable velvet covers. Perfect for couch or bed.",
        price: 39.99,
        imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=400&fit=crop",
        category: "Home & Kitchen",
        stock: 175,
      },
    ],
  });

  console.log("Seed data created successfully:");
  console.log(`  - 2 users (admin: ${admin.email}, customer: ${customer.email})`);
  console.log("  - 15 products across 4 categories");
  console.log("  Passwords: admin123, customer123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
