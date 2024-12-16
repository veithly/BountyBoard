import { NextRequest, NextResponse } from "next/server";
import { stringToUuid } from "@/lib/uuid";

const elizaAgentUserId = process.env.ELIZA_AGENT_USER_ID || "";
const elizaAgentId = process.env.ELIZA_AGENT_ID || "";
const elizaAgentUrl = `${process.env.ELIZA_API_URL}/${elizaAgentId}/message`;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export async function POST(req: NextRequest) {
  try {
    const { channelId, type, data } = await req.json();

    if (!channelId || !type || !data) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let announcementText = '';

    // 检查是否配置了 Eliza
    if (elizaAgentUrl && elizaAgentId) {
      // 使用现有的 Eliza 逻辑
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

      // 处理 Eliza 响应...
      const reader = aiResponse.body?.getReader();
      let aiContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = new TextDecoder().decode(value);
          aiContent += chunk;
        }
      }

      let responses;
      try {
        const parsedContent = JSON.parse(aiContent);
        if (Array.isArray(parsedContent)) {
          responses = parsedContent;
        } else if (parsedContent.responses) {
          responses = parsedContent.responses;
        } else {
          responses = [parsedContent];
        }
        announcementText = responses[0].content?.text || responses[0].text;
      } catch (error) {
        console.error("Eliza Parse Error:", error);
        throw new Error("Failed to parse Eliza response");
      }
    }
    // 如果没有配置 Eliza 但配置了 Google AI
    else if (GOOGLE_API_KEY) {
      const prompt = {
        announcement_request: {
          type,
          content: data
        },
        instructions: "Format the given information into a clear and concise announcement. Use appropriate emojis and maintain a professional tone. Focus on essential details. Return only the formatted announcement text without any JSON structure or additional formatting.",
        example_response: "🎉 New Update Available!\nWe're excited to announce the latest features...",
      };

      const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: JSON.stringify(prompt)
            }]
          }]
        })
      });

      if (!geminiResponse.ok) {
        throw new Error('Failed to get Gemini API response');
      }

      const geminiData = await geminiResponse.json();
      announcementText = geminiData.candidates[0].content.parts[0].text.trim();
    } else {
      throw new Error("No AI service configured");
    }

    if (!announcementText) {
      throw new Error("Could not generate announcement text");
    }

    // 发送到 Discord
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
