import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array().map((err) => ({
        field: err.type === "field" ? (err as any).path : undefined,
        message: err.msg,
      })),
    });
  }
  next();
}
