import { NextRequest, NextResponse } from "next/server";
import { stringToUuid } from "@/lib/uuid";

const elizaAgentUserId = process.env.ELIZA_AGENT_USER_ID || "";
const elizaAgentId = process.env.ELIZA_AGENT_ID || "";
const elizaAgentUrl = `${process.env.ELIZA_API_URL}/${elizaAgentId}/message`;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

export async function POST(req: NextRequest) {
  try {
    const { channelId, type, data } = await req.json();

    if (!channelId || !type || !data) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. 构建AI消息内容
    const memoryContent = {
      type,
      timestamp: new Date().toISOString(),
      ...data,
    };

    // 2. 调用AI服务获取公告内容
    const aiResponse = await fetch(elizaAgentUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomId: stringToUuid(channelId + "-" + elizaAgentId),
        userId: stringToUuid(elizaAgentUserId),
        userName: "user",
        content: {
          text: `Please format the following information into a clear and concise announcement. Use appropriate emojis and maintain a professional tone. Focus only on the essential details:
Type: ${type}
Content: ${JSON.stringify(data)}`,
          attachments: [],
          source: "direct",
        },
      }),
    });

    if (!aiResponse.ok) {
      const errorDetails = await aiResponse.json();
      throw new Error(errorDetails.error || "Failed to get AI response");
    }

    // 读取流式响应
    const reader = aiResponse.body?.getReader();
    let aiContent = "";

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // 将 Uint8Array 转换为字符串
        const chunk = new TextDecoder().decode(value);
        aiContent += chunk;
      }
    }

    console.log("Raw AI Content:", aiContent);

    // 尝试解析响应
    let responses;
    try {
      const parsedContent = JSON.parse(aiContent);
      console.log("Parsed Content:", parsedContent);

      // 处理不同的响应格式
      if (Array.isArray(parsedContent)) {
        responses = parsedContent;
      } else if (parsedContent.responses) {
        responses = parsedContent.responses;
      } else {
        responses = [parsedContent];
      }
    } catch (error) {
      console.error("JSON Parse Error:", error);
      throw new Error("Failed to parse AI response");
    }

    if (!responses || responses.length === 0) {
      throw new Error("No valid response from AI service");
    }

    console.log("Processed Responses:", responses);

    // 提取消息内容
    const announcementText = responses[0].content?.text || responses[0].text;

    if (!announcementText) {
      console.error("Response structure:", responses[0]);
      throw new Error("Could not extract announcement text from response");
    }

    // 3. 发送到Discord
    const discordResponse = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: announcementText,
        }),
      }
    );

    if (!discordResponse.ok) {
      const errorData = await discordResponse.json();
      throw new Error(errorData.message || "Failed to send Discord message");
    }

    const result = await discordResponse.json();
    return NextResponse.json({
      success: true,
      messageId: result.id,
    });
  } catch (error) {
    console.error("Error in announcement:", error);
    return NextResponse.json(
      {
        error: "Failed to process announcement",
        details: error instanceof Error ? error.message : error,
      },
      { status: 500 }
    );
  }
}
