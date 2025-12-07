console.log("Background service worker iniciado");

// Verifica se uma URL pode ter seu ícone modificado
// O navegador não permite modificar ícones em páginas internas por segurança
function isValidUrlForIcon(url) {
  if (!url) return false;

  const invalidPrefixes = [
    "chrome://",
    "chrome-extension://",
    "brave://",
    "edge://",
    "about:",
    "view-source:",
    "data:",
    "file://",
  ];

  return !invalidPrefixes.some((prefix) => url.startsWith(prefix));
}

// Define o ícone da extensão baseado na URL da aba
// Ícone colorido quando está na Udemy, grayscale quando não está
function updateIcon(tabId, url) {
  if (!isValidUrlForIcon(url)) {
    console.log(`Tab ${tabId} ignorada (URL interna do navegador): ${url}`);
    return;
  }

  const isUdemy = url && url.includes("udemy.com");

  console.log(
    `Atualizando ícone para tab ${tabId}: ${
      isUdemy ? "COLORIDO" : "GRAYSCALE"
    } - URL: ${url}`
  );

  if (isUdemy) {
    // Define ícones coloridos quando está em uma página da Udemy
    chrome.action.setIcon(
      {
        tabId: tabId,
        path: {
          16: "/assets/icons/icon16.png",
          32: "/assets/icons/icon32.png",
          48: "/assets/icons/icon48.png",
          128: "/assets/icons/icon128.png",
        },
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Erro ao definir ícone colorido:",
            chrome.runtime.lastError.message
          );
        } else {
          console.log("Ícone colorido definido");
        }
      }
    );

    chrome.action.setTitle({
      tabId: tabId,
      title: "Extrator de Currículo Udemy",
    });
  } else {
    // Define ícones grayscale quando não está na Udemy
    chrome.action.setIcon(
      {
        tabId: tabId,
        path: {
          16: "/assets/icons/icon16-grayscale.png",
          32: "/assets/icons/icon32-grayscale.png",
          48: "/assets/icons/icon48-grayscale.png",
          128: "/assets/icons/icon128-grayscale.png",
        },
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Erro ao definir ícone grayscale:",
            chrome.runtime.lastError.message
          );
        } else {
          console.log("Ícone grayscale definido");
        }
      }
    );

    chrome.action.setTitle({
      tabId: tabId,
      title: "Extrator de Currículo Udemy (apenas em udemy.com)",
    });
  }
}

// Monitora mudanças em abas (navegação, carregamento)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Atualiza o ícone quando a URL muda ou quando a página termina de carregar
  if (changeInfo.url || changeInfo.status === "complete") {
    updateIcon(tabId, tab.url);
  }
});

// Monitora quando o usuário troca de aba
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    updateIcon(activeInfo.tabId, tab.url);
  } catch (error) {
    console.error("Erro ao obter informações da tab:", error.message);
  }
});

// Executa quando a extensão é instalada ou atualizada
chrome.runtime.onInstalled.addListener(async () => {
  console.log("Extensão instalada/atualizada");
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab) {
      console.log(`Tab ativa inicial: ${tab.url}`);
      updateIcon(tab.id, tab.url);
    }
  } catch (error) {
    console.error("Erro ao obter tab inicial:", error.message);
  }
});

// Executa quando o navegador inicia
chrome.runtime.onStartup.addListener(async () => {
  console.log("Navegador iniciado");
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab) {
      updateIcon(tab.id, tab.url);
    }
  } catch (error) {
    console.error("Erro no startup:", error.message);
  }
});

// Monitora quando o usuário volta para o navegador
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  // WINDOW_ID_NONE significa que nenhuma janela do Chrome está em foco
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        windowId: windowId,
      });
      if (tab) {
        updateIcon(tab.id, tab.url);
      }
    } catch (error) {
      console.error("Erro ao processar mudança de foco:", error.message);
    }
  }
});
