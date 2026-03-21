import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import * as z from "zod";
import { prisma } from "@/lib/database/prisma";
import { signToken } from "@/lib/utils/middleware";
import { rateLimit } from "@/lib/utils/rateLimit";

const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limit check
    const { success, error } = rateLimit(req);
    if (!success) return error;

    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.message },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { supplier: true },
    });

    // Same error for wrong email OR wrong password ====
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return Response.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as "BUYER" | "SUPPLIER",
      supplierId: user.supplier?.id,
    });

    return Response.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          supplierId: user.supplier?.id,
        },
      },
    });
  } catch (error) {
    console.error("[POST /api/auth/login]", String(error));
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
