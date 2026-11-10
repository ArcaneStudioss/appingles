// Desenhos do vocabulário: pessoas e objetos em SVG fixo (sem dados do aluno), em estilo de ilustração editorial.
// Cada cena cabe em 200x150; o chão fica em y=132. Pessoas têm ~104 de altura (pés em y, topo da cabeça em y-102).
// A figura humana tem ombro, cotovelo, mão, quadril, joelho e pé: os braços e as pernas dobram de verdade
// (cinemática de dois ossos), em vez de palitos retos. Contorno fino, sombra suave e roupa com volume.
const OUT = '#3B3450';
const PELE = ['#F3CDA8', '#D7A276', '#9C6644', '#6E4430'];
const OURO = '#F2B632', MADEIRA = '#C98B4B', MADEIRA_ESC = '#8A5A2B';
const LW = 1.3;
const ST = `stroke="${OUT}" stroke-width="${LW}" stroke-linejoin="round"`;

// clareia (f>0) ou escurece (f<0) uma cor #rrggbb
const tom = (hex, f) => {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255]
    .map(v => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f))));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
};
const r1 = v => Math.round(v * 10) / 10;
const pt = p => `${r1(p[0])} ${r1(p[1])}`;

const brilho = (x, y, r = 6) => `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z" fill="#FFD34D" stroke="#E7A700" stroke-width=".8"/>`;
const sombra = (x, y, rx) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${Math.max(2.4, rx / 7)}" fill="#2B2F4A" opacity=".13"/>`;
const coracao = (x, y, s = 1) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 4 C-2 0 -9 -1 -9 -6 C-9 -10 -4 -12 0 -8 C4 -12 9 -10 9 -6 C9 -1 2 0 0 4Z" fill="#FF6B8A" stroke="#C2405F" stroke-width="1"/>`;
const maca = (x, y, r = 7) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#E5484D" stroke="#9E2A2E" stroke-width="1.1"/><path d="M${x} ${y - r + 1} q.5 -4 3 -5.5" stroke="#6B4423" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M${x + 1.5} ${y - r} q4 -3.5 7 -1 q-3.5 3 -7 1Z" fill="#5DAA6B"/><ellipse cx="${x - r / 2.6}" cy="${y - r / 2.8}" rx="${r / 4.5}" ry="${r / 3.2}" fill="#fff" opacity=".55" transform="rotate(30 ${x - r / 2.6} ${y - r / 2.8})"/>`;
const caixa = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2.5" fill="#D39A5B" ${ST}/><rect x="${x + w * 0.62}" y="${y + 1}" width="${w * 0.36}" height="${h - 2}" fill="#B97F44" opacity=".55"/><rect x="${x + w / 2 - 4}" y="${y}" width="8" height="${h}" fill="#EBD3A4"/><path d="M${x} ${y + 0.7} H${x + w}" stroke="${OUT}" stroke-width="${LW}"/>`;

// Dois ossos: devolve a articulação (cotovelo ou joelho) entre a raiz a e a ponta b.
// escolher(c1, c2) decide para que lado a articulação dobra.
function articulacao(a, b, l1, l2, escolher) {
  let dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy);
  const max = l1 + l2 - 0.4;
  if (d > max) { b = [a[0] + dx / d * max, a[1] + dy / d * max]; dx = b[0] - a[0]; dy = b[1] - a[1]; d = max; }
  d = Math.max(d, Math.abs(l1 - l2) + 0.5);
  const ang = Math.atan2(dy, dx), k = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  const c1 = [a[0] + l1 * Math.cos(ang + k), a[1] + l1 * Math.sin(ang + k)], c2 = [a[0] + l1 * Math.cos(ang - k), a[1] + l1 * Math.sin(ang - k)];
  return { j: escolher(c1, c2), b };
}
// traço com contorno: primeiro o contorno largo, depois a cor
const tracoC = (d, larg, cor) => `<path d="${d}" stroke="${OUT}" stroke-width="${larg + LW * 2}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="${cor}" stroke-width="${larg}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

const CABELOS = {
  curto: c => ({ tras: '', frente: `<path d="M-10.6 -87.5 Q-11.8 -101.6 0 -102 Q11.4 -101.8 10.9 -88.6 Q9.6 -94.6 3.8 -95.6 Q-2.4 -96.4 -6.2 -93.8 Q-9.2 -91.6 -10.6 -87.5Z" fill="${c}" ${ST}/><path d="M-5 -99.6 Q1 -101.4 6 -99" stroke="${tom(c, 0.25)}" stroke-width="1.4" fill="none" stroke-linecap="round"/>` }),
  longo: c => ({ tras: `<path d="M-10.8 -91 Q-12.8 -103.6 0 -103.6 Q12.8 -103.6 10.8 -91 L12.6 -70 Q13 -64.5 8 -64 H-8 Q-13 -64.5 -12.6 -70Z" fill="${tom(c, -0.12)}" ${ST}/>`,
    frente: `<path d="M-10.8 -84 Q-11.6 -101.8 0 -102 Q11.6 -101.8 10.8 -84 Q9.6 -93 4 -95.4 Q-1 -91.6 -8.6 -91.4 Q-10.2 -88.6 -10.8 -84Z" fill="${c}" ${ST}/><path d="M-4 -99.8 Q2 -101.4 7 -98.6" stroke="${tom(c, 0.25)}" stroke-width="1.4" fill="none" stroke-linecap="round"/>` }),
  cacheado: c => ({ tras: `<g fill="${c}" ${ST}>${[[-11, -92, 5.4], [11, -92, 5.4], [-12, -83, 4.6], [12, -83, 4.6], [-8, -100, 6], [8, -100, 6], [0, -103, 6.4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`,
    frente: `<g fill="${c}">${[[-7, -96.5, 4.4], [0, -98, 4.8], [7, -96.5, 4.4], [-10, -91, 3.4], [10, -91, 3.4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g><path d="M-6 -101.5 q2 -2 4 0 M3 -102 q2 -2 4 0" stroke="${tom(c, 0.3)}" stroke-width="1.1" fill="none" stroke-linecap="round"/>` }),
  coque: c => ({ tras: `<circle cx="0" cy="-104.5" r="5.6" fill="${c}" ${ST}/>`,
    frente: `<path d="M-10.7 -86.5 Q-11.6 -101.6 0 -101.8 Q11.6 -101.6 10.7 -86.5 Q9 -94.8 0 -95.4 Q-9 -94.8 -10.7 -86.5Z" fill="${c}" ${ST}/><path d="M-4.6 -100 Q0 -101 4.6 -100" stroke="${tom(c, 0.25)}" stroke-width="1.3" fill="none" stroke-linecap="round"/>` }),
};

// Pessoa em pé, de frente. l/r = mãos e pl/pr = pés, em coordenadas locais (pés em 0,0).
// vira: 1 (anda para a direita) ou -1; dobra os joelhos para esse lado e aponta os sapatos.
function pessoa(x, y, o = {}) {
  const { pele = PELE[0], cabelo = '#5A3A22', estilo = 'curto', camisa = '#4C78D9', calca = '#3F5E9C', sapato = '#3A3340',
    rosto = 'feliz', atras = '', frente = '', chapeu = '', manga = 'curta', vira = 0, barba = false } = o;
  const l = o.l || [-15.5, -38], r = o.r || [15.5, -38], pl = o.pl || [-6, -1.5], pr = o.pr || [6, -1.5];
  const ombroE = [-11.2, -68.5], ombroD = [11.2, -68.5];
  // braço: cotovelo para fora e um pouco para baixo
  const braco = (s, m, lado) => {
    const { j: e, b: hnd } = articulacao(s, m, 15.5, 15, (c1, c2) => ((lado * c1[0] + 0.5 * c1[1]) > (lado * c2[0] + 0.5 * c2[1]) ? c1 : c2));
    const pele1 = tracoC(`M${pt(s)} L${pt(e)} L${pt(hnd)}`, 5.6, pele);
    const fim = manga === 'longa' ? lerp(e, hnd, 0.82) : lerp(s, e, 0.72);
    const mangaD = manga === 'longa' ? `M${pt(s)} L${pt(e)} L${pt(fim)}` : `M${pt(s)} L${pt(fim)}`;
    const ang = Math.atan2(hnd[1] - e[1], hnd[0] - e[0]) * 180 / Math.PI;
    const mao = `<g transform="translate(${pt(hnd)}) rotate(${r1(ang)})"><ellipse cx="1" cy="0" rx="4" ry="3.3" fill="${pele}" ${ST}/><path d="M-0.5 ${lado * 0 - 2.6} q2.6 -1.6 3.6 .6" stroke="${tom(pele, -0.28)}" stroke-width=".9" fill="none" stroke-linecap="round"/></g>`;
    return pele1 + tracoC(mangaD, 7.6, camisa) + `<path d="${mangaD}" stroke="${tom(camisa, 0.18)}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".4" transform="translate(${-lado * 1.4} -0.6)"/>` + mao;
  };
  // perna: joelho para o lado em que a pessoa anda (ou levemente para fora, se está parada)
  const perna = (q, p, lado) => {
    const { j: k, b: f } = articulacao(q, p, 17.8, 17.4, (c1, c2) => {
      const s = vira || lado;
      return s * c1[0] > s * c2[0] ? c1 : c2;
    });
    const dir = vira || lado * 0.35;
    const sap = `<path d="M${r1(f[0] - 4 + dir * -1)} ${r1(f[1] + 1.4)} Q${r1(f[0] - 4.4)} ${r1(f[1] - 4.2)} ${r1(f[0])} ${r1(f[1] - 4)} Q${r1(f[0] + 4 + dir * 5)} ${r1(f[1] - 2.6)} ${r1(f[0] + 4.6 + dir * 5)} ${r1(f[1] + 0.4)} Q${r1(f[0] + 4.6 + dir * 5)} ${r1(f[1] + 1.8)} ${r1(f[0] + 3)} ${r1(f[1] + 1.8)} H${r1(f[0] - 3)} Q${r1(f[0] - 4.2 + dir * -1)} ${r1(f[1] + 1.8)} ${r1(f[0] - 4 + dir * -1)} ${r1(f[1] + 1.4)}Z" fill="${sapato}" ${ST}/>`;
    return tracoC(`M${pt(q)} L${pt(k)} L${pt([f[0], f[1] - 2.5])}`, 8.2, calca) + sap;
  };
  const cab = (CABELOS[estilo] || CABELOS.curto)(cabelo);
  const boca = {
    feliz: `<path d="M-3.4 -80.6 Q0 -77.6 3.4 -80.6" stroke="#7A3B3B" stroke-width="1.25" fill="none" stroke-linecap="round"/>`,
    sorriso: `<path d="M-3.8 -81 Q0 -76.4 3.8 -81Z" fill="#8A3A40" stroke="#7A3B3B" stroke-width=".9" stroke-linejoin="round"/><path d="M-2.6 -80.4 H2.6" stroke="#fff" stroke-width="1.1"/>`,
    triste: `<path d="M-3 -78.6 Q0 -81 3 -78.6" stroke="#7A3B3B" stroke-width="1.25" fill="none" stroke-linecap="round"/>`,
    pensa: `<path d="M-2.6 -79.8 Q1 -80.4 3.4 -81.6" stroke="#7A3B3B" stroke-width="1.25" fill="none" stroke-linecap="round"/>`,
    uau: `<ellipse cx="0" cy="-79.4" rx="2.2" ry="2.8" fill="#8A3A40" stroke="#7A3B3B" stroke-width=".9"/>`,
    quer: `<path d="M-3.4 -80.8 Q0 -77 3.4 -80.8" stroke="#7A3B3B" stroke-width="1.25" fill="none" stroke-linecap="round"/><path d="M2.6 -79.4 q1.2 1.8 2.6 .4" stroke="#E86B7A" stroke-width="1.3" fill="none" stroke-linecap="round"/>`,
  }[rosto] || '';
  const olhoY = rosto === 'pensa' ? -89.2 : -88;
  const olho = cx => rosto === 'sorriso'
    ? `<path d="M${cx - 1.7} ${olhoY + 0.4} Q${cx} ${olhoY - 1.8} ${cx + 1.7} ${olhoY + 0.4}" stroke="#2A2433" stroke-width="1.3" fill="none" stroke-linecap="round"/>`
    : `<ellipse cx="${cx}" cy="${olhoY}" rx="1.35" ry="1.75" fill="#2A2433"/><circle cx="${cx + 0.45}" cy="${olhoY - 0.6}" r=".45" fill="#fff"/>`;
  const sob = rosto === 'triste'
    ? `<path d="M-6 -91.2 Q-4 -92.4 -1.8 -92.2 M6 -91.2 Q4 -92.4 1.8 -92.2" stroke="${tom(cabelo, -0.1)}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`
    : rosto === 'pensa' || rosto === 'uau'
      ? `<path d="M-6 -93.4 Q-3.8 -94.8 -1.8 -93.6 M1.8 -93.6 Q3.8 -95.6 6 -94.2" stroke="${tom(cabelo, -0.1)}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`
      : `<path d="M-6 -92.4 Q-3.8 -93.8 -1.8 -92.6 M1.8 -92.6 Q3.8 -93.8 6 -92.4" stroke="${tom(cabelo, -0.1)}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
  const cabeca = `<ellipse cx="-10.2" cy="-86.6" rx="2.4" ry="3.2" fill="${pele}" ${ST}/><ellipse cx="10.2" cy="-86.6" rx="2.4" ry="3.2" fill="${pele}" ${ST}/>`
    + `<path d="M-10.3 -89 Q-10.6 -100 0 -100.2 Q10.6 -100 10.3 -89 Q10.2 -79.6 6.2 -76.8 Q3 -74.8 0 -74.8 Q-3 -74.8 -6.2 -76.8 Q-10.2 -79.6 -10.3 -89Z" fill="${pele}" ${ST}/>`
    + (barba ? `<path d="M-9.6 -84 Q-9 -77 -5 -75.6 Q0 -73.6 5 -75.6 Q9 -77 9.6 -84 Q6 -79.6 3 -81.6 H-3 Q-6 -79.6 -9.6 -84Z" fill="${cabelo}" opacity=".9"/>` : '')
    + olho(-3.9) + olho(3.9) + sob
    + `<path d="M.2 -87 Q1.6 -84 -.4 -83.6" stroke="${tom(pele, -0.3)}" stroke-width="1" fill="none" stroke-linecap="round"/>`
    + `<ellipse cx="-6.6" cy="-82.8" rx="2.2" ry="1.3" fill="#F07C7C" opacity=".28"/><ellipse cx="6.6" cy="-82.8" rx="2.2" ry="1.3" fill="#F07C7C" opacity=".28"/>`
    + boca;
  const tronco = `<path d="M-11.6 -70.6 Q-13.6 -70 -13.4 -66 L-11.6 -44 Q-11.2 -40 -7.4 -40 H7.4 Q11.2 -40 11.6 -44 L13.4 -66 Q13.6 -70 11.6 -70.6 Q6 -72.8 0 -72.8 Q-6 -72.8 -11.6 -70.6Z" fill="${camisa}" ${ST}/>`
    + `<path d="M5 -71.6 Q11.2 -70.4 12.2 -66 L10.6 -44.4 Q10.2 -41.6 7 -41.4 Q9.4 -55 5 -71.6Z" fill="${tom(camisa, -0.14)}" opacity=".7"/>`
    + `<path d="M-4.4 -72.4 Q0 -67 4.4 -72.4" fill="${pele}" ${ST}/>`;
  const quadril = `<path d="M-11.2 -43 Q-11.6 -37 -8 -35 H8 Q11.6 -37 11.2 -43Z" fill="${calca}" ${ST}/>`;
  return `<g transform="translate(${x} ${y})">${sombra(0, 0.8, 19)}${atras}${cab.tras}`
    + perna([-5.6, -38], pl, -1) + perna([5.6, -38], pr, 1) + quadril
    + `<rect x="-3.1" y="-78" width="6.2" height="8" fill="${tom(pele, -0.12)}"/>`
    + tronco + braco(ombroE, l, -1) + braco(ombroD, r, 1)
    + cabeca + cab.frente + chapeu + frente + '</g>';
}
const bone = cor => `<path d="M-10.9 -90.6 Q-11.6 -104.4 0 -104.4 Q11.6 -104.4 10.9 -90.6 Q0 -93.4 -10.9 -90.6Z" fill="${cor}" ${ST}/><path d="M3 -92 Q14 -93.6 19.4 -90 Q13.6 -88.2 2.6 -89.8Z" fill="${tom(cor, -0.18)}" ${ST}/><circle cx="0" cy="-104" r="1.4" fill="${tom(cor, -0.25)}"/>`;
const gorroChef = `<path d="M-10 -95 L-11 -102 Q-17 -106 -12 -112 Q-9 -118 -3 -114 Q0 -120 5 -115 Q11 -118 12.6 -111 Q16 -105 11 -102 L10 -95Z" fill="#fff" ${ST}/><path d="M-10.2 -96 H10.2 V-91.2 Q0 -93 -10.2 -91.2Z" fill="#F1F1F4" ${ST}/>`;
const mochila = `<path d="M-23 -66 Q-23 -71 -18 -71 H-10 V-40 H-19 Q-23 -40 -23 -44Z" fill="#E6823C" ${ST}/><rect x="-21.6" y="-56" width="9" height="10" rx="3" fill="#F29A52" ${ST}/>`;

const porta = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#A8683A" ${ST}/>`;
const mesa = (x, y, w, h = 36) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${MADEIRA}" ${ST}/><rect x="${x}" y="${y}" width="${w}" height="6" rx="2" fill="#E3AC6B" ${ST}/><rect x="${x + 2}" y="${y + 6.6}" width="${w - 4}" height="3" fill="${MADEIRA_ESC}" opacity=".25"/>`;
const planta = (x, y) => `<path d="M${x - 6} ${y - 12} H${x + 6} L${x + 4.6} ${y} H${x - 4.6}Z" fill="#E7896A" ${ST}/><path d="M${x} ${y - 12} Q${x - 9} ${y - 18} ${x - 8} ${y - 26} Q${x - 1} ${y - 22} ${x} ${y - 12}Z M${x} ${y - 12} Q${x + 8} ${y - 20} ${x + 6} ${y - 29} Q${x - 1} ${y - 24} ${x} ${y - 12}Z" fill="#5DAA6B" ${ST}/>`;
const janela = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#CDEBFF" ${ST}/><path d="M${x + w / 2} ${y} V${y + h} M${x} ${y + h / 2} H${x + w}" stroke="${OUT}" stroke-width="${LW}"/><path d="M${x + 4} ${y + h / 2 - 4} L${x + 12} ${y + 4}" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`;

// ---------- cenas (cada uma devolve o miolo do SVG)
const CENAS = {
  // verbos 1
  be: () => `<rect x="62" y="22" width="76" height="110" rx="2" fill="${MADEIRA_ESC}" ${ST}/><rect x="68" y="28" width="64" height="104" fill="#FFF4D6"/><path d="M68 28 h64 v20 Q100 40 68 52Z" fill="#fff" opacity=".5"/><path d="M132 28 L160 18 V124 L132 132Z" fill="#B97A3A" ${ST}/><path d="M138 34 L154 28 V60 L138 64Z M138 76 L154 72 V116 L138 120Z" fill="#A86C30" opacity=".6"/><circle cx="153" cy="76" r="3.2" fill="${OURO}" ${ST}/>`
    + `<rect x="18" y="104" width="34" height="28" rx="2" fill="#D9F0E0" opacity=".0"/>` + planta(38, 132)
    + pessoa(100, 131, { camisa: '#4C78D9', calca: '#36466E', r: [21, -62], rosto: 'sorriso' }),
  have: () => pessoa(100, 131, { estilo: 'longo', cabelo: '#7A3E2A', camisa: '#5DAA6B', calca: '#C9B48A', pele: PELE[0], l: [-12, -47], r: [12, -47] })
    + `<path d="M76 86 H124 L118 112 Q100 117 82 112Z" fill="#D9A25B" ${ST}/><path d="M79 94 H121 M81 102 H119" stroke="#A8713A" stroke-width="1.3"/><path d="M80 87 Q100 72 120 87" stroke="#A8713A" stroke-width="2.4" fill="none"/>${maca(88, 83)}${maca(101, 80)}${maca(113, 84)}`
    + `<g transform="translate(100 131)"><ellipse cx="-12" cy="-47" rx="4" ry="3.3" fill="${PELE[0]}" ${ST}/><ellipse cx="12" cy="-47" rx="4" ry="3.3" fill="${PELE[0]}" ${ST}/></g>`,
  do: () => `<rect x="0" y="40" width="200" height="56" fill="#E9F4FF" opacity=".7"/>` + [0, 1, 2, 3, 4, 5, 6].map(k => `<path d="M${k * 30} 40 V96" stroke="#CFE2F4" stroke-width="1"/>`).join('')
    + pessoa(84, 131, { camisa: '#E6823C', calca: '#3F5E9C', estilo: 'coque', cabelo: '#2E2A33', pele: PELE[2], l: [-6, -50], r: [10, -48] })
    + `<rect x="28" y="94" width="144" height="38" rx="2" fill="#DDE5F0" ${ST}/><rect x="26" y="90" width="148" height="7" rx="2" fill="#F2F6FB" ${ST}/><path d="M48 97 V132 M150 97 V132" stroke="#B9C4D6" stroke-width="1.2"/>`
    + `<path d="M146 90 V64 Q146 56 136 56 H128" stroke="${OUT}" stroke-width="7.4" fill="none" stroke-linecap="round"/><path d="M146 90 V64 Q146 56 136 56 H128" stroke="#C3CDDC" stroke-width="4.6" fill="none" stroke-linecap="round"/><path d="M128 62 V74" stroke="#6FC3FF" stroke-width="2.6" stroke-dasharray="3 4" stroke-linecap="round"/>`
    + `<ellipse cx="80" cy="82" rx="13" ry="12" fill="#fff" ${ST}/><ellipse cx="80" cy="82" rx="7.5" ry="7" fill="none" stroke="#C9D6EA" stroke-width="1.4"/><rect x="88" y="76" width="13" height="8" rx="3" fill="#F5C84B" ${ST} transform="rotate(-20 94 80)"/>`
    + `<g fill="#E6F6FF" ${ST}><circle cx="70" cy="68" r="3.4"/><circle cx="96" cy="66" r="2.6"/><circle cx="104" cy="72" r="2"/></g>`
    + `<g transform="translate(84 131)"><ellipse cx="-6" cy="-50" rx="4" ry="3.3" fill="${PELE[2]}" ${ST}/></g>`,
  go: () => `<rect x="0" y="122" width="200" height="28" fill="#E3D8C2"/><path d="M0 122 H200" stroke="#CBBEA4" stroke-width="1.4"/><path d="M10 136 H40 M120 140 H150" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`
    + `<g transform="translate(150 48)"><rect x="-2" y="0" width="4" height="74" fill="#8A93A8"/><rect x="-16" y="-16" width="32" height="22" rx="4" fill="#3F8F5A" ${ST}/><text x="0" y="-1" text-anchor="middle" font-family="Outfit,system-ui,sans-serif" font-weight="800" font-size="7.4" fill="#fff">SCHOOL</text></g>`
    + pessoa(84, 128, { atras: mochila, camisa: '#5DAA6B', calca: '#4A5578', vira: 1, pl: [-12, -1], pr: [12, -4], l: [-14, -42], r: [18, -46] })
    + `<path d="M40 70 H56 M34 84 H52 M40 98 H54" stroke="#A9B3C8" stroke-width="2.6" stroke-linecap="round"/>`,
  get: () => `<rect x="150" y="30" width="44" height="102" fill="#F7E9D3" ${ST}/><rect x="158" y="40" width="28" height="92" rx="1" fill="#B97A3A" ${ST}/><circle cx="180" cy="88" r="2.2" fill="${OURO}"/>`
    + pessoa(54, 131, { chapeu: bone('#E6823C'), camisa: '#E6823C', calca: '#4A4F66', r: [30, -50], l: [-15.5, -38] })
    + pessoa(128, 131, { estilo: 'cacheado', cabelo: '#2E2A33', pele: PELE[2], camisa: '#F4EAD8', calca: '#5A79B8', l: [-24, -50], rosto: 'sorriso' })
    + caixa(80, 70, 30, 26) + `<g transform="translate(54 131)"><ellipse cx="30" cy="-50" rx="4" ry="3.3" fill="${PELE[0]}" ${ST}/></g><g transform="translate(128 131)"><ellipse cx="-24" cy="-50" rx="4" ry="3.3" fill="${PELE[2]}" ${ST}/></g>`
    + `<path d="M88 52 l5 5 l9 -10" stroke="#2F9E5A" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  write: () => `<rect x="0" y="108" width="200" height="42" fill="#E3AC6B"/><path d="M0 108 H200" stroke="${OUT}" stroke-width="${LW}"/>`
    + `<g transform="rotate(-6 96 74)"><rect x="34" y="24" width="112" height="100" rx="5" fill="#fff" ${ST}/><path d="M48 50 H136 M48 64 H136 M48 78 H136 M48 92 H136 M48 106 H136" stroke="#BED3F2" stroke-width="1.3"/><path d="M46 36 V118" stroke="#E5383B" stroke-width="1.2" opacity=".55"/>`
    + `<path d="M54 60 q4 -10 7 0 t7 0 t7 0 t6 0 M54 74 q5 -8 8 0 t8 0 t8 0 M54 88 q4 -7 7 0 t7 0" stroke="#3554B8" stroke-width="2" fill="none" stroke-linecap="round"/>`
    + [30, 48, 66, 84, 102].map(y => `<rect x="29" y="${y}" width="11" height="4.4" rx="2.2" fill="#8A91A8" ${ST}/>`).join('') + '</g>'
    + tracoC('M210 150 L176 112 L140 98', 13, '#5DAA6B') + `<path d="M162 104 L176 112" stroke="${tom('#5DAA6B', 0.2)}" stroke-width="3" stroke-linecap="round" opacity=".6"/>`
    + `<path d="M100 92 L134 62" stroke="${OUT}" stroke-width="7.2" stroke-linecap="round"/><path d="M100 92 L134 62" stroke="#3F6FD8" stroke-width="4.6" stroke-linecap="round"/><path d="M96 97 L101 91.6" stroke="${OUT}" stroke-width="2.2" stroke-linecap="round"/>`
    + `<path d="M126 92 Q122 84 130 80 Q138 76 144 84 Q150 92 142 100 Q132 104 126 92Z" fill="${PELE[1]}" ${ST}/><path d="M124 86 Q118 80 122 74 Q127 72 130 78" fill="${PELE[1]}" ${ST}/><path d="M131 86 q5 1 8 5" stroke="${tom(PELE[1], -0.28)}" stroke-width="1" fill="none" stroke-linecap="round"/>`,
  make: () => `<rect x="0" y="30" width="200" height="70" fill="#FFFFFF" opacity=".35"/><rect x="126" y="50" width="62" height="5" rx="2" fill="${MADEIRA}" ${ST}/><path d="M134 50 V36 Q134 32 138 32 H144 Q148 32 148 36 V50Z" fill="#CDEBFF" ${ST}/><rect x="133" y="29" width="16" height="5" rx="2" fill="#E5484D" ${ST}/><path d="M156 50 V40 Q156 36 160 36 H166 Q170 36 170 40 V50Z" fill="#FFE7A8" ${ST}/><rect x="155" y="33" width="16" height="5" rx="2" fill="#5DAA6B" ${ST}/><path d="M176 50 V42 Q176 39 179 39 H183 Q186 39 186 42 V50Z" fill="#F2C9D6" ${ST}/>`
    + pessoa(60, 131, { chapeu: gorroChef, camisa: '#FAFAFC', calca: '#4A4F66', pele: PELE[1], r: [36, -52], l: [22, -46], manga: 'longa' })
    + mesa(22, 100, 156, 32)
    + `<ellipse cx="128" cy="100" rx="32" ry="5" fill="#fff" ${ST}/><path d="M104 98 V80 Q104 76 108 76 H148 Q152 76 152 80 V98Z" fill="#F2A6B8" ${ST}/><path d="M104 84 Q110 92 116 84 T128 84 T140 84 T152 84" fill="#FFF7FA" ${ST}/><ellipse cx="128" cy="76" rx="24" ry="5" fill="#FFF3F6" ${ST}/>`
    + `<circle cx="116" cy="72" r="4.2" fill="#E5484D" ${ST}/><circle cx="128" cy="70" r="4.2" fill="#E5484D" ${ST}/><circle cx="140" cy="72" r="4.2" fill="#E5484D" ${ST}/>${brilho(166, 82, 6)}${brilho(100, 60, 4)}`
    + `<g transform="translate(96 78) rotate(-24)"><path d="M0 0 V-14" stroke="${OUT}" stroke-width="4" stroke-linecap="round"/><path d="M0 0 V-14" stroke="#8A6A4A" stroke-width="2.2" stroke-linecap="round"/><path d="M0 -14 Q-6 -22 0 -30 Q6 -22 0 -14Z M0 -14 Q-2.6 -22 0 -30 Q2.6 -22 0 -14" fill="none" stroke="${OUT}" stroke-width="1.2"/></g>`,
  know: () => pessoa(58, 131, { camisa: '#4C78D9', calca: '#36466E', r: [38, -46], barba: true, cabelo: '#4A3020' })
    + pessoa(142, 131, { estilo: 'longo', cabelo: '#2E2A33', pele: PELE[2], camisa: '#A98BE6', calca: '#4A4F66', l: [-38, -46], rosto: 'sorriso' })
    + `<g transform="translate(100 39)"><rect x="-22" y="-15" width="44" height="25" rx="12.5" fill="#fff" ${ST}/><path d="M-6 9.4 L-11 18 L5 9.4Z" fill="#fff" ${ST}/><path d="M-5.4 9.4 H4.4" stroke="#fff" stroke-width="2.6"/><text x="0" y="3.4" text-anchor="middle" font-family="Outfit,system-ui,sans-serif" font-weight="800" font-size="14" fill="${OUT}">Hi!</text></g>`,
  give: () => pessoa(56, 131, { camisa: '#E6823C', calca: '#3F5E9C', r: [38, -54], estilo: 'cacheado', cabelo: '#3A2A20', pele: PELE[2] })
    + pessoa(144, 131, { estilo: 'longo', cabelo: '#C27B3E', camisa: '#5DAA6B', calca: '#4A4F66', l: [-36, -50], rosto: 'sorriso' })
    + maca(100, 72, 9) + `<g transform="translate(56 131)"><ellipse cx="38" cy="-54" rx="4" ry="3.3" fill="${PELE[2]}" ${ST}/></g><g transform="translate(144 131)"><ellipse cx="-36" cy="-50" rx="4" ry="3.3" fill="${PELE[0]}" ${ST}/></g>`
    + coracao(100, 44, 0.9),
  // verbos 2
  think: () => pessoa(76, 131, { camisa: '#A98BE6', calca: '#4A4F66', rosto: 'pensa', estilo: 'coque', cabelo: '#7A3E2A', r: [3, -76], l: [11, -54] })
    + `<g fill="#fff" ${ST}><circle cx="104" cy="60" r="2.6"/><circle cx="114" cy="49" r="4.4"/><path d="M122 36 Q120 18 140 16 Q150 6 164 14 Q182 12 184 28 Q194 40 178 50 Q168 58 150 52 Q130 58 124 46 Q114 42 122 36Z"/></g><text x="152" y="44" text-anchor="middle" font-family="Outfit,system-ui,sans-serif" font-weight="800" font-size="28" fill="#4C78D9">?</text>`,
  see: () => `<path d="M200 70 Q160 62 116 74" stroke="#7A4A1E" stroke-width="5.4" fill="none" stroke-linecap="round"/><path d="M150 68 q-2 -14 10 -16 q8 0 6 14 Z M176 66 q8 -14 20 -8 q-2 12 -20 8Z" fill="#5DAA6B" ${ST}/>`
    + `<g transform="translate(144 60)"><path d="M-10 0 Q-10 -9 0 -9 Q10 -9 12 0 Q10 7 0 7 Q-8 7 -10 0Z" fill="#3F8CFF" ${ST}/><circle cx="-8" cy="-7" r="6" fill="#3F8CFF" ${ST}/><path d="M-13.6 -7.4 l-6 2.4 l6 1.6Z" fill="#F5C84B" ${ST}/><circle cx="-9" cy="-8.4" r="1.3" fill="${OUT}"/><path d="M8 -2 l12 5" stroke="#2F6FDE" stroke-width="3.2" stroke-linecap="round"/><path d="M-2 -4 q6 -4 10 1" stroke="#7FB4FF" stroke-width="2" fill="none" stroke-linecap="round"/></g>`
    + pessoa(64, 131, { estilo: 'longo', cabelo: '#7A3E2A', camisa: '#F4EAD8', calca: '#4F77B5', rosto: 'uau', r: [30, -86] })
    + `<path d="M80 44 Q106 36 128 50" stroke="#4C78D9" stroke-width="1.8" stroke-dasharray="2 5" fill="none" stroke-linecap="round"/>`,
  look: () => `<path d="M0 132 L50 70 L84 112 L120 56 L176 132Z" fill="#9FB7D6" ${ST}/><path d="M120 56 L108 74 L116 72 L120 78 L128 70 L134 74Z" fill="#fff"/><path d="M50 70 L42 80 L50 78 L56 82Z" fill="#fff"/><path d="M0 132 L40 94 L82 132Z" fill="#7FB36B" ${ST}/><circle cx="170" cy="32" r="12" fill="#FFD34D" ${ST}/>`
    + pessoa(92, 131, { chapeu: bone('#E6823C'), camisa: '#5DAA6B', calca: '#4A5578', l: [-8, -84], r: [8, -84] })
    + `<g transform="translate(92 131)"><rect x="-13" y="-96" width="11" height="15" rx="4" fill="#3A3F5A" ${ST}/><rect x="2" y="-96" width="11" height="15" rx="4" fill="#3A3F5A" ${ST}/><rect x="-3" y="-91" width="6" height="5" fill="#3A3F5A" ${ST}/><circle cx="-7.5" cy="-81.6" r="4.2" fill="#8FD3FF" ${ST}/><circle cx="7.5" cy="-81.6" r="4.2" fill="#8FD3FF" ${ST}/><circle cx="-8.6" cy="-82.8" r="1.2" fill="#fff"/><circle cx="6.4" cy="-82.8" r="1.2" fill="#fff"/></g>`,
  want: () => `<rect x="104" y="58" width="86" height="74" rx="4" fill="#DDF0FF" ${ST}/><path d="M106 94 H188" stroke="${OUT}" stroke-width="${LW}"/><rect x="104" y="58" width="86" height="74" rx="4" fill="#fff" opacity=".25"/>`
    + `<path d="M114 92 V80 Q114 76 118 76 H132 Q136 76 136 80 V92Z" fill="#F2A6B8" ${ST}/><circle cx="125" cy="73" r="3.6" fill="#E5484D" ${ST}/><rect x="146" y="78" width="26" height="14" rx="3" fill="#B9794A" ${ST}/><path d="M146 84 H172" stroke="#8A5A2B" stroke-width="1"/><rect x="114" y="110" width="26" height="14" rx="6" fill="#F5C84B" ${ST}/><circle cx="158" cy="117" r="8.6" fill="#F7E2A8" ${ST}/><circle cx="158" cy="117" r="3" fill="#E5484D"/><path d="M110 64 L120 64" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`
    + pessoa(62, 131, { estilo: 'longo', cabelo: '#2E2A33', pele: PELE[2], camisa: '#A98BE6', calca: '#4A4F66', rosto: 'quer', l: [-8, -56], r: [8, -56] })
    + coracao(94, 40, 1.1),
  find: () => `<rect x="118" y="92" width="78" height="7" rx="2" fill="${MADEIRA}" ${ST}/><path d="M126 99 V130 M188 99 V130" stroke="${MADEIRA_ESC}" stroke-width="5" stroke-linecap="round"/>`
    + `<path d="M150 92 V86 Q150 82 154 82 H166 Q170 82 170 86 V92Z" fill="#E6823C" opacity=".0"/>`
    + pessoa(70, 131, { camisa: '#4C78D9', calca: '#36466E', rosto: 'uau', r: [26, -100], l: [-15, -42], pele: PELE[1], estilo: 'cacheado', cabelo: '#2E2A33' })
    + `<g transform="translate(104 24) rotate(28)"><circle cx="0" cy="0" r="7.6" fill="none" stroke="${OUT}" stroke-width="6.4"/><circle cx="0" cy="0" r="7.6" fill="none" stroke="${OURO}" stroke-width="3.8"/><rect x="6" y="-2.8" width="24" height="5.6" rx="2" fill="${OURO}" ${ST}/><rect x="21" y="2.8" width="4.6" height="7" fill="${OURO}" ${ST}/></g>${brilho(140, 40, 7)}${brilho(96, 12, 4.6)}${brilho(126, 10, 3.6)}`,
  work: () => `<rect x="12" y="30" width="38" height="30" rx="2" fill="#EEF3F9" ${ST}/><path d="M18 40 H44 M18 47 H38" stroke="#9AA6C0" stroke-width="2" stroke-linecap="round"/>`
    + pessoa(78, 129, { camisa: '#4C78D9', calca: '#36466E', l: [20, -44], r: [33, -44], manga: 'longa', estilo: 'longo', cabelo: '#5A3A22', pele: PELE[1] })
    + `<rect x="106" y="44" width="56" height="40" rx="4" fill="#5E6680" ${ST}/><rect x="111" y="49" width="46" height="30" rx="2" fill="#CDEBFF"/><path d="M116 56 H150 M116 64 H142 M116 72 H148" stroke="#3F6FD8" stroke-width="2.2" stroke-linecap="round"/><path d="M130 84 V92 M120 92 H140" stroke="${OUT}" stroke-width="2.6" stroke-linecap="round"/>`
    + mesa(26, 92, 148, 40) + `<rect x="40" y="106" width="42" height="18" rx="2" fill="#B97A3A" ${ST}/><circle cx="61" cy="115" r="2.4" fill="${OURO}"/>`
    + `<rect x="94" y="88" width="40" height="5" rx="1.5" fill="#D9DFEA" ${ST}/>` + planta(176, 92),
  call: () => janela(130, 26, 46, 40)
    + pessoa(92, 131, { estilo: 'longo', cabelo: '#7A3E2A', camisa: '#5DAA6B', calca: '#4F77B5', r: [12, -82], rosto: 'sorriso' })
    + `<g transform="translate(92 131)"><rect x="9" y="-96" width="9" height="17" rx="2.6" fill="#3A3F5A" ${ST} transform="rotate(14 13 -88)"/><ellipse cx="12" cy="-82" rx="4" ry="3.3" fill="${PELE[0]}" ${ST}/></g>`
    + `<path d="M118 34 q7 8 0 16 M125 28 q12 14 0 28" stroke="#4C78D9" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
    + `<g transform="translate(48 44)"><rect x="-18" y="-14" width="36" height="22" rx="11" fill="#fff" ${ST}/><path d="M6 7 L12 15 L-2 7Z" fill="#fff" ${ST}/><path d="M-1.6 7 H5.6" stroke="#fff" stroke-width="2.4"/>${coracao(0, -1, 0.62)}</g>`,
  need: () => `<rect x="128" y="98" width="64" height="7" rx="2" fill="${MADEIRA}" ${ST}/><path d="M136 105 V132 M184 105 V132" stroke="${MADEIRA_ESC}" stroke-width="5" stroke-linecap="round"/>`
    + `<path d="M144 60 H176 L172 98 H148Z" fill="#EAF6FF" ${ST}/><path d="M146 74 H174 L171.6 97 H148.4Z" fill="#8FD3FF"/><path d="M150 66 L152 92" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`
    + pessoa(78, 131, { estilo: 'longo', cabelo: '#2E2A33', pele: PELE[2], camisa: '#F5C84B', calca: '#4A4F66', rosto: 'triste', r: [42, -60] })
    + `<path d="M98 50 q-4.6 7 0 11 q4.6 -4 0 -11Z M58 54 q-4.6 7 0 11 q4.6 -4 0 -11Z" fill="#8FD3FF" ${ST}/><circle cx="170" cy="26" r="11" fill="#FFD34D" ${ST}/><path d="M170 7 V2 M189 26 H196 M151 26 H144 M183 13 L188 8 M157 13 L152 8" stroke="#FFB800" stroke-width="2.8" stroke-linecap="round"/>`,
  leave: () => `<rect x="124" y="22" width="68" height="110" rx="2" fill="${MADEIRA_ESC}" ${ST}/><rect x="130" y="28" width="56" height="104" fill="#BFE6FF"/><circle cx="168" cy="52" r="9" fill="#FFD34D" ${ST}/><path d="M130 132 V100 Q148 88 186 104 V132Z" fill="#7FCB5B" ${ST}/><path d="M138 70 q8 -6 16 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`
    + pessoa(82, 130, { atras: mochila, camisa: '#5DAA6B', calca: '#4A5578', vira: 1, pl: [-12, -1], pr: [12, -4], l: [-15, -42], r: [19, -46] })
    + `<path d="M108 96 H130" stroke="#4C78D9" stroke-width="2.6" stroke-dasharray="3 5" stroke-linecap="round"/><path d="M126 90 l7 6 l-7 6" stroke="#4C78D9" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  // cumprimentos (também aparecem nas primeiras aulas)
  hello: () => janela(132, 30, 48, 42) + planta(160, 132)
    + pessoa(88, 131, { estilo: 'cacheado', cabelo: '#2E2A33', pele: PELE[2], camisa: '#F5C84B', calca: '#4A4F66', rosto: 'sorriso', r: [20, -98] })
    + `<path d="M118 22 q6 4 6 10 M124 16 q9 6 9 16 M104 22 q-5 3 -6 8" stroke="#4C78D9" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  bye: () => `<rect x="18" y="22" width="68" height="110" rx="2" fill="${MADEIRA_ESC}" ${ST}/><rect x="24" y="28" width="56" height="104" fill="#BFE6FF"/><path d="M24 132 V104 Q48 92 80 106 V132Z" fill="#7FCB5B" ${ST}/><circle cx="40" cy="50" r="8" fill="#FFD34D" ${ST}/>`
    + pessoa(116, 130, { atras: mochila, camisa: '#4C78D9', calca: '#4A5578', vira: -1, pl: [-12, -4], pr: [11, -1], l: [-22, -96], r: [16, -42], rosto: 'sorriso' })
    + `<path d="M82 24 q-6 4 -6 10 M76 18 q-9 6 -9 16" stroke="#4C78D9" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  'thank you': () => pessoa(58, 131, { camisa: '#E6823C', calca: '#3F5E9C', r: [36, -52], estilo: 'curto', cabelo: '#4A3020', pele: PELE[1] })
    + pessoa(142, 131, { estilo: 'longo', cabelo: '#C27B3E', camisa: '#A98BE6', calca: '#4A4F66', l: [-4, -62], r: [4, -62], rosto: 'sorriso' })
    + `<rect x="84" y="66" width="24" height="20" rx="2" fill="#FF8FA8" ${ST}/><rect x="93" y="66" width="6" height="20" fill="#FFE08A"/><path d="M84 72 H108" stroke="${OUT}" stroke-width="${LW}"/><path d="M96 66 q-8 -9 -11 -2 q2 4 11 2 q9 2 11 -2 q-3 -7 -11 2Z" fill="#FFE08A" ${ST}/>`
    + `<g transform="translate(58 131)"><ellipse cx="36" cy="-52" rx="4" ry="3.3" fill="${PELE[1]}" ${ST}/></g>` + coracao(112, 34, 1),
  sorry: () => `<rect x="0" y="122" width="200" height="28" fill="#E9DCC6"/>`
    + pessoa(78, 128, { estilo: 'coque', cabelo: '#5A3A22', camisa: '#5DAA6B', calca: '#3F5E9C', rosto: 'triste', l: [-3, -58], r: [3, -58] })
    + `<g transform="translate(138 120) rotate(78)"><path d="M-9 -12 H9 L7 10 H-7Z" fill="#fff" ${ST}/><path d="M-9 -12 H9" stroke="${OUT}" stroke-width="${LW}"/></g><path d="M126 128 Q150 120 176 128 Q160 134 132 132Z" fill="#8FD3FF" ${ST}/>`
    + `<path d="M100 40 q-4 -6 0 -10 M108 44 q4 -6 0 -10" stroke="#9AA6C0" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
  'good morning': () => `<rect x="112" y="22" width="72" height="70" rx="3" fill="#FFE6B8" ${ST}/><circle cx="148" cy="72" r="16" fill="#FFC93C" ${ST}/><path d="M112 74 Q148 62 184 74 V92 H112Z" fill="#7FCB5B" ${ST}/><path d="M148 22 V92 M112 50 H184" stroke="${OUT}" stroke-width="${LW}"/><path d="M148 44 V36 M128 52 L122 46 M168 52 L174 46" stroke="#F2A800" stroke-width="2.4" stroke-linecap="round"/>`
    + pessoa(70, 131, { estilo: 'curto', cabelo: '#2E2A33', pele: PELE[3], camisa: '#F4EAD8', calca: '#6F8FE6', rosto: 'sorriso', l: [-12, -100], r: [12, -100], manga: 'longa' }),
  'good night': () => `<rect x="128" y="16" width="56" height="46" rx="3" fill="#24305E" ${ST}/><path d="M166 26 a11 11 0 1 0 8 18 a8.4 8.4 0 1 1 -8 -18Z" fill="#FFE08A"/><circle cx="140" cy="28" r="1.6" fill="#fff"/><circle cx="148" cy="50" r="1.2" fill="#fff"/><circle cx="138" cy="44" r="1" fill="#fff"/>`
    + `<rect x="98" y="72" width="12" height="56" rx="3" fill="${MADEIRA_ESC}" ${ST}/><rect x="104" y="100" width="88" height="12" rx="3" fill="${MADEIRA}" ${ST}/><path d="M106 84 Q106 80 112 80 H190 V102 H106Z" fill="#6F8FE6" ${ST}/><path d="M110 82 Q110 74 122 74 Q134 74 134 82 Q134 88 122 88 Q110 88 110 82Z" fill="#fff" ${ST}/>`
    + pessoa(56, 131, { estilo: 'longo', cabelo: '#7A3E2A', camisa: '#9DB7F5', calca: '#9DB7F5', manga: 'longa', rosto: 'sorriso', sapato: '#E6823C', l: [-15, -40], r: [20, -58] })
    + `<g transform="translate(80 75) rotate(-10)"><rect x="-10" y="-7" width="20" height="14" rx="6" fill="#fff" ${ST}/></g>`
    + `<text x="78" y="30" font-family="Outfit,system-ui,sans-serif" font-weight="800" font-size="13" fill="#6F8FE6">z</text><text x="88" y="20" font-family="Outfit,system-ui,sans-serif" font-weight="800" font-size="10" fill="#6F8FE6">z</text>`,
  // objetos
  door: () => `<rect x="58" y="16" width="84" height="116" rx="3" fill="${MADEIRA_ESC}" ${ST}/><rect x="65" y="23" width="70" height="109" fill="#B97A3A" ${ST}/>`
    + [[72, 31, 26, 42], [102, 31, 26, 42], [72, 81, 26, 44], [102, 81, 26, 44]].map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2.5" fill="#CB8D4F" stroke="#7A4A1E" stroke-width="1.2"/><path d="M${x + 3} ${y + 3} H${x + w - 3}" stroke="#E0A968" stroke-width="1.6" stroke-linecap="round"/>`).join('')
    + `<circle cx="126" cy="80" r="4.4" fill="${OURO}" ${ST}/><circle cx="125" cy="79" r="1.4" fill="#FFF0B8"/><rect x="40" y="128" width="120" height="4" rx="2" fill="#7A6A58" opacity=".4"/>`,
  key: () => `<g transform="rotate(-30 100 76)"><circle cx="58" cy="76" r="23" fill="none" stroke="${OUT}" stroke-width="12"/><circle cx="58" cy="76" r="23" fill="none" stroke="${OURO}" stroke-width="9.4"/><circle cx="58" cy="76" r="23" fill="none" stroke="#FFE08A" stroke-width="2" stroke-dasharray="20 120" stroke-linecap="round"/><rect x="78" y="70" width="84" height="12" rx="5" fill="${OURO}" ${ST}/><rect x="132" y="82" width="9" height="15" rx="2" fill="${OURO}" ${ST}/><rect x="148" y="82" width="9" height="10" rx="2" fill="${OURO}" ${ST}/><path d="M84 74 H150" stroke="#FFE08A" stroke-width="2.2" stroke-linecap="round"/></g><path d="M44 104 q-8 10 -2 24" stroke="#C25F1F" stroke-width="2" fill="none" stroke-linecap="round" opacity=".0"/>${brilho(158, 36, 7)}${brilho(38, 110, 5)}`,
  chair: () => sombra(100, 133, 42) + `<rect x="72" y="92" width="8" height="40" rx="2" fill="${MADEIRA_ESC}" ${ST}/><rect x="120" y="92" width="8" height="40" rx="2" fill="${MADEIRA_ESC}" ${ST}/><rect x="66" y="22" width="9" height="72" rx="3" fill="${MADEIRA}" ${ST}/><rect x="125" y="22" width="9" height="72" rx="3" fill="${MADEIRA}" ${ST}/>`
    + [30, 49, 68].map(y => `<rect x="74" y="${y}" width="52" height="10" rx="2" fill="#D9A25B" ${ST}/>`).join('')
    + `<rect x="58" y="86" width="84" height="14" rx="5" fill="#E0A968" ${ST}/><rect x="62" y="88" width="76" height="3" rx="1.5" fill="#F2C88F"/><rect x="62" y="100" width="9" height="32" rx="2" fill="${MADEIRA}" ${ST}/><rect x="129" y="100" width="9" height="32" rx="2" fill="${MADEIRA}" ${ST}/>`,
  bed: () => sombra(100, 133, 76) + `<rect x="24" y="50" width="14" height="78" rx="4" fill="${MADEIRA_ESC}" ${ST}/><rect x="162" y="84" width="14" height="44" rx="4" fill="${MADEIRA_ESC}" ${ST}/><rect x="32" y="96" width="138" height="14" rx="3" fill="${MADEIRA}" ${ST}/>`
    + `<rect x="36" y="74" width="132" height="24" rx="7" fill="#fff" ${ST}/><path d="M72 68 Q72 64 78 64 H164 Q170 64 170 70 V98 H72Z" fill="#6F8FE6" ${ST}/><path d="M86 66 V98 M100 66 V98 M114 66 V98" stroke="#fff" stroke-width="2.4" opacity=".45"/><path d="M72 76 H170" stroke="#5574CC" stroke-width="1.2"/><path d="M40 70 Q40 60 58 60 Q76 60 76 70 Q76 78 58 78 Q40 78 40 70Z" fill="#fff" ${ST}/>`
    + `<text x="118" y="44" font-family="Outfit,system-ui,sans-serif" font-weight="800" font-size="18" fill="#6F8FE6">Z</text><text x="134" y="32" font-family="Outfit,system-ui,sans-serif" font-weight="800" font-size="14" fill="#6F8FE6">z</text><text x="146" y="22" font-family="Outfit,system-ui,sans-serif" font-weight="800" font-size="10" fill="#6F8FE6">z</text>`,
  book: () => sombra(100, 130, 80) + `<path d="M26 40 Q62 28 100 42 Q138 28 174 40 V114 Q138 102 100 116 Q62 102 26 114Z" fill="#3F6FD8" ${ST}/>`
    + `<path d="M32 44 Q64 34 100 46 V112 Q64 98 32 108Z" fill="#fff" ${ST}/><path d="M168 44 Q136 34 100 46 V112 Q136 98 168 108Z" fill="#FAFBFF" ${ST}/><path d="M100 46 V112" stroke="#C8D3EA" stroke-width="3"/>`
    + `<path d="M44 58 Q64 52 88 60 M44 72 Q64 66 88 74 M44 86 Q64 80 88 88 M112 60 Q136 52 156 58 M112 74 Q136 66 156 72 M112 88 Q136 80 156 86" stroke="#B5CBEF" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M130 100 V128 L136 122 L142 128 V100Z" fill="#E5484D" ${ST}/>`,
  phone: () => sombra(100, 134, 38) + `<rect x="68" y="12" width="64" height="118" rx="13" fill="#2F3448" ${ST}/><rect x="73.5" y="20" width="53" height="102" rx="8" fill="#EAF3FF"/><rect x="91" y="15" width="18" height="3.6" rx="1.8" fill="#151826"/>`
    + [[80, 30, '#3F6FD8'], [96, 30, '#5DAA6B'], [112, 30, '#F5C84B'], [80, 46, '#E5484D'], [96, 46, '#A98BE6'], [112, 46, '#E6823C']].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="12" height="12" rx="3.6" fill="${c}"/>`).join('')
    + `<rect x="80" y="68" width="30" height="13" rx="6.5" fill="#fff" ${ST}/><rect x="90" y="87" width="30" height="13" rx="6.5" fill="#3F6FD8" ${ST}/><rect x="80" y="106" width="22" height="9" rx="4.5" fill="#fff" ${ST}/><path d="M76 24 L92 24" stroke="#fff" stroke-width="2" opacity="0"/>`
    + `<path d="M120 24 L126 34" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>`,
  bag: () => sombra(100, 133, 40) + `<path d="M88 36 Q100 14 112 36" stroke="${OUT}" stroke-width="7.6" fill="none" stroke-linecap="round"/><path d="M88 36 Q100 14 112 36" stroke="#C25F1F" stroke-width="4.6" fill="none" stroke-linecap="round"/>`
    + `<path d="M58 70 Q50 96 58 120 M142 70 Q150 96 142 120" stroke="${OUT}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M58 70 Q50 96 58 120 M142 70 Q150 96 142 120" stroke="#C25F1F" stroke-width="3.4" fill="none" stroke-linecap="round"/>`
    + `<path d="M64 58 Q64 30 100 30 Q136 30 136 58 V118 Q136 130 124 130 H76 Q64 130 64 118Z" fill="#E6823C" ${ST}/><path d="M118 34 Q134 40 134 60 V118 Q134 126 126 128 Q126 60 118 34Z" fill="#C9651F" opacity=".45"/><rect x="76" y="84" width="48" height="34" rx="9" fill="#F29A52" ${ST}/><path d="M76 96 H124" stroke="#C9651F" stroke-width="1.2"/><path d="M78 62 Q100 72 122 62" stroke="#B85F1F" stroke-width="2.2" fill="none" stroke-linecap="round"/><rect x="94" y="91" width="12" height="9" rx="2.5" fill="${OURO}" ${ST}/>`,
  glass: () => sombra(100, 134, 32) + `<path d="M124 12 H112 L100 98" stroke="${OUT}" stroke-width="6.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M124 12 H112 L100 98" stroke="#E5484D" stroke-width="4.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="M68 28 H132 L123 124 Q122 132 114 132 H86 Q78 132 77 124Z" fill="#EAF6FF" ${ST} opacity=".95"/><path d="M71 54 H129 L122.2 122 Q121.4 128 114 128 H86 Q78.6 128 77.8 122Z" fill="#FFFFFF" stroke="#C8D9EA" stroke-width="1.4"/><path d="M71 54 Q100 60 129 54" stroke="#C8D9EA" stroke-width="1.4" fill="none"/><path d="M82 64 L86 118" stroke="#DCEBFA" stroke-width="4.6" stroke-linecap="round"/>`,
  clock: () => sombra(100, 134, 42) + `<circle cx="68" cy="34" r="13" fill="#E5484D" ${ST}/><circle cx="132" cy="34" r="13" fill="#E5484D" ${ST}/><path d="M100 22 V34 M92 22 H108" stroke="${OUT}" stroke-width="3.6" stroke-linecap="round"/>`
    + `<path d="M70 120 L62 134 M130 120 L138 134" stroke="${OUT}" stroke-width="4.6" stroke-linecap="round"/><circle cx="100" cy="82" r="49" fill="#E5484D" ${ST}/><circle cx="100" cy="82" r="40" fill="#fff" ${ST}/><path d="M66 70 A36 36 0 0 1 90 47" stroke="#F2F4FA" stroke-width="4" fill="none" stroke-linecap="round"/>`
    + [...Array(12)].map((_, k) => { const a = k * Math.PI / 6, ri = k % 3 ? 34.5 : 31.5; return `<path d="M${(100 + ri * Math.sin(a)).toFixed(1)} ${(82 - ri * Math.cos(a)).toFixed(1)} L${(100 + 37.5 * Math.sin(a)).toFixed(1)} ${(82 - 37.5 * Math.cos(a)).toFixed(1)}" stroke="${OUT}" stroke-width="${k % 3 ? 1.4 : 2.4}" stroke-linecap="round"/>`; }).join('')
    + `<path d="M100 82 L81 71" stroke="${OUT}" stroke-width="4" stroke-linecap="round"/><path d="M100 82 L130 65" stroke="${OUT}" stroke-width="2.6" stroke-linecap="round"/><circle cx="100" cy="82" r="3.6" fill="#E5484D" ${ST}/>`,
};

const FUNDOS = ['#FFF1D6', '#DDEFFF', '#E1F6EA', '#FFE6EE', '#ECE5FF'];
const ORDEM = Object.keys(CENAS);

export const svgDe = en => {
  const f = CENAS[en];
  if (!f) return '';
  const fundo = FUNDOS[ORDEM.indexOf(en) % FUNDOS.length];
  return `<svg class="vocab__svg" viewBox="0 0 200 150" role="img" aria-label="${en}" focusable="false"><defs><radialGradient id="luz-${en.replace(/\W/g, '')}" cx=".3" cy=".2" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="200" height="150" fill="${fundo}"/><rect width="200" height="150" fill="url(#luz-${en.replace(/\W/g, '')})"/><rect y="131" width="200" height="19" fill="#2B2F4A" opacity=".06"/>${f()}</svg>`;
};
