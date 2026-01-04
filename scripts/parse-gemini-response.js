// Parse Gemini response and combine with original data
const input = $input.first().json;
const originalData = $("Extract Message Data").first().json;

let extractedData = {
  property_name: "",
  developer: "",
  lb: "",
  lt: "",
  bedrooms: "",
  bathrooms: "",
  price: "",
  dp: "",
  monthly: "",
  video_url: "",
  location: "",
  notes: "",
};

try {
  // Get text from Gemini response
  const responseText = input.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = responseText.trim();

  // Remove markdown code blocks if present
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  // Try to find JSON object in the response
  const jsonObjectMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    jsonStr = jsonObjectMatch[0];
  }

  // Parse JSON
  extractedData = JSON.parse(jsonStr);
} catch (error) {
  extractedData.notes =
    "Parse error - Raw: " + originalData.messageText.substring(0, 200);
}

// If no video_url extracted but we have URLs, use the first video URL
if (
  !extractedData.video_url &&
  originalData.urls &&
  originalData.urls.length > 0
) {
  const videoUrl = originalData.urls.find(
    (url) =>
      url.includes("tiktok") ||
      url.includes("youtube") ||
      url.includes("youtu.be") ||
      url.includes("instagram")
  );
  if (videoUrl) {
    extractedData.video_url = videoUrl;
  }
}

return {
  timestamp: originalData.timestamp,
  date: originalData.date,
  sender: originalData.sender,
  property_name: extractedData.property_name || "",
  developer: extractedData.developer || "",
  lb: extractedData.lb || "",
  lt: extractedData.lt || "",
  bedrooms: extractedData.bedrooms || "",
  bathrooms: extractedData.bathrooms || "",
  price: extractedData.price || "",
  dp: extractedData.dp || "",
  monthly: extractedData.monthly || "",
  video_url: extractedData.video_url || "",
  location: extractedData.location || "",
  notes: extractedData.notes || "",
  original_message: originalData.messageText,
};
