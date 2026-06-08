const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const connectDB = require("../src/models/db");
const { redisClient } = require("../src/utils/redis.util");
const User = require("../src/models/user.model");

describe("Auth Integration Tests", () => {
  beforeAll(async () => {
    // Connect to test MongoDB database
    await connectDB();
  });

  afterAll(async () => {
    // Clear test user records
    await User.deleteMany({ email: /example\.com/i });
    // Disconnect MongoDB connection
    await mongoose.connection.close();
    // Disconnect Redis client
    await redisClient.quit();
  });

  beforeEach(async () => {
    // Clean up test user records before each test for consistency
    await User.deleteMany({ email: /example\.com/i });
    // Clear Redis verification keys
    const keys = await redisClient.keys("otp:register:*@example.com");
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  });

  describe("POST /api/ping/auth/register", () => {
    it("should successfully register a user in pending status and return an OTP", async () => {
      const res = await request(app)
        .post("/api/ping/auth/register")
        .send({
          username: "testuser",
          email: "testuser@example.com",
          password: "password123",
          name: "Test User",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.email).toBe("testuser@example.com");
      
      // Verify user was saved in MongoDB with "pending" status
      const user = await User.findOne({ email: "testuser@example.com" });
      expect(user).toBeDefined();
      expect(user.status).toBe("pending");

      // Verify OTP was stored in Redis
      const otpKey = "otp:register:testuser@example.com";
      const storedOtp = await redisClient.get(otpKey);
      expect(storedOtp).toBeDefined();
      expect(storedOtp.length).toBe(6);
    });

    it("should fail to register if required fields are missing", async () => {
      const res = await request(app)
        .post("/api/ping/auth/register")
        .send({
          username: "testuser",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Username, email, and password are required");
    });

    it("should fail to register if email is already registered", async () => {
      // Create a user first
      await User.create({
        username: "existinguser",
        email: "existing@example.com",
        password: "password123",
        name: "Existing",
      });

      const res = await request(app)
        .post("/api/ping/auth/register")
        .send({
          username: "existinguser",
          email: "existing@example.com",
          password: "password123",
          name: "Existing Two",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Username or email is already registered");
    });
  });

  describe("POST /api/ping/auth/verify-otp", () => {
    it("should verify OTP, activate user status, and return JWT + session cookie", async () => {
      // 1. Register a user
      await request(app)
        .post("/api/ping/auth/register")
        .send({
          username: "testverify",
          email: "testverify@example.com",
          password: "password123",
          name: "Test Verify",
        });

      // 2. Fetch OTP from Redis
      const otpKey = "otp:register:testverify@example.com";
      const otp = await redisClient.get(otpKey);

      // 3. Verify OTP
      const res = await request(app)
        .post("/api/ping/auth/verify-otp")
        .send({
          email: "testverify@example.com",
          otp: otp,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      
      // Verify Cookie was set
      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain("swt_session=");

      // Verify User status updated to "active" in MongoDB
      const user = await User.findOne({ email: "testverify@example.com" });
      expect(user.status).toBe("active");

      // Verify Redis key was deleted
      const deletedOtp = await redisClient.get(otpKey);
      expect(deletedOtp).toBeNull();
    });

    it("should fail to verify with an incorrect OTP", async () => {
      await request(app)
        .post("/api/ping/auth/register")
        .send({
          username: "testverify",
          email: "testverify@example.com",
          password: "password123",
          name: "Test Verify",
        });

      const res = await request(app)
        .post("/api/ping/auth/verify-otp")
        .send({
          email: "testverify@example.com",
          otp: "000000",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Invalid OTP code");
    });

    it("should fail to verify with an expired/nonexistent OTP", async () => {
      const res = await request(app)
        .post("/api/ping/auth/verify-otp")
        .send({
          email: "nonexistent@example.com",
          otp: "123456",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("OTP has expired or is invalid");
    });
  });

  describe("POST /api/ping/auth/resend-otp", () => {
    it("should resend a new OTP to a pending user and refresh expiry", async () => {
      await request(app)
        .post("/api/ping/auth/register")
        .send({
          username: "testresend",
          email: "testresend@example.com",
          password: "password123",
          name: "Test Resend",
        });

      const firstOtp = await redisClient.get("otp:register:testresend@example.com");

      const res = await request(app)
        .post("/api/ping/auth/resend-otp")
        .send({
          email: "testresend@example.com",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const secondOtp = await redisClient.get("otp:register:testresend@example.com");
      expect(secondOtp).toBeDefined();
      expect(secondOtp.length).toBe(6);
      expect(secondOtp).not.toBe(firstOtp);
    });

    it("should fail if user is already active", async () => {
      await User.create({
        username: "activeuser",
        email: "active@example.com",
        password: "password123",
        name: "Active",
        status: "active",
      });

      const res = await request(app)
        .post("/api/ping/auth/resend-otp")
        .send({
          email: "active@example.com",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Account is not in pending state");
    });
  });

  describe("POST /api/ping/auth/login", () => {
    it("should login successfully for an active user", async () => {
      await User.create({
        username: "testlogin",
        email: "testlogin@example.com",
        password: "password123",
        name: "Test Login",
        status: "active",
      });

      const res = await request(app)
        .post("/api/ping/auth/login")
        .send({
          email: "testlogin@example.com",
          password: "password123",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("should fail login with invalid password", async () => {
      await User.create({
        username: "testlogin",
        email: "testlogin@example.com",
        password: "password123",
        name: "Test Login",
        status: "active",
      });

      const res = await request(app)
        .post("/api/ping/auth/login")
        .send({
          email: "testlogin@example.com",
          password: "wrongpassword",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Invalid email/username or password");
    });

    it("should block login for pending user and send a new OTP", async () => {
      await User.create({
        username: "testpending",
        email: "testpending@example.com",
        password: "password123",
        name: "Test Pending",
        status: "pending",
      });

      const res = await request(app)
        .post("/api/ping/auth/login")
        .send({
          email: "testpending@example.com",
          password: "password123",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.pendingVerification).toBe(true);
      expect(res.body.message).toContain("Your account is pending email verification");
      
      const otpKey = "otp:register:testpending@example.com";
      const storedOtp = await redisClient.get(otpKey);
      expect(storedOtp).toBeDefined();
      expect(storedOtp.length).toBe(6);
    });

    it("should block login for suspended user", async () => {
      await User.create({
        username: "testsuspended",
        email: "testsuspended@example.com",
        password: "password123",
        name: "Test Suspended",
        status: "suspended",
      });

      const res = await request(app)
        .post("/api/ping/auth/login")
        .send({
          email: "testsuspended@example.com",
          password: "password123",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Your account is currently suspended");
    });
  });

  describe("GET /api/ping/auth/me", () => {
    it("should return user profile with correct session and token", async () => {
      await User.create({
        username: "testme",
        email: "testme@example.com",
        password: "password123",
        name: "Test Me",
        status: "active",
      });

      // Login to get token and cookie
      const loginRes = await request(app)
        .post("/api/ping/auth/login")
        .send({
          email: "testme@example.com",
          password: "password123",
        });

      const token = loginRes.body.token;
      const cookie = loginRes.headers["set-cookie"][0].split(";")[0];

      // Access /me
      const res = await request(app)
        .get("/api/ping/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.username).toBe("testme");
    });

    it("should reject with 401 if cookie is missing", async () => {
      await User.create({
        username: "testme",
        email: "testme@example.com",
        password: "password123",
        name: "Test Me",
        status: "active",
      });

      const loginRes = await request(app)
        .post("/api/ping/auth/login")
        .send({
          email: "testme@example.com",
          password: "password123",
        });

      const token = loginRes.body.token;

      const res = await request(app)
        .get("/api/ping/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Session cookie missing");
    });

    it("should reject with 401 if Bearer token is missing", async () => {
      await User.create({
        username: "testme",
        email: "testme@example.com",
        password: "password123",
        name: "Test Me",
        status: "active",
      });

      const loginRes = await request(app)
        .post("/api/ping/auth/login")
        .send({
          email: "testme@example.com",
          password: "password123",
        });

      const cookie = loginRes.headers["set-cookie"][0].split(";")[0];

      const res = await request(app)
        .get("/api/ping/auth/me")
        .set("Cookie", cookie);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Access denied. No token provided");
    });

    it("should reject with 401 if Bearer token user does not match the session cookie user (session theft/hijacking)", async () => {
      // Create User A
      await User.create({
        username: "usera",
        email: "usera@example.com",
        password: "password123",
        name: "User A",
        status: "active",
      });

      // Create User B
      await User.create({
        username: "userb",
        email: "userb@example.com",
        password: "password123",
        name: "User B",
        status: "active",
      });

      // Login User A -> Get Token A
      const loginA = await request(app)
        .post("/api/ping/auth/login")
        .send({
          email: "usera@example.com",
          password: "password123",
        });
      const tokenA = loginA.body.token;

      // Login User B -> Get Session ID B (cookie)
      const loginB = await request(app)
        .post("/api/ping/auth/login")
        .send({
          email: "userb@example.com",
          password: "password123",
        });
      const cookieB = loginB.headers["set-cookie"][0].split(";")[0];

      // Request /me using Token A (User A) but Cookie B (User B)
      const res = await request(app)
        .get("/api/ping/auth/me")
        .set("Authorization", `Bearer ${tokenA}`)
        .set("Cookie", cookieB);

      // Verify rejection due to mismatch
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("User mismatch");
    });
  });
});
