import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/utils/middleware";

export async function GET(req: NextRequest) {
  const { error } = requireAuth(req);
  if (error) return error;

  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  return Response.json({ success: true, data: products });
}

export async function POST(req: NextRequest) {
  const { error } = requireAuth(req);
  if (error) return error;

  const body = await req.json();
  const product = await prisma.product.create({ data: body });
  return Response.json({ success: true, data: product }, { status: 201 });
}