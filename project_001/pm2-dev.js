// PM2 скрипт для запуска Vite dev сервера
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { platform } from 'os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Определяем, запущены ли мы на Windows
const isWindows = platform() === 'win32'

// Настройки для запуска без окон (Windows)
const spawnOptions = {
  cwd: __dirname,
  stdio: 'inherit',
  shell: false, // НЕ используем shell, чтобы не открывались окна cmd.exe
  windowsHide: true, // Скрываем окно на Windows
  detached: false, // Не отсоединяем процесс
}

// Запускаем vite через node напрямую (находим vite в node_modules)
import { existsSync } from 'fs'
import { join } from 'path'

const vitePath = join(__dirname, 'node_modules', '.bin', isWindows ? 'vite.cmd' : 'vite')
const viteBinPath = join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js')

// Используем vite напрямую через node, если доступен
let command, args
if (existsSync(viteBinPath)) {
  command = 'node'
  args = [viteBinPath, '--force']
} else if (existsSync(vitePath)) {
  command = vitePath
  args = ['--force']
} else {
  // Fallback: используем npx (должен быть в PATH)
  command = isWindows ? 'npx.cmd' : 'npx'
  args = ['vite', '--force']
}

const child = spawn(command, args, spawnOptions)

child.on('close', code => {
  process.exit(code || 0)
})

child.on('error', err => {
  console.error('Ошибка запуска:', err)
  process.exit(1)
})

// Обработка сигналов для корректного завершения
process.on('SIGTERM', () => {
  child.kill('SIGTERM')
})

process.on('SIGINT', () => {
  child.kill('SIGINT')
})
