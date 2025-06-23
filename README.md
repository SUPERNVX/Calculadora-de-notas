# Calculadora de Notas Escolares Avançada

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

Uma aplicação web completa e intuitiva para ajudar estudantes a calcular, projetar e analisar suas notas escolares. Planeje seu sucesso acadêmico com precisão, compartilhe seus resultados e exporte relatórios detalhados.

---

## ✨ Funcionalidades Principais

A calculadora foi desenvolvida com um conjunto robusto de funcionalidades para atender a todas as necessidades de um estudante moderno:

- **Cálculo de Média Ponderada:** Calcula a média trimestral com base nos pesos específicos de cada atividade (ATs, AVs, Simulado, Cidadania).
- **Projeção de Notas:** Calcule automaticamente a nota necessária nos campos em branco para atingir uma meta específica, seja ela passar de ano ou uma média personalizada.
- **Fixação de Notas:** "Trave" notas já definidas para que elas não sejam alteradas durante os cálculos de projeção.
- **Análise Gráfica de Desempenho:**
  - **Guia Interativo "Como Usar":** Uma seção na própria aplicação que se expande para explicar o passo a passo de como utilizar todas as funcionalidades.
  - **Gráfico de Barras:** Visualize seu desempenho ao longo dos trimestres.
  - **Gráfico de Rosca:** Entenda a distribuição das suas notas em diferentes faixas (Reprovado, Recuperação, Bom, Ótimo).
- **Resumo Estatístico:** Obtenha insights rápidos com a média geral de todas as notas, a nota mais alta, a mais baixa e a tendência de desempenho.
- **Exportação para PDF:** Gere um relatório profissional e limpo com todas as suas notas, médias e status final, pronto para ser salvo ou compartilhado.
- **Compartilhamento Fácil:**
  - **Link Compartilhável:** Gere um link único que contém todos os seus dados para compartilhar com colegas ou professores.
  - **QR Code:** Gere um QR Code para compartilhamento rápido em dispositivos móveis.
- **Persistência de Dados:** Suas notas são salvas automaticamente no navegador. Feche a aba e volte depois, seus dados estarão lá.
- **Importar e Exportar Dados:** Salve o estado completo da sua calculadora em um arquivo JSON e importe-o mais tarde ou em outro dispositivo.
- **Sistema de Temas Avançado:** Escolha entre múltiplos temas, cada um com modo claro e escuro, para personalizar completamente sua experiência. Inclui:
  - **Padrão:** Um tema limpo e funcional com modos claro e escuro.
  - **Moderno:** Um visual elegante com fundo de partículas animado e efeitos de *glassmorphism*.
  - **Retrowave:** Uma imersão cyberpunk com cores neon, grids animados e efeitos de brilho.
  - **Soft UI:** Um visual tátil e minimalista com elementos que parecem emergir da interface (Neumorfismo).
  - **Vaporwave:** Um visual nostálgico com paleta pastel, gradientes suaves e efeitos etéreos.
- **Design Responsivo:** Totalmente funcional em desktops, tablets e smartphones.

---

## 🚀 Tecnologias Utilizadas

Este projeto foi construído utilizando tecnologias web modernas e bibliotecas de código aberto:

- **HTML5:** Para a estrutura semântica do conteúdo.
- **CSS3:** Para estilização avançada, utilizando variáveis CSS para temas e um design totalmente responsivo.
- **JavaScript (ES6+):** Para toda a lógica de cálculo, manipulação do DOM e interatividade.
- **Chart.js:** Para a criação dos gráficos de análise de desempenho.
- **html2pdf.js:** Para a funcionalidade de exportação de relatórios em formato PDF.
- **QRCode.js:** Para a geração dinâmica de QR Codes para compartilhamento.
- **tsParticles:** Para a criação de fundos animados com partículas no tema "Moderno".

---

## 📖 Como Usar

1.  **Selecione o Ano e a Matéria:** Comece escolhendo seu ano escolar e a matéria para a qual deseja calcular as notas. A interface se adaptará automaticamente às regras de cálculo da matéria selecionada.
2.  **Personalize o Visual (Opcional):** Clique no ícone de paleta de cores no canto superior esquerdo para escolher entre os temas disponíveis.
3.  **Insira suas Notas:** Preencha os campos com as notas que você já possui.
4.  **Defina sua Meta:** Use o seletor de metas para definir o que você deseja alcançar. Pode ser a média mínima para passar de ano ou uma meta personalizada.
5.  **Calcule e Projete:** Clique no botão **"Calcular / Projetar Notas"**. O sistema calculará as médias dos trimestres preenchidos e preencherá os campos vazios com a nota necessária para atingir sua meta.
6.  **Analise e Compartilhe:**
    - Clique em **"Mostrar Análise Gráfica"** para ver os gráficos de desempenho.
    - Use as opções na seção **"Compartilhar Resultados"** para gerar um link ou exportar um PDF.

---

## 📂 Estrutura do Projeto

O código-fonte foi reestruturado para uma organização clara e escalável, separando os arquivos por função:

```
├── index.html                # Estrutura principal da aplicação
├── style.css                 # Folha de estilos principal (inclui temas e responsividade)
├── toast.css                 # Estilos para as notificações (toasts)
├── script.js                 # Lógica central, cálculos, manipulação de eventos e estado
├── charts.js                 # Configuração e atualização dos gráficos (Chart.js)
├── pdf-export.js             # Lógica para gerar o relatório em PDF (html2pdf.js)
├── sharing.js                # Lógica para gerar links compartilháveis e QR Codes
└── README.md                 # Esta documentação
```

---

## ✍️ Autor

**Nicolas Mendes**

- [GitHub](https://github.com/SUPERNVX)
---

## 📄 Licença

Este projeto é de código aberto. Sinta-se à vontade para usar, modificar e distribuir conforme necessário, desde que dê os créditos necessários.

---