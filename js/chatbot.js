/**
 * ============================================
 * CHATBOT - Intégration OpenAI
 * ============================================
 */

(function() {
    'use strict';

    const chatbotToggle = document.getElementById('chatbotToggle');
    const chatbotContainer = document.getElementById('chatbotContainer');
    const chatbotClose = document.getElementById('chatbotClose');
    const chatbotMessages = document.getElementById('chatbotMessages');
    const chatbotInput = document.getElementById('chatbotInput');
    const chatbotSend = document.getElementById('chatbotSend');

    // URL de l'API backend - Utilise CONFIG si disponible
    // ⚠️ OBLIGATOIRE : CONFIG.BACKEND_URL doit être défini via window.CONFIG_BACKEND_URL
    const BACKEND_URL = (typeof CONFIG !== 'undefined' && CONFIG.BACKEND_URL) 
        ? CONFIG.BACKEND_URL 
        : (() => {
            console.error('❌ CONFIG.BACKEND_URL n\'est pas défini. Définissez window.CONFIG_BACKEND_URL dans votre HTML.');
            throw new Error('CONFIG.BACKEND_URL n\'est pas défini.');
        })();
    
    const API_URL = BACKEND_URL ? `${BACKEND_URL}/api/chat` : '/api/chat';

    // Historique de conversation avec contexte complet de la formation
    let conversationHistory = [
        {
            role: "system",
            content: "Tu es l'assistant officiel de la plateforme. Reponds en francais."
        }
    ];

    // Initialisation
    document.addEventListener('DOMContentLoaded', function() {
        initChatbot();
    });

    function initChatbot() {
        // Toggle chatbot
        chatbotToggle.addEventListener('click', function() {
            chatbotContainer.classList.toggle('open');
            if (chatbotContainer.classList.contains('open')) {
                chatbotInput.focus();
            }
        });

        // Fermer chatbot
        chatbotClose.addEventListener('click', function() {
            chatbotContainer.classList.remove('open');
        });

        // Fermer en cliquant en dehors
        document.addEventListener('click', function(e) {
            if (chatbotContainer.classList.contains('open') && 
                !chatbotContainer.contains(e.target) && 
                !chatbotToggle.contains(e.target)) {
                chatbotContainer.classList.remove('open');
            }
        });

        // Envoyer message avec bouton
        chatbotSend.addEventListener('click', sendMessage);

        // Envoyer message avec Entrée
        chatbotInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    async function sendMessage() {
        const message = chatbotInput.value.trim();
        
        if (!message) return;

        // Ajouter message utilisateur
        addMessage(message, 'user');
        conversationHistory.push({ role: 'user', content: message });

        // Vider l'input
        chatbotInput.value = '';
        chatbotSend.disabled = true;

        // Afficher un indicateur de chargement
        const loadingMessage = addLoadingMessage();

        try {

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    conversationHistory: conversationHistory
                })
            });

            // Vérifier si la réponse est OK
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                removeLoadingMessage(loadingMessage);
                
                if (response.status === 401) {
                    addMessage('❌ Erreur d\'authentification : Clé API invalide ou expirée. Vérifiez votre clé API OpenAI.', 'bot');
                } else if (response.status === 429) {
                    addMessage('❌ Trop de requêtes : Veuillez patienter quelques instants avant de réessayer.', 'bot');
                } else if (response.status === 403) {
                    addMessage('❌ Accès refusé : Problème CORS ou restrictions de votre clé API. Utilisez un backend pour contourner cette limitation.', 'bot');
                } else {
                    addMessage('❌ Erreur ' + response.status + ': ' + (errorData.error?.message || 'Erreur inconnue'), 'bot');
                }
                console.error('Erreur HTTP:', response.status, errorData);
                chatbotSend.disabled = false;
                chatbotInput.focus();
                return;
            }

            const data = await response.json();

            // Supprimer le message de chargement
            removeLoadingMessage(loadingMessage);

            if (data.error) {
                addMessage('❌ Erreur OpenAI : ' + data.error.message, 'bot');
                console.error('Erreur OpenAI:', data.error);
            } else if (data.choices && data.choices[0]) {
                const botResponse = data.choices[0].message.content;
                addMessage(botResponse, 'bot');
                conversationHistory.push({ role: 'assistant', content: botResponse });
            } else {
                addMessage('Désolé, je n\'ai pas pu générer de réponse.', 'bot');
            }
        } catch (error) {
            console.error('Erreur complète:', error);
            removeLoadingMessage(loadingMessage);
            
            // Messages d'erreur plus spécifiques
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                addMessage('❌ Erreur de connexion : Le serveur backend n\'est pas démarré. Lancez "npm start" dans un terminal pour démarrer le serveur.', 'bot');
            } else if (error.message) {
                addMessage('❌ Erreur : ' + error.message, 'bot');
            } else {
                addMessage('❌ Erreur de connexion. Vérifiez votre connexion internet et votre clé API OpenAI.', 'bot');
            }
        } finally {
            chatbotSend.disabled = false;
            chatbotInput.focus();
        }
    }

    function addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${type}`;

        const avatar = document.createElement('div');
        avatar.className = 'chatbot-avatar';
        avatar.textContent = type === 'user' ? '👤' : '🤖';

        const content = document.createElement('div');
        content.className = 'chatbot-content';
        if (type === 'bot') {
            content.innerHTML = renderMarkdown(text);
        } else {
            content.textContent = text;
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        chatbotMessages.appendChild(messageDiv);

        // Scroll vers le bas
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

        return messageDiv;
    }

    function renderMarkdown(text) {
        const safe = escapeHtml(text || '');
        return safe
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    function escapeHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function addLoadingMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chatbot-message bot loading-message';

        const avatar = document.createElement('div');
        avatar.className = 'chatbot-avatar';
        avatar.textContent = '🤖';

        const content = document.createElement('div');
        content.className = 'chatbot-content';
        content.textContent = '⏳ Réflexion en cours...';

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        chatbotMessages.appendChild(messageDiv);

        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

        return messageDiv;
    }

    function removeLoadingMessage(messageDiv) {
        if (messageDiv && messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }

})();
