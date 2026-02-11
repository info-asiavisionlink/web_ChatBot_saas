(() => {
  const script = document.currentScript || [...document.scripts].slice(-1)[0];
  const WEBHOOK = script?.dataset?.webhook || "";
  if (!WEBHOOK) return console.error("data-webhook がない");

  const TITLE = script?.dataset?.title || "NEXT ASIA LINK AI";
  const ACCENT = script?.dataset?.accent || "#00E5FF";
  const ACCENT2 = script?.dataset?.accent2 || "#B100FF";

  const KEY = "ai_widget_session_id";
  let sessionId = localStorage.getItem(KEY);
  if (!sessionId) {
    sessionId = (crypto?.randomUUID?.() || String(Date.now())).toString();
    localStorage.setItem(KEY, sessionId);
  }

  // ===== 横長バー（ランチャー） =====
  const launcher = document.createElement("div");
  launcher.id = "aiLauncher";
  launcher.innerHTML = `
    <div class="aiLauncherGlow"></div>
    <input id="aiLauncherInput" placeholder="AIに質問する…" />
    <button id="aiLauncherSend" aria-label="send">↵</button>
  `;
  document.body.appendChild(launcher);

  // ===== 本体ウィンドウ =====
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
  `;
  document.body.appendChild(box);

  // ===== CSS（ズレ修正 + ランチャー追加） =====
  const style = document.createElement("style");
  style.textContent = `
:root{
  --ai-accent:${ACCENT};
  --ai-accent2:${ACCENT2};
  --ai-text:rgba(245,245,255,.92);
  --ai-muted:rgba(200,210,255,.70);
  --ai-shadow:0 18px 60px rgba(0,0,0,.55);
  --ai-radius:18px;
}

/* ===== 横長ランチャー ===== */
#aiLauncher{
  position:fixed; right:18px; bottom:18px;
  width:min(520px, calc(100vw - 36px));
  height:54px;
  z-index:999999;
  border-radius:999px;
  border:1px solid rgba(255,255,255,.12);
  background: rgba(12,16,28,.78);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 0 0 1px rgba(0,229,255,.10), 0 0 30px rgba(0,229,255,.16), var(--ai-shadow);
  display:flex; align-items:center; gap:10px;
  padding: 8px 10px;
  overflow:hidden;
}
#aiLauncher .aiLauncherGlow{
  position:absolute; inset:-2px;
  background: radial-gradient(60% 120% at 10% 50%, rgba(0,229,255,.25), transparent 60%),
              radial-gradient(60% 120% at 90% 50%, rgba(177,0,255,.18), transparent 60%);
  pointer-events:none;
}
#aiLauncherInput{
  flex:1;
  height:38px;
  border-radius:999px;
  border:1px solid rgba(255,255,255,.10);
  background: rgba(8,10,16,.55);
  color: var(--ai-text);
  outline:none;
  padding: 0 14px;
  box-shadow: inset 0 0 0 1px rgba(0,229,255,.06);
  position:relative;
}
#aiLauncherInput:focus{
  border-color: rgba(0,229,255,.40);
  box-shadow: 0 0 0 3px rgba(0,229,255,.14), inset 0 0 0 1px rgba(177,0,255,.08);
}
#aiLauncherSend{
  width:42px; height:38px;
  border-radius:999px;
  border:1px solid rgba(255,255,255,.10);
  cursor:pointer;
  color: rgba(245,245,255,.95);
  background: linear-gradient(135deg, rgba(0,229,255,.45), rgba(177,0,255,.30));
  box-shadow: 0 0 0 1px rgba(0,229,255,.10), 0 0 22px rgba(0,229,255,.22);
  font-size:16px;
  display:flex; align-items:center; justify-content:center;
}

/* ===== 本体（ズレ修正） ===== */
#aiWidgetBox{
  position:fixed; right:18px; bottom:82px; /* ランチャーの上に積む */
  width:390px; max-width:92vw;
  height:560px; max-height:72vh;
  display:none; overflow:hidden;
  z-index:999999;
  color: var(--ai-text);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans JP", sans-serif;
  background: linear-gradient(180deg, rgba(12,16,28,.82), rgba(10,12,20,.72));
  border-radius: var(--ai-radius);
  border: 1px solid rgba(255,255,255,.10);
  box-shadow: 0 0 0 1px rgba(0,229,255,.10), 0 0 40px rgba(0,229,255,.18), 0 0 70px rgba(177,0,255,.12), var(--ai-shadow);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}
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

/* ヘッダー：×ズレ修正（サイズ固定＆中央揃え） */
.aiHead{
  padding:12px 12px;
  background: linear-gradient(180deg, rgba(0,229,255,.08), rgba(177,0,255,.03));
  border-bottom: 1px solid rgba(255,255,255,.08);
  display:flex; align-items:center; justify-content:space-between;
  gap:10px;
}
.aiBrand{ display:flex; flex-direction:column; gap:4px; min-width:0; }
.aiTitle{
  font-weight: 800; letter-spacing: .08em; font-size: 14px;
  text-transform: uppercase;
  text-shadow: 0 0 12px rgba(0,229,255,.35);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.aiSub{
  font-size: 11px; color: var(--ai-muted);
  letter-spacing: .12em; opacity: .9;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.aiX{
  width:36px; height:36px; /* 固定でズレ消す */
  border:none; background: rgba(0,0,0,.18);
  color: rgba(245,245,255,.85);
  border-radius:12px;
  border: 1px solid rgba(255,255,255,.10);
  display:flex; align-items:center; justify-content:center;
  font-size:20px; line-height:1;
  cursor:pointer;
}

/* ログ */
.aiLog{
  padding:14px;
  height: calc(100% - 122px); /* footer消したので調整 */
  overflow:auto;
  overscroll-behavior: contain;
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
}
#aiWidgetInput:focus{
  border-color: rgba(0,229,255,.40);
  box-shadow: 0 0 0 3px rgba(0,229,255,.14);
}
#aiWidgetSend{
  padding:10px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.10);
  cursor:pointer;
  color: rgba(245,245,255,.95);
  background: linear-gradient(135deg, rgba(0,229,255,.45), rgba(177,0,255,.30));
  box-shadow: 0 0 0 1px rgba(0,229,255,.10), 0 0 22px rgba(0,229,255,.22);
}
  `;
  document.head.appendChild(style);

  const log = box.querySelector("#aiWidgetLog");
  const input = box.querySelector("#aiWidgetInput");
  const send = box.querySelector("#aiWidgetSend");
  const close = box.querySelector("#aiWidgetClose");

  const lInput = launcher.querySelector("#aiLauncherInput");
  const lSend = launcher.querySelector("#aiLauncherSend");

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

  function openBox() { box.style.display = "block"; }
  function closeBox() { box.style.display = "none"; }

  close.onclick = closeBox;

  async function doSend(text) {
    const t = (text ?? input.value).trim();
    if (!t) return;

    // 送信元がランチャーなら、ボックスを開いてログへ
    openBox();

    // 入力欄クリア
    input.value = "";
    lInput.value = "";

    addMsg("user", t);
    const pending = addMsg("ai", "…");

    try {
      const res = await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: t,
          session_id: sessionId,
          page_url: location.href,
          ts: new Date().toISOString()
        })
      });
      const data = await res.json();
      pending.textContent = data.reply || data.output || data.text || "返答が空だ";
    } catch (e) {
      pending.textContent = "通信エラー。CORS(コルス)かWebhookだ。";
    }
  }

  // 本体送信
  send.onclick = () => doSend(input.value);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") doSend(input.value); });

  // ランチャー送信（＝ここがメイン）
  lSend.onclick = () => doSend(lInput.value);
  lInput.addEventListener("keydown", (e) => { if (e.key === "Enter") doSend(lInput.value); });

  addMsg("ai", "質問をどうぞ。料金/導入も答える。");
})();
