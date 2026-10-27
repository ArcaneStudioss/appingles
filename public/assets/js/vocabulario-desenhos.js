// Desenhos do vocabulário: pessoas e objetos em SVG fixo (sem dados do aluno), no estilo de cartaz de aula.
// Cada cena cabe em 200x150; o chão fica em y=132. Pessoas têm ~106 de altura (pés em y, cabeça em y-106).
const OUT = '#2B2F4A';
const PELE = ['#F2C6A0', '#D9A171', '#A8714A'];
const OURO = '#F2B632', MADEIRA = '#C98B4B', MADEIRA_ESC = '#8A5A2B';

const brilho = (x, y, r = 6) => `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z" fill="#FFD34D" stroke="#E0A400" stroke-width=".8"/>`;
const sombra = (x, y, rx) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${Math.max(2.5, rx / 7)}" fill="#2B2F4A" opacity=".16"/>`;
const membro = (a, b, larg, cor) => `<path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" stroke="${OUT}" stroke-width="${larg + 3}" stroke-linecap="round"/><path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" stroke="${cor}" stroke-width="${larg}" stroke-linecap="round"/>`;
const maca = (x, y, r = 7) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#E5383B" stroke="${OUT}" stroke-width="1.4"/><path d="M${x} ${y - r} q1 -5 5 -6" stroke="#2F7D32" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="${x - r / 3}" cy="${y - r / 3}" r="${r / 5}" fill="#fff" opacity=".6"/>`;
const caixa = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#C98B4B" stroke="${OUT}" stroke-width="1.6"/><rect x="${x + w / 2 - 4}" y="${y}" width="8" height="${h}" fill="#E8C48A" opacity=".85"/>`;

// pessoa em pé, de frente. Posições de mãos e pés em coordenadas locais (pés em 0,0).
function pessoa(x, y, o = {}) {
  const { pele = PELE[0], cabelo = '#5A3A22', estilo = 'curto', camisa = '#3F6FD8', calca = '#4F77B5', rosto = 'feliz', atras = '', frente = '', chapeu = '' } = o;
  const bl = o.l || [-17, -34], br = o.r || [17, -34], pl = o.pl || [-7, -3], pr = o.pr || [7, -3];
  const cabeloTras = estilo === 'longo' ? `<path d="M-15 -86 Q-16 -105 0 -105 Q16 -105 15 -86 L17 -60 Q0 -55 -17 -60Z" fill="${cabelo}" stroke="${OUT}" stroke-width="1.4"/>` : '';
  const cabeloFrente = estilo === 'longo'
    ? `<path d="M-13 -88 Q-4 -99 13 -88 Q9 -100 0 -101 Q-12 -101 -13 -88Z" fill="${cabelo}"/>`
    : `<path d="M-13 -87 Q-14 -102 0 -102 Q14 -102 13 -87 Q6 -94 -2 -92 Q-8 -90 -13 -87Z" fill="${cabelo}" stroke="${OUT}" stroke-width="1.2"/>`;
  const bocas = { feliz: `<path d="M-4.5 -80 Q0 -75 4.5 -80" stroke="${OUT}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
    triste: `<path d="M-4 -76.5 Q0 -80.5 4 -76.5" stroke="${OUT}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
    pensa: `<path d="M-3 -78 H3" stroke="${OUT}" stroke-width="1.6" stroke-linecap="round"/>`,
    uau: `<ellipse cx="0" cy="-77.5" rx="3" ry="3.6" fill="${OUT}"/>`,
    quer: `<path d="M-5 -80 Q0 -72 5 -80Z" fill="${OUT}"/>` };
  const olhoY = rosto === 'pensa' ? -88 : -86;
  const olhos = `<circle cx="-5" cy="${olhoY}" r="1.9" fill="${OUT}"/><circle cx="5" cy="${olhoY}" r="1.9" fill="${OUT}"/><circle cx="-9" cy="-81" r="2.6" fill="#FF8FA3" opacity=".5"/><circle cx="9" cy="-81" r="2.6" fill="#FF8FA3" opacity=".5"/>`;
  const sobr = rosto === 'triste' ? `<path d="M-8 -90 L-3 -92 M8 -90 L3 -92" stroke="${OUT}" stroke-width="1.4" stroke-linecap="round"/>` : '';
  return `<g transform="translate(${x} ${y})">${sombra(0, 1, 22)}${atras}${cabeloTras}`
    + membro([-6, -36], pl, 10, calca) + membro([6, -36], pr, 10, calca)
    + `<ellipse cx="${pl[0] + 2}" cy="${pl[1] + 1}" rx="7" ry="3.6" fill="#3A3340"/><ellipse cx="${pr[0] + 2}" cy="${pr[1] + 1}" rx="7" ry="3.6" fill="#3A3340"/>`
    + `<rect x="-13" y="-72" width="26" height="40" rx="9" fill="${camisa}" stroke="${OUT}" stroke-width="1.6"/>`
    + membro([-12, -66], bl, 8.5, camisa) + membro([12, -66], br, 8.5, camisa)
    + `<circle cx="${bl[0]}" cy="${bl[1]}" r="4.6" fill="${pele}" stroke="${OUT}" stroke-width="1.3"/><circle cx="${br[0]}" cy="${br[1]}" r="4.6" fill="${pele}" stroke="${OUT}" stroke-width="1.3"/>`
    + `<rect x="-3.5" y="-76" width="7" height="6" fill="${pele}"/><circle cx="0" cy="-86" r="13" fill="${pele}" stroke="${OUT}" stroke-width="1.6"/>`
    + olhos + sobr + (bocas[rosto] || bocas.feliz) + cabeloFrente + chapeu + frente + '</g>';
}
const boné = cor => `<path d="M-14 -90 Q-14 -107 0 -107 Q14 -107 14 -90Z" fill="${cor}" stroke="${OUT}" stroke-width="1.4"/><path d="M4 -92 H25 Q25 -87 12 -87Z" fill="${cor}" stroke="${OUT}" stroke-width="1.4"/>`;
const gorroChef = `<rect x="-12" y="-104" width="24" height="12" rx="2" fill="#fff" stroke="${OUT}" stroke-width="1.4"/><circle cx="-8" cy="-108" r="7" fill="#fff" stroke="${OUT}" stroke-width="1.4"/><circle cx="0" cy="-112" r="8" fill="#fff" stroke="${OUT}" stroke-width="1.4"/><circle cx="8" cy="-108" r="7" fill="#fff" stroke="${OUT}" stroke-width="1.4"/><rect x="-12" y="-104" width="24" height="10" fill="#fff"/>`;
const mochila = `<rect x="-26" y="-70" width="16" height="32" rx="7" fill="#E6823C" stroke="${OUT}" stroke-width="1.5"/><rect x="-24" y="-52" width="12" height="12" rx="4" fill="#F29A52" stroke="${OUT}" stroke-width="1"/>`;

const ST = 'stroke="' + OUT + '" stroke-width="1.6"';
const porta = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#A8683A" ${ST}/>`;

// ---------- cenas (cada uma devolve o miolo do SVG)
const CENAS = {
  // verbos 1
  be: () => `<rect x="60" y="20" width="80" height="112" rx="3" fill="${MADEIRA_ESC}" ${ST}/><rect x="67" y="27" width="66" height="105" fill="#FFF1C9"/><path d="M133 27 L162 17 V124 L133 132Z" fill="#B97A3A" ${ST}/><circle cx="155" cy="76" r="3.6" fill="${OURO}" stroke="${OUT}"/>`
    + pessoa(100, 132, { camisa: '#3F6FD8', r: [24, -60] }),
  have: () => pessoa(100, 132, { estilo: 'longo', cabelo: '#7A3E2A', camisa: '#5DAA6B', calca: '#C9B48A', l: [-9, -44], r: [9, -44] })
    + `<path d="M76 86 H124 L117 112 Q100 117 83 112Z" fill="#D9A25B" ${ST}/><path d="M80 94 H120 M82 102 H118" stroke="#A8713A" stroke-width="1.4"/>${maca(88, 82)}${maca(100, 78)}${maca(112, 82)}`,
  do: () => pessoa(88, 132, { camisa: '#3F6FD8', l: [-5, -46], r: [9, -46], rosto: 'feliz' })
    + `<circle cx="82" cy="86" r="14" fill="#fff" ${ST}/><circle cx="82" cy="86" r="8.5" fill="none" stroke="#C9D6EA" stroke-width="1.6"/><rect x="92" y="80" width="14" height="9" rx="3" fill="#F5C84B" ${ST} transform="rotate(-18 99 84)"/>`
    + `<circle cx="70" cy="72" r="4" fill="#BDE3FF" ${ST}/><circle cx="98" cy="68" r="3" fill="#BDE3FF" ${ST}/><circle cx="108" cy="76" r="2.4" fill="#BDE3FF" ${ST}/>`
    + `<rect x="30" y="96" width="140" height="36" rx="3" fill="#CFD8E6" ${ST}/><rect x="30" y="96" width="140" height="7" fill="#E7EDF6" ${ST}/><path d="M146 96 V66 Q146 58 136 58 H126" stroke="${OUT}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M146 96 V66 Q146 58 136 58 H126" stroke="#B9C4D6" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M126 64 V80" stroke="#6FC3FF" stroke-width="3" stroke-dasharray="4 4" stroke-linecap="round"/>`,
  go: () => `<rect x="0" y="126" width="200" height="24" fill="#D9CDB4"/><path d="M14 136 H44 M20 144 H52" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`
    + pessoa(100, 130, { atras: mochila, camisa: '#5DAA6B', calca: '#8A6A44', pl: [-15, -2], pr: [14, -7], l: [-19, -28], r: [19, -46] })
    + `<path d="M58 70 H76 M52 86 H72 M58 102 H74" stroke="#9AA6C0" stroke-width="3" stroke-linecap="round"/>`,
  get: () => pessoa(56, 132, { chapeu: boné('#3F6FD8'), camisa: '#3F6FD8', calca: '#2F4A86', r: [28, -48] })
    + pessoa(146, 132, { estilo: 'longo', cabelo: '#7A3E2A', camisa: '#F4EAD8', l: [-28, -48] })
    + caixa(84, 84, 34, 28) + `<circle cx="84" cy="98" r="4.6" fill="${PELE[0]}" ${ST}/><circle cx="118" cy="98" r="4.6" fill="${PELE[0]}" ${ST}/>`
    + `<path d="M98 60 l5 5 l9 -10" stroke="#2F9E5A" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  write: () => `<g transform="rotate(-7 100 80)"><rect x="40" y="26" width="104" height="96" rx="6" fill="#fff" ${ST}/><path d="M52 52 H132 M52 66 H132 M52 80 H132 M52 94 H132 M52 108 H132" stroke="#B5CBEF" stroke-width="1.6"/><path d="M50 40 V114" stroke="#E5383B" stroke-width="1.4" opacity=".6"/>`
    + `<path d="M58 78 q6 -14 10 0 t10 0 t10 0 t8 0 M58 92 q8 -10 12 0 t12 0" stroke="#3F6FD8" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
    + [30, 48, 66, 84, 102].map(y => `<rect x="35" y="${y}" width="12" height="5" rx="2.5" fill="#6B7390" ${ST}/>`).join('') + '</g>'
    + membro([190, 140], [140, 92], 24, '#5DAA6B') + `<path d="M104 94 L136 62" stroke="${OUT}" stroke-width="8" stroke-linecap="round"/><path d="M104 94 L136 62" stroke="#3F6FD8" stroke-width="5" stroke-linecap="round"/><path d="M100 99 L104 94" stroke="${OUT}" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="138" cy="88" rx="12" ry="10" fill="${PELE[0]}" ${ST} transform="rotate(-40 138 88)"/><path d="M130 82 L142 72" stroke="${OUT}" stroke-width="1.4"/>`,
  make: () => pessoa(66, 132, { chapeu: gorroChef, camisa: '#F8F8F8', calca: '#4A4F66', r: [32, -50], l: [20, -44] })
    + `<rect x="24" y="100" width="152" height="32" rx="3" fill="${MADEIRA}" ${ST}/><rect x="24" y="100" width="152" height="6" fill="#E0A968" ${ST}/>`
    + `<ellipse cx="128" cy="100" rx="34" ry="6" fill="#fff" ${ST}/><rect x="104" y="76" width="48" height="24" rx="5" fill="#F2A6B8" ${ST}/><path d="M104 84 Q112 92 120 84 T136 84 T152 84" fill="#fff" ${ST}/><ellipse cx="128" cy="76" rx="24" ry="6" fill="#FFF3F6" ${ST}/>`
    + `<circle cx="116" cy="72" r="4.6" fill="#E5383B" ${ST}/><circle cx="128" cy="70" r="4.6" fill="#E5383B" ${ST}/><circle cx="140" cy="72" r="4.6" fill="#E5383B" ${ST}/>${brilho(164, 62, 6)}${brilho(100, 56, 4)}`,
  know: () => pessoa(56, 132, { camisa: '#3F6FD8', r: [42, -42] }) + pessoa(144, 132, { estilo: 'longo', cabelo: '#2E2A33', pele: PELE[1], camisa: '#A98BE6', l: [-42, -42] })
    + `<circle cx="100" cy="90" r="6" fill="${PELE[0]}" ${ST}/>`
    + `<g transform="translate(100 38)"><rect x="-24" y="-16" width="48" height="26" rx="13" fill="#fff" ${ST}/><path d="M-6 10 L-12 20 L6 10Z" fill="#fff" ${ST}/><path d="M-5 10 H5" stroke="#fff" stroke-width="3"/><text x="0" y="3" text-anchor="middle" font-family="Outfit,system-ui,sans-serif" font-weight="800" font-size="15" fill="${OUT}">Hi!</text></g>`,
  give: () => pessoa(54, 132, { camisa: '#E6823C', r: [40, -52] }) + pessoa(146, 132, { estilo: 'longo', cabelo: '#2E2A33', pele: PELE[1], camisa: '#5DAA6B', l: [-38, -50], rosto: 'feliz' })
    + maca(100, 74, 9) + `<circle cx="94" cy="80" r="4.6" fill="${PELE[0]}" ${ST}/><circle cx="108" cy="82" r="4.6" fill="${PELE[1]}" ${ST}/>`
    + `<path d="M100 40 q-10 -10 -14 -2 q-3 8 14 18 q17 -10 14 -18 q-4 -8 -14 2Z" fill="#FF6B8A" ${ST} transform="scale(.7) translate(43 3)"/>`,
  // verbos 2
  think: () => pessoa(80, 132, { camisa: '#A98BE6', rosto: 'pensa', r: [4, -78], l: [10, -52] })
    + `<g fill="#fff" ${ST}><circle cx="110" cy="62" r="3"/><circle cx="120" cy="50" r="5"/><ellipse cx="152" cy="34" rx="34" ry="22"/></g><text x="152" y="46" text-anchor="middle" font-family="Outfit,system-ui,sans-serif" font-weight="800" font-size="32" fill="#3F6FD8">?</text>`,
  see: () => `<path d="M200 66 Q160 60 118 72" stroke="#7A4A1E" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M150 66 q-2 -14 10 -16 q8 0 6 14 Z M176 64 q8 -14 20 -8 q-2 12 -20 8Z" fill="#5DAA6B" ${ST}/>`
    + `<ellipse cx="146" cy="58" rx="11" ry="9" fill="#3F8CFF" ${ST}/><circle cx="137" cy="52" r="6.5" fill="#3F8CFF" ${ST}/><path d="M131 51 l-8 3 l8 2Z" fill="#F5C84B" ${ST}/><circle cx="136" cy="50.5" r="1.4" fill="${OUT}"/><path d="M155 62 l12 6" stroke="#2F6FDE" stroke-width="3.4" stroke-linecap="round"/>`
    + pessoa(66, 132, { estilo: 'longo', cabelo: '#7A3E2A', camisa: '#F4EAD8', calca: '#4F77B5', rosto: 'uau', r: [32, -84] })
    + `<path d="M84 46 Q110 40 132 52" stroke="#3F6FD8" stroke-width="2" stroke-dasharray="3 5" fill="none" stroke-linecap="round"/>`,
  look: () => `<path d="M0 132 L50 70 L84 112 L120 56 L170 132Z" fill="#9FB7D6" ${ST}/><path d="M120 56 L108 74 L116 72 L120 78 L128 70 L134 72Z" fill="#fff"/><path d="M0 132 L40 92 L80 132Z" fill="#7FB36B" ${ST}/><circle cx="168" cy="34" r="14" fill="#FFD34D" ${ST}/>`
    + pessoa(90, 132, { chapeu: boné('#E6823C'), camisa: '#5DAA6B', l: [-9, -80], r: [9, -80] })
    + `<rect x="73" y="40" width="16" height="22" rx="6" fill="#3A3F5A" ${ST}/><rect x="91" y="40" width="16" height="22" rx="6" fill="#3A3F5A" ${ST}/><rect x="86" y="46" width="8" height="8" fill="#3A3F5A" ${ST}/><circle cx="81" cy="62" r="6" fill="#8FD3FF" ${ST}/><circle cx="99" cy="62" r="6" fill="#8FD3FF" ${ST}/>`,
  want: () => `<rect x="104" y="64" width="86" height="68" rx="5" fill="#DDF0FF" ${ST}/><rect x="104" y="64" width="86" height="68" rx="5" fill="#fff" opacity=".35"/><path d="M106 96 H188" stroke="${OUT}" stroke-width="1.6"/>`
    + `<rect x="114" y="76" width="22" height="18" rx="4" fill="#F2A6B8" ${ST}/><circle cx="125" cy="74" r="4" fill="#E5383B" ${ST}/><rect x="146" y="78" width="26" height="16" rx="4" fill="#B9794A" ${ST}/><rect x="114" y="108" width="26" height="14" rx="6" fill="#F5C84B" ${ST}/><circle cx="158" cy="115" r="9" fill="#F7E2A8" ${ST}/><circle cx="158" cy="115" r="3" fill="#E5383B"/>`
    + pessoa(62, 132, { estilo: 'longo', cabelo: '#2E2A33', pele: PELE[1], camisa: '#A98BE6', rosto: 'quer', l: [-7, -54], r: [7, -54] })
    + `<path d="M96 38 q-10 -10 -14 -2 q-3 8 14 18 q17 -10 14 -18 q-4 -8 -14 2Z" fill="#FF6B8A" ${ST}/>`,
  find: () => `<rect x="120" y="94" width="76" height="8" rx="3" fill="${MADEIRA}" ${ST}/><path d="M128 102 V130 M188 102 V130" stroke="${MADEIRA_ESC}" stroke-width="6" stroke-linecap="round"/><rect x="120" y="76" width="76" height="6" rx="3" fill="${MADEIRA}" ${ST}/>`
    + pessoa(72, 132, { camisa: '#3F6FD8', rosto: 'uau', r: [28, -100], l: [-18, -40] })
    + `<g transform="translate(106 22) rotate(25)"><circle cx="0" cy="0" r="8" fill="none" stroke="${OUT}" stroke-width="7"/><circle cx="0" cy="0" r="8" fill="none" stroke="${OURO}" stroke-width="4"/><rect x="6" y="-3" width="26" height="6" rx="2" fill="${OURO}" ${ST}/><rect x="22" y="3" width="5" height="8" fill="${OURO}" ${ST}/></g>${brilho(142, 40, 7)}${brilho(100, 14, 5)}${brilho(128, 12, 4)}`,
  work: () => pessoa(80, 130, { camisa: '#3F6FD8', l: [18, -42], r: [30, -42] })
    + `<rect x="108" y="46" width="54" height="40" rx="4" fill="#6B7390" ${ST}/><rect x="113" y="51" width="44" height="30" rx="2" fill="#BDE3FF"/><path d="M118 58 H150 M118 66 H142 M118 74 H148" stroke="#3F6FD8" stroke-width="2.4" stroke-linecap="round"/><path d="M102 86 H168 L172 94 H98Z" fill="#B9C4D6" ${ST}/>`
    + `<rect x="28" y="94" width="144" height="38" rx="3" fill="${MADEIRA}" ${ST}/><rect x="28" y="94" width="144" height="7" fill="#E0A968" ${ST}/><rect x="40" y="108" width="42" height="18" rx="2" fill="#B97A3A" ${ST}/><circle cx="61" cy="117" r="2.6" fill="${OURO}"/>`
    + `<rect x="176" y="80" width="12" height="14" rx="2" fill="#fff" ${ST}/><path d="M182 80 q-8 -10 0 -16 q8 6 0 16Z" fill="#5DAA6B" ${ST}/>`,
  call: () => pessoa(98, 132, { estilo: 'longo', cabelo: '#7A3E2A', camisa: '#5DAA6B', calca: '#4F77B5', r: [14, -78] })
    + `<rect x="106" y="38" width="12" height="22" rx="4" fill="#3A3F5A" ${ST} transform="rotate(12 112 49)"/>`
    + `<path d="M128 40 q8 10 0 20 M136 34 q13 16 0 32" stroke="#3F6FD8" stroke-width="3" fill="none" stroke-linecap="round"/>`
    + `<path d="M62 50 q-10 -10 -14 -2 q-3 8 14 18 q17 -10 14 -18 q-4 -8 -14 2Z" fill="#FF6B8A" ${ST} transform="scale(.8) translate(-4 4)"/>`,
  need: () => `<rect x="130" y="100" width="62" height="8" rx="3" fill="${MADEIRA}" ${ST}/><path d="M138 108 V132 M184 108 V132" stroke="${MADEIRA_ESC}" stroke-width="6" stroke-linecap="round"/>`
    + `<path d="M144 62 H178 L174 100 H148Z" fill="#EAF6FF" ${ST}/><path d="M146 76 H176 L173.5 99 H148.5Z" fill="#8FD3FF"/>`
    + pessoa(78, 132, { estilo: 'longo', cabelo: '#2E2A33', pele: PELE[1], camisa: '#F5C84B', rosto: 'triste', r: [40, -62] })
    + `<path d="M104 46 q-5 8 0 13 q5 -5 0 -13Z M52 50 q-5 8 0 13 q5 -5 0 -13Z" fill="#8FD3FF" ${ST}/><circle cx="170" cy="26" r="12" fill="#FFD34D" ${ST}/><path d="M170 6 V0 M190 26 H198 M150 26 H142 M184 12 L190 6 M156 12 L150 6" stroke="#FFB800" stroke-width="3" stroke-linecap="round"/>`,
  leave: () => `<rect x="124" y="22" width="68" height="110" rx="3" fill="${MADEIRA_ESC}" ${ST}/><rect x="130" y="28" width="56" height="104" fill="#BFE6FF"/><circle cx="168" cy="52" r="10" fill="#FFD34D" ${ST}/><path d="M130 132 V100 Q148 88 186 104 V132Z" fill="#7FCB5B" ${ST}/>`
    + pessoa(84, 132, { atras: mochila, camisa: '#5DAA6B', calca: '#8A6A44', pl: [-14, -2], pr: [13, -6], l: [-19, -30], r: [20, -44] })
    + `<path d="M112 96 H134" stroke="#3F6FD8" stroke-width="3" stroke-dasharray="4 5" stroke-linecap="round"/><path d="M128 90 l8 6 l-8 6" stroke="#3F6FD8" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  // objetos
  door: () => `<rect x="58" y="16" width="84" height="116" rx="4" fill="${MADEIRA_ESC}" ${ST}/><rect x="66" y="24" width="68" height="108" fill="#B97A3A" ${ST}/>`
    + [[72, 32, 26, 42], [102, 32, 26, 42], [72, 82, 26, 44], [102, 82, 26, 44]].map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#CB8D4F" stroke="#7A4A1E" stroke-width="1.4"/>`).join('')
    + `<circle cx="126" cy="84" r="5" fill="${OURO}" ${ST}/>`,
  key: () => `<g transform="rotate(-30 100 76)"><circle cx="58" cy="76" r="24" fill="none" stroke="${OUT}" stroke-width="13"/><circle cx="58" cy="76" r="24" fill="none" stroke="${OURO}" stroke-width="9"/><rect x="78" y="70" width="84" height="12" rx="5" fill="${OURO}" ${ST}/><rect x="132" y="82" width="9" height="16" rx="2" fill="${OURO}" ${ST}/><rect x="148" y="82" width="9" height="11" rx="2" fill="${OURO}" ${ST}/><path d="M82 74 H150" stroke="#FFE08A" stroke-width="2.4" stroke-linecap="round"/></g>${brilho(158, 36, 8)}${brilho(36, 112, 6)}`,
  chair: () => sombra(100, 133, 44) + `<rect x="72" y="92" width="9" height="40" rx="2" fill="${MADEIRA_ESC}" ${ST}/><rect x="119" y="92" width="9" height="40" rx="2" fill="${MADEIRA_ESC}" ${ST}/><rect x="66" y="22" width="9" height="72" rx="2" fill="${MADEIRA}" ${ST}/><rect x="125" y="22" width="9" height="72" rx="2" fill="${MADEIRA}" ${ST}/>`
    + [30, 50, 70].map(y => `<rect x="75" y="${y}" width="50" height="10" rx="2" fill="#D9A25B" ${ST}/>`).join('')
    + `<rect x="58" y="88" width="84" height="14" rx="5" fill="#E0A968" ${ST}/><rect x="62" y="102" width="9" height="30" rx="2" fill="${MADEIRA}" ${ST}/><rect x="129" y="102" width="9" height="30" rx="2" fill="${MADEIRA}" ${ST}/>`,
  bed: () => sombra(100, 133, 76) + `<rect x="24" y="52" width="14" height="76" rx="4" fill="${MADEIRA_ESC}" ${ST}/><rect x="162" y="86" width="14" height="42" rx="4" fill="${MADEIRA_ESC}" ${ST}/><rect x="34" y="96" width="136" height="14" rx="3" fill="${MADEIRA}" ${ST}/>`
    + `<rect x="38" y="74" width="130" height="24" rx="7" fill="#fff" ${ST}/><rect x="74" y="68" width="94" height="32" rx="9" fill="#6F8FE6" ${ST}/><path d="M86 68 V100 M100 68 V100" stroke="#fff" stroke-width="3" opacity=".6"/><ellipse cx="58" cy="70" rx="20" ry="10" fill="#fff" ${ST}/>`
    + `<text x="120" y="42" font-family="Outfit,system-ui,sans-serif" font-weight="800" font-size="20" fill="#6F8FE6">Z</text><text x="136" y="30" font-family="Outfit,system-ui,sans-serif" font-weight="800" font-size="15" fill="#6F8FE6">z</text><text x="148" y="20" font-family="Outfit,system-ui,sans-serif" font-weight="800" font-size="11" fill="#6F8FE6">z</text>`,
  book: () => sombra(100, 130, 80) + `<path d="M26 40 Q62 28 100 42 Q138 28 174 40 V114 Q138 102 100 116 Q62 102 26 114Z" fill="#3F6FD8" ${ST}/>`
    + `<path d="M32 44 Q64 34 100 46 V112 Q64 98 32 108Z" fill="#fff" ${ST}/><path d="M168 44 Q136 34 100 46 V112 Q136 98 168 108Z" fill="#fff" ${ST}/>`
    + `<path d="M44 58 Q64 52 88 60 M44 72 Q64 66 88 74 M44 86 Q64 80 88 88 M112 60 Q136 52 156 58 M112 74 Q136 66 156 72 M112 88 Q136 80 156 86" stroke="#B5CBEF" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M130 100 V128 L136 122 L142 128 V100Z" fill="#E5383B" ${ST}/>`,
  phone: () => sombra(100, 134, 40) + `<rect x="68" y="12" width="64" height="118" rx="13" fill="#3A3F5A" ${ST}/><rect x="74" y="22" width="52" height="98" rx="7" fill="#EAF3FF"/><rect x="90" y="15" width="20" height="4" rx="2" fill="#1F2438"/>`
    + [[80, 28, '#3F6FD8'], [96, 28, '#5DAA6B'], [112, 28, '#F5C84B'], [80, 44, '#E5383B'], [96, 44, '#A98BE6'], [112, 44, '#E6823C']].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="12" height="12" rx="3.5" fill="${c}"/>`).join('')
    + `<rect x="80" y="68" width="30" height="14" rx="7" fill="#fff" ${ST}/><rect x="90" y="88" width="30" height="14" rx="7" fill="#3F6FD8" ${ST}/><rect x="80" y="106" width="22" height="9" rx="4.5" fill="#fff" ${ST}/>`,
  bag: () => sombra(100, 133, 40) + `<path d="M90 34 Q100 14 110 34" stroke="${OUT}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M90 34 Q100 14 110 34" stroke="#C25F1F" stroke-width="4.4" fill="none" stroke-linecap="round"/>`
    + `<path d="M64 56 Q64 30 100 30 Q136 30 136 56 V118 Q136 130 124 130 H76 Q64 130 64 118Z" fill="#E6823C" ${ST}/><rect x="76" y="84" width="48" height="34" rx="9" fill="#F29A52" ${ST}/><path d="M78 62 Q100 72 122 62" stroke="#B85F1F" stroke-width="2.4" fill="none"/><rect x="94" y="94" width="12" height="9" rx="2.5" fill="${OURO}" ${ST}/><path d="M58 70 Q50 96 58 118 M142 70 Q150 96 142 118" stroke="${OUT}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  glass: () => sombra(100, 134, 32) + `<path d="M124 12 H112 L98 100" stroke="#E5383B" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="M68 28 H132 L123 124 Q122 132 114 132 H86 Q78 132 77 124Z" fill="#EAF6FF" ${ST}/><path d="M71 56 H129 L122 122 Q121 128 114 128 H86 Q79 128 78 122Z" fill="#fff" stroke="#BFD6EA" stroke-width="1.6"/><path d="M82 66 L86 120" stroke="#DCEBFA" stroke-width="5" stroke-linecap="round"/>`,
  clock: () => sombra(100, 134, 42) + `<circle cx="68" cy="34" r="14" fill="#E5383B" ${ST}/><circle cx="132" cy="34" r="14" fill="#E5383B" ${ST}/><path d="M100 22 V34 M92 22 H108" stroke="${OUT}" stroke-width="4" stroke-linecap="round"/>`
    + `<path d="M70 120 L62 134 M130 120 L138 134" stroke="${OUT}" stroke-width="5" stroke-linecap="round"/><circle cx="100" cy="82" r="50" fill="#E5383B" ${ST}/><circle cx="100" cy="82" r="41" fill="#fff" ${ST}/>`
    + [...Array(12)].map((_, k) => { const a = k * Math.PI / 6, r1 = k % 3 ? 35 : 32; return `<path d="M${(100 + r1 * Math.sin(a)).toFixed(1)} ${(82 - r1 * Math.cos(a)).toFixed(1)} L${(100 + 38 * Math.sin(a)).toFixed(1)} ${(82 - 38 * Math.cos(a)).toFixed(1)}" stroke="${OUT}" stroke-width="${k % 3 ? 1.6 : 2.6}" stroke-linecap="round"/>`; }).join('')
    + `<path d="M100 82 L80 70" stroke="${OUT}" stroke-width="4.4" stroke-linecap="round"/><path d="M100 82 L131 64" stroke="${OUT}" stroke-width="3" stroke-linecap="round"/><circle cx="100" cy="82" r="4" fill="#E5383B" ${ST}/>`,
};

const FUNDOS = ['#FFF1D6', '#DDEFFF', '#E1F6EA', '#FFE6EE', '#ECE5FF'];
const ORDEM = Object.keys(CENAS);

export const svgDe = en => {
  const f = CENAS[en];
  if (!f) return '';
  const fundo = FUNDOS[ORDEM.indexOf(en) % FUNDOS.length];
  return `<svg class="vocab__svg" viewBox="0 0 200 150" role="img" aria-label="${en}" focusable="false"><rect width="200" height="150" fill="${fundo}"/><rect y="130" width="200" height="20" fill="#2B2F4A" opacity=".06"/>${f()}</svg>`;
};
