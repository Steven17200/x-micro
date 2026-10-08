// ==UserScript==
// @name         X — micro
// @namespace    https://denizault.local/x-micro
// @version      1.2.0
// @description  FR, US et Dictée dans le compose. Le micro de gauche est retiré. Un seul micro : Écoute.
// @author       Grok (xAI)
// @match        https://x.com/*
// @match        https://twitter.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==
// Signé Grok (xAI) — octobre 2026.

(function () {
  "use strict";

  const PANEL_ID = "xd-micro-panel";
  const DICTEE_ID = "xd-dictee";
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

  function readText(el) {
    return (el.innerText || el.textContent || "").replace(/\u00a0/g, " ").trim();
  }

  function corrige(src) {
    let t = src.replace(/\r\n/g, "\n");
    t = t.replace(/[ \t]+\n/g, "\n");
    t = t.replace(/\n{3,}/g, "\n\n");
    t = t.replace(/[ \t]{2,}/g, " ");
    t = t.replace(/\s+([,.;!?…])/g, "$1");
    t = t.replace(/([:;!?])(?=\S)/g, "$1 ");
    t = t.replace(/([.!?…])\s+([a-zàâäéèêëïîôùûüç])/g, (_, p, l) => p + " " + l.toUpperCase());
    const rules = [
      [/\belle à\b/gi, "elle a"],
      [/\bil à\b/gi, "il a"],
      [/\bon à\b/gi, "on a"],
      [/\bça à\b/gi, "ça a"],
      [/\bce sens\b/gi, "se sent"],
      [/\bse sens\b/gi, "se sent"],
      [/\bce sent\b/gi, "se sent"],
      [/\bqu'elle ce\b/gi, "qu'elle se"],
      [/\bqu'il ce\b/gi, "qu'il se"],
      [/\bje peut\b/gi, "je peux"],
      [/\btu peut\b/gi, "tu peux"],
      [/\bsa va\b/gi, "ça va"],
      [/\bcé\b/g, "c'est"],
      [/\bCé\b/g, "C'est"],
      [/\bpar ce que\b/gi, "parce que"],
      [/\bpar ce qu'/gi, "parce qu'"],
      [/\bquelque soit\b/gi, "quel que soit"],
      [/\bn'importe quelles\b/gi, "n'importe lesquelles"],
      [/\bmalgrés\b/gi, "malgré"],
      [/\bconnection\b/gi, "connexion"],
      [/\baddresse\b/gi, "adresse"],
    ];
    for (const [re, to] of rules) t = t.replace(re, to);
    t = t.replace(/\s+([,.;])/g, "$1");
    t = t.replace(/([:;!?])(?=\S)/g, "$1 ");
    t = t.replace(/[ \t]{2,}/g, " ");
    return t.trim();
  }

  function spoken(src) {
    return /\b(ouais|bah|euh|putain|merde|que dalle|veut pas|peut pas|j'suis|t'as|y a)\b/i.test(src);
  }

  function texan(us, src) {
    if (!spoken(src)) return { text: us, note: "US standard. Pas de touche texane : phrase neutre." };
    let t = us;
    t = t.replace(/\byou guys\b/gi, "y'all");
    t = t.replace(/\bgoing to\b/gi, "fixin' to");
    t = t.replace(/\bdon't want to\b/gi, "don't wanna");
    t = t.replace(/\bcannot\b/gi, "can't");
    return { text: t, note: "US parlé, touche texane légère (y'all / fixin' to / wanna)." };
  }

  function translate(fr) {
    return new Promise((resolve, reject) => {
      const q = encodeURIComponent(fr.slice(0, 450));
      const xhr = new XMLHttpRequest();
      xhr.open("GET", "https://api.mymemory.translated.net/get?langpair=fr|en&q=" + q);
      xhr.timeout = 12000;
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          const out = data && data.responseData && data.responseData.translatedText;
          if (!out || /INVALID|QUERY LENGTH/i.test(out)) reject(new Error("vide"));
          else resolve(out);
        } catch (e) {
          reject(e);
        }
      };
      xhr.onerror = () => reject(new Error("réseau"));
      xhr.ontimeout = () => reject(new Error("timeout"));
      xhr.send();
    });
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

  function textPanel(title, value, note) {
    stopRec();
    document.getElementById(PANEL_ID)?.remove();
    const box = document.createElement("div");
    box.id = PANEL_ID;
    box.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483647;width:min(380px,calc(100vw - 32px));background:#000;color:#e7e9ea;border:1px solid #2f3336;border-radius:12px;padding:10px;font:13px/1.35 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.5)";
    box.innerHTML = '<div style="font-weight:700;margin-bottom:6px"></div><textarea style="width:100%;box-sizing:border-box;min-height:84px;background:#16181c;color:#e7e9ea;border:1px solid #2f3336;border-radius:8px;padding:6px;resize:vertical"></textarea><div style="display:flex;gap:6px;margin-top:6px;align-items:center"><button type="button" data-act="copy" style="background:#eff3f4;color:#0f1419;border:0;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;cursor:pointer">Copier</button><button type="button" data-act="inject" style="background:#1d9bf0;color:#fff;border:0;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;cursor:pointer">Injecter</button><button type="button" data-act="close" style="margin-left:auto;background:transparent;color:#71767b;border:0;cursor:pointer;font-size:12px">Fermer</button></div><div data-act="status" style="margin-top:4px;color:#71767b;font-size:11px"></div>';
    box.querySelector("div").textContent = title;
    const area = box.querySelector("textarea");
    const status = box.querySelector("[data-act=status]");
    area.value = value;
    status.textContent = note || "";
    const halt = (ev) => { ev.preventDefault(); ev.stopPropagation(); };
    box.querySelector("[data-act=copy]").addEventListener("click", async (ev) => {
      halt(ev);
      try {
        await navigator.clipboard.writeText(area.value);
        status.textContent = "Copié.";
      } catch (e) {
        area.focus();
        area.select();
        status.textContent = "Sélectionné. Ctrl+C.";
      }
    });
    box.querySelector("[data-act=inject]").addEventListener("click", (ev) => {
      halt(ev);
      const live = composer();
      if (!area.value.trim()) { status.textContent = "Zone vide."; return; }
      if (!live) { status.textContent = "Ouvre une réponse X d’abord."; return; }
      setText(live, area.value.trim());
      status.textContent = "Injecté.";
    });
    box.querySelector("[data-act=close]").addEventListener("click", (ev) => {
      halt(ev);
      stopRec();
      box.remove();
    });
    document.body.appendChild(box);
    return { area, status };
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
        status.textContent = "Micro refusé. Cadenas de x.com → Micro → Autoriser. Brave : brave://settings/search.";
      } else if (code === "network") {
        status.textContent = "Brave bloque souvent la dictée. brave://settings/search → reconnaissance vocale.";
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
    try { r.start(); }
    catch (e) {
      rec = null;
      micBtn.textContent = "Écoute";
      status.textContent = "Démarrage impossible. Reclique Écoute.";
    }
  }

  function openDictee() {
    const ui = textPanel("Dictée", "", "Clique Écoute, parle, puis Injecter.");
    const row = ui.area.nextElementSibling;
    const listen = document.createElement("button");
    listen.type = "button";
    listen.textContent = "Écoute";
    listen.style.cssText = "background:#f4212e;color:#fff;border:0;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;cursor:pointer";
    row.insertBefore(listen, row.firstChild);
    listen.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      listenInto(ui.area, ui.status, listen);
    });
  }

  function pill(label) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.style.cssText = "background:transparent;color:#1d9bf0;border:1px solid #1d9bf0;border-radius:999px;padding:0 6px;height:18px;line-height:16px;font-size:11px;font-weight:700;cursor:pointer";
    return b;
  }

  function onFR() {
    const live = composer();
    const src = live ? readText(live) : "";
    if (!src) return;
    textPanel("Français corrigé", corrige(src), "Orthographe et typo. Ton oral gardé.");
  }

  async function onUS(btn) {
    const live = composer();
    const src = live ? readText(live) : "";
    if (!src) return;
    const fixed = corrige(src);
    const prev = btn.textContent;
    btn.textContent = "…";
    try {
      const en = await translate(fixed);
      const out = texan(en, src);
      textPanel("Anglais US", out.text, out.note);
    } catch (e) {
      textPanel("Anglais US", fixed, "Traduction indisponible. Français corrigé laissé tel quel.");
    }
    btn.textContent = prev;
  }

  function killBrokenMic() {
    document.getElementById("xd-micro-launch")?.remove();
    document.querySelectorAll("button").forEach((b) => {
      if (b.closest("#" + PANEL_ID)) return;
      const t = (b.textContent || "").trim();
      if (t === "🎤" || t === "●" || t === "Micro") b.remove();
    });
  }

  function fix() {
    killBrokenMic();
    const el = composer();
    if (!el || !el.parentElement) return;
    const host = el.parentElement;
    const fr = Array.from(host.querySelectorAll("button")).find((b) => b.textContent.trim() === "FR");
    let wrap = fr ? fr.parentElement : host.querySelector("#xd-micro-wrap");
    if (!wrap) {
      wrap = document.createElement("span");
      wrap.id = "xd-micro-wrap";
      wrap.style.cssText = "display:inline-flex;gap:4px;margin:4px 0 0 6px;vertical-align:middle";
      const frb = pill("FR");
      frb.title = "Corriger le français";
      frb.addEventListener("click", (ev) => { ev.preventDefault(); ev.stopPropagation(); onFR(); });
      const usb = pill("US");
      usb.title = "Corriger puis anglais américain";
      usb.addEventListener("click", (ev) => { ev.preventDefault(); ev.stopPropagation(); onUS(usb); });
      wrap.appendChild(frb);
      wrap.appendChild(usb);
      host.appendChild(wrap);
    }
    if (!wrap.querySelector("#" + DICTEE_ID)) {
      const d = pill("Dictée");
      d.id = DICTEE_ID;
      d.title = "Ouvrir la zone de dictée";
      d.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const panel = document.getElementById(PANEL_ID);
        if (panel && panel.firstChild && panel.firstChild.textContent === "Dictée") {
          stopRec();
          panel.remove();
          return;
        }
        openDictee();
      });
      wrap.appendChild(d);
    }
  }

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    setTimeout(() => { queued = false; fix(); }, 0);
  }

  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  schedule();
})();
