document.addEventListener("DOMContentLoaded", function () {
  const extractBtn = document.getElementById("extractBtn");
  const copyBtn = document.getElementById("copyBtn");
  const messageDiv = document.getElementById("message");
  const resultContainer = document.getElementById("resultContainer");
  const resultText = document.getElementById("resultText");
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.querySelector(".theme-icon");

  let lastContent = "";

  // Detecta a preferência de tema do sistema operacional
  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  // Carrega o tema salvo pelo usuário ou usa a preferência do sistema
  chrome.storage.local.get(["theme"], function (result) {
    const savedTheme = result.theme;

    if (savedTheme === "dark") {
      applyTheme("dark");
    } else if (savedTheme === "light") {
      applyTheme("light");
    } else {
      // Se não há preferência salva, segue o tema do sistema
      applyTheme(systemPrefersDark ? "dark" : "light");
    }
  });

  // Aplica o tema na interface alterando as classes CSS
  function applyTheme(theme) {
    if (theme === "dark") {
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
      themeIcon.textContent = "☀️";
    } else {
      document.body.classList.add("light-mode");
      document.body.classList.remove("dark-mode");
      themeIcon.textContent = "🌙";
    }
  }

  // Alterna entre os temas e salva a preferência do usuário
  function toggleTheme() {
    const isDark = document.body.classList.contains("dark-mode");
    const newTheme = isDark ? "light" : "dark";

    applyTheme(newTheme);

    // Salva a preferência para que persista entre sessões
    chrome.storage.local.set({ theme: newTheme }, function () {
      console.log("Tema salvo:", newTheme);
    });
  }

  themeToggle.addEventListener("click", toggleTheme);

  // Reage a mudanças na preferência de tema do sistema
  // Só atualiza automaticamente se o usuário não escolheu um tema manualmente
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      chrome.storage.local.get(["theme"], function (result) {
        if (!result.theme) {
          applyTheme(e.matches ? "dark" : "light");
        }
      });
    });

  // Exibe mensagens de feedback para o usuário
  function showMessage(text, type = "info") {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    // Remove mensagens de sucesso automaticamente após 3 segundos
    if (type === "success") {
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 3000);
    }
  }

  // Extrai o currículo da página da Udemy
  extractBtn.addEventListener("click", async function () {
    try {
      extractBtn.disabled = true;
      extractBtn.textContent = "Extraindo...";

      messageDiv.classList.add("hidden");

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // Verifica se está em uma página da Udemy antes de tentar extrair
      if (!tab.url || !tab.url.includes("udemy.com")) {
        showMessage("Abra uma página de curso da Udemy primeiro!", "error");
        extractBtn.disabled = false;
        extractBtn.textContent = "Extrair Currículo";
        return;
      }

      // Injeta o script de extração na página ativa
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["src/extractor/extractor.js"],
      });

      // Processa o resultado da extração
      if (results && results[0] && results[0].result) {
        const result = results[0].result;

        if (result.content) {
          lastContent = result.content;
          resultText.value = result.content;
          resultContainer.classList.remove("hidden");
          showMessage("✅ Currículo extraído com sucesso!", "success");
        } else {
          showMessage("❌ Nenhum conteúdo encontrado", "error");
        }
      } else {
        showMessage("❌ Erro ao extrair o currículo", "error");
      }
    } catch (error) {
      console.error("Erro:", error);
      showMessage(`❌ Erro: ${error.message}`, "error");
    } finally {
      extractBtn.disabled = false;
      extractBtn.textContent = "Extrair Currículo";
    }
  });

  // Copia o conteúdo extraído para a área de transferência
  copyBtn.addEventListener("click", async function () {
    try {
      await navigator.clipboard.writeText(lastContent);
      showMessage("✅ Copiado para a área de transferência!", "success");
    } catch (error) {
      showMessage("❌ Erro ao copiar", "error");
    }
  });
});
