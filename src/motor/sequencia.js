'use strict';
// Sequência de dias com prêmios, no jeito Inglou: motiva sem castigar.
// - Conta dias seguidos com estudo. Hoje ainda sem estudo NÃO quebra nada (o dia não acabou).
// - A cada 7 dias seguidos a pessoa ganha um escudo (no máximo 2). Um dia sem estudo gasta um escudo
//   e a sequência continua. Sem escudo, a sequência recomeça, mas o recorde e as figurinhas ficam para sempre.
// - Tudo é calculado a partir de dias_estudo: nada novo para guardar e nada para "dessincronizar".
const { somarDias, diasEntre } = require('./util');

const PREMIOS = [3, 7, 14, 30, 60, 100, 200, 365];
const ESCUDO_A_CADA = 7, ESCUDOS_MAX = 2;

function calcularSequencia(datas, hoje) {
  const estudou = new Set(datas.filter(d => d <= hoje));
  const ordenadas = [...estudou].sort();
  const vazio = { atual: 0, recorde: 0, escudos: 0, estudouHoje: false, protegidos: [], semana: [], proximoPremio: PREMIOS[0], faltam: PREMIOS[0] };
  if (!ordenadas.length) return { ...vazio, semana: semana(hoje, estudou, new Set()) };
  let atual = 0, recorde = 0, escudos = 0, seguidos = 0;
  const protegidos = new Set();
  // anda dia a dia, do primeiro estudo até ontem (hoje só soma se já estudou)
  for (let d = ordenadas[0]; d <= hoje; d = somarDias(d, 1)) {
    if (estudou.has(d)) {
      atual++; seguidos++;
      if (seguidos % ESCUDO_A_CADA === 0) escudos = Math.min(ESCUDOS_MAX, escudos + 1);
    } else if (d === hoje) {
      break;
    } else if (escudos > 0 && atual > 0) {
      escudos--; protegidos.add(d); seguidos = 0;
    } else {
      atual = 0; seguidos = 0;
    }
    recorde = Math.max(recorde, atual);
  }
  const proximoPremio = PREMIOS.find(p => p > atual) || null;
  return {
    atual, recorde, escudos, estudouHoje: estudou.has(hoje), protegidos: [...protegidos].filter(d => diasEntre(d, hoje) <= 30),
    semana: semana(hoje, estudou, protegidos), proximoPremio, faltam: proximoPremio ? proximoPremio - atual : 0,
  };
}

// últimos 7 dias, de 6 dias atrás até hoje: 'estudou' | 'escudo' | 'hoje' | 'nao'
function semana(hoje, estudou, protegidos) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = somarDias(hoje, i - 6);
    return { data: d, estado: estudou.has(d) ? 'estudou' : protegidos.has(d) ? 'escudo' : d === hoje ? 'hoje' : 'nao' };
  });
}

// prêmios que a sequência atual já alcançou (as figurinhas ficam mesmo se a sequência recomeçar)
const premiosAlcancados = seq => PREMIOS.filter(p => seq.atual >= p);

module.exports = { calcularSequencia, premiosAlcancados, PREMIOS, ESCUDO_A_CADA, ESCUDOS_MAX };
