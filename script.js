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


// ====== NOVA GESTÃO DE FAVORITOS ======
$("#btnFavoritos").onclick = (e) => { e.preventDefault(); $("#favoritosSec").classList.toggle("hidden"); renderFavoritos(); };
$("#btnSalvarCenario").onclick = () => {
  const l = loadData(LS_KEYS.FAVORITOS);
  l.unshift({ regime: $("#regime").value, codigo: $("#codigo").value, emitente: $("#cidadePrestador").value, obs: "", ts: new Date() });
  saveData(LS_KEYS.FAVORITOS, l);
  alert("Cenário Salvo!");
  renderFavoritos();
};

function renderFavoritos() {
  const l = loadData(LS_KEYS.FAVORITOS);
  $("#favoritosLista").innerHTML = l.map((f, i) => `
    <li style="background: var(--panel); padding: 12px; margin-bottom: 10px; border-radius: 8px; border: 1px solid var(--border); list-style: none;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <strong>${f.regime} (Cód: ${f.codigo})</strong>
        <small style="color: var(--muted)">${new Date(f.ts).toLocaleDateString()}</small>
      </div>
      <div style="font-size: 0.9em; color: var(--text);">Emitente: ${f.emitente || "Não informado"}</div>
      ${f.obs ? `<div style="font-size: 0.85em; color: var(--primary); margin-top: 5px; padding-left: 8px; border-left: 2px solid var(--primary);">Obs: ${f.obs}</div>` : ""}
      
      <div style="margin-top: 10px; display: flex; gap: 8px;">
        <button class="btn" style="padding: 4px 8px; font-size: 0.8em;" onclick="carregarFav(${i})">🔄 Carregar</button>
        <button class="btn" style="padding: 4px 8px; font-size: 0.8em;" onclick="editarFav(${i})">✏️ Anotar</button>
        <button class="btn" style="padding: 4px 8px; font-size: 0.8em; background: #501010; border-color: #801515;" onclick="removerFav(${i})">❌</button>
      </div>
    </li>
  `).join("") || "<li style='list-style: none;'>Nenhum favorito salvo.</li>";
}

window.editarFav = (i) => {
  const l = loadData(LS_KEYS.FAVORITOS);
  const novaObs = prompt("Adicione ou edite uma observação para esta nota:", l[i].obs || "");
  if (novaObs !== null) {
    l[i].obs = novaObs;
    saveData(LS_KEYS.FAVORITOS, l);
    renderFavoritos();
  }
};

window.removerFav = (i) => {
  if (confirm("Deseja realmente excluir este favorito?")) {
    const l = loadData(LS_KEYS.FAVORITOS);
    l.splice(i, 1);
    saveData(LS_KEYS.FAVORITOS, l);
    renderFavoritos();
  }
};

window.carregarFav = (i) => {
  const f = loadData(LS_KEYS.FAVORITOS)[i];
  $("#regime").value = f.regime || "";
  $("#codigo").value = f.codigo || "";
  $("#cidadePrestador").value = f.emitente || "";
  alert("Dados carregados! Adicione o restante das informações (Tomador, Descrição) e clique em Analisar.");
  window.scrollTo({ top: 0, behavior: 'smooth' });
};


// ====== NOVA GESTÃO DE APRENDIZADOS (ANOTAÇÕES) ======
$("#btnSalvarAprendizado").onclick = () => {
  const texto = $("#novoAprendizado").value.trim();
  if (!texto) return alert("Digite algo antes de salvar.");
  const n = loadData(LS_KEYS.APRENDIZADOS);
  n.unshift({ texto: texto, ts: new Date() });
  saveData(LS_KEYS.APRENDIZADOS, n);
  $("#novoAprendizado").value = "";
  renderAprendizados();
};

function renderAprendizados() {
  const n = loadData(LS_KEYS.APRENDIZADOS);
  $("#listaAprendizados").innerHTML = n.map((item, i) => `
    <article class="card">
      <div style="white-space:pre-wrap; margin-bottom: 15px;">${item.texto}</div>
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 10px;">
        <small style="color:var(--muted)">${new Date(item.ts).toLocaleDateString()}</small>
        <div style="display: flex; gap: 5px;">
          <button class="btn" style="padding: 4px 8px; font-size: 0.8em;" onclick="editarNota(${i})">✏️</button>
          <button class="btn" style="padding: 4px 8px; font-size: 0.8em; background: #501010; border-color: #801515;" onclick="removerNota(${i})">❌</button>
        </div>
      </div>
    </article>
  `).join("");
}

window.editarNota = (i) => {
  const n = loadData(LS_KEYS.APRENDIZADOS);
  const novoTexto = prompt("Edite sua anotação:", n[i].texto);
  if (novoTexto !== null && novoTexto.trim() !== "") {
    n[i].texto = novoTexto;
    saveData(LS_KEYS.APRENDIZADOS, n);
    renderAprendizados();
  }
};

window.removerNota = (i) => {
  if (confirm("Excluir esta anotação permanentemente?")) {
    const n = loadData(LS_KEYS.APRENDIZADOS);
    n.splice(i, 1);
    saveData(LS_KEYS.APRENDIZADOS, n);
    renderAprendizados();
  }
};


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

// Iniciar Tela
document.addEventListener("DOMContentLoaded", () => {
  $("#btnAnalisar").onclick = analisar;
  renderAprendizados();
  renderFavoritos();
});
