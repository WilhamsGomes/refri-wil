// Extrai os quadros de assets/<sabor>/video.mp4 em .webp (desktop e mobile),
// gera as imagens leves de assets/<sabor>/web/ (fruta do seletor, lata dos cards),
// mede as cores de fundo e grava src/quadros.json.
// Uso: npm run quadros            (pula sabores já extraídos)
//      npm run quadros -- --forcar (extrai tudo de novo)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SABORES = ['maracuja', 'limao', 'acai'];
const FPS = 12;
const VERSOES = { desktop: 1600, mobile: 800 };
const QUALIDADE = 80;
const forcar = process.argv.includes('--forcar');

// Recorte quadrado de fruta.png para o seletor: centro (cx, cy) e lado, em fração da largura/altura/largura
const CORTE_FRUTA = {
  maracuja: { cx: 0.34, cy: 0.5, lado: 0.315 },
  limao: { cx: 0.348, cy: 0.5, lado: 0.3 },
  acai: { cx: 0.5, cy: 0.48, lado: 0.44 },
};
const MINIATURA = 256;

// Lata de frente para os cards e o CTA: recorte quadrado em volta da lata (em fração da imagem)
const ARQUIVO_LATA = { maracuja: 'lata.png', limao: 'lata.png', acai: 'frente.png' };
const CORTE_LATA = { x: 0.06, y: 0.06, w: 0.88, h: 0.88 };
const LATA = { w: 720, h: 720 };

const ff = (args, opts = {}) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], opts);

function extrair(sabor, versao, largura) {
  const dir = join('assets', sabor, 'frames', versao);
  if (!forcar && existsSync(dir) && readdirSync(dir).some((f) => f.endsWith('.webp'))) return;
  mkdirSync(dir, { recursive: true });
  console.log(`extraindo ${sabor}/${versao}…`);
  ff([
    '-i', join('assets', sabor, 'video.mp4'),
    '-vf', `fps=${FPS},scale=${largura}:-2:flags=lanczos`,
    '-c:v', 'libwebp', '-quality', String(QUALIDADE), '-compression_level', '6', '-preset', 'photo',
    join(dir, '%04d.webp'),
  ]);
}

function miniaturaFruta(sabor) {
  const destino = join('assets', sabor, 'web', 'fruta.webp');
  if (!forcar && existsSync(destino)) return;
  mkdirSync(join('assets', sabor, 'web'), { recursive: true });
  const { cx, cy, lado } = CORTE_FRUTA[sabor];
  ff([
    '-i', join('assets', sabor, 'fruta.png'),
    '-vf', `crop=iw*${lado}:iw*${lado}:iw*${cx}-iw*${lado}/2:ih*${cy}-iw*${lado}/2,scale=${MINIATURA}:${MINIATURA}:flags=lanczos`,
    '-c:v', 'libwebp', '-quality', '85', destino,
  ]);
}

function imagemLata(sabor) {
  const destino = join('assets', sabor, 'web', 'lata.webp');
  if (!forcar && existsSync(destino)) return destino;
  const { x, y, w, h } = CORTE_LATA;
  ff([
    '-i', join('assets', sabor, ARQUIVO_LATA[sabor]),
    '-vf', `crop=iw*${w}:ih*${h}:iw*${x}:ih*${y},scale=${LATA.w}:${LATA.h}:flags=lanczos`,
    '-c:v', 'libwebp', '-quality', '82', destino,
  ]);
  return destino;
}

// Média RGB de um retângulo: recorta e reduz para 1×1 px com filtro "area".
function media(arquivo, [x, y, w, h]) {
  const px = ff(
    ['-i', arquivo, '-vf', `crop=${w}:${h}:${x}:${y},scale=1:1:flags=area`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
    { maxBuffer: 1024 },
  );
  return [px[0], px[1], px[2]];
}

const hex = (rgb) => '#' + rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('').toUpperCase();
const mediaDe = (cores) => cores[0].map((_, i) => cores.reduce((s, c) => s + c[i], 0) / cores.length);

function medirCores(sabor) {
  const arq = join('assets', sabor, 'frames', 'desktop', '0001.webp');
  const W = VERSOES.desktop;
  const H = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=height', '-of', 'csv=p=0', arq]));
  const bw = Math.round(W * 0.08), bh = Math.round(H * 0.12), sw = Math.round(W * 0.1);
  // topo/base: cantos (8% × 12%); stops: degradê vertical em 10 faixas, só nas laterais (longe da lata)
  const topo = mediaDe([media(arq, [0, 0, bw, bh]), media(arq, [W - bw, 0, bw, bh])]);
  const base = mediaDe([media(arq, [0, H - bh, bw, bh]), media(arq, [W - bw, H - bh, bw, bh])]);
  const stops = Array.from({ length: 10 }, (_, i) => {
    const y = Math.round((i * H) / 10), h = Math.round(((i + 1) * H) / 10) - y;
    return hex(mediaDe([media(arq, [0, y, sw, h]), media(arq, [W - sw, y, sw, h])]));
  });
  return { topo: hex(topo), base: hex(base), stops };
}

// Fundo do recorte da lata: faixas de 8% no topo e na base, só nas laterais (12%)
function medirCoresLata(arq) {
  const { w: W, h: H } = LATA;
  const sw = Math.round(W * 0.12), bh = Math.round(H * 0.08);
  const faixa = (y) => hex(mediaDe([media(arq, [0, y, sw, bh]), media(arq, [W - sw, y, sw, bh])]));
  return { topo: faixa(0), base: faixa(H - bh) };
}

function info(sabor, versao) {
  const dir = join('assets', sabor, 'frames', versao);
  const arquivos = readdirSync(dir).filter((f) => f.endsWith('.webp'));
  const bytes = arquivos.reduce((s, f) => s + statSync(join(dir, f)).size, 0);
  return { quadros: arquivos.length, bytes };
}

const saida = { fps: FPS, larguras: VERSOES, sabores: {} };
for (const sabor of SABORES) {
  for (const [versao, largura] of Object.entries(VERSOES)) extrair(sabor, versao, largura);
  miniaturaFruta(sabor);
  const lata = imagemLata(sabor);
  const d = info(sabor, 'desktop'), m = info(sabor, 'mobile');
  if (d.quadros !== m.quadros) throw new Error(`${sabor}: desktop e mobile com nº de quadros diferente`);
  saida.sabores[sabor] = {
    quadros: d.quadros,
    bytes: { desktop: d.bytes, mobile: m.bytes },
    cores: medirCores(sabor),
    lata: medirCoresLata(lata),
  };
}

mkdirSync('src', { recursive: true });
writeFileSync('src/quadros.json', JSON.stringify(saida, null, 2) + '\n');

const mb = (b) => (b / 1024 / 1024).toFixed(2) + ' MB';
let total = 0;
for (const [s, v] of Object.entries(saida.sabores)) {
  total += v.bytes.desktop + v.bytes.mobile;
  console.log(`${s.padEnd(9)} ${v.quadros} quadros  desktop ${mb(v.bytes.desktop)}  mobile ${mb(v.bytes.mobile)}  topo ${v.cores.topo}  base ${v.cores.base}`);
}
console.log(`total ${mb(total)} → src/quadros.json`);
