# Integrar o Controle de Expedição com PostgreSQL

O app (arquivo HTML) não fala direto com o PostgreSQL — ele fala com uma **API**
(o `server.js`), e a API fala com o banco. Como essa API usa as mesmas ações que o
app já conhece (load / cargas / estoque / meta / all), **você só troca o link** no
"⚙ configurar". Nada mais muda no app.

Você vai precisar de duas coisas online:
1. Um banco **PostgreSQL** (vou usar o Neon, que tem plano grátis).
2. Um lugar para rodar a **API** (vou usar o Render, plano grátis).

Existe também a opção "tudo em um" no Railway (banco + API no mesmo lugar) — está no fim do guia.

---

## PARTE 1 — Criar o banco PostgreSQL (Neon)

1. Acesse https://neon.tech e crie uma conta (pode entrar com o Google).
2. Clique em **Create project**. Dê um nome (ex.: "expedicao"), escolha a região mais próxima (ex.: South America) e crie.
3. Quando abrir, procure a **Connection string** (algo como
   `postgresql://usuario:senha@ep-xxxx.sa-east-1.aws.neon.tech/neondb?sslmode=require`).
   Copie e guarde — isso é o seu **DATABASE_URL**.
4. No menu lateral, abra **SQL Editor**, cole TODO o conteúdo do arquivo `schema.sql`
   e clique em **Run**. Isso cria a tabela e os 3 registros iniciais.

## PARTE 2 — Colocar a API no ar (Render)

A API são 3 arquivos: `server.js`, `package.json` e `schema.sql`.

### 2a. Subir os arquivos no GitHub
1. Crie uma conta em https://github.com (se não tiver).
2. Clique em **New repository**, nome ex.: "expedicao-api", deixe **Public**, e crie.
3. Na página do repositório, clique em **Add file > Upload files**, arraste os 3 arquivos
   (`server.js`, `package.json`, `schema.sql`) e clique em **Commit changes**.

### 2b. Publicar no Render
1. Acesse https://render.com e crie conta (pode entrar com o GitHub).
2. Clique em **New > Web Service** e selecione o repositório "expedicao-api".
3. Preencha:
   - **Runtime/Language:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
4. Em **Environment / Environment Variables**, adicione uma variável:
   - **Key:** `DATABASE_URL`
   - **Value:** a connection string que você copiou do Neon
5. Clique em **Create Web Service** e aguarde o deploy terminar (fica "Live").
6. No topo aparece o endereço do serviço, algo como
   `https://expedicao-api.onrender.com`. Esse é o **link da API**.

### 2c. Testar
Abra no navegador: `https://expedicao-api.onrender.com/?action=load`
Deve aparecer: `{"cargas":[],"estoqueQtd":{},"meta":{}}`
Se apareceu isso, está funcionando.

## PARTE 3 — Ligar o app ao novo banco

1. Abra o app (o arquivo HTML) no celular/computador.
2. Toque no indicador **⚙ / sincronização** no topo.
3. Cole o **link da API** (ex.: `https://expedicao-api.onrender.com`) e confirme.
4. Pronto. O app passa a ler e gravar no PostgreSQL.

> Dica de migração: faça o passo 3 primeiro no aparelho que JÁ está com todos os
> dados (vindos da planilha Google). Como o banco novo está vazio, o app vai
> **enviar** os dados que ele tem para o PostgreSQL (semear). Depois, nos outros
> aparelhos, é só colar o mesmo link — eles vão **adotar** os dados do banco.

---

## Observações importantes

- **HTTPS:** o Render entrega o endereço já em `https://`, então funciona tanto com o
  app aberto pelo arquivo no celular quanto hospedado. Não use endereço `http://`.
- **"Cold start" no plano grátis:** depois de uns minutos sem uso, o servidor do Render
  "dorme". A primeira sincronização depois disso pode demorar ~30 segundos; as
  seguintes são rápidas. Se quiser que nunca durma, é só subir para um plano pago
  baratinho do Render.
- **Backup:** o Neon tem histórico/branching; e como tudo fica no banco, você pode
  exportar quando quiser pelo SQL Editor (`select * from app_state;`).

---

## Alternativa "tudo em um" — Railway

Se preferir banco + API no mesmo lugar:
1. Acesse https://railway.app e crie conta com o GitHub.
2. **New Project > Deploy from GitHub repo** e escolha o repositório "expedicao-api".
3. No projeto, clique em **+ New > Database > PostgreSQL**. O Railway cria o banco e
   já injeta a variável `DATABASE_URL` automaticamente no serviço.
4. Abra o banco > aba **Query** (ou Data) e rode o conteúdo de `schema.sql`.
5. No serviço da API, em **Settings > Networking**, gere um **domínio público**
   (`https://expedicao-api-production.up.railway.app`).
6. Use esse endereço no "⚙ configurar" do app (igual à Parte 3).

---

## Alternativa sem servidor — Supabase (Postgres gerenciado)

O Supabase é PostgreSQL com uma API REST pronta (não precisa hospedar o `server.js`).
Em compensação, o app precisaria de pequenas mudanças no código de sincronização e de
uma chave de acesso (anon key) com regras de segurança. Se você preferir esse caminho,
me avisa que eu adapto o app para o Supabase.
