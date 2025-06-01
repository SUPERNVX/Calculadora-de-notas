document.addEventListener('DOMContentLoaded', () => {
    const trimPrefixes = ['t1', 't2', 't3'];
    const gradeIds = ['at1', 'at2', 'at3', 'cr1', 'av1', 'av2', 'bns'];
    const DEFAULT_TARGET_TRIMESTER_GRADE = 6.0; 
    const PASSING_SUM_ANNUAL = 18.0;
    const MIN_PASSING_PER_TRIMESTER = 6.0; 
    const MIN_GRADE_INPUT = 0;
    const MAX_GRADE_INPUT = 10;

    const goalSelector = document.getElementById('goalSelector');
    
    // Lógica para o modo escuro
    const themeToggle = document.getElementById('theme-toggle');
    
    // Verifica se há uma preferência salva
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        // Verifica a preferência do sistema
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        if (prefersDarkScheme.matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }
    
    // Alterna o tema quando o botão é clicado
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
    
    function calculateTrimesterScore(inputs) {
        const { at1, at2, at3, cr1, av1, av2, bns } = inputs;
        const pFloat = (val) => {
            const num = parseFloat(val);
            return isNaN(num) ? 0 : num;
        };
        const m_at = (pFloat(at1) + pFloat(at2) + pFloat(at3)) / 3;
        const m_av = (pFloat(av1) + pFloat(av2)) / 2;
        const part1 = (m_at * 2 + pFloat(cr1)) / 3;
        const part2 = m_av * 2;
        let trimesterScore = (part1 + part2) / 3 + pFloat(bns);
        return Math.max(0, trimesterScore); 
    }

    function getInputs(prefix) { 
        const inputs = {};
        gradeIds.forEach(id => {
            const inputEl = document.getElementById(`${prefix}_${id}`);
            inputs[id] = inputEl ? inputEl.value : undefined;
        });
        return inputs;
    }
    
    function setInput(prefix, id, value, isProjectionFill = false) {
        const inputEl = document.getElementById(`${prefix}_${id}`);
        if (inputEl && !inputEl.classList.contains('is-fixed')) { 
            const currentValue = inputEl.value;
            const newValueString = value === null || value === undefined ? "" : value.toFixed(2);
            if (currentValue !== newValueString || isProjectionFill) {
                inputEl.value = newValueString;
                if (isProjectionFill && newValueString !== "") {
                    inputEl.classList.add('projected-grade');
                } else if (!isProjectionFill || newValueString === "") { 
                    inputEl.classList.remove('projected-grade');
                }
            }
        }
    }
    
    document.querySelectorAll('.btn-fix').forEach(button => {
        button.addEventListener('click', function() {
            const targetInputId = this.dataset.targetInput;
            const targetInput = document.getElementById(targetInputId);
            if (targetInput) {
                targetInput.classList.toggle('is-fixed');
                this.classList.toggle('fixed-active');
                targetInput.readOnly = targetInput.classList.contains('is-fixed');
                this.textContent = targetInput.classList.contains('is-fixed') ? 'Fixado' : 'Fixar';
                if (targetInput.classList.contains('is-fixed')) targetInput.classList.remove('projected-grade');
                
                const prefix = targetInputId.substring(0, 2);
                const currentTrimesterInputs = getInputs(prefix);
                const currentTrimesterScore = calculateTrimesterScore(currentTrimesterInputs);
                document.getElementById(`${prefix}_result`).textContent = currentTrimesterScore.toFixed(2);
            }
        });
    });

    function solveForX(targetTrimesterScore, prefixForX) {
        const bnsEl = document.getElementById(prefixForX + '_bns');
        const bnsIsFixed = bnsEl ? bnsEl.classList.contains('is-fixed') : false;
        const bnsValueIfPresent = (bnsEl && bnsEl.value !== "") ? parseFloat(bnsEl.value) : 0;
        const bnsToUse = (bnsIsFixed || (bnsEl && bnsEl.value !== "")) ? bnsValueIfPresent : 0;

        let targetNoBns = targetTrimesterScore - bnsToUse;

        let sumAtFixed = 0, numAtX = 0;
        let sumAvFixed = 0, numAvX = 0;
        let crFixedValue = null, crIsX = false;

        ['at1', 'at2', 'at3'].forEach(id => {
            const el = document.getElementById(prefixForX + '_' + id);
            if (el.classList.contains('is-fixed')) {
                sumAtFixed += (parseFloat(el.value) || 0);
            } else { numAtX++; }
        });
        ['av1', 'av2'].forEach(id => {
            const el = document.getElementById(prefixForX + '_' + id);
            if (el.classList.contains('is-fixed')) {
                sumAvFixed += (parseFloat(el.value) || 0);
            } else { numAvX++; }
        });
        const cr1El = document.getElementById(prefixForX + '_cr1');
        if (cr1El.classList.contains('is-fixed')) {
            crFixedValue = (parseFloat(cr1El.value) || 0);
        } else { crIsX = true; }

        const constantPartGlobal = ( (2/3) * sumAtFixed + (crIsX ? 0 : crFixedValue) + 3 * sumAvFixed );
        const coeffXGlobal = ( (2/3) * numAtX + (crIsX ? 1 : 0) + 3 * numAvX );
        
        if (Math.abs(coeffXGlobal) < 0.00001) {
            const currentValuesForCalc = getInputs(prefixForX);
            const currentCalcScore = calculateTrimesterScore(currentValuesForCalc);
            if (Math.abs(currentCalcScore - targetTrimesterScore) < 0.01) return { x: null, message: "Notas atuais já atingem o objetivo do trimestre." };
            return { x: null, message: `Não é possível projetar X (campos variáveis fixos). Média atual do tri: ${currentCalcScore.toFixed(2)}.` };
        }
        let x = (9 * targetNoBns - constantPartGlobal) / coeffXGlobal;
        return { x: x, message: null };
    }

    function handleCalculateAll() {
        document.querySelectorAll('input.projected-grade:not(.is-fixed)').forEach(inputEl => {
            inputEl.classList.remove('projected-grade');
        });

        let trimesterScores = {t1: null, t2: null, t3: null};
        let projectionMessages = [];
        const selectedGoal = goalSelector.value;
        let targetTrimesterAverageForProjection = DEFAULT_TARGET_TRIMESTER_GRADE;

        if (selectedGoal !== "pass_year") {
            targetTrimesterAverageForProjection = parseFloat(selectedGoal);
        }

        trimPrefixes.forEach(prefix => {
            trimesterScores[prefix] = calculateTrimesterScore(getInputs(prefix));
            document.getElementById(`${prefix}_result`).textContent = trimesterScores[prefix].toFixed(2);
        });

        if (selectedGoal === "pass_year") {
            let sumOfKnownTrimesters = 0;
            let futureTrimestersToProjectFor = [];
            let knownTrimesterData = {}; // Para armazenar pontuação de trimestres já definidos

            trimPrefixes.forEach(prefix => {
                let hasNonFixedEmptyGradeField = false;
                gradeIds.forEach(gid => {
                    if (gid === 'bns') return; // BNS não define se um trimestre é "futuro" para projeção de X
                    const el = document.getElementById(`${prefix}_${gid}`);
                    if (!el.classList.contains('is-fixed') && el.value === "") {
                        hasNonFixedEmptyGradeField = true;
                    }
                });

                if (hasNonFixedEmptyGradeField) { // Se tem campos para projetar (não fixos e vazios)
                     // Só adiciona se um trimestre anterior já tem conteúdo (ou se é o primeiro com campos a projetar)
                    const t1HasContent = Object.values(getInputs('t1')).some((v, i) => v !== "" && !(v==="0" && gradeIds[i] === "bns"));
                    const t2HasContent = Object.values(getInputs('t2')).some((v, i) => v !== "" && !(v==="0" && gradeIds[i] === "bns"));

                    if (prefix === 't1' || (prefix === 't2' && t1HasContent) || (prefix === 't3' && (t1HasContent || t2HasContent)) ) {
                        futureTrimestersToProjectFor.push(prefix);
                    } else { // Trimestre não tem campos para projetar OU não é elegível ainda
                        knownTrimesterData[prefix] = trimesterScores[prefix];
                        sumOfKnownTrimesters += trimesterScores[prefix];
                    }
                } else { // Não tem campos para projetar (tudo fixo/preenchido)
                    knownTrimesterData[prefix] = trimesterScores[prefix];
                    sumOfKnownTrimesters += trimesterScores[prefix];
                }
            });
            
            if (futureTrimestersToProjectFor.length > 0) {
                let remainingSumNeededFor18 = PASSING_SUM_ANNUAL - sumOfKnownTrimesters;
                let targetPerFutureTrimesterGeneral = remainingSumNeededFor18 / futureTrimestersToProjectFor.length;
                
                projectionMessages.push(`Modo "Passar de ano": Soma atual dos trimestres definidos: ${sumOfKnownTrimesters.toFixed(2)}. Necessário mais ${remainingSumNeededFor18.toFixed(2)} no(s) ${futureTrimestersToProjectFor.length} trimestre(s) restantes.`);

                futureTrimestersToProjectFor.forEach(prefix => {
                    // Para o modo "Passar de ano", usamos apenas a distribuição necessária para atingir 18
                    // Não forçamos mínimo de 6.0 por trimestre, apenas a soma total de 18
                    let actualTargetForThisTrimester = targetPerFutureTrimesterGeneral;
                    // Limitamos apenas pelos valores possíveis (0-10)
                    actualTargetForThisTrimester = Math.max(MIN_GRADE_INPUT, Math.min(MAX_GRADE_INPUT, actualTargetForThisTrimester));

                    projectionMessages.push(`Projetando ${prefix.toUpperCase()} para média ~${actualTargetForThisTrimester.toFixed(2)} para atingir a soma anual de ${PASSING_SUM_ANNUAL}.`);

                    const result = solveForX(actualTargetForThisTrimester, prefix);
                    if (result.x !== null && result.message === null) {
                        let projectedX = result.x;
                        projectedX = Math.max(MIN_GRADE_INPUT, Math.min(MAX_GRADE_INPUT, projectedX));
                        gradeIds.forEach(id => {
                            if (id === 'bns') return;
                            const elToFill = document.getElementById(`${prefix}_${id}`);
                            if (!elToFill.classList.contains('is-fixed')) {
                                setInput(prefix, id, projectedX, true);
                            }
                        });
                    } else if (result.message) {
                        projectionMessages.push(`Projeção ${prefix.toUpperCase()}: ${result.message}`);
                    }
                });
            } else if (Object.keys(knownTrimesterData).length === 3 && sumOfKnownTrimesters < PASSING_SUM_ANNUAL) { // Todos definidos, mas soma < 18
                projectionMessages.push(`Modo "Passar de ano": Todos os trimestres estão definidos. Soma atual ${sumOfKnownTrimesters.toFixed(2)} não atinge ${PASSING_SUM_ANNUAL}.`);
            } else if (Object.keys(knownTrimesterData).length === 3 && sumOfKnownTrimesters >= PASSING_SUM_ANNUAL) {
                projectionMessages.push(`Modo "Passar de ano": Todos os trimestres definidos e soma ${sumOfKnownTrimesters.toFixed(2)} atinge/supera ${PASSING_SUM_ANNUAL}.`);
            }


        } else { 
            projectionMessages.push(`Modo "Média ${targetTrimesterAverageForProjection.toFixed(1)}": Projetando trimestres futuros para esta média.`);
            const t1HasContent = Object.values(getInputs('t1')).some((v, i) => v !== "" && !(v==="0" && gradeIds[i] === "bns"));
            if (t1HasContent) processSingleTrimesterProjection('t2', targetTrimesterAverageForProjection, projectionMessages, trimesterScores);
            
            const t2HasContent = Object.values(getInputs('t2')).some((v, i) => v !== "" && !(v==="0" && gradeIds[i] === "bns"));
            if (t1HasContent || t2HasContent) processSingleTrimesterProjection('t3', targetTrimesterAverageForProjection, projectionMessages, trimesterScores);
        }

        let finalAnnualSum = 0;
        let finalTrimestersConsidered = 0;
        trimPrefixes.forEach(p => {
            const currentScore = calculateTrimesterScore(getInputs(p));
            trimesterScores[p] = currentScore; 
            document.getElementById(`${p}_result`).textContent = currentScore.toFixed(2);
            
            let hasContent = gradeIds.some((gid, i) => {
                const elVal = document.getElementById(`${p}_${gid}`).value;
                if (gid === 'bns') return elVal !== "" && elVal !== "0";
                return elVal !== "";
            });
            if (hasContent) {
                finalAnnualSum += currentScore;
                finalTrimestersConsidered++;
            }
        });

        if (finalTrimestersConsidered > 0) {
            document.getElementById('annual_sum').textContent = finalAnnualSum.toFixed(2);
        } else {
            document.getElementById('annual_sum').textContent = "-";
        }

        if (finalTrimestersConsidered === 3) {
            let passedAllMinRequirements = true;
            Object.values(trimesterScores).forEach(s => {
                if (s < MIN_PASSING_PER_TRIMESTER - 0.001) passedAllMinRequirements = false;
            });
            const sumIsOkForPassing = finalAnnualSum >= PASSING_SUM_ANNUAL - 0.001;

            // Para aprovação, precisa apenas: soma >= 18 (removida a exigência de cada trimestre >= 6.0)
            if (sumIsOkForPassing) {
                document.getElementById('annual_status').textContent = "APROVADO!";
                if (!projectionMessages.some(m => m.toLowerCase().includes("aprovado"))) {
                   projectionMessages.push("Parabéns! Com estas notas, você está aprovado (soma >= 18).");
                }
            } else {
                document.getElementById('annual_status').textContent = "RECUPERAÇÃO";
                 if (!passedAllMinRequirements) {
                    let recoveryMsg = "Atenção: Recomendado >= " + MIN_PASSING_PER_TRIMESTER.toFixed(1) + " em cada trimestre. Abaixo: ";
                    let below = [];
                    trimPrefixes.forEach(pr => {
                        if(trimesterScores[pr] < MIN_PASSING_PER_TRIMESTER - 0.001) {
                            below.push(`${pr.toUpperCase()} (${trimesterScores[pr].toFixed(2)})`);
                        }
                    });
                    projectionMessages.push(recoveryMsg + below.join(', ') + ".");
                }
                if (!sumIsOkForPassing) {
                    projectionMessages.push(`Recuperação: Soma das médias (${finalAnnualSum.toFixed(2)}) abaixo de ${PASSING_SUM_ANNUAL.toFixed(1)}.`);
                }
            }
            if (selectedGoal !== "pass_year" && selectedGoal !== "6.0") {
                const targetMetaVal = parseFloat(selectedGoal);
                let allTrimestersMeetMeta = true;
                Object.values(trimesterScores).forEach(s => {
                    if (s < targetMetaVal - 0.001) allTrimestersMeetMeta = false;
                });
                if (allTrimestersMeetMeta) {
                    projectionMessages.push(`Meta de ${targetMetaVal.toFixed(1)} por trimestre atingida!`);
                } else {
                    projectionMessages.push(`Atenção: Nem todos os trimestres atingiram a meta de ${targetMetaVal.toFixed(1)}.`);
                }
            }

        } else if (finalTrimestersConsidered > 0) {
            document.getElementById('annual_status').textContent = "PARCIAL";
            if (projectionMessages.length === 0 || !projectionMessages.some(m => m.includes("Preencha"))) {
                projectionMessages.push("Preencha/calcule todos os trimestres para o status final.");
            }
        } else {
            document.getElementById('annual_status').textContent = "-";
             if (projectionMessages.length === 0 || !projectionMessages.some(m => m.includes("Nenhuma nota inserida"))) {
                 projectionMessages.push("Nenhuma nota inserida para calcular o resultado anual.");
            }
        }
        
        const projectionMessageContent = document.getElementById('projection_message_content');
        // Limpar mensagens anteriores antes de adicionar novas, exceto se for uma mensagem global.
        let finalMessages = projectionMessages.filter((msg, index, self) => 
            index === self.findIndex((t) => (
                t.split(':')[0] === msg.split(':')[0] // Mantém apenas a última mensagem por prefixo/tipo
            )) || !msg.includes("Projeção T") // Mantém mensagens globais
        );


        if (finalMessages.length > 0) {
            projectionMessageContent.innerHTML = finalMessages.map(msg => `<span>${msg}</span>`).join('<br>');
        } else {
            projectionMessageContent.textContent = "Nenhuma projeção ou alerta específico no momento.";
        }
    }

    function processSingleTrimesterProjection(prefix, targetAverage, projectionMessagesRef, trimesterScoresRef) {
        let hasNonFixedEmptyFields = gradeIds.some(gid => {
            if (gid === 'bns') return false; 
            const el = document.getElementById(`${prefix}_${gid}`);
            return !el.classList.contains('is-fixed') && el.value === ""; // Só projeta se tiver campos vazios E não fixos
        });

        if (!hasNonFixedEmptyFields) {
            let existingMsgIndex = projectionMessagesRef.findIndex(m => m.startsWith(`Projeção ${prefix.toUpperCase()}`));
            if (existingMsgIndex !== -1) projectionMessagesRef.splice(existingMsgIndex, 1);
            projectionMessagesRef.push(`Projeção ${prefix.toUpperCase()}: Todos os campos de notas principais estão preenchidos ou fixos. Nenhuma projeção de X realizada.`);
            trimesterScoresRef[prefix] = calculateTrimesterScore(getInputs(prefix)); 
            document.getElementById(`${prefix}_result`).textContent = trimesterScoresRef[prefix].toFixed(2);
            return;
        }

        const result = solveForX(targetAverage, prefix);
        if (result.x !== null && result.message === null) {
            let projectedX = result.x;
            let projectionNote = "";
            projectedX = Math.max(MIN_GRADE_INPUT, Math.min(MAX_GRADE_INPUT, projectedX));
            projectionNote = `Para média ${targetAverage.toFixed(1)}, notas não fixadas precisam ser ~${projectedX.toFixed(2)}.`;
            
            let existingMsgIndex = projectionMessagesRef.findIndex(m => m.startsWith(`Projeção ${prefix.toUpperCase()}`));
            if (existingMsgIndex !== -1) projectionMessagesRef.splice(existingMsgIndex, 1);
            projectionMessagesRef.push(`Projeção ${prefix.toUpperCase()}: ${projectionNote}`);

            gradeIds.forEach(id => {
                if (id === 'bns') return;
                const elToFill = document.getElementById(`${prefix}_${id}`);
                if (!elToFill.classList.contains('is-fixed') && elToFill.value === "") { // Só preenche vazios não fixos
                    setInput(prefix, id, projectedX, true);
                }
            });
            trimesterScoresRef[prefix] = calculateTrimesterScore(getInputs(prefix));
        } else if (result.message) {
            let existingMsgIndex = projectionMessagesRef.findIndex(m => m.startsWith(`Projeção ${prefix.toUpperCase()}`));
            if (existingMsgIndex !== -1) projectionMessagesRef.splice(existingMsgIndex, 1);
            if(!result.message.includes("atingem o objetivo")){
                 projectionMessagesRef.push(`Projeção ${prefix.toUpperCase()}: ${result.message}`);
            }
            trimesterScoresRef[prefix] = calculateTrimesterScore(getInputs(prefix)); 
        }
        document.getElementById(`${prefix}_result`).textContent = trimesterScoresRef[prefix].toFixed(2);
    }

    function clearAllInputs() {
        trimPrefixes.forEach(prefix => {
            gradeIds.forEach(id => {
                const inputEl = document.getElementById(`${prefix}_${id}`);
                const btnFixEl = document.querySelector(`.btn-fix[data-target-input="${prefix}_${id}"]`);
                if (inputEl) {
                    inputEl.value = (id === 'bns') ? "0" : "";
                    inputEl.classList.remove('is-fixed', 'projected-grade');
                    inputEl.readOnly = false; 
                }
                if (btnFixEl) {
                    btnFixEl.classList.remove('fixed-active');
                    btnFixEl.textContent = 'Fixar';
                }
            });
            document.getElementById(`${prefix}_result`).textContent = "-";
        });
        document.getElementById('annual_sum').textContent = "-";
        document.getElementById('annual_status').textContent = "-";
        document.getElementById('projection_message_content').textContent = "Nenhuma projeção ainda. Preencha as notas e clique em calcular.";
        goalSelector.value = "6.0"; 
    }

    document.getElementById('calculateAll').addEventListener('click', handleCalculateAll);
    document.getElementById('clearAll').addEventListener('click', clearAllInputs);
    // Modifica o comportamento quando o filtro muda
    goalSelector.addEventListener('change', () => {
        // Remove todas as notas projetadas (não fixadas) antes de recalcular
        document.querySelectorAll('input.projected-grade:not(.is-fixed)').forEach(inputEl => {
            inputEl.value = "";
            inputEl.classList.remove('projected-grade');
        });
        // Não recalcula automaticamente com o novo filtro
        // handleCalculateAll(); - Esta linha foi removida
    });

    trimPrefixes.forEach(prefix => {
        gradeIds.forEach(id => {
            const inputEl = document.getElementById(`${prefix}_${id}`);
            if (inputEl) { 
                inputEl.addEventListener('input', () => {
                    if (!inputEl.classList.contains('is-fixed')) { 
                        inputEl.classList.remove('projected-grade');
                        const currentTrimesterInputs = getInputs(prefix);
                        const currentTrimesterScore = calculateTrimesterScore(currentTrimesterInputs);
                        document.getElementById(`${prefix}_result`).textContent = currentTrimesterScore.toFixed(2);
                    }
                });
            }
        });
    });
});