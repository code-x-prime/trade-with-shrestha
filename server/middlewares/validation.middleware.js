import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.js";

/**
 * Middleware to validate request using express-validator
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
    }));

    throw new ApiError(400, "Validation failed", errorMessages);
  }
  
  next();
};

/**
 * Wrapper for validation rules
 */
export const validateRequest = (rules) => {
  return [rules, validate];
};





