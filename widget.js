(() => {
  const script = document.currentScript || [...document.scripts].slice(-1)[0];
  const WEBHOOK = script?.dataset?.webhook || "";
  if (!WEBHOOK) return console.error("data-webhook がない");

  // カスタム：data-title / data-accent（任意）
  const TITLE = script?.dataset?.title || "AIチャット";
  const ACCENT = script?.dataset?.accent || "#00E5FF"; // ネオン青
  const ACCENT2 = script?.dataset?.accent2 || "#B100FF"; // ネオン紫

  const KEY = "ai_widget_session_id";
  let sessionId = localStorage.getItem(KEY);
  if (!sessionId) {
    sessionId = (crypto?.randomUUID?.() || String(Date.now())).toString();
    localStorage.setItem(KEY, sessionId);
  }

  // UI
  const btn = document.createElement("button");
  btn.id = "aiWidgetBtn";
  btn.setAttribute("aria-label", "open chat");
  btn.innerHTML = `<span class="aiIcon">⟡</span>`;
  document.body.appendChild(btn);

  const box = document.createElement("div");
  box.id = "aiWidgetBox";
  box.innerHTML = `
    <div class="aiHead">
      <div class="aiBrand">
        <div class="aiTitle">${TITLE}</div>
        <div class="aiSub">NEXT ASIA LINK // NAL-ASSIST v0.1</div>
      </div>
      <button id="aiWidgetClose" class="aiX" aria-label="close">×</button>
    </div>

    <div class="aiLog" id="aiWidgetLog"></div>

    <div class="aiRow">
      <input id="aiWidgetInput" placeholder="質問を入力…" />
      <button id="aiWidgetSend">送信</button>
    </div>

    <div class="aiFoot">Powered by n8n + AI</div>
  `;
  document.body.appendChild(box);

  // CSS（サイバーパンク）
  const style = document.createElement("style");
  style.textContent = `
:root{
  --ai-accent: ${ACCENT};
  --ai-accent2: ${ACCENT2};
  --ai-bg: rgba(10, 12, 20, .78);
  --ai-panel: rgba(12, 16, 28, .66);
  --ai-text: rgba(245,245,255,.92);
  --ai-muted: rgba(200,210,255,.70);
  --ai-line: rgba(0, 229, 255, .25);
  --ai-shadow: 0 18px 60px rgba(0,0,0,.55);
  --ai-radius: 18px;
}

#aiWidgetBtn{
  position:fixed; right:18px; bottom:18px; width:60px; height:60px;
  border-radius:999px; border:1px solid rgba(255,255,255,.12);
  cursor:pointer; z-index:999999;
  background: radial-gradient(120% 120% at 20% 20%, rgba(0,229,255,.35), rgba(177,0,255,.18) 55%, rgba(10,12,20,.9) 100%);
  box-shadow: 0 0 0 2px rgba(0,229,255,.12), 0 0 26px rgba(0,229,255,.35), var(--ai-shadow);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: transform .15s ease, box-shadow .15s ease, filter .15s ease;
}
#aiWidgetBtn:hover{
  transform: translateY(-2px);
  box-shadow: 0 0 0 2px rgba(177,0,255,.18), 0 0 34px rgba(0,229,255,.55), var(--ai-shadow);
  filter: saturate(1.2);
}
#aiWidgetBtn .aiIcon{
  color: var(--ai-text);
  font-size: 22px;
  text-shadow: 0 0 12px rgba(0,229,255,.55);
}

#aiWidgetBox{
  position:fixed; right:18px; bottom:92px; width:390px; max-width:92vw; height:560px; max-height:72vh;
  display:none; overflow:hidden; z-index:999999;
  color: var(--ai-text);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans JP", sans-serif;
  background: linear-gradient(180deg, rgba(12,16,28,.82), rgba(10,12,20,.72));
  border-radius: var(--ai-radius);
  border: 1px solid rgba(255,255,255,.10);
  box-shadow: 0 0 0 1px rgba(0,229,255,.10), 0 0 40px rgba(0,229,255,.18), 0 0 70px rgba(177,0,255,.12), var(--ai-shadow);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

/* ネオン枠（疑似） */
#aiWidgetBox::before{
  content:"";
  position:absolute; inset:-1px;
  border-radius: var(--ai-radius);
  padding:1px;
  background: linear-gradient(135deg, rgba(0,229,255,.85), rgba(177,0,255,.75), rgba(0,229,255,.55));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events:none;
  opacity:.65;
}

/* ヘッダー */
.aiHead{
  position:relative;
  padding:12px 14px;
  background: linear-gradient(180deg, rgba(0,229,255,.08), rgba(177,0,255,.03));
  border-bottom: 1px solid rgba(255,255,255,.08);
  display:flex; align-items:flex-start; justify-content:space-between;
}
.aiBrand{ display:flex; flex-direction:column; gap:4px; }
.aiTitle{
  font-weight: 800;
  letter-spacing: .08em;
  font-size: 14px;
  text-transform: uppercase;
  text-shadow: 0 0 12px rgba(0,229,255,.35);
}
.aiSub{
  font-size: 11px;
  color: var(--ai-muted);
  letter-spacing: .12em;
  opacity: .9;
}
.aiX{
  border:none; background: transparent;
  color: rgba(245,245,255,.85);
  font-size: 20px; cursor:pointer;
  width:34px; height:34px; border-radius:10px;
  border: 1px solid rgba(255,255,255,.08);
  box-shadow: 0 0 18px rgba(0,229,255,.08);
}
.aiX:hover{ box-shadow: 0 0 24px rgba(0,229,255,.18); }

/* ログ */
.aiLog{
  padding:14px;
  height: calc(100% - 162px);
  overflow:auto;
}
.aiLog::-webkit-scrollbar{ width:10px; }
.aiLog::-webkit-scrollbar-thumb{
  background: linear-gradient(180deg, rgba(0,229,255,.30), rgba(177,0,255,.25));
  border-radius: 999px;
}
.aiMsg{ margin:12px 0; display:flex; }
.aiMsg.user{ justify-content:flex-end; }

.aiBubble{
  max-width:78%;
  padding:10px 12px;
  border-radius: 14px;
  line-height: 1.55;
  white-space: pre-wrap;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(255,255,255,.04);
  box-shadow: 0 0 0 1px rgba(0,229,255,.06), 0 0 18px rgba(0,229,255,.08);
}

.aiMsg.user .aiBubble{
  border: 1px solid rgba(0,229,255,.25);
  background: linear-gradient(135deg, rgba(0,229,255,.22), rgba(177,0,255,.14));
  box-shadow: 0 0 0 1px rgba(177,0,255,.10), 0 0 26px rgba(0,229,255,.18);
}

/* 入力 */
.aiRow{
  display:flex; gap:10px;
  padding:12px 12px;
  border-top: 1px solid rgba(255,255,255,.08);
  background: rgba(0,0,0,.14);
}
#aiWidgetInput{
  flex:1;
  padding:10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.10);
  outline:none;
  background: rgba(8,10,16,.55);
  color: var(--ai-text);
  box-shadow: inset 0 0 0 1px rgba(0,229,255,.06);
}
#aiWidgetInput:focus{
  border-color: rgba(0,229,255,.40);
  box-shadow: 0 0 0 3px rgba(0,229,255,.16), inset 0 0 0 1px rgba(177,0,255,.08);
}

#aiWidgetSend{
  padding:10px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.10);
  cursor:pointer;
  color: rgba(245,245,255,.95);
  background: linear-gradient(135deg, rgba(0,229,255,.45), rgba(177,0,255,.30));
  box-shadow: 0 0 0 1px rgba(0,229,255,.10), 0 0 22px rgba(0,229,255,.22);
  transition: transform .12s ease, filter .12s ease, box-shadow .12s ease;
}
#aiWidgetSend:hover{
  transform: translateY(-1px);
  filter: saturate(1.2);
  box-shadow: 0 0 0 1px rgba(177,0,255,.12), 0 0 30px rgba(0,229,255,.32);
}

.aiFoot{
  padding:8px 12px;
  font-size: 11px;
  color: rgba(200,210,255,.62);
  border-top: 1px solid rgba(255,255,255,.06);
  letter-spacing: .10em;
  text-transform: uppercase;
}
  `;
  document.head.appendChild(style);

  // ロジック
  const log = box.querySelector("#aiWidgetLog");
  const input = box.querySelector("#aiWidgetInput");
  const send = box.querySelector("#aiWidgetSend");
  const close = box.querySelector("#aiWidgetClose");

  function addMsg(role, text) {
    const wrap = document.createElement("div");
    wrap.className = "aiMsg " + (role === "user" ? "user" : "ai");
    const bub = document.createElement("div");
    bub.className = "aiBubble";
    bub.textContent = text;
    wrap.appendChild(bub);
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
    return bub;
  }

  btn.onclick = () => {
    box.style.display = (box.style.display === "none" || !box.style.display) ? "block" : "none";
  };
  close.onclick = () => { box.style.display = "none"; };

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
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
          page_url: location.href,
          ts: new Date().toISOString()
        })
      });
      const data = await res.json();
      pending.textContent = data.reply || "返答が空だ";
    } catch (e) {
      pending.textContent = "通信エラー。CORS(コルス)かWebhookだ。";
    }
  }

  send.onclick = doSend;
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") doSend(); });

  addMsg("ai", "起動完了。質問を入力しろ。");
})();
