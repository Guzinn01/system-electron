document
  .getElementById("btnVoltarconfig")
  .addEventListener("click", function (e) {
    e.preventDefault();
    history.back();
  });
document
  .getElementById("btnAbrirDocsApiTecnica")
  .addEventListener("click", () => {
    window.electronAPI.invoke("abrir-janela-docs-api");
  });
