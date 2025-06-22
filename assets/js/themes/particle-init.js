/**
 * Inicialização do tsParticles para o tema Moderno
 */
document.addEventListener('DOMContentLoaded', () => {
    const initParticles = () => {
        // Apenas continua se a biblioteca tsParticles estiver carregada
        if (typeof tsParticles === 'undefined') return;

        const particlesContainer = document.getElementById('particles-js');
        if (!particlesContainer) return;

        const currentTheme = localStorage.getItem('selectedTheme');
        const particleInstance = tsParticles.domItem(0);

        if (currentTheme === 'modern') {
            // Se o tema for moderno e não houver partículas, crie-as
            if (!particleInstance) {
                tsParticles.load("particles-js", {
                    fpsLimit: 60,
                    interactivity: {
                        events: {
                            onHover: {
                                enable: true,
                                mode: "repulse",
                            },
                            resize: true,
                        },
                        modes: {
                            repulse: {
                                distance: 100,
                                duration: 0.4,
                            },
                        },
                    },
                    particles: {
                        color: {
                            value: "#ffffff",
                        },
                        links: {
                            color: "#ffffff",
                            distance: 150,
                            enable: true,
                            opacity: 0.1,
                            width: 1,
                        },
                        collisions: {
                            enable: true,
                        },
                        move: {
                            direction: "none",
                            enable: true,
                            outModes: {
                                default: "bounce",
                            },
                            random: false,
                            speed: 1,
                            straight: false,
                        },
                        number: {
                            density: {
                                enable: true,
                                area: 800,
                            },
                            value: 80,
                        },
                        opacity: {
                            value: 0.1,
                        },
                        shape: {
                            type: "circle",
                        },
                        size: {
                            value: { min: 1, max: 5 },
                        },
                    },
                    detectRetina: true,
                });
            }
        } else {
            // Se o tema não for moderno e houver partículas, destrua-as
            if (particleInstance) {
                particleInstance.destroy();
            }
        }
    };

    const setupObserver = () => {
        const themeLink = document.getElementById('theme-style');
        if (themeLink) {
            const observer = new MutationObserver(() => {
                initParticles();
            });
            observer.observe(themeLink, { attributes: true, attributeFilter: ['href'] });
            initParticles();
        } else {
            setTimeout(setupObserver, 50);
        }
    };

    setupObserver();
});