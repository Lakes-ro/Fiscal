const $ = (sel) => document.querySelector(sel);

const LS_KEYS = {
  FAVORITOS: "af_favoritos",
  EXCECOES: "af_excecoes",
  APRENDIZADOS: "af_aprendizados"
};

// Funções de Persistência
const loadData = (key) => JSON.parse(localStorage.getItem(key) || "[]");
const saveData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// Motor de Análise
function analisar() {
  const regime = $("#regime").value;
  const codigo = $("#codigo").value;
  const emitente = $("#cidadePrestador").value;
  const tomador = $("#cidadeExecucao").value;
  const servicoTexto = $("#servicoTexto").value.toLowerCase();
  const cessao = $("#cessao").checked;

  if (!regime || !codigo) return alert("Preencha Regime e Código!");

  // Verificação ISS (Art. 3º + Exceções do Usuário)
  const excecoes = loadData(LS_KEYS.EXCECOES);
  const isArt3 = codigo.startsWith("07.02") || 
                  codigo.startsWith("07.05") || 
                  codigo.startsWith("16.01") ||
                  excecoes.some(ex => codigo.startsWith(ex.prefixo));

  // Verificação CPP 20% (MEI)
  const termosCPP = ["pintura", "eletrica", "hidraulica", "alvenaria", "carpintaria", "manutencao", "desentupimento"];
  const temCPP = termosCPP.some(t => servicoTexto.includes(t));

  // 1. RENDER VEREDITO (HEADLINE)
  const box = $("#headline");
  if (regime === "MEI") {
    box.className = `headline ${temCPP ? 'warn' : 'ok'}`;
    box.innerHTML = `
      <div class="big">Emitente MEI · CPP 20% (Tomador): <strong>${temCPP ? "SIM" : "NÃO"}</strong></div>
      <div class="tag">INSS 11%: Isento</div>
      <div class="tag">ISS: ${isArt3 ? "Devido no Tomador" : "Devido no Emitente"}</div>
    `;
  } else {
    box.className = `headline ${cessao ? 'alert' : 'ok'}`;
    box.innerHTML = `
      <div class="big">${regime} · INSS 11% Retido: <strong>${cessao ? "SIM" : "NÃO"}</strong></div>
      <div class="tag">ISS: ${isArt3 ? "Retido no Tomador" : "Devido na Sede"}</div>
    `;
  }

  // 2. DETALHES DOS CARDS
  $("#prevResumo").innerHTML = regime === "MEI" ? "Isento pelo Art. 18-A LC 123" : (cessao ? "Reter 11% sobre a fatura" : "Sem retenção (não há cessão)");
  $("#issResumo").innerHTML = isArt3 ? `Retido em ${tomador}` : `Devido na sede: ${emitente}`;
  $("#fedResumo").innerHTML = (regime === "SIMPLES" || regime === "MEI") ? "Dispensado" : "Verificar 4,65% (PIS/COFINS/CSLL)";

  $("#resultado").classList.remove("hidden");
}

// --- FUNCIONALIDADES DOS BOTÕES ---

// Artigo 3º (Modais e Listagem)
$("#btnExcecoes").onclick = (e) => { e.preventDefault(); renderExList(); $("#dlgExcecoes").showModal(); };
$("#btnAddEx").onclick = () => {
  const p = $("#exPrefixo").value;
  if (!p) return;
  const list = loadData(LS_KEYS.EXCECOES);
  list.push({ prefixo: p, motivo: $("#exMotivo").value });
  saveData(LS_KEYS.EXCECOES, list);
  $("#exPrefixo").value = ""; $("#exMotivo").value = "";
  renderExList();
};
function renderExList() {
  const list = loadData(LS_KEYS.EXCECOES);
  $("#exList").innerHTML = list.map((ex, i) => `<li>${ex.prefixo} - ${ex.motivo} <button onclick="removerEx(${i})">x</button></li>`).join("");
}
window.removerEx = (i) => { const l = loadData(LS_KEYS.EXCECOES); l.splice(i,1); saveData(LS_KEYS.EXCECOES, l); renderExList(); };

// Favoritos
$("#btnFavoritos").onclick = (e) => { e.preventDefault(); $("#favoritosSec").classList.toggle("hidden"); renderFavoritos(); };
$("#btnSalvarCenario").onclick = () => {
  const l = loadData(LS_KEYS.FAVORITOS);
  l.unshift({ regime: $("#regime").value, codigo: $("#codigo").value, emitente: $("#cidadePrestador").value, ts: new Date() });
  saveData(LS_KEYS.FAVORITOS, l);
  alert("Salvo!");
};
function renderFavoritos() {
  const l = loadData(LS_KEYS.FAVORITOS);
  $("#favoritosLista").innerHTML = l.map(f => `<li>${f.regime} (Cod: ${f.codigo}) - ${f.emitente}</li>`).join("") || "Vazio";
}

// Aprendizados (Com espaço para imagem)
$("#btnSalvarAprendizado").onclick = () => {
  const n = loadData(LS_KEYS.APRENDIZADOS);
  n.unshift({ texto: $("#novoAprendizado").value, ts: new Date() });
  saveData(LS_KEYS.APRENDIZADOS, n);
  $("#novoAprendizado").value = "";
  renderAprendizados();
};
function renderAprendizados() {
  const n = loadData(LS_KEYS.APRENDIZADOS);
  $("#listaAprendizados").innerHTML = n.map(item => `
    <article class="card">
      <div style="white-space:pre-wrap">${item.texto}</div>
      <small style="display:block;margin-top:10px;color:var(--muted)">${new Date(item.ts).toLocaleDateString()}</small>
    </article>
  `).join("");
}

// Import/Export
$("#btnExport").onclick = (e) => {
  e.preventDefault();
  const blob = new Blob([JSON.stringify(localStorage)], {type: "application/json"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "backup.json"; a.click();
};
$("#btnImport").onclick = (e) => { e.preventDefault(); $("#fileImport").click(); };
$("#fileImport").onchange = (e) => {
  const reader = new FileReader();
  reader.onload = (ev) => {
    const data = JSON.parse(ev.target.result);
    Object.keys(data).forEach(k => localStorage.setItem(k, data[k]));
    location.reload();
  };
  reader.readAsText(e.target.files[0]);
};

$("#btnFontes").onclick = (e) => { e.preventDefault(); $("#dlgFontes").showModal(); };

document.addEventListener("DOMContentLoaded", () => {
  $("#btnAnalisar").onclick = analisar;
  renderAprendizados();
});