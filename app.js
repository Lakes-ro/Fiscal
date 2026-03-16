// =====================
// Assistente Fiscal (sem banco de dados) — LocalStorage
// =====================

// ====== UTIL ======
const $ = (sel) => document.querySelector(sel);
const normCode = (raw) => {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length < 6) return null;
  return `${digits.slice(0,2)}.${digits.slice(2,4)}.${digits.slice(4,6)}`;
};
const codePrefix = (code) => code ? code.split(".").slice(0,2).join(".") : null;
const pill = (txt, cls) => `<span class="pill ${cls}">${txt}</span>`;
const pillOK = (t) => pill(t, "ok");
const pillWarn = (t) => pill(t, "warn");
const pillAlert = (t) => pill(t, "alert");

const LS_KEYS = {
  FAVORITOS: "af_favoritos",
  AUDIT: "af_audit",
  EXCECOES: "af_excecoes"
};

// ====== EXCEÇÕES (art. 3º LC 116) ======
// Padrão inicial — você pode expandir via modal (salvo no LocalStorage)
const DEFAULT_EXCECOES = [
  { prefixo: "03.05", motivo: "Cessão de andaimes, palcos, coberturas e estruturas temporárias (art. 3º, II)." },
  { prefixo: "07.02", motivo: "Execução de obra/serviços de engenharia (art. 3º, III)." },
  { prefixo: "07.04", motivo: "Demolição (art. 3º, IV)." },
  { prefixo: "07.05", motivo: "Edificações/estradas/portos (art. 3º, V)." },
  { prefixo: "07.09", motivo: "Coleta/tratamento/destinação de resíduos (art. 3º, VI)." }
];

// MEI – serviços que geram CPP 20% (sem 11%)
const MEI_CPP_SERVICOS = [
  "hidraulica","hidráulica","eletricidade","pintura",
  "alvenaria","carpintaria","manutencao","manutenção",
  "reparo de veiculos","reparo de veículos","manutencao de veiculos","manutenção de veículos"
];

// ====== STORAGE HELPERS ======
function loadExcecoes(){
  const raw = localStorage.getItem(LS_KEYS.EXCECOES);
  if (!raw) return [...DEFAULT_EXCECOES];
  try { const arr = JSON.parse(raw); if(Array.isArray(arr)) return arr; } catch {}
  return [...DEFAULT_EXCECOES];
}
function saveExcecoes(arr){ localStorage.setItem(LS_KEYS.EXCECOES, JSON.stringify(arr||[])); }

function loadFavoritos(){
  try { return JSON.parse(localStorage.getItem(LS_KEYS.FAVORITOS)||"[]"); } catch { return []; }
}
function saveFavoritos(list){ localStorage.setItem(LS_KEYS.FAVORITOS, JSON.stringify(list||[])); }
function addFavorito(item){ const list = loadFavoritos(); list.unshift(item); saveFavoritos(list); }

function addAudit(entry){
  const list = (()=>{ try { return JSON.parse(localStorage.getItem(LS_KEYS.AUDIT)||"[]"); } catch { return []; } })();
  list.unshift(entry);
  localStorage.setItem(LS_KEYS.AUDIT, JSON.stringify(list));
}

// ====== MOTOR DE REGRAS ======
function analisar(){
  const regime = $("#regime").value;
  const codigo = normCode($("#codigo").value);
  const cidadePrestador = $("#cidadePrestador").value.trim();
  const cidadeExecucao = $("#cidadeExecucao").value.trim();
  const cessao = $("#cessao").checked;

  if (!regime || !codigo) {
    alert("Selecione o regime e informe o código LC 116 (##.##.##).");
    return;
  }

  const excecoes = loadExcecoes();
  const prefixo = codePrefix(codigo);
  const excecao = excecoes.find(e => prefixo && (e.prefixo === prefixo || codigo.startsWith(e.prefixo)));
  const issLocalTomador = Boolean(excecao);

  // ----- Previdenciário -----
  const prev = { pills: [], lines: [] };
  if (regime === "MEI") {
    prev.pills.push(pillOK("Sem retenção de 11% (MEI)"));
    prev.pills.push(pillWarn("CPP 20% pelo tomador (6 serviços clássicos do MEI)"));
    prev.lines.push("MEI não sofre 11% na NF. Para hidráulica, eletricidade, pintura, alvenaria, carpintaria e manutenção/reparo de veículos, a CPP de 20% é do tomador (sem desconto do MEI). Base: entendimento administrativo (Cosit 108/2016) e LC 147/2014; regras previdenciárias consolidadas na IN RFB 2.110/2022.");
  } else {
    if (cessao) {
      prev.pills.push(pillAlert("Retenção de 11% (cessão/empreitada)"));
      prev.lines.push("Com cessão/empreitada, reter 11% sobre a NF do prestador (IN RFB 2.110/2022; art. 31 da Lei 8.212/1991).");
    } else {
      prev.pills.push(pillOK("Sem retenção de 11% (sem cessão/empreitada)"));
      prev.lines.push("Sem cessão/empreitada, em regra não há retenção de 11%.");
    }
  }

  // ----- Federais -----
  const fed = { pills: [], lines: [] };
  if (regime === "MEI" || regime === "SIMPLES") {
    fed.pills.push(pillOK("Sem IRRF (prestador Simples)"));
    fed.pills.push(pillOK("Sem PIS/COFINS/CSLL (4,65%)"));
    fed.lines.push("Dispensa para prestador optante pelo Simples (IN RFB 765/2007 — IRRF; IN SRF 459/2004 — PIS/COFINS/CSLL). Para entes públicos federais, exigir a declaração de dispensa (IN RFB 1.234/2012).");
  } else {
    fed.pills.push(pillWarn("Verificar IRRF (1,5% serviços profissionais)"));
    fed.pills.push(pillWarn("Verificar PIS/COFINS/CSLL (4,65%) — Lei 10.833/2003"));
    fed.lines.push("Para Lucro Presumido/Real, avalie as naturezas sujeitas a IRRF e CSRF conforme contratos/notas.");
  }

  // ----- ISS -----
  const iss = { pills: [], lines: [] };
  if (issLocalTomador) {
    iss.pills.push(pillWarn("ISS devido no local do tomador/execução"));
    iss.lines.push(`Exceção do art. 3º da LC 116/2003 identificada pelo prefixo ${excecao.prefixo}. ${excecao.motivo || ""}`);
    iss.lines.push("Se a lei municipal assim dispuser, o tomador deve reter o ISS (substituição tributária).");
  } else {
    iss.pills.push(pillOK("ISS devido no município do prestador"));
    iss.lines.push("Regra geral (art. 3º, caput, LC 116/2003).");
  }

  // ----- Observações -----
  const obs = [];
  if (regime === "MEI") {
    obs.push("MEI — NFS-e Nacional quando devido; ISS do MEI vai no DAS (valor fixo mensal).");
  }
  obs.push("Valide contrato/escopo, habitualidade/supervisão e se há cessão/empreitada.");
  obs.push("Para ISS retido, a base e a alíquota são municipais; confira o cadastro do prestador no município competente.");
  obs.push("Guarde a declaração de dispensa de retenções federais quando o prestador for Simples (especialmente com entes públicos).");

  // Render
  $("#prevResumo").innerHTML = prev.pills.join("");
  $("#prevDetalhes").innerHTML = prev.lines.map(li => `<li>${li}</li>`).join("");

  $("#fedResumo").innerHTML = fed.pills.join("");
  $("#fedDetalhes").innerHTML = fed.lines.map(li => `<li>${li}</li>`).join("");

  $("#issResumo").innerHTML = iss.pills.join("");
  $("#issDetalhes").innerHTML = iss.lines.map(li => `<li>${li}</li>`).join("");

  $("#obsLista").innerHTML = obs.map(li => `<li>• ${li}</li>`).join("");

  $("#resultado").classList.remove("hidden");
  $("#btnSalvar").disabled = false;
  $("#btnCopiar").disabled = false;

  // Auditoria
  addAudit({
    ts: new Date().toISOString(), regime, codigo,
    cidade_prestador: cidadePrestador, cidade_execucao: cidadeExecucao,
    cessao, iss_local_tomador: issLocalTomador
  });

  return { regime, codigo, cidadePrestador, cidadeExecucao, cessao };
}

// ====== UI EVENTOS ======
window.addEventListener("DOMContentLoaded", () => {
  // Analisar
  $("#btnAnalisar").addEventListener("click", () => analisar());

  // Copiar parecer
  $("#btnCopiar").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText($("#resultado").innerText);
      alert("Parecer copiado!");
    } catch { alert("Não foi possível copiar."); }
  });

  // Salvar cenário
  $("#btnSalvar").addEventListener("click", () => {
    const reg = $("#regime").value;
    const cod = normCode($("#codigo").value);
    if (!reg || !cod) { alert("Informe regime e código."); return; }
    const nota = prompt("Observação interna (opcional):", "") || "";
    const item = {
      ts: new Date().toISOString(),
      regime: reg, codigo: cod,
      cidade_prestador: $("#cidadePrestador").value.trim(),
      cidade_execucao: $("#cidadeExecucao").value.trim(),
      cessao: $("#cessao").checked,
      nota: nota.slice(0,500)
    };
    addFavorito(item);
    alert("Cenário salvo em Favoritos!");
  });

  // Favoritos
  $("#btnFavoritos").addEventListener("click", (e) => {
    e.preventDefault();
    renderFavoritos();
    $("#favoritosSec").classList.remove("hidden");
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  });

  $("#btnLimparFavoritos").addEventListener("click", () => {
    if (confirm("Apagar todos os Favoritos?")) {
      saveFavoritos([]); renderFavoritos();
    }
  });

  // Base legal modal
  const dlgFontes = $("#dlgFontes");
  $("#btnFontes").addEventListener("click", (e)=>{ e.preventDefault(); dlgFontes.showModal(); });
  $("#dlgClose").addEventListener("click", ()=> dlgFontes.close());

  // Exceções modal
  const dlgEx = $("#dlgExcecoes");
  $("#btnExcecoes").addEventListener("click", ()=> { renderExList(); dlgEx.showModal(); });
  $("#btnFecharEx").addEventListener("click", ()=> dlgEx.close());
  $("#btnAddEx").addEventListener("click", ()=>{
    const p = $("#exPrefixo").value.trim();
    const m = $("#exMotivo").value.trim();
    if (!/^\d{2}(\.\d{2}){1,2}$/.test(p)) { alert("Use prefixo no formato ##.## ou ##.##.##"); return; }
    const list = loadExcecoes();
    if (list.find(x => x.prefixo === p)) { alert("Já existe esse prefixo."); return; }
    list.push({ prefixo:p, motivo: m });
    saveExcecoes(list);
    $("#exPrefixo").value = ""; $("#exMotivo").value = "";
    renderExList();
  });
  $("#btnResetEx").addEventListener("click", ()=>{
    if (confirm("Restaurar exceções padrão?")) { saveExcecoes(DEFAULT_EXCECOES); renderExList(); }
  });

  // Export/Import
  $("#btnExport").addEventListener("click", () => {
    const payload = {
      excecoes: loadExcecoes(),
      favoritos: loadFavoritos(),
      audit: (()=>{ try { return JSON.parse(localStorage.getItem(LS_KEYS.AUDIT)||"[]"); } catch { return []; } })()
    };
    const blob = new Blob([JSON.stringify(payload,null,2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `assistente-fiscal-export-${new Date().toISOString().slice(0,19)}.json`;
    a.click(); URL.revokeObjectURL(url);
  });

  const fileInput = $("#fileImport");
  $("#btnImport").addEventListener("click", ()=> fileInput.click());
  fileInput.addEventListener("change", async (e)=>{
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (Array.isArray(json.excecoes)) saveExcecoes(json.excecoes);
      if (Array.isArray(json.favoritos)) saveFavoritos(json.favoritos);
      if (Array.isArray(json.audit)) localStorage.setItem(LS_KEYS.AUDIT, JSON.stringify(json.audit));
      alert("Importação concluída!");
      renderExList(); renderFavoritos();
    } catch (err) {
      alert("Falha ao importar: " + err.message);
    } finally { e.target.value = ""; }
  });
});

// ====== RENDER LISTAS ======
function renderFavoritos(){
  const ul = $("#favoritosLista");
  const list = loadFavoritos();
  if (!list.length) { ul.innerHTML = `<li class="mini">Sem favoritos.</li>`; return; }
  ul.innerHTML = list.map(it => `
    <li>
      <strong>${it.regime}</strong> — código <code>${it.codigo}</code>${it.cessao?" • cessão/empreitada":""}
      <div class="mini">${it.cidade_prestador || "prestador?"} → ${it.cidade_execucao || "execução?"} • ${new Date(it.ts).toLocaleString()}</div>
      ${it.nota?`<div class="mini">Obs.: ${it.nota}</div>`:""}
    </li>
  `).join("");
}

function renderExList(){
  const ul = $("#exList");
  const list = loadExcecoes();
  if (!list.length) { ul.innerHTML = `<li class="mini">Sem exceções.</li>`; return; }
  ul.innerHTML = list.map((x,i)=> `
    <li>
      <code>${x.prefixo}</code> — ${x.motivo || "—"}
      <button class="btn" style="margin-left:8px" onclick="delEx(${i})">Remover</button>
    </li>
  `).join("");
}
window.delEx = function(i){
  const list = loadExcecoes();
  list.splice(i,1); saveExcecoes(list); renderExList();
};