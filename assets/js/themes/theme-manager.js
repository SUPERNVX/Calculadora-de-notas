/**
 * Gerenciador de temas para a Calculadora de Notas
 */

// Temas disponíveis
const themes = {
    default: {
        name: 'Padrão',
        file: 'assets/css/themes/default-theme.css'
    },
    modern: {
        name: 'Moderno',
        file: 'assets/css/themes/modern-theme.css'
    },
    retrowave: {
        name: 'Retrowave',
        file: 'assets/css/themes/retrowave-theme.css'
    },
    soft_ui: {
        name: 'Soft UI',
        file: 'assets/css/themes/soft-ui-theme.css'
    },
    vaporwave: {
        name: 'Vaporwave',
        file: 'assets/css/themes/vaporwave-theme.css'
    },
};

// Tema atual
let currentTheme = localStorage.getItem('selectedTheme') || 'default';

// Elemento de link para o CSS do tema
let themeLink = null;

// Inicializa o gerenciador de temas
function initThemeManager() {
    // Criar elemento link para o CSS do tema
    themeLink = document.createElement('link');
    themeLink.rel = 'stylesheet';
    themeLink.id = 'theme-style';
    document.head.appendChild(themeLink);

    // Aplicar tema salvo ou padrão
    applyTheme(currentTheme);

    // Configurar o seletor de temas
    setupThemeSelector();
}

// Aplicar um tema específico
function applyTheme(themeName) {
    if (!themes[themeName]) {
        console.error(`Tema "${themeName}" não encontrado.`);
        themeName = 'default';
    }

    // Atualizar o link para o CSS do tema
    themeLink.href = themes[themeName].file;
    
    // Salvar a preferência do usuário
    localStorage.setItem('selectedTheme', themeName);
    currentTheme = themeName;
    
    // Atualizar a interface do seletor
    updateThemeSelectorUI();
    
    // Mostrar notificação
    if (typeof showToast === 'function') {
        showToast(`Tema ${themes[themeName].name} aplicado!`, 'success');
    }
}

// Configurar o seletor de temas
function setupThemeSelector() {
    const themeSelector = document.getElementById('theme-selector');
    const themeDropdown = document.getElementById('theme-dropdown');
    
    if (!themeSelector || !themeDropdown) return;
    
    // Preencher o dropdown com as opções de tema
    Object.keys(themes).forEach(themeKey => {
        const themeOption = document.createElement('div');
        themeOption.className = `theme-option theme-${themeKey}`;
        themeOption.dataset.theme = themeKey;
        
        const colorPreview = document.createElement('div');
        colorPreview.className = 'theme-color-preview';
        
        // Adicionar 3 bolinhas de cor para representar o tema
        for (let i = 0; i < 3; i++) {
            const colorDot = document.createElement('div');
            colorDot.className = 'theme-color-dot';
            colorPreview.appendChild(colorDot);
        }
        
        themeOption.appendChild(colorPreview);
        
        const themeName = document.createElement('span');
        themeName.textContent = themes[themeKey].name;
        themeOption.appendChild(themeName);
        
        themeOption.addEventListener('click', () => {
            applyTheme(themeKey);
            themeDropdown.classList.remove('show');
        });
        
        themeDropdown.appendChild(themeOption);
    });
    
    // Abrir/fechar o dropdown
    themeSelector.addEventListener('click', (e) => {
        e.stopPropagation();
        themeDropdown.classList.toggle('show');
    });
    
    // Fechar o dropdown ao clicar fora dele
    document.addEventListener('click', () => {
        themeDropdown.classList.remove('show');
    });
    
    // Impedir que cliques dentro do dropdown fechem o dropdown
    themeDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Atualizar a interface do seletor
    updateThemeSelectorUI();
}

// Atualizar a interface do seletor de temas
function updateThemeSelectorUI() {
    const themeOptions = document.querySelectorAll('.theme-option');
    
    themeOptions.forEach(option => {
        if (option.dataset.theme === currentTheme) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initThemeManager);