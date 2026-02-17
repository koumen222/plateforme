/**
 * Données des leçons
 */
export const lessons = [
    {
        id: 1,
        path: '/',
        title: 'JOUR 1 - Introduction',
        badge: 'JOUR 1',
        meta: 'Formation Andromeda',
        video: {
            type: 'youtube',
            url: 'https://www.youtube.com/embed/_FEzE2vdu_k?rel=0&modestbranding=1&playsinline=1'
        },
        summary: {
            text: `Bienvenue dans la formation Andromeda ! Cette méthode révolutionnaire vous permettra 
            de créer des campagnes Facebook Ads performantes qui génèrent des ventes. Dans ce premier 
            jour, vous découvrirez les fondamentaux de la méthode et comment structurer votre approche 
            pour maximiser vos résultats.`,
            points: [
                'Découvrir la méthode Andromeda',
                'Comprendre la structure d\'une campagne performante',
                'Préparer votre stratégie de lancement',
                'Apprendre les bases du système de test',
                'Maîtriser l\'approche progressive de scaling'
            ]
        },
        resources: [
            {
                icon: '📄',
                title: 'Andromeda - Jour des créas',
                type: 'PDF',
                link: '/assets/docs/andromeda-jour-des-creas.pdf',
                download: true
            }
        ]
    },
    {
        id: 2,
        path: '/jour-2',
        title: 'JOUR 2 - La structure d\'une campagne qui nourrit Andromeda',
        badge: 'JOUR 2',
        meta: 'Structure de campagne',
        video: {
            type: 'vimeo',
            url: 'https://player.vimeo.com/video/1151322854?h=6c8b3c8c5d&title=0&byline=0&portrait=0'
        },
        summary: {
            text: `Aujourd'hui, vous allez découvrir la structure complète d'une campagne Andromeda. 
            Cette méthode révolutionnaire vous permettra de créer des campagnes qui génèrent 
            des ventes de manière prévisible et scalable.`,
            points: [
                'Comprendre les principes fondamentaux de la méthode Andromeda',
                'Découvrir la structure d\'une campagne qui convertit',
                'Apprendre comment nourrir l\'algorithme Facebook efficacement',
                'Maîtriser les éléments clés d\'une campagne performante',
                'Préparer votre stratégie de test et d\'optimisation'
            ]
        },
        resources: [
            {
                icon: '🎓',
                title: 'Formation Comote Sora 2',
                type: 'Lien vers la formation',
                link: '#',
                download: false
            }
        ]
    },
    {
        id: 3,
        path: '/jour-3',
        title: 'JOUR 3 - Créer la créative Andromeda',
        badge: 'JOUR 3',
        meta: 'Création de la vidéo',
        videos: [
            {
                title: 'Creative avec Sora 2',
                type: 'youtube',
                url: 'https://www.youtube.com/embed/gdG0xjuF7SQ?rel=0&modestbranding=1&playsinline=1'
            },
            {
                title: 'Créative avec Eleven Labs',
                type: 'youtube',
                url: 'https://www.youtube.com/embed/cB2191wZW0U?rel=0&modestbranding=1&playsinline=1'
            }
        ],
        summary: {
            text: `Aujourd'hui, vous allez créer la créative Andromeda, le cœur de votre campagne. 
            Cette vidéo verticale doit captiver votre audience dès les premières secondes et suivre 
            une structure précise pour maximiser les conversions.`,
            points: [
                '🎬 Vidéo verticale 9:16 – Durée : 20 à 30 secondes',
                '🎣 Hook fort dans les 2 premières secondes pour captiver immédiatement',
                '📐 Structure : Problème → Révélation → Preuve → Promesse → CTA',
                '✨ Optimiser chaque élément pour maximiser l\'engagement',
                '🎯 Créer une vidéo qui convertit efficacement'
            ]
        },
        resources: [
            {
                icon: '📄',
                title: 'Guide de création de campagne',
                type: 'PDF • 4.2 MB',
                link: '/assets/docs/guide-creation-campagne.pdf',
                download: true
            },
            {
                icon: '📝',
                title: 'Formules de copywriting',
                type: 'PDF • 1.8 MB',
                link: '/assets/docs/formules-copywriting.pdf',
                download: true
            }
        ]
    },
    {
        id: 4,
        path: '/jour-4',
        title: 'JOUR 4 - Paramétrer le compte publicitaire',
        badge: 'JOUR 4',
        meta: 'Configuration du compte',
        videos: [
            {
                title: 'Paramétrage du compte publicitaire en HK',
                type: 'vimeo',
                url: 'https://player.vimeo.com/video/1151323764?h=6c8b3c8c5d&title=0&byline=0&portrait=0'
            },
            {
                title: 'Création du Business Manager',
                type: 'youtube',
                url: 'https://www.youtube.com/embed/oSxNPBI_ytY?rel=0&modestbranding=1&playsinline=1'
            },
            {
                title: 'Pixel',
                type: 'youtube',
                url: 'https://www.youtube.com/embed/84UWseE3uQo?rel=0&modestbranding=1&playsinline=1'
            }
        ],
        summary: {
            text: `Aujourd'hui, vous allez paramétrer correctement votre compte publicitaire Facebook. 
            Cette configuration est essentielle pour que vos campagnes fonctionnent de manière 
            optimale et que vous puissiez suivre précisément vos conversions.`,
            points: [
                '💰 Devise : HKD – Dollar Hong Kong',
                '💳 Ajouter la carte bancaire au compte',
                '💵 Créditer 25 $ (budget pour 5 jours à 5$/jour)',
                '📊 Installer le Pixel Meta sur votre site web',
                '🎯 Configurer l\'événement Purchase (achat) dans le Pixel',
                '✅ Vérifier que le tracking fonctionne correctement'
            ]
        },
        resources: [
            {
                icon: '📄',
                title: 'Dictionnaire des métriques',
                type: 'PDF • 2.8 MB',
                link: '/assets/docs/dictionnaire-metriques.pdf',
                download: true
            },
            {
                icon: '📊',
                title: 'Template de reporting',
                type: 'XLSX • 1.5 MB',
                link: '/assets/docs/template-reporting.xlsx',
                download: true
            }
        ]
    },
    {
        id: 5,
        path: '/jour-5',
        title: 'JOUR 5 - Lancement',
        badge: 'JOUR 5',
        meta: 'Activation de la campagne',
        video: {
            type: 'vimeo',
            url: 'https://player.vimeo.com/video/1151379720?h=6c8b3c8c5d&title=0&byline=0&portrait=0'
        },
        summary: {
            text: `Le moment est venu ! Aujourd'hui, vous allez lancer votre campagne Andromeda. 
            Cette étape est simple mais cruciale : vous devez activer la campagne et laisser 
            l'algorithme faire son travail sans intervention.`,
            points: [
                '🚀 Activer la campagne préparée hier',
                '⚠️ Ne rien modifier - Laisser l\'algorithme apprendre',
                '👀 Observer uniquement les ventes générées',
                '📊 Noter les premiers résultats sans intervenir',
                '⏳ Laisser tourner au moins 24h sans modification'
            ]
        },
        resources: [
            {
                icon: '📄',
                title: 'Guide de démarrage',
                type: 'PDF • 2.5 MB',
                link: '/assets/docs/guide-demarrage.pdf',
                download: true
            },
            {
                icon: '📊',
                title: 'Checklist de campagne',
                type: 'PDF • 1.2 MB',
                link: '/assets/docs/checklist-campagne.pdf',
                download: true
            }
        ]
    },
    {
        id: 6,
        path: '/jour-6',
        title: 'JOUR 6 - Analyse et optimisation',
        badge: 'JOUR 6',
        meta: 'Analyse des premiers résultats',
        video: {
            type: 'vimeo',
            url: 'https://player.vimeo.com/video/148751763'
        },
        summary: {
            text: `Après 2 jours de lancement, il est temps d'analyser les premiers résultats. 
            Cette phase d'apprentissage est cruciale : vous allez observer ce qui fonctionne 
            et ce qui ne fonctionne pas, sans pour autant intervenir prématurément.`,
            points: [
                '⚠️ Ne couper aucune publicité à ce stade',
                '📝 Noter : Les adsets qui génèrent des achats',
                '📝 Noter : Les adsets complètement ignorés (0 engagement)',
                '📊 Analyser les métriques sans modifier',
                '⏳ Laisser l\'algorithme continuer son apprentissage',
                '📈 Observer les tendances émergentes'
            ]
        },
        resources: [
            {
                icon: '📄',
                title: 'Livre blanc stratégies avancées',
                type: 'PDF • 5.2 MB',
                link: '/assets/docs/livre-blanc-strategies.pdf',
                download: true
            },
            {
                icon: '📊',
                title: 'Exemples de funnel complets',
                type: 'PDF • 3.8 MB',
                link: '/assets/docs/exemples-funnel.pdf',
                download: true
            }
        ]
    },
    {
        id: 7,
        path: '/jour-7',
        title: 'JOUR 7 - Mini Scaling',
        badge: 'JOUR 7',
        meta: 'Première optimisation',
        video: {
            type: 'vimeo',
            url: 'https://player.vimeo.com/video/148751763'
        },
        summary: {
            text: `Après 3 jours d'observation, il est temps de faire votre première optimisation. 
            Cette étape de mini scaling vous permettra d'éliminer les adsets morts et d'augmenter 
            progressivement le budget de votre campagne performante.`,
            points: [
                '✂️ Couper uniquement les adsets totalement morts (0 engagement, 0 résultat)',
                '📈 Augmenter le budget de la campagne de +20 % maximum',
                '⚠️ Ne pas modifier les adsets qui génèrent des résultats',
                '💰 Maintenir un budget raisonnable pour continuer l\'apprentissage',
                '📊 Observer l\'impact de ces modifications sur les performances',
                '⏳ Laisser tourner 24h avant toute nouvelle modification'
            ]
        },
        resources: [
            {
                icon: '📄',
                title: 'Guide de scaling progressif',
                type: 'PDF • 2.8 MB',
                link: '/assets/docs/guide-scaling.pdf',
                download: true
            },
            {
                icon: '📊',
                title: 'Template d\'optimisation',
                type: 'XLSX • 1.2 MB',
                link: '/assets/docs/template-optimisation.xlsx',
                download: true
            }
        ]
    },
    {
        id: 8,
        path: '/jour-8',
        title: 'JOUR 8 - Réservation Coaching',
        badge: 'JOUR 8',
        meta: 'Analyse stratégique',
        isCoaching: true
    }
];
