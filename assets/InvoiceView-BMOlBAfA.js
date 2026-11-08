const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./html2canvas-BzFc_22V.js","./chunk-Bh1tDfsg.js","./jspdf.es.min-C4ZnP_8s.js","./preload-helper-kNaey6uv.js","./typeof-B5XbjTb1.js"])))=>i.map(i=>d[i]);
import{n as e}from"./chunk-Bh1tDfsg.js";import{n as t,r as n}from"./supabaseClient-gKPx6it_.js";import{t as r}from"./preload-helper-kNaey6uv.js";import{t as i}from"./download-Dyq8wyyi.js";import{t as a}from"./loader-circle-DYouf_6M.js";import{t as o}from"./package-Ba6ztQ3Y.js";import{Et as s,P as c,Q as l,St as u,bt as d,j as f,jt as p,v as m}from"./index-COHjsUnm.js";import{i as h}from"./burHolderInventoryEngine-BAIlXWcf.js";var g=l(`building`,[[`path`,{d:`M12 10h.01`,key:`1nrarc`}],[`path`,{d:`M12 14h.01`,key:`1etili`}],[`path`,{d:`M12 6h.01`,key:`1vi96p`}],[`path`,{d:`M16 10h.01`,key:`1m94wz`}],[`path`,{d:`M16 14h.01`,key:`1gbofw`}],[`path`,{d:`M16 6h.01`,key:`1x0f13`}],[`path`,{d:`M8 10h.01`,key:`19clt8`}],[`path`,{d:`M8 14h.01`,key:`6423bh`}],[`path`,{d:`M8 6h.01`,key:`1dz90k`}],[`path`,{d:`M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3`,key:`cabbwy`}],[`rect`,{x:`4`,y:`2`,width:`16`,height:`20`,rx:`2`,key:`1uxh74`}]]),_=l(`printer`,[[`path`,{d:`M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2`,key:`143wyd`}],[`path`,{d:`M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6`,key:`1itne7`}],[`rect`,{x:`6`,y:`14`,width:`12`,height:`8`,rx:`1`,key:`1ue0tg`}]]),v=e(n(),1);function y(e){return e?(e.order_items&&e.order_items.length>0?e.order_items:Array.isArray(e.items)?e.items:[]).map((t,n)=>{let r=Array.isArray(e.items)&&(e.items.find(e=>e.id&&t.product_id&&String(e.id)===String(t.product_id)||e.productId&&t.product_id&&String(e.productId)===String(t.product_id)||e.id&&t.id&&String(e.id)===String(t.id))||e.items[n])||null,i=t.product_id||t.productId||t.products?.id||t.id||r?.id||`prod_${n}`,a=t.products?.name_ar||t.name_ar||r?.name_ar||t.products?.name_en||t.name_en||r?.name_en||`أداة طب أسنان`,o=t.products?.name_en||t.name_en||r?.name_en||t.products?.name_ar||t.name_ar||r?.name_ar||`Dental Instrument`,c=parseFloat(t.price??r?.price??t.products?.price??0)||0,l=Math.max(1,parseInt(t.quantity??t.qty??r?.quantity??1)||1),u=t.products?.main_image_url||t.products?.image_url||t.image_url||r?.image_url||``,f=t.selling_unit||t.sellingUnit||r?.selling_unit||r?.sellingUnit||null,p=!!(t.is_bundle||r?.is_bundle||s(t.bundle_id||r?.bundle_id||i)),m=p?d(t.bundle_id||r?.bundle_id||i):null,h=t.bundle_components||r?.bundle_components||m?.components||null;return{lineItemId:`line_${n}_${i}`,index:n,productId:i,nameAr:a,nameEn:o,price:c,quantity:l,lineTotal:c*l,imageUrl:u,sellingUnit:f,isBundle:p,bundleComponents:h}}):[]}function b(e){if(!e||e.length===0)return[{pageNumber:1,totalPages:1,items:[],isFirstPage:!0,isLastPage:!0}];if(e.length<=8)return[{pageNumber:1,totalPages:1,items:[...e],isFirstPage:!0,isLastPage:!0}];let t=[],n=[...e],r=n.slice(0,7);for(n=n.slice(7),t.push({pageNumber:1,items:r,isFirstPage:!0,isLastPage:!1});n.length>0;)if(n.length<=10)t.push({pageNumber:t.length+1,items:n,isFirstPage:!1,isLastPage:!0}),n=[];else{let e=n.slice(0,13);n=n.slice(13),t.push({pageNumber:t.length+1,items:e,isFirstPage:!1,isLastPage:n.length===0})}let i=t.length;t.forEach(e=>{e.totalPages=i});let a=t.reduce((e,t)=>e+t.items.length,0);return a!==e.length&&console.error(`[Invoice Pagination Error] Item count mismatch! Expected ${e.length}, got ${a}`),t}var x=t(),S=({order:t})=>{let{lang:n,t:s,isRtl:l}=p(),[d,S]=(0,v.useState)(!1);if(!t)return null;let C=t.order_number?.replace(/\D/g,``)||t.order_number||`Order`,w=`Absolute_Dental_Invoice_${C}.pdf`,T=(0,v.useMemo)(()=>y(t),[t]),E=(0,v.useMemo)(()=>b(T),[T]),D=()=>{let e=document.title;document.title=`Absolute_Dental_Invoice_${C}`,window.print(),setTimeout(()=>{document.title=e},1500)},O=async()=>{let t=document.querySelectorAll(`.invoice-page-sheet`);if(!t||t.length===0)return;S(!0);let n=document.title;document.title=`Absolute_Dental_Invoice_${C}`;try{let[{default:n},{jsPDF:i}]=await Promise.all([r(()=>import(`./html2canvas-BzFc_22V.js`).then(t=>e(t.default,1)),__vite__mapDeps([0,1]),import.meta.url),r(()=>import(`./jspdf.es.min-C4ZnP_8s.js`),__vite__mapDeps([2,1,3,4]),import.meta.url)]),a=new i({orientation:`portrait`,unit:`mm`,format:`a4`}),o=a.internal.pageSize.getWidth(),s=a.internal.pageSize.getHeight(),c=o-20,l=s-20;for(let e=0;e<t.length;e++){e>0&&a.addPage();let r=await n(t[e],{scale:2,useCORS:!0,allowTaint:!0,backgroundColor:`#ffffff`,logging:!1,imageTimeout:5e3,ignoreElements:e=>e.classList?.contains(`no-print`)}),i=r.toDataURL(`image/jpeg`,.96),o=r.height*c/r.width,s=Math.min(o,l);a.addImage(i,`JPEG`,10,10,c,s,void 0,`FAST`)}a.save(w)}catch(e){console.warn(`html2canvas/jsPDF export notice, triggering native browser PDF dialog:`,e),D()}finally{setTimeout(()=>{document.title=n},1500),S(!1)}},k=e=>{try{return new Date(e).toLocaleDateString(n===`ar`?`ar-LY`:`en-US`,{year:`numeric`,month:`long`,day:`numeric`,hour:`2-digit`,minute:`2-digit`})}catch{return e}};return(0,x.jsxs)(`div`,{style:{maxWidth:`820px`,margin:`2rem auto`,padding:`1rem`},className:`invoice-container`,children:[(0,x.jsxs)(`div`,{className:`no-print`,style:{display:`flex`,justifyContent:`flex-end`,gap:`0.75rem`,marginBottom:`1.25rem`,flexWrap:`wrap`},children:[(0,x.jsxs)(`button`,{onClick:O,disabled:d,className:`btn btn-secondary`,style:{padding:`0.65rem 1.35rem`,gap:`0.5rem`,fontWeight:800,display:`flex`,alignItems:`center`},title:n===`ar`?`حفظ كـ ملف PDF على جهازك`:`Save PDF to device`,children:[d?(0,x.jsx)(a,{size:16,className:`animate-spin`}):(0,x.jsx)(i,{size:16}),(0,x.jsx)(`span`,{children:d?n===`ar`?`جاري تجهيز PDF...`:`Generating PDF...`:n===`ar`?`حفظ كـ PDF`:`Save as PDF`})]}),(0,x.jsxs)(`button`,{onClick:D,className:`btn btn-outline`,style:{padding:`0.65rem 1.25rem`,gap:`0.5rem`,fontWeight:700,backgroundColor:`#ffffff`,display:`flex`,alignItems:`center`},children:[(0,x.jsx)(_,{size:16}),(0,x.jsx)(`span`,{children:s(`invoice.print`)})]})]}),(0,x.jsx)(`div`,{id:`invoice-print-sheet`,style:{display:`flex`,flexDirection:`column`,gap:`2rem`},children:E.map(e=>(0,x.jsxs)(`div`,{id:`invoice-page-${e.pageNumber}`,className:`invoice-page-sheet card`,style:{padding:`2.5rem`,backgroundColor:`#ffffff`,color:`#1a1a1a`,border:`1px solid var(--border-color)`,boxShadow:`var(--shadow-lg)`,position:`relative`},children:[e.isFirstPage?(0,x.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`,borderBottom:`2px solid #00a896`,paddingBottom:`1.5rem`,marginBottom:`1.5rem`},className:`invoice-header-row`,children:[(0,x.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`0.85rem`,textAlign:l?`right`:`left`},children:[(0,x.jsx)(`img`,{src:m,alt:`Absolute Dental`,style:{width:`48px`,height:`48px`,objectFit:`contain`,flexShrink:0}}),(0,x.jsxs)(`div`,{children:[(0,x.jsx)(`h1`,{style:{fontSize:`1.65rem`,fontWeight:900,color:`#0a335c`,margin:0,letterSpacing:`-0.01em`},children:`Absolute Dental`}),(0,x.jsx)(`p`,{style:{fontSize:`0.8rem`,color:`#64748b`,margin:`0.2rem 0 0 0`},children:s(`invoice.company`)})]})]}),(0,x.jsxs)(`div`,{style:{textAlign:l?`left`:`right`},children:[(0,x.jsx)(`span`,{style:{display:`inline-block`,padding:`0.4rem 0.8rem`,backgroundColor:`#e6f6f4`,color:`#00a896`,borderRadius:`var(--radius-sm)`,fontWeight:700,fontSize:`0.8rem`,marginBottom:`0.5rem`},children:t.status?s(`tracking.status_${t.status}`):``}),(0,x.jsx)(`p`,{style:{fontSize:`0.9rem`,fontWeight:700,fontFamily:`monospace`,color:`#0a335c`},children:t.order_number?.replace(/\D/g,``)||t.order_number}),(0,x.jsx)(`p`,{style:{fontSize:`0.75rem`,color:`#666`,marginTop:`0.2rem`},children:k(t.created_at)}),e.totalPages>1&&(0,x.jsx)(`span`,{style:{fontSize:`0.72rem`,color:`#64748b`,fontWeight:700,backgroundColor:`#f1f5f9`,padding:`0.15rem 0.5rem`,borderRadius:`4px`,display:`inline-block`,marginTop:`0.3rem`},children:l?`صفحة ${e.pageNumber} من ${e.totalPages}`:`Page ${e.pageNumber} of ${e.totalPages}`})]})]}):(0,x.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`,borderBottom:`1.5px solid #00a896`,paddingBottom:`0.85rem`,marginBottom:`1.25rem`},className:`invoice-header-row`,children:[(0,x.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`0.65rem`},children:[(0,x.jsx)(`img`,{src:m,alt:`Absolute Dental`,style:{width:`32px`,height:`32px`,objectFit:`contain`}}),(0,x.jsxs)(`div`,{children:[(0,x.jsx)(`span`,{style:{fontSize:`1.1rem`,fontWeight:800,color:`#0a335c`},children:`Absolute Dental`}),(0,x.jsxs)(`span`,{style:{fontSize:`0.75rem`,color:`#64748b`,marginInlineStart:`0.5rem`},children:[`#`,t.order_number?.replace(/\D/g,``)||t.order_number]})]})]}),(0,x.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`0.75rem`},children:[(0,x.jsx)(`span`,{style:{fontSize:`0.78rem`,color:`#666`},children:k(t.created_at)}),(0,x.jsx)(`span`,{style:{fontSize:`0.75rem`,color:`#00a896`,fontWeight:700,backgroundColor:`#e6f6f4`,padding:`0.2rem 0.6rem`,borderRadius:`4px`},children:l?`صفحة ${e.pageNumber} من ${e.totalPages}`:`Page ${e.pageNumber} of ${e.totalPages}`})]})]}),e.isFirstPage&&(0,x.jsxs)(`div`,{style:{display:`grid`,gridTemplateColumns:`1fr 1fr`,gap:`1.5rem`,marginBottom:`1.75rem`,fontSize:`0.85rem`},className:`invoice-info-grid`,children:[(0,x.jsxs)(`div`,{style:{padding:`1rem`,backgroundColor:`#f8fafc`,borderRadius:`var(--radius-sm)`,border:`1px solid #e2e8f0`},children:[(0,x.jsx)(`h4`,{style:{color:`#0a335c`,fontWeight:700,marginBottom:`0.6rem`},children:`Absolute Dental`}),(0,x.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`0.4rem`,color:`#555`},children:[(0,x.jsxs)(`p`,{style:{display:`flex`,alignItems:`center`,gap:`0.4rem`},children:[(0,x.jsx)(c,{size:14,style:{color:`#00a896`}}),(0,x.jsx)(`span`,{children:`Tripoli, Libya / طرابلس، ليبيا`})]}),(0,x.jsxs)(`p`,{style:{display:`flex`,alignItems:`center`,gap:`0.4rem`},children:[(0,x.jsx)(f,{size:14,style:{color:`#00a896`}}),(0,x.jsx)(`span`,{style:{fontWeight:700,letterSpacing:`0.03em`},children:`0946859163`})]})]})]}),(0,x.jsxs)(`div`,{style:{padding:`1rem`,backgroundColor:`#f8fafc`,borderRadius:`var(--radius-sm)`,border:`1px solid #e2e8f0`},children:[(0,x.jsx)(`h4`,{style:{color:`#0a335c`,fontWeight:700,marginBottom:`0.6rem`},children:s(`invoice.customer_info`)}),(0,x.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`0.4rem`,color:`#555`},children:[(0,x.jsx)(`p`,{style:{fontWeight:600,color:`#1a1a1a`},children:t.customer_name}),(0,x.jsxs)(`p`,{style:{display:`flex`,alignItems:`center`,gap:`0.4rem`},children:[(0,x.jsx)(f,{size:14,style:{color:`#00a896`}}),(0,x.jsxs)(`span`,{children:[t.customer_phone,` `,t.customer_phone_secondary?`/ ${t.customer_phone_secondary}`:``]})]}),(0,x.jsxs)(`p`,{style:{display:`flex`,alignItems:`center`,gap:`0.4rem`},children:[(0,x.jsx)(g,{size:14,style:{color:`#00a896`}}),(0,x.jsxs)(`span`,{children:[t.university,` - `,t.college]})]})]})]})]}),(0,x.jsx)(`div`,{className:`invoice-table-wrapper`,style:{overflowX:`auto`,marginBottom:e.isLastPage?`1.5rem`:`1rem`},children:(0,x.jsxs)(`table`,{className:`invoice-items-table`,style:{width:`100%`,borderCollapse:`collapse`,fontSize:`0.85rem`},children:[(0,x.jsx)(`thead`,{children:(0,x.jsxs)(`tr`,{style:{backgroundColor:`#f1f5f9`,color:`#0a335c`,borderBottom:`2px solid #e2e8f0`,textAlign:l?`right`:`left`},children:[(0,x.jsx)(`th`,{style:{padding:`0.75rem 1rem`},children:s(`invoice.item_name`)}),(0,x.jsx)(`th`,{style:{padding:`0.75rem 1rem`,textAlign:`center`},children:s(`invoice.unit_price`)}),(0,x.jsx)(`th`,{style:{padding:`0.75rem 1rem`,textAlign:`center`},children:s(`invoice.qty`)}),(0,x.jsx)(`th`,{style:{padding:`0.75rem 1rem`,textAlign:l?`left`:`right`},children:s(`invoice.total`)})]})}),(0,x.jsx)(`tbody`,{children:e.items.map(e=>{let t=n===`ar`?e.nameAr||e.nameEn:e.nameEn||e.nameAr,r=n===`ar`?e.nameEn:e.nameAr;return(0,x.jsxs)(`tr`,{className:`invoice-table-row`,style:{borderBottom:`1px solid #e2e8f0`},children:[(0,x.jsx)(`td`,{style:{padding:`0.75rem 1rem`,verticalAlign:`middle`},children:(0,x.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`0.85rem`},children:[(0,x.jsxs)(`div`,{className:`invoice-item-thumb-box`,style:{width:`44px`,height:`44px`,minWidth:`44px`,borderRadius:`8px`,backgroundColor:`#f8fafc`,border:`1px solid #e2e8f0`,overflow:`hidden`,display:`flex`,alignItems:`center`,justifyContent:`center`,flexShrink:0},children:[e.imageUrl?(0,x.jsx)(`img`,{src:e.imageUrl,alt:t,style:{width:`100%`,height:`100%`,objectFit:`cover`,display:`block`},onError:e=>{e.currentTarget.style.display=`none`;let t=e.currentTarget.parentElement?.querySelector(`.invoice-thumb-fallback`);t&&(t.style.display=`flex`)}}):null,(0,x.jsx)(`div`,{className:`invoice-thumb-fallback`,style:{display:e.imageUrl?`none`:`flex`,alignItems:`center`,justifyContent:`center`,width:`100%`,height:`100%`,color:`#94a3b8`},children:(0,x.jsx)(o,{size:18})})]}),(0,x.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`0.2rem`},children:[(0,x.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`0.4rem`,flexWrap:`wrap`},children:[(0,x.jsx)(`span`,{style:{fontWeight:700,color:`#0f172a`,fontSize:`0.88rem`,lineHeight:1.35},children:t}),e.sellingUnit&&(0,x.jsx)(`span`,{style:{fontSize:`0.7rem`,backgroundColor:`rgba(0, 168, 150, 0.1)`,color:`#00a896`,padding:`0.1rem 0.45rem`,borderRadius:`4px`,fontWeight:600},children:e.sellingUnit}),h(e.productId||e.id||t||r)&&(0,x.jsxs)(`span`,{style:{fontSize:`0.7rem`,backgroundColor:`#fef3c7`,color:`#92400e`,padding:`0.1rem 0.45rem`,borderRadius:`4px`,fontWeight:700,border:`1px solid #fde68a`},children:[`🎨 `,n===`ar`?`لون عشوائي`:`Random Color`]}),e.isBundle&&(0,x.jsxs)(`span`,{style:{fontSize:`0.7rem`,backgroundColor:`rgba(0, 168, 150, 0.12)`,color:`#00a896`,padding:`0.1rem 0.45rem`,borderRadius:`4px`,fontWeight:700},children:[`🎁 `,n===`ar`?`بكج متكامل`:`Bundle`]})]}),r&&r!==t&&(0,x.jsx)(`span`,{style:{fontSize:`0.75rem`,color:`#64748b`},children:r}),e.isBundle&&Array.isArray(e.bundleComponents)&&e.bundleComponents.length>0&&(0,x.jsxs)(`div`,{style:{marginTop:`0.35rem`,display:`flex`,flexDirection:`column`,gap:`0.2rem`},children:[(0,x.jsx)(`span`,{style:{fontSize:`0.72rem`,color:`#00a896`,fontWeight:700},children:n===`ar`?`محتويات البكج (${e.bundleComponents.length} ${u(e,`ar`)}):`:`Included Components (${e.bundleComponents.length} ${u(e,`en`)}):`}),(0,x.jsx)(`div`,{style:{display:`flex`,flexWrap:`wrap`,gap:`0.3rem`},children:e.bundleComponents.map((t,r)=>(0,x.jsxs)(`span`,{style:{fontSize:`0.68rem`,backgroundColor:`#f1f5f9`,border:`1px solid #e2e8f0`,color:`#334155`,padding:`0.15rem 0.4rem`,borderRadius:`4px`,display:`inline-flex`,alignItems:`center`,gap:`0.25rem`},children:[(0,x.jsx)(`span`,{style:{color:`#10b981`,fontWeight:`bold`},children:`✓`}),(0,x.jsx)(`span`,{children:n===`ar`?t.nameAr||t.nameEn:t.nameEn||t.nameAr}),(0,x.jsxs)(`span`,{style:{color:`#64748b`,fontWeight:600},children:[`(`,(t.quantity||1)*e.quantity,`×)`]})]},t.productId||r))})]})]})]})}),(0,x.jsxs)(`td`,{style:{padding:`0.75rem 1rem`,textAlign:`center`,fontWeight:600,verticalAlign:`middle`},children:[e.price,` `,s(`cart.currency`)]}),(0,x.jsx)(`td`,{style:{padding:`0.75rem 1rem`,textAlign:`center`,fontWeight:700,verticalAlign:`middle`},children:e.quantity}),(0,x.jsxs)(`td`,{style:{padding:`0.75rem 1rem`,textAlign:l?`left`:`right`,fontWeight:700,color:`#0a335c`,verticalAlign:`middle`},children:[e.lineTotal.toFixed(2),` `,s(`cart.currency`)]})]},e.lineItemId)})})]})}),e.isLastPage&&(0,x.jsx)(`div`,{className:`invoice-totals-section`,style:{display:`flex`,justifyContent:`flex-end`,marginTop:`1rem`},children:(0,x.jsxs)(`div`,{style:{width:`100%`,maxWidth:`290px`,display:`flex`,flexDirection:`column`,gap:`0.6rem`,fontSize:`0.85rem`},children:[(0,x.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`},children:[(0,x.jsxs)(`span`,{children:[s(`cart.subtotal`),`:`]}),(0,x.jsxs)(`span`,{style:{fontWeight:600},children:[(t.total_price-(t.shipping_fee||0)+(t.discount_amount||0)).toFixed(2),` `,s(`cart.currency`)]})]}),t.discount_amount>0&&(0,x.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,color:`#ef4444`},children:[(0,x.jsxs)(`span`,{children:[s(`cart.discounts`),`:`]}),(0,x.jsxs)(`span`,{style:{fontWeight:600},children:[`-`,parseFloat(t.discount_amount).toFixed(2),` `,s(`cart.currency`)]})]}),(0,x.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`},children:[(0,x.jsxs)(`span`,{children:[s(`cart.shipping`),`:`]}),(0,x.jsx)(`span`,{style:{fontWeight:600,color:`#00a896`},children:t.shipping_fee>0?`${t.shipping_fee} ${s(`cart.currency`)}`:t.address_text||t.shipping_fee===0?n===`ar`?`يتم تحديده عبر الواتساب`:`Determined via WhatsApp`:n===`ar`?`مجاني بالكلية`:`Free at Faculty`})]}),(0,x.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,borderTop:`2px solid #00a896`,paddingTop:`0.6rem`,fontSize:`1.1rem`,color:`#0a335c`,fontWeight:800},children:[(0,x.jsxs)(`span`,{children:[s(`cart.total`),`:`]}),(0,x.jsxs)(`span`,{children:[(parseFloat(t.total_price)||0).toFixed(2),` `,s(`cart.currency`)]})]}),(0,x.jsx)(`p`,{style:{fontSize:`0.72rem`,color:`#666`,marginTop:`0.4rem`,lineHeight:1.4},children:n===`ar`?`*(ملاحظة: تكلفة التوصيل تُضاف وتُحدد عبر الواتساب عند تأكيد الطلب).*`:`*(Note: Delivery fee is determined and added via WhatsApp upon order confirmation).*`})]})}),e.isLastPage&&t.notes&&(0,x.jsxs)(`div`,{className:`invoice-notes-section`,style:{borderTop:`1px solid #e2e8f0`,marginTop:`1.5rem`,paddingTop:`1rem`,fontSize:`0.8rem`,color:`#666`},children:[(0,x.jsx)(`h5`,{style:{fontWeight:700,color:`#0a335c`,marginBottom:`0.3rem`},children:s(`checkout.notes`)}),(0,x.jsx)(`p`,{children:t.notes})]}),(0,x.jsxs)(`div`,{className:`invoice-page-footer`,style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`,borderTop:`1px dashed #e2e8f0`,marginTop:`1.5rem`,paddingTop:`0.75rem`,fontSize:`0.75rem`,color:`#888`},children:[(0,x.jsx)(`span`,{children:n===`ar`?`شكراً لتسوقكم مع Absolute Dental!`:`Thank you for choosing Absolute Dental!`}),(0,x.jsx)(`span`,{children:l?`صفحة ${e.pageNumber} من ${e.totalPages}`:`Page ${e.pageNumber} of ${e.totalPages}`})]})]},e.pageNumber))}),(0,x.jsx)(`style`,{children:`
        /* ═════════════════════════════════════════════════════════════════════
           PRINT ENGINE CONSTRAINTS (A4 PORTRAIT / SAVE AS PDF / MULTI-PAGE)
           ═════════════════════════════════════════════════════════════════════ */
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 10mm 10mm 10mm;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* 1. Global Reset: Remove all screen-only chrome, fixed widgets, footers, & navbars */
          .no-print,
          header,
          footer,
          nav,
          .navbar,
          .mobile-bottom-nav,
          .floating-cart-wrapper,
          .announcement-bar,
          .admin-sidebar-pane,
          aside {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }

          /* 2. Document & Body: Static, pure white, unconstrained height */
          html, body {
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #1a1a1a !important;
            overflow: visible !important;
          }

          /* 3. Containers Neutralization: Flatten flex wrappers, remove fixed modal overlays */
          #root,
          #app,
          main,
          .container,
          .invoice-container,
          .invoice-admin-modal-overlay {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            overflow: visible !important;
            inset: auto !important;
            transform: none !important;
            z-index: auto !important;
          }

          /* 4. Discrete Page Containers for Multi-Page Invoices */
          #invoice-print-sheet {
            display: block !important;
            gap: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .invoice-page-sheet {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #1a1a1a !important;
            overflow: visible !important;
            page-break-after: always !important;
            break-after: page !important;
          }

          .invoice-page-sheet:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }

          /* 5. Table Container: Eliminate overflow scroll container to enable native multi-page pagination */
          .invoice-table-wrapper {
            overflow: visible !important;
            overflow-x: visible !important;
            overflow-y: visible !important;
            display: block !important;
            width: 100% !important;
            margin-bottom: 1rem !important;
          }

          /* 6. Products Table Pagination & Row Protection */
          .invoice-items-table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }

          .invoice-items-table thead {
            display: table-header-group !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .invoice-items-table tbody {
            display: table-row-group !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }

          .invoice-items-table tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: auto !important;
            break-after: auto !important;
          }

          .invoice-items-table td,
          .invoice-items-table th {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .invoice-item-thumb-box {
            border: 1px solid #cbd5e1 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .invoice-item-thumb-box img {
            max-width: 44px !important;
            max-height: 44px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* 7. Block Integrity */
          .invoice-header-row,
          .invoice-info-grid,
          .invoice-totals-section,
          .invoice-notes-section,
          .invoice-page-footer {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }

        @media (max-width: 600px) {
          .invoice-header-row, .invoice-info-grid {
            flex-direction: column !important;
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .invoice-container {
            padding: 0 !important;
          }
          .invoice-page-sheet {
            padding: 1.25rem !important;
          }
        }
      `})]})};export{_ as n,S as t};