// Extrai o currículo de uma página de curso da Udemy
// Este script é injetado na página e retorna o conteúdo estruturado

async function extractCurriculumFromPage() {
  // Remove espaços extras e quebras de linha desnecessárias
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();

  // Função auxiliar que pausa a execução por um número específico de milissegundos
  // Isso é necessário para dar tempo à Udemy de carregar os painéis adicionais
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // ETAPA 1: Verificar se o botão "mostrar mais" existe e clicar nele se necessário
  // Isso garante que todos os painéis de seção estejam carregados no DOM antes da extração
  const showMoreButton = document.querySelector(
    'button[data-purpose="show-more"], button.curriculum--curriculum-show-more--hf-k5'
  );

  // Verifica se o botão existe E se ele está visível na página (offsetParent !== null)
  // Um elemento com offsetParent null está oculto via CSS display:none ou visibility:hidden
  if (showMoreButton && showMoreButton.offsetParent !== null) {
    // Dispara um clique programático no botão para carregar as seções restantes
    showMoreButton.click();

    // Aguarda 2 segundos para dar tempo à Udemy de processar o clique e renderizar os novos elementos
    // Se sua internet for muito lenta, você pode aumentar para 3000 (3 segundos) ou 4000 (4 segundos)
    await sleep(2000);
  }

  // ETAPA 2: Extrai o TÍTULO do curso
  let courseTitle = "";
  const titleEl = document.querySelector(
    'h1[data-purpose="lead-title"], h1.clp-lead__title'
  );
  if (titleEl) {
    courseTitle = clean(titleEl.innerText || titleEl.textContent);
  }

  // ETAPA 3: Extrai a DESCRIÇÃO do curso
  let courseDescription = "";
  const descEl = document.querySelector(
    'div[data-purpose="lead-headline"], div.clp-lead__headline'
  );
  if (descEl) {
    courseDescription = clean(descEl.innerText || descEl.textContent);
  }

  // ETAPA 4: Extrai os AUTORES do curso
  let courseAuthors = "";
  const instructorContainer = document.querySelector(
    'div[data-purpose="instructor-name-top"], div.instructor-links--instructor-links--8GNDS'
  );
  if (instructorContainer) {
    // Busca todos os links de instrutores e extrai o texto de cada um
    const authorLinks = instructorContainer.querySelectorAll(
      "a.ud-instructor-links span.ud-btn-label"
    );
    const authors = [...authorLinks]
      .map((el) => clean(el.innerText || el.textContent))
      .filter((t) => t.length > 0);
    courseAuthors = authors.join(", ");
  }

  // ETAPA 5: Localiza a seção do currículo usando o atributo data-purpose
  // Este atributo é um marcador semântico oficial da Udemy que não depende de idioma
  const curriculumSection = document.querySelector(
    '[data-purpose="course-curriculum"]'
  );

  if (!curriculumSection) {
    return { success: false, error: "Seção de currículo não encontrada" };
  }

  // ETAPA 6: Extrai as estatísticas do curso (número de seções, aulas e duração total)
  let statsText = "";
  const statsEl = curriculumSection.querySelector(
    '[data-purpose="curriculum-stats"]'
  );
  if (statsEl) {
    statsText = clean(statsEl.innerText || statsEl.textContent);
  }

  // ETAPA 7: Busca todos os painéis de seção APENAS dentro da área do currículo
  // Limitando a busca ao curriculumSection, evitamos pegar elementos de outras partes da página
  const panels = curriculumSection.querySelectorAll(
    '[class*="accordion-panel-module--panel--"]'
  );

  // ETAPA 8: Processa cada seção do currículo com validação rigorosa
  const lines = [];
  let idx = 1;

  panels.forEach((panel) => {
    // Valida que este painel contém realmente uma seção de aula
    // Procura especificamente pelo elemento de título com a classe que a Udemy usa para seções
    const titleEl = panel.querySelector(
      '.section--section-title--svpHP, span[class^="section--section-title"]'
    );

    // Se não encontrou o título esperado, este não é um painel de seção válido
    // Isso filtra elementos extras como links de "Carreiras" que usam a mesma estrutura de accordion
    if (!titleEl) return;

    const titleText = clean(titleEl.innerText || titleEl.textContent);

    // Ignora painéis com título vazio
    if (!titleText) return;

    // Extrai as informações complementares (número de aulas e duração da seção)
    // Usa seletores específicos para garantir que estamos pegando apenas o conteúdo correto
    const contentSpans = panel.querySelectorAll(
      '.section--section-content--2mUJ7, span[data-purpose="section-content"]'
    );
    const extras = [...contentSpans]
      .map((el) => clean(el.innerText || el.textContent))
      .filter((t) => t.length > 0)
      .join(" • ");

    // Adiciona a linha formatada à lista de seções
    lines.push(
      extras ? `${idx}) ${titleText} ${extras}` : `${idx}) ${titleText}`
    );
    idx++;
  });

  // ETAPA 9: Monta o output final no formato especificado
  let output = "";

  // Cada campo termina com duas quebras de linha para criar espaçamento visual
  if (courseTitle) output += `Título: ${courseTitle}\n\n`;
  if (courseDescription) output += `Descrição: ${courseDescription}\n\n`;
  if (courseAuthors) output += `Autor: ${courseAuthors}\n\n`;
  if (statsText) output += `Estatísticas: ${statsText}\n\n`;

  // Adiciona todas as seções numeradas
  output += lines.join("\n");

  return { success: true, content: output };
}

extractCurriculumFromPage();
