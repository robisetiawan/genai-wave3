import "dotenv/config";
import express from "express";
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
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_PORT = 3000;

// memanggil class menjadi sebuah instance
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_STUDIO_API_KEY,
});

// memanggil middleware untuk bisa terima header dengan Content-Type: application/json
app.use(express.json());

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
