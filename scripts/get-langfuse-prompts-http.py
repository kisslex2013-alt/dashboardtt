#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для получения списка промптов из Langfuse через HTTP API
Использование: python scripts/get-langfuse-prompts-http.py
"""

import requests
import json
import sys
import os

# Устанавливаем UTF-8 для Windows
if sys.platform == 'win32':
    os.system('chcp 65001 >nul 2>&1')
    sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None

# Ключи из конфигурации
LANGFUSE_SECRET_KEY = "sk-lf-c39b521d-da6a-4ca7-9acf-441191d27e8f"
LANGFUSE_PUBLIC_KEY = "pk-lf-e9134736-a0ce-4a8d-bb94-f0e61054f67c"

# Попробуем оба региона
REGIONS = [
    "https://cloud.langfuse.com",  # EU
    "https://us.cloud.langfuse.com"  # US
]

print("🔍 Подключение к Langfuse...\n")

for region in REGIONS:
    print(f"📡 Пробую регион: {region}")
    
    # Попробуем разные варианты endpoint
    endpoints = [
        "/api/public/prompts",
        "/api/public/prompts/list",
        "/api/public/prompts?label=production",
    ]
    
    for endpoint in endpoints:
        url = f"{region}{endpoint}"
        headers = {
            "Authorization": f"Bearer {LANGFUSE_PUBLIC_KEY}",
            "X-Langfuse-Secret-Key": LANGFUSE_SECRET_KEY,
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Успешно подключено к {region}{endpoint}\n")
                
                # Обработка ответа
                if isinstance(data, list):
                    prompts = data
                elif isinstance(data, dict) and "data" in data:
                    prompts = data["data"]
                elif isinstance(data, dict) and "prompts" in data:
                    prompts = data["prompts"]
                else:
                    prompts = [data] if data else []
                
                if not prompts or len(prompts) == 0:
                    print("⚠️ Промпты не найдены. Убедитесь, что:")
                    print("   1. Промпты созданы в Langfuse dashboard")
                    print("   2. Промпты имеют метку 'production' (или другую настроенную метку)")
                else:
                    print(f"✅ Найдено промптов: {len(prompts)}\n")
                    print("=" * 60)
                    
                    for i, prompt in enumerate(prompts, 1):
                        name = prompt.get("name", prompt.get("promptName", "Без названия"))
                        prompt_type = prompt.get("type", prompt.get("promptType", "unknown"))
                        labels = prompt.get("labels", prompt.get("label", []))
                        if isinstance(labels, str):
                            labels = [labels]
                        version = prompt.get("version", prompt.get("versionNumber", "N/A"))
                        
                        # Получаем содержимое промпта
                        prompt_text = prompt.get("prompt", prompt.get("content", prompt.get("text", "")))
                        if isinstance(prompt_text, dict):
                            prompt_text = json.dumps(prompt_text, ensure_ascii=False)
                        
                        print(f"\n📝 Промпт #{i}: {name}")
                        print(f"   Тип: {prompt_type}")
                        print(f"   Метки: {', '.join(labels) if labels else 'нет'}")
                        print(f"   Версия: {version}")
                        
                        # Показываем первые 300 символов промпта
                        if prompt_text:
                            if len(prompt_text) > 300:
                                print(f"   Содержимое: {prompt_text[:300]}...")
                            else:
                                print(f"   Содержимое: {prompt_text}")
                        else:
                            print(f"   Содержимое: [не доступно]")
                        
                        print("-" * 60)
                    
                    print("\n✅ Готово!")
                    sys.exit(0)
                    
            elif response.status_code == 401:
                print(f"❌ Ошибка аутентификации: {response.text}")
            elif response.status_code == 403:
                print(f"❌ Доступ запрещен: {response.text}")
            else:
                print(f"⚠️ Статус {response.status_code}: {response.text[:200]}")
                
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Ошибка запроса: {e}")
            continue
    
    print(f"❌ Не удалось подключиться к {region}\n")

print("\n❌ Не удалось получить промпты ни из одного региона.")
print("\n💡 Возможные причины:")
print("   1. Неправильные API ключи")
print("   2. Промпты еще не созданы в Langfuse dashboard")
print("   3. Проблемы с сетью")
print("   4. Неправильный формат аутентификации")
sys.exit(1)

