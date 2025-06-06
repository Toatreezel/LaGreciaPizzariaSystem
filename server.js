// server.js
// Servidor intermediário para receber webhooks do iFood/Anota Aí e transmitir para o PWA.
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Lista de clientes (navegadores PWA) conectados para receber atualizações
let clients = [];

// Middleware
app.use(cors()); // Permite que seu PWA (em outro domínio) se conecte a este servidor
app.use(bodyParser.json()); // Processa o corpo de pedidos JSON recebidos
app.use(bodyParser.urlencoded({ extended: false }));

// Função para enviar eventos (novos pedidos) para todos os clientes conectados
function sendEventsToAll(newOrder) {
  clients.forEach(client => 
    client.res.write(`data: ${JSON.stringify(newOrder)}\n\n`)
  );
}

// 1. Endpoint de Eventos (o PWA se conecta aqui para ouvir)
app.get('/events', (req, res) => {
  // Configurações para Server-Sent Events (SSE)
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  res.writeHead(200, headers);

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res // Armazena o objeto de resposta para poder enviar dados mais tarde
  };
  clients.push(newClient);
  console.log(`Cliente ${clientId} conectado.`);

  // Mensagem inicial para confirmar a conexão
  res.write(`data: ${JSON.stringify({ message: "Conectado ao servidor de pedidos em tempo real!" })}\n\n`);

  // Remove o cliente da lista se ele fechar a conexão
  req.on('close', () => {
    console.log(`Cliente ${clientId} desconectou.`);
    clients = clients.filter(client => client.id !== clientId);
  });
});

// 2. Endpoint do Webhook (iFood e Anota Aí enviam pedidos para cá)
app.post('/webhook', (req, res) => {
  console.log('Webhook recebido!');
  console.log('Corpo do pedido:', JSON.stringify(req.body, null, 2));
  
  const novoPedido = req.body;

  // Retransmite o novo pedido para todos os clientes PWA conectados
  sendEventsToAll(novoPedido);

  // Responde imediatamente à plataforma de delivery para confirmar o recebimento
  res.status(200).send('Pedido recebido com sucesso.');
});

// Endpoint raiz para verificar se o servidor está online
app.get('/', (req, res) => {
    res.send('Servidor Webhook da LaGRÉCIA Pizzaria está online e pronto para receber pedidos!');
});


app.listen(PORT, () => {
  console.log(`Servidor Webhook escutando na porta ${PORT}`);
});
