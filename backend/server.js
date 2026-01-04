/**
 * Serveur backend pour le chatbot OpenAI
 * Résout les problèmes CORS
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration CORS - Permettre les requêtes depuis le frontend
const corsOptions = {
    origin: process.env.FRONTEND_URL || '*', // En production, spécifiez l'URL de votre frontend
    credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// Route pour l'API OpenAI
app.post('/api/chat', async (req, res) => {
    try {
        const { message, conversationHistory } = req.body;

        // Récupérer la clé API depuis les variables d'environnement
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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';

        if (!OPENAI_API_KEY || OPENAI_API_KEY === 'VOTRE_CLE_API_OPENAI_ICI') {
            return res.status(500).json({ 
                error: { message: 'Clé API OpenAI non configurée' } 
            });
        }

        // Utiliser axios au lieu de fetch pour la compatibilité
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4o-mini",
                messages: conversationHistory || [],
                temperature: 0.7,
                max_tokens: 500
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                }
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('Erreur:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ 
            error: { 
                message: error.response?.data?.error?.message || 'Erreur serveur: ' + error.message 
            } 
        });
    }
});

// Route de santé pour vérifier que le serveur fonctionne
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend API is running' });
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur backend démarré sur http://localhost:${PORT}`);
    console.log(`📡 API disponible sur http://localhost:${PORT}/api/chat`);
    console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});

