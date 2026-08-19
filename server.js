/*****************************************************************
 *  API do Controle de Expedição  ->  PostgreSQL
 *  Fala a MESMA "língua" do app (ações: load / cargas / estoque /
 *  meta / all), então o app só precisa apontar para o endereço
 *  deste servidor no "⚙ configurar".
 *****************************************************************/
const express = require('express');
const { Pool } = require('pg');

const app = express();

// Conexão com o PostgreSQL (DATABASE_URL vem das variáveis de ambiente).
// SSL ligado para bancos gerenciados (Neon, Render, Railway, etc.).
// Para um Postgres local sem SSL, defina PGSSL=disable.
const usarSSL = process.env.PGSSL !== 'disable';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: usarSSL ? { rejectUnauthorized: false } : false
});

// Libera o acesso do app (CORS) e responde o "preflight".
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// O app envia o corpo como texto contendo JSON -> parseia qualquer tipo como JSON.
app.use(express.json({ type: () => true, limit: '10mb' }));

async function getValor(chave) {
  const r = await pool.query('select valor from app_state where chave=$1', [chave]);
  return r.rows[0] ? r.rows[0].valor : null;
}
async function setValor(chave, valor) {
  await pool.query(
    `insert into app_state (chave, valor, atualizado_em)
       values ($1, $2, now())
     on conflict (chave) do update
       set valor = excluded.valor, atualizado_em = now()`,
    [chave, JSON.stringify(valor)]
  );
}

// LER  (equivale ao "doGet ?action=load" do Google)
app.get('/', async (req, res) => {
  try {
    const cargas     = (await getValor('cargas'))  || [];
    const estoqueQtd = (await getValor('estoque')) || {};
    const meta       = (await getValor('meta'))    || {};
    res.json({ cargas, estoqueQtd, meta });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GRAVAR  (equivale ao "doPost" do Google)
app.post('/', async (req, res) => {
  try {
    const d = req.body || {};
    if (d.action === 'cargas')       await setValor('cargas',  d.cargas || []);
    else if (d.action === 'estoque') await setValor('estoque', d.estoqueQtd || {});
    else if (d.action === 'meta')    await setValor('meta',    d.meta || {});
    else if (d.action === 'all') {
      await setValor('cargas',  d.cargas || []);
      await setValor('estoque', d.estoqueQtd || {});
      await setValor('meta',    d.meta || {});
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('API de expedição rodando na porta ' + port));
