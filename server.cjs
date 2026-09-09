var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt, systemInstruction, schema, apiKey: bodyKey } = req.body;
      const headerKey = req.headers["x-api-key"];
      const effectiveApiKey = bodyKey || headerKey || process.env.GEMINI_API_KEY;
      if (!effectiveApiKey || typeof effectiveApiKey !== "string" || effectiveApiKey.trim().length === 0) {
        return res.status(400).json({
          error: "Gemini API Key belum dimasukkan. Silakan masukkan API Key Anda di menu pengaturan."
        });
      }
      const ai = new import_genai.GoogleGenAI({ apiKey: effectiveApiKey.trim() });
      const config = {};
      if (systemInstruction) config.systemInstruction = { parts: [{ text: systemInstruction }] };
      if (schema) {
        config.responseMimeType = "application/json";
        config.responseSchema = schema;
      }
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config
      });
      res.json({ text: response.text });
    } catch (error) {
      console.error("Gemini API Error:", error);
      const errorMessage = error?.message || "Terjadi kesalahan saat memanggil Gemini API.";
      res.status(500).json({ error: errorMessage });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
