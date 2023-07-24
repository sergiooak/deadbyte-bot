import 'dotenv/config';
import wwebjs from 'whatsapp-web.js';
/**
 * Whatsapp Web Client
 * @type {wwebjs.Client}
 */
const client = new wwebjs.Client({
    authStrategy: new wwebjs.LocalAuth(),
    // proxyAuthentication: { username: 'username', password: 'password' },
    puppeteer: {
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    // headless: false,
    },
});

/**
 * Get Whatsapp Web Client
 * @returns {wwebjs.Client}
 */
export function getClient() {
    return client;
}

client.initialize();

/**
 * WWebJS Client Events
 * @see https://docs.wwebjs.dev/Client.html
 * 
 */
const events = [
    'auth_failure',
    'authenticated',
    'change_battery',
    'change_state',
    'chat_archived',
    'chat_removed',
    'contact_changed',
    'disconnected',
    'group_admin_changed',
    'group_join',
    'group_leave',
    'group_update',
    'incoming_call',
    'media_uploaded',
    'message',
    'message_ack',
    'message_create',
    'message_reaction',
    'message_revoke_everyone',
    'message_revoke_me',
    'qr',
    'ready'
];

events.forEach(async event => {
    try {
        const eventModule = await import(`./services/events/${event}.js`);
        client.on(event, eventModule.default);
    } catch (error) {
        // do nothing
    }
});