import { NextResponse } from "next/server";
import { MenuRepo } from "@/server/repositories/menu.repo";

export async function GET() {
  const products = await MenuRepo.getAll();
  return NextResponse.json({ products });
}
