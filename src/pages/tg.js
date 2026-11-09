// Shell for the Telegram Mini App panel. The panel is its own document so it can
// stay mobile-native feeling without dragging in the marketing site's chrome.
const TG_STYLES = `
:root{--cream:#FBF3EC;--beige:#F3E3D6;--terra:#C0643F;--terra-dark:#A8512F;--ink:#2B2220;--muted:#6F625C;--line:#E7D6C7;--ok:#3f7d5a;--bad:#a8412f;
--serif:"Cormorant Garamond",Georgia,serif;--sans:"Jost",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
*{box-sizing:border-box}
body{margin:0;background:var(--cream);color:var(--ink);font-family:var(--sans);font-size:15px;line-height:1.5;-webkit-text-size-adjust:100%}
.tg-head{position:sticky;top:0;z-index:20;background:var(--ink);color:var(--cream);padding:14px 16px calc(12px + env(safe-area-inset-top,0)) 16px;display:flex;justify-content:space-between;align-items:center}
.tg-head b{font-family:var(--serif);font-size:1.15rem;letter-spacing:.16em;font-weight:600}
.tg-head span{font-size:.75rem;opacity:.75;letter-spacing:.08em;text-transform:uppercase}
#tg-tabs{position:sticky;top:0;z-index:19;display:flex;gap:6px;overflow-x:auto;padding:10px 12px;background:var(--beige);border-bottom:1px solid var(--line);scrollbar-width:none}
#tg-tabs::-webkit-scrollbar{display:none}
#tg-tabs button{flex:0 0 auto;border:1px solid transparent;background:transparent;color:var(--muted);font:inherit;font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;padding:8px 12px;border-radius:999px;cursor:pointer}
#tg-tabs button.is-on{background:var(--ink);color:var(--cream)}
main{padding:16px 14px calc(28px + env(safe-area-inset-bottom,0)) 14px;display:flex;flex-direction:column;gap:18px;max-width:720px;margin:0 auto}
.tsection{background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px}
.tsection h2{font-family:var(--serif);font-size:1.35rem;font-weight:500;margin:0 0 10px}
.tsection h3{font-size:.78rem;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin:18px 0 8px}
.tcard{border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:10px;background:var(--cream)}
.tcard--row{display:flex;justify-content:space-between;align-items:center;gap:10px}
.tcard p{margin:2px 0;font-size:.86rem}
.tmuted{color:var(--muted);font-size:.8rem}
details.tcard{padding:0}
details.tcard summary{padding:12px;cursor:pointer;list-style:none;font-size:.9rem}
details.tcard summary::-webkit-details-marker{display:none}
details.tcard summary::after{content:"▾";float:right;color:var(--muted)}
details.tcard[open] summary::after{content:"▴"}
details.tcard form{padding:0 12px 12px}
.trow{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:4px}
.tpill{font-size:.62rem;text-transform:uppercase;letter-spacing:.08em;padding:3px 8px;border-radius:999px;background:var(--beige);color:var(--muted)}
.tpill--confirmed{background:#e4f0e7;color:var(--ok)}
.tpill--pending{background:#fbeedc;color:#a06a1f}
.tpill--cancelled{background:#f6e2dd;color:var(--bad)}
.tbtns{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
button{font:inherit;cursor:pointer;border-radius:999px;border:1px solid var(--terra);background:var(--terra);color:#fff;padding:8px 15px;font-size:.8rem}
button.tghost{background:transparent;color:var(--terra-dark);border-color:var(--line)}
button:active{transform:translateY(1px)}
form{margin:0;display:flex;flex-direction:column;gap:10px}
.tfield{display:flex;flex-direction:column;gap:4px;flex:1}
.tfield label{font-size:.68rem;text-transform:uppercase;letter-spacing:.1em;color:var(--muted)}
input,select,textarea{font:inherit;font-size:.9rem;padding:9px 11px;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--ink);width:100%}
textarea{resize:vertical}
.ttwo{display:flex;gap:10px;flex-wrap:wrap}
.ttwo .tfield{min-width:120px}
.thours{display:grid;grid-template-columns:44px 1fr 1fr auto;gap:6px;align-items:center;font-size:.8rem}
.thours input[type=time]{padding:6px 8px;font-size:.8rem}
.tcheck{display:flex;align-items:center;gap:6px;font-size:.72rem;color:var(--muted)}
.tcheck input{width:auto}
.tinline{flex-direction:row;gap:8px}
.tinline input{flex:1}
.tgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-top:10px}
.ttile{margin:0;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--cream);display:flex;flex-direction:column}
.ttile img{width:100%;height:110px;object-fit:cover;display:block;background:var(--beige)}
.ttile figcaption{font-size:.72rem;padding:6px 8px;color:var(--muted);flex:1}
.ttile button{margin:0 8px 8px;padding:6px 10px;font-size:.72rem}
.talert{background:#fbeedc;border-radius:10px;padding:10px 12px;font-size:.82rem;margin-bottom:10px;display:flex;justify-content:space-between;gap:8px;align-items:center}
.tgate{padding:40px 20px;text-align:center;color:var(--muted)}
.tgate h1{font-family:var(--serif);font-size:1.6rem;color:var(--ink);font-weight:500}
.tg-toast{position:fixed;left:12px;right:12px;bottom:16px;background:var(--ink);color:var(--cream);padding:12px 16px;border-radius:12px;font-size:.82rem;opacity:0;transform:translateY(10px);transition:.25s;pointer-events:none;z-index:60;text-align:center}
.tg-toast.is-on{opacity:1;transform:none}
.tg-toast.is-bad{background:var(--bad)}
@media(min-width:620px){.thours{grid-template-columns:60px 1fr 1fr 70px}}
`;

export const tgPage = () => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">
<title>LUMIÈRE — Panel</title>
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#2B2220">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<style>${TG_STYLES}</style>
</head>
<body>
<header class="tg-head"><b>LUMIÈRE</b><span id="tg-who">Panel</span></header>
<nav id="tg-tabs" aria-label="Sections"></nav>
<main id="tg-main"><p class="tmuted">Loading…</p></main>
<input id="tg-file" type="file" accept="image/*" hidden>
<script src="/assets/tgapp.js" defer></script>
</body>
</html>`;
