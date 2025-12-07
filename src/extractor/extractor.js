// Extrai o currículo de uma página de curso da Udemy
// Este script é injetado na página e retorna o conteúdo estruturado

async function extractCurriculumFromPage() {
  // Remove espaços extras e quebras de linha desnecessárias
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();

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

  // Monta o output final com estatísticas seguidas das seções
  const output = (statsText ? `${statsText}\n\n` : "") + lines.join("\n");

  console.log("Currículo extraído:");
  console.log(output);

  return { success: true, content: output };
}

extractCurriculumFromPage();
