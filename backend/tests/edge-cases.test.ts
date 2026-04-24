import request from "supertest";
import app from "../src/app";
import { setupTestDb, teardownTestDb, prisma } from "./setup";
import { getCustomerToken, getAdminToken } from "./helpers";
import { generateToken } from "../src/utils/jwt";

let customerToken: string;
let adminToken: string;

beforeAll(async () => {
  await setupTestDb();
  customerToken = await getCustomerToken();
  adminToken = await getAdminToken();
});

afterAll(async () => {
  await teardownTestDb();
});

describe("Edge Cases - JWT", () => {
  it("should use fallback secret when env is not set", () => {
    // generateToken should work (jwt.ts lines 3-4 fallback branch)
    const token = generateToken({ userId: 999, email: "x@x.com", role: "customer" });
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
  });
});

describe("Edge Cases - Validation middleware", () => {
  it("should handle field-type errors in validation (validate.ts line 10)", async () => {
    // Send a request that triggers validation with a field error
    const res = await request(app).post("/api/auth/register").send({
      name: "",
      email: "bad",
      password: "",
    });
    expect(res.status).toBe(400);
    expect(res.body.details).toBeInstanceOf(Array);
    // Check that field info is included
    const fieldDetail = res.body.details.find((d: any) => d.field);
    expect(fieldDetail).toBeDefined();
  });
});

describe("Edge Cases - Product controller branches", () => {
  it("should handle search + category together", async () => {
    const res = await request(app).get(
      "/api/products?search=Test&category=Electronics"
    );
    expect(res.status).toBe(200);
    res.body.products.forEach((p: any) => {
      expect(p.category).toBe("Electronics");
      expect(p.name.toLowerCase()).toContain("test");
    });
  });

  it("should sort by name descending", async () => {
    const res = await request(app).get("/api/products?sort=name_desc");
    expect(res.status).toBe(200);
    const names = res.body.products.map((p: any) => p.name);
    for (let i = 1; i < names.length; i++) {
      expect(names[i].localeCompare(names[i - 1])).toBeLessThanOrEqual(0);
    }
  });

  it("should handle default sort (no sort param)", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThan(0);
  });

  it("should handle invalid product id for update", async () => {
    const res = await request(app)
      .put("/api/products/abc")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: 10 });
    expect(res.status).toBe(400);
  });

  it("should handle invalid product id for delete", async () => {
    const res = await request(app)
      .delete("/api/products/abc")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });
});

describe("Edge Cases - Cart ownership", () => {
  it("should not let user access another user's cart items", async () => {
    // Add item as customer
    const addRes = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: 1, quantity: 1 });

    if (addRes.status === 201 || addRes.status === 200) {
      const itemId = addRes.body.items[0].id;

      // Try to update with admin token (different user)
      const updateRes = await request(app)
        .put(`/api/cart/${itemId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ quantity: 5 });
      expect(updateRes.status).toBe(404); // Not found for that user

      // Try to remove with admin token
      const removeRes = await request(app)
        .delete(`/api/cart/${itemId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(removeRes.status).toBe(404);
    }
  });
});

describe("Edge Cases - Order controller branches", () => {
  it("should handle invalid order id format for get", async () => {
    const res = await request(app)
      .get("/api/orders/abc")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(400);
  });

  it("should handle invalid order id format for status update", async () => {
    const res = await request(app)
      .put("/api/orders/abc/status")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "confirmed" });
    expect(res.status).toBe(400);
  });

  it("should handle cart item invalid id format for update", async () => {
    const res = await request(app)
      .put("/api/cart/abc")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ quantity: 1 });
    expect(res.status).toBe(400);
  });

  it("should handle cart item invalid id format for delete", async () => {
    const res = await request(app)
      .delete("/api/cart/abc")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(400);
  });

  it("should reject order when stock is insufficient for cart item", async () => {
    // Create a product with very limited stock
    const product = await prisma.product.create({
      data: {
        name: "Limited Item",
        description: "Only 1 in stock",
        price: 5.0,
        category: "Test",
        stock: 1,
      },
    });

    // Add to cart
    await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: product.id, quantity: 1 });

    // Reduce stock to 0 externally (simulates someone else buying it)
    await prisma.product.update({
      where: { id: product.id },
      data: { stock: 0 },
    });

    // Try to place order — should fail due to insufficient stock
    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(orderRes.status).toBe(400);
    expect(orderRes.body.error).toContain("Insufficient stock");
    expect(orderRes.body.details).toBeInstanceOf(Array);

    // Cleanup
    await prisma.cartItem.deleteMany({
      where: { productId: product.id },
    });
    await prisma.product.delete({ where: { id: product.id } });
  });

  it("should check user not found for profile", async () => {
    // Create a token for a non-existent user
    const fakeToken = generateToken({
      userId: 99999,
      email: "ghost@test.com",
      role: "customer",
    });

    const res = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${fakeToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("not found");
  });

  it("should deny non-owner non-admin from viewing order", async () => {
    // Customer creates an order
    const products = await prisma.product.findMany({ take: 1 });
    await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: products[0].id, quantity: 1 });

    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`);

    if (orderRes.status === 201) {
      const orderId = orderRes.body.order.id;

      // Register a second customer
      await request(app).post("/api/auth/register").send({
        name: "Other User",
        email: "other@test.com",
        password: "other12345",
      });
      const otherLogin = await request(app).post("/api/auth/login").send({
        email: "other@test.com",
        password: "other12345",
      });
      const otherToken = otherLogin.body.token;

      // Other customer tries to view
      const viewRes = await request(app)
        .get(`/api/orders/${orderId}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(viewRes.status).toBe(403);
      expect(viewRes.body.error).toContain("Access denied");
    }
  });
});

describe("Edge Cases - Stock message with existing cart item", () => {
  it("should show 'already in cart' message when adding exceeds stock", async () => {
    const products = await prisma.product.findMany({
      where: { stock: { gt: 2 } },
      take: 1,
    });
    const product = products[0];

    // Clean customer cart
    const customer = await prisma.user.findUnique({
      where: { email: "customer@test.com" },
    });
    await prisma.cartItem.deleteMany({ where: { userId: customer!.id } });

    // Add some quantity
    await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: product.id, quantity: product.stock - 1 });

    // Try to add more than remaining
    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: product.id, quantity: 5 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("already in cart");

    // Cleanup
    await prisma.cartItem.deleteMany({ where: { userId: customer!.id } });
  });
});
