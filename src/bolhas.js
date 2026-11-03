// Bolhas pequenas subindo devagar por cima do fundo do hero.
import gsap from 'gsap';

export function criarBolhas(canvas, quantidade = 34) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, rodando = false;

  const nova = (b, emQualquerAltura) => {
    b.x = Math.random() * W;
    b.y = emQualquerAltura ? Math.random() * H : H + 10;
    b.r = 1 + Math.random() ** 2 * 3.5; // maioria bem pequena
    b.vel = 10 + Math.random() * 26; // px/s
    b.fase = Math.random() * Math.PI * 2;
    b.amp = 3 + Math.random() * 9;
    b.alpha = 0.12 + Math.random() * 0.3;
    return b;
  };

  function redimensionar() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }

  redimensionar();
  const bolhas = Array.from({ length: quantidade }, () => nova({}, true));
  new ResizeObserver(redimensionar).observe(canvas);

  function tique(tempo, delta) {
    const dt = Math.min(delta, 50) / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (const b of bolhas) {
      b.y -= b.vel * dt;
      if (b.y < -10) nova(b, false);
      const x = b.x + Math.sin(tempo * 0.8 + b.fase) * b.amp;
      ctx.globalAlpha = b.alpha;
      ctx.beginPath();
      ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = '#F5EBDD';
      ctx.lineWidth = 1;
      ctx.stroke();
      // brilho
      ctx.globalAlpha = b.alpha * 1.4;
      ctx.beginPath();
      ctx.arc(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = '#F5EBDD';
      ctx.fill();
    }
  }

  return {
    iniciar() {
      if (rodando) return;
      gsap.ticker.add(tique);
      rodando = true;
    },
    parar() {
      if (!rodando) return;
      gsap.ticker.remove(tique);
      rodando = false;
    },
  };
}
