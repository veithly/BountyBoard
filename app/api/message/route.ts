import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { stringToUuid } from "@/lib/uuid";

const elizaAgentUserId = process.env.ELIZA_AGENT_USER_ID || "";
const elizaAgentId = process.env.ELIZA_AGENT_ID || "";
const elizaAgentUrl = `${process.env.ELIZA_API_URL}/${elizaAgentId}/message`;

export async function POST(req: NextRequest) {
  try {
    let { content, channelId, userName } = await req.json();

    if (!channelId) {
      channelId = content.channelId || uuidv4();
    }

    if (!content || !content.text) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 构建消息体，匹配服务端期望的格式
    const messagePayload = {
      roomId: stringToUuid(channelId + "-" + elizaAgentId),
      userId: stringToUuid(elizaAgentUserId),
      userName: userName || "user",
      content: {
        text: content.text,
        attachments: content.attachments || [],
        source: "direct",
        inReplyTo: content.inReplyTo,
        ...content
      }
    };

    // 调用AI代理接口
    const response = await fetch(elizaAgentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload),
    });

    if (!response.ok) {
      const errorDetails = await response.json();
      throw new Error(errorDetails.error || 'Unknown error');
    }

    // 服务端返回的是数组，包含AI的响应和可能的额外消息
    const aiResponses = await response.json();

    return NextResponse.json({
      success: true,
      responses: aiResponses
    });

  } catch (error) {
    console.error("Error creating message:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Failed to process message", details: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}