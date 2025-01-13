import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { stringToUuid } from "@/lib/uuid";

const elizaAgentUserId = process.env.ELIZA_AGENT_USER_ID;

const elizaAgentId = process.env.ELIZA_AGENT_ID;

const elizaAgentUrl = `${process.env.ELIZA_API_URL}/${elizaAgentId}/memories`;

export async function POST(req: NextRequest) {
  try {
    const { content, channelId } = await req.json();

    if (!content || !channelId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const memory = {
      id: uuidv4(),
      content,
      userId: elizaAgentUserId,
      roomId: stringToUuid(channelId + "-" + elizaAgentId),
      createdAt: new Date(),
    };

    const response = await fetch(elizaAgentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(memory),
    });

    if (!response.ok) {
      const errorDetails = await response.json();
      throw new Error(errorDetails.error || 'Unknown error');
    }

    return NextResponse.json({ success: true, memoryId: memory.id });
  } catch (error) {
    console.error("Error creating memory:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Failed to create memory", details: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}