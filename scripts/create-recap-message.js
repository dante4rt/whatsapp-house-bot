// Filter today's properties and create recap message
const items = $input.all();
const today = new Date().toLocaleDateString("id-ID");

// Filter today's entries
const todayProperties = items.filter(
  (item) => item.json.Date === today || item.json["Date"] === today
);

if (todayProperties.length === 0) {
  return { hasData: false, message: "Tidak ada properti baru hari ini." };
}

// Build recap message
let message = `📊 *REKAP PROPERTI HARI INI*\n`;
message += `📅 ${today}\n\n`;
message += `🏠 *${todayProperties.length} properti baru ditambahkan:*\n\n`;

todayProperties.forEach((prop, index) => {
  const p = prop.json;
  message += `━━━━━━━━━━━━━━━━\n`;
  message += `*${index + 1}. ${p["Property Name"] || "Unnamed"}*\n`;
  if (p.Developer) message += `🏗️ ${p.Developer}\n`;
  if (p["LB (m2)"] || p["LT (m2)"]) {
    message += `📐 LB/LT: ${p["LB (m2)"] || "-"}/${p["LT (m2)"] || "-"} m²\n`;
  }
  if (p.Bedrooms || p.Bathrooms) {
    message += `🛏️ ${p.Bedrooms || "-"} KT / ${p.Bathrooms || "-"} KM\n`;
  }
  if (p.Price) message += `💰 ${p.Price}\n`;
  if (p.DP && p.DP !== "") message += `💵 DP: ${p.DP}\n`;
  if (p.Monthly && p.Monthly !== "") message += `📆 Cicilan: ${p.Monthly}\n`;
  if (p["Video URL"] && p["Video URL"] !== "")
    message += `🎬 ${p["Video URL"]}\n`;
  if (p.Location && p.Location !== "") message += `📍 ${p.Location}\n`;
  message += `👤 by ${p.Sender}\n`;
});

message += `\n━━━━━━━━━━━━━━━━\n`;
message += `📋 *Total database: ${items.length} properti*`;

return {
  hasData: true,
  message: message,
  count: todayProperties.length,
  totalCount: items.length,
};
