import { composeContext } from "@ai16z/eliza";
import { generateMessageResponse, generateShouldRespond } from "@ai16z/eliza";
import {
    Content,
    HandlerCallback,
    IAgentRuntime,
    IBrowserService,
    ISpeechService,
    IVideoService,
    Media,
    Memory,
    ModelClass,
    ServiceType,
    State,
    UUID,
} from "@ai16z/eliza";
import { stringToUuid, getEmbeddingZeroVector } from "@ai16z/eliza";
import {
    ChannelType,
    Client,
    Message as DiscordMessage,
    TextChannel,
} from "discord.js";
import { elizaLogger } from "@ai16z/eliza";
import { AttachmentManager } from "./attachments.js";
import { VoiceManager } from "./voice.js";
import {
    discordShouldRespondTemplate,
    discordMessageHandlerTemplate,
    discordAnnouncementTemplate,
} from "./templates.js";
import { sendMessageInChunks, canSendMessage } from "./utils.js";

export type InterestChannels = {
    [key: string]: {
        lastMessageSent: number;
        messages: { userId: UUID; userName: string; content: Content }[];
    };
};

export class MessageManager {
    private client: Client;
    private runtime: IAgentRuntime;
    private attachmentManager: AttachmentManager;
    private interestChannels: InterestChannels = {};
    private discordClient: any;
    private voiceManager: VoiceManager;

    constructor(discordClient: any, voiceManager: VoiceManager) {
        this.client = discordClient.client;
        this.voiceManager = voiceManager;
        this.discordClient = discordClient;
        this.runtime = discordClient.runtime;
        this.attachmentManager = new AttachmentManager(this.runtime);
    }

    async handleMessage(message: DiscordMessage) {
        if (
            message.interaction ||
            message.author.id ===
                this.client.user?.id /* || message.author?.bot*/
        )
            return;

        if (
            this.runtime.character.clientConfig?.discord
                ?.shouldIgnoreBotMessages &&
            message.author?.bot
        ) {
            return;
        }

        if (
            this.runtime.character.clientConfig?.discord
                ?.shouldIgnoreDirectMessages &&
            message.channel.type === ChannelType.DM
        ) {
            return;
        }

        const userId = message.author.id as UUID;
        const userName = message.author.username;
        const name = message.author.displayName;
        const channelId = message.channel.id;

        try {
            const { processedContent, attachments } =
                await this.processMessageMedia(message);

            const audioAttachments = message.attachments.filter((attachment) =>
                attachment.contentType?.startsWith("audio/")
            );
            if (audioAttachments.size > 0) {
                const processedAudioAttachments =
                    await this.attachmentManager.processAttachments(
                        audioAttachments
                    );
                attachments.push(...processedAudioAttachments);
            }

            const roomId = stringToUuid(channelId + "-" + this.runtime.agentId);
            const userIdUUID = stringToUuid(userId);

            await this.runtime.ensureConnection(
                userIdUUID,
                roomId,
                userName,
                name,
                "discord"
            );

            const messageId = stringToUuid(
                message.id + "-" + this.runtime.agentId
            );

            let shouldIgnore = false;
            let shouldRespond = true;

            const content: Content = {
                text: processedContent,
                attachments: attachments,
                source: "discord",
                url: message.url,
                inReplyTo: message.reference?.messageId
                    ? stringToUuid(
                          message.reference.messageId +
                              "-" +
                              this.runtime.agentId
                      )
                    : undefined,
            };

            const userMessage = {
                content,
                userId: userIdUUID,
                agentId: this.runtime.agentId,
                roomId,
            };

            const memory: Memory = {
                id: stringToUuid(message.id + "-" + this.runtime.agentId),
                ...userMessage,
                userId: userIdUUID,
                agentId: this.runtime.agentId,
                roomId,
                content,
                createdAt: message.createdTimestamp,
            };

            if (content.text) {
                await this.runtime.messageManager.addEmbeddingToMemory(memory);
                await this.runtime.messageManager.createMemory(memory);
            }

            let state = await this.runtime.composeState(userMessage, {
                discordClient: this.client,
                discordMessage: message,
                agentName:
                    this.runtime.character.name ||
                    this.client.user?.displayName,
            });

            const canSendResult = canSendMessage(message.channel);
            if (!canSendResult.canSend) {
                return elizaLogger.warn(
                    `Cannot send message to channel ${message.channel}`,
                    canSendResult
                );
            }

            if (!shouldIgnore) {
                shouldIgnore = await this._shouldIgnore(message);
            }

            if (shouldIgnore) {
                return;
            }
            const hasInterest = this._checkInterest(channelId);

            const agentUserState =
                await this.runtime.databaseAdapter.getParticipantUserState(
                    roomId,
                    this.runtime.agentId
                );

            if (
                agentUserState === "MUTED" &&
                !message.mentions.has(this.client.user.id) &&
                !hasInterest
            ) {
                console.log("Ignoring muted room");
                // Ignore muted rooms unless explicitly mentioned
                return;
            }

            if (agentUserState === "FOLLOWED") {
                shouldRespond = true; // Always respond in followed rooms
            } else if (
                (!shouldRespond && hasInterest) ||
                (shouldRespond && !hasInterest)
            ) {
                shouldRespond = await this._shouldRespond(message, state);
            }

            if (shouldRespond) {
                const context = composeContext({
                    state,
                    template:
                        this.runtime.character.templates
                            ?.discordMessageHandlerTemplate ||
                        discordMessageHandlerTemplate,
                });

                const responseContent = await this._generateResponse(
                    memory,
                    state,
                    context
                );

                responseContent.text = responseContent.text?.trim();
                responseContent.inReplyTo = stringToUuid(
                    message.id + "-" + this.runtime.agentId
                );

                if (!responseContent.text) {
                    return;
                }

                const callback: HandlerCallback = async (
                    content: Content,
                    files: any[]
                ) => {
                    try {
                        if (message.id && !content.inReplyTo) {
                            content.inReplyTo = stringToUuid(
                                message.id + "-" + this.runtime.agentId
                            );
                        }
                        const messages = await sendMessageInChunks(
                            message.channel as TextChannel,
                            content.text,
                            message.id,
                            files
                        );

                        const memories: Memory[] = [];
                        for (const m of messages) {
                            let action = content.action;
                            // If there's only one message or it's the last message, keep the original action
                            // For multiple messages, set all but the last to 'CONTINUE'
                            if (
                                messages.length > 1 &&
                                m !== messages[messages.length - 1]
                            ) {
                                action = "CONTINUE";
                            }

                            const memory: Memory = {
                                id: stringToUuid(
                                    m.id + "-" + this.runtime.agentId
                                ),
                                userId: this.runtime.agentId,
                                agentId: this.runtime.agentId,
                                content: {
                                    ...content,
                                    action,
                                    inReplyTo: messageId,
                                    url: m.url,
                                },
                                roomId,
                                embedding: getEmbeddingZeroVector(),
                                createdAt: m.createdTimestamp,
                            };
                            memories.push(memory);
                        }
                        for (const m of memories) {
                            await this.runtime.messageManager.createMemory(m);
                        }
                        return memories;
                    } catch (error) {
                        console.error("Error sending message:", error);
                        return [];
                    }
                };

                const responseMessages = await callback(responseContent);

                state = await this.runtime.updateRecentMessageState(state);

                await this.runtime.processActions(
                    memory,
                    responseMessages,
                    state,
                    callback
                );
            }
            await this.runtime.evaluate(memory, state, shouldRespond);
        } catch (error) {
            console.error("Error handling message:", error);
            if (message.channel.type === ChannelType.GuildVoice) {
                // For voice channels, use text-to-speech for the error message
                const errorMessage = "Sorry, I had a glitch. What was that?";

                const speechService = this.runtime.getService<ISpeechService>(
                    ServiceType.SPEECH_GENERATION
                );
                if (!speechService) {
                    throw new Error("Speech generation service not found");
                }

                const audioStream = await speechService.generate(
                    this.runtime,
                    errorMessage
                );
                await this.voiceManager.playAudioStream(userId, audioStream);
            } else {
                // For text channels, send the error message
                console.error("Error sending message:", error);
            }
        }
    }

    async cacheMessages(channel: TextChannel, count: number = 20) {
        const messages = await channel.messages.fetch({ limit: count });

        // TODO: This is throwing an error but seems to work?
        for (const [_, message] of messages) {
            await this.handleMessage(message);
        }
    }

    async processMessageMedia(
        message: DiscordMessage
    ): Promise<{ processedContent: string; attachments: Media[] }> {
        let processedContent = message.content;

        let attachments: Media[] = [];

        // Process code blocks in the message content
        const codeBlockRegex = /```([\s\S]*?)```/g;
        let match;
        while ((match = codeBlockRegex.exec(processedContent))) {
            const codeBlock = match[1];
            const lines = codeBlock.split("\n");
            const title = lines[0];
            const description = lines.slice(0, 3).join("\n");
            const attachmentId =
                `code-${Date.now()}-${Math.floor(Math.random() * 1000)}`.slice(
                    -5
                );
            attachments.push({
                id: attachmentId,
                url: "",
                title: title || "Code Block",
                source: "Code",
                description: description,
                text: codeBlock,
            });
            processedContent = processedContent.replace(
                match[0],
                `Code Block (${attachmentId})`
            );
        }

        // Process message attachments
        if (message.attachments.size > 0) {
            attachments = await this.attachmentManager.processAttachments(
                message.attachments
            );
        }

        // TODO: Move to attachments manager
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = processedContent.match(urlRegex) || [];

        for (const url of urls) {
            if (
                this.runtime
                    .getService<IVideoService>(ServiceType.VIDEO)
                    ?.isVideoUrl(url)
            ) {
                const videoService = this.runtime.getService<IVideoService>(
                    ServiceType.VIDEO
                );
                if (!videoService) {
                    throw new Error("Video service not found");
                }
                const videoInfo = await videoService.processVideo(
                    url,
                    this.runtime
                );

                attachments.push({
                    id: `youtube-${Date.now()}`,
                    url: url,
                    title: videoInfo.title,
                    source: "YouTube",
                    description: videoInfo.description,
                    text: videoInfo.text,
                });
            } else {
                const browserService = this.runtime.getService<IBrowserService>(
                    ServiceType.BROWSER
                );
                if (!browserService) {
                    throw new Error("Browser service not found");
                }

                const { title, description: summary } =
                    await browserService.getPageContent(url, this.runtime);

                attachments.push({
                    id: `webpage-${Date.now()}`,
                    url: url,
                    title: title || "Web Page",
                    source: "Web",
                    description: summary,
                    text: summary,
                });
            }
        }

        return { processedContent, attachments };
    }

    private _checkInterest(channelId: string): boolean {
        return !!this.interestChannels[channelId];
    }

    private async _shouldIgnore(message: DiscordMessage): Promise<boolean> {
        // if the message is from us, ignore
        if (message.author.id === this.client.user?.id) return true;
        let messageContent = message.content.toLowerCase();

        // Replace the bot's @ping with the character name
        const botMention = `<@!?${this.client.user?.id}>`;
        messageContent = messageContent.replace(
            new RegExp(botMention, "gi"),
            this.runtime.character.name.toLowerCase()
        );

        // Replace the bot's username with the character name
        const botUsername = this.client.user?.username.toLowerCase();
        messageContent = messageContent.replace(
            new RegExp(`\\b${botUsername}\\b`, "g"),
            this.runtime.character.name.toLowerCase()
        );

        // strip all special characters
        messageContent = messageContent.replace(/[^a-zA-Z0-9\s]/g, "");

        // short responses where ruby should stop talking and disengage unless mentioned again
        const loseInterestWords = [
            "shut up",
            "stop",
            "please shut up",
            "shut up please",
            "dont talk",
            "silence",
            "stop talking",
            "be quiet",
            "hush",
            "wtf",
            "chill",
            "stfu",
            "stupid bot",
            "dumb bot",
            "stop responding",
            "god damn it",
            "god damn",
            "goddamnit",
            "can you not",
            "can you stop",
            "be quiet",
            "hate you",
            "hate this",
            "fuck up",
        ];
        if (
            messageContent.length < 100 &&
            loseInterestWords.some((word) => messageContent.includes(word))
        ) {
            delete this.interestChannels[message.channelId];
            return true;
        }

        // If we're not interested in the channel and it's a short message, ignore it
        if (
            messageContent.length < 10 &&
            !this.interestChannels[message.channelId]
        ) {
            return true;
        }

        const targetedPhrases = [
            this.runtime.character.name + " stop responding",
            this.runtime.character.name + " stop talking",
            this.runtime.character.name + " shut up",
            this.runtime.character.name + " stfu",
            "stop talking" + this.runtime.character.name,
            this.runtime.character.name + " stop talking",
            "shut up " + this.runtime.character.name,
            this.runtime.character.name + " shut up",
            "stfu " + this.runtime.character.name,
            this.runtime.character.name + " stfu",
            "chill" + this.runtime.character.name,
            this.runtime.character.name + " chill",
        ];

        // lose interest if pinged and told to stop responding
        if (targetedPhrases.some((phrase) => messageContent.includes(phrase))) {
            delete this.interestChannels[message.channelId];
            return true;
        }

        // if the message is short, ignore but maintain interest
        if (
            !this.interestChannels[message.channelId] &&
            messageContent.length < 2
        ) {
            return true;
        }

        const ignoreResponseWords = [
            "lol",
            "nm",
            "uh",
            "wtf",
            "stfu",
            "dumb",
            "jfc",
            "omg",
        ];
        if (
            message.content.length < 4 &&
            ignoreResponseWords.some((word) =>
                message.content.toLowerCase().includes(word)
            )
        ) {
            return true;
        }
        return false;
    }

    private async _shouldRespond(
        message: DiscordMessage,
        state: State
    ): Promise<boolean> {
        if (message.author.id === this.client.user?.id) return false;
        // if (message.author.bot) return false;
        if (message.mentions.has(this.client.user?.id as string)) return true;

        const guild = message.guild;
        const member = guild?.members.cache.get(this.client.user?.id as string);
        const nickname = member?.nickname;

        if (
            message.content
                .toLowerCase()
                .includes(this.client.user?.username.toLowerCase() as string) ||
            message.content
                .toLowerCase()
                .includes(this.client.user?.tag.toLowerCase() as string) ||
            (nickname &&
                message.content.toLowerCase().includes(nickname.toLowerCase()))
        ) {
            return true;
        }

        if (!message.guild) {
            return true;
        }

        // If none of the above conditions are met, use the generateText to decide
        const shouldRespondContext = composeContext({
            state,
            template:
                this.runtime.character.templates
                    ?.discordShouldRespondTemplate ||
                this.runtime.character.templates?.shouldRespondTemplate ||
                discordShouldRespondTemplate,
        });

        const response = await generateShouldRespond({
            runtime: this.runtime,
            context: shouldRespondContext,
            modelClass: ModelClass.SMALL,
        });

        if (response === "RESPOND") {
            return true;
        } else if (response === "IGNORE") {
            return false;
        } else if (response === "STOP") {
            delete this.interestChannels[message.channelId];
            return false;
        } else {
            console.error(
                "Invalid response from response generateText:",
                response
            );
            return false;
        }
    }

    private async _generateResponse(
        message: Memory,
        state: State,
        context: string
    ): Promise<Content> {
        const { userId, roomId } = message;

        const response = await generateMessageResponse({
            runtime: this.runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        if (!response) {
            console.error("No response from generateMessageResponse");
            return;
        }

        await this.runtime.databaseAdapter.log({
            body: { message, context, response },
            userId: userId,
            roomId,
            type: "response",
        });

        return response;
    }

    async fetchBotName(botToken: string) {
        const url = "https://discord.com/api/v10/users/@me";

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bot ${botToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(
                `Error fetching bot details: ${response.statusText}`
            );
        }

        const data = await response.json();
        return data.username;
    }

    async formatAnnouncement(
        content: string,
        type: "notice" | "event" | "update" | "general",
        channelId: string
    ) {
        const channel = (await this.client.channels.fetch(
            channelId
        )) as TextChannel;

        const state = await this.runtime.composeState({
            userId: this.runtime.agentId,
            agentId: this.runtime.agentId,
            roomId: stringToUuid(channelId + "-" + this.runtime.agentId),
            content: {
                text: content,
                type: "announcement",
                announcementType: type,
                channelName: channel.name,
                channelPurpose: channel.topic || "General discussion",
            },
        });

        // Use default notice template
        const template = discordAnnouncementTemplate;

        const context = composeContext({
            state,
            template,
        });

        const memory: Memory = {
            id: stringToUuid(
                `announcement-${Date.now()}-${this.runtime.agentId}`
            ),
            userId: this.runtime.agentId,
            agentId: this.runtime.agentId,
            roomId: stringToUuid(channelId + "-" + this.runtime.agentId),
            content: {
                text: content,
                type: "announcement",
                announcementType: type,
                source: "discord",
            },
            createdAt: Date.now(),
            embedding: getEmbeddingZeroVector(),
        };

        await this.runtime.messageManager.createMemory(memory);

        const formattedContent = await generateMessageResponse({
            runtime: this.runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        return formattedContent;
    }
}
