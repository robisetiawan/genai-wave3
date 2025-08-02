import "dotenv/config";
import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import cors from "cors";
import multer from "multer";
import fs from "fs/promises";
import { GoogleGenAI } from "@google/genai";

const extractGeneratedText = (data) => {
  try {
    const text =
      data?.response?.candidates?.[0]?.content?.parts?.[0]?.text ??
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      data?.response?.candidates?.[0]?.content?.text;

    return text ?? JSON.stringify(data, null, 2);
  } catch (err) {
    console.error("Galat ketika mengambil text:", err);
    return JSON.stringify(data, null, 2);
  }
};

const app = express();
const upload = multer();

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_PORT = 3000;

const modelMapper = {
  flash: "gemini-2.5-flash",
  "flash-lite": "gemini-2.5-flash-lite",
  pro: "gemini-2.5-pro",
};

// helper function
const determineGeminiModel = (key) => {
  return modelMapper[key] ?? DEFAULT_GEMINI_MODEL;
};

// memanggil class menjadi sebuah instance
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_STUDIO_API_KEY,
});

app.use(cors());
// memanggil middleware untuk bisa terima header dengan Content-Type: application/json
app.use(express.json());
app.use(express.static(path.join(_dirname, "public")));

// routing
app.post("/generate-text", async (req, res) => {
  try {
    // destructuring
    // const { prompt } = req.body;

    const prompt = req.body?.prompt;
    console.log(req.body);
    if (!prompt) {
      res.status(400).json({ message: "Belum ada prompt diisi!" });
      return;
    }

    const aiResponse = await ai.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: prompt,
    });

    res.json({ result: extractGeneratedText(aiResponse) });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

app.post("/chat", async (req, res) => {
  try {
    if (!req.body) {
      return res.json(400, "Invalid request body!");
    }
    const { messages } = req.body;

    if (!messages) {
      return res.json(400, "Pesannya masih kosong nih!");
    }

    const payload = messages.map((msg) => {
      return {
        role: msg.role,
        parts: [{ text: msg.content }],
      };
    });

    const aiResponse = await ai.models.generateContent({
      model: determineGeminiModel("pro"),
      contents: payload,
      config: {
        systemInstruction: "Anda adalah chatter terhandal.",
      },
    });

    res.json({ reply: extractGeneratedText(aiResponse) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post(
  "/generate-text-from-image",
  upload.single("image"),
  async (req, res) => {
    try {
      const prompt = req.body.prompt;

      if (!prompt) {
        res.status(400).json({ message: "Belum ada prompt diisi!" });
        return;
      }

      const file = req.file;

      if (!file) {
        res.status(400).json({ message: "File image harus diupload!" });
        return;
      }

      const imgBase64 = file.buffer.toString("base64");

      const aiResponse = await ai.models.generateContent({
        model: DEFAULT_GEMINI_MODEL,
        contents: [
          { text: prompt },
          { inlineData: { mimeType: file.mimetype, data: imgBase64 } },
        ],
      });

      res.json({ result: extractGeneratedText(aiResponse) });
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

app.listen(DEFAULT_PORT, () => {
  console.log("Ada server");
  console.log(`Buka di sini : http://localhost:${DEFAULT_PORT}`);
});
