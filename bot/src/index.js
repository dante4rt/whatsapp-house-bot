import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
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

        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.imageMessage?.caption ||
          "";

        if (!text) continue;

        const sender = msg.key.participant || msg.key.remoteJid;
        const senderName = msg.pushName || sender.split("@")[0];

        console.log(
          `\n[${groupMeta.subject}] ${senderName}: ${text.substring(0, 100)}${
            text.length > 100 ? "..." : ""
          }`
        );

        // Send to n8n webhook
        const webhookUrl = process.env.WEBHOOK_URL;
        if (webhookUrl) {
          try {
            await fetch(webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                group: groupMeta.subject,
                sender: senderName,
                text,
                timestamp: msg.messageTimestamp,
              }),
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
