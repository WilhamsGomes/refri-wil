import 'lenis/dist/lenis.css';
import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { SABORES } from './sabores.js';
import { carregarQuadros, criarPlayer } from './sequencia.js';
import { criarBolhas } from './bolhas.js';
import { acompanharSecoes, animarEntradas, atualizarCta, iniciarMenu, montarCards } from './secoes.js';

gsap.registerPlugin(ScrollTrigger);

const DURACAO_ENTRADA = 2.5;
const DURACAO_TROCA = 1.8;
const DURACAO_FADE = 0.8;

// ?reduzido simula prefers-reduced-motion no desenvolvimento (só a parte em JS)
const reduzido =
  matchMedia('(prefers-reduced-motion: reduce)').matches ||
  (import.meta.env.DEV && new URLSearchParams(location.search).has('reduzido'));
const versao = matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop';

const $ = (sel) => document.querySelector(sel);
const raiz = document.documentElement;
const seletor = $('.seletor');
const opcoes = $('.seletor__opcoes');
const nomeEl = $('[data-nome]');
const numeroEl = $('[data-numero]');

const player = criarPlayer($('.hero__quadros'));
let atual = SABORES[0];
let bloqueado = true;

// ---------- carregamento ----------
// Movimento reduzido: só o último quadro de cada sabor.
const indicesDe = (s) => (reduzido ? [s.quadros - 1] : [...Array(s.quadros).keys()]);
const cache = new Map();
const prontos = new Set();
const garantir = (s, aoProgresso) => {
  if (!cache.has(s.id)) {
    const carga = carregarQuadros(s.id, versao, indicesDe(s), aoProgresso);
    carga.then(() => prontos.add(s.id));
    cache.set(s.id, carga);
  }
  return cache.get(s.id);
};

// ---------- tema ----------
function aplicarTema(s) {
  raiz.style.setProperty('--fundo', s.fundo);
  raiz.style.setProperty('--acento', s.acento);
  raiz.style.setProperty('--tinta', s.tinta);
  $('meta[name=theme-color]').content = s.fundo;
}

function trocarTexto(el, texto) {
  if (reduzido) {
    el.textContent = texto;
    return;
  }
  gsap
    .timeline()
    .to(el, { yPercent: -110, autoAlpha: 0, duration: 0.3, ease: 'power2.in' })
    .add(() => (el.textContent = texto))
    .fromTo(el, { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out' });
}

// ---------- seletor ----------
const botoes = SABORES.map((s) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.setAttribute('aria-pressed', String(s === atual));
  b.setAttribute('aria-label', s.nome);
  b.innerHTML = `<img src="${s.miniatura}" alt="" width="64" height="64" />`;
  b.addEventListener('click', () => escolher(s));
  opcoes.append(b);
  return b;
});
const marcarCards = montarCards(escolher);

function bloquear(sim) {
  bloqueado = sim;
  seletor.setAttribute('aria-busy', String(sim));
}

async function escolher(s) {
  if (bloqueado || s === atual) return;
  bloquear(true);
  const i = SABORES.indexOf(s);
  botoes.forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
  marcarCards(s);

  if (!prontos.has(s.id)) botoes[i].classList.add('carregando');
  const imgs = await garantir(s);
  botoes[i].classList.remove('carregando');

  atual = s;
  aplicarTema(s);
  trocarTexto(nomeEl, s.nome);
  trocarTexto(numeroEl, s.numero);
  atualizarCta(s, reduzido);
  await (reduzido ? player.trocar(imgs) : player.trocar(imgs, DURACAO_FADE, DURACAO_TROCA));
  bloquear(false);
}

// ---------- scroll ----------
// Lenis + hero fixo; o menu e o acompanhamento das seções valem também com movimento reduzido.
function iniciarScroll() {
  if (reduzido) {
    iniciarMenu(null);
    acompanharSecoes();
    return;
  }
  const lenis = new Lenis({ anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // Hero fixo: a sequência roda de trás pra frente e os textos sobem com fade.
  gsap
    .timeline({
      scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=100%', pin: true, scrub: 0.4 },
    })
    .to(player.estado, { saida: 1, duration: 1, ease: 'none' }, 0)
    .to(['.hero__texto', '.seletor', '.selo', '.rolar', '.hero__slogan'], {
      y: -90,
      autoAlpha: 0,
      duration: 0.55,
      stagger: 0.06,
      ease: 'power1.in',
    }, 0);

  iniciarMenu(lenis);
  acompanharSecoes();
  animarEntradas();
}

function iniciarBolhas() {
  if (reduzido) return;
  const bolhas = criarBolhas($('.hero__bolhas'), versao === 'mobile' ? 18 : 34);
  new IntersectionObserver(([e]) => (e.isIntersecting ? bolhas.iniciar() : bolhas.parar())).observe($('.hero'));
}

// ---------- entrada ----------
function entrada() {
  const tl = gsap.timeline();
  tl.from('.hero__titulo .linha > span', { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.1 }, 0.1)
    .from(['.hero__texto .micro', '.hero__lead', '.hero__texto .botao'], { y: 24, autoAlpha: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 }, 0.4)
    .from('.seletor > *', { x: 24, autoAlpha: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 }, 0.5)
    .from(['.selo', '.rolar', '.hero__slogan'], { y: 16, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06 }, 0.7)
    // clearProps: um transform no topo prenderia o menu (position: fixed) dentro dele
    .from('.topo', { y: -16, autoAlpha: 0, duration: 0.9, ease: 'power3.out', clearProps: 'transform' }, 0.7);
  return tl;
}

async function iniciar() {
  aplicarTema(atual);
  marcarCards(atual);
  atualizarCta(atual, true);
  const num = $('.loader__num');
  const barra = $('.loader__barra i');
  const mostrado = { v: 0 };
  const imgs = await garantir(atual, (p) => {
    gsap.to(mostrado, {
      v: p * 100,
      duration: 0.3,
      overwrite: true,
      onUpdate: () => {
        num.textContent = Math.round(mostrado.v);
        barra.style.transform = `scaleX(${mostrado.v / 100})`;
      },
    });
  });

  player.mostrar(imgs);
  player.estado.cabeca = reduzido ? 1 : 0;
  num.textContent = '100';
  barra.style.transform = 'scaleX(1)';

  await gsap.to('.loader', { autoAlpha: 0, duration: reduzido ? 0 : 0.6, delay: reduzido ? 0 : 0.25, ease: 'power2.inOut' });
  $('.loader').remove();
  raiz.classList.remove('carregando');
  iniciarScroll();
  iniciarBolhas();

  if (!reduzido) {
    entrada();
    await gsap.to(player.estado, { cabeca: 1, duration: DURACAO_ENTRADA, ease: 'none' });
  }
  bloquear(false);

  // demais sabores em segundo plano, um de cada vez
  for (const s of SABORES) await garantir(s);
}

iniciar();

// depuração no console durante o desenvolvimento
if (import.meta.env.DEV) window.__wil = { gsap, ScrollTrigger, player, escolher, SABORES };
