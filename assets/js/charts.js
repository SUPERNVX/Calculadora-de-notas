// Funcionalidade de gráficos para a Calculadora de Notas

// Variáveis para armazenar as instâncias dos gráficos
let trimesterChart = null;
let distributionChart = null;

// Função para inicializar os gráficos
function initCharts() {
    try {
        // Obter o contexto do canvas para o gráfico de trimestres
        const trimCanvas = document.getElementById('trimesterChart');
        if (!trimCanvas) {
            console.error('Trimester chart canvas element not found');
            return;
        }
        const trimCtx = trimCanvas.getContext('2d');
        if (!trimCtx) {
            console.error('Could not get trimester chart canvas context');
            return;
        }
        
        console.log('Initializing trimester chart...');
        
        // Criar o gráfico de trimestres
        trimesterChart = new Chart(trimCtx, {
        type: 'bar',
        data: {
            labels: ['Trimestre 1', 'Trimestre 2', 'Trimestre 3'],
            datasets: [{
                label: 'Média Trimestral',
                data: [0, 0, 0],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    title: {
                        display: true,
                        text: 'Nota'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Trimestre'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Média: ${context.raw.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
        
        console.log('Trimester chart initialized successfully');

        // Configurar o contexto para o gráfico de distribuição
        const distCanvas = document.getElementById('distributionChart');
        if (!distCanvas) {
            // Este não é um erro fatal, a página pode não ter este gráfico
            console.warn('Distribution chart canvas element not found. Skipping initialization.');
            return;
        }
        const distCtx = distCanvas.getContext('2d');
        if (!distCtx) {
            console.error('Could not get distribution chart canvas context');
            return;
        }

        console.log('Initializing distribution chart...');

        // Criar o gráfico de distribuição
        distributionChart = new Chart(distCtx, {
            type: 'doughnut',
            data: {
                labels: ['Reprovado (0-4)', 'Recuperação (4-6)', 'Bom (6-8)', 'Ótimo (8-10)'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(54, 162, 235, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(54, 162, 235, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${value} nota(s) (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        console.log('Distribution chart initialized successfully');

    } catch (error) {
        console.error('Error initializing charts:', error);
    }
}

// Função para atualizar os gráficos com os dados atuais
function updateCharts(trimesterScores, allGrades) {
    try {
        console.log('Updating charts...');

        // Se os gráficos não foram inicializados ou os dados não foram fornecidos, interromper.
        if (!trimesterChart || !trimesterScores || !allGrades) {
            console.warn('UpdateCharts chamado sem dados ou com gráficos não inicializados.');
            return;
        }

        console.log('Updating charts with provided data...');
        console.log('Trimester scores (for charts):', trimesterScores);
        console.log('All individual grades (for charts):', allGrades);
        
        // Atualizar os dados do gráfico de trimestres
        trimesterChart.data.datasets[0].data = trimesterScores;
        
        // Adicionar uma linha de meta se uma meta específica estiver definida
        const goalStrategy = getProjectionStrategy();
        if (goalStrategy.type === 'target') {
            console.log('Adding target line:', goalStrategy.target);
            
            // Remover dataset de meta anterior se existir
            if (trimesterChart.data.datasets.length > 1) {
                trimesterChart.data.datasets.pop();
            }
            
            // Adicionar dataset de meta
            trimesterChart.data.datasets.push({
                label: 'Meta',
                data: [goalStrategy.target, goalStrategy.target, goalStrategy.target],
                type: 'line',
                fill: false,
                borderColor: 'rgba(255, 99, 132, 1)',
                borderDash: [5, 5],
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 0
            });
        } else if (trimesterChart.data.datasets.length > 1) {
            // Remover dataset de meta se não houver meta específica
            trimesterChart.data.datasets.pop();
        }
        
        trimesterChart.update();
        
        // Atualizar o gráfico de distribuição, se ele existir
        if (distributionChart) {
            const distribution = [0, 0, 0, 0]; // [0-4, 4-6, 6-8, 8-10]
            allGrades.forEach(grade => {
                if (grade < 4) distribution[0]++;
                else if (grade < 6) distribution[1]++;
                else if (grade < 8) distribution[2]++;
                else distribution[3]++;
            });

            distributionChart.data.datasets[0].data = distribution;
            distributionChart.update();
        }

        // Chamar a função para atualizar as estatísticas de texto (que está em script.js)
        if (typeof updateStatistics === 'function') {
            updateStatistics(trimesterScores, allGrades);
        } else {
            console.warn('updateStatistics function not found. Statistics summary will not be updated.');
        }

        console.log('Charts updated successfully');
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

// Função para mostrar/esconder a seção de análise
function toggleAnalyticsSection() {
    try {
        console.log('Toggling analytics section...');
        const analyticsSection = document.getElementById('analytics-section');
        const toggleButton = document.getElementById('toggleAnalytics');
        
        if (!analyticsSection) {
            console.error('Analytics section not found');
            return;
        }
        
        if (analyticsSection.style.display === 'none') {
            console.log('Showing analytics section');
            analyticsSection.style.display = 'block';
            analyticsSection.classList.add('show');
            toggleButton.innerHTML = '<i class="fas fa-chart-line"></i> Esconder Análise Gráfica';
            
            // Inicializar os gráficos se for a primeira vez
            if (!trimesterChart) {
                initCharts();
            }

            // Pequeno atraso para garantir que o canvas esteja visível antes de inicializar o gráfico
            setTimeout(() => {
                // Obter os dados atuais do script principal e atualizar os gráficos
                if (typeof window.getChartData === 'function') {
                    const { trimesterScores, allGrades } = window.getChartData();
                    updateCharts(trimesterScores, allGrades);
                } else {
                    console.error('A função getChartData não foi encontrada. O script.js foi carregado corretamente?');
                }
            }, 100);
        } else {
            console.log('Hiding analytics section');
            analyticsSection.classList.remove('show');
            setTimeout(() => {
                analyticsSection.style.display = 'none';
            }, 300);
            toggleButton.innerHTML = '<i class="fas fa-chart-line"></i> Mostrar Análise Gráfica';
        }
    } catch (error) {
        console.error('Error toggling analytics section:', error);
    }
}

// Exportar funções para uso global
window.Charts = {
    init: initCharts,
    update: updateCharts,
    toggle: toggleAnalyticsSection
};