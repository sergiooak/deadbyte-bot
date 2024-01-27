import { makeWASocket } from '@whiskeysockets/baileys';

/**
 * Baileys socket
 */
export interface WSocket extends ReturnType<typeof makeWASocket> { }