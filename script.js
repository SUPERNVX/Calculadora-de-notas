// Tornar showToast disponível globalmente
let showToast;

document.addEventListener('DOMContentLoaded', () => {
    // Mostrar tela de carregamento
    const loadingScreen = document.getElementById('loading-screen');
    
    // Simular tempo de carregamento para melhor experiência do usuário
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 800);
    
    // Função para mostrar notificações toast
    showToast = (message, type = 'success', duration = 5000) => {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        toast.innerHTML = `
            <div class="toast-content">${message}</div>
            <button class="toast-close">&times;</button>
        `;
        
        toastContainer.appendChild(toast);
        
        // Mostrar o toast com animação
        setTimeout(() => {
            // Configurar evento de fechar
            const closeBtn = toast.querySelector('.toast-close');
            closeBtn.addEventListener('click', () => {
                toast.classList.add('hiding');
                setTimeout(() => {
                    toast.remove();
                }, 500);
            });
            
            // Auto-fechar após a duração
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.classList.add('hiding');
                    setTimeout(() => {
                        if (toast.parentNode) toast.remove();
                    }, 500);
                }
            }, duration);
        }, 100);
    };
    // Constantes
    const CONFIG = {
        SCHOOL_YEAR_EM3: 'em_3',
        PASSING_SUM_ANNUAL: 24.0,
        MIN_GRADE: 0,
        MAX_GRADE: 10,
        DEFAULT_WEIGHT: 1,
        THIRD_WEIGHT: 2, // Peso do terceiro trimestre
        HOW_TO_USE_VISIBLE_KEY: 'howToUseVisible', // Chave para o localStorage
        DEFAULT_TARGET: 6.0,
        EPSILON: 0.0001,
        THEME_KEY: 'theme'
    };
    
    // Tornar CONFIG disponível globalmente
    window.CONFIG = CONFIG;

    const GRADES = ['at1', 'at2', 'at3', 'cr1', 'av1', 'av2', 'sim', 'bns'];
    const TRIMS = ['t1', 't2', 't3'];
    
    // Tornar constantes disponíveis globalmente
    window.GRADES = GRADES;
    window.TRIMS = TRIMS;
    
    const SUBJECTS = [
        { value: 'matematica', text: 'Matemática', usesAV2: true },
        { value: 'portugues', text: 'Português', usesAV2: true },
        { value: 'biologia', text: 'Biologia', usesAV2: true },
        { value: 'fisica', text: 'Física', usesAV2: true },
        { value: 'quimica', text: 'Química', usesAV2: true },
        { value: 'ingles', text: 'Inglês', usesAV2: true },
        { value: 'geografia', text: 'Geografia', usesAV2: false },
        { value: 'historia', text: 'História', usesAV2: false },
        { value: 'sociologia', text: 'Sociologia', usesAV2: false },
        { value: 'filosofia', text: 'Filosofia', usesAV2: false }
    ];

    const WEIGHTS = {
        standard: { av1: 2/3, m_at: 1/6, sim: 1/12, cr1: 1/12 },
        dualExam: { m_av: 2/3, m_at: 1/6, sim: 1/12, cr1: 1/12 }
    };
    
    // Tornar WEIGHTS disponível globalmente
    window.WEIGHTS = WEIGHTS;

    // Cache de elementos DOM
    const DOM = {
        root: document.documentElement,
        themeToggle: document.getElementById('theme-toggle'),
        yearSelector: document.getElementById('yearSelector'),
        subjectContainer: document.getElementById('subject-selector-container'),
        subjectSelector: document.getElementById('subjectSelector'),
        goalSelector: document.getElementById('goalSelector'),
        customGoal: document.getElementById('customGoalValue'),
        trimestersWrapper: document.getElementById('trimesters-wrapper'),
        calculateAll: document.getElementById('calculateAll'),
        clearAll: document.getElementById('clearAll'),
        annualSum: document.getElementById('annual_sum'),
        annualStatus: document.getElementById('annual_status'),
        howToUseBtn: document.getElementById('toggle-how-to-use-btn'),
        howToUseSection: document.getElementById('how-to-use-section'),
        projectionContent: document.getElementById('projection_message_content')
    };
    
    // Tornar DOM disponível globalmente
    window.DOM = DOM;

    // Utilitários
    const pFloat = val => isNaN(val = parseFloat(val)) ? 0 : val;
    const clamp = (val, min = CONFIG.MIN_GRADE, max = CONFIG.MAX_GRADE) => Math.max(min, Math.min(max, pFloat(val)));
    const getEl = id => document.getElementById(id);
    
    // Tornar funções utilitárias disponíveis globalmente
    window.pFloat = pFloat;
    window.clamp = clamp;
    window.getEl = getEl;

    // Configuração da matéria
    const getSubjectConfig = (subject, year) => {
        const config = SUBJECTS.find(s => s.value === subject) || SUBJECTS[0];
        return (year === CONFIG.SCHOOL_YEAR_EM3 && ['historia', 'geografia'].includes(subject)) 
            ? { ...config, usesAV2: true } : config;
    };
    
    // Tornar a função getSubjectConfig disponível globalmente
    window.getSubjectConfig = getSubjectConfig;

    // Cálculo da nota trimestral
    const calculateScore = (inputs, subject, year) => {
        const config = getSubjectConfig(subject, year);
        const weights = config.usesAV2 ? WEIGHTS.dualExam : WEIGHTS.standard;
        
        const activities = ['at1', 'at2', 'at3'].filter(id => inputs[id] !== "").map(id => clamp(inputs[id]));
        const m_at = activities.length ? activities.reduce((a, b) => a + b) / activities.length : 0;
        
        const weightedScores = [
            m_at * weights.m_at,
            clamp(inputs.sim) * weights.sim,
            clamp(inputs.cr1) * weights.cr1
        ];
        
        if (config.usesAV2) {
            const m_av = (clamp(inputs.av1) + clamp(inputs.av2)) / 2;
            weightedScores.push(m_av * weights.m_av);
        } else {
            weightedScores.push(clamp(inputs.av1) * weights.av1);
        }
        
        return Math.max(0, weightedScores.reduce((a, b) => a + b) + clamp(inputs.bns));
    };
    
    // Tornar a função calculateScore disponível globalmente
    window.calculateScore = calculateScore;

    // Resolver para X
    const solveForX = (target, prefix) => {
        const bonus = clamp(getEl(`${prefix}_bns`)?.value || 0);
        const adjustedTarget = target - bonus;
        let fixedSum = 0, xCoeff = 0;
        
        const config = getSubjectConfig(DOM.subjectSelector.value, DOM.yearSelector.value);
        const weights = config.usesAV2 ? WEIGHTS.dualExam : WEIGHTS.standard;
        
        // Processar ATs
        const atElements = ['at1', 'at2', 'at3'].map(id => {
            const el = getEl(`${prefix}_${id}`);
            return el ? { el, id, isFixed: el.classList.contains('is-fixed') || el.value !== "" } : null;
        }).filter(Boolean);
        
        if (atElements.length) {
            const weightPerAt = weights.m_at / atElements.length;
            atElements.forEach(({ el, isFixed }) => {
                if (isFixed) fixedSum += clamp(el.value) * weightPerAt;
                else xCoeff += weightPerAt;
            });
        }
        
        // Processar AVs
        if (config.usesAV2) {
            const avElements = ['av1', 'av2'].map(id => {
                const el = getEl(`${prefix}_${id}`);
                return el ? { el, id, isFixed: el.classList.contains('is-fixed') || el.value !== "" } : null;
            }).filter(Boolean);
            
            if (avElements.length) {
                const weightPerAv = weights.m_av / avElements.length;
                avElements.forEach(({ el, isFixed }) => {
                    if (isFixed) fixedSum += clamp(el.value) * weightPerAv;
                    else xCoeff += weightPerAv;
                });
            }
        } else {
            const el = getEl(`${prefix}_av1`);
            if (el) {
                if (el.classList.contains('is-fixed') || el.value !== "") {
                    fixedSum += clamp(el.value) * weights.av1;
                } else {
                    xCoeff += weights.av1;
                }
            }
        }
        
        // Processar SIM e CR1
        ['sim', 'cr1'].forEach(id => {
            const el = getEl(`${prefix}_${id}`);
            if (el) {
                if (el.classList.contains('is-fixed') || el.value !== "") {
                    fixedSum += clamp(el.value) * weights[id];
                } else {
                    xCoeff += weights[id];
                }
            }
        });
        
        if (Math.abs(xCoeff) < CONFIG.EPSILON) {
            const allFilled = GRADES.every(id => {
                if (id === 'bns' || (id === 'av2' && !config.usesAV2)) return true;
                const el = getEl(`${prefix}_${id}`);
                return el && (el.classList.contains('is-fixed') || el.value !== "");
            });
            return { 
                x: null, 
                message: allFilled ? "Todas as notas já estão preenchidas ou fixadas neste trimestre." 
                    : "Não há campos livres para projetar a nota neste trimestre."
            };
        }
        
        return { x: (adjustedTarget - fixedSum) / xCoeff, message: null };
    };

    // Criar card de trimestre
    const createTrimesterCard = trimNum => {
        const prefix = `t${trimNum}`;
        const labels = {
            at1: "AT1 (Atividade 1)", at2: "AT2 (Atividade 2)", at3: "AT3 (Atividade 3)",
            cr1: `CR${trimNum} (Cidadania)`, av1: "AV1 (Prova 1)", av2: "AV2 (Prova 2)",
            sim: "SIM (Simulado)", bns: "BNS (Bônus)"
        };
        
        const inputs = GRADES.map(id => `
            <div class="input-group" data-grade-id="${id}">
                <label for="${prefix}_${id}">${labels[id]}:</label>
                <div class="input-field-wrapper">
                    <input type="number" id="${prefix}_${id}" ${id === 'bns' ? 'value="0"' : ''} 
                           step="0.01" min="0" max="10" placeholder="0.00"
                           title="Insira a nota de ${labels[id]}">
                    <button class="btn-fix" data-target-input="${prefix}_${id}" 
                           aria-pressed="false" title="Fixa esta nota para cálculos de projeção">
                           <i class="fas fa-thumbtack"></i> Fixar
                    </button>
                </div>
            </div>`).join('');

        return `
            <div class="trimester-card" id="trim${trimNum}_card">
                <h2>Trimestre ${trimNum}</h2>
                
                <div class="direct-average-toggle">
                    <label class="toggle-switch">
                        <input type="checkbox" id="${prefix}_use_direct_average" class="direct-average-checkbox">
                        <span class="toggle-slider"></span>
                    </label>
                    <span class="toggle-label">Inserir média diretamente</span>
                </div>
                
                <div class="direct-average-input" id="${prefix}_direct_average_container" style="display: none;">
                    <label for="${prefix}_direct_average">Média do Trimestre ${trimNum}:</label>
                    <div class="input-field-wrapper">
                        <input type="number" id="${prefix}_direct_average" 
                               step="0.01" min="0" max="10" placeholder="0.00"
                               title="Insira a média trimestral diretamente">
                    </div>
                </div>
                
                <div class="input-grid" id="${prefix}_detailed_inputs">${inputs}</div>
                <div class="result">Média Trimestral ${trimNum}: <span id="${prefix}_result" aria-live="polite">-</span></div>
            </div>`;
    };

    // Atualizar opções do seletor de matéria
    const updateSubjectOptions = () => {
        const year = DOM.yearSelector.value;
        const current = DOM.subjectSelector.value;
        DOM.subjectSelector.innerHTML = '';

        const groups = { two: document.createElement('optgroup'), one: document.createElement('optgroup') };
        groups.two.label = 'Duas provas Trimestrais';
        groups.one.label = 'Uma prova Trimestral';

        SUBJECTS.forEach(subject => {
            const config = getSubjectConfig(subject.value, year);
            const option = new Option(subject.text, subject.value);
            (config.usesAV2 ? groups.two : groups.one).appendChild(option);
        });
        
        DOM.subjectSelector.appendChild(groups.two);
        if (groups.one.childElementCount > 0) DOM.subjectSelector.appendChild(groups.one);
        
        DOM.subjectSelector.value = Array.from(DOM.subjectSelector.options).some(opt => opt.value === current) 
            ? current : DOM.subjectSelector.options[0].value;
    };

    // Atualizar visibilidade dos campos
    const updateFieldsVisibility = () => {
        const config = getSubjectConfig(DOM.subjectSelector.value, DOM.yearSelector.value);
        document.querySelectorAll('[data-grade-id="av2"]').forEach(group => {
            group.style.display = config.usesAV2 ? '' : 'none';
            if (!config.usesAV2) group.querySelector('input').value = '';
        });
    };

    // Obter inputs de um trimestre
    const getInputs = prefix => Object.fromEntries(GRADES.map(id => [id, getEl(`${prefix}_${id}`)?.value || '']));
    
    // Tornar a função getInputs disponível globalmente
    window.getInputs = getInputs;

    // Limpar projeções
    const clearProjections = () => {
        // Limpar projeções de campos detalhados
        document.querySelectorAll('input.projected-grade:not(.is-fixed)').forEach(el => {
            el.value = '';
            el.classList.remove('projected-grade');
        });
        
        // Limpar projeções de médias diretas
        TRIMS.forEach(prefix => {
            const directAverageInput = document.getElementById(`${prefix}_direct_average`);
            if (directAverageInput && directAverageInput.classList.contains('projected-grade')) {
                directAverageInput.value = '';
                directAverageInput.classList.remove('projected-grade');
            }
        });
    };

    // Verificar se trimestre tem campos vazios
    const hasEmptyFields = prefix => {
        // Verificar se está usando média direta
        const useDirectAverage = document.getElementById(`${prefix}_use_direct_average`)?.checked;
        
        if (useDirectAverage) {
            // Se estiver usando média direta, verificar se o campo está vazio
            const directAverageInput = document.getElementById(`${prefix}_direct_average`);
            return !directAverageInput || directAverageInput.value === '';
        } else {
            // Verificar campos individuais
            return GRADES.some(id => {
                if (id === 'bns' || (id === 'av2' && !getSubjectConfig(DOM.subjectSelector.value, DOM.yearSelector.value).usesAV2)) return false;
                const el = getEl(`${prefix}_${id}`);
                return el && !el.classList.contains('is-fixed') && el.value === '';
            });
        }
    };

    // Preencher campos projetados
    const fillProjectedFields = (prefix, target) => {
        const cardEl = getEl(`trim${prefix.substring(1)}_card`);
        const useDirectAverage = document.getElementById(`${prefix}_use_direct_average`)?.checked;
        
        if (useDirectAverage) {
            // Se estiver usando média direta, simplesmente definir o valor alvo
            const directAverageInput = document.getElementById(`${prefix}_direct_average`);
            if (directAverageInput) {
                directAverageInput.value = target.toFixed(2);
                directAverageInput.classList.add('projected-grade');
                if (cardEl) delete cardEl.dataset.projectionError;
            }
        } else {
            // Usar o método normal para campos detalhados
            const result = solveForX(target, prefix);
            
            if (result.x !== null) {
                const value = clamp(result.x).toFixed(2);
                const config = getSubjectConfig(DOM.subjectSelector.value, DOM.yearSelector.value);
                
                GRADES.forEach(id => {
                    if (id === 'bns' || (id === 'av2' && !config.usesAV2)) return;
                    const el = getEl(`${prefix}_${id}`);
                    if (el && !el.classList.contains('is-fixed') && el.value === '') {
                        el.value = value;
                        el.classList.add('projected-grade');
                    }
                });
                if (cardEl) delete cardEl.dataset.projectionError;
            } else if (result.message && cardEl) {
                cardEl.dataset.projectionError = `Trimestre ${prefix.substring(1)}: ${result.message}`;
            }
        }
    };

    // Estratégia de projeção
    const getProjectionStrategy = () => {
        const goal = DOM.goalSelector.value;
        if (goal === 'pass_year') return { type: 'pass_year' };
        if (goal === 'custom') {
            const val = pFloat(DOM.customGoal.value);
            return { type: 'target', target: (val >= CONFIG.MIN_GRADE && val <= CONFIG.MAX_GRADE) ? val : CONFIG.DEFAULT_TARGET };
        }
        return { type: 'target', target: pFloat(goal) };
    };
    
    // Tornar a função getProjectionStrategy disponível globalmente
    window.getProjectionStrategy = getProjectionStrategy;

    // Aplicar projeções
    const applyProjections = strategy => {
        if (strategy.type === 'pass_year') {
            let knownSum = 0, futureTrims = [];
            
            TRIMS.forEach((prefix, i) => {
                if (hasEmptyFields(prefix)) {
                    futureTrims.push(prefix);
                } else {
                    const score = calculateScore(getInputs(prefix), DOM.subjectSelector.value, DOM.yearSelector.value);
                    knownSum += score * (i === 2 ? CONFIG.THIRD_WEIGHT : CONFIG.DEFAULT_WEIGHT);
                }
            });
            
            if (futureTrims.length) {
                const remaining = CONFIG.PASSING_SUM_ANNUAL - knownSum;
                const totalWeight = futureTrims.reduce((sum, prefix) => sum + (prefix === 't3' ? CONFIG.THIRD_WEIGHT : CONFIG.DEFAULT_WEIGHT), 0);
                const target = totalWeight > 0 ? remaining / totalWeight : 0;
                futureTrims.forEach(prefix => fillProjectedFields(prefix, target));
            }
        } else {
            TRIMS.forEach(prefix => {
                if (hasEmptyFields(prefix)) fillProjectedFields(prefix, strategy.target);
            });
        }
    };

    // Função para coletar dados para os gráficos e estatísticas
    const getChartData = () => {
        const trimesterScores = [];
        const allGrades = [];

        TRIMS.forEach(prefix => {
            let score;
            const useDirectAverage = document.getElementById(`${prefix}_use_direct_average`)?.checked;
            
            if (useDirectAverage) {
                score = pFloat(document.getElementById(`${prefix}_direct_average`)?.value || 0);
            } else {
                const inputs = getInputs(prefix);
                score = calculateScore(inputs, DOM.subjectSelector.value, DOM.yearSelector.value);
                
                // Coletar todas as notas individuais (exceto bônus)
                GRADES.forEach(id => {
                    if (id !== 'bns') {
                        const value = pFloat(inputs[id]);
                        if (!isNaN(value) && value > 0) {
                            allGrades.push(value);
                        }
                    }
                });
            }
            trimesterScores.push(score);
        });

        return { trimesterScores, allGrades };
    };
    window.getChartData = getChartData; // Exportar para uso em outros scripts

    // Função para atualizar as estatísticas de texto
    const updateStatistics = (trimesterScores, allGrades) => {
        const statAverageEl = document.getElementById('stat-average');
        const statHighestEl = document.getElementById('stat-highest');
        const statLowestEl = document.getElementById('stat-lowest');
        const statTrendEl = document.getElementById('stat-trend');

        // Se os elementos não existirem, não fazer nada.
        if (!statAverageEl || !statHighestEl || !statLowestEl || !statTrendEl) {
            return;
        }

        // Calcular média geral das notas individuais
        const average = allGrades.length > 0
            ? allGrades.reduce((a, b) => a + b, 0) / allGrades.length
            : 0;

        // Encontrar nota mais alta e mais baixa
        const highest = allGrades.length > 0 ? Math.max(...allGrades) : 0;
        const lowest = allGrades.length > 0 ? Math.min(...allGrades) : 0;

        // Determinar tendência com base nas médias trimestrais
        let trend = '-';
        let trendClass = 'trend-stable'; // Classe padrão

        // Filtrar apenas trimestres com notas válidas para a tendência
        const validScores = trimesterScores.filter(score => score > CONFIG.EPSILON);

        if (validScores.length >= 2) {
            const lastIndex = validScores.length - 1;
            if (validScores[lastIndex] > validScores[lastIndex - 1]) {
                trend = 'Em alta ↗';
                trendClass = 'trend-up';
            } else if (validScores[lastIndex] < validScores[lastIndex - 1]) {
                trend = 'Em queda ↘';
                trendClass = 'trend-down';
            } else {
                trend = 'Estável →';
                trendClass = 'trend-stable';
            }
        } else if (validScores.length === 1) {
            trend = 'Aguardando mais dados';
        }

        // Atualizar os elementos na interface
        statAverageEl.textContent = average > 0 ? average.toFixed(2) : '-';
        statHighestEl.textContent = highest > 0 ? highest.toFixed(2) : '-';
        statLowestEl.textContent = lowest > 0 ? lowest.toFixed(2) : '-';
        statTrendEl.textContent = trend;
        statTrendEl.className = 'stat-value ' + trendClass;
    };
    // Tornar a função de estatísticas global para ser chamada pelo charts.js
    window.updateStatistics = updateStatistics;

    // Atualizar resultados
    const updateResults = () => {
        let annualSum = 0, filledTrims = 0;
        const messages = [];
        
        // Usar a função centralizada para obter os dados
        const { trimesterScores: trimesterScoresForCharts, allGrades: allGradesForCharts } = getChartData();

        trimesterScoresForCharts.forEach((score, i) => {
            const prefix = TRIMS[i];
            getEl(`${prefix}_result`).textContent = score.toFixed(2);

            const cardEl = getEl(`trim${i+1}_card`);
            if (cardEl?.dataset.projectionError) messages.push(cardEl.dataset.projectionError);

            // Verificar se há conteúdo para considerar o trimestre no cálculo anual
            const useDirectAverage = document.getElementById(`${prefix}_use_direct_average`)?.checked;
            const hasContent = useDirectAverage ? score > 0 : GRADES.some(id => id !== 'bns' && pFloat(getEl(`${prefix}_${id}`)?.value || 0) > 0);
            
            if (hasContent || score > 0) {
                annualSum += score * (i === 2 ? CONFIG.THIRD_WEIGHT : CONFIG.DEFAULT_WEIGHT);
                filledTrims++;
            }
        });

        updateAnnualUI(annualSum, filledTrims, messages);
        
        // Atualizar o gráfico se estiver visível
        const analyticsSection = document.getElementById('analytics-section');
        if (analyticsSection && analyticsSection.style.display !== 'none' && window.Charts) {
            window.Charts.update(trimesterScoresForCharts, allGradesForCharts);
        }
    };
    
    // Atualizar UI anual
    const updateAnnualUI = (sum, filled, messages) => {
        let status = '-';
        let statusClass = '';

        // 1. Atualizar a soma anual na UI
        DOM.annualSum.textContent = sum.toFixed(2);

        // 2. Lidar com o Status da Meta (para presets 6, 7, 8 e custom)
        const goalStrategy = getProjectionStrategy();
        const hasTargetGoal = goalStrategy.type === 'target';
        const targetValue = hasTargetGoal ? goalStrategy.target : null;
        const goalStatusContainer = document.querySelector('.custom-goal-status');

        // Apenas mostrar o status da meta se houver uma meta de nota e todos os trimestres estiverem preenchidos
        if (hasTargetGoal && targetValue > 0 && filled === 3) {
            const totalWeight = 4; // Peso total para 3 trimestres (1 + 1 + 2)
            const avgPerTrimester = sum / totalWeight;
            const goalMet = avgPerTrimester >= targetValue;

            if (goalStatusContainer) {
                const goalStatusEl = document.getElementById('custom_goal_status');
                if (goalStatusEl) {
                    goalStatusEl.textContent = goalMet ? 'Meta atingida!' : 'Meta não atingida';
                    goalStatusEl.className = goalMet ? 'status-goal-met' : 'status-goal-not-met';
                }
                goalStatusContainer.style.display = 'block';
            }

            // Adicionar mensagem sobre a meta
            if (goalMet) {
                messages.push(`<strong>Meta atingida!</strong> Média por trimestre: ${avgPerTrimester.toFixed(2)} ≥ ${targetValue.toFixed(2)}`);
            } else {
                messages.push(`<strong>Meta não atingida.</strong> Média por trimestre: ${avgPerTrimester.toFixed(2)} < ${targetValue.toFixed(2)}`);
            }
        } else {
            // Esconder o status da meta se não for aplicável
            if (goalStatusContainer) {
                goalStatusContainer.style.display = 'none';
            }
        }

        // 3. Lidar com o Status Geral (Aprovado/Recuperação)
        if (filled === 0) {
            DOM.annualSum.textContent = '-';
            messages.push("Nenhuma nota inserida para calcular o resultado anual.");
        } else if (filled < 3) {
            status = "PARCIAL";
            statusClass = "status-partial";
            messages.push("Preencha ou projete todos os trimestres para o status final.");
        } else { // Apenas quando filled === 3
            if (filled < 3) {
                status = "PARCIAL";
                statusClass = "status-partial";
                messages.push("Preencha ou projete todos os trimestres para o status final.");
            } else {
                if (sum >= CONFIG.PASSING_SUM_ANNUAL) {
                    status = "APROVADO!";
                    statusClass = "status-approved";
                    messages.push(`<strong>Parabéns!</strong> Com a soma de ${sum.toFixed(2)}, você está aprovado.`);
                } else {
                    status = "RECUPERAÇÃO";
                    statusClass = "status-recovery";
                    messages.push(`<strong>Recuperação:</strong> Soma das médias (${sum.toFixed(2)}) abaixo de ${CONFIG.PASSING_SUM_ANNUAL}.`);
                }
            }
        }
        
        // 4. Atualizar a UI com o status e as mensagens
        DOM.annualStatus.textContent = status;
        DOM.annualStatus.className = statusClass;
        
        DOM.projectionContent.innerHTML = messages.length 
            ? messages.map(msg => `<span>${msg}</span>`).join('')
            : '<span>Preencha as notas e clique em calcular.</span>';
    };

    // Handlers
    const handleYearChange = () => {
        const year = DOM.yearSelector.value;
        if (year) {
            DOM.subjectContainer.classList.remove('hidden-subject-selector');
            DOM.subjectContainer.style.maxHeight = DOM.subjectContainer.scrollHeight + "px";
            updateSubjectOptions();
            updateFieldsVisibility();
            clearProjections();
            updateResults();
        } else {
            DOM.subjectContainer.style.maxHeight = "0px";
            DOM.subjectContainer.classList.add('hidden-subject-selector');
        }
    };
    window.handleYearChange = handleYearChange; // Exportar para uso global

    const handleSubjectChange = () => {
        updateFieldsVisibility();
        clearProjections();
        updateResults();
    };


    const handleGoalChange = () => {
        if (DOM.goalSelector.value === 'custom') {
            DOM.customGoal.style.display = 'block';
            setTimeout(() => {
                DOM.customGoal.classList.add('show-custom-goal');
                DOM.customGoal.focus();
            }, 10);
            
            // Mostrar mensagem explicativa sobre a meta personalizada
            DOM.projectionContent.innerHTML = '<span class="info-message"><strong>Meta personalizada:</strong> Digite a média que deseja obter por trimestre. Após calcular, você verá se conseguiu atingir essa meta.</span>';
        } else {
            DOM.customGoal.classList.remove('show-custom-goal');
            setTimeout(() => {
                DOM.customGoal.style.display = 'none';
            }, 300);
            
            // Limpar mensagem explicativa
            DOM.projectionContent.innerHTML = '<span>Preencha as notas e clique em calcular.</span>';
        }
        clearProjections();
    };

    const handleCalculation = () => {
        // Adicionar classe para efeito visual
        DOM.calculateAll.classList.add('btn-clicked');
        setTimeout(() => DOM.calculateAll.classList.remove('btn-clicked'), 300);
        
        clearProjections();
        applyProjections(getProjectionStrategy());
        updateResults();
    };

    const handleFixButton = e => {
        if (e.target.classList.contains('btn-fix')) {
            const input = getEl(e.target.dataset.targetInput);
            if (input) {
                const isFixed = input.classList.toggle('is-fixed');
                e.target.classList.toggle('fixed-active');
                e.target.setAttribute('aria-pressed', isFixed);
                e.target.innerHTML = isFixed ? '<i class="fas fa-lock"></i> Fixado' : '<i class="fas fa-thumbtack"></i> Fixar';
                input.readOnly = isFixed;
                if (isFixed) input.classList.remove('projected-grade');
                clearProjections();
                updateResults();
            }
        }
    };

    const clearAll = () => {
        // Adicionar classe para efeito visual
        DOM.clearAll.classList.add('btn-clicked');
        setTimeout(() => DOM.clearAll.classList.remove('btn-clicked'), 300);
        
        // Adicionar efeito de fade-out/fade-in nos cards
        const cards = document.querySelectorAll('.trimester-card');
        cards.forEach(card => {
            card.classList.add('card-reset');
            setTimeout(() => card.classList.remove('card-reset'), 500);
        });
        
        // Limpar todos os campos de entrada
        document.querySelectorAll('input[type="number"]').forEach(input => {
            input.value = input.id.endsWith('_bns') ? '0' : '';
            input.classList.remove('is-fixed', 'projected-grade');
            input.readOnly = false;
        });
        
        // Resetar botões de fixar
        document.querySelectorAll('.btn-fix').forEach(btn => {
            btn.classList.remove('fixed-active');
            btn.innerHTML = '<i class="fas fa-thumbtack"></i> Fixar';
            btn.setAttribute('aria-pressed', 'false');
        });
        
        // Resetar toggles de média direta
        TRIMS.forEach(prefix => {
            const checkbox = document.getElementById(`${prefix}_use_direct_average`);
            if (checkbox && checkbox.checked) {
                checkbox.checked = false;
                toggleDirectAverage(prefix, false);
            }
        });
        
        // Resetar meta
        DOM.goalSelector.value = "6.0";
        DOM.customGoal.classList.remove('show-custom-goal');
        DOM.customGoal.style.display = 'none';
        DOM.customGoal.value = '';
        
        // Esconder o status da meta personalizada
        const goalStatusContainer = document.querySelector('.custom-goal-status');
        if (goalStatusContainer) {
            goalStatusContainer.style.display = 'none';
        }
        
        clearProjections();
        updateResults();
    };
    window.clearAll = clearAll; // Exportar para uso global

    const initTheme = () => {
        const saved = localStorage.getItem(CONFIG.THEME_KEY);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        DOM.root.setAttribute('data-theme', saved || (prefersDark ? 'dark' : 'light'));
    };

    const toggleTheme = () => {
        const current = DOM.root.getAttribute('data-theme');
        const newTheme = current === 'light' ? 'dark' : 'light';
        DOM.root.setAttribute('data-theme', newTheme);
        localStorage.setItem(CONFIG.THEME_KEY, newTheme);
    };

    // Função para mostrar/esconder a seção "Como Usar"
    const toggleHowToUse = () => {
        const section = DOM.howToUseSection;
        const isVisible = section.classList.toggle('show');

        if (isVisible) {
            // Define a altura máxima para a altura do conteúdo para uma transição suave
            section.style.maxHeight = section.scrollHeight + 'px';
        } else {
            // Recolhe a seção
            section.style.maxHeight = '0px';
        }

        // Salva o estado no localStorage
        localStorage.setItem(CONFIG.HOW_TO_USE_VISIBLE_KEY, isVisible ? 'open' : 'closed');
    };

    // Função para inicializar o estado da seção "Como Usar"
    const initHowToUseState = () => {
        if (localStorage.getItem(CONFIG.HOW_TO_USE_VISIBLE_KEY) === 'open') {
            DOM.howToUseSection.classList.add('show');
            DOM.howToUseSection.style.maxHeight = DOM.howToUseSection.scrollHeight + 'px';
        }
    };

    // Funções para salvar e carregar dados
    const saveDataToLocalStorage = () => {
        const data = {
            year: DOM.yearSelector.value,
            subject: DOM.subjectSelector.value,
            goal: DOM.goalSelector.value,
            customGoal: DOM.customGoal.value,
            grades: {}
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
        
        localStorage.setItem('calculadora_notas_data', JSON.stringify(data));
    };
    window.saveDataToLocalStorage = saveDataToLocalStorage; // Exportar para uso global
    
    const loadDataFromLocalStorage = () => {
        const savedData = localStorage.getItem('calculadora_notas_data');
        if (!savedData) return false;
        
        try {
            const data = JSON.parse(savedData);
            
            // Restaurar seleções
            if (data.year) {
                DOM.yearSelector.value = data.year;
                handleYearChange();
            }
            
            if (data.subject) {
                setTimeout(() => {
                    DOM.subjectSelector.value = data.subject;
                    updateFieldsVisibility();
                }, 100);
            }
            
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
                                            btn.textContent = 'Fixado';
                                            btn.setAttribute('aria-pressed', 'true');
                                        }
                                    }
                                }
                            });
                        }
                    });
                    
                    // Calcular resultados após carregar os dados
                    updateResults();
                }, 200);
            }
            
            return true;
        } catch (e) {
            console.error('Erro ao carregar dados salvos:', e);
            return false;
        }
    };

    // Exportar funções de UI para uso global (ex: sharing.js)
    window.updateFieldsVisibility = updateFieldsVisibility;
    window.updateResults = updateResults;
    // clearAll, handleYearChange, saveDataToLocalStorage já foram exportadas acima.

    // Função para alternar entre entrada detalhada e média direta
    const toggleDirectAverage = (trimPrefix, checked) => {
        const directAverageContainer = document.getElementById(`${trimPrefix}_direct_average_container`);
        const detailedInputs = document.getElementById(`${trimPrefix}_detailed_inputs`);
        
        if (checked) {
            // Mostrar campo de média direta e esconder entradas detalhadas
            directAverageContainer.style.display = 'block';
            detailedInputs.style.display = 'none';
            
            // Calcular a média atual e preencher o campo de média direta
            const inputs = getInputs(trimPrefix);
            const currentScore = calculateScore(inputs, DOM.subjectSelector.value, DOM.yearSelector.value);
            const directAverageInput = document.getElementById(`${trimPrefix}_direct_average`);
            
            if (currentScore > 0) {
                directAverageInput.value = currentScore.toFixed(2);
            } else {
                directAverageInput.value = '';
            }
            
            // Focar no campo de média direta para facilitar a entrada
            setTimeout(() => {
                directAverageInput.focus();
                // Disparar um evento de input para garantir que os resultados sejam atualizados.
                // Isso é importante quando o valor é preenchido programaticamente ao ativar o modo.
                const inputEvent = new Event('input', { bubbles: true });
                directAverageInput.dispatchEvent(inputEvent);
            }, 100);
        } else {
            // Esconder campo de média direta e mostrar entradas detalhadas
            directAverageContainer.style.display = 'none';
            detailedInputs.style.display = 'grid';
        }
        
        // Forçar a atualização dos resultados anuais
        updateResults();
    };
    
    // Inicialização
    initTheme();
    initHowToUseState(); // Inicializa o estado da seção "Como Usar"
    DOM.trimestersWrapper.innerHTML = TRIMS.map((_, i) => createTrimesterCard(i + 1)).join('');
    
    // Função para garantir que os resultados estejam atualizados após a inicialização
    const initializeResults = () => {
        // Verificar todos os campos de média direta
        TRIMS.forEach(prefix => {
            const useDirectAverage = document.getElementById(`${prefix}_use_direct_average`)?.checked;
            if (useDirectAverage) {
                const directAverageInput = document.getElementById(`${prefix}_direct_average`);
                const resultElement = document.getElementById(`${prefix}_result`);
                if (directAverageInput && resultElement) {
                    const value = directAverageInput.value ? parseFloat(directAverageInput.value) : 0;
                    resultElement.innerHTML = value.toFixed(2);
                }
            }
        });
        
        // Atualizar os resultados anuais
        updateResults();
    };
    
    // Executar a inicialização após um pequeno atraso para garantir que todos os elementos estejam carregados
    setTimeout(initializeResults, 100);
    
    // Adicionar event listeners para os toggles de média direta
    TRIMS.forEach(prefix => {
        const checkbox = document.getElementById(`${prefix}_use_direct_average`);
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                toggleDirectAverage(prefix, e.target.checked);
            });
        }
        
        // O listener de 'input' no 'trimestersWrapper' agora lida com todas as atualizações de notas,
        // tornando os listeners individuais para os campos de média direta redundantes.
    });
    
    // Tentar carregar dados salvos
    const dataLoaded = loadDataFromLocalStorage();
    
    // Mostrar notificação se os dados foram carregados
    if (dataLoaded) {
        setTimeout(() => {
            showToast('Suas notas salvas foram carregadas automaticamente!', 'success');
            
            // Garantir que os campos de média direta sejam atualizados
            TRIMS.forEach(prefix => {
                const useDirectAverage = document.getElementById(`${prefix}_use_direct_average`)?.checked;
                if (useDirectAverage) {
                    const directAverageInput = document.getElementById(`${prefix}_direct_average`);
                    if (directAverageInput) {
                        // Disparar um evento de input para garantir que os resultados sejam atualizados
                        const inputEvent = new Event('input', { bubbles: true });
                        directAverageInput.dispatchEvent(inputEvent);
                    }
                }
            });
            
            // Forçar a atualização dos resultados
            updateResults();
        }, 1500);
    }
    
    // Função para salvar dados após alterações
    const saveAfterChange = () => {
        setTimeout(saveDataToLocalStorage, 100);
    };
    
    // Funções para exportar e importar dados
    const exportData = () => {
        const data = {
            year: DOM.yearSelector.value,
            subject: DOM.subjectSelector.value,
            goal: DOM.goalSelector.value,
            customGoal: DOM.customGoal.value,
            grades: {},
            exportDate: new Date().toISOString(),
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
        
        // Criar e baixar o arquivo
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `calculadora-notas-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast('Dados exportados com sucesso!', 'success');
        }, 100);
    };
    
    const importData = () => {
        const fileInput = document.getElementById('importFile');
        fileInput.click();
        
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    // Verificar se o arquivo é válido
                    if (!data.grades || !data.year) {
                        showToast('Arquivo inválido ou corrompido!', 'error');
                        return;
                    }
                    
                    // Limpar dados atuais
                    clearAll();
                    
                    // Restaurar seleções
                    if (data.year) {
                        DOM.yearSelector.value = data.year;
                        handleYearChange();
                    }
                    
                    if (data.subject) {
                        setTimeout(() => {
                            DOM.subjectSelector.value = data.subject;
                            updateFieldsVisibility();
                        }, 100);
                    }
                    
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
                                                    btn.textContent = 'Fixado';
                                                    btn.setAttribute('aria-pressed', 'true');
                                                }
                                            }
                                        }
                                    });
                                }
                            });
                            
                            // Calcular resultados após carregar os dados
                            updateResults();
                            saveDataToLocalStorage();
                            showToast('Dados importados com sucesso!', 'success');
                        }, 200);
                    }
                    
                } catch (e) {
                    console.error('Erro ao importar dados:', e);
                    showToast('Erro ao importar dados. Verifique o formato do arquivo.', 'error');
                }
                
                // Limpar o input para permitir selecionar o mesmo arquivo novamente
                fileInput.value = '';
            };
            
            reader.readAsText(file);
        };
    };
    
    // Event Listeners
    DOM.themeToggle.addEventListener('click', toggleTheme);
    DOM.howToUseBtn.addEventListener('click', toggleHowToUse);
    DOM.yearSelector.addEventListener('change', () => { handleYearChange(); saveAfterChange(); });
    DOM.subjectSelector.addEventListener('change', () => { handleSubjectChange(); saveAfterChange(); });
    DOM.goalSelector.addEventListener('change', () => { handleGoalChange(); saveAfterChange(); });
    DOM.customGoal.addEventListener('input', () => { handleGoalChange(); saveAfterChange(); });
    DOM.calculateAll.addEventListener('click', () => { handleCalculation(); saveAfterChange(); });
    DOM.clearAll.addEventListener('click', () => { 
        clearAll(); 
        localStorage.removeItem('calculadora_notas_data');
        showToast('Todos os dados foram limpos!', 'warning');
    });
    DOM.trimestersWrapper.addEventListener('click', (e) => { 
        handleFixButton(e); 
        if (e.target.classList.contains('btn-fix')) saveAfterChange();
    });
    DOM.trimestersWrapper.addEventListener('input', (e) => { 
        // Este listener centralizado agora lida com todas as entradas de notas.
        if (e.target.matches('input[type="number"]')) {
            e.target.classList.remove('projected-grade');
            updateResults();
            saveAfterChange();
        }
    });
    
    // Event listeners para exportar/importar
    document.getElementById('exportData').addEventListener('click', exportData);
    document.getElementById('importData').addEventListener('click', importData);
    
    // Event listeners para análise gráfica
    document.getElementById('toggleAnalytics').addEventListener('click', window.Charts.toggle);
    
    // Event listeners para compartilhamento
    document.getElementById('generateShareLink').addEventListener('click', () => {
        const link = window.Sharing.generateLink();
        if (link) {
            const shareLinkInput = document.getElementById('share-link-input');
            const shareLinkContainer = document.getElementById('share-link-container');
            const qrCodeContainer = document.getElementById('qr-code-container');
            const qrCodeImageEl = document.getElementById('qr-code-image');

            shareLinkInput.value = link;
            shareLinkContainer.style.display = 'block';
            shareLinkContainer.classList.add('show');

            // Gerar QR Code se a biblioteca estiver disponível
            if (window.QRCode) {
                qrCodeImageEl.innerHTML = ''; // Limpar QR code anterior
                new QRCode(qrCodeImageEl, {
                    text: link,
                    width: 150,
                    height: 150,
                    colorDark : "#000000",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.H
                });
                qrCodeContainer.style.display = 'block';
                qrCodeContainer.classList.add('show');
            }
        }
    });

    document.getElementById('copyShareLink').addEventListener('click', () => {
        const linkToCopy = document.getElementById('share-link-input').value;
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(linkToCopy)
                .then(() => showToast('Link copiado para a área de transferência!', 'success'))
                .catch(err => {
                    console.error('Erro ao copiar o link:', err);
                    showToast('Erro ao copiar o link. Por favor, copie manualmente.', 'error');
                });
        } else {
            // Fallback para ambientes não seguros (http) ou navegadores antigos
            const tempInput = document.createElement('input');
            tempInput.value = linkToCopy;
            document.body.appendChild(tempInput);
            tempInput.select();
            try {
                document.execCommand('copy');
                showToast('Link copiado para a área de transferência!', 'success');
            } catch (err) {
                console.error('Fallback de cópia falhou:', err);
                showToast('Erro ao copiar o link. Por favor, copie manualmente.', 'error');
            }
            document.body.removeChild(tempInput);
        }
    });

    // Verificar se há dados compartilhados na URL
    setTimeout(() => {
        window.Sharing.checkSharedData();
    }, 1000);

    // Inicializar o botão de exportação de PDF APÓS todo o script.js ter sido carregado e o DOM estar pronto
    if (window.PDFExport && typeof window.PDFExport.initPdfExportButton === 'function') {
        window.PDFExport.initPdfExportButton();
    }
});