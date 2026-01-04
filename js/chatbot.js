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

    // Clé API OpenAI - À remplacer par votre clé API
    const OPENAI_API_KEY = 'VOTRE_CLE_API_OPENAI_ICI';
    const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

    // Historique de conversation avec contexte complet de la formation
    let conversationHistory = [
        {
            role: "system",
            content: `Tu es un assistant expert en formation Facebook Ads et méthode Andromeda. Tu as accès à tout le contenu détaillé de la formation. Réponds de manière concise, professionnelle et en français.

CONTENU DE LA FORMATION ANDROMEDA :

JOUR 1 - INTRODUCTION :
Bienvenue dans la formation Andromeda ! Cette méthode révolutionnaire permet de créer des campagnes Facebook Ads performantes qui génèrent des ventes. Les fondamentaux incluent :
- Découvrir la méthode Andromeda
- Comprendre la structure d'une campagne performante
- Préparer votre stratégie de lancement
- Apprendre les bases du système de test
- Maîtriser l'approche progressive de scaling

JOUR 2 - LA STRUCTURE D'UNE CAMPAGNE QUI NOURRIT ANDROMEDA :
Découvrir la structure complète d'une campagne Andromeda qui génère des ventes de manière prévisible et scalable :
- Comprendre les principes fondamentaux de la méthode Andromeda
- Découvrir la structure d'une campagne qui convertit
- Apprendre comment nourrir l'algorithme Facebook efficacement
- Maîtriser les éléments clés d'une campagne performante
- Préparer votre stratégie de test et d'optimisation
- Structure de campagne : ANDROMEDA – VENTES – TEST HUMAIN
- Objectif : Conversions – Ventes site web
- Activer CBO (Campaign Budget Optimization)
- Budget : 5 $ / jour
- Créer 5 adsets Broad identiques avec la même vidéo
- Ne pas publier encore

JOUR 3 - CRÉER LA CRÉATIVE ANDROMEDA :
Créer la créative Andromeda, le cœur de votre campagne :
- Vidéo verticale 9:16 – Durée : 20 à 30 secondes
- Hook fort dans les 2 premières secondes pour captiver immédiatement
- Structure : Problème → Révélation → Preuve → Promesse → CTA
- Optimiser chaque élément pour maximiser l'engagement
- Créer une vidéo qui convertit efficacement
- Outils utilisés : Sora 2 et Eleven Labs pour la création

JOUR 4 - PARAMÉTRER LE COMPTE PUBLICITAIRE :
Configuration essentielle du compte publicitaire Facebook :
- Devise : HKD – Dollar Hong Kong
- Ajouter la carte bancaire au compte
- Créder 25 $ (budget pour 5 jours à 5$/jour)
- Installer le Pixel Meta sur votre site web
- Configurer l'événement Purchase (achat) dans le Pixel
- Vérifier que le tracking fonctionne correctement
- Créer le Business Manager
- Configurer le Pixel pour le tracking des conversions

JOUR 5 - LANCEMENT :
Activation de la campagne Andromeda :
- Activer la campagne préparée
- Ne rien modifier - Laisser l'algorithme apprendre
- Observer uniquement les ventes générées
- Noter les premiers résultats sans intervenir
- Laisser tourner au moins 24h sans modification

JOUR 6 - APPRENTISSAGE :
Analyse des premiers résultats après 2 jours :
- Ne couper aucune publicité à ce stade
- Noter : Les adsets qui génèrent des achats
- Noter : Les adsets complètement ignorés (0 engagement)
- Analyser les métriques sans modifier
- Laisser l'algorithme continuer son apprentissage
- Observer les tendances émergentes

JOUR 7 - MINI SCALING :
Première optimisation après 3 jours :
- Couper uniquement les adsets totalement morts (0 engagement, 0 résultat)
- Augmenter le budget de la campagne de +20 % maximum
- Ne pas modifier les adsets qui génèrent des résultats
- Maintenir un budget raisonnable pour continuer l'apprentissage
- Observer l'impact de ces modifications sur les performances
- Laisser tourner 24h avant toute nouvelle modification

JOUR 8 - RÉSERVATION COACHING :
Après avoir terminé la formation, les utilisateurs peuvent réserver une session de coaching personnalisée :
- Session de coaching individuelle pour optimiser les résultats
- Accompagnement dans la prise de décisions stratégiques
- Analyse personnalisée de leur campagne Andromeda
- Réponse aux questions spécifiques de chaque utilisateur
- Aide à l'optimisation et au scaling de leur campagne

PRINCIPES CLÉS DE LA MÉTHODE ANDROMEDA :
- Budget initial : 5 $ par jour pour la phase de test
- Ciblage : Broad (large) avec 5 adsets identiques
- CBO : Activé pour répartir automatiquement le budget
- Scaling : Progressif (+20% maximum par étape)
- L'algorithme doit apprendre sans intervention les premières 24h
- Ne couper que les adsets complètement morts
- Observer avant d'intervenir

Utilise ce contenu pour répondre précisément aux questions des utilisateurs sur la formation.`
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
            const response = await fetch(OPENAI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: conversationHistory,
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            const data = await response.json();

            // Supprimer le message de chargement
            removeLoadingMessage(loadingMessage);

            if (data.error) {
                addMessage('❌ Erreur : ' + data.error.message, 'bot');
                console.error('Erreur OpenAI:', data.error);
            } else if (data.choices && data.choices[0]) {
                const botResponse = data.choices[0].message.content;
                addMessage(botResponse, 'bot');
                conversationHistory.push({ role: 'assistant', content: botResponse });
            } else {
                addMessage('Désolé, je n\'ai pas pu générer de réponse.', 'bot');
            }
        } catch (error) {
            console.error('Erreur:', error);
            removeLoadingMessage(loadingMessage);
            addMessage('❌ Erreur de connexion. Vérifiez votre connexion internet et votre clé API OpenAI.', 'bot');
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
        content.textContent = text;

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        chatbotMessages.appendChild(messageDiv);

        // Scroll vers le bas
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

        return messageDiv;
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
