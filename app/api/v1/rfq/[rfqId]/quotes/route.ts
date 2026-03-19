import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/utils/middleware";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ rfqId: string }> },
) {
  const { error } = requireAuth(req);
  if (error) return error;

  try {
    const { rfqId } = await params;

    const rfq = await prisma.rFQ.findUnique({ where: { id: rfqId } });
    if (!rfq) {
      return Response.json(
        { success: false, error: "RFQ not found" },
        { status: 404 },
      );
    }

    const quotes = await prisma.quote.findMany({
      where: { rfqId },
      include: {
        supplier: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { totalPrice: "asc" }, // cheapest first
    });

    return Response.json({ success: true, data: quotes });
  } catch (error) {
    console.error("[GET /api/v1/rfq/:rfqId/quotes]", String(error));
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
