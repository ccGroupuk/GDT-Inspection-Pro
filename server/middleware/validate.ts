// server/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Middleware to validate request data against a Zod schema.
 * It checks req.body, req.query, and req.params.
 *
 * @param schema The Zod schema to validate against.
 * @returns An Express middleware function.
 */
export const validate = (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Attempt to parse and validate all relevant parts of the request
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next(); // If validation passes, move to the next middleware/route handler
    } catch (error) {
      if (error instanceof ZodError) {
        // If it's a Zod validation error, return a 400 Bad Request with error details
        return res.status(400).json({
          message: 'Validation failed.',
          errors: error.errors.map(err => ({
            path: err.path.join('.'), // Joins path array to a string (e.g., "body.name")
            message: err.message,
          })),
        });
      }
      // For any other unexpected errors during validation
      console.error('Validation middleware error:', error);
      res.status(500).json({ message: 'Internal server error during validation.' });
    }
  };
