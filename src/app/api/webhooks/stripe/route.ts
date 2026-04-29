import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      message: "Stripe webhook scaffold is ready for implementation."
    },
    { status: 501 }
  );
}
