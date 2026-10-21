// Conta: cartões com estado + botão; tudo que se preenche abre em janela (regra de telas limpas).
import { api } from '../api.js?v=__V__';
import { lou } from '../diversao.js?v=__V__';
import { jaInstalado, instalarApp, podeInstalarDireto, ehIphone } from '../instalar.js?v=__V__';
import { configurarLembrete, DIAS } from '../lembrete.js?v=__V__';
import { h, icone, toast, formulario, confirmar, janela, dataBR, localStorageGet, localStorageSet, ocupado, falar, falarPt } from '../ui.js?v=__V__';

const EXPLICA_DADOS = [
  ['Seu objetivo, prazo, área, interesses e tempo por dia', 'para escolher as missões, os exemplos e o tamanho das lições.'],
  ['Suas respostas (certo/errado, tempo para responder, se usou dica)', 'para estimar o que você já domina e ajustar a dificuldade.'],
  ['Suas revisões de cartões', 'para decidir quando cada cartão volta e medir o que você retém.'],
  ['Seus textos, conversas e materiais', 'para corrigir, encontrar padrões de erro e criar a próxima aula. Com o tutor de IA ligado, o texto da atividade é enviado ao provedor de IA (Anthropic) só para gerar a correção.'],
  ['Hipóteses sobre onde você trava', 'calculadas a partir dos itens acima. Você pode descartar qualquer uma.'],
];

export async function telaConta(el, { estado, ir, carregarEu }) {
  const [eu, ass, dados] = await Promise.all([carregarEu(), api('/assinatura'), api('/dados')]);
  const p = eu.perfil;
  const lem = p.lembrete || {};
  const e = ass.estado;

  const CORES = { target: 'azul', 'graduation-cap': 'lilas', bell: 'sol', 'seal-check': 'menta', 'shield-check': 'turquesa', notebook: 'coral', gear: 'azul', 'lock-key': 'lilas' };
  const cartao = (icon, titulo, estadoTxt, ...botoes) => h('section', { class: `folha cartao-conta c-${CORES[icon] || 'azul'}` },
    h('div', { class: 'cartao-conta__info' }, h('span', { class: 'bolha' }, icone(icon)), h('div', {}, h('h2', {}, titulo), h('p', { class: 'ajuda' }, estadoTxt))),
    h('div', { class: 'linha-acoes' }, botoes));

  // --- assinatura
  const estadoAss = e.status === 'teste' ? `Teste grátis até ${dataBR(e.ate)} (${e.diasRestantes} dias). Sem cartão cadastrado: nada é cobrado sozinho.`
    : e.status === 'ativa' ? `Plano ${ass.planos[e.plano]?.nome} ativo até ${dataBR(e.ate)}, com renovação.`
      : e.status === 'cancelada' ? `Cancelado. Você continua com tudo até ${dataBR(e.ate)}. Depois, acesso livre.`
        : 'Acesso livre: flashcards, progresso e seus dados. Lições, conversas e IA pausadas.';

  function verPlanos() {
    const usoLinhas = Object.entries(ass.nomesUso).map(([k, nome]) => h('li', {}, `${nome}: ${ass.uso[k] || 0} de ${e.limites[k] ?? 0} neste mês`));
    const planoCard = (id) => {
      const pl = ass.planos[id];
      const b = h('button', { type: 'button', class: 'btn btn-bloco' + (id === 'anual' ? '' : ' btn-sec'), on: { click: async () => {
        ocupado(b, true);
        try { await api('/assinatura/assinar', { metodo: 'POST', corpo: { plano: id } }); toast('Assinatura ativada (modo de teste do sistema).', { tipo: 'ok' }); j.fechar(); render(); }
        catch (err) { toast(err.message); } finally { ocupado(b, false); }
      } } }, `Assinar ${pl.nome}`);
      return h('div', { class: 'plano' + (id === 'anual' ? ' plano--destaque' : '') }, h('h3', {}, pl.nome), h('p', { class: 'preco' }, pl.rotulo), pl.equivalente ? h('p', { class: 'chip' }, `${pl.equivalente} · ${pl.desconto}`) : null, b);
    };
    const j = janela({ titulo: 'Planos', larga: true, corpo: h('div', {},
      h('p', {}, 'Os dois planos incluem o mesmo conteúdo. O anual sai mais barato por mês.'),
      h('div', { class: 'planos' }, planoCard('mensal'), planoCard('anual')),
      h('h3', {}, 'Incluso'), h('ul', { class: 'lista-check' }, ass.inclui.completo.map(t => h('li', {}, t))),
      h('h3', {}, 'Limites de IA por mês (uso justo)'), h('ul', {}, Object.entries(ass.nomesUso).map(([k, n]) => h('li', {}, `${n}: até ${ass.limites.pago[k]}`))),
      h('p', { class: 'ajuda' }, 'Passou do limite? Você continua estudando no modo sem IA até o mês virar. Nunca cobramos extra.'),
      h('h3', {}, 'Seu uso neste mês'), h('ul', {}, usoLinhas),
      h('h3', {}, 'Condições'), h('ul', {},
        h('li', {}, 'Teste de 30 dias sem cartão. Se não assinar, a conta passa para o acesso livre e seus dados ficam guardados.'),
        h('li', {}, 'Se assinar durante o teste, o período pago só começa quando o teste acaba.'),
        h('li', {}, 'Cancele quando quiser, aqui mesmo. Sem multa. Você usa até o fim do período pago.'),
        h('li', {}, 'Sem cobrança surpresa: o valor é o da tabela e avisamos antes de qualquer mudança de preço.')),
      ass.pagamento !== 'simulado' ? h('p', { class: 'aviso-suave' }, icone('info'), h('span', {}, 'O pagamento on-line ainda não está ligado neste servidor. Nenhuma cobrança será feita.')) : h('p', { class: 'aviso-suave' }, icone('info'), h('span', {}, 'Ambiente de teste: a assinatura é simulada, sem pagamento real.'))) });
  }

  async function cancelar() {
    if (!await confirmar({ titulo: 'Cancelar a assinatura?', texto: `Você continua com tudo até ${dataBR(e.ate)}. Depois, a conta vai para o acesso livre e nada mais é cobrado. Seus dados ficam guardados.`, ok: 'Cancelar assinatura', cancelar: 'Manter', perigo: true })) return;
    await api('/assinatura/cancelar', { metodo: 'POST' }); toast('Assinatura cancelada. Nenhuma nova cobrança.', { tipo: 'ok' }); render();
  }

  // --- lembrete (a janela mora em lembrete.js, porque a tela Hoje também a abre)
  const abrirLembrete = () => configurarLembrete(lem, { aoSalvar: novo => { if (estado.eu) estado.eu.perfil.lembrete = novo; render(); } });

  // --- dados
  function verDados() {
    janela({ titulo: 'O que usamos para personalizar', larga: true, corpo: h('div', {},
      h('ul', { class: 'lista-dados' }, EXPLICA_DADOS.map(([o, pq]) => h('li', {}, h('strong', {}, o), ' ', pq))),
      h('p', {}, 'Não vendemos seus dados e não usamos para publicidade. Você pode consultar, corrigir e apagar tudo por aqui.'),
      h('h3', {}, 'O que temos hoje'),
      h('ul', {}, Object.entries(dados.contagem).map(([k, n]) => h('li', {}, `${k}: ${n}`))),
      h('p', { class: 'ajuda' }, h('a', { href: '/politica-de-privacidade/', target: '_blank', rel: 'noopener' }, 'Política de privacidade completa'))) });
  }
  async function apagar() {
    const r = await formulario({ titulo: 'Apagar histórico', enviar: 'Apagar', texto: 'Escolha o que apagar. Não dá para desfazer.',
      campos: [{ nome: 'escopo', rotulo: 'O que apagar', tipo: 'select', opcoes: [
        { valor: 'respostas', rotulo: 'Respostas e hipóteses (o plano recomeça a te conhecer)' }, { valor: 'conversas', rotulo: 'Conversas' }, { valor: 'amostras', rotulo: 'Textos e amostras' },
        { valor: 'cartoes', rotulo: 'Cartões e revisões' }, { valor: 'materiais', rotulo: 'Materiais enviados' }, { valor: 'tudo', rotulo: 'Todo o histórico de estudo (mantém a conta)' }] }],
      aoEnviar: async v => {
        if (!await confirmar({ titulo: 'Tem certeza?', texto: 'Esses dados serão apagados agora, de vez.', ok: 'Sim, apagar', perigo: true })) throw new Error('Cancelado.');
        return api('/dados/apagar', { metodo: 'POST', corpo: v });
      } });
    if (r) { toast('Apagado.', { tipo: 'ok' }); if (r.refazerNivelamento) { await carregarEu(); ir('#/nivelamento'); } else render(); }
  }
  async function excluirConta() {
    const r = await formulario({ titulo: 'Excluir conta', enviar: 'Excluir minha conta', texto: 'Apaga a conta e todos os seus dados de estudo, de vez. Se quiser, exporte seus dados antes.',
      campos: [{ nome: 'senha', rotulo: 'Confirme com sua senha', tipo: 'password', obrigatorio: true, autocomplete: 'current-password' }],
      aoEnviar: v => api('/conta/excluir', { metodo: 'POST', corpo: v }) });
    if (r) { estado.eu = null; location.href = '/'; }
  }
  async function trocarSenha() {
    const r = await formulario({ titulo: 'Alterar senha', campos: [
      { nome: 'atual', rotulo: 'Senha atual', tipo: 'password', obrigatorio: true, autocomplete: 'current-password' },
      { nome: 'nova', rotulo: 'Nova senha', tipo: 'password', obrigatorio: true, autocomplete: 'new-password', ajuda: 'Pelo menos 10 caracteres, sem seu nome ou e-mail.' }],
      aoEnviar: v => api('/auth/senha', { metodo: 'POST', corpo: v }) });
    if (r) toast('Senha alterada. Outras sessões foram encerradas.', { tipo: 'ok' });
  }
  function preferencias() {
    const atual = localStorageGet('tema') || 'sistema';
    const tema = h('div', { class: 'temas', role: 'radiogroup', 'aria-label': 'Tema' }, [['claro', 'Dia', 'dia'], ['escuro', 'Noite', 'noite'], ['sistema', 'Igual ao aparelho', 'auto']].map(([v, r, c]) =>
      h('label', { class: `tema-op tema-op--${c}` }, h('input', { type: 'radio', name: 'pr-tema', value: v, checked: atual === v }), h('span', {}, h('i', { 'aria-hidden': 'true' }), r))));
    const vel = h('select', { id: 'pr-vel' }, [['0.85', 'Mais devagar'], ['1', 'Normal'], ['1.1', 'Um pouco mais rápido']].map(([v, r]) => h('option', { value: v, selected: (localStorageGet('velocidade') || '1') === v }, r)));
    const escolher = (id, idioma, padrao) => h('select', { id }, [['mia', 'Mia'], ['tuiuiu', 'Tuiuiú']].map(([v, nome]) => h('option', { value: v, selected: (localStorageGet('personagem-' + idioma) || padrao) === v }, nome)));
    const vozEn = escolher('pr-voz-en', 'en', 'mia'), vozPt = escolher('pr-voz-pt', 'pt', 'tuiuiu');
    const salvarVozes = () => { localStorageSet('velocidade', vel.value); localStorageSet('personagem-en', vozEn.value); localStorageSet('personagem-pt', vozPt.value); };
    const ok = h('button', { type: 'button', class: 'btn' }, 'Salvar');
    const j = janela({ titulo: 'Preferências deste aparelho', corpo: h('div', {},
      h('div', { class: 'campo' }, h('span', { class: 'rotulo' }, 'Tema'), tema),
      h('div', { class: 'campo' }, h('label', { for: 'pr-vel' }, 'Velocidade do áudio'), vel),
      h('div', { class: 'campo' }, h('label', { for: 'pr-voz-en' }, 'Quem lê em inglês?'), vozEn,
        h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: () => { salvarVozes(); falar('Hello! Let us learn together.'); } } }, icone('speaker-high'), 'Ouvir em inglês')),
      h('div', { class: 'campo' }, h('label', { for: 'pr-voz-pt' }, 'Quem lê em português?'), vozPt,
        h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: () => { salvarVozes(); falarPt('Oi! Vamos aprender juntos, no seu ritmo.'); } } }, icone('speaker-high'), 'Ouvir em português')),
      h('p', { class: 'ajuda' }, 'As leituras usam as vozes da Mia e do Tuiuiú. Na rádio, cada personagem mantém a própria voz.')), acoes: [ok] });
    ok.addEventListener('click', () => {
      const t = tema.querySelector('input:checked')?.value || 'sistema';
      localStorageSet('tema', t); salvarVozes();
      dispatchEvent(new CustomEvent('inglou:tema'));
      j.fechar(true); toast('Preferências salvas.', { tipo: 'ok' });
    });
  }

  // instalar no celular: botão direto quando o navegador deixa; senão, passo a passo (iPhone e Android)
  async function instalar() {
    if (podeInstalarDireto() && await instalarApp()) return;
    if (podeInstalarDireto()) return;
    const passos = (titulo, lista) => h('div', {}, h('h3', {}, titulo), h('ol', { class: 'passos-instalar' }, lista.map(t => h('li', {}, t))));
    janela({ titulo: 'Instalar no celular', corpo: h('div', {},
      h('p', {}, 'O Inglou instala direto do navegador, sem loja. Fica com ícone do Tuiuiú na tela inicial e abre em tela cheia.'),
      ehIphone() ? null : passos('Android (Chrome)', ['Abra o Inglou no Chrome.', 'Toque nos 3 pontinhos, no canto de cima.', 'Toque em "Instalar app" (ou "Adicionar à tela inicial").']),
      ehIphone() || !/android/i.test(navigator.userAgent) ? passos('iPhone (Safari)', ['Abra o Inglou no Safari (não vale outro navegador).', 'Toque no botão Compartilhar, o quadrado com a setinha.', 'Role e toque em "Adicionar à Tela de Início".']) : null) });
  }

  function render() { ir('#/conta'); }

  el.append(
    h('header', { class: 'cabeca' }, lou('feliz', { tamanho: 64, rotulo: '' }), h('div', {}, h('h1', {}, eu.usuario.nome), h('p', { class: 'ajuda' }, eu.usuario.email))),
    cartao('user-circle', 'Meu espaço de aprendizagem', `${eu.publico?.nome || 'Seu perfil'} · ${p.idade ? p.idade + ' anos · ' : ''}${p.papel === 'professor' ? 'Professor(a)' : 'Aluno(a)'}${eu.publico?.regiao ? ' · ' + eu.publico.regiao.nome : ''}`, h('a', { class: 'btn btn-sec btn-peq', href: '#/publico' }, 'Alterar idade, perfil ou região')),
    cartao('target', 'Objetivo e rotina', `${p.objetivo_nome || '-'}${p.prazo ? ' até ' + dataBR(p.prazo) : ', sem prazo'} · ${p.minutos_dia} min/dia, ${p.dias_semana} dias/semana`,
      h('a', { class: 'btn btn-sec btn-peq', href: '#/perfil' }, icone('pencil-simple'), 'Alterar'), h('a', { class: 'btn btn-texto btn-peq', href: '#/plano' }, 'Ver plano')),
    cartao('graduation-cap', 'Teste de nível', eu.nivel ? `Nível estimado: ${eu.nivel}. Refaça quando sentir que evoluiu.` : 'Ainda não feito.',
      h('a', { class: 'btn btn-sec btn-peq', href: '#/nivelamento' }, icone('repeat'), 'Refazer teste')),
    cartao('bell', 'Lembrete diário', lem.ativo ? `Ligado: ${lem.hora}, ${(lem.dias || []).map(d => DIAS[d]).join(', ')}` : 'Desligado',
      h('button', { class: 'btn btn-sec btn-peq', on: { click: abrirLembrete } }, icone('gear'), lem.ativo ? 'Alterar' : 'Configurar'),
      lem.ativo ? h('a', { class: 'btn btn-texto btn-peq', href: '/api/v1/lembrete.ics' }, icone('calendar-plus'), 'Baixar de novo') : null),
    cartao('seal-check', 'Assinatura', estadoAss,
      h('button', { class: 'btn btn-sec btn-peq', on: { click: verPlanos } }, 'Ver planos e uso'),
      e.status === 'ativa' ? h('button', { class: 'btn btn-texto btn-peq', on: { click: cancelar } }, 'Cancelar assinatura') : null),
    cartao('shield-check', 'Seus dados', 'Veja o que usamos para personalizar, baixe uma cópia ou apague.',
      h('button', { class: 'btn btn-sec btn-peq', on: { click: verDados } }, icone('eye'), 'O que usamos'),
      h('a', { class: 'btn btn-sec btn-peq', href: '/api/v1/dados/exportar', download: '' }, icone('download-simple'), 'Exportar'),
      h('button', { class: 'btn btn-texto btn-peq', on: { click: apagar } }, icone('trash'), 'Apagar histórico')),
    cartao('notebook', 'Seus registros', 'Textos, conversas e cartões que você produziu.',
      h('a', { class: 'btn btn-sec btn-peq', href: '#/conversar' }, 'Conversas'), h('a', { class: 'btn btn-sec btn-peq', href: '#/material' }, 'Materiais'), h('a', { class: 'btn btn-sec btn-peq', href: '#/revisar' }, 'Cartões')),
    jaInstalado() ? null : cartao('seal-check', 'Instalar no celular', 'Ícone do Tuiuiú na tela inicial e abre em tela cheia, como um app.', h('button', { class: 'btn btn-sec btn-peq', on: { click: instalar } }, icone('download-simple'), 'Instalar')),
    cartao('gear', 'Preferências', 'Dia ou noite e velocidade do áudio neste aparelho.', h('button', { class: 'btn btn-sec btn-peq', on: { click: preferencias } }, 'Configurar')),
    cartao('lock-key', 'Segurança', 'Senha da conta.', h('button', { class: 'btn btn-sec btn-peq', on: { click: trocarSenha } }, 'Alterar senha')),
    h('div', { class: 'linha-acoes rodape-conta' },
      h('button', { class: 'btn btn-sec', on: { click: async () => { await api('/auth/sair', { metodo: 'POST' }); estado.eu = null; location.hash = '#/entrar'; } } }, icone('sign-out'), 'Sair'),
      h('button', { class: 'btn btn-perigo', on: { click: excluirConta } }, 'Excluir conta')),
    h('p', { class: 'ajuda' }, h('a', { href: '/politica-de-privacidade/' }, 'Privacidade'), ' · ', h('a', { href: '/termos/' }, 'Termos')));
}
