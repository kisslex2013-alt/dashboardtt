#!/usr/bin/env node
/**
 * Тестовый скрипт для проверки подключения к Langfuse MCP серверу
 * и получения списка промптов
 */

const { spawn } = require('child_process');

// Ключи из конфигурации
const LANGFUSE_SECRET_KEY = 'sk-lf-c39b521d-da6a-4ca7-9acf-441191d27e8f';
const LANGFUSE_PUBLIC_KEY = 'pk-lf-e9134736-a0ce-4a8d-bb94-f0e61054f67c';

console.log('🔍 Проверка подключения к Langfuse MCP серверу...\n');

// Устанавливаем переменные окружения
process.env.LANGFUSE_SECRET_KEY = LANGFUSE_SECRET_KEY;
process.env.LANGFUSE_PUBLIC_KEY = LANGFUSE_PUBLIC_KEY;

// Запускаем MCP сервер в режиме тестирования
const mcpServer = spawn('melt-langfuse-mcp', ['server'], {
  env: {
    ...process.env,
    LANGFUSE_SECRET_KEY,
    LANGFUSE_PUBLIC_KEY,
  },
  stdio: ['pipe', 'pipe', 'pipe'],
});

let output = '';
let errorOutput = '';

mcpServer.stdout.on('data', (data) => {
  output += data.toString();
  console.log('📤 Output:', data.toString());
});

mcpServer.stderr.on('data', (data) => {
  errorOutput += data.toString();
  console.error('❌ Error:', data.toString());
});

mcpServer.on('close', (code) => {
  console.log(`\n✅ MCP сервер завершил работу с кодом: ${code}`);
  if (output) {
    console.log('\n📋 Вывод:', output);
  }
  if (errorOutput) {
    console.log('\n⚠️ Ошибки:', errorOutput);
  }
});

// Отправляем тестовый запрос через stdin (MCP протокол)
setTimeout(() => {
  const testRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {},
  };
  
  console.log('\n📨 Отправка тестового запроса...');
  mcpServer.stdin.write(JSON.stringify(testRequest) + '\n');
  
  // Через 5 секунд закрываем соединение
  setTimeout(() => {
    mcpServer.kill();
  }, 5000);
}, 1000);

console.log('\n💡 Примечание: Для работы через Cursor нужно:');
console.log('   1. Убедиться, что Cursor перезапущен');
console.log('   2. Проверить Settings → MCP → Installed MCP Servers');
console.log('   3. Использовать команды в чате Cursor: "Покажи мне все мои промпты"');

