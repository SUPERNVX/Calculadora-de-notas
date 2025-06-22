// Funções para o modo colaborativo (compartilhamento)

// Função para gerar um link compartilhável
function generateLink() { // Renomeado para clareza
    // Obter os dados atuais
    const data = {
        year: DOM.yearSelector.value,
        subject: DOM.subjectSelector.value,
        goal: DOM.goalSelector.value,
        customGoal: DOM.customGoal.value,
        grades: {},
        shareDate: new Date().toISOString(),
        version: '1.0'
    };
    
    // Salvar todas as notas
    TRIMS.forEach(trim => {
        data.grades[trim] = {};
        GRADES.forEach(grade => {
            const input = getEl(`${trim}_${grade}`);
            if (input) {
                data.grades[trim][grade] = {
                    value: input.value,
                    isFixed: input.classList.contains('is-fixed')
                };
            }
        });
    });
    
    try {
        // Converter para string e codificar em base64
        const jsonData = JSON.stringify(data);
        const encodedData = btoa(encodeURIComponent(jsonData));
        
        // Criar o link compartilhável
        const shareLink = `${window.location.origin}${window.location.pathname}?share=${encodedData}`;
        
        // A lógica de cópia foi movida para o event listener do botão em script.js.
        // Esta função agora apenas gera e retorna o link.

        return shareLink;
    } catch (error) {
        console.error('Erro ao gerar link de compartilhamento:', error);
        showToast('Erro ao gerar link de compartilhamento', 'error');
        return null;
    }
}

// Função para verificar e carregar dados compartilhados da URL
function checkForSharedData() {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('share');
    
    if (sharedData) {
        try {
            // Decodificar os dados
            const jsonData = decodeURIComponent(atob(sharedData));
            const data = JSON.parse(jsonData);
            
            // Verificar se o arquivo é válido
            if (!data.grades || !data.year) {
                showToast('Dados compartilhados inválidos ou corrompidos!', 'error');
                return;
            }
            
            // Funções globais que precisam existir em script.js
            const requiredFuncs = ['clearAll', 'handleYearChange', 'updateFieldsVisibility', 'updateResults', 'saveDataToLocalStorage'];
            for (const funcName of requiredFuncs) {
                if (typeof window[funcName] !== 'function') {
                    console.error(`Função necessária "${funcName}" não encontrada no escopo global.`);
                    showToast('Erro ao carregar dados: a aplicação não está totalmente inicializada.', 'error');
                    return;
                }
            }

            // Limpar dados atuais
            window.clearAll();
            
            // Restaurar seleções
            DOM.yearSelector.value = data.year || '';
            window.handleYearChange();
            
            setTimeout(() => {
                DOM.subjectSelector.value = data.subject || '';
                window.updateFieldsVisibility();
            }, 100);
            
            if (data.goal) {
                DOM.goalSelector.value = data.goal;
                if (data.goal === 'custom' && data.customGoal) {
                    DOM.customGoal.style.display = 'block';
                    DOM.customGoal.classList.add('show-custom-goal');
                    DOM.customGoal.value = data.customGoal;
                }
            }
            
            // Restaurar notas
            if (data.grades) {
                setTimeout(() => {
                    TRIMS.forEach(trim => {
                        if (data.grades[trim]) {
                            GRADES.forEach(grade => {
                                if (data.grades[trim][grade]) {
                                    const input = getEl(`${trim}_${grade}`);
                                    const btn = document.querySelector(`[data-target-input="${trim}_${grade}"]`);
                                    
                                    if (input) {
                                        input.value = data.grades[trim][grade].value;
                                        
                                        if (data.grades[trim][grade].isFixed && btn) {
                                            input.classList.add('is-fixed');
                                            input.readOnly = true;
                                            btn.classList.add('fixed-active');
                                            btn.innerHTML = '<i class="fas fa-lock"></i> Fixado';
                                            btn.setAttribute('aria-pressed', 'true');
                                        }
                                    }
                                }
                            });
                        }
                    });
                    
                    // Calcular resultados após carregar os dados
                    window.updateResults();
                    window.saveDataToLocalStorage();
                    
                    // Mostrar notificação
                    const shareDate = new Date(data.shareDate);
                    const formattedDate = shareDate.toLocaleDateString() + ' ' + shareDate.toLocaleTimeString();
                    showToast(`Dados compartilhados carregados com sucesso! (Compartilhado em: ${formattedDate})`, 'success', 8000);
                    
                    // Limpar a URL para evitar recarregar os dados ao atualizar a página
                    window.history.replaceState({}, document.title, window.location.pathname);
                }, 200);
            }
            
        } catch (e) {
            console.error('Erro ao carregar dados compartilhados:', e);
            showToast('Erro ao carregar dados compartilhados. O link pode estar corrompido.', 'error');
        }
    }
}

// Exportar funções para uso global
window.Sharing = {
    generateLink: generateLink,
    checkSharedData: checkForSharedData
};