// Ficheiro 2: server.js
// Esta é a lógica do seu servidor.
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001; // Porta padrão para serviços como o Render

// --- Middleware ---
// Permite que seu PWA (em outro domínio) se conecte a este servidor
app.use(cors()); 
// Processa o corpo de pedidos JSON recebidos das plataformas de delivery
app.use(bodyParser.json());

// --- Armazenamento em Memória dos Clientes Conectados ---
let clients = [];

// --- Funções ---
// Envia dados para todos os clientes PWA conectados
function sendEventsToAll(data) {
  clients.forEach(client => 
    client.res.write(`data: ${JSON.stringify(data)}\n\n`)
  );
}

// --- Rotas da API ---

// 1. Rota de Eventos (O PWA conecta-se aqui para ouvir novos pedidos)
app.get('/events', (req, res) => {
  // Configurações para Server-Sent Events (SSE) que permitem uma conexão contínua
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  res.writeHead(200, headers);

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res // Armazena a resposta para podermos enviar dados mais tarde
  };
  clients.push(newClient);
  console.log(`[+] Novo cliente conectado: ${clientId}. Total: ${clients.length}`);

  // Envia uma mensagem inicial de boas-vindas para confirmar a conexão
  res.write(`data: ${JSON.stringify({ message: "Conectado ao servidor de pedidos em tempo real!" })}\n\n`);

  // Quando o cliente (navegador) fecha a conexão, remove-o da lista
  req.on('close', () => {
    console.log(`[-] Cliente desconectado: ${clientId}. Total: ${clients.length}`);
    clients = clients.filter(client => client.id !== clientId);
  });
});

// 2. Rota de Webhook (iFood e Anota Aí enviam os pedidos para este URL)
app.post('/webhook', (req, res) => {
  console.log('✅ Webhook recebido!');
  console.log('Conteúdo do Pedido:', JSON.stringify(req.body, null, 2));
  
  const novoPedido = req.body;

  // Retransmite o novo pedido para todos os painéis PWA abertos
  sendEventsToAll(novoPedido);

  // Responde imediatamente à plataforma de delivery para confirmar o recebimento
  res.status(200).json({ status: "sucesso", mensagem: "Pedido recebido." });
});

// 3. Rota Raiz (para verificar se o servidor está online)
app.get('/', (req, res) => {
    res.send(`Servidor Webhook da LaGRÉCIA Pizzaria está online. Clientes conectados: ${clients.length}`);
});


app.listen(PORT, () => {
  console.log(`Servidor Webhook da LaGRÉCIA Pizzaria a funcionar na porta ${PORT}`);
});

