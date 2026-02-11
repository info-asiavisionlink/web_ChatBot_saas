(() => {
  const script = document.currentScript || [...document.scripts].slice(-1)[0];
  const WEBHOOK = script?.dataset?.webhook || "";
  if (!WEBHOOK) return console.error("data-webhook がない");

  const KEY = "ai_widget_session_id";
  let sessionId = localStorage.getItem(KEY);
  if (!sessionId) {
    sessionId = (crypto?.randomUUID?.() || String(Date.now())).toString();
    localStorage.setItem(KEY, sessionId);
  }

  const btn = document.createElement("button");
  btn.id = "aiWidgetBtn";
  btn.textContent = "💬";
  document.body.appendChild(btn);

  const box = document.createElement("div");
  box.id = "aiWidgetBox";
  box.innerHTML = `
    <div class="head">AIチャット <button id="aiWidgetClose">×</button></div>
    <div class="log" id="aiWidgetLog"></div>
    <div class="row">
      <input id="aiWidgetInput" placeholder="質問を入力…" />
      <button id="aiWidgetSend">送信</button>
    </div>
  `;
  document.body.appendChild(box);

  const style = document.createElement("style");
  style.textContent = `
    #aiWidgetBtn{position:fixed;right:18px;bottom:18px;width:56px;height:56px;border-radius:999px;border:none;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.25);font-size:22px;z-index:999999;background:#2563eb;color:#fff;}
    #aiWidgetBox{position:fixed;right:18px;bottom:86px;width:360px;max-width:92vw;height:520px;max-height:70vh;background:#fff;border-radius:16px;box-shadow:0 16px 50px rgba(0,0,0,.25);display:none;overflow:hidden;z-index:999999;font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans JP",sans-serif;}
    #aiWidgetBox .head{padding:12px 14px;font-weight:700;background:#f6f7fb;border-bottom:1px solid #eee;display:flex;align-items:center;justify-content:space-between;}
    #aiWidgetBox .log{padding:12px;height:calc(100% - 108px);overflow:auto;background:#fff;}
    .msg{margin:10px 0;display:flex;}
    .msg.user{justify-content:flex-end;}
    .bubble{max-width:78%;padding:10px 12px;border-radius:14px;line-height:1.4;white-space:pre-wrap;border:1px solid #eee;}
    .msg.user .bubble{background:#2563eb;color:#fff;border:none;}
    .msg.ai .bubble{background:#f3f4f6;}
    #aiWidgetBox .row{display:flex;gap:8px;padding:12px;border-top:1px solid #eee;background:#fff;}
    #aiWidgetInput{flex:1;padding:10px 12px;border-radius:10px;border:1px solid #e5e7eb;outline:none;}
    #aiWidgetSend{padding:10px 14px;border-radius:10px;border:none;cursor:pointer;background:#111827;color:#fff;}
    #aiWidgetClose{border:none;background:transparent;font-size:18px;cursor:pointer;}
  `;
  document.head.appendChild(style);

  const log = box.querySelector("#aiWidgetLog");
  const input = box.querySelector("#aiWidgetInput");
  const send = box.querySelector("#aiWidgetSend");
  const close = box.querySelector("#aiWidgetClose");

  function addMsg(role, text) {
    const wrap = document.createElement("div");
    wrap.className = "msg " + (role === "user" ? "user" : "ai");
    const bub = document.createElement("div");
    bub.className = "bubble";
    bub.textContent = text;
    wrap.appendChild(bub);
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
    return bub;
  }

  btn.onclick = () => box.style.display = (box.style.display === "none" || !box.style.display) ? "block" : "none";
  close.onclick = () => box.style.display = "none";

  async function doSend() {
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    addMsg("user", text);
    const pending = addMsg("ai", "…");

    try {
      const res = await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: sessionId })
      });
      const data = await res.json();
      pending.textContent = data.reply || "返答が空だ";
    } catch (e) {
      pending.textContent = "通信エラー。CORS(コルス)かWebhookだ。";
    }
  }

  send.onclick = doSend;
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") doSend(); });

  addMsg("ai", "こんにちは。質問を入力しろ。");
})();
