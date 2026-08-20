import { JwtRole } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: JwtRole;
      };
    }
  }
}

export {};
