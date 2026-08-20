import { NextFunction, Request, Response } from 'express';
import { AnyZodObject } from 'zod';

export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.parse({ body: req.body, query: req.query, params: req.params });
    if (result.body) req.body = result.body;
    next();
  };
}
