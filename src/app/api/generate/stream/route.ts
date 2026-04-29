import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";

export async function POST() {
  try {
    await requireAuth();

    return NextResponse.json(
      {
        message: "Streaming generation API scaffold is ready for implementation."
      },
      { status: 501 }
    );
  } catch {
    return NextResponse.json(
      {
        message: "Unauthorized."
      },
      { status: 401 }
    );
  }
}
