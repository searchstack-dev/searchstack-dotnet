/**
 * Styles for the Ask overlay, injected once.
 *
 * Every colour is a CSS variable with a neutral default. The package must look
 * unbranded out of the box — searchstack.dev supplies its own accent from the
 * page, and so will every site that embeds this. Hard-coding our orange here
 * would make the widget unsellable without a fork.
 *
 * Both colour schemes are handled: `prefers-color-scheme` as the default signal,
 * plus an explicit `.dark` / `[data-theme="dark"]` ancestor so a site with its
 * own theme toggle wins over the OS setting.
 */
const askStyles = (): string => `
.searchstack-ask-backdrop{
    position:fixed; inset:0; z-index:var(--searchstack-ask-z, 2000);
    display:flex; align-items:flex-start; justify-content:center;
    padding:max(3rem, 6vh) 1rem 1rem;
    background:var(--searchstack-ask-backdrop-color, rgba(15,23,42,.55));
    -webkit-backdrop-filter:blur(3px); backdrop-filter:blur(3px);
    opacity:0; transition:opacity .14s ease;
}
.searchstack-ask-backdrop.searchstack-ask-open{ opacity:1; }

.searchstack-ask-card{
    display:flex; flex-direction:column;
    width:100%; max-width:var(--searchstack-ask-width, 46rem);
    max-height:var(--searchstack-ask-max-height, 82vh);
    background:var(--searchstack-ask-background-color, #fff);
    color:var(--searchstack-ask-text-color, #1f2937);
    border:1px solid var(--searchstack-ask-border-color, #e5e7eb);
    border-radius:var(--searchstack-ask-border-radius, 14px);
    box-shadow:0 24px 60px rgba(2,6,23,.28);
    overflow:hidden;
    transform:translateY(-6px); transition:transform .14s ease;
}
.searchstack-ask-backdrop.searchstack-ask-open .searchstack-ask-card{ transform:none; }

@media (prefers-reduced-motion: reduce){
    .searchstack-ask-backdrop,
    .searchstack-ask-card{ transition:none; }
}

/* ---- header ---- */
.searchstack-ask-head{
    display:flex; align-items:center; gap:.6rem;
    padding:.85rem 1rem; border-bottom:1px solid var(--searchstack-ask-border-color, #e5e7eb);
}
.searchstack-ask-head svg{ flex:0 0 auto; color:var(--searchstack-ask-accent-color, #6366f1); }
.searchstack-ask-input{
    flex:1 1 auto; min-width:0;
    border:0; outline:0; background:transparent;
    font-size:1rem; font-family:inherit;
    color:var(--searchstack-ask-text-color, #1f2937);
}
.searchstack-ask-input::placeholder{ color:var(--searchstack-ask-muted-color, #8a94a6); }
.searchstack-ask-close{
    flex:0 0 auto; border:0; background:transparent; cursor:pointer;
    padding:.25rem .45rem; border-radius:7px; line-height:1;
    color:var(--searchstack-ask-muted-color, #8a94a6);
    font-size:.7rem; font-weight:600; letter-spacing:.03em;
}
.searchstack-ask-close:hover{ background:var(--searchstack-ask-hover-color, rgba(99,102,241,.10)); }

/* ---- body ---- */
.searchstack-ask-body{ overflow-y:auto; padding:1rem 1.15rem 1.15rem; }

.searchstack-ask-status{
    display:flex; align-items:center; gap:.5rem;
    font-size:.8rem; color:var(--searchstack-ask-muted-color, #8a94a6);
    margin-bottom:.7rem;
}
.searchstack-ask-dot{
    width:.5rem; height:.5rem; border-radius:50%;
    background:var(--searchstack-ask-accent-color, #6366f1);
    animation:searchstack-ask-pulse 1s ease-in-out infinite;
}
@keyframes searchstack-ask-pulse{ 0%,100%{opacity:.25} 50%{opacity:1} }
@media (prefers-reduced-motion: reduce){ .searchstack-ask-dot{ animation:none; opacity:.7 } }

.searchstack-ask-answer{ font-size:.95rem; line-height:1.62; }
.searchstack-ask-answer p{ margin:0 0 .8rem; }
.searchstack-ask-answer p:last-child{ margin-bottom:0; }
.searchstack-ask-h{ font-weight:700; font-size:.95rem; margin:.2rem 0 .5rem; }
.searchstack-ask-answer code{
    font-size:.86em; padding:.05rem .28rem; border-radius:4px;
    background:var(--searchstack-ask-hover-color, rgba(99,102,241,.12));
}

/* A citation is a real link, never decoration — it is the reader's route back to
   the sentence's source, and the only reason to trust the answer at all. */
.searchstack-ask-cite{
    display:inline-block; vertical-align:super;
    margin-left:.1rem; padding:0 .3rem;
    font-size:.62rem; font-weight:700; line-height:1.5;
    text-decoration:none; border-radius:5px;
    color:var(--searchstack-ask-accent-color, #6366f1);
    background:var(--searchstack-ask-hover-color, rgba(99,102,241,.12));
}
.searchstack-ask-cite:hover{ background:var(--searchstack-ask-accent-color, #6366f1); color:#fff; }

.searchstack-ask-caret{
    display:inline-block; width:.45rem; height:1em;
    vertical-align:-.15em; margin-left:.1rem;
    background:var(--searchstack-ask-accent-color, #6366f1);
    animation:searchstack-ask-blink .9s steps(2,start) infinite;
}
@keyframes searchstack-ask-blink{ 0%,100%{opacity:1} 50%{opacity:0} }
@media (prefers-reduced-motion: reduce){ .searchstack-ask-caret{ animation:none } }

/* ---- source blocks ---- */
.searchstack-ask-section{ margin-top:1.15rem; }
.searchstack-ask-label{
    font-size:.68rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase;
    color:var(--searchstack-ask-muted-color, #8a94a6); margin-bottom:.45rem;
}
.searchstack-ask-source{
    display:flex; gap:.55rem; align-items:baseline;
    padding:.45rem .55rem; border-radius:8px;
    text-decoration:none; color:inherit;
}
.searchstack-ask-source:hover{ background:var(--searchstack-ask-hover-color, rgba(99,102,241,.10)); }
/* Arrow keys walk this list, so a focused source needs to look selected. Without it
   the highlight is invisible and the reader cannot tell where Enter will take them. */
.searchstack-ask-source:focus,
.searchstack-ask-source:focus-visible{
    background:var(--searchstack-ask-selected-color, rgba(99,102,241,.20));
    outline:var(--searchstack-ask-source-outline, 0);
}
.searchstack-ask-source-marker{
    flex:0 0 auto; font-size:.62rem; font-weight:700;
    color:var(--searchstack-ask-accent-color, #6366f1);
}
.searchstack-ask-source-text{ min-width:0; display:flex; flex-direction:column; line-height:1.3; }
.searchstack-ask-source-title{
    font-size:.83rem; font-weight:600;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.searchstack-ask-source-crumb{
    font-size:.7rem; color:var(--searchstack-ask-muted-color, #8a94a6);
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}

/* ---- footer ---- */
.searchstack-ask-foot{
    display:flex; align-items:center; gap:.5rem;
    padding:.6rem 1.15rem; border-top:1px solid var(--searchstack-ask-border-color, #e5e7eb);
    font-size:.72rem; color:var(--searchstack-ask-muted-color, #8a94a6);
}
.searchstack-ask-rate{
    border:1px solid var(--searchstack-ask-border-color, #e5e7eb);
    background:transparent; cursor:pointer;
    border-radius:6px; padding:.15rem .4rem; line-height:1;
    color:var(--searchstack-ask-muted-color, #8a94a6);
}
.searchstack-ask-rate:hover{ background:var(--searchstack-ask-hover-color, rgba(99,102,241,.10)); }
.searchstack-ask-rate[aria-pressed="true"]{
    border-color:var(--searchstack-ask-accent-color, #6366f1);
    color:var(--searchstack-ask-accent-color, #6366f1);
}
.searchstack-ask-spacer{ flex:1 1 auto; }

/* ---- the row pinned under the suggestions ---- */
.searchstack-ask-row{
    display:flex; align-items:center; gap:.5rem;
    padding:.55rem .75rem; cursor:pointer;
    border-top:1px solid var(--searchstack-ask-border-color, #e5e7eb);
    font-size:.8rem; font-weight:600;
    color:var(--searchstack-ask-accent-color, #6366f1);
}
.searchstack-ask-row:hover{ background:var(--searchstack-ask-hover-color, rgba(99,102,241,.10)); }
/* Selected by arrow key, or pre-selected by a trailing "?". Stronger than hover so
   it reads as "Enter does this" rather than "the mouse is here". */
.searchstack-ask-row-focused,
.searchstack-ask-row:focus{
    background:var(--searchstack-ask-selected-color, rgba(99,102,241,.20));
    outline:var(--searchstack-ask-row-outline, 0);
}
.searchstack-ask-row-query{
    font-weight:400; color:var(--searchstack-ask-muted-color, #8a94a6);
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0;
}
.searchstack-ask-row-key{
    margin-left:auto; flex:0 0 auto; font-weight:600; font-size:.65rem;
    border:1px solid var(--searchstack-ask-border-color, #e5e7eb);
    border-radius:4px; padding:.05rem .25rem;
    color:var(--searchstack-ask-muted-color, #8a94a6);
}

@media (prefers-color-scheme: dark){
    .searchstack-ask-card{
        --searchstack-ask-background-color:#1c2530;
        --searchstack-ask-text-color:#e5e7eb;
        --searchstack-ask-border-color:#374151;
        --searchstack-ask-muted-color:#9aa4b2;
    }
}
.dark .searchstack-ask-card,
[data-theme="dark"] .searchstack-ask-card{
    --searchstack-ask-background-color:#1c2530;
    --searchstack-ask-text-color:#e5e7eb;
    --searchstack-ask-border-color:#374151;
    --searchstack-ask-muted-color:#9aa4b2;
}
`;

export default askStyles;
