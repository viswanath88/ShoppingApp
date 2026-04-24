import request from "supertest";
import app from "../src/app";

/**
 * Register a user and return the response body (includes token).
 */
export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  const res = await request(app)
    .post("/api/auth/register")
    .send(data);
  return res;
}

/**
 * Login and return the response body (includes token).
 */
export async function loginUser(email: string, password: string) {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  return res;
}

/**
 * Get an auth token for the seeded customer.
 */
export async function getCustomerToken(): Promise<string> {
  const res = await loginUser("customer@test.com", "password123");
  return res.body.token;
}

/**
 * Get an auth token for the seeded admin.
 */
export async function getAdminToken(): Promise<string> {
  const res = await loginUser("admin@test.com", "admin123");
  return res.body.token;
}
