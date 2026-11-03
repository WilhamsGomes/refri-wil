// Seções abaixo do hero: cards de sabores, CTA com o sabor ativo, menu e
// animações de entrada ao rolar.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SABORES } from './sabores.js';

const $ = (sel) => document.querySelector(sel);

// Cards gerados a partir de sabores.js; o botão de cada um troca o sabor da página.
export function montarCards(aoEscolher) {
  const lista = $('.cards');
  const botoes = SABORES.map((s) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.revelar = '';
    card.style.cssText = `--c-topo:${s.lataCores.topo};--c-base:${s.lataCores.base};--c-acento:${s.acento};--c-tinta:${s.tinta}`;
    card.innerHTML = `
      <div class="card__topo micro"><span class="micro__num">${s.numero}</span><span>350 ml</span></div>
      <img class="card__lata" src="${s.lata}" alt="Lata de wil sabor ${s.nome}" width="720" height="720" loading="lazy" />
      <div class="card__corpo">
        <p class="micro">${s.notas}</p>
        <h3 class="card__nome">${s.nome}</h3>
        <p class="card__desc">${s.descricao}</p>
        <button class="botao card__botao" type="button" aria-pressed="false">Escolher ${s.nome}</button>
      </div>`;
    lista.append(card);
    const botao = card.querySelector('button');
    botao.addEventListener('click', () => aoEscolher(s));
    return botao;
  });

  return (ativo) => botoes.forEach((b, i) => b.setAttribute('aria-pressed', String(SABORES[i] === ativo)));
}

// CTA final: cores da lata, nome e imagem do sabor ativo.
export function atualizarCta(s, reduzido) {
  const raiz = document.documentElement;
  raiz.style.setProperty('--lata-topo', s.lataCores.topo);
  raiz.style.setProperty('--lata-base', s.lataCores.base);

  const nome = $('[data-cta-nome]');
  const img = $('[data-cta-lata]');
  const trocar = () => {
    nome.textContent = s.nome;
    img.src = s.lata;
    img.alt = `Lata de wil sabor ${s.nome}`;
  };
  if (reduzido || nome.textContent === s.nome) return trocar();
  gsap
    .timeline()
    .to(nome, { yPercent: -110, autoAlpha: 0, duration: 0.3, ease: 'power2.in' })
    .to(img, { autoAlpha: 0, duration: 0.3 }, '<')
    .add(trocar)
    .fromTo(nome, { yPercent: 110 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out' })
    .to(img, { autoAlpha: 1, duration: 0.5 }, '<');
}

// Menu em tela cheia no mobile.
export function iniciarMenu(lenis) {
  const raiz = document.documentElement;
  const botao = $('.menu-botao');
  const texto = $('.menu-botao__texto');
  const abrir = (sim) => {
    raiz.classList.toggle('menu-aberto', sim);
    botao.setAttribute('aria-expanded', String(sim));
    texto.textContent = sim ? 'Fechar' : 'Menu';
    if (sim) lenis?.stop();
    else lenis?.start();
  };
  botao.addEventListener('click', () => abrir(!raiz.classList.contains('menu-aberto')));
  $('#menu').addEventListener('click', (e) => e.target.closest('a') && abrir(false));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && abrir(false));
}

// Item ativo do menu e topo escuro sobre seções claras (vale também com movimento reduzido).
export function acompanharSecoes() {
  const links = [...document.querySelectorAll('#menu a')];
  for (const link of links) {
    ScrollTrigger.create({
      trigger: link.hash,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: ({ isActive }) => {
        if (!isActive) return;
        for (const l of links) {
          if (l === link) l.setAttribute('aria-current', 'true');
          else l.removeAttribute('aria-current');
        }
      },
    });
  }

  const topo = $('.topo');
  ScrollTrigger.create({
    trigger: '#sabores',
    start: () => `top ${topo.offsetHeight}`,
    end: 'max',
    toggleClass: { targets: topo, className: 'topo--rolado' },
  });

  const altura = () => topo.offsetHeight / 2;
  for (const secao of document.querySelectorAll('.secao--clara')) {
    ScrollTrigger.create({
      trigger: secao,
      start: () => `top ${altura()}`,
      end: () => `bottom ${altura()}`,
      toggleClass: { targets: topo, className: 'topo--escuro' },
    });
  }
}

// Entrada ao rolar: blocos sobem com fade e os números contam.
export function animarEntradas() {
  gsap.set('[data-revelar]', { autoAlpha: 0 });
  ScrollTrigger.batch('[data-revelar]', {
    start: 'top 88%',
    once: true,
    onEnter: (els) =>
      gsap.fromTo(els, { y: 48, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: 'power3.out', stagger: 0.1 }),
  });

  for (const el of document.querySelectorAll('[data-contar]')) {
    const alvo = Number(el.dataset.contar);
    if (!alvo) continue;
    const n = { v: 0 };
    el.textContent = '0';
    gsap.to(n, {
      v: alvo,
      duration: 1.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      onUpdate: () => (el.textContent = Math.round(n.v)),
    });
  }
}
