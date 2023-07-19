import wwebjs from "whatsapp-web.js";
import { extension as _extension } from "mime-types";

const LOG_GROUP_ID = "120363159709646670@g.us";

const client = new wwebjs.Client({
  authStrategy: new wwebjs.LocalAuth(),
  // proxyAuthentication: { username: 'username', password: 'password' },
  puppeteer: {
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    // args: ['--proxy-server=proxy-server-that-requires-authentication.example.com'],
    headless: false,
  },
});

client.initialize();

client.on("loading_screen", (percent, message) => {
  console.log("LOADING SCREEN", percent, message);
});

client.on("qr", (qr) => {
  // NOTE: This event will not be fired if a session is specified.
  console.log("QR RECEIVED", qr);
});

client.on("authenticated", () => {
  console.log("AUTHENTICATED");
});

client.on("auth_failure", (msg) => {
  // Fired if session restore was unsuccessful
  console.error("AUTHENTICATION FAILURE", msg);
});

client.on("ready", () => {
  console.log("READY");
});

client.on("message", async (msg) => {
  console.log("MESSAGE RECEIVED", msg);
  if (msg.hasMedia) {
    const media = await msg.downloadMedia();
    if (!media) return console.error("Error downloading media");

    const chat = await msg.getChat();

    // send media as sticker back
    await chat.sendMessage(media, {
      sendMediaAsSticker: true,
      stickerAuthor: "bot de figurinhas",
      stickerName: "DeadByte.com.br",
      stickerCategories: ["💀", "🤖"],
    });
  }
});

client.on("message_create", async (msg) => {
  // if (msg.hasMedia) {
  //   console.log("[MEDIA] Media received", msg);
  //   // Pre download the media when you receive it.
  //   // To be able to get it if it gets deleted.
  //   try {
  //     const filename = filenamify(msg["_data"].encFilehash);
  //     const media = await msg.downloadMedia();
  //     const extension = _extension(media.mimetype);
  //     const fullFilename = `${filename}.${extension}`;
  //     const filePath = resolve("./", "storage", "media", fullFilename);

  //     // save the media in the storage
  //     fs.writeFile(filePath, media.data, { encoding: "base64" });
  //   } catch (error) {
  //     console.log("[ERROR] Error downloading media", error);
  //   }
  // }

  // Fired on all message creations, including your own
  if (msg.fromMe) {
    // do stuff here
    // console.log("I sent a message", msg);
  }
});

client.on("message_revoke_everyone", async (after, before) => {
  // console.log("after", after); // message after it was deleted.
  // Fired whenever a message is deleted by anyone (including you)
  // if (before) {
  //   // console.log("before", before.body); // message before it was deleted.
  //   // console.log("before filehash", before["_data"].filehash);
  //   // console.log("before mimetype", before["_data"].encFilehash);
  //   const chat = await after.getChat();
  //   const type = before.type;
  //   let msgHeader = `[${type.toUpperCase()} DELETED]\n\n`;
  //   const sender = before.author || before.from;
  //   const senderContact = await client.getContactById(sender);
  //   if (chat.isGroup) msgHeader += `Grupo: *${chat.name.trim()}*\n`;
  //   msgHeader += `👤: *${senderContact?.pushname?.trim()}* (wa.me/${sender.split("@")[0]})`;
  //   let msgBody = before.body ? "\n\n---\n\n" : "";
  //   if (before.body) msgBody += `${before.body}`;
  //   // handle media
  //   let attachmentData = undefined;
  //   if (before.hasMedia) {
  //     const filename = filenamify(before["_data"].encFilehash);
  //     // check if there is a media file saved in the storage
  //     // but ignore the extension, becouse we don't know it at this point
  //     const folderPath = resolve("./", "storage", "media");
  //     const files = await fs.readdir(folderPath);
  //     const file = files.find((file) => file.startsWith(filename));
  //     if (file) {
  //       const filePath = resolve(folderPath, file);
  //       attachmentData = wwebjs.MessageMedia.fromFilePath(filePath);
  //     } else {
  //       before.body += "\n\n---\n\n[ATTACHMENT NOT FOUND]";
  //     }
  //   }
  //   let msgFooter = "\n\n---\n\n";
  //   const revokeAuthor = after["_data"].revokeSender; // 553499668235@c.us
  //   const authorContact = await client.getContactById(revokeAuthor);
  //   msgFooter += `👑: *${authorContact.pushname.trim()}* (wa.me/${revokeAuthor.split("@")[0]})`;
  //   const finalMessage = msgHeader + msgBody + msgFooter;
  //   // send the message to the LOG group
  //   const logGroup = await client.getChatById(LOG_GROUP_ID);
  //   await logGroup.sendMessage(finalMessage, { media: attachmentData });
  //   if (type.toUpperCase() === "STICKER") {
  //     await logGroup.sendMessage(attachmentData, { sendMediaAsSticker: true });
  //   }
  // }
});

// client.on("message_revoke_me", async (msg) => {
//   // Fired whenever a message is only deleted in your own view.
//   console.log(msg.body); // message before it was deleted.
// });

// client.on("message_ack", (msg, ack) => {
//   /*
//         == ACK VALUES ==
//         ACK_ERROR: -1
//         ACK_PENDING: 0
//         ACK_SERVER: 1
//         ACK_DEVICE: 2
//         ACK_READ: 3
//         ACK_PLAYED: 4
//     */

//   if (ack == 3) {
//     // The message was read
//   }
// });

// client.on("group_join", (notification) => {
//   // User has joined or been added to the group.
//   console.log("join", notification);
//   notification.reply("User joined.");
// });

// client.on("group_leave", (notification) => {
//   // User has left or been kicked from the group.
//   console.log("leave", notification);
//   notification.reply("User left.");
// });

client.on("group_update", async (notification) => {
  // Group picture, subject or description has been updated.
  console.log("update", notification);

  const logGroup = await client.getChatById(LOG_GROUP_ID);
  let messageHeader = `[GROUP UPDATED]\n\n`;
  // messageHeader += `Grupo: *${notification.chat.name.trim()}*\n`;
  const authorContact = await client.getContactById(notification.author);
  messageHeader += `👤: *${authorContact.pushname?.trim()}* (wa.me/${authorContact?.id.split("@")[0]})`;

  let messageBody = "\n\n---\n\n";
  messageBody += JSON.stringify(notification);
  messageBody += "\n\n---\n\n";

  const finalMessage = messageHeader + messageBody;
  await logGroup.sendMessage(finalMessage);
});

client.on("change_state", (state) => {
  console.log("CHANGE STATE", state);
});

// Change to false if you don't want to reject incoming calls
let rejectCalls = false;

client.on("call", async (call) => {
  const logGroup = await client.getChatById(LOG_GROUP_ID);
  await logGroup.sendMessage(
    `[${call.fromMe ? "Outgoing" : "Incoming"}] Phone call from ${call.from}, type ${call.isGroup ? "group" : ""} ${call.isVideo ? "video" : "audio"} call. ${
      rejectCalls ? "This call was automatically rejected by the script." : ""
    }`
  );
});

client.on("disconnected", (reason) => {
  console.log("Client was logged out", reason);
});

// client.on("contact_changed", async (message, oldId, newId, isContact) => {
//   /** The time the event occurred. */
//   const eventTime = new Date(message.timestamp * 1000).toLocaleString();

//   console.log(
//     `The contact ${oldId.slice(0, -5)}` +
//       `${!isContact ? " that participates in group " + `${(await client.getChatById(message.to ?? message.from)).name} ` : " "}` +
//       `changed their phone number\nat ${eventTime}.\n` +
//       `Their new phone number is ${newId.slice(0, -5)}.\n`
//   );

//   /**
//    * Information about the {@name message}:
//    *
//    * 1. If a notification was emitted due to a group participant changing their phone number:
//    * {@name message.author} is a participant's id before the change.
//    * {@name message.recipients[0]} is a participant's id after the change (a new one).
//    *
//    * 1.1 If the contact who changed their number WAS in the current user's contact list at the time of the change:
//    * {@name message.to} is a group chat id the event was emitted in.
//    * {@name message.from} is a current user's id that got an notification message in the group.
//    * Also the {@name message.fromMe} is TRUE.
//    *
//    * 1.2 Otherwise:
//    * {@name message.from} is a group chat id the event was emitted in.
//    * {@name message.to} is @type {undefined}.
//    * Also {@name message.fromMe} is FALSE.
//    *
//    * 2. If a notification was emitted due to a contact changing their phone number:
//    * {@name message.templateParams} is an array of two user's ids:
//    * the old (before the change) and a new one, stored in alphabetical order.
//    * {@name message.from} is a current user's id that has a chat with a user,
//    * whos phone number was changed.
//    * {@name message.to} is a user's id (after the change), the current user has a chat with.
//    */
// });

// client.on("group_admin_changed", (notification) => {
//   if (notification.type === "promote") {
//     /**
//      * Emitted when a current user is promoted to an admin.
//      * {@link notification.author} is a user who performs the action of promoting/demoting the current user.
//      */
//     console.log(`You were promoted by ${notification.author}`);
//   } else if (notification.type === "demote")
//     /** Emitted when a current user is demoted to a regular user. */
//     console.log(`You were demoted by ${notification.author}`);
// });
