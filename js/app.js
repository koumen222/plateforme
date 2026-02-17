/**
 * ============================================
 * MINI LMS - JAVASCRIPT PRINCIPAL
 * Navigation, interactions et animations
 * ============================================
 */

(function() {
    'use strict';

    // ============================================
    // INITIALISATION
    // ============================================

    document.addEventListener('DOMContentLoaded', function() {
        initNavigation();
        initScrollBehavior();
        initMobileMenu();
        highlightActiveLesson();
        initSmoothScroll();
    });

    // ============================================
    // NAVIGATION ENTRE LEÇONS
    // ============================================

    function initNavigation() {
        const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
        
        sidebarLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                // Animation de transition
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
            });
        });
    }

    // ============================================
    // MISE EN ÉVIDENCE DE LA LEÇON ACTIVE
    // ============================================

    function highlightActiveLesson() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
        
        sidebarLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref === currentPage || 
                (currentPage === 'index.html' && linkHref === 'index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // ============================================
    // BOUTON LECON SUIVANTE
    // ============================================

    function initNextLessonButton() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const nextLessonBtn = document.querySelector('.next-lesson-btn');
        
        if (!nextLessonBtn) return;

        // Déterminer la prochaine leçon
        const lessons = ['index.html', 'lesson1.html', 'lesson2.html', 'lesson4.html', 'lesson5.html', 'lesson6.html', 'lesson7.html', 'lesson8.html'];
        const currentIndex = lessons.indexOf(currentPage);
        
        if (currentIndex < lessons.length - 1) {
            const nextLesson = lessons[currentIndex + 1];
            nextLessonBtn.href = nextLesson;
            nextLessonBtn.classList.remove('hidden');
        } else {
            // Dernière leçon
            nextLessonBtn.classList.add('hidden');
        }

        // Animation au clic
        nextLessonBtn.addEventListener('click', function(e) {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    }

    // Appeler après le chargement
    document.addEventListener('DOMContentLoaded', initNextLessonButton);

    // ============================================
    // SCROLL FLUIDE
    // ============================================

    function initSmoothScroll() {
        // Scroll fluide pour tous les liens d'ancrage
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#') return;
                
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // ============================================
    // COMPORTEMENT DU SCROLL
    // ============================================

    function initScrollBehavior() {
        let lastScrollTop = 0;
        const sidebar = document.querySelector('.sidebar');
        
        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Animation subtile de la sidebar au scroll
            if (sidebar) {
                if (scrollTop > lastScrollTop && scrollTop > 100) {
                    // Scroll vers le bas
                    sidebar.style.opacity = '0.95';
                } else {
                    // Scroll vers le haut
                    sidebar.style.opacity = '1';
                }
            }
            
            lastScrollTop = scrollTop;
        });
    }

    // ============================================
    // MENU MOBILE
    // ============================================

    function initMobileMenu() {
        const toggleBtn = document.querySelector('.mobile-menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        const overlay = createOverlay();

        if (!toggleBtn || !sidebar) return;

        toggleBtn.addEventListener('click', function() {
            sidebar.classList.toggle('open');
            if (sidebar.classList.contains('open')) {
                document.body.appendChild(overlay);
                document.body.style.overflow = 'hidden';
            } else {
                removeOverlay();
            }
        });

        // Fermer au clic sur l'overlay
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('open');
            removeOverlay();
        });

        // Fermer au clic sur un lien
        const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                    removeOverlay();
                }
            });
        });

        function createOverlay() {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 99;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            setTimeout(() => {
                overlay.style.opacity = '1';
            }, 10);
            return overlay;
        }

        function removeOverlay() {
            const overlay = document.querySelector('body > div[style*="position: fixed"]');
            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.remove();
                }, 300);
            }
            document.body.style.overflow = '';
        }
    }

    // ============================================
    // ANIMATION AU CHARGEMENT
    // ============================================

    window.addEventListener('load', function() {
        document.body.style.opacity = '0';
        setTimeout(() => {
            document.body.style.transition = 'opacity 0.3s ease';
            document.body.style.opacity = '1';
        }, 100);
    });

    // ============================================
    // GESTION DES TÉLÉCHARGEMENTS
    // ============================================

    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Animation de feedback
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });

})();

