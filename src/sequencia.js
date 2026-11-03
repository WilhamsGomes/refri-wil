// Sequência de quadros num <canvas>: carregamento, encaixe "cover" nítido em
// telas retina e troca de sabor com crossfade.
import gsap from 'gsap';
import { urlQuadro } from './sabores.js';

// Carrega os quadros pedidos (índices) e resolve com um array esparso de <img>.
// Quadro com erro conta como carregado e só não é desenhado. Usa o evento load
// (não img.decode(), que no Chrome espera um quadro de pintura e trava em aba oculta).
export function carregarQuadros(id, versao, indices, aoProgresso) {
  const imgs = [];
  let prontos = 0;
  return Promise.all(
    indices.map(
      (i) =>
        new Promise((ok) => {
          const img = new Image();
          img.onload = img.onerror = () => {
            aoProgresso?.(++prontos / indices.length);
            ok();
          };
          img.src = urlQuadro(id, versao, i);
          imgs[i] = img;
        }),
    ),
  ).then(() => imgs);
}

const desenhavel = (img) => img?.complete && img.naturalWidth > 0;

export function criarPlayer(canvas) {
  const ctx = canvas.getContext('2d');
  // cabeca: 0→1 é a entrada das frutas; saida: 0→1 é o scroll saindo do hero (roda ao contrário)
  const estado = { imgs: [], cabeca: 0, saida: 0, mistura: 1, anterior: null };
  let ultimaChave = '';

  const indice = () => Math.round(estado.cabeca * (1 - estado.saida) * (estado.imgs.length - 1));

  function cobrir(img, alpha) {
    const { width: W, height: H } = canvas;
    const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  }

  function desenhar() {
    const img = estado.imgs[indice()];
    if (!desenhavel(img)) return;
    const ant = estado.anterior && estado.mistura < 1 ? estado.anterior : null;
    const chave = `${img.src}|${ant?.img.src}|${estado.mistura.toFixed(3)}|${canvas.width}x${canvas.height}`;
    if (chave === ultimaChave) return;
    ultimaChave = chave;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (ant) cobrir(ant.img, 1);
    cobrir(img, ant ? estado.mistura : 1);
  }

  function redimensionar() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (w === canvas.width && h === canvas.height) return;
    canvas.width = w;
    canvas.height = h;
    ctx.imageSmoothingQuality = 'high';
    ultimaChave = '';
  }

  new ResizeObserver(redimensionar).observe(canvas);
  redimensionar();
  gsap.ticker.add(desenhar);

  return {
    estado,
    mostrar(imgs) {
      estado.imgs = imgs;
    },
    // Crossfade do quadro atual para a nova sequência, que toca do início ao fim.
    // Sem durações (movimento reduzido): troca direto para o último quadro.
    trocar(imgs, fade = 0, duracao = 0) {
      estado.anterior = { img: estado.imgs[indice()] };
      estado.imgs = imgs;
      if (!duracao || !desenhavel(estado.anterior.img)) {
        estado.anterior = null;
        estado.mistura = 1;
        if (!duracao) return Promise.resolve();
      }
      return new Promise((ok) => {
        const tl = gsap.timeline({
          onComplete: () => {
            estado.anterior = null;
            ok();
          },
        });
        tl.fromTo(estado, { cabeca: 0 }, { cabeca: 1, duration: duracao, ease: 'none' }, 0);
        if (estado.anterior) tl.fromTo(estado, { mistura: 0 }, { mistura: 1, duration: fade, ease: 'power1.inOut' }, 0);
      });
    },
  };
}
