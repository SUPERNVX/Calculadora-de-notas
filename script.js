document.addEventListener('DOMContentLoaded', () => {
    // Constantes
    const CONFIG = {
        SCHOOL_YEAR_EM3: 'em_3',
        PASSING_SUM_ANNUAL: 24.0,
        MIN_GRADE: 0,
        MAX_GRADE: 10,
        DEFAULT_WEIGHT: 1,
        THIRD_WEIGHT: 2,
        DEFAULT_TARGET: 6.0,
        EPSILON: 0.0001,
        THEME_KEY: 'theme'
    };

    const GRADES = ['at1', 'at2', 'at3', 'cr1', 'av1', 'av2', 'sim', 'bns'];
    const TRIMS = ['t1', 't2', 't3'];
    
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
        projectionContent: document.getElementById('projection_message_content')
    };

    // Utilitários
    const pFloat = val => isNaN(val = parseFloat(val)) ? 0 : val;
    const clamp = (val, min = CONFIG.MIN_GRADE, max = CONFIG.MAX_GRADE) => Math.max(min, Math.min(max, pFloat(val)));
    const getEl = id => document.getElementById(id);

    // Configuração da matéria
    const getSubjectConfig = (subject, year) => {
        const config = SUBJECTS.find(s => s.value === subject) || SUBJECTS[0];
        return (year === CONFIG.SCHOOL_YEAR_EM3 && ['historia', 'geografia'].includes(subject)) 
            ? { ...config, usesAV2: true } : config;
    };

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
                           step="0.01" min="0" max="10" placeholder="0.00">
                    <button class="btn-fix" data-target-input="${prefix}_${id}" aria-pressed="false">Fixar</button>
                </div>
            </div>`).join('');

        return `
            <div class="trimester-card" id="trim${trimNum}_card">
                <h2>Trimestre ${trimNum}</h2>
                <div class="input-grid">${inputs}</div>
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

    // Limpar projeções
    const clearProjections = () => {
        document.querySelectorAll('input.projected-grade:not(.is-fixed)').forEach(el => {
            el.value = '';
            el.classList.remove('projected-grade');
        });
    };

    // Verificar se trimestre tem campos vazios
    const hasEmptyFields = prefix => GRADES.some(id => {
        if (id === 'bns' || (id === 'av2' && !getSubjectConfig(DOM.subjectSelector.value, DOM.yearSelector.value).usesAV2)) return false;
        const el = getEl(`${prefix}_${id}`);
        return el && !el.classList.contains('is-fixed') && el.value === '';
    });

    // Preencher campos projetados
    const fillProjectedFields = (prefix, target) => {
        const result = solveForX(target, prefix);
        const cardEl = getEl(`trim${prefix.substring(1)}_card`);
        
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

    // Atualizar resultados
    const updateResults = () => {
        let annualSum = 0, filledTrims = 0;
        const messages = [];
        
        TRIMS.forEach((prefix, i) => {
            const inputs = getInputs(prefix);
            const score = calculateScore(inputs, DOM.subjectSelector.value, DOM.yearSelector.value);
            getEl(`${prefix}_result`).textContent = score.toFixed(2);

            const cardEl = getEl(`trim${i+1}_card`);
            if (cardEl?.dataset.projectionError) messages.push(cardEl.dataset.projectionError);

            const hasContent = GRADES.some(id => id !== 'bns' && pFloat(inputs[id]) > 0);
            if (hasContent || score > 0) {
                annualSum += score * (i === 2 ? CONFIG.THIRD_WEIGHT : CONFIG.DEFAULT_WEIGHT);
                filledTrims++;
            }
        });

        updateAnnualUI(annualSum, filledTrims, messages);
    };

    // Atualizar UI anual
    const updateAnnualUI = (sum, filled, messages) => {
        let status = '-';
        
        if (filled === 0) {
            DOM.annualSum.textContent = '-';
            messages.push("Nenhuma nota inserida para calcular o resultado anual.");
        } else {
            DOM.annualSum.textContent = sum.toFixed(2);
            if (filled < 3) {
                status = "PARCIAL";
                messages.push("Preencha ou projete todos os trimestres para o status final.");
            } else {
                status = sum >= CONFIG.PASSING_SUM_ANNUAL ? "APROVADO!" : "RECUPERAÇÃO";
                messages.push(status === "APROVADO!" 
                    ? `Parabéns! Com a soma de ${sum.toFixed(2)}, você está aprovado.`
                    : `Recuperação: Soma das médias (${sum.toFixed(2)}) abaixo de ${CONFIG.PASSING_SUM_ANNUAL}.`);
            }
        }
        
        DOM.annualStatus.textContent = status;
        DOM.projectionContent.innerHTML = messages.length 
            ? messages.map(msg => `<span>${msg}</span>`).join('<br>')
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

    const handleSubjectChange = () => {
        updateFieldsVisibility();
        clearProjections();
        updateResults();
    };

    const handleGoalChange = () => {
        DOM.customGoal.style.display = DOM.goalSelector.value === 'custom' ? 'block' : 'none';
        clearProjections();
    };

    const handleCalculation = () => {
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
                e.target.textContent = isFixed ? 'Fixado' : 'Fixar';
                input.readOnly = isFixed;
                if (isFixed) input.classList.remove('projected-grade');
                clearProjections();
                updateResults();
            }
        }
    };

    const handleGradeInput = e => {
        if (e.target.matches('input[type="number"]')) {
            e.target.classList.remove('projected-grade');
            const prefix = e.target.id.substring(0, 2);
            const score = calculateScore(getInputs(prefix), DOM.subjectSelector.value, DOM.yearSelector.value);
            getEl(`${prefix}_result`).textContent = score.toFixed(2);
        }
    };

    const clearAll = () => {
        document.querySelectorAll('input[type="number"]').forEach(input => {
            input.value = input.id.endsWith('_bns') ? '0' : '';
            input.classList.remove('is-fixed', 'projected-grade');
            input.readOnly = false;
        });
        document.querySelectorAll('.btn-fix').forEach(btn => {
            btn.classList.remove('fixed-active');
            btn.textContent = 'Fixar';
            btn.setAttribute('aria-pressed', 'false');
        });
        DOM.goalSelector.value = "6.0";
        DOM.customGoal.style.display = 'none';
        clearProjections();
        updateResults();
    };

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

    // Inicialização
    initTheme();
    DOM.trimestersWrapper.innerHTML = TRIMS.map((_, i) => createTrimesterCard(i + 1)).join('');
    
    // Event Listeners
    DOM.themeToggle.addEventListener('click', toggleTheme);
    DOM.yearSelector.addEventListener('change', handleYearChange);
    DOM.subjectSelector.addEventListener('change', handleSubjectChange);
    DOM.goalSelector.addEventListener('change', handleGoalChange);
    DOM.customGoal.addEventListener('input', handleGoalChange);
    DOM.calculateAll.addEventListener('click', handleCalculation);
    DOM.clearAll.addEventListener('click', clearAll);
    DOM.trimestersWrapper.addEventListener('click', handleFixButton);
    DOM.trimestersWrapper.addEventListener('input', handleGradeInput);
});