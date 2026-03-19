import { NextRequest } from "next/server";
import * as z from "zod";
import { prisma } from "@/lib/database/prisma";
import { requireRole } from "@/lib/utils/middleware";

const SubmitQuoteSchema = z.object({
  pricePerUnit: z.number().positive("Price must be positive"),
  deliveryDays: z.number().int().positive().optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ rfqId: string }> },
) {
  const { user, error } = requireRole(req, "SUPPLIER");
  if (error) return error;

  try {
    const { rfqId } = await params;
    const body = await req.json();
    const parsed = SubmitQuoteSchema.safeParse(body);
    if (!parsed.success) {
      console.error("[POST /api/v1/rfq/:rfqId/quote]", parsed.error);
      return Response.json(
        { success: false, error: parsed.error.message },
        { status: 400 },
      );
    }

    const rfq = await prisma.rFQ.findUnique({ where: { id: rfqId } });
    if (!rfq) {
      return Response.json(
        { success: false, error: "RFQ not found" },
        { status: 404 },
      );
    }
    if (rfq.status !== "OPEN") {
      return Response.json(
        { success: false, error: "RFQ is no longer accepting quotes" },
        { status: 400 },
      );
    }
    if (!user!.supplierId) {
      return Response.json(
        { success: false, error: "Supplier profile not found" },
        { status: 400 },
      );
    }

    const { pricePerUnit, deliveryDays, notes } = parsed.data;
    const totalPrice = pricePerUnit * rfq.quantity;

    // upsert — supplier can update their existing quote
    const quote = await prisma.quote.upsert({
      where: { rfqId_supplierId: { rfqId, supplierId: user!.supplierId } },
      update: {
        pricePerUnit,
        totalPrice,
        deliveryDays,
        notes,
        status: "PENDING",
      },
      create: {
        rfqId,
        supplierId: user!.supplierId,
        pricePerUnit,
        totalPrice,
        deliveryDays,
        notes,
      },
      include: {
        supplier: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    });

    return Response.json({ success: true, data: quote }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/v1/rfq/:rfqId/quote]", String(error));
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
