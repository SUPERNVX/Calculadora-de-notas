document.addEventListener('DOMContentLoaded', () => {
    // #region CONSTANTS AND CONFIGURATION
    const SCHOOL_YEAR_EM3 = 'em_3';
    const PASSING_SUM_ANNUAL = 24.0;
    const MIN_GRADE_INPUT = 0;
    const MAX_GRADE_INPUT = 10;
    const THEME_KEY = 'theme';

    const gradeIds = ['at1', 'at2', 'at3', 'cr1', 'av1', 'av2', 'sim', 'bns'];
    const trimPrefixes = ['t1', 't2', 't3'];

    const ALL_SUBJECTS = [
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
    // #endregion

    // #region DOM ELEMENT CACHE
    const docElement = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const yearSelector = document.getElementById('yearSelector');
    const subjectSelectorContainer = document.getElementById('subject-selector-container');
    const subjectSelector = document.getElementById('subjectSelector');
    const goalSelector = document.getElementById('goalSelector');
    const customGoalValueInput = document.getElementById('customGoalValue');
    const trimestersWrapper = document.getElementById('trimesters-wrapper');
    const calculateAllButton = document.getElementById('calculateAll');
    const clearAllButton = document.getElementById('clearAll');
    const annualSumEl = document.getElementById('annual_sum');
    const annualStatusEl = document.getElementById('annual_status');
    const projectionMessageContentEl = document.getElementById('projection_message_content');
    // #endregion

    // #region CORE CALCULATION LOGIC
    const pFloat = (val) => {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
    };

    const getEffectiveSubjectConfig = (subjectValue, schoolYear) => {
        const subject = ALL_SUBJECTS.find(s => s.value === subjectValue) || ALL_SUBJECTS[0];
        if (schoolYear === SCHOOL_YEAR_EM3 && (subjectValue === 'historia' || subjectValue === 'geografia')) {
            return { ...subject, usesAV2: true };
        }
        return subject;
    };

    const calculateTrimesterScore = (inputs, subjectValue, schoolYear) => {
        const config = getEffectiveSubjectConfig(subjectValue, schoolYear);
        let score = 0;
        const { at1, at2, at3, cr1, av1, sim, bns } = inputs;

        if (config.usesAV2) {
            const { av2 } = inputs;
            const m_at = (pFloat(at1) + pFloat(at2) + pFloat(at3)) / 3;
            const m_av = (pFloat(av1) + pFloat(av2)) / 2;
            score = (2 * m_av / 3) + (m_at / 6) + (pFloat(sim) / 12) + (pFloat(cr1) / 12);
        } else {
            const m_at_grupob = (pFloat(at1) + pFloat(at2) + pFloat(at3)) / 3;
            score = (2 * pFloat(av1) / 3) + (m_at_grupob / 6) + (pFloat(sim) / 12) + (pFloat(cr1) / 12);
        }
        return Math.max(0, score + pFloat(bns));
    };

    const solveForX = (targetScore, prefix) => {
        const bnsValue = pFloat(document.getElementById(`${prefix}_bns`)?.value);
        const targetAdjusted = targetScore - bnsValue;
        
        let fixedValueSum = 0;
        let xCoefficientSum = 0;
        
        const config = getEffectiveSubjectConfig(subjectSelector.value, yearSelector.value);
        const weights = {
            at1: 1/18, at2: 1/18, at3: 1/18,
            av1: config.usesAV2 ? 1/3 : 2/3,
            av2: config.usesAV2 ? 1/3 : 0,
            sim: 1/12, cr1: 1/12, bns: 0
        };

        gradeIds.forEach(id => {
            if (id === 'bns' || (id === 'av2' && !config.usesAV2)) return;
            const el = document.getElementById(`${prefix}_${id}`);
            if (el && (el.classList.contains('is-fixed') || el.value !== "")) {
                fixedValueSum += pFloat(el.value) * weights[id];
            } else if (el) {
                xCoefficientSum += weights[id];
            }
        });

        if (Math.abs(xCoefficientSum) < 0.0001) {
            return { x: null, message: "Não há campos livres para projetar a nota." };
        }
        return { x: (targetAdjusted - fixedValueSum) / xCoefficientSum, message: null };
    };
    // #endregion

    // #region DYNAMIC HTML GENERATION
    const createTrimesterCard = (trimNumber) => {
        const prefix = `t${trimNumber}`;
        const inputsHTML = gradeIds.map(id => {
            const labelText = {
                at1: "AT1 (Atividade 1)", at2: "AT2 (Atividade 2)", at3: "AT3 (Atividade 3)",
                cr1: `CR${trimNumber} (Cidadania)`, av1: "AV1 (Prova 1)", av2: "AV2 (Prova 2)",
                sim: "SIM (Simulado)", bns: "BNS (Bônus)"
            }[id];
            const valueAttr = id === 'bns' ? 'value="0"' : '';
            return `
                <div class="input-group" data-grade-id="${id}">
                    <label for="${prefix}_${id}">${labelText}:</label>
                    <div class="input-field-wrapper">
                        <input type="number" id="${prefix}_${id}" ${valueAttr} step="0.01" min="0" max="10" placeholder="0.00">
                        <button class="btn-fix" data-target-input="${prefix}_${id}" aria-pressed="false">Fixar</button>
                    </div>
                </div>`;
        }).join('');

        return `
            <div class="trimester-card" id="trim${trimNumber}_card">
                <h2>Trimestre ${trimNumber}</h2>
                <div class="input-grid">${inputsHTML}</div>
                <div class="result">Média Trimestral ${trimNumber}: <span id="${prefix}_result" aria-live="polite">-</span></div>
            </div>`;
    };

    const initializeTrimesterCards = () => {
        trimestersWrapper.innerHTML = trimPrefixes.map((_, i) => createTrimesterCard(i + 1)).join('');
    };
    // #endregion

    // #region UI UPDATE FUNCTIONS
    const updateSubjectSelectorOptions = () => {
        const selectedYear = yearSelector.value;
        const currentSubject = subjectSelector.value;
        subjectSelector.innerHTML = '';

        const groups = {
            twoTests: document.createElement('optgroup'),
            oneTest: document.createElement('optgroup')
        };
        groups.twoTests.label = 'Duas provas Trimestrais';
        groups.oneTest.label = 'Uma prova Trimestral';

        ALL_SUBJECTS.forEach(subject => {
            const config = getEffectiveSubjectConfig(subject.value, selectedYear);
            const option = new Option(subject.text, subject.value);
            (config.usesAV2 ? groups.twoTests : groups.oneTest).appendChild(option);
        });
        
        subjectSelector.appendChild(groups.twoTests);
        if (groups.oneTest.childElementCount > 0) {
            subjectSelector.appendChild(groups.oneTest);
        }

        subjectSelector.value = Array.from(subjectSelector.options).some(opt => opt.value === currentSubject) ? currentSubject : subjectSelector.options[0].value;
    };

    const updateInputFieldsVisibility = () => {
        const config = getEffectiveSubjectConfig(subjectSelector.value, yearSelector.value);
        document.querySelectorAll('[data-grade-id="av2"]').forEach(group => {
            group.style.display = config.usesAV2 ? '' : 'none';
            if (!config.usesAV2) { // Clear AV2 value if hidden
                group.querySelector('input').value = '';
            }
        });
    };
    
    /**
     * The main function called by the "Calculate/Project" button.
     * It performs all actions: clearing, projecting, and updating results.
     */
    const handleCalculationAndProjection = () => {
        clearProjectedGrades();
        const strategy = getProjectionStrategy();
        applyProjections(strategy); // This fills the empty fields
        updateAllResults(); // This calculates the final numbers
    };

    /**
     * Recalculates all results based on current inputs without projecting new grades.
     * Used when changing year or subject.
     */
    const recalculateExistingValues = () => {
        clearProjectedGrades();
        updateAllResults();
    };
    
    const updateAllResults = () => {
        let annualSum = 0;
        let filledTrimesters = 0;
        const trimesterScores = {};
        const projectionMessages = [];
        
        trimPrefixes.forEach((prefix, i) => {
            const inputs = getInputs(prefix);
            const score = calculateTrimesterScore(inputs, subjectSelector.value, yearSelector.value);
            trimesterScores[prefix] = score;
            document.getElementById(`${prefix}_result`).textContent = score.toFixed(2);
            
            const hasContent = gradeIds.some(id => id !== 'bns' && pFloat(inputs[id]) > 0);
            if (hasContent || score > 0) {
                annualSum += score * (i === 2 ? 2 : 1); // Weight 2 for 3rd trimester
                filledTrimesters++;
            }
        });

        updateAnnualSummaryUI(annualSum, filledTrimesters, trimesterScores, projectionMessages);
    };

    const updateAnnualSummaryUI = (annualSum, filledTrimesters, scores, messages) => {
        let status = '-';
        let finalMessages = [...messages];

        if (filledTrimesters === 0) {
            annualSumEl.textContent = '-';
            finalMessages.push("Nenhuma nota inserida para calcular o resultado anual.");
        } else {
            annualSumEl.textContent = annualSum.toFixed(2);
            if (filledTrimesters < 3) {
                status = "PARCIAL";
                finalMessages.push("Preencha ou projete todos os trimestres para o status final.");
            } else {
                if (annualSum >= PASSING_SUM_ANNUAL) {
                    status = "APROVADO!";
                    finalMessages.push(`Parabéns! Com a soma de ${annualSum.toFixed(2)}, você está aprovado.`);
                } else {
                    status = "RECUPERAÇÃO";
                    finalMessages.push(`Recuperação: Soma das médias (${annualSum.toFixed(2)}) abaixo de ${PASSING_SUM_ANNUAL}.`);
                }
            }
        }
        annualStatusEl.textContent = status;
        projectionMessageContentEl.innerHTML = finalMessages.length > 0
            ? finalMessages.map(msg => `<span>${msg}</span>`).join('<br>')
            : '<span>Preencha as notas e clique em calcular.</span>';
    };

    const getInputs = (prefix) => Object.fromEntries(gradeIds.map(id => [id, document.getElementById(`${prefix}_${id}`)?.value]));
    
    const clearProjectedGrades = () => {
        document.querySelectorAll('input.projected-grade:not(.is-fixed)').forEach(el => {
            el.value = '';
            el.classList.remove('projected-grade');
        });
    };
    // #endregion

    // #region PROJECTION LOGIC
    const getProjectionStrategy = () => {
        const goal = goalSelector.value;
        if (goal === 'pass_year') return { type: 'pass_year' };
        if (goal === 'custom') {
            const val = pFloat(customGoalValueInput.value);
            return { type: 'target_average', target: (val >= MIN_GRADE_INPUT && val <= MAX_GRADE_INPUT) ? val : 6.0 };
        }
        return { type: 'target_average', target: pFloat(goal) };
    };

    const applyProjections = (strategy) => {
        if (strategy.type === 'pass_year') {
            projectForPassingYear();
        } else if (strategy.type === 'target_average') {
            projectForTargetAverage(strategy.target);
        }
    };
    
    const projectForPassingYear = () => {
        let knownSum = 0;
        let futureTrimesters = [];

        trimPrefixes.forEach((prefix, i) => {
            const hasEmptyFields = gradeIds.some(id => {
                const el = document.getElementById(`${prefix}_${id}`);
                return id !== 'bns' && el && !el.classList.contains('is-fixed') && el.value === '';
            });

            if (hasEmptyFields) {
                futureTrimesters.push(prefix);
            } else {
                const score = calculateTrimesterScore(getInputs(prefix), subjectSelector.value, yearSelector.value);
                knownSum += score * (i === 2 ? 2 : 1);
            }
        });
        
        if (futureTrimesters.length > 0) {
            const remainingSumNeeded = PASSING_SUM_ANNUAL - knownSum;
            const totalWeightOfFuture = futureTrimesters.reduce((sum, prefix) => sum + (prefix === 't3' ? 2 : 1), 0);
            const targetGrade = totalWeightOfFuture > 0 ? (remainingSumNeeded / totalWeightOfFuture) : 0;
            
            futureTrimesters.forEach(prefix => {
                fillProjectedFields(prefix, targetGrade);
            });
        }
    };

    const projectForTargetAverage = (target) => {
        trimPrefixes.forEach(prefix => {
            const hasEmptyFields = gradeIds.some(id => {
                const el = document.getElementById(`${prefix}_${id}`);
                return id !== 'bns' && el && !el.classList.contains('is-fixed') && el.value === '';
            });
            if (hasEmptyFields) {
                fillProjectedFields(prefix, target);
            }
        });
    };

    const fillProjectedFields = (prefix, targetGrade) => {
        const result = solveForX(targetGrade, prefix);
        if (result.x !== null) {
            const projectedValue = Math.max(MIN_GRADE_INPUT, Math.min(MAX_GRADE_INPUT, result.x));
            gradeIds.forEach(id => {
                if (id === 'bns') return;
                const el = document.getElementById(`${prefix}_${id}`);
                if (el && !el.classList.contains('is-fixed') && el.value === '') {
                    el.value = projectedValue.toFixed(2);
                    el.classList.add('projected-grade');
                }
            });
        }
    };
    // #endregion

    // #region EVENT HANDLERS & INITIALIZATION
    const handleYearChange = () => {
        const selectedYear = yearSelector.value;
        if (selectedYear) {
            subjectSelectorContainer.classList.remove('hidden-subject-selector');
            subjectSelectorContainer.style.maxHeight = subjectSelectorContainer.scrollHeight + "px";
            updateSubjectSelectorOptions();
            updateInputFieldsVisibility();
            recalculateExistingValues();
        } else {
            subjectSelectorContainer.style.maxHeight = "0px";
            subjectSelectorContainer.classList.add('hidden-subject-selector');
        }
    };

    const handleSubjectChange = () => {
        updateInputFieldsVisibility();
        recalculateExistingValues();
    };
    
    const handleGoalChange = () => {
        customGoalValueInput.style.display = goalSelector.value === 'custom' ? 'block' : 'none';
        clearProjectedGrades(); // Only clear projections, don't apply new ones
    };

    const handleFixButtonClick = (e) => {
        if (e.target.classList.contains('btn-fix')) {
            const targetInputId = e.target.dataset.targetInput;
            const targetInput = document.getElementById(targetInputId);
            if (targetInput) {
                const isFixed = targetInput.classList.toggle('is-fixed');
                e.target.classList.toggle('fixed-active');
                e.target.setAttribute('aria-pressed', isFixed);
                e.target.textContent = isFixed ? 'Fixado' : 'Fixar';
                targetInput.readOnly = isFixed;
                if (isFixed) targetInput.classList.remove('projected-grade');
                recalculateExistingValues();
            }
        }
    };
    
    const handleGradeInput = (e) => {
        if (e.target.matches('input[type="number"]')) {
            e.target.classList.remove('projected-grade');
            const prefix = e.target.id.substring(0, 2);
            const score = calculateTrimesterScore(getInputs(prefix), subjectSelector.value, yearSelector.value);
            document.getElementById(`${prefix}_result`).textContent = score.toFixed(2);
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
        goalSelector.value = "6.0";
        customGoalValueInput.style.display = 'none';
        recalculateExistingValues();
    };

    const initializeTheme = () => {
        const savedTheme = localStorage.getItem(THEME_KEY);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        docElement.setAttribute('data-theme', savedTheme || (prefersDark ? 'dark' : 'light'));
    };

    const toggleTheme = () => {
        const currentTheme = docElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        docElement.setAttribute('data-theme', newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
    };

    // Initial setup
    initializeTheme();
    initializeTrimesterCards();
    
    // Event Listeners
    themeToggle.addEventListener('click', toggleTheme);
    yearSelector.addEventListener('change', handleYearChange);
    subjectSelector.addEventListener('change', handleSubjectChange);
    goalSelector.addEventListener('change', handleGoalChange);
    customGoalValueInput.addEventListener('input', handleGoalChange);
    calculateAllButton.addEventListener('click', handleCalculationAndProjection); // Main action button
    clearAllButton.addEventListener('click', clearAll);
    
    // Event Delegation for dynamic elements
    trimestersWrapper.addEventListener('click', handleFixButtonClick);
    trimestersWrapper.addEventListener('input', handleGradeInput);
    // #endregion
});