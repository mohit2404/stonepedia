import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import * as z from "zod";
import { prisma } from "@/lib/database/prisma";
import { signToken } from "@/lib/utils/middleware";
import { rateLimit } from "@/lib/utils/rateLimit";

const RegisterSchema = z.object({
  email: z.email("Invalid email"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["BUYER", "SUPPLIER"]),
  companyName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limit check
    const { success, error } = rateLimit(req);
    if (!success) return error;

    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.message },
        { status: 400 },
      );
    }

    const { email, name, password, role, companyName } = parsed.data;

    // check duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json(
        { success: false, error: "Email already registered" },
        { status: 409 },
      );
    }

    // suppliers must provide company name
    if (role === "SUPPLIER" && !companyName) {
      return Response.json(
        { success: false, error: "Company name is required for suppliers" },
        { status: 400 },
      );
    }

    // hash plain password
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role,
        ...(role === "SUPPLIER" && companyName
          ? { supplier: { create: { companyName } } }
          : {}),
      },
      include: { supplier: true },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as "BUYER" | "SUPPLIER",
      supplierId: user.supplier?.id,
    });

    return Response.json(
      {
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
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/v1/auth/register]", String(error));
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
