// Função para exportar os resultados como PDF
function exportToPDF() {
    // Mostrar notificação de preparação
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
        annualSum: DOM.annualSum.textContent,
        annualStatus: DOM.annualStatus.textContent,
        date: new Date().toLocaleDateString()
    };
    
    // Estilos para o PDF
    const styles = `
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #244a7b;
        }
        .header h1 {
            color: #244a7b;
            margin-bottom: 5px;
        }
        .info-section {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f5f5f5;
            border-radius: 5px;
        }
        .info-item {
            margin-bottom: 8px;
        }
        .info-label {
            font-weight: bold;
            display: inline-block;
            width: 150px;
        }
        .trimester {
            margin-bottom: 25px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .trimester h2 {
            color: #244a7b;
            margin-top: 0;
            padding-bottom: 8px;
            border-bottom: 1px solid #ddd;
        }
        .grades-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 15px;
        }
        .grade-item {
            padding: 8px;
            background-color: #f9f9f9;
            border-radius: 3px;
        }
        .grade-label {
            font-weight: bold;
            display: block;
            font-size: 0.9em;
            color: #666;
        }
        .grade-value {
            font-size: 1.1em;
            color: #333;
        }
        .fixed-grade {
            background-color: #e9ecef;
        }
        .result {
            font-weight: bold;
            font-size: 1.2em;
            padding: 10px;
            background-color: #e9f5ff;
            border-left: 5px solid #244a7b;
            margin-top: 10px;
        }
        .annual-summary {
            margin-top: 30px;
            padding: 20px;
            background-color: #f5f5f5;
            border-radius: 5px;
            text-align: center;
        }
        .annual-sum {
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 10px;
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
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 0.9em;
            color: #666;
            padding-top: 10px;
            border-top: 1px solid #ddd;
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
            <div class="header">
                <h1>Relatório de Notas Escolares</h1>
                <p>Gerado em ${data.date}</p>
            </div>
            
            <div class="info-section">
                <div class="info-item">
                    <span class="info-label">Ano Escolar:</span>
                    <span>${data.yearText || 'Não selecionado'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Matéria:</span>
                    <span>${data.subjectText || 'Não selecionada'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Meta:</span>
                    <span>${data.goalText || 'Não definida'}</span>
                    ${data.goal === 'custom' ? `(${data.customGoal})` : ''}
                </div>
            </div>
    `;

    // Coletar resultados dos trimestres
    TRIMS.forEach((prefix, i) => {
        const trimResult = {
            number: i + 1,
            result: document.getElementById(`${prefix}_result`).textContent,
            grades: {}
        };
        
        // Coletar notas do trimestre
        GRADES.forEach(id => {
            const input = document.getElementById(`${prefix}_${id}`);
            if (input) {
                trimResult.grades[id] = {
                    value: input.value || '-',
                    isFixed: input.classList.contains('is-fixed')
                };
            }
        });
        
        data.trimesterResults.push(trimResult);
    });
    
    // O restante do seu código para gerar o HTML do relatório é mantido
    
    // Adicionar seções de trimestres
    data.trimesterResults.forEach(trim => {
        content += `
            <div class="trimester">
                <h2>Trimestre ${trim.number}</h2>
                <div class="grades-grid">
        `;
        
        // Adicionar notas
        const gradeLabels = {
            at1: "AT1 (Atividade 1)", 
            at2: "AT2 (Atividade 2)", 
            at3: "AT3 (Atividade 3)",
            cr1: `CR${trim.number} (Cidadania)`, 
            av1: "AV1 (Prova 1)", 
            av2: "AV2 (Prova 2)",
            sim: "SIM (Simulado)", 
            bns: "BNS (Bônus)"
        };
        
        Object.entries(trim.grades).forEach(([id, grade]) => {
            // Pular AV2 se não for usada
            if (id === 'av2' && !getSubjectConfig(data.subject, data.year).usesAV2) {
                return;
            }
            
            content += `
                <div class="grade-item ${grade.isFixed ? 'fixed-grade' : ''}">
                    <span class="grade-label">${gradeLabels[id]}</span>
                    <span class="grade-value">${grade.value}${grade.isFixed ? ' (Fixada)' : ''}</span>
                </div>
            `;
        });
        
        content += `
                </div>
                <div class="result">Média Trimestral ${trim.number}: ${trim.result}</div>
            </div>
        `;
    });
    
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
        <div class="annual-summary">
            <div class="annual-sum">Soma das Médias Trimestrais: ${data.annualSum}</div>
            <div class="annual-status ${statusClass}">${data.annualStatus}</div>
        </div>
        
        <div class="footer">
            <p>Calculadora de Notas Escolares - Desenvolvido por Nicolas Mendes</p>
        </div>
        </body>
        </html>
    `;
    
    // Criar um elemento temporário para a conversão
    const tempElement = document.createElement('div');
    tempElement.innerHTML = content;
    document.body.appendChild(tempElement); // Adicionar ao DOM temporariamente

    // Configurações para html2pdf
    const options = {
        margin: 10,
        filename: `relatorio_notas_${data.date.replace(/\//g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Gerar e salvar o PDF
    html2pdf().from(tempElement).set(options).save().then(() => {
        tempElement.remove(); // Remover o elemento temporário após a geração
        showToast('PDF gerado com sucesso!', 'success', 3000);
    }).catch(error => {
        tempElement.remove();
        console.error('Erro ao gerar PDF:', error);
        showToast('Erro ao gerar PDF. Verifique o console para mais detalhes.', 'error', 5000);
    });
}

// Exportar função para uso global
window.PDFExport = {
    exportToPDF: exportToPDF
};