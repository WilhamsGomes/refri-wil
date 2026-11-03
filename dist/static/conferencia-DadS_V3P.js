import{d as r}from"./quadros-DGoi8TOD.js";const g=document.getElementById("lista"),i=o=>(o/1024/1024).toFixed(2)+" MB",l=o=>String(o+1).padStart(4,"0")+".webp",f=o=>`linear-gradient(to bottom, ${o.join(", ")})`,s=Object.entries(r.sabores).map(([o,e])=>{const t=document.createElement("section");t.className="sabor";const{topo:n,base:a}=e.cores;return t.innerHTML=`
    <h2>${o==="maracuja"?"maracujá":o==="acai"?"açaí":"limão"}</h2>
    <div class="meta">
      <b>${e.quadros}</b> quadros · desktop ${i(e.bytes.desktop)} · mobile ${i(e.bytes.mobile)}<br />
      <span class="chip" style="background:${n}"></span>topo ${n} ·
      <span class="chip" style="background:${a}"></span>base ${a}
    </div>
    <div class="palco"><canvas></canvas></div>
    <div class="controles">
      <button type="button">pausar</button>
      <input type="range" min="0" max="${e.quadros-1}" value="0" />
      <span class="contador">0001</span>
    </div>`,g.append(t),{sabor:o,info:e,el:t,canvas:t.querySelector("canvas"),slider:t.querySelector("input"),botao:t.querySelector("button"),contador:t.querySelector(".contador"),imgs:[],i:0,tocando:!0}});function u(o,e){o.imgs=Array.from({length:o.info.quadros},(t,n)=>{const a=new Image;return a.src=`/assets/${o.sabor}/frames/${e}/${l(n)}`,a})}function m(o){const e=o.imgs[o.i];if(!e?.complete||!e.naturalWidth)return;const t=o.canvas,n=window.devicePixelRatio||1,a=Math.round(t.clientWidth*n),c=Math.round(t.clientHeight*n);(t.width!==a||t.height!==c)&&(t.width=a,t.height=c),t.getContext("2d").drawImage(e,0,0,a,c),o.slider.value=o.i,o.contador.textContent=l(o.i).slice(0,4)}function p(){const o=document.querySelector("input[name=fundo]:checked").value;for(const e of s)e.el.style.background=o==="topo"?e.info.cores.topo:f(e.info.cores.stops)}for(const o of s)u(o,"desktop"),o.botao.onclick=()=>{o.tocando=!o.tocando,o.botao.textContent=o.tocando?"pausar":"tocar"},o.slider.oninput=()=>{o.tocando=!1,o.botao.textContent="tocar",o.i=+o.slider.value,m(o)};document.querySelectorAll("input[name=fundo]").forEach(o=>o.onchange=p);document.getElementById("mobile").onchange=o=>s.forEach(e=>u(e,o.target.checked?"mobile":"desktop"));p();let d=0;function b(o){if(o-d>=1e3/r.fps){d=o;for(const e of s){if(e.tocando&&e.imgs[e.i]?.complete){const t=e.i===e.info.quadros-1;e.espera=t?(e.espera??0)+1:0,(!t||e.espera>r.fps)&&(e.i=(e.i+1)%e.info.quadros,e.espera=0)}m(e)}}requestAnimationFrame(b)}requestAnimationFrame(b);
