# Deploy do Inglou na VPS da Arcane

> **No ar desde 18/10/2026** em https://inglou.arcanestudios.io (projeto Docker `inglou`, VPS 2051121). O que está valendo hoje é `docs/vps/docker-compose.yml` (container `node:22-alpine` que baixa o código do GitHub ao iniciar, no mesmo padrão dos outros projetos da VPS; sem Dockerfile e sem rede externa). Segredos (`GH_TOKEN`, `ANTHROPIC_API_KEY`, `BACKUP_S3_*`) ficam só nas variáveis do projeto na Hostinger, nunca no repositório. Para atualizar depois de um push: reiniciar o projeto `inglou` (o container busca a versão nova) e conferir os dados depois. Backup diário automático para o bucket `inglou` do R2 (conferido: "fora do servidor: ok"). A seção abaixo é o plano original com Dockerfile, mantida como referência.

Padrão da base (`playbooks/deploy-vps.md`): projeto Docker próprio, Traefik com Let's Encrypt, DNS na Cloudflare com proxy. **Só criar coisas novas; não mexer em containers existentes.**

## Antes de subir (decisões do Gabriel)
1. Domínio: `inglou.arcanestudios.io` está nos arquivos como provisório (canonical, og:image, robots, sitemap, compose). Trocar se for outro.
2. Como a VPS pega o código: o repositório é privado, então precisa de um token **só leitura** no servidor (nunca no repositório) ou de uma imagem construída fora.
3. Nome da rede do Traefik na VPS (`docker network ls`) e o nome do certresolver usados nos outros projetos.
4. Modelos de IA e chave da Anthropic (ver docs/PROPOSTA.md, custos). Sem chave, sobe no modo de prática.
5. Credenciais do R2/B2 para a cópia de backup fora do servidor.
6. `PAGAMENTO_MODO=desligado` em produção até integrar o Asaas (o botão de assinar avisa que o pagamento ainda não está ligado).
7. Razão social, CNPJ e e-mail de contato na política de privacidade e nos termos (estão como `[A DEFINIR]`), e revisão jurídica dos dois textos.

## Subir
```bash
# na VPS, numa pasta nova
git clone <repo> inglou && cd inglou
cp .env.example .env && chmod 600 .env    # preencher ANTHROPIC_API_KEY, BACKUP_S3_*, SITE_URL, IA_MODELO_*
docker compose -p inglou up -d --build
docker compose -p inglou logs -f app      # deve mostrar "[inglou] no ar na porta 8080"
```
Cloudflare: registro **A** `inglou` → IP da VPS, com proxy ligado.

## Depois de subir
1. `templates/seguranca/auditar-site.sh https://inglou.arcanestudios.io --app` (zero falhas).
2. Criar uma conta de teste, fazer o teste de nível e uma lição pelo celular.
3. `docker compose -p inglou exec app node scripts/backup.js --mostrar-chave`: conferir que o arquivo chegou no bucket e guardar a chave num gerenciador de senhas.
4. Antes de todo deploy novo: backup manual; depois do deploy, conferir que os dados continuam lá.
