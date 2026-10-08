// ==UserScript==
// @name         X — micro
// @namespace    https://denizault.local/x-micro
// @version      1.1.0
// @description  Zone de dictée fr-FR, puis injection dans le compose X. Un seul micro : Écoute.
// @author       Grok (xAI)
// @match        https://x.com/*
// @match        https://twitter.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==
// Signé Grok (xAI) — octobre 2026 — pour Stéphane Denizault.

(function () {
  "use strict";

  const LAUNCH_ID = "xd-micro-launch";
  const PANEL_ID = "xd-micro-panel";
  let rec = null;

  function composer() {
    const all = Array.from(document.querySelectorAll('[data-testid="tweetTextarea_0"]'));
    for (let i = all.length - 1; i >= 0; i--) {
      const el = all[i];
      if (el.getClientRects().length) return el;
    }
    return all[0] || null;
  }

  function setText(el, text) {
    el.focus();
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    sel.removeAllRanges();
    sel.addRange(range);
    if (document.execCommand("insertText", false, text)) return true;
    el.dispatchEvent(new InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      inputType: "insertText",
      data: text,
    }));
    return true;
  }

  function stopRec() {
    if (!rec) return;
    const r = rec;
    rec = null;
    r.onend = null;
    r.onerror = null;
    r.onresult = null;
    try { r.stop(); } catch (e) {}
  }

  function listenInto(area, status, micBtn) {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      status.textContent = "Pas de dictée dans ce navigateur. Chrome ou Brave, réglage reconnaissance vocale activé.";
      micBtn.textContent = "Écoute";
      return;
    }
    if (rec) {
      stopRec();
      micBtn.textContent = "Écoute";
      status.textContent = "Stop. Corrige la zone, puis Injecter.";
      return;
    }
    const r = new Ctor();
    rec = r;
    r.lang = "fr-FR";
    r.interimResults = true;
    r.continuous = true;
    let finals = area.value.trim();
    if (finals) finals += " ";
    micBtn.textContent = "Stop";
    status.textContent = "Écoute… parle.";
    r.onresult = (ev) => {
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const chunk = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) finals += chunk + " ";
        else interim += chunk;
      }
      area.value = (finals + interim).replace(/[ \t]{2,}/g, " ").trim();
    };
    r.onerror = (ev) => {
      const code = (ev && ev.error) || "erreur";
      if (code === "not-allowed" || code === "service-not-allowed") {
        status.textContent = "Micro refusé. Cadenas à gauche de l’adresse x.com → Micro → Autoriser. Brave : brave://settings/search, reconnaissance vocale Google activée.";
      } else if (code === "network") {
        status.textContent = "Brave bloque souvent la dictée. brave://settings/search → autoriser la reconnaissance vocale.";
      } else if (code === "no-speech") {
        status.textContent = "Rien entendu. Reclique Écoute.";
      } else if (code !== "aborted") {
        status.textContent = "Micro : " + code;
      }
      rec = null;
      micBtn.textContent = "Écoute";
    };
    r.onend = () => {
      if (rec === r) rec = null;
      if (micBtn.isConnected && micBtn.textContent === "Stop") micBtn.textContent = "Écoute";
    };
    try {
      r.start();
    } catch (e) {
      rec = null;
      micBtn.textContent = "Écoute";
      status.textContent = "Démarrage impossible. Reclique Écoute.";
    }
  }

  function openPanel() {
    stopRec();
    const old = document.getElementById(PANEL_ID);
    if (old) old.remove();
    const box = document.createElement("div");
    box.id = PANEL_ID;
    box.style.cssText = [
      "position:fixed",
      "right:16px",
      "bottom:52px",
      "z-index:2147483647",
      "width:min(380px,calc(100vw - 32px))",
      "background:#000",
      "color:#e7e9ea",
      "border:1px solid #2f3336",
      "border-radius:12px",
      "padding:10px",
      "font:13px/1.35 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",
      "box-shadow:0 8px 28px rgba(0,0,0,.5)",
    ].join(";");
    box.innerHTML = [
      '<div style="font-weight:700;margin-bottom:6px">Dictée</div>',
      '<textarea id="xd-micro-text" placeholder="Parle, le texte arrive ici." style="width:100%;box-sizing:border-box;min-height:84px;background:#16181c;color:#e7e9ea;border:1px solid #2f3336;border-radius:8px;padding:6px;resize:vertical"></textarea>',
      '<div style="display:flex;gap:6px;margin-top:6px;align-items:center">',
      '<button id="xd-micro-listen" type="button" style="background:#f4212e;color:#fff;border:0;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;cursor:pointer">Écoute</button>',
      '<button id="xd-micro-copy" type="button" style="background:#eff3f4;color:#0f1419;border:0;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;cursor:pointer">Copier</button>',
      '<button id="xd-micro-inject" type="button" style="background:#1d9bf0;color:#fff;border:0;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;cursor:pointer">Injecter</button>',
      '<button id="xd-micro-close" type="button" style="margin-left:auto;background:transparent;color:#71767b;border:0;cursor:pointer;font-size:12px">Fermer</button>',
      "</div>",
      '<div id="xd-micro-status" style="margin-top:4px;color:#71767b;font-size:11px">Clique Écoute, parle, puis Injecter.</div>',
    ].join("");
    document.body.appendChild(box);
    const area = box.querySelector("#xd-micro-text");
    const status = box.querySelector("#xd-micro-status");
    const micBtn = box.querySelector("#xd-micro-listen");
    const stop = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
    };
    micBtn.addEventListener("click", (ev) => {
      stop(ev);
      listenInto(area, status, micBtn);
    });
    box.querySelector("#xd-micro-copy").addEventListener("click", async (ev) => {
      stop(ev);
      try {
        await navigator.clipboard.writeText(area.value);
        status.textContent = "Copié.";
      } catch (e) {
        area.focus();
        area.select();
        status.textContent = "Sélectionné. Ctrl+C.";
      }
    });
    box.querySelector("#xd-micro-inject").addEventListener("click", (ev) => {
      stop(ev);
      const text = area.value.trim();
      const el = composer();
      if (!text) {
        status.textContent = "Zone vide.";
        return;
      }
      if (!el) {
        status.textContent = "Ouvre une réponse X d’abord.";
        return;
      }
      setText(el, text);
      status.textContent = "Injecté.";
    });
    box.querySelector("#xd-micro-close").addEventListener("click", (ev) => {
      stop(ev);
      stopRec();
      box.remove();
    });
  }

  function mount() {
    if (document.getElementById(LAUNCH_ID)) return;
    const b = document.createElement("button");
    b.id = LAUNCH_ID;
    b.type = "button";
    b.textContent = "Dictée";
    b.title = "Ouvrir la zone de dictée";
    b.style.cssText = [
      "position:fixed",
      "right:16px",
      "bottom:16px",
      "z-index:2147483646",
      "background:#000",
      "color:#1d9bf0",
      "border:1px solid #1d9bf0",
      "border-radius:999px",
      "padding:4px 10px",
      "height:28px",
      "font:12px/18px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",
      "font-weight:700",
      "cursor:pointer",
    ].join(";");
    b.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const panel = document.getElementById(PANEL_ID);
      if (panel) {
        stopRec();
        panel.remove();
        return;
      }
      openPanel();
    });
    document.body.appendChild(b);
  }

  mount();
})();
