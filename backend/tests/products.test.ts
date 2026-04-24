import request from "supertest";
import app from "../src/app";
import { setupTestDb, teardownTestDb } from "./setup";
import { getCustomerToken, getAdminToken } from "./helpers";

let adminToken: string;
let customerToken: string;

beforeAll(async () => {
  await setupTestDb();
  adminToken = await getAdminToken();
  customerToken = await getCustomerToken();
});

afterAll(async () => {
  await teardownTestDb();
});

describe("GET /api/health", () => {
  it("should return status ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("Products - List", () => {
  it("should return paginated products", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body.products).toBeInstanceOf(Array);
    expect(res.body.products.length).toBeGreaterThan(0);
    expect(res.body.pagination).toMatchObject({
      page: 1,
      total: expect.any(Number),
      totalPages: expect.any(Number),
    });
  });

  it("should respect limit parameter", async () => {
    const res = await request(app).get("/api/products?limit=1");
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(1);
  });

  it("should paginate correctly", async () => {
    const res = await request(app).get("/api/products?page=1&limit=2");
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeLessThanOrEqual(2);
    expect(res.body.pagination.page).toBe(1);
  });

  it("should filter by category", async () => {
    const res = await request(app).get("/api/products?category=Electronics");
    expect(res.status).toBe(200);
    res.body.products.forEach((p: any) => {
      expect(p.category).toBe("Electronics");
    });
  });

  it("should search by name", async () => {
    const res = await request(app).get("/api/products?search=Headphones");
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThan(0);
    res.body.products.forEach((p: any) => {
      expect(p.name.toLowerCase()).toContain("headphones");
    });
  });

  it("should sort by price ascending", async () => {
    const res = await request(app).get("/api/products?sort=price_asc");
    expect(res.status).toBe(200);
    const prices = res.body.products.map((p: any) => p.price);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  it("should sort by price descending", async () => {
    const res = await request(app).get("/api/products?sort=price_desc");
    expect(res.status).toBe(200);
    const prices = res.body.products.map((p: any) => p.price);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
    }
  });

  it("should sort by name ascending", async () => {
    const res = await request(app).get("/api/products?sort=name_asc");
    expect(res.status).toBe(200);
    const names = res.body.products.map((p: any) => p.name);
    for (let i = 1; i < names.length; i++) {
      expect(names[i].localeCompare(names[i - 1])).toBeGreaterThanOrEqual(0);
    }
  });

  it("should return empty for non-matching search", async () => {
    const res = await request(app).get("/api/products?search=xyznonexistent");
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(0);
    expect(res.body.pagination.total).toBe(0);
  });

  it("should reject invalid sort value", async () => {
    const res = await request(app).get("/api/products?sort=invalid");
    expect(res.status).toBe(400);
  });
});

describe("Products - Get Single", () => {
  it("should return a single product by id", async () => {
    // First get list to find an id
    const listRes = await request(app).get("/api/products?limit=1");
    const productId = listRes.body.products[0].id;

    const res = await request(app).get(`/api/products/${productId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(productId);
    expect(res.body.name).toBeDefined();
    expect(res.body.price).toBeDefined();
  });

  it("should return 404 for non-existent product", async () => {
    const res = await request(app).get("/api/products/99999");
    expect(res.status).toBe(404);
    expect(res.body.error).toContain("not found");
  });

  it("should return 400 for invalid id", async () => {
    const res = await request(app).get("/api/products/abc");
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Invalid");
  });
});

describe("Products - CRUD (Admin)", () => {
  let createdProductId: number;

  it("should create a product as admin", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "New Test Product",
        description: "A product created in tests",
        price: 49.99,
        imageUrl: "https://example.com/new.jpg",
        category: "Electronics",
        stock: 25,
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("New Test Product");
    expect(res.body.price).toBe(49.99);
    expect(res.body.stock).toBe(25);
    createdProductId = res.body.id;
  });

  it("should update a product as admin", async () => {
    const res = await request(app)
      .put(`/api/products/${createdProductId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: 39.99, stock: 30 });

    expect(res.status).toBe(200);
    expect(res.body.price).toBe(39.99);
    expect(res.body.stock).toBe(30);
    // Name should remain unchanged
    expect(res.body.name).toBe("New Test Product");
  });

  it("should delete a product as admin", async () => {
    const res = await request(app)
      .delete(`/api/products/${createdProductId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("deleted");

    // Verify it's gone
    const getRes = await request(app).get(`/api/products/${createdProductId}`);
    expect(getRes.status).toBe(404);
  });

  it("should reject create without auth", async () => {
    const res = await request(app).post("/api/products").send({
      name: "No Auth",
      description: "desc",
      price: 10,
      category: "Books",
      stock: 5,
    });

    expect(res.status).toBe(401);
  });

  it("should reject create by customer (non-admin)", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        name: "Customer Product",
        description: "desc",
        price: 10,
        category: "Books",
        stock: 5,
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain("Admin");
  });

  it("should validate create product fields", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  it("should reject negative price", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Bad Product",
        description: "desc",
        price: -10,
        category: "Books",
        stock: 5,
      });

    expect(res.status).toBe(400);
  });

  it("should return 404 when updating non-existent product", async () => {
    const res = await request(app)
      .put("/api/products/99999")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: 10 });

    expect(res.status).toBe(404);
  });

  it("should return 404 when deleting non-existent product", async () => {
    const res = await request(app)
      .delete("/api/products/99999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});
