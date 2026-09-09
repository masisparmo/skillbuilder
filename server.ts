import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt, systemInstruction, schema, apiKey: bodyKey } = req.body;
      const headerKey = req.headers["x-api-key"] as string | undefined;
      const effectiveApiKey = bodyKey || headerKey || process.env.GEMINI_API_KEY;

      if (!effectiveApiKey || typeof effectiveApiKey !== 'string' || effectiveApiKey.trim().length === 0) {
        return res.status(400).json({
          error: "Gemini API Key belum dimasukkan. Silakan masukkan API Key Anda di menu pengaturan."
        });
      }

      const ai = new GoogleGenAI({ apiKey: effectiveApiKey.trim() });
      
      const config: any = {};
      if (systemInstruction) config.systemInstruction = { parts: [{ text: systemInstruction }] };
      if (schema) {
        config.responseMimeType = "application/json";
        config.responseSchema = schema;
      }
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: config
      });
      
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      const errorMessage = error?.message || "Terjadi kesalahan saat memanggil Gemini API.";
      res.status(500).json({ error: errorMessage });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
