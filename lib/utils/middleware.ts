import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export interface JWTPayload {
  userId: string;
  email: string;
  role: "BUYER" | "SUPPLIER";
  supplierId?: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function authenticate(req: NextRequest): JWTPayload | null {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : req.cookies.get("auth-token")?.value;

  if (!token) return null;
  return verifyToken(token);
}

export function requireAuth(req: NextRequest): {
  user: JWTPayload | null;
  error: Response | null;
} {
  const user = authenticate(req);
  if (!user) {
    return {
      user: null,
      error: Response.json(
        { success: false, error: "Unauthorized. Please log in." },
        { status: 401 }
      ),
    };
  }
  return { user, error: null };
}

export function requireRole(
  req: NextRequest,
  role: "BUYER" | "SUPPLIER"
): { user: JWTPayload | null; error: Response | null } {
  const { user, error } = requireAuth(req);
  if (error || !user) return { user: null, error };

  if (user.role !== role) {
    return {
      user: null,
      error: Response.json(
        { success: false, error: `Only ${role.toLowerCase()}s can do this.` },
        { status: 403 }
      ),
    };
  }
  return { user, error: null };
}