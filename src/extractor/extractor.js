// Extrai o currículo de uma página de curso da Udemy
// Este script é injetado na página e retorna o conteúdo estruturado

async function extractCurriculumFromPage() {
  // Remove espaços extras e quebras de linha desnecessárias
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();

  // Extrai o TÍTULO do curso
  let courseTitle = "";
  const titleEl = document.querySelector(
    'h1[data-purpose="lead-title"], h1.clp-lead__title'
  );
  if (titleEl) {
    courseTitle = clean(titleEl.innerText || titleEl.textContent);
  }

  // Extrai a DESCRIÇÃO do curso
  let courseDescription = "";
  const descEl = document.querySelector(
    'div[data-purpose="lead-headline"], div.clp-lead__headline'
  );
  if (descEl) {
    courseDescription = clean(descEl.innerText || descEl.textContent);
  }

  // Extrai os AUTORES do curso
  let courseAuthors = "";
  const instructorContainer = document.querySelector(
    'div[data-purpose="instructor-name-top"], div.instructor-links--instructor-links--8GNDS'
  );
  if (instructorContainer) {
    // Pega todos os links de instrutores
    const authorLinks = instructorContainer.querySelectorAll(
      "a.ud-instructor-links span.ud-btn-label"
    );
    const authors = [...authorLinks]
      .map((el) => clean(el.innerText || el.textContent))
      .filter((t) => t.length > 0);
    courseAuthors = authors.join(", ");
  }

  // Localiza o cabeçalho da seção de currículo na página
  const heading = [...document.querySelectorAll("h1,h2,h3,h4")].find((h) =>
    /conte[uú]do do curso|curr[ií]culo|course content/i.test(
      (h.innerText || h.textContent || "").trim()
    )
  );

  // Encontra o container que envolve todo o currículo
  let container = null;
  if (heading)
    container = heading.closest("section,div") || heading.parentElement;

  // Seleciona todos os painéis de accordion que contêm as seções do curso
  const panelSelector = '[class*="accordion-panel-module--panel--"]';
  const panels = container
    ? container.querySelectorAll(panelSelector)
    : document.querySelectorAll(panelSelector);

  // Extrai as estatísticas do curso (duração total, número de seções, etc)
  let statsText = "";
  if (container) {
    const statsEl =
      container.querySelector(
        'div[data-purpose="curriculum-stats"], [class*="curriculum--content-length"], .curriculum--content-length'
      ) ||
      [...container.querySelectorAll(".ud-text-sm, div")].find((el) =>
        /\bseç|duraç/i.test(el.innerText || el.textContent || "")
      );
    if (statsEl) statsText = clean(statsEl.innerText || statsEl.textContent);
  } else {
    const statsElGlobal = document.querySelector(
      'div[data-purpose="curriculum-stats"], [class*="curriculum--content-length"]'
    );
    if (statsElGlobal)
      statsText = clean(statsElGlobal.innerText || statsElGlobal.textContent);
  }

  // Processa cada seção do currículo
  const lines = [];
  let idx = 1;
  panels.forEach((panel) => {
    // Extrai o título da seção
    const titleEl = panel.querySelector(
      'span[class^="ud-accordion-panel-title"], span[class^="section--section-title"]'
    );
    if (!titleEl) return;
    const titleText = clean(titleEl.innerText);

    // Extrai informações adicionais (número de aulas, duração da seção)
    const extras = [
      ...panel.querySelectorAll('span[class^="section--section-content"]'),
    ]
      .map((el) => clean(el.innerText || el.textContent))
      .filter((t) => t.length > 0)
      .join(" • ");

    lines.push(
      extras ? `${idx}) ${titleText} — ${extras}` : `${idx}) ${titleText}`
    );
    idx++;
  });

  // Monta o output final no formato especificado
  let output = "";

  // Adiciona título, descrição e autor
  if (courseTitle) output += `Título: ${courseTitle}\n`;
  if (courseDescription) output += `Descrição: ${courseDescription}\n`;
  if (courseAuthors) output += `Autor: ${courseAuthors}\n`;

  // Adiciona estatísticas se existirem
  if (statsText) output += `Estatísticas: ${statsText}\n`;

  // Adiciona quebra de linha antes das seções
  if (output) output += "\n";

  // Adiciona as seções
  output += lines.join("\n");

  console.log("Currículo extraído:");
  console.log(output);

  return { success: true, content: output };
}

extractCurriculumFromPage();
