// This file is loaded before all tests via jest setupFiles
// It must set env vars before any module (like prisma) is imported
process.env.DATABASE_URL = "file:./test.db";
process.env.JWT_SECRET = "test-secret-key";
process.env.JWT_EXPIRES_IN = "1h";
