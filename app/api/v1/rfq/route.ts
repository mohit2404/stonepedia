import { NextRequest } from "next/server";
import * as z from "zod";
import { prisma } from "@/lib/database/prisma";
import { requireRole, requireAuth } from "@/lib/utils/middleware";

const CreateRFQSchema = z.object({
  productId: z.uuid("Invalid product ID"),
  quantity: z.number().int().positive("Quantity must be positive"),
  description: z.string().optional(),
  deadline: z.iso.datetime().optional(),
});

// POST /api/v1/rfq — buyers only
export async function POST(req: NextRequest) {
  const { user, error } = requireRole(req, "BUYER");
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = CreateRFQSchema.safeParse(body);
    if (!parsed.success) {
      console.error("[POST /api/v1/rfq]", parsed.error);
      return Response.json(
        { success: false, error: parsed.error.message },
        { status: 400 },
      );
    }

    const { productId, quantity, description, deadline } = parsed.data;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return Response.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    }

    const rfq = await prisma.rFQ.create({
      data: {
        buyerId: user!.userId,
        productId,
        quantity,
        description,
        deadline: deadline ? new Date(deadline) : null,
      },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        product: {
          select: { id: true, name: true, unit: true, category: true },
        },
        _count: { select: { quotes: true } },
      },
    });

    return Response.json({ success: true, data: rfq }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/v1/rfq]", err);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET /api/v1/rfq — any logged in user
export async function GET(req: NextRequest) {
  const { error } = requireAuth(req);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "OPEN";

    const rfqs = await prisma.rFQ.findMany({
      where:
        status !== "ALL"
          ? { status: status as "OPEN" | "CLOSED" | "CANCELLED" }
          : {},
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        product: {
          select: { id: true, name: true, unit: true, category: true },
        },
        _count: { select: { quotes: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ success: true, data: rfqs });
  } catch (error) {
    console.error("[GET /api/v1/rfq]", String(error));
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
