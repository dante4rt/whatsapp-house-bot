import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
} from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";
import { config } from "dotenv";

config();

const GROUP_NAME = process.env.GROUP_NAME || "House Hunting";
const logger = pino({ level: "silent" });

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");
  const { version } = await fetchLatestBaileysVersion();

  console.log(`Using Baileys version: ${version.join(".")}`);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger,
    version,
    browser: ["House Bot", "Chrome", "120.0.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log("\n📱 Scan this QR code with WhatsApp:\n");
      qrcode.generate(qr, { small: true });
      console.log("\n");
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(
        "Connection closed:",
        lastDisconnect?.error?.message || "Unknown error"
      );
      console.log("Status code:", statusCode);
      console.log("Reconnecting:", shouldReconnect);

      if (shouldReconnect) setTimeout(startBot, 5000);
    }

    if (connection === "open") {
      console.log("✅ Connected to WhatsApp!");
      console.log(
        `📋 Listening for messages in groups containing: "${GROUP_NAME}"`
      );
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const isGroup = msg.key.remoteJid?.endsWith("@g.us");
      if (!isGroup) continue;

      try {
        const groupMeta = await sock.groupMetadata(msg.key.remoteJid);
        if (!groupMeta.subject.toLowerCase().includes(GROUP_NAME.toLowerCase()))
          continue;

        // Extract text from various message types
        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.imageMessage?.caption ||
          msg.message.videoMessage?.caption ||
          "";

        // Detect message type and media
        let messageType = "text";
        let mediaUrl = null;
        let imageBase64 = null;

        // Priority 1: Check for image (even with caption)
        if (msg.message.imageMessage) {
          messageType = "image";
          try {
            const buffer = await downloadMediaMessage(msg, "buffer", {});
            imageBase64 = buffer.toString("base64");
          } catch (e) {
            console.log("Failed to download image:", e.message);
          }
        }
        // Priority 2: Check for video (even with caption)
        else if (msg.message.videoMessage) {
          messageType = "video";
        }
        // Priority 3: Check for links in text (only if no image/video)
        else {
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const urls = text.match(urlRegex);
          if (urls && urls.length > 0) {
            mediaUrl = urls[0];
            if (
              mediaUrl.includes("tiktok.com") ||
              mediaUrl.includes("instagram.com") ||
              mediaUrl.includes("youtube.com")
            ) {
              messageType = "video_link";
            } else {
              messageType = "link";
            }
          }
        }

        // Skip if no useful content
        if (!text && !imageBase64) continue;

        const sender = msg.key.participant || msg.key.remoteJid;
        const senderName = msg.pushName || sender.split("@")[0];

        console.log(
          `\n[${
            groupMeta.subject
          }] ${senderName} (${messageType}): ${text.substring(0, 100)}${
            text.length > 100 ? "..." : ""
          }`
        );

        // Send to n8n webhook
        const webhookUrl = process.env.WEBHOOK_URL;
        if (webhookUrl) {
          try {
            const payload = {
              group: groupMeta.subject,
              sender: senderName,
              text,
              timestamp: msg.messageTimestamp,
              messageType,
              mediaUrl,
            };

            // Include base64 image if available
            if (imageBase64) {
              payload.imageBase64 = imageBase64;
            }

            await fetch(webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            console.log("✓ Sent to n8n");
          } catch (err) {
            console.log("✗ Failed to send to n8n:", err.message);
          }
        }
      } catch (err) {
        // Group metadata fetch failed, skip
      }
    }
  });
}

console.log("🏠 WhatsApp House Bot Starting...");
startBot();
