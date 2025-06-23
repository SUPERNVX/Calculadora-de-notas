// Função para exportar os resultados como PDF
function exportToPDF() {
    // Mostrar notificação de preparação (showToast é global de script.js)
    showToast('Preparando PDF...', 'info');
    
    // Coletar dados para o PDF
    const data = {
        year: DOM.yearSelector.value,
        yearText: DOM.yearSelector.options[DOM.yearSelector.selectedIndex].text,
        subject: DOM.subjectSelector.value,
        subjectText: DOM.subjectSelector.options[DOM.subjectSelector.selectedIndex].text,
        goal: DOM.goalSelector.value,
        goalText: DOM.goalSelector.options[DOM.goalSelector.selectedIndex].text,
        customGoal: DOM.customGoal.value,
        trimesterResults: [],
        annualSum: DOM.annualSum.textContent, // DOM é global de script.js
        annualStatus: DOM.annualStatus.textContent, // DOM é global de script.js
        customGoalStatusHtml: document.getElementById('custom_goal_status').parentElement.style.display !== 'none' ? document.getElementById('custom_goal_status').innerHTML : null,
        date: new Date().toLocaleDateString('pt-BR')
    };
    const currentSubjectConfig = window.getSubjectConfig(data.subject, data.year); // getSubjectConfig é global de script.js
    
    // Estilos para o PDF
    const styles = `
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 15mm; /* Margens para o conteúdo */
        }
        .top-info-section {
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        .top-info-section p {
            margin: 5px 0;
            font-size: 1.1em;
        }
        .top-info-section strong {
            color: #244a7b;
        }
        .trimesters-pdf-grid {
            display: flex; /* Usa flexbox para layout horizontal */
            justify-content: space-around; /* Distribui espaço uniformemente */
            gap: 5mm; /* Espaçamento entre os cards */
            flex-wrap: wrap; /* Permite quebrar linha se não couber */
            margin-bottom: 20px;
        }
        .trimester-pdf-card {
            width: 60mm; /* Largura fixa para cada card (aprox. 1/3 da largura A4 - margens) */
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background-color: #f9f9f9;
            box-sizing: border-box; /* Inclui padding e border na largura */
            flex-shrink: 0; /* Impede que os cards encolham */
        }
        .trimester-pdf-card h4 {
            text-align: center;
            color: #244a7b;
            margin-top: 0;
            margin-bottom: 5px;
            font-size: 1.1em;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }
        .grades-pdf-grid {
            display: grid;
            grid-template-columns: 1fr 1fr; /* 2 colunas para notas dentro do card */
            gap: 3px;
            font-size: 0.8em;
            margin-bottom: 5px;
        }
        .grade-pdf-item {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
        }
        .grade-pdf-label {
            font-weight: bold;
            color: #666;
        }
        .grade-pdf-value {
            color: #333;
        }
        .fixed-grade {
            background-color: #e9ecef;
        }
        .trim-result {
            text-align: center;
            font-weight: bold;
            font-size: 0.9em;
            margin-top: 5px;
            padding-top: 5px;
            border-top: 1px solid #eee;
        }
        .trim-result span {
            color: #244a7b;
        }
        .annual-summary-pdf {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f5f5f5; /* Fundo para o resumo anual */
            border-radius: 5px;
        }
        .annual-sum {
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .annual-summary-pdf h3 {
            color: #244a7b;
            margin-top: 0;
            margin-bottom: 15px;
            text-align: center;
            font-size: 1.3em;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
        }
        .annual-summary-pdf p {
            margin: 5px 0;
            font-size: 1.1em;
        }
        .annual-summary-pdf span {
            font-weight: bold;
            color: #244a7b;
        }
        .annual-status {
            font-size: 1.3em;
            padding: 8px 15px;
            display: inline-block;
            border-radius: 20px;
        }
        .status-approved {
            background-color: #d4edda;
            color: #155724;
        }
        .status-recovery {
            background-color: #f8d7da;
            color: #721c24;
        }
        .status-partial {
            background-color: #fff3cd;
            color: #856404;
        }
        .pdf-footer {
            position: fixed;
            bottom: 10mm;
            left: 0;
            width: 100%;
            text-align: center;
            font-size: 0.9em;
            color: #666;
            padding: 5mm 0;
        }
    `;
    
    // Conteúdo HTML para o PDF
    let content = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Calculadora de Notas - Relatório</title>
            <meta charset="UTF-8">
            <style>${styles}</style>
        </head>
        <body>
            <div class="top-info-section">
                <p><strong>Ano Escolar:</strong> ${data.yearText || 'Não selecionado'}</p>
                <p><strong>Matéria:</strong> ${data.subjectText || 'Não selecionada'}</p>
                <p><strong>Meta de Média Final:</strong> ${data.goalText || 'Não definida'} ${data.goal === 'custom' ? `(${data.customGoal})` : ''}</p>
            </div>
            
            <div class="trimesters-pdf-grid">
    `;

    // Coletar resultados dos trimestres
    // GRADES e TRIMS são globais de script.js
    window.TRIMS.forEach((prefix, i) => {
        const trimNumber = i + 1;
        content += `
            <div class="trimester-pdf-card">
                <h4>Trimestre ${trimNumber}</h4>
                <div class="grades-pdf-grid">
        `;
        
        // Adicionar notas
        const gradeLabels = {
            at1: "AT1 (Atividade 1)", 
            at2: "AT2 (Atividade 2)", 
            at3: "AT3 (Atividade 3)",
            cr1: `CR${trimNumber} (Cidadania)`, 
            av1: "AV1 (Prova 1)", 
            av2: "AV2 (Prova 2)",
            sim: "SIM (Simulado)", 
            bns: "BNS (Bônus)"
        };
        
        window.GRADES.forEach(id => { // GRADES é global de script.js
            const input = document.getElementById(`${prefix}_${id}`); // DOM é global de script.js
            if (!input) return;

            const value = input.value || '-';
            const isFixed = input.classList.contains('is-fixed');

            // Pular AV2 se não for usada
            if (id === 'av2' && !currentSubjectConfig.usesAV2) {
                return;
            }
            
            content += `
                <div class="grade-pdf-item ${isFixed ? 'fixed-grade' : ''}">
                    <span class="grade-label">${gradeLabels[id]}</span>
                    <span class="grade-value">${value}${isFixed ? ' (F)' : ''}</span>
                </div>
            `;
        });
        
        content += `
                </div>
                <p class="trim-result">Média: <span>${document.getElementById(`${prefix}_result`).textContent}</span></p>
            </div>
        `;
    });
    
    content += `</div> <!-- Fecha trimesters-pdf-grid -->`;

    // Adicionar resumo anual
    let statusClass = '';
    if (data.annualStatus === 'APROVADO!') {
        statusClass = 'status-approved';
    } else if (data.annualStatus === 'RECUPERAÇÃO') {
        statusClass = 'status-recovery';
    } else if (data.annualStatus === 'PARCIAL') {
        statusClass = 'status-partial';
    }
    
    content += ` 
        <div class="annual-summary-pdf">
            <h3>Resultado Anual Consolidado:</h3>
            <p>Soma das Médias Trimestrais: <span>${data.annualSum}</span></p>
            ${data.customGoalStatusHtml ? `<p>Status da Meta: <span>${data.customGoalStatusHtml}</span></p>` : ''}
            <p>Status Geral: <span class="${statusClass}">${data.annualStatus}</span></p>
        </div>
        
        <div class="pdf-footer">
            <p>© 2025 Calculadora de Notas. desenvolvido por Nicolas Mendes, Todos os direitos reservados.</p>
        </div>
        </body>
        </html>
    `;
    
    // Criar um elemento temporário para a conversão
    const tempElement = document.createElement('div');
    tempElement.style.position = 'absolute';
    tempElement.style.left = '-9999px';
    tempElement.style.width = '210mm'; // Largura de uma página A4

    tempElement.innerHTML = content;
    document.body.appendChild(tempElement); // Adicionar ao DOM temporariamente

    // Configurações para html2pdf
    const options = {
        margin: 10,
        filename: `relatorio_notas_${data.subjectText.replace(/\s/g, '_')}_${data.date.replace(/\//g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true // Ajuda a evitar problemas com fontes ou imagens externas
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Gerar e salvar o PDF
    html2pdf().from(tempElement).set(options).save().then(() => {
        document.body.removeChild(tempElement); // Remover o elemento temporário após a geração
        showToast('PDF gerado com sucesso!', 'success', 3000);
    }).catch(error => {
        document.body.removeChild(tempElement);
        console.error('Erro ao gerar PDF:', error);
        showToast('Erro ao gerar PDF. Verifique o console para mais detalhes.', 'error', 5000);
    });
}

// Exportar função para uso global
window.PDFExport = {
    exportToPDF: exportToPDF
};