import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { connectDB } from "./config/database.js";
import authRoutes from "./routes/auth.js";
import videoRoutes from "./routes/videos.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());

// Routes
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Route de test pour vérifier que le serveur répond
app.get("/api/test", (req, res) => {
  res.json({ message: "API backend fonctionne", timestamp: new Date().toISOString() });
});

// Routes d'authentification
app.use("/api", authRoutes);

// Routes protégées (vidéos)
app.use("/api", videoRoutes);

// Route chatbot
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await response.json();
    res.json({ reply: data.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "OpenAI error" });
  }
});

const PORT = process.env.PORT || 3000;

// Démarrer le serveur après la connexion MongoDB
const startServer = async () => {
  try {
    // Connexion MongoDB
    await connectDB();
    
    // Démarrer le serveur Express
    app.listen(PORT, () => {
      console.log(`🚀 Backend running on port ${PORT}`);
      console.log(`📡 API disponible sur http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Impossible de démarrer le serveur:', error);
    process.exit(1);
  }
};

startServer();
