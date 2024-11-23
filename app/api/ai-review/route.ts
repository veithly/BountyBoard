import { NextRequest, NextResponse } from "next/server";
import { AIReviewService } from "@/services/aiReview";

const aiReviewService = new AIReviewService();

export async function POST(req: NextRequest) {
  try {
    const requestData = await req.json();
    const result = await aiReviewService.review(requestData);
    return NextResponse.json(result);
  } catch (error) {
    console.error("AI Review API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI Review failed" },
      { status: 500 }
    );
  }
}
