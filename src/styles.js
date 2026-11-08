// Global design system. Injected once per page; kept in one place so every
// section, page and admin screen shares the same tokens.
export const STYLES = `
:root{
  --cream:#FBF3EC; --beige:#F3E3D6; --sand:#EAD6C4;
  --terracotta:#C0643F; --terracotta-dark:#A8512F; --terracotta-soft:#F0D9CC;
  --ink:#2B2220; --muted:#6F625C; --line:rgba(43,34,32,.12);
  --white:#FFFFFF; --blush:#F7E8DE;
  --serif:"Cormorant Garamond",Georgia,"Times New Roman",serif;
  --sans:"Jost","Inter",system-ui,-apple-system,"Segoe UI",sans-serif;
  --shadow-sm:0 2px 10px rgba(43,34,32,.05);
  --shadow:0 18px 48px -24px rgba(43,34,32,.28);
  --shadow-lg:0 40px 80px -40px rgba(43,34,32,.35);
  --radius:18px; --radius-lg:28px; --radius-pill:999px;
  --max:1240px; --gutter:20px;
  --header-h:72px;
  --ease:cubic-bezier(.22,.61,.36,1);
}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;background:var(--cream);color:var(--ink);font-family:var(--sans);font-size:16px;line-height:1.65;font-weight:300;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block;background:linear-gradient(135deg,var(--beige),var(--sand))}
a{color:inherit;text-decoration:none}
button,input,select,textarea{font:inherit;color:inherit}
h1,h2,h3,h4{font-family:var(--serif);font-weight:400;line-height:1.08;letter-spacing:-.01em;margin:0}
h1{font-size:clamp(2.4rem,5vw,3.9rem)}
h2{font-size:clamp(2.1rem,4vw,3.4rem)}
h3{font-size:clamp(1.35rem,2vw,1.7rem)}
p{margin:0 0 1em}
ul,ol{margin:0;padding:0;list-style:none}
:focus-visible{outline:2px solid var(--terracotta-dark);outline-offset:3px;border-radius:4px}
::selection{background:var(--terracotta);color:#fff}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.skip-link{position:absolute;left:16px;top:-60px;z-index:200;background:var(--ink);color:#fff;padding:10px 18px;border-radius:8px;transition:top .2s}
.skip-link:focus{top:12px}
.wrap{width:100%;max-width:var(--max);margin-inline:auto;padding-inline:var(--gutter)}
@media(min-width:768px){:root{--gutter:32px;--header-h:80px}}
@media(min-width:1200px){:root{--gutter:40px}}
.section{padding-block:clamp(56px,9vw,104px)}
.section--tight{padding-block:clamp(40px,6vw,64px)}
.section--beige{background:var(--beige)}
.section--ink{background:var(--ink);color:var(--cream)}
.eyebrow{display:inline-flex;align-items:center;gap:10px;font-size:.72rem;letter-spacing:.24em;text-transform:uppercase;color:var(--terracotta);font-weight:500;margin:0 0 18px}
.eyebrow::before{content:"";width:26px;height:1px;background:currentColor;opacity:.6}
.eyebrow--center::after{content:"";width:26px;height:1px;background:currentColor;opacity:.6}
.lede{color:var(--muted);font-size:clamp(1rem,1.4vw,1.08rem);max-width:56ch}
.section-head{display:flex;flex-direction:column;gap:24px;margin-bottom:clamp(32px,5vw,56px)}
.section-head .lede{margin:14px 0 0}
@media(min-width:900px){.section-head{flex-direction:row;align-items:flex-end;justify-content:space-between;gap:48px}.section-head__text{max-width:640px}}
.center{text-align:center}
.center .eyebrow{justify-content:center}
.center .lede{margin-inline:auto}

/* ---------- buttons ---------- */
.btn{--btn-bg:var(--terracotta);--btn-fg:#fff;display:inline-flex;align-items:center;justify-content:center;gap:12px;background:var(--btn-bg);color:var(--btn-fg);border:1px solid transparent;border-radius:var(--radius-pill);padding:14px 26px;font-family:var(--sans);font-size:.78rem;font-weight:500;letter-spacing:.13em;text-transform:uppercase;cursor:pointer;transition:transform .25s var(--ease),background .25s,box-shadow .25s,color .25s;min-height:48px}
.btn svg{width:15px;height:15px;flex:none;transition:transform .25s var(--ease)}
.btn:hover{background:var(--terracotta-dark);transform:translateY(-2px);box-shadow:0 14px 28px -16px rgba(168,81,47,.75)}
.btn:hover svg{transform:translateX(4px)}
.btn:active{transform:translateY(0)}
.btn:disabled{opacity:.55;cursor:not-allowed;transform:none;box-shadow:none}
.btn--ghost{--btn-bg:transparent;--btn-fg:var(--ink);border-color:rgba(43,34,32,.24)}
.btn--ghost:hover{--btn-bg:var(--ink);--btn-fg:var(--cream);border-color:var(--ink);box-shadow:none}
.btn--light{--btn-bg:#fff;--btn-fg:var(--ink)}
.btn--light:hover{--btn-bg:var(--cream);--btn-fg:var(--terracotta-dark)}
.btn--outline-light{--btn-bg:transparent;--btn-fg:#fff;border-color:rgba(255,255,255,.5)}
.btn--outline-light:hover{--btn-bg:#fff;--btn-fg:var(--terracotta-dark);border-color:#fff}
.btn--sm{padding:10px 18px;font-size:.7rem;min-height:40px}
.btn--block{width:100%}
.link-arrow{display:inline-flex;align-items:center;gap:10px;font-size:.76rem;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:var(--ink);padding-bottom:6px;border-bottom:1px solid rgba(43,34,32,.3);transition:color .2s,border-color .2s,gap .2s}
.link-arrow svg{width:14px;height:14px;transition:transform .25s var(--ease)}
.link-arrow:hover{color:var(--terracotta);border-color:var(--terracotta);gap:14px}
.link-arrow--light{color:#fff;border-color:rgba(255,255,255,.45)}
.link-arrow--light:hover{color:#fff;border-color:#fff}
.text-link{color:var(--terracotta-dark);text-decoration:underline;text-underline-offset:3px}
.text-link:hover{color:var(--ink)}

/* ---------- header ---------- */
.site-header{position:sticky;top:0;z-index:80;background:rgba(251,243,236,.86);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid transparent;transition:background .3s,box-shadow .3s,border-color .3s}
.site-header.is-scrolled{background:rgba(251,243,236,.94);border-bottom-color:var(--line);box-shadow:0 8px 30px -28px rgba(43,34,32,.6)}
.header-inner{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:var(--header-h)}
.brand{display:inline-flex;flex-direction:column;line-height:1;gap:4px;font-family:var(--serif);color:var(--ink);flex:none}
.brand b{font-weight:500;font-size:1.32rem;letter-spacing:.19em}
.brand span{font-family:var(--sans);font-size:.55rem;letter-spacing:.4em;text-transform:uppercase;color:var(--muted);font-weight:400}
.nav{display:none}
@media(min-width:1000px){.nav{display:flex;align-items:center;gap:clamp(14px,2vw,30px)}}
.nav a{position:relative;font-size:.72rem;letter-spacing:.17em;text-transform:uppercase;color:var(--muted);padding-block:8px;transition:color .2s}
.nav a::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:var(--terracotta);transform:scaleX(0);transform-origin:left;transition:transform .3s var(--ease)}
.nav a:hover{color:var(--ink)}
.nav a:hover::after,.nav a[aria-current="page"]::after{transform:scaleX(1)}
.nav a[aria-current="page"]{color:var(--ink)}
.header-actions{display:flex;align-items:center;gap:10px}
.header-actions .btn{display:none}
@media(min-width:640px){.header-actions .btn{display:inline-flex}}
.header-account{display:none;font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);padding:8px 4px}
.header-account:hover{color:var(--terracotta-dark)}
@media(min-width:1000px){.header-account{display:inline-flex}}
.nav-toggle{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;background:transparent;border:1px solid var(--line);border-radius:50%;cursor:pointer}
@media(min-width:1000px){.nav-toggle{display:none}}
.nav-toggle span{display:block;width:18px;height:1.5px;background:var(--ink);position:relative;transition:background .2s}
.nav-toggle span::before,.nav-toggle span::after{content:"";position:absolute;left:0;width:18px;height:1.5px;background:var(--ink);transition:transform .25s}
.nav-toggle span::before{top:-6px}.nav-toggle span::after{top:6px}
.nav-toggle[aria-expanded="true"] span{background:transparent}
.nav-toggle[aria-expanded="true"] span::before{transform:translateY(6px) rotate(45deg)}
.nav-toggle[aria-expanded="true"] span::after{transform:translateY(-6px) rotate(-45deg)}
.mobile-nav{position:fixed;inset:var(--header-h) 0 auto 0;z-index:79;background:var(--cream);border-bottom:1px solid var(--line);box-shadow:var(--shadow);padding:8px var(--gutter) 28px;display:none;max-height:calc(100dvh - var(--header-h));overflow-y:auto}
.mobile-nav.is-open{display:block;animation:fadeDown .25s var(--ease)}
.mobile-nav a{display:flex;align-items:center;justify-content:space-between;padding:16px 2px;border-bottom:1px solid var(--line);font-family:var(--serif);font-size:1.4rem}
.mobile-nav a:hover{color:var(--terracotta)}
.mobile-nav .btn{margin-top:22px}
@keyframes fadeDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}

/* ---------- hero ---------- */
.hero{position:relative;overflow:hidden;padding-block:clamp(24px,4vw,44px) clamp(36px,5.5vw,68px)}
.hero::before{content:"";position:absolute;right:-160px;top:-120px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,rgba(192,100,63,.13),transparent 65%);pointer-events:none}
.hero__grid{display:grid;gap:clamp(28px,5vw,56px);align-items:center}
@media(min-width:980px){.hero__grid{grid-template-columns:1.02fr .98fr;gap:clamp(40px,5vw,72px);align-items:start}.hero__copy{padding-top:10px}}
.hero__copy h1{margin-bottom:22px}
.hero__copy h1 em{display:block;font-style:italic;color:var(--terracotta);font-size:.96em}
.hero__copy .lede{font-size:clamp(1rem,1.4vw,1.1rem);max-width:44ch;margin-bottom:26px}
.hero__cta{display:flex;flex-wrap:wrap;align-items:center;gap:18px 26px}
.hero__proof{display:flex;align-items:center;gap:14px;margin-top:26px;flex-wrap:wrap}
.avatars{display:flex}
.avatars img{width:44px;height:44px;border-radius:50%;object-fit:cover;border:2.5px solid var(--cream);margin-left:-12px;box-shadow:var(--shadow-sm)}
.avatars img:first-child{margin-left:0}
.stars{display:inline-flex;gap:2px;color:var(--terracotta);font-size:.82rem;line-height:1}
.proof__text{font-size:.82rem;color:var(--muted);line-height:1.45}
.proof__text strong{display:block;color:var(--ink);font-weight:500;font-size:.86rem}
.hero__media{position:relative}
.hero__media img{width:100%;aspect-ratio:4/4.15;max-height:min(62vh,600px);object-fit:cover;border-radius:26px;box-shadow:var(--shadow-lg)}
.hero__frame{position:relative;border-radius:26px;overflow:hidden}
.hero__frame::after{content:"";position:absolute;inset:0;border-radius:inherit;border:1px solid rgba(255,255,255,.35);pointer-events:none}
.badge{position:absolute;right:-10px;bottom:-14px;width:118px;height:118px;border-radius:50%;background:var(--terracotta);color:#fff;display:grid;place-items:center;box-shadow:0 18px 34px -18px rgba(168,81,47,.9);z-index:2}
@media(min-width:640px){.badge{width:136px;height:136px;right:-18px;bottom:-18px}}
.badge__ring{position:absolute;inset:0;animation:spin 22s linear infinite}
.badge__ring text{font-family:var(--sans);font-size:9.5px;letter-spacing:.32em;text-transform:uppercase;fill:#fff}
.badge__leaf{width:34px;height:34px;stroke:#fff;fill:none;stroke-width:1.3}
@keyframes spin{to{transform:rotate(360deg)}}
.hero__note{display:none}
@media(min-width:980px){.hero__note{display:block;position:absolute;left:-46px;top:38px;writing-mode:vertical-rl;font-size:.62rem;letter-spacing:.34em;text-transform:uppercase;color:var(--muted)}}

/* ---------- features ---------- */
.features{border-block:1px solid var(--line)}
.features__grid{display:grid;grid-template-columns:1fr;gap:0}
@media(min-width:640px){.features__grid{grid-template-columns:1fr 1fr}}
@media(min-width:1024px){.features__grid{grid-template-columns:repeat(4,1fr)}}
.feature{padding:28px 0;display:flex;gap:16px;align-items:flex-start;border-bottom:1px solid var(--line)}
.feature:last-child{border-bottom:0}
@media(min-width:640px){.feature{padding:34px 26px;border-bottom:0;border-left:1px solid var(--line);flex-direction:column;gap:14px}.feature:nth-child(odd){border-left:0}}
@media(min-width:1024px){.feature{padding:42px 30px}.feature:nth-child(odd){border-left:1px solid var(--line)}.feature:first-child{border-left:0}}
.feature__icon{width:42px;height:42px;flex:none;display:grid;place-items:center;color:var(--terracotta)}
.feature__icon svg{width:26px;height:26px;stroke:currentColor;fill:none;stroke-width:1.2}
.feature h3{font-size:1.16rem;margin-bottom:6px;font-family:var(--sans);font-weight:500;letter-spacing:0}
.feature p{font-size:.85rem;color:var(--muted);margin:0;line-height:1.6}

/* ---------- image cards / arches ---------- */
.card-grid{display:grid;gap:clamp(20px,3vw,32px)}
@media(min-width:560px){.card-grid--2{grid-template-columns:repeat(2,1fr)}}
@media(min-width:900px){.card-grid--3{grid-template-columns:repeat(3,1fr)}.card-grid--4{grid-template-columns:repeat(4,1fr)}}
.arch-card{display:flex;flex-direction:column}
.arch-card__media{position:relative;overflow:hidden;border-radius:150px 150px 16px 16px;aspect-ratio:3/4;background:var(--sand)}
.arch-card__media img{width:100%;height:100%;object-fit:cover;transition:transform .8s var(--ease)}
.arch-card:hover .arch-card__media img{transform:scale(1.06)}
.arch-card h3{margin:18px 0 8px;font-size:1.5rem}
.arch-card p{font-size:.88rem;color:var(--muted);margin:0 0 14px}
.arch-card .link-arrow{font-size:.68rem;align-self:flex-start}
.arch-card__meta{display:flex;justify-content:space-between;align-items:center;font-size:.78rem;color:var(--muted);margin-top:auto;padding-top:10px;border-top:1px solid var(--line)}

/* ---------- story banner ---------- */
.story{position:relative;overflow:hidden;background:linear-gradient(112deg,#C0643F 0%,#C87B54 42%,#E2B594 100%);color:#fff}
.story__inner{display:grid;gap:36px;align-items:center;padding-block:clamp(52px,7vw,86px)}
@media(min-width:900px){.story__inner{grid-template-columns:1.05fr .95fr;gap:clamp(36px,6vw,72px)}}
.story .eyebrow{color:rgba(255,255,255,.85)}
.story h2{font-size:clamp(2.2rem,4.6vw,3.6rem);margin-bottom:18px}
.story h2 em{font-style:italic}
.story p{color:rgba(255,255,255,.9);max-width:48ch}
.story__media{position:relative}
.story__media img{width:100%;aspect-ratio:5/4;object-fit:cover;border-radius:50% / 42%;box-shadow:0 30px 60px -30px rgba(43,34,32,.55)}
.story__sign{font-family:var(--serif);font-style:italic;font-size:1.25rem;margin-top:22px;color:rgba(255,255,255,.92)}

/* ---------- CTA ---------- */
.cta{display:grid;gap:30px;align-items:center}
@media(min-width:860px){.cta{grid-template-columns:.85fr 1.15fr;gap:clamp(40px,6vw,72px)}}
.cta__media img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:50%;box-shadow:var(--shadow-lg)}
.cta__copy h2{margin-bottom:16px}
.cta__copy .lede{margin-bottom:26px}

/* ---------- stylists ---------- */
.stylist{background:var(--white);border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-sm);transition:transform .3s var(--ease),box-shadow .3s}
.stylist:hover{transform:translateY(-4px);box-shadow:var(--shadow)}
.stylist__media{position:relative;overflow:hidden;aspect-ratio:4/4.4}
.stylist__media img{width:100%;height:100%;object-fit:cover;transition:transform .8s var(--ease)}
.stylist:hover .stylist__media img{transform:scale(1.05)}
.stylist__body{padding:22px 22px 24px}
.stylist__body h3{font-size:1.5rem;margin-bottom:4px}
.stylist__role{font-size:.68rem;letter-spacing:.2em;text-transform:uppercase;color:var(--terracotta);margin-bottom:12px}
.stylist__body p{font-size:.85rem;color:var(--muted);margin-bottom:14px}
.stylist__tags{display:flex;flex-wrap:wrap;gap:6px}
.tag{font-size:.66rem;letter-spacing:.06em;background:var(--beige);color:var(--muted);padding:4px 10px;border-radius:var(--radius-pill)}

/* ---------- before / after ---------- */
.ba{position:relative;border-radius:var(--radius-lg);overflow:hidden;aspect-ratio:4/3;background:var(--sand);box-shadow:var(--shadow-sm);touch-action:pan-y}
.ba img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.ba__after{clip-path:inset(0 0 0 50%)}
.ba__handle{position:absolute;top:0;bottom:0;left:50%;width:2px;background:#fff;transform:translateX(-1px);box-shadow:0 0 0 1px rgba(43,34,32,.12)}
.ba__handle::after{content:"";position:absolute;top:50%;left:50%;width:44px;height:44px;transform:translate(-50%,-50%);border-radius:50%;background:#fff;box-shadow:var(--shadow)}
.ba__handle::before{content:"‹ ›";position:absolute;top:50%;left:50%;transform:translate(-50%,-52%);color:var(--ink);font-size:.95rem;letter-spacing:2px;z-index:2}
.ba__label{position:absolute;bottom:14px;font-size:.62rem;letter-spacing:.2em;text-transform:uppercase;background:rgba(43,34,32,.7);color:#fff;padding:5px 11px;border-radius:var(--radius-pill);backdrop-filter:blur(4px)}
.ba__label--before{left:14px}.ba__label--after{right:14px}
.ba__range{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:ew-resize;z-index:3}

/* ---------- testimonials ---------- */
.testimonials{position:relative}
.testimonial-track{display:flex;gap:24px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding:4px 2px 8px;scroll-behavior:smooth}
.testimonial-track::-webkit-scrollbar{display:none}
.testimonial{scroll-snap-align:start;flex:0 0 86%;background:var(--white);border-radius:var(--radius-lg);padding:clamp(24px,4vw,38px);box-shadow:var(--shadow-sm);display:flex;flex-direction:column;gap:18px}
@media(min-width:700px){.testimonial{flex-basis:calc(50% - 12px)}}
@media(min-width:1080px){.testimonial{flex-basis:calc(33.333% - 16px)}}
.testimonial__quote{font-family:var(--serif);font-size:1.22rem;line-height:1.5;font-style:italic;margin:0;flex:1}
.testimonial__by{display:flex;align-items:center;gap:12px;padding-top:16px;border-top:1px solid var(--line)}
.testimonial__by img{width:44px;height:44px;border-radius:50%;object-fit:cover;flex:none}
.testimonial__by strong{display:block;font-weight:500;font-size:.9rem}
.testimonial__by span{font-size:.75rem;color:var(--muted)}
.slider-controls{display:flex;gap:10px;margin-top:24px}
.slider-btn{width:46px;height:46px;border-radius:50%;border:1px solid var(--line);background:transparent;color:var(--ink);display:grid;place-items:center;cursor:pointer;transition:background .2s,border-color .2s,color .2s}
.slider-btn svg{width:16px;height:16px}
.slider-btn:hover{background:var(--terracotta);border-color:var(--terracotta);color:#fff}

/* ---------- pricing ---------- */
.price-card{background:var(--white);border:1px solid var(--line);border-radius:var(--radius-lg);padding:clamp(24px,3vw,34px);display:flex;flex-direction:column;gap:14px;position:relative;transition:transform .3s var(--ease),box-shadow .3s}
.price-card:hover{transform:translateY(-3px);box-shadow:var(--shadow)}
.price-card--featured{background:var(--ink);color:var(--cream);border-color:var(--ink)}
.price-card--featured .price-card__price,.price-card--featured h3{color:#fff}
.price-card--featured p,.price-card--featured li{color:rgba(251,243,236,.75)}
.price-card__badge{position:absolute;top:16px;right:16px;font-size:.6rem;letter-spacing:.16em;text-transform:uppercase;background:var(--terracotta);color:#fff;padding:4px 10px;border-radius:var(--radius-pill)}
.price-card__price{font-family:var(--serif);font-size:2.7rem;line-height:1;color:var(--ink)}
.price-card__price small{font-family:var(--sans);font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.price-card ul{display:flex;flex-direction:column;gap:9px;font-size:.86rem;color:var(--muted);margin:6px 0 10px}
.price-card li{display:flex;gap:9px}
.price-card li svg{width:15px;height:15px;flex:none;color:var(--terracotta);margin-top:4px}
.price-card .btn{margin-top:auto}

/* ---------- instagram strip ---------- */
.ig-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
@media(min-width:760px){.ig-strip{grid-template-columns:repeat(6,1fr);gap:12px}}
.ig-strip a{position:relative;overflow:hidden;border-radius:12px;aspect-ratio:1;display:block}
.ig-strip img{width:100%;height:100%;object-fit:cover;transition:transform .7s var(--ease)}
.ig-strip a:hover img{transform:scale(1.08)}
.ig-strip a::after{content:"";position:absolute;inset:0;background:rgba(43,34,32,.16);opacity:0;transition:opacity .3s}
.ig-strip a:hover::after{opacity:1}

/* ---------- FAQ ---------- */
.faq{display:flex;flex-direction:column}
.faq details{border-bottom:1px solid var(--line)}
.faq summary{list-style:none;cursor:pointer;padding:20px 0;display:flex;align-items:center;justify-content:space-between;gap:18px;font-family:var(--serif);font-size:1.22rem;transition:color .2s}
.faq summary::-webkit-details-marker{display:none}
.faq summary:hover{color:var(--terracotta-dark)}
.faq summary .plus{width:26px;height:26px;flex:none;display:grid;place-items:center;border:1px solid var(--line);border-radius:50%;position:relative;transition:transform .3s,background .3s,border-color .3s}
.faq summary .plus::before,.faq summary .plus::after{content:"";position:absolute;background:var(--ink);width:10px;height:1px;transition:background .3s}
.faq summary .plus::after{transform:rotate(90deg)}
.faq details[open] summary .plus{background:var(--terracotta);border-color:var(--terracotta);transform:rotate(90deg)}
.faq details[open] summary .plus::before,.faq details[open] summary .plus::after{background:#fff}
.faq details[open] summary .plus::after{opacity:0}
.faq__answer{padding:0 0 22px;color:var(--muted);font-size:.92rem;max-width:70ch}

/* ---------- newsletter ---------- */
.newsletter{background:var(--beige);border-radius:var(--radius-lg);padding:clamp(28px,5vw,56px);display:grid;gap:24px;align-items:center}
@media(min-width:860px){.newsletter{grid-template-columns:1.1fr .9fr;gap:48px}}
.newsletter h2{font-size:clamp(1.8rem,3vw,2.6rem)}
.newsletter form{display:flex;flex-wrap:wrap;gap:10px}
.newsletter input{flex:1 1 200px}
.newsletter .form-note{font-size:.75rem;color:var(--muted);margin:10px 0 0}

/* ---------- footer ---------- */
.site-footer{background:var(--terracotta);color:#fff;margin-top:clamp(40px,6vw,80px);position:relative;overflow:hidden}
.site-footer::before{content:"";position:absolute;left:-140px;bottom:-220px;width:520px;height:520px;border-radius:50%;background:rgba(255,255,255,.06)}
.footer-top{display:grid;gap:36px;padding-block:clamp(48px,7vw,80px)}
@media(min-width:700px){.footer-top{grid-template-columns:1fr 1fr}}
@media(min-width:1000px){.footer-top{grid-template-columns:1.6fr 1fr 1fr 1.3fr;gap:40px}}
.footer-brand .brand{color:#fff;margin-bottom:14px}
.footer-brand .brand span{color:rgba(255,255,255,.7)}
.footer-brand p{font-size:.88rem;color:rgba(255,255,255,.82);max-width:30ch}
.socials{display:flex;gap:10px;margin-top:18px}
.socials a{width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.4);display:grid;place-items:center;transition:background .2s,border-color .2s,color .2s}
.socials svg{width:16px;height:16px;fill:currentColor}
.socials a:hover{background:#fff;color:var(--terracotta-dark);border-color:#fff}
.footer-col h4{font-family:var(--sans);font-size:.7rem;letter-spacing:.2em;text-transform:uppercase;font-weight:500;color:rgba(255,255,255,.72);margin:0 0 16px}
.footer-col li{margin-bottom:10px}
.footer-col a,.footer-col p{font-size:.87rem;color:rgba(255,255,255,.86);transition:color .2s}
.footer-col a:hover{color:#fff;text-decoration:underline;text-underline-offset:3px}
.footer-contact li{display:flex;gap:10px;font-size:.87rem;color:rgba(255,255,255,.86);margin-bottom:12px}
.footer-contact svg{width:15px;height:15px;flex:none;margin-top:5px;stroke:currentColor;fill:none;stroke-width:1.4}
.footer-bottom{border-top:1px solid rgba(255,255,255,.28);padding-block:20px;display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;align-items:center;font-size:.76rem;color:rgba(255,255,255,.75)}
.footer-bottom a:hover{color:#fff;text-decoration:underline}
.footer-bottom .legal{display:flex;gap:18px;flex-wrap:wrap}

/* ---------- forms ---------- */
.field{display:flex;flex-direction:column;gap:7px;margin-bottom:16px}
.field > label{font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);font-weight:400}
input,select,textarea{width:100%;background:var(--white);border:1px solid rgba(43,34,32,.18);border-radius:10px;padding:12px 14px;font-size:.94rem;font-weight:300;transition:border-color .2s,box-shadow .2s;min-height:46px;color:var(--ink)}
textarea{min-height:130px;resize:vertical;line-height:1.6}
input::placeholder,textarea::placeholder{color:#a3968f}
input:hover,select:hover,textarea:hover{border-color:rgba(43,34,32,.32)}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--terracotta);box-shadow:0 0 0 3px rgba(192,100,63,.14)}
input[aria-invalid="true"],select[aria-invalid="true"],textarea[aria-invalid="true"]{border-color:#B23B2E;box-shadow:0 0 0 3px rgba(178,59,46,.1)}
.field__hint{font-size:.74rem;color:var(--muted)}
.field__error{font-size:.74rem;color:#A3301F;display:none}
.field__error.is-visible{display:block}
.form-row{display:grid;gap:0 16px}
@media(min-width:560px){.form-row--2{grid-template-columns:1fr 1fr}}
.form-note{font-size:.75rem;color:var(--muted)}
.checkbox{display:flex;gap:10px;align-items:flex-start;font-size:.85rem;color:var(--muted);line-height:1.5}
.checkbox input{width:18px;height:18px;min-height:0;margin-top:3px;flex:none;accent-color:var(--terracotta)}
.form-card{background:var(--white);border-radius:var(--radius-lg);padding:clamp(24px,4vw,40px);box-shadow:var(--shadow-sm)}
.alert{padding:14px 16px;border-radius:10px;font-size:.88rem;margin-bottom:18px;border:1px solid transparent}
.alert--ok{background:#EDF6EF;border-color:#CBE3D1;color:#245B33}
.alert--err{background:#FBEDEA;border-color:#F0CDC5;color:#8E2A1C}
.alert--info{background:var(--beige);border-color:var(--sand);color:var(--ink)}

/* ---------- inner page hero ---------- */
.page-hero{padding-block:clamp(44px,6vw,72px) clamp(28px,4vw,40px);border-bottom:1px solid var(--line);background:linear-gradient(180deg,var(--beige),var(--cream))}
.page-hero h1{font-size:clamp(2.4rem,5.4vw,4rem);margin-bottom:14px}
.page-hero .lede{max-width:60ch}
.breadcrumb{font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:18px;display:flex;gap:8px;flex-wrap:wrap}
.breadcrumb a:hover{color:var(--terracotta)}

/* ---------- services page ---------- */
.service-category{margin-bottom:clamp(34px,5vw,56px)}
.service-category__head{display:flex;align-items:baseline;gap:14px;padding-bottom:14px;border-bottom:1px solid var(--line);margin-bottom:20px}
.service-category__head h2{font-size:clamp(1.7rem,3vw,2.3rem)}
.service-category__head span{font-size:.75rem;color:var(--muted)}
.service-row{display:grid;grid-template-columns:64px 1fr auto;gap:16px 18px;align-items:center;padding:20px 0;border-bottom:1px solid var(--line)}
.service-row img{width:64px;height:64px;border-radius:50%;object-fit:cover}
.service-row h3{font-size:1.35rem;margin-bottom:4px}
.service-row p{font-size:.85rem;color:var(--muted);margin:0;grid-column:2/-1;max-width:62ch}
.service-row__meta{display:flex;flex-direction:column;align-items:flex-end;gap:8px;text-align:right}
.service-row__price{font-family:var(--serif);font-size:1.5rem}
.service-row__dur{font-size:.72rem;color:var(--muted);letter-spacing:.08em;text-transform:uppercase}
@media(max-width:600px){.service-row{grid-template-columns:56px 1fr}.service-row img{width:56px;height:56px}.service-row__meta{align-items:flex-start;grid-column:2/-1;flex-direction:row;gap:14px;text-align:left}}

/* ---------- gallery ---------- */
.filter-bar{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:28px}
.filter-btn{background:transparent;border:1px solid var(--line);border-radius:var(--radius-pill);padding:9px 18px;font-size:.72rem;letter-spacing:.13em;text-transform:uppercase;cursor:pointer;min-height:40px;transition:background .2s,border-color .2s,color .2s}
.filter-btn:hover{border-color:var(--terracotta);color:var(--terracotta-dark)}
.filter-btn[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:var(--cream)}
.masonry{columns:1;column-gap:16px}
@media(min-width:600px){.masonry{columns:2}}
@media(min-width:960px){.masonry{columns:3}}
.masonry__item{break-inside:avoid;margin-bottom:16px;position:relative;border-radius:var(--radius);overflow:hidden;cursor:zoom-in;display:block;width:100%;padding:0;border:0;background:var(--sand)}
.masonry__item img{width:100%;transition:transform .7s var(--ease)}
.masonry__item:hover img{transform:scale(1.04)}
.masonry__cap{position:absolute;inset:auto 0 0 0;padding:26px 16px 12px;background:linear-gradient(transparent,rgba(43,34,32,.78));color:#fff;font-size:.78rem;text-align:left;opacity:0;transition:opacity .3s}
.masonry__item:hover .masonry__cap,.masonry__item:focus-visible .masonry__cap{opacity:1}
.lightbox{position:fixed;inset:0;z-index:120;background:rgba(24,18,16,.92);display:none;place-items:center;padding:24px}
.lightbox.is-open{display:grid;animation:fadeIn .2s}
.lightbox img{max-width:min(1000px,94vw);max-height:82vh;border-radius:14px;object-fit:contain}
.lightbox__cap{color:rgba(255,255,255,.85);text-align:center;font-size:.82rem;margin-top:14px}
.lightbox__close{position:absolute;top:18px;right:18px;width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.35);color:#fff;font-size:1.2rem;cursor:pointer}
.lightbox__nav{position:absolute;top:50%;transform:translateY(-50%);width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.35);color:#fff;cursor:pointer;display:grid;place-items:center}
.lightbox__nav--prev{left:12px}.lightbox__nav--next{right:12px}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}

/* ---------- blog ---------- */
.post-card{display:flex;flex-direction:column;background:var(--white);border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-sm);transition:transform .3s var(--ease),box-shadow .3s}
.post-card:hover{transform:translateY(-4px);box-shadow:var(--shadow)}
.post-card__media{aspect-ratio:16/10;overflow:hidden}
.post-card__media img{width:100%;height:100%;object-fit:cover;transition:transform .8s var(--ease)}
.post-card:hover .post-card__media img{transform:scale(1.05)}
.post-card__body{padding:22px;display:flex;flex-direction:column;gap:10px;flex:1}
.post-card__meta{font-size:.66rem;letter-spacing:.16em;text-transform:uppercase;color:var(--terracotta)}
.post-card h3{font-size:1.5rem;line-height:1.18}
.post-card p{font-size:.86rem;color:var(--muted);margin:0}
.post-card .link-arrow{margin-top:auto;align-self:flex-start;font-size:.68rem}
.article{max-width:760px;margin-inline:auto}
.article h1{font-size:clamp(2.2rem,4.6vw,3.4rem);margin-bottom:18px}
.article__meta{display:flex;gap:14px;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:26px}
.article__cover{border-radius:var(--radius-lg);margin-bottom:32px;aspect-ratio:16/9;object-fit:cover;width:100%}
.article__body{font-size:1.02rem;color:#463a36}
.article__body h2{font-size:clamp(1.6rem,2.6vw,2rem);margin:34px 0 12px}
.article__body p{margin-bottom:1.1em}
.article__body ul{list-style:disc;padding-left:22px;margin-bottom:1.1em}
.article__body li{margin-bottom:8px}

/* ---------- booking wizard ---------- */
.booking{display:grid;gap:32px;align-items:start}
@media(min-width:980px){.booking{grid-template-columns:1.55fr .95fr;gap:48px}}
.progress{display:flex;align-items:center;gap:6px;margin-bottom:30px;flex-wrap:nowrap;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}
.progress::-webkit-scrollbar{display:none}
.progress__step{display:flex;align-items:center;gap:8px;flex:none;font-size:.66rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);white-space:nowrap}
.progress__dot{width:26px;height:26px;border-radius:50%;border:1px solid var(--line);display:grid;place-items:center;font-size:.7rem;background:var(--white);transition:background .3s,color .3s,border-color .3s}
.progress__step.is-active{color:var(--ink)}
.progress__step.is-active .progress__dot{background:var(--terracotta);border-color:var(--terracotta);color:#fff}
.progress__step.is-done .progress__dot{background:var(--ink);border-color:var(--ink);color:#fff}
.progress__line{width:22px;height:1px;background:var(--line);flex:none}
@media(min-width:700px){.progress__step{font-size:.7rem}.progress__line{width:34px}}
.wizard-step{display:none}
.wizard-step.is-active{display:block;animation:stepIn .3s var(--ease)}
@keyframes stepIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.wizard-step h2{font-size:clamp(1.7rem,3vw,2.2rem);margin-bottom:8px}
.wizard-step > p{color:var(--muted);font-size:.9rem;margin-bottom:22px}
.option-list{display:flex;flex-direction:column;gap:10px}
.option{position:relative;display:flex;align-items:center;gap:14px;padding:14px;border:1px solid var(--line);border-radius:14px;background:var(--white);cursor:pointer;transition:border-color .2s,box-shadow .2s,transform .2s;text-align:left;width:100%}
.option img{width:52px;height:52px;border-radius:10px;object-fit:cover;flex:none}
.option:hover{border-color:rgba(192,100,63,.55);transform:translateY(-1px)}
.option[aria-pressed="true"]{border-color:var(--terracotta);box-shadow:0 0 0 3px rgba(192,100,63,.12)}
.option__body{flex:1;min-width:0}
.option__body strong{display:block;font-weight:500;font-size:.95rem}
.option__body span{font-size:.78rem;color:var(--muted);display:block}
.option__price{font-family:var(--serif);font-size:1.15rem;flex:none}
.option__check{width:22px;height:22px;border-radius:50%;border:1px solid var(--line);flex:none;display:grid;place-items:center;font-size:.65rem;color:transparent}
.option[aria-pressed="true"] .option__check{background:var(--terracotta);border-color:var(--terracotta);color:#fff}
.stylist-grid{display:grid;gap:12px;grid-template-columns:1fr 1fr}
@media(min-width:640px){.stylist-grid{grid-template-columns:repeat(3,1fr)}}
.stylist-pick{background:var(--white);border:1px solid var(--line);border-radius:14px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;cursor:pointer;transition:border-color .2s,box-shadow .2s}
.stylist-pick img{width:64px;height:64px;border-radius:50%;object-fit:cover}
.stylist-pick strong{font-weight:500;font-size:.86rem}
.stylist-pick span{font-size:.7rem;color:var(--muted);line-height:1.4}
.stylist-pick[aria-pressed="true"]{border-color:var(--terracotta);box-shadow:0 0 0 3px rgba(192,100,63,.12)}
.calendar{border:1px solid var(--line);border-radius:16px;padding:16px;background:var(--white)}
.calendar__head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.calendar__head strong{font-family:var(--serif);font-size:1.25rem;font-weight:500}
.calendar__grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.calendar__dow{font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);text-align:center;padding-bottom:6px}
.day{aspect-ratio:1;border:0;background:transparent;border-radius:50%;font-size:.84rem;cursor:pointer;display:grid;place-items:center;min-height:36px;transition:background .2s,color .2s;position:relative}
.day:hover:not(:disabled){background:var(--beige)}
.day:disabled{color:#c4b8b2;cursor:not-allowed}
.day.is-today{font-weight:500;text-decoration:underline;text-underline-offset:3px}
.day[aria-pressed="true"]{background:var(--ink);color:var(--cream)}
.day.is-full::after{content:"";position:absolute;bottom:5px;width:3px;height:3px;border-radius:50%;background:var(--terracotta)}
.slots{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:18px}
@media(min-width:480px){.slots{grid-template-columns:repeat(4,1fr)}}
.slot{border:1px solid var(--line);background:var(--white);border-radius:9px;padding:11px 4px;font-size:.84rem;cursor:pointer;min-height:44px;transition:background .2s,border-color .2s,color .2s}
.slot:hover{border-color:var(--terracotta);color:var(--terracotta-dark)}
.slot[aria-pressed="true"]{background:var(--terracotta);border-color:var(--terracotta);color:#fff}
.slot:disabled{color:#bdb0aa;background:#f7f1ec;cursor:not-allowed;text-decoration:line-through}
.slots-empty{font-size:.85rem;color:var(--muted);margin-top:16px;padding:14px;background:var(--beige);border-radius:10px}
.wizard-actions{display:flex;justify-content:space-between;gap:12px;margin-top:28px;flex-wrap:wrap-reverse}
.summary-card{background:var(--white);border:1px solid var(--line);border-radius:var(--radius-lg);padding:24px;position:sticky;top:calc(var(--header-h) + 20px)}
.summary-card h3{font-size:1.3rem;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--line)}
.summary-line{display:flex;justify-content:space-between;gap:12px;font-size:.86rem;padding-block:7px;color:var(--muted)}
.summary-line strong{color:var(--ink);font-weight:500;text-align:right}
.summary-total{display:flex;justify-content:space-between;align-items:baseline;margin-top:14px;padding-top:14px;border-top:1px solid var(--line);font-family:var(--serif);font-size:1.4rem}
.summary-total span{font-family:var(--sans);font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.review-block{background:var(--beige);border-radius:14px;padding:18px;margin-bottom:16px}
.review-block h3{font-family:var(--sans);font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:500;margin-bottom:8px}
.review-block p{font-size:.92rem;margin:0}
.confirmation{text-align:center;max-width:640px;margin-inline:auto}
.confirmation__icon{width:78px;height:78px;border-radius:50%;background:var(--terracotta-soft);color:var(--terracotta-dark);display:grid;place-items:center;margin:0 auto 22px}
.confirmation__icon svg{width:34px;height:34px;stroke:currentColor;fill:none;stroke-width:1.5}
.confirmation h2{font-size:clamp(2rem,4vw,2.9rem);margin-bottom:12px}
.ref-pill{display:inline-flex;align-items:center;gap:10px;background:var(--white);border:1px dashed var(--terracotta);border-radius:var(--radius-pill);padding:9px 18px;font-size:.9rem;letter-spacing:.12em;margin:8px 0 22px}
.confirmation__actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}

/* ---------- account / auth ---------- */
.auth-shell{max-width:460px;margin-inline:auto;padding-block:clamp(40px,6vw,72px)}
.auth-shell h1{font-size:clamp(2rem,4vw,2.8rem);margin-bottom:8px}
.auth-shell .lede{font-size:.92rem;margin-bottom:26px}
.auth-alt{font-size:.85rem;color:var(--muted);text-align:center;margin-top:20px}
.account-grid{display:grid;gap:24px}
@media(min-width:900px){.account-grid{grid-template-columns:1.5fr .9fr;gap:40px}}
.appt-card{display:flex;flex-wrap:wrap;gap:16px;align-items:center;background:var(--white);border:1px solid var(--line);border-radius:var(--radius);padding:18px;margin-bottom:12px}
.appt-card__date{background:var(--beige);border-radius:12px;padding:10px 14px;text-align:center;min-width:76px}
.appt-card__date b{display:block;font-family:var(--serif);font-size:1.5rem;font-weight:500;line-height:1}
.appt-card__date span{font-size:.64rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.appt-card__body{flex:1;min-width:180px}
.appt-card__body h3{font-size:1.15rem;font-family:var(--sans);font-weight:500}
.appt-card__body p{font-size:.8rem;color:var(--muted);margin:0}
.appt-card__actions{display:flex;gap:8px;flex-wrap:wrap}
.badge-status{font-size:.62rem;letter-spacing:.13em;text-transform:uppercase;padding:4px 10px;border-radius:var(--radius-pill);display:inline-block;margin-top:6px}
.badge-status--confirmed{background:#E7F3E9;color:#276B38}
.badge-status--pending{background:#FBF1DC;color:#8A6416}
.badge-status--cancelled{background:#F7E4E0;color:#9A3222}
.badge-status--completed{background:#EDE9F5;color:#514089}
.loyalty{background:var(--ink);color:var(--cream);border-radius:var(--radius-lg);padding:26px;position:relative;overflow:hidden}
.loyalty::after{content:"";position:absolute;right:-40px;top:-40px;width:160px;height:160px;border-radius:50%;background:rgba(192,100,63,.35)}
.loyalty h3{color:#fff;font-size:1.5rem;margin-bottom:6px}
.loyalty p{font-size:.82rem;color:rgba(251,243,236,.7);margin-bottom:16px}
.loyalty__points{font-family:var(--serif);font-size:3rem;line-height:1;color:#fff}
.loyalty__points small{font-family:var(--sans);font-size:.66rem;letter-spacing:.16em;text-transform:uppercase;color:rgba(251,243,236,.65)}
.progress-bar{height:6px;background:rgba(255,255,255,.18);border-radius:99px;overflow:hidden;margin-top:16px}
.progress-bar i{display:block;height:100%;background:var(--terracotta);border-radius:99px}

/* ---------- admin ---------- */
.admin-shell{display:grid;gap:24px}
@media(min-width:1000px){.admin-shell{grid-template-columns:230px 1fr;gap:36px;align-items:start}}
.admin-nav{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;border-bottom:1px solid var(--line)}
.admin-nav::-webkit-scrollbar{display:none}
@media(min-width:1000px){.admin-nav{flex-direction:column;border-bottom:0;border-right:1px solid var(--line);padding-right:16px;overflow:visible;position:sticky;top:calc(var(--header-h) + 16px)}}
.admin-nav button{flex:none;text-align:left;background:transparent;border:0;border-radius:10px;padding:11px 14px;font-size:.78rem;letter-spacing:.06em;cursor:pointer;color:var(--muted);white-space:nowrap;min-height:42px}
.admin-nav button:hover{background:var(--beige);color:var(--ink)}
.admin-nav button[aria-selected="true"]{background:var(--ink);color:var(--cream)}
.admin-panel{display:none}
.admin-panel.is-active{display:block}
.stat-grid{display:grid;gap:14px;grid-template-columns:1fr 1fr}
@media(min-width:800px){.stat-grid{grid-template-columns:repeat(4,1fr)}}
.stat{background:var(--white);border:1px solid var(--line);border-radius:var(--radius);padding:18px}
.stat span{font-size:.66rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:6px}
.stat b{font-family:var(--serif);font-size:2rem;font-weight:500;line-height:1}
.stat small{font-size:.72rem;color:var(--muted);display:block;margin-top:6px}
.table-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:var(--radius);background:var(--white)}
table{width:100%;border-collapse:collapse;font-size:.84rem;min-width:620px}
th{text-align:left;font-size:.64rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);font-weight:500;padding:12px 14px;border-bottom:1px solid var(--line);white-space:nowrap;background:var(--cream)}
td{padding:12px 14px;border-bottom:1px solid var(--line);vertical-align:middle}
tbody tr:last-child td{border-bottom:0}
tbody tr:hover{background:rgba(243,227,214,.35)}
.row-actions{display:flex;gap:6px;flex-wrap:wrap}
.mini-btn{border:1px solid var(--line);background:var(--white);border-radius:7px;padding:5px 9px;font-size:.7rem;cursor:pointer;min-height:30px;transition:background .2s,border-color .2s}
.mini-btn:hover{background:var(--beige);border-color:var(--sand)}
.mini-btn--danger{color:#9A3222}
.mini-btn--danger:hover{background:#FBEDEA}
.admin-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:16px}
.admin-toolbar h2{font-size:1.7rem}
.admin-toolbar__actions{display:flex;gap:8px;flex-wrap:wrap}
.admin-form{background:var(--white);border:1px solid var(--line);border-radius:var(--radius);padding:20px;margin-bottom:20px}
.admin-form h3{font-size:1.2rem;margin-bottom:16px}
.admin-form .grid{display:grid;gap:0 14px}
@media(min-width:640px){.admin-form .grid--2{grid-template-columns:1fr 1fr}.admin-form .grid--3{grid-template-columns:repeat(3,1fr)}}
.empty{padding:34px;text-align:center;color:var(--muted);font-size:.88rem;background:var(--white);border:1px dashed var(--line);border-radius:var(--radius)}

/* ---------- gift cards ---------- */
.gift-grid{display:grid;gap:28px}
@media(min-width:920px){.gift-grid{grid-template-columns:1.1fr .9fr;gap:48px}}
.amount-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:20px}
.amount{border:1px solid var(--line);background:var(--white);border-radius:10px;padding:14px 6px;font-family:var(--serif);font-size:1.3rem;cursor:pointer;min-height:52px;transition:background .2s,color .2s,border-color .2s}
.amount:hover{border-color:var(--terracotta)}
.amount[aria-pressed="true"]{background:var(--terracotta);border-color:var(--terracotta);color:#fff}
.gift-preview{background:linear-gradient(140deg,var(--terracotta),#D89B77 55%,var(--sand));border-radius:var(--radius-lg);padding:32px;color:#fff;aspect-ratio:1.6/1;display:flex;flex-direction:column;justify-content:space-between;box-shadow:var(--shadow);position:relative;overflow:hidden}
.gift-preview::after{content:"";position:absolute;right:-60px;bottom:-70px;width:220px;height:220px;border-radius:50%;border:1px solid rgba(255,255,255,.4)}
.gift-preview .brand{color:#fff}
.gift-preview .brand span{color:rgba(255,255,255,.75)}
.gift-preview__amount{font-family:var(--serif);font-size:3rem;line-height:1}
.gift-preview__to{font-size:.82rem;color:rgba(255,255,255,.9)}

/* ---------- contact ---------- */
.contact-grid{display:grid;gap:32px}
@media(min-width:920px){.contact-grid{grid-template-columns:1fr 1fr;gap:48px}}
.contact-list{display:flex;flex-direction:column;gap:0;margin:0}
.contact-list li{display:flex;gap:14px;padding:18px 0;border-bottom:1px solid var(--line)}
.contact-list svg{width:20px;height:20px;flex:none;stroke:var(--terracotta);fill:none;stroke-width:1.4;margin-top:3px}
.contact-list strong{display:block;font-weight:500;font-size:.9rem;margin-bottom:2px}
.contact-list span,.contact-list a{font-size:.88rem;color:var(--muted)}
.map{width:100%;aspect-ratio:16/10;border:0;border-radius:var(--radius-lg);background:var(--beige);filter:saturate(.85)}
.hours-list li{display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px dashed var(--line);font-size:.88rem}
.hours-list li:last-child{border-bottom:0}
.hours-list .today{color:var(--terracotta-dark);font-weight:500}

/* ---------- toast / skeleton / misc ---------- */
.toast-stack{position:fixed;bottom:20px;right:16px;left:16px;z-index:150;display:flex;flex-direction:column;gap:8px;align-items:flex-end;pointer-events:none}
@media(min-width:600px){.toast-stack{left:auto;width:360px}}
.toast{background:var(--ink);color:var(--cream);border-radius:12px;padding:13px 18px;font-size:.86rem;box-shadow:var(--shadow);animation:toastIn .25s var(--ease);max-width:100%;pointer-events:auto;border-left:3px solid var(--terracotta)}
.toast--ok{border-left-color:#6FBF86}
.toast--err{border-left-color:#E4775E}
@keyframes toastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.skeleton{background:linear-gradient(90deg,var(--beige) 25%,#f8ece3 37%,var(--beige) 63%);background-size:400% 100%;animation:shimmer 1.4s infinite;border-radius:10px}
@keyframes shimmer{0%{background-position:100% 50%}100%{background-position:0 50%}}
.reveal{opacity:0;transform:translateY(22px);transition:opacity .7s var(--ease),transform .7s var(--ease)}
.reveal.is-visible{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *,*::before,*::after{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important}
  .reveal{opacity:1;transform:none}
}
.cookie-banner{position:fixed;left:12px;right:12px;bottom:12px;z-index:140;background:var(--ink);color:var(--cream);border-radius:14px;padding:16px 18px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;box-shadow:var(--shadow);font-size:.8rem;max-width:620px}
@media(min-width:760px){.cookie-banner{left:auto;right:24px;bottom:24px}}
.cookie-banner p{margin:0;color:rgba(251,243,236,.85)}
.cookie-banner a{color:#fff;text-decoration:underline}
.cookie-banner .btn{padding:9px 16px;font-size:.66rem;min-height:38px}
.floating-call{position:fixed;right:14px;bottom:14px;z-index:90;display:flex;gap:8px}
.floating-call a{width:50px;height:50px;border-radius:50%;background:var(--terracotta);color:#fff;display:grid;place-items:center;box-shadow:0 12px 26px -10px rgba(168,81,47,.9);transition:transform .2s,background .2s}
.floating-call a:hover{transform:translateY(-2px);background:var(--terracotta-dark)}
.floating-call svg{width:21px;height:21px;fill:currentColor}
@media(min-width:1000px){.floating-call{display:none}}
.note-card{background:var(--beige);border-radius:var(--radius);padding:22px;font-size:.88rem;color:var(--muted)}
.note-card strong{color:var(--ink);font-weight:500}
.quote-large{font-family:var(--serif);font-size:clamp(1.6rem,3vw,2.4rem);font-style:italic;line-height:1.35;max-width:24ch}
.split{display:grid;gap:32px;align-items:center}
@media(min-width:900px){.split{grid-template-columns:1fr 1fr;gap:clamp(36px,6vw,72px)}}
.split img{border-radius:var(--radius-lg);width:100%;aspect-ratio:4/3.2;object-fit:cover}
.value-card{background:var(--white);border-radius:var(--radius);padding:24px;border:1px solid var(--line)}
.value-card h3{font-size:1.3rem;margin-bottom:8px}
.value-card p{font-size:.86rem;color:var(--muted);margin:0}
.value-card__num{font-family:var(--serif);color:var(--terracotta);font-size:1.1rem;display:block;margin-bottom:10px}
.team-strip{display:grid;gap:16px;grid-template-columns:1fr 1fr}
@media(min-width:900px){.team-strip{grid-template-columns:repeat(4,1fr)}}
.team-strip img{border-radius:120px 120px 14px 14px;aspect-ratio:3/4;object-fit:cover;width:100%}
.team-strip h3{font-size:1.25rem;margin-top:14px}
.team-strip p{font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--terracotta);margin:2px 0 0}
.timeline{display:grid;gap:0;border-left:1px solid var(--line);padding-left:26px;margin-top:8px}
.timeline__item{position:relative;padding-bottom:26px}
.timeline__item::before{content:"";position:absolute;left:-31px;top:6px;width:9px;height:9px;border-radius:50%;background:var(--terracotta)}
.timeline__item h3{font-size:1.25rem;margin-bottom:6px}
.timeline__item p{font-size:.88rem;color:var(--muted);margin:0}
.hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px}
.tab{border:1px solid var(--line);background:transparent;border-radius:var(--radius-pill);padding:9px 18px;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;min-height:40px}
.tab[aria-selected="true"]{background:var(--ink);color:var(--cream);border-color:var(--ink)}
.error-page{text-align:center;padding-block:clamp(60px,10vw,120px);max-width:560px;margin-inline:auto}
.error-page .code{font-family:var(--serif);font-size:clamp(5rem,14vw,9rem);line-height:.9;color:var(--terracotta);opacity:.35}
.error-page h1{font-size:clamp(2rem,4vw,2.8rem);margin:10px 0 12px}
`;
