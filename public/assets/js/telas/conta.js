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
  if(!ass.catalogo||!ass.grupo){el.append(h('section',{class:'folha'},h('p',{},'Estamos atualizando os planos. Tente novamente em instantes.'),h('button',{class:'btn',on:{click:()=>ir('#/conta')}},'Atualizar planos')));return;}
  const p = eu.perfil;
  const lem = p.lembrete || {};
  const e = ass.estado;

  const CORES = { users: 'azul', target: 'azul', 'graduation-cap': 'lilas', bell: 'sol', 'seal-check': 'menta', 'shield-check': 'turquesa', notebook: 'coral', gear: 'azul', 'lock-key': 'lilas' };
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
    const moeda = n => (n / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const planoCard = pl => {
      const comprar = periodo => {
        const b=h('button',{type:'button',class:'btn btn-sec btn-bloco',disabled:ass.pagamento!=='simulado'&&!ass.stripe?.planos?.includes(pl.id+'_'+periodo),on:{click:async()=>{
          ocupado(b,true);try{const r=await api('/assinatura/assinar',{metodo:'POST',corpo:{plano:pl.id+'_'+periodo}});if(r.url){const u=new URL(r.url);if(u.origin!=='https://checkout.stripe.com')throw new Error('Endereço de pagamento inválido.');location.assign(u.href);return;}j.fechar();toast('Assinatura simulada, sem cobrança.');render();}catch(err){toast(err.message);}finally{ocupado(b,false);}
        }}},ass.pagamento==='simulado'?'Simular '+periodo:ass.stripe?.planos?.includes(pl.id+'_'+periodo)?'Assinar '+periodo:'Contratação em breve');return b;
      };
      return h('section',{class:'plano'+(pl.id==='completo'?' plano--destaque':''),'data-plano':pl.id},h('h3',{},pl.nome),h('p',{},pl.descricao),h('p',{class:'preco'},moeda(pl.mensal),pl.mensal?' / mês':''),pl.anual?h('p',{class:'ajuda'},moeda(pl.anual)+' por ano, cobrado anualmente'):h('p',{},'Sem mensalidade'),h('ul',{},pl.recursos.map(r=>h('li',{},r))),pl.mensal?h('div',{},comprar('mensal'),ass.pagamento==='simulado'||ass.stripe?.disponivel?comprar('anual'):null):null);
    };
    const j = janela({ titulo: 'Planos', larga: true, corpo: h('div', {},
      h('p', {}, 'Escolha entre Grátis, Basic, Completo, Família e Turma. Cada plano pago tem opção mensal e anual.'),
      h('div', { class: 'planos' }, ass.catalogo.map(planoCard)),
      h('p',{class:'ajuda'},'Família e Turma têm contas individuais, com franquias compartilhadas de IA e novos áudios. O responsável ocupa uma vaga. Ninguém acessa conversas ou materiais privados de outra pessoa.'),
      h('p',{class:'ajuda'},'Os limites renovam por mês e não acumulam, inclusive no anual. As gerações compartilham uma cota de processamento; pedidos longos e materiais consomem mais. Áudios já preparados não consomem novas gerações. Ao esgotar a IA, os planos pagos continuam com prática sem IA.'),
      h('h3',{},'Seu consumo de geração neste mês'),h('p',{},`${ass.consumo.geracoes||0} gerações com IA e ${ass.consumo.voz||0} caracteres de novos áudios.`),
      h('h3', {}, 'Seu uso neste mês'), h('ul', {}, usoLinhas),
      ass.stripe?.cobranca==='past_due'?h('p',{class:'aviso-suave'},'Há uma cobrança pendente. Atualize o cartão em Gerenciar cobrança.'):null,
      ass.stripe?.cobranca==='pagamento_em_revisao'?h('p',{class:'aviso-suave'},'O pagamento está em revisão. Suas revisões e seus dados continuam disponíveis.'):null,
      h('h3', {}, 'Condições'), h('ul', {},
        h('li', {}, 'Teste de 30 dias sem cartão. Se não assinar, a conta passa para o acesso livre e seus dados ficam guardados.'),
        h('li', {}, 'Se assinar durante o teste, o período pago só começa quando o teste acaba.'),
        h('li', {}, 'Cancele quando quiser, aqui mesmo. Sem multa. Você usa até o fim do período pago.'),
        h('li', {}, 'Sem cobrança surpresa: o valor é o da tabela e avisamos antes de qualquer mudança de preço.')),
      ass.pagamento !== 'simulado'&&!ass.stripe?.disponivel ? h('p', { class: 'aviso-suave' }, icone('info'), h('span', {}, 'O pagamento on-line ainda não está ligado neste servidor. Nenhuma cobrança será feita.')) : h('p', { class: 'aviso-suave' }, icone('info'), h('span', {}, ass.stripe?.disponivel?'Você será levado ao checkout seguro do Stripe. O acesso é atualizado após a confirmação no servidor.':'Ambiente de teste: a assinatura é simulada, sem pagamento real.'))) });
  }

  async function cancelar() {
    if (!await confirmar({ titulo: 'Cancelar a assinatura?', texto: `Você continua com tudo até ${dataBR(e.ate)}. Depois, a conta vai para o acesso livre e nada mais é cobrado. Seus dados ficam guardados.`, ok: 'Cancelar assinatura', cancelar: 'Manter', perigo: true })) return;
    await api('/assinatura/cancelar', { metodo: 'POST' }); toast('Assinatura cancelada. Nenhuma nova cobrança.', { tipo: 'ok' }); render();
  }

  async function gerenciarGrupo() {
    const g=ass.grupo;
    const entrar=()=>formulario({titulo:'Entrar em um plano compartilhado',texto:'O responsável paga o plano. Suas conversas, respostas e materiais continuam privados. As contas são individuais; a franquia de IA e novos áudios é compartilhada.',campos:[{nome:'codigo',rotulo:'Código do plano',obrigatorio:true,max:24}],aoEnviar:v=>api('/assinatura/entrar',{metodo:'POST',corpo:v})}).then(r=>{if(r)render();});
    if(!g.compartilhado)return entrar();
    janela({titulo:'Seu plano compartilhado',corpo:h('div',{},h('p',{},`${g.ocupadas} de ${g.pessoas} vagas ocupadas, incluindo o responsável.`),g.responsavel?h('div',{},g.membros.map(m=>h('p',{},m.nome,' ',h('button',{class:'btn btn-texto btn-peq',on:{click:async()=>{if(await confirmar({titulo:'Remover participante?',texto:'A pessoa perde o acesso compartilhado, mas mantém seus dados.',ok:'Remover'})){await api('/assinatura/remover',{metodo:'POST',corpo:{membro:m.id}});render();}}}},'Remover do plano'))),h('button',{class:'btn',on:{click:async()=>{const r=await api('/assinatura/convite',{metodo:'POST'});await formulario({titulo:'Convite do plano',texto:'Compartilhe apenas com quem deve entrar. Gerar outro código invalida o anterior.',campos:[{nome:'codigo',rotulo:'Código para compartilhar',valor:r.codigo}],ok:'Fechar',aoEnviar:async()=>true});}}},'Gerar ou renovar código')):h('button',{class:'btn btn-sec',on:{click:async()=>{if(await confirmar({titulo:'Sair do plano?',texto:'Você perde o acesso compartilhado. Seus dados pessoais continuam na sua conta.',ok:'Sair do plano'})){await api('/assinatura/sair',{metodo:'POST'});render();}}}},'Sair do plano'))});
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
    const porCodigo = eu.autenticacao?.provedor === 'supabase';
    if (porCodigo && !await pedirCodigo('excluir')) return;
    const r = await formulario({ titulo: 'Excluir conta', enviar: 'Excluir minha conta', texto: 'Apaga a conta e todos os seus dados de estudo, de vez. Se quiser, exporte seus dados antes.',
      campos: [porCodigo ? campoCodigo() : { nome: 'senha', rotulo: 'Confirme com sua senha', tipo: 'password', obrigatorio: true, autocomplete: 'current-password' }],
      aoEnviar: v => api('/conta/excluir', { metodo: 'POST', corpo: v }) });
    if (r) { estado.eu = null; location.href = '/'; }
  }
  const campoCodigo = () => ({ nome: 'codigo', rotulo: 'Código recebido no e-mail', tipo: 'text', inputmode: 'numeric', autocomplete: 'one-time-code', obrigatorio: true, max: 10, ajuda: 'Válido por cinco minutos e somente para esta confirmação.' });
  async function pedirCodigo(acao) {
    if (!await confirmar({ titulo: acao === 'excluir' ? 'Confirmar exclusão da conta' : 'Proteger sua conta', texto: `Vamos enviar um código para ${eu.usuario.email}. Você pode confirmar mesmo se entra com Google e não tem senha no Inglou.`, ok: 'Enviar código', cancelar: 'Voltar', perigo: acao === 'excluir' })) return false;
    try { await api('/auth/seguranca/codigo', { metodo: 'POST', corpo: { acao } }); return true; }
    catch (err) { toast(err.message); return false; }
  }
  async function trocarSenha() {
    const porCodigo = eu.autenticacao?.provedor === 'supabase';
    if (porCodigo && !await pedirCodigo('senha')) return;
    const r = await formulario({ titulo: porCodigo ? 'Criar ou alterar senha' : 'Alterar senha', campos: [
      porCodigo ? campoCodigo() : { nome: 'atual', rotulo: 'Senha atual', tipo: 'password', obrigatorio: true, autocomplete: 'current-password' },
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
      ass.stripe?.portal&&ass.grupo.responsavel?h('button',{class:'btn btn-sec btn-peq',on:{click:async()=>{try{const r=await api('/assinatura/portal',{metodo:'POST'});const u=new URL(r.url);if(u.origin!=='https://billing.stripe.com')throw new Error('Endereço de cobrança inválido.');location.assign(u.href);}catch(err){toast(err.message);}}}},'Gerenciar cobrança'):null,
      e.status === 'ativa' && ass.grupo.responsavel ? h('button', { class: 'btn btn-texto btn-peq', on: { click: cancelar } }, 'Cancelar assinatura') : null),
    cartao('shield-check', 'Seus dados', 'Veja o que usamos para personalizar, baixe uma cópia ou apague.',
      h('button', { class: 'btn btn-sec btn-peq', on: { click: verDados } }, icone('eye'), 'O que usamos'),
      h('a', { class: 'btn btn-sec btn-peq', href: '/api/v1/dados/exportar', download: '' }, icone('download-simple'), 'Exportar'),
      h('button', { class: 'btn btn-texto btn-peq', on: { click: apagar } }, icone('trash'), 'Apagar histórico')),
    cartao('notebook', 'Seus registros', 'Textos, conversas e cartões que você produziu.',
      h('a', { class: 'btn btn-sec btn-peq', href: '#/conversar' }, 'Conversas'), h('a', { class: 'btn btn-sec btn-peq', href: '#/material' }, 'Materiais'), h('a', { class: 'btn btn-sec btn-peq', href: '#/revisar' }, 'Cartões')),
    jaInstalado() ? null : cartao('seal-check', 'Instalar no celular', 'Ícone do Tuiuiú na tela inicial e abre em tela cheia, como um app.', h('button', { class: 'btn btn-sec btn-peq', on: { click: instalar } }, icone('download-simple'), 'Instalar')),
    cartao('gear', 'Preferências', 'Dia ou noite e velocidade do áudio neste aparelho.', h('button', { class: 'btn btn-sec btn-peq', on: { click: preferencias } }, 'Configurar')),
    cartao('lock-key', 'Segurança', eu.autenticacao?.provedor === 'supabase' ? 'E-mail confirmado. Crie ou altere sua senha com um código enviado para você, inclusive se entra com Google.' : 'Senha da conta.', h('button', { class: 'btn btn-sec btn-peq', on: { click: trocarSenha } }, eu.autenticacao?.provedor === 'supabase' ? 'Gerenciar senha' : 'Alterar senha')),
    h('div', { class: 'linha-acoes rodape-conta' },
      h('button', { class: 'btn btn-sec', on: { click: async () => { await api('/auth/sair', { metodo: 'POST' }); estado.eu = null; location.hash = '#/entrar'; } } }, icone('sign-out'), 'Sair'),
      h('button', { class: 'btn btn-perigo', on: { click: excluirConta } }, 'Excluir conta')),
    h('p', { class: 'ajuda' }, h('a', { href: '/politica-de-privacidade/' }, 'Privacidade'), ' · ', h('a', { href: '/termos/' }, 'Termos')));
  el.append(cartao('users','Plano compartilhado',ass.grupo.compartilhado?`${ass.grupo.ocupadas} de ${ass.grupo.pessoas} vagas`:'Use um convite para entrar em um plano Família ou Turma.',h('button',{class:'btn btn-sec',on:{click:gerenciarGrupo}},ass.grupo.compartilhado?'Gerenciar grupo':'Entrar com código')));

}
