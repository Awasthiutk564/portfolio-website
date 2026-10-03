// Booglu chat widget -> POST /api/chat (Gemini on the server, with a local
// fallback). The server builds Booglu's knowledge from the same profile.json.

import { $ } from "./util.js";

export function chat() {
  const fab = $("#chat-fab"), box = $("#chat"), log = $("#chat-log"), form = $("#chat-form"), input = $("#chat-input");
  let sid = null;
  try { sid = sessionStorage.getItem("booglu-sid"); } catch {}
  let greeted = false;

  const add = (text, who) => {
    const div = document.createElement("div");
    div.className = `msg ${who}`;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return div;
  };

  async function send(text) {
    text = text.trim();
    if (!text) return;
    add(text, "me");
    const typing = add("Booglu is typing…", "bot typing");
    try {
      const r = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId: sid }),
      });
      const data = await r.json();
      if (data.sessionId) { sid = data.sessionId; try { sessionStorage.setItem("booglu-sid", sid); } catch {} }
      typing.className = "msg bot";
      typing.textContent = data.reply || data.error || "Hmm, I lost my train of thought. Try again?";
    } catch {
      typing.className = "msg bot";
      typing.textContent = "I can't reach my brain right now. Email Utkarsh directly from the contact section!";
    }
  }

  const QUICK = ["Who is Utkarsh?", "What's he building now?", "Top projects?", "Is he open to internships?"];
  $("#chat-quick").innerHTML = "";
  QUICK.forEach((q) => {
    const bt = document.createElement("button");
    bt.type = "button"; bt.textContent = q;
    bt.onclick = () => send(q);
    $("#chat-quick").appendChild(bt);
  });

  function open() {
    box.hidden = false;
    if (!greeted) { add("Hey! 👋 I'm Booglu, Utkarsh's AI assistant. I'm synced with his latest résumé, LinkedIn and GitHub. Ask me anything.", "bot"); greeted = true; }
    input.focus();
  }
  const close = () => { box.hidden = true; fab.focus(); };
  fab.addEventListener("click", () => (box.hidden ? open() : close()));
  $("#chat-close").addEventListener("click", close);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !box.hidden) close(); });
  form.addEventListener("submit", (e) => { e.preventDefault(); const t = input.value; input.value = ""; send(t); });
  return { open };
}
