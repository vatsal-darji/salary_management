import { Request, Response, NextFunction } from "express";
import { NotFoundError, ConflictError } from "../errors";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
  } else if (err instanceof ConflictError) {
    res.status(409).json({ error: err.message });
  } else {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error(err);
    res.status(500).json({ error: message });
  }
}
