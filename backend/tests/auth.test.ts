import request from "supertest";
import app from "../src/app";
import { setupTestDb, teardownTestDb, prisma } from "./setup";
import { getCustomerToken, getAdminToken } from "./helpers";

beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

describe("Auth - Registration", () => {
  it("should register a new user successfully", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "New User",
      email: "newuser@test.com",
      password: "newpass123",
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("User registered successfully.");
    expect(res.body.user).toMatchObject({
      name: "New User",
      email: "newuser@test.com",
      role: "customer",
    });
    expect(res.body.token).toBeDefined();
    // Password should NOT be in the response
    expect(res.body.user.password).toBeUndefined();
  });

  it("should hash the password (not store plaintext)", async () => {
    const user = await prisma.user.findUnique({
      where: { email: "newuser@test.com" },
    });
    expect(user).not.toBeNull();
    expect(user!.password).not.toBe("newpass123");
    expect(user!.password.startsWith("$2a$") || user!.password.startsWith("$2b$")).toBe(true);
  });

  it("should reject duplicate email", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Duplicate",
      email: "customer@test.com",
      password: "password123",
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain("already exists");
  });

  it("should validate required fields", async () => {
    const res = await request(app).post("/api/auth/register").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
    expect(res.body.details.length).toBeGreaterThanOrEqual(3);
  });

  it("should reject short password", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Short Pass",
      email: "short@test.com",
      password: "12345",
    });

    expect(res.status).toBe(400);
  });

  it("should reject invalid email format", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Bad Email",
      email: "not-an-email",
      password: "password123",
    });

    expect(res.status).toBe(400);
  });

  it("should reject short name", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "A",
      email: "shortname@test.com",
      password: "password123",
    });

    expect(res.status).toBe(400);
  });
});

describe("Auth - Login", () => {
  it("should login with valid credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "customer@test.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Login successful.");
    expect(res.body.user.email).toBe("customer@test.com");
    expect(res.body.token).toBeDefined();
  });

  it("should reject wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "customer@test.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain("Invalid");
  });

  it("should reject non-existent email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@test.com",
      password: "password123",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain("Invalid");
  });

  it("should validate required fields", async () => {
    const res = await request(app).post("/api/auth/login").send({});

    expect(res.status).toBe(400);
  });

  it("should validate email format", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "bad-email",
      password: "password123",
    });

    expect(res.status).toBe(400);
  });
});

describe("Auth - Profile (Protected Route)", () => {
  it("should return profile with valid token", async () => {
    const token = await getCustomerToken();
    const res = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("customer@test.com");
    expect(res.body.user._count).toBeDefined();
  });

  it("should reject request without token", async () => {
    const res = await request(app).get("/api/auth/profile");

    expect(res.status).toBe(401);
    expect(res.body.error).toContain("No token");
  });

  it("should reject invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", "Bearer invalid-token-here");

    expect(res.status).toBe(401);
    expect(res.body.error).toContain("Invalid");
  });

  it("should reject malformed authorization header", async () => {
    const res = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", "NotBearer sometoken");

    expect(res.status).toBe(401);
    expect(res.body.error).toContain("Invalid token format");
  });
});

describe("Auth - Full Flow", () => {
  it("register → login → access protected route", async () => {
    // Register
    const regRes = await request(app).post("/api/auth/register").send({
      name: "Flow User",
      email: "flow@test.com",
      password: "flow123456",
    });
    expect(regRes.status).toBe(201);

    // Login
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "flow@test.com",
      password: "flow123456",
    });
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token;

    // Access protected route
    const profileRes = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`);
    expect(profileRes.status).toBe(200);
    expect(profileRes.body.user.email).toBe("flow@test.com");
    expect(profileRes.body.user.name).toBe("Flow User");
  });
});
