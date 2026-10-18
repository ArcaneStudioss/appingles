'use strict';
// Repetição espaçada (variação do SM-2). Notas: 0 = errei, 3 = difícil, 4 = bom, 5 = fácil.
// Sem punição: errar só traz o cartão de volta mais cedo.
const { somarDias } = require('./util');

function agendar(cartao, nota, hojeISO) {
  let { facilidade = 2.5, intervalo = 0, repeticoes = 0, lapsos = 0 } = cartao;
  if (nota < 3) {
    repeticoes = 0; lapsos += 1; intervalo = 1;
    facilidade = Math.max(1.3, facilidade - 0.2);
  } else {
    repeticoes += 1;
    if (repeticoes === 1) intervalo = nota === 5 ? 3 : 1;
    else if (repeticoes === 2) intervalo = nota === 5 ? 7 : nota === 3 ? 3 : 4;
    else intervalo = Math.round(intervalo * facilidade * (nota === 3 ? 0.8 : nota === 5 ? 1.3 : 1));
    facilidade = Math.max(1.3, facilidade + (0.1 - (5 - nota) * (0.08 + (5 - nota) * 0.02)));
    intervalo = Math.min(intervalo, 180);
  }
  return { facilidade: Math.round(facilidade * 100) / 100, intervalo, repeticoes, lapsos, vence_em: somarDias(hojeISO, intervalo) };
}

module.exports = { agendar };
