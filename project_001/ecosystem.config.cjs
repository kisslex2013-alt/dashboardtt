// PM2 конфигурация для Time Tracker Dashboard (CommonJS)
require('dotenv').config()
const path = require('path')

// Получаем порт из .env или используем 5173 по умолчанию (Vite default)
const PORT = process.env.PORT || process.env.VITE_PORT || 5173

module.exports = {
  apps: [
    {
      name: 'time-tracker-dev',
      script: './pm2-dev.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      interpreter: 'node',

      // Отключен watch в PM2, так как Vite сам имеет hot reload
      // Watch в PM2 вызывает проблемы на Windows (открываются окна cmd.exe)
      watch: false,
      watch_delay: 1000,
      ignore_watch: [
        'node_modules',
        '.git',
        'dist',
        'build',
        '*.log',
        'logs',
        'package-lock.json',
        '.env',
        'primer',
        'backups',
        'backup',
        'problems',
        'solution',
        'doc',
        'docs',
        'referens',
        'primer',
        '.vite',
      ],

      // Логирование ошибок
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Переменные окружения
      env: {
        NODE_ENV: 'development',
        PORT: PORT,
        VITE_PORT: PORT,
      },

      // Отключен autorestart для dev режима (Vite сам управляет перезапусками)
      autorestart: false,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',

      // Дополнительные настройки
      kill_timeout: 5000,
      wait_ready: false,
      listen_timeout: 10000,
    },
  ],
}
