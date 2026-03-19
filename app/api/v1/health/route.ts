import { prisma } from "@/lib/database/prisma";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return Response.json({
      success: true,
      userCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
