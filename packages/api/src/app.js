import express from "express";
import multer from "multer";

const app = express();

// Configuration from environment
const LLM_API_URL = process.env.LLM_API_URL || "http://localhost:1234/v1";
const LLM_API_KEY = process.env.LLM_API_KEY || "lm-studio";
const LLM_MODEL = process.env.LLM_MODEL || "gpt-4o-mini";

const SYSTEM_PROMPT = `You are a nutrition label analyzer. Extract nutrition facts from the provided image and return ONLY valid JSON matching this schema:

{
  "servingSize": { "value": number, "unit": "g" | "ml" },
  "calories": { "value": number, "unit": "kcal" },
  "totalFat": { "value": number, "unit": "g" },
  "carbohydrates": { "value": number, "unit": "g" },
  "protein": { "value": number, "unit": "g" },
  "fiber": { "value": number, "unit": "g" },
  "sugars": { "value": number, "unit": "g" },
  "cholesterol": { "value": number, "unit": "mg" },
  "sodium": { "value": number, "unit": "mg" }
}

Required fields: servingSize, calories, totalFat, protein, carbohydrates.
Optional fields: fiber, sugars, cholesterol, sodium (omit if not visible).
Return ONLY the JSON object, no markdown or explanation.`;

async function analyzeWithVisionAPI(imageBuffer, mimeType) {
  const base64Image = imageBuffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64Image}`;

  const response = await fetch(`${LLM_API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the nutrition facts from this food label image.",
            },
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    console.error("LLM response:", JSON.stringify(data, null, 2));
    throw new Error("No response content from LLM");
  }

  // Parse JSON from response (handle potential markdown code blocks)
  let jsonStr = content.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
  }

  return JSON.parse(jsonStr);
}

function initializeServer() {
  const upload = multer({ storage: multer.memoryStorage() });

  app.get("/version", (req, res) => {
    return res.json({ version: process.env["npm_package_version"] });
  });

  app.post("/analyze-nutrition", upload.single("image"), async (req, res) => {
    const requestId = Date.now().toString(36);
    const timerLabel = `Request ${requestId}`;
    const logTimings = process.env.LOG_TIMINGS === "true";

    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file uploaded" });
      }

      if (logTimings) console.time(timerLabel);

      const result = await analyzeWithVisionAPI(req.file.buffer, req.file.mimetype);

      if (logTimings) console.timeEnd(timerLabel);

      res.json(result);
    } catch (error) {
      if (logTimings) console.timeEnd(timerLabel);
      console.error(error);
      res.status(500).json({ error: "An error occurred during analysis" });
    }
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Using LLM API: ${LLM_API_URL} with model: ${LLM_MODEL}`);
  });
}

initializeServer();
