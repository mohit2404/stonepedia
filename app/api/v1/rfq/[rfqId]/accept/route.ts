import { NextRequest } from "next/server";
import * as z from "zod";
import { prisma } from "@/lib/database/prisma";
import { requireRole } from "@/lib/utils/middleware";

const AcceptSchema = z.object({
  quoteId: z.uuid("Invalid quote ID"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ rfqId: string }> },
) {
  const { user, error } = requireRole(req, "BUYER");
  if (error) return error;

  try {
    const { rfqId } = await params;
    const body = await req.json();
    const parsed = AcceptSchema.safeParse(body);
    if (!parsed.success) {
      console.error("[POST /api/v1/rfq/:rfqId/accept]", parsed.error);
      return Response.json(
        { success: false, error: parsed.error.message },
        { status: 400 },
      );
    }

    const { quoteId } = parsed.data;

    const rfq = await prisma.rFQ.findUnique({
      where: { id: rfqId },
      include: { order: true },
    });
    if (!rfq)
      return Response.json(
        { success: false, error: "RFQ not found" },
        { status: 404 },
      );
    if (rfq.buyerId !== user!.userId) {
      return Response.json(
        { success: false, error: "This is not your RFQ" },
        { status: 403 },
      );
    }
    if (rfq.status !== "OPEN") {
      return Response.json(
        { success: false, error: "RFQ is already closed" },
        { status: 400 },
      );
    }
    if (rfq.order) {
      return Response.json(
        { success: false, error: "Order already exists for this RFQ" },
        { status: 409 },
      );
    }

    const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote || quote.rfqId !== rfqId) {
      return Response.json(
        { success: false, error: "Quote not found for this RFQ" },
        { status: 404 },
      );
    }
    if (quote.status !== "PENDING") {
      return Response.json(
        { success: false, error: "Quote is no longer available" },
        { status: 400 },
      );
    }

    // Transaction: accept quote + reject others + close RFQ + create order
    const [order] = await prisma.$transaction([
      prisma.order.create({
        data: {
          rfqId,
          quoteId,
          buyerId: user!.userId,
          supplierId: quote.supplierId,
          totalPrice: quote.totalPrice,
        },
        include: {
          rfq: { include: { product: true } },
          quote: true,
          buyer: { select: { name: true, email: true } },
        },
      }),
      prisma.quote.update({
        where: { id: quoteId },
        data: { status: "ACCEPTED" },
      }),
      prisma.quote.updateMany({
        where: { rfqId, id: { not: quoteId } },
        data: { status: "REJECTED" },
      }),
      prisma.rFQ.update({ where: { id: rfqId }, data: { status: "CLOSED" } }),
    ]);

    return Response.json({ success: true, data: order }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/v1/rfq/:rfqId/accept]", String(error));
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
