import{n as e}from"./chunk-Bh1tDfsg.js";import{n as t,r as n,t as r}from"./supabaseClient-gKPx6it_.js";import{wt as i}from"./index-BcbesHco.js";var a=e(n(),1),o=t(),s=({pageKey:e})=>{let{lang:t,t:n}=i(),[s,c]=(0,a.useState)(null),[l,u]=(0,a.useState)(!0);return(0,a.useEffect)(()=>{(async()=>{u(!0);try{let{data:t,error:n}=await r.from(`pages_content`).select(`*`).eq(`key`,e).single();t&&c(t)}catch(e){console.error(`Error fetching static content`,e)}finally{u(!1)}})()},[e]),l?(0,o.jsxs)(`div`,{className:`container`,style:{padding:`3rem 0`,display:`flex`,flexDirection:`column`,gap:`1.5rem`},children:[(0,o.jsx)(`div`,{className:`skeleton`,style:{height:`35px`,width:`300px`}}),(0,o.jsx)(`div`,{className:`skeleton`,style:{height:`20px`,width:`100%`}}),(0,o.jsx)(`div`,{className:`skeleton`,style:{height:`120px`,width:`100%`}})]}):s?(0,o.jsxs)(`div`,{className:`container animate-fade-in`,style:{padding:`3rem 0`,maxWidth:`800px`,display:`flex`,flexDirection:`column`,gap:`1.5rem`},children:[(0,o.jsx)(`div`,{style:{borderBottom:`2px solid var(--border-color)`,paddingBottom:`0.8rem`},children:(0,o.jsx)(`h1`,{style:{fontSize:`1.75rem`,fontWeight:800,color:`var(--primary)`},children:t===`ar`?s.title_ar:s.title_en})}),(0,o.jsx)(`div`,{style:{lineHeight:1.8,fontSize:`1rem`,display:`flex`,flexDirection:`column`,gap:`1.25rem`},className:`static-content-rich`,dangerouslySetInnerHTML:{__html:t===`ar`?s.content_ar:s.content_en}}),(0,o.jsx)(`style`,{children:`
        .static-content-rich h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--primary);
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .static-content-rich p {
          color: var(--text-muted);
          margin-bottom: 0.8rem;
        }
      `})]}):(0,o.jsxs)(`div`,{className:`container`,style:{padding:`4rem 1.5rem`,textAlign:`center`},children:[(0,o.jsx)(`h2`,{children:`عذراً، لم يتم العثور على هذه الصفحة.`}),(0,o.jsx)(`p`,{style:{color:`var(--text-muted)`},children:`Page content not loaded.`})]})};export{s as StaticPages,s as default};