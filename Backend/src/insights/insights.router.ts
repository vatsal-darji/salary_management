import { Router } from "express";
import type { InsightsService } from "./insights.service";
import { asyncRoute as ar } from "../utils/asyncRoute";
import { parseFilters } from "../utils/parseFilters";

export function createInsightsRouter(service: InsightsService): Router {
  const router = Router();

  router.get("/by-country", ar(async (req, res) => {
    const { department, jobTitle } = parseFilters(req.query);
    res.json(await service.getByCountry({ department, jobTitle }));
  }));

  router.get("/by-department", ar(async (req, res) => {
    const { country, jobTitle } = parseFilters(req.query);
    res.json(await service.getByDepartment({ country, jobTitle }));
  }));

  router.get("/by-job-title", ar(async (req, res) => {
    const { country, department } = parseFilters(req.query);
    res.json(await service.getByJobTitle({ country, department }));
  }));

  router.get("/distribution", ar(async (req, res) => {
    const { country, department } = parseFilters(req.query);
    res.json(await service.getSalaryDistribution({ country, department }));
  }));

  return router;
}
