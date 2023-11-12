import { Client, Chat, Contact, Message, GroupParticipant } from 'whatsapp-web.js';

/**
 * Auxiliar message data
 */
export interface AuxiliarMessageData {
    /** The client */
    client: Client;
    /** The chat */
    chat: Chat;
    /** The sender */
    sender: Contact;
    /** If the sender is the bot */
    senderIsMe: boolean;
    /** If the message mentions the bot */
    mentionedMe: boolean;
    /** The original message */
    originalMsg: Message;
    /** The message history */
    history: Message[];
    /** The original message body */
    originalBody: string;
    /** If the message is a function */
    isFunction: boolean;
    /** The message prefix */
    prefix: string;
    /** The message function */
    function: string;
    /** If the original message is a function */
    hasOriginalFunction: boolean;
    /** The original message function */
    originalFunction: string;
    /** The bot id */
    me: string;
    /** The mentions */
    mentions: string[];
    /** If the bot is mentioned */
    amIMentioned: boolean;
    /** The chat participants */
    participants: GroupParticipant[];
    /** The chat admins */
    admins: string[];
    /** If the sender is admin */
    isSenderAdmin: boolean;
    /** If the bot is admin */
    isBotAdmin: boolean;
    /** If the chat is the sticker group */
    isStickerGroup: boolean;
}

export type WWebJSMessage = Message & { aux: AuxiliarMessageData };