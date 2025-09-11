// pdf_folha_ponto.js

// --- INÍCIO DA SUA FUNÇÃO DE NOTIFICAÇÃO (copiada do spa_router.js) ---
const mostrarNotificacao = (mensagem, tipo = "sucesso") => {
  const container = document.getElementById("notificacao-container");
  if (!container) {
    console.error(
      "O 'notificacao-container' não foi encontrado no HTML desta página."
    );
    alert(mensagem); // Usa alert como alternativa se o container não existir
    return;
  }
  const toast = document.createElement("div");
  // Adicionamos a classe 'erro' se o tipo for 'error'
  toast.className = `toast-notificacao ${tipo === "erro" ? "erro" : "sucesso"}`;
  toast.textContent = mensagem;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);
  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => {
      toast.remove();
    });
  }, 4000);
};
// --- FIM DA FUNÇÃO DE NOTIFICAÇÃO ---

window.electronAPI.on("dados-folha-ponto", (dados) => {
  console.log("DADOS RECEBIDOS NA JANELA DE PREVIEW:", dados);
  if (!dados || !dados.usuario) {
    console.error(
      "Dados inválidos ou usuário ausente nos dados recebidos.",
      dados
    );
    return;
  }
  const { registros, totais, usuario, periodo } = dados;
  document.getElementById("nome-funcionario").textContent = usuario.username;
  const [ano, mes] = periodo.split("-");
  const nomeMes = new Date(ano, mes - 1, 1).toLocaleString("pt-BR", {
    month: "long",
  });
  document.getElementById("periodo-relatorio").textContent = `${
    nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)
  } de ${ano}`;
  document.getElementById("total-trabalhadas").textContent = totais.trabalhadas;
  document.getElementById("saldo-horas").textContent = totais.extras;
  const corpoTabela = document.getElementById("corpo-tabela");
  corpoTabela.innerHTML = "";
  const formatarHora = (dataString) => {
    if (!dataString) return "---";
    return new Date(dataString).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  registros.forEach((reg) => {
    const data = new Date(reg.data).toLocaleDateString("pt-BR", {
      timeZone: "UTC",
    });
    corpoTabela.innerHTML += `
            <tr>
                <td>${data}</td>
                <td>${formatarHora(reg.entrada)}</td>
                <td>${formatarHora(reg.almoco_saida)}</td>
                <td>${formatarHora(reg.almoco_volta)}</td>
                <td>${formatarHora(reg.saida)}</td>
                <td></td>
            </tr>
        `;
  });
});

document
  .getElementById("btn-baixar-pdf")
  .addEventListener("click", async () => {
    const btn = document.getElementById("btn-baixar-pdf");
    btn.textContent = "Salvando...";
    btn.disabled = true;

    try {
      const resultado = await window.electronAPI.invoke(
        "ponto:salvar-preview-como-pdf"
      );
      if (resultado.success) {
        // Usando a notificação!
        mostrarNotificacao("PDF salvo com sucesso!", "sucesso");
      } else if (!resultado.cancelled) {
        // Usando a notificação de erro! (passando o tipo 'erro')
        mostrarNotificacao(`Erro ao salvar PDF: ${resultado.message}`, "erro");
      }
    } catch (error) {
      // Usando a notificação de erro crítico!
      mostrarNotificacao(
        `Erro crítico ao salvar PDF: ${error.message}`,
        "erro"
      );
    } finally {
      btn.textContent = "Baixar PDF";
      btn.disabled = false;
    }
  });
