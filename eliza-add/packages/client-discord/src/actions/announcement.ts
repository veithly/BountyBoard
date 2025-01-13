import { composeContext } from "@ai16z/eliza";
import { generateText } from "@ai16z/eliza";
import {
    Action,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
} from "@ai16z/eliza";
import { TextChannel, Client } from "discord.js";

export const announcementTemplate = `# Task: Format an announcement for {{agentName}}
About {{agentName}}:
{{bio}}

# Announcement Content
{{content}}

# Channel Information
Channel: {{channelName}}
Purpose: {{channelPurpose}}

# Instructions: Format this announcement in {{agentName}}'s voice and style.
1. Structure the message appropriately for a Discord announcement
2. Use appropriate formatting (bold, bullet points, etc.)
3. Include a clear title/header
4. Add relevant emojis if suitable

Only respond with the formatted announcement text.`;

export default {
    name: "SEND_ANNOUNCEMENT",
    similes: [
        "ANNOUNCE",
        "MAKE_ANNOUNCEMENT",
        "POST_ANNOUNCEMENT",
        "BROADCAST",
        "PUBLISH",
    ],
    description: "Send an announcement message to a specified Discord channel",

    validate: async (
        _runtime: IAgentRuntime,
        message: Memory,
        state: State
    ) => {
        if (!message.content.channelId) {
            return false;
        }

        if (!state.discordClient) {
            return false;
        }

        const keywords = [
            "announce",
            "announcement",
            "broadcast",
            "notify",
            "publish",
        ];
        if (!message?.content?.text) {
            return false;
        }
        const text = message.content.text.toLowerCase();
        return keywords.some((keyword) => text.includes(keyword));
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: Record<string, unknown>,
        callback: HandlerCallback
    ) => {
        try {
            const channelId = message.content.channelId as string;
            const discordClient = state.discordClient as Client;

            if (!discordClient) {
                throw new Error("Discord client not found");
            }

            const channel = await discordClient.channels.fetch(channelId);

            if (!channel || !(channel instanceof TextChannel)) {
                throw new Error("Invalid channel or channel not found");
            }

            // Update status to include channel information
            state = {
                ...state,
                channelName: channel.name,
                channelPurpose: channel.topic || "General discussion",
                content: message.content.text,
            };

            // Use a template to generate formatted notice content
            const context = composeContext({
                state,
                template: announcementTemplate,
            });

            const formattedContent = await generateText({
                runtime,
                context,
                modelClass: ModelClass.SMALL,
            });

            if (!formattedContent) {
                throw new Error("Failed to generate announcement content");
            }

            // Send announcement
            await channel.send(formattedContent);

            // Callback to notify the sending result
            if (callback) {
                const responseContent: Content = {
                    text: "✅ Announcement has been sent successfully!",
                    source: "discord",
                    action: "SEND_ANNOUNCEMENT",
                };
                callback(responseContent, []);
            }
        } catch (error) {
            console.error("Error in SEND_ANNOUNCEMENT action:", error);
            if (callback) {
                const errorContent: Content = {
                    text: `❌ Failed to send announcement: ${error instanceof Error ? error.message : "Unknown error"}`,
                    source: "discord",
                    action: "SEND_ANNOUNCEMENT",
                };
                callback(errorContent, []);
            }
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Please announce that we're having a community meeting tomorrow at 3PM UTC",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll make that announcement right away",
                    action: "SEND_ANNOUNCEMENT",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you broadcast the new server rules to everyone?",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll send out the announcement",
                    action: "SEND_ANNOUNCEMENT",
                },
            },
        ],
    ],
} as Action;
