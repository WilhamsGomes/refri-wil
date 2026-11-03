// Página de conferência da Etapa 1: toca cada sequência sobre a cor medida,
// para verificar se a borda do vídeo some no fundo da página.
import dados from './quadros.json';

const lista = document.getElementById('lista');
const mb = (b) => (b / 1024 / 1024).toFixed(2) + ' MB';
const nome = (i) => String(i + 1).padStart(4, '0') + '.webp';
const degrade = (stops) => `linear-gradient(to bottom, ${stops.join(', ')})`;

const paineis = Object.entries(dados.sabores).map(([sabor, info]) => {
  const el = document.createElement('section');
  el.className = 'sabor';
  const { topo, base } = info.cores;
  el.innerHTML = `
    <h2>${sabor === 'maracuja' ? 'maracujá' : sabor === 'acai' ? 'açaí' : 'limão'}</h2>
    <div class="meta">
      <b>${info.quadros}</b> quadros · desktop ${mb(info.bytes.desktop)} · mobile ${mb(info.bytes.mobile)}<br />
      <span class="chip" style="background:${topo}"></span>topo ${topo} ·
      <span class="chip" style="background:${base}"></span>base ${base}
    </div>
    <div class="palco"><canvas></canvas></div>
    <div class="controles">
      <button type="button">pausar</button>
      <input type="range" min="0" max="${info.quadros - 1}" value="0" />
      <span class="contador">0001</span>
    </div>`;
  lista.append(el);
  return { sabor, info, el, canvas: el.querySelector('canvas'), slider: el.querySelector('input'),
    botao: el.querySelector('button'), contador: el.querySelector('.contador'), imgs: [], i: 0, tocando: true };
});

function carregar(p, versao) {
  p.imgs = Array.from({ length: p.info.quadros }, (_, i) => {
    const img = new Image();
    img.src = `/assets/${p.sabor}/frames/${versao}/${nome(i)}`;
    return img;
  });
}

function desenhar(p) {
  const img = p.imgs[p.i];
  if (!img?.complete || !img.naturalWidth) return;
  const c = p.canvas, dpr = window.devicePixelRatio || 1;
  const w = Math.round(c.clientWidth * dpr), h = Math.round(c.clientHeight * dpr);
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  c.getContext('2d').drawImage(img, 0, 0, w, h);
  p.slider.value = p.i;
  p.contador.textContent = nome(p.i).slice(0, 4);
}

function aplicarFundo() {
  const modo = document.querySelector('input[name=fundo]:checked').value;
  for (const p of paineis) {
    p.el.style.background = modo === 'topo' ? p.info.cores.topo : degrade(p.info.cores.stops);
  }
}

for (const p of paineis) {
  carregar(p, 'desktop');
  p.botao.onclick = () => { p.tocando = !p.tocando; p.botao.textContent = p.tocando ? 'pausar' : 'tocar'; };
  p.slider.oninput = () => { p.tocando = false; p.botao.textContent = 'tocar'; p.i = +p.slider.value; desenhar(p); };
}
document.querySelectorAll('input[name=fundo]').forEach((el) => (el.onchange = aplicarFundo));
document.getElementById('mobile').onchange = (e) => paineis.forEach((p) => carregar(p, e.target.checked ? 'mobile' : 'desktop'));
aplicarFundo();

// toca em loop a 12 fps, com 1 s de pausa no último quadro
let ultimo = 0;
function loop(t) {
  if (t - ultimo >= 1000 / dados.fps) {
    ultimo = t;
    for (const p of paineis) {
      if (p.tocando && p.imgs[p.i]?.complete) {
        const noFim = p.i === p.info.quadros - 1;
        p.espera = noFim ? (p.espera ?? 0) + 1 : 0;
        if (!noFim || p.espera > dados.fps) {
          p.i = (p.i + 1) % p.info.quadros;
          p.espera = 0;
        }
      }
      desenhar(p);
    }
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
