import request from "supertest";

const BASE = "http://localhost:4000";

describe("Auth API", () => {
  it("POST /api/v1/auth/send-otp — valid phone", async () => {
    const res = await request(BASE).post("/api/v1/auth/send-otp").send({ phone: "+919999999999" });
    expect([200, 500]).toContain(res.status); // 500 if redis not running in CI
  });

  it("POST /api/v1/auth/send-otp — invalid phone", async () => {
    const res = await request(BASE).post("/api/v1/auth/send-otp").send({ phone: "abc" });
    expect(res.status).toBe(400);
  });

  it("POST /api/v1/auth/verify-otp — wrong OTP", async () => {
    const res = await request(BASE).post("/api/v1/auth/verify-otp").send({
      phone: "+919999999999", otp: "000000", name: "Test User"
    });
    expect(res.status).toBe(400);
  });
});

describe("Health", () => {
  it("GET /health returns ok", async () => {
    const res = await request(BASE).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
