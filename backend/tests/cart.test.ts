import request from "supertest";
import app from "../src/app";
import { setupTestDb, teardownTestDb, prisma } from "./setup";
import { getCustomerToken, getAdminToken } from "./helpers";

let customerToken: string;
let productIds: { id1: number; id2: number; outOfStockId: number };

beforeAll(async () => {
  const data = await setupTestDb();
  customerToken = await getCustomerToken();
  productIds = {
    id1: data.product1.id,
    id2: data.product2.id,
    outOfStockId: data.product3.id,
  };
});

afterAll(async () => {
  await teardownTestDb();
});

// Clean cart between groups to keep tests independent
afterEach(async () => {
  const customer = await prisma.user.findUnique({
    where: { email: "customer@test.com" },
  });
  if (customer) {
    await prisma.cartItem.deleteMany({ where: { userId: customer.id } });
  }
});

describe("Cart - Get Cart", () => {
  it("should return empty cart initially", async () => {
    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.itemCount).toBe(0);
    expect(res.body.total).toBe(0);
  });

  it("should reject unauthenticated request", async () => {
    const res = await request(app).get("/api/cart");
    expect(res.status).toBe(401);
  });
});

describe("Cart - Add Items", () => {
  it("should add item to cart", async () => {
    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: productIds.id1, quantity: 2 });

    expect(res.status).toBe(201);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].productId).toBe(productIds.id1);
    expect(res.body.items[0].quantity).toBe(2);
    expect(res.body.items[0].subtotal).toBeCloseTo(199.98, 2);
    expect(res.body.itemCount).toBe(1);
  });

  it("should merge quantity when adding same product again", async () => {
    // Add product first time
    await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: productIds.id1, quantity: 2 });

    // Add same product again
    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: productIds.id1, quantity: 3 });

    expect(res.status).toBe(200); // 200 for update, not 201
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].quantity).toBe(5);
  });

  it("should reject adding non-existent product", async () => {
    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: 99999, quantity: 1 });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("not found");
  });

  it("should reject exceeding stock", async () => {
    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: productIds.id1, quantity: 999 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Insufficient stock");
  });

  it("should reject adding out-of-stock product", async () => {
    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: productIds.outOfStockId, quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Insufficient stock");
  });

  it("should validate required fields", async () => {
    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("should reject zero quantity", async () => {
    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: productIds.id1, quantity: 0 });

    expect(res.status).toBe(400);
  });

  it("should reject negative quantity", async () => {
    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: productIds.id1, quantity: -1 });

    expect(res.status).toBe(400);
  });
});

describe("Cart - Update Quantity", () => {
  let cartItemId: number;

  beforeEach(async () => {
    // Ensure clean cart with one item
    const customer = await prisma.user.findUnique({
      where: { email: "customer@test.com" },
    });
    await prisma.cartItem.deleteMany({ where: { userId: customer!.id } });

    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: productIds.id1, quantity: 2 });
    cartItemId = res.body.items[0].id;
  });

  it("should update item quantity", async () => {
    const res = await request(app)
      .put(`/api/cart/${cartItemId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ quantity: 5 });

    expect(res.status).toBe(200);
    expect(res.body.items[0].quantity).toBe(5);
  });

  it("should reject quantity exceeding stock", async () => {
    const res = await request(app)
      .put(`/api/cart/${cartItemId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ quantity: 999 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Insufficient stock");
  });

  it("should return 404 for non-existent cart item", async () => {
    const res = await request(app)
      .put("/api/cart/99999")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ quantity: 1 });

    expect(res.status).toBe(404);
  });

  it("should validate quantity field", async () => {
    const res = await request(app)
      .put(`/api/cart/${cartItemId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe("Cart - Remove Item", () => {
  let cartItemId: number;

  beforeEach(async () => {
    const customer = await prisma.user.findUnique({
      where: { email: "customer@test.com" },
    });
    await prisma.cartItem.deleteMany({ where: { userId: customer!.id } });

    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: productIds.id1, quantity: 2 });
    cartItemId = res.body.items[0].id;
  });

  it("should remove item from cart", async () => {
    const res = await request(app)
      .delete(`/api/cart/${cartItemId}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(0);
    expect(res.body.itemCount).toBe(0);
  });

  it("should return 404 for non-existent cart item", async () => {
    const res = await request(app)
      .delete("/api/cart/99999")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(404);
  });
});

describe("Cart - Clear Cart", () => {
  it("should clear all cart items", async () => {
    // Add two items
    await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: productIds.id1, quantity: 1 });
    await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: productIds.id2, quantity: 1 });

    // Clear
    const res = await request(app)
      .delete("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.itemCount).toBe(0);
    expect(res.body.total).toBe(0);
  });
});

describe("Cart - Full Operations Flow", () => {
  it("add → update → verify → remove", async () => {
    // Add item
    const addRes = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: productIds.id1, quantity: 1 });
    expect(addRes.status).toBe(201);
    const itemId = addRes.body.items[0].id;

    // Update quantity
    const updateRes = await request(app)
      .put(`/api/cart/${itemId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ quantity: 3 });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.items[0].quantity).toBe(3);
    expect(updateRes.body.items[0].subtotal).toBeCloseTo(99.99 * 3, 2);

    // Verify cart state
    const getRes = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(getRes.body.itemCount).toBe(1);
    expect(getRes.body.total).toBeCloseTo(99.99 * 3, 2);

    // Remove
    const removeRes = await request(app)
      .delete(`/api/cart/${itemId}`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(removeRes.status).toBe(200);
    expect(removeRes.body.items.length).toBe(0);
  });
});
