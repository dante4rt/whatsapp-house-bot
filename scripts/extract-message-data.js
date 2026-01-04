// Extract message data from Evolution API webhook
const input = $input.first().json;

let messageText = "";
let messageType = "text";
let mediaUrl = "";

const data = input.data || input;
const message = data.message || {};

// Extract text from different message types
if (message.conversation) {
  messageText = message.conversation;
} else if (message.extendedTextMessage) {
  messageText = message.extendedTextMessage.text || "";
  // Check for URLs
  if (message.extendedTextMessage.matchedText) {
    mediaUrl = message.extendedTextMessage.matchedText;
  }
} else if (message.imageMessage) {
  messageType = "image";
  messageText = message.imageMessage.caption || "[Image]";
} else if (message.videoMessage) {
  messageType = "video";
  messageText = message.videoMessage.caption || "[Video]";
} else if (message.documentMessage) {
  messageType = "document";
  messageText = message.documentMessage.fileName || "[Document]";
}

// Extract sender info
const remoteJid = data.key?.remoteJid || "";
const participant = data.key?.participant || data.key?.remoteJid || "";
const pushName = data.pushName || "Unknown";

// Extract URLs from message
const urlRegex = /(https?:\/\/[^\s]+)/gi;
const urls = messageText.match(urlRegex) || [];

// Check if message is property-related (Indonesian keywords)
const propertyKeywords = [
  "rumah",
  "house",
  "properti",
  "property",
  "harga",
  "price",
  "jual",
  "dp",
  "cicilan",
  "lb",
  "lt",
  "luas",
  "kamar",
  "km",
  "kt",
  "cluster",
  "type",
  "tipe",
  "subsidi",
  "kredit",
  "kpr",
  "booking",
  "fee",
  "simulasi",
  "perumahan",
  "developer",
  "mandi",
  "tidur",
  "lantai",
];

const isPropertyRelated =
  propertyKeywords.some((keyword) =>
    messageText.toLowerCase().includes(keyword)
  ) ||
  urls.some(
    (url) =>
      url.includes("tiktok") ||
      url.includes("youtube") ||
      url.includes("instagram") ||
      url.includes("youtu.be")
  );

return {
  timestamp: new Date().toISOString(),
  date: new Date().toLocaleDateString("id-ID"),
  sender: pushName,
  senderJid: participant,
  groupJid: remoteJid,
  messageType: messageType,
  messageText: messageText,
  urls: urls,
  hasUrl: urls.length > 0,
  isPropertyRelated: isPropertyRelated,
  rawMessage: message,
};
