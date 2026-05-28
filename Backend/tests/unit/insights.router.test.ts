import request from "supertest";
import express from "express";
import { createInsightsRouter } from "../../src/insights/insights.router";
import { InsightsService } from "../../src/insights/insights.service";

const mockService = {
  getByCountry: jest.fn(),
  getByDepartment: jest.fn(),
  getByJobTitle: jest.fn(),
  getSalaryDistribution: jest.fn(),
} as unknown as jest.Mocked<InsightsService>;

const app = express();
app.use(express.json());
app.use("/insights", createInsightsRouter(mockService));

const countryStats = [
  { country: "India", minSalary: 40000, maxSalary: 150000, avgSalary: 90000, employeeCount: 120 },
];
const deptStats = [
  { department: "Engineering", minSalary: 60000, maxSalary: 200000, avgSalary: 110000, employeeCount: 80 },
];
const jobStats = [
  { jobTitle: "Software Engineer", country: "India", minSalary: 70000, maxSalary: 150000, avgSalary: 95000, employeeCount: 40 },
];
const distribution = [
  { range: "60k–100k", count: 50, percentage: 41.67 },
  { range: "100k–150k", count: 70, percentage: 58.33 },
];

describe("Insights Routes", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("GET /insights/by-country", () => {
    it("returns 200 with country salary stats", async () => {
      mockService.getByCountry.mockResolvedValueOnce(countryStats);

      const res = await request(app).get("/insights/by-country");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].country).toBe("India");
    });

    it("passes department and jobTitle filters to service", async () => {
      mockService.getByCountry.mockResolvedValueOnce([]);

      await request(app).get("/insights/by-country?department=Engineering&jobTitle=Engineer");

      expect(mockService.getByCountry).toHaveBeenCalledWith(
        expect.objectContaining({ department: "Engineering", jobTitle: "Engineer" }),
      );
    });
  });

  describe("GET /insights/by-department", () => {
    it("returns 200 with department salary stats", async () => {
      mockService.getByDepartment.mockResolvedValueOnce(deptStats);

      const res = await request(app).get("/insights/by-department");

      expect(res.status).toBe(200);
      expect(res.body[0].department).toBe("Engineering");
    });

    it("passes country filter to service", async () => {
      mockService.getByDepartment.mockResolvedValueOnce([]);

      await request(app).get("/insights/by-department?country=India");

      expect(mockService.getByDepartment).toHaveBeenCalledWith(
        expect.objectContaining({ country: "India" }),
      );
    });
  });

  describe("GET /insights/by-job-title", () => {
    it("returns 200 with job title salary stats", async () => {
      mockService.getByJobTitle.mockResolvedValueOnce(jobStats);

      const res = await request(app).get("/insights/by-job-title");

      expect(res.status).toBe(200);
      expect(res.body[0].jobTitle).toBe("Software Engineer");
    });

    it("passes country and department filters to service", async () => {
      mockService.getByJobTitle.mockResolvedValueOnce([]);

      await request(app).get("/insights/by-job-title?country=India&department=Engineering");

      expect(mockService.getByJobTitle).toHaveBeenCalledWith(
        expect.objectContaining({ country: "India", department: "Engineering" }),
      );
    });
  });

  describe("GET /insights/distribution", () => {
    it("returns 200 with salary distribution", async () => {
      mockService.getSalaryDistribution.mockResolvedValueOnce(distribution);

      const res = await request(app).get("/insights/distribution");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].range).toBe("60k–100k");
    });

    it("passes country and department filters to service", async () => {
      mockService.getSalaryDistribution.mockResolvedValueOnce([]);

      await request(app).get("/insights/distribution?country=India");

      expect(mockService.getSalaryDistribution).toHaveBeenCalledWith(
        expect.objectContaining({ country: "India" }),
      );
    });
  });
});
