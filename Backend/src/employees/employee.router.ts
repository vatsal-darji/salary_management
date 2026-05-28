import { Router, Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { EmployeeService } from "./employee.service";
import { asyncRoute } from "../utils/asyncRoute";
import { parseFilters } from "../utils/parseFilters";

const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

const createRules = [
  body("fullName").notEmpty().withMessage("fullName is required"),
  body("jobTitle").notEmpty().withMessage("jobTitle is required"),
  body("country").notEmpty().withMessage("country is required"),
  body("department").notEmpty().withMessage("department is required"),
  body("email").isEmail().withMessage("valid email is required"),
  body("hireDate").isISO8601().withMessage("hireDate must be a valid ISO date"),
  body("salary")
    .isFloat({ min: 0 })
    .withMessage("salary must be a non-negative number"),
];

const updateRules = [
  body("email").optional().isEmail().withMessage("email must be valid"),
  body("salary")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("salary must be non-negative"),
];

export function createEmployeeRouter(service: EmployeeService): Router {
  const router = Router();

  router.get("/", asyncRoute(async (req, res) => {
    res.json(await service.list(parseFilters(req.query)));
  }));

  router.get("/:id", asyncRoute(async (req, res) => {
    res.json(await service.getById(req.params.id));
  }));

  router.post("/", createRules, validate, asyncRoute(async (req, res) => {
    const dto = { ...req.body, hireDate: new Date(req.body.hireDate) };
    res.status(201).json(await service.create(dto));
  }));

  router.patch("/:id", updateRules, validate, asyncRoute(async (req, res) => {
    res.json(await service.update(req.params.id, req.body));
  }));

  router.delete("/:id", asyncRoute(async (req, res) => {
    await service.delete(req.params.id);
    res.status(204).send();
  }));

  return router;
}
