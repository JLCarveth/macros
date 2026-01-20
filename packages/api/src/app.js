import express from "express";
import {
  LlamaChatSession,
  LlamaContext,
  LlamaJsonSchemaGrammar,
  LlamaModel,
} from "node-llama-cpp";
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import Tesseract from "tesseract.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initializeServer() {
  try {
    const model = new LlamaModel({
      modelPath: path.join(__dirname, "..", "models", "rocket-3b.Q2_K.gguf"),
      contextSize: 1024,
      batchSize: 2048,
    });

    const context = new LlamaContext({ model });
    const grammar = new LlamaJsonSchemaGrammar(nutritionSchema);

    // Set up multer for file uploads
    const upload = multer({ storage: multer.memoryStorage() });

    // Create Tesseract worker
    const worker = await Tesseract.createWorker("eng", 1, {
      langPath: path.join(__dirname, "..", "models", "tessdata")
    });

    app.get("/version", (req, res) => {
      return res.json({ version: process.env["npm_package_version"] });
    });

    app.post("/analyze-nutrition", upload.single("image"), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No image file uploaded" });
        }

        const logTimings = process.env.LOG_TIMINGS === "true";
        if (logTimings) console.time("Total Request Time");
        if (logTimings) console.time("Image Processing Time");

        const image = await sharp(req.file.buffer)
          .resize(800)
          .toBuffer();

        if (!image) {
          console.error("No image...");
          return res.status(500).json({ error: "Image processing failed" });
        }

        if (logTimings) console.timeEnd("Image Processing Time");
        if (logTimings) console.time("OCR Time");

        const { data: { text } } = await worker.recognize(image, {
          tessedit_pageseg_mode: "6",
          tessedit_ocr_engine_mode: "1",
        });
        console.log(text);

        if (logTimings) console.timeEnd("OCR Time");
        if (logTimings) console.time("Text Truncation Time");

        const maxTextLength = 1000;
        const truncatedText = text.slice(0, maxTextLength);

        if (logTimings) console.timeEnd("Text Truncation Time");
        if (logTimings) console.time("Model Inference Time");

        const prompt = `Analyze the nutritional facts table in this text and provide the information in a structured format:\n${truncatedText}`;
        const session = new LlamaChatSession({ context });

        const result = await session.prompt(prompt, {
          grammar,
          maxTokens: context.getContextSize(),
        });

        console.log(JSON.stringify(result));
        const parsedResult = grammar.parse(result);

        if (logTimings) console.timeEnd("Model Inference Time");
        if (logTimings) console.timeEnd("Total Request Time");

        res.json(parsedResult);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred during analysis" });
      }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });

    // Cleanup on shutdown
    process.on("SIGINT", async () => {
      if (worker) {
        await worker.terminate();
      }
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Don't forget to include the nutritionSchema definition here
const nutritionSchema = {
  type: "object",
  properties: {
    servingSize: {
      type: "object",
      properties: {
        value: { type: "number" },
        unit: { type: "string", enum: ["g", "ml"] },
      },
      required: ["value", "unit"],
    },
    calories: {
      type: "object",
      properties: {
        value: { type: "number" },
        unit: { type: "string", enum: ["kcal"] },
      },
      required: ["value", "unit"],
    },
    totalFat: {
      type: "object",
      properties: {
        value: { type: "number" },
        unit: { type: "string", enum: ["g"] },
      },
      required: ["value", "unit"],
    },
    carbohydrates: {
      type: "object",
      properties: {
        value: { type: "number" },
        unit: { type: "string", enum: ["g"] },
      },
      required: ["value", "unit"],
    },
    fiber: {
      type: "object",
      properties: {
        value: { type: "number" },
        unit: { type: "string", enum: ["g"] },
      },
      required: ["value", "unit"],
    },
    sugars: {
      type: "object",
      properties: {
        value: { type: "number" },
        unit: { type: "string", enum: ["g"] },
      },
      required: ["value", "unit"],
    },
    protein: {
      type: "object",
      properties: {
        value: { type: "number" },
        unit: { type: "string", enum: ["g"] },
      },
      required: ["value", "unit"],
    },
    cholesterol: {
      type: "object",
      properties: {
        value: { type: "number" },
        unit: { type: "string", enum: ["mg"] },
      },
      required: ["value", "unit"],
    },
    sodium: {
      type: "object",
      properties: {
        value: { type: "number" },
        unit: { type: "string", enum: ["mg"] },
      },
      required: ["value", "unit"],
    },
  },
  required: ["servingSize", "calories", "totalFat", "protein", "carbohydrates"],
};

initializeServer();
