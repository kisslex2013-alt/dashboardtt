#!/usr/bin/env python3
"""
Скрипт для получения списка промптов из Langfuse
Использование: python scripts/get-langfuse-prompts.py
"""

import os
import sys

try:
    from langfuse import Langfuse
except ImportError:
    print("❌ Ошибка: Langfuse SDK не установлен")
    print("📦 Установите: pip install langfuse")
    sys.exit(1)

# Ключи из конфигурации
LANGFUSE_SECRET_KEY = "sk-lf-c39b521d-da6a-4ca7-9acf-441191d27e8f"
LANGFUSE_PUBLIC_KEY = "pk-lf-e9134736-a0ce-4a8d-bb94-f0e61054f67c"

print("🔍 Подключение к Langfuse...\n")

try:
    # Инициализация клиента Langfuse
    langfuse = Langfuse(
        public_key=LANGFUSE_PUBLIC_KEY,
        secret_key=LANGFUSE_SECRET_KEY,
        host="https://cloud.langfuse.com"  # EU регион
    )
    
    # Проверка подключения
    langfuse.auth_check()
    print("✅ Подключение успешно!\n")
    
    # Получение списка промптов
    print("📋 Получение списка промптов...\n")
    prompts = langfuse.fetch_prompts()
    
    if not prompts or len(prompts) == 0:
        print("⚠️ Промпты не найдены. Убедитесь, что:")
        print("   1. Промпты созданы в Langfuse dashboard")
        print("   2. Промпты имеют метку 'production' (или другую настроенную метку)")
    else:
        print(f"✅ Найдено промптов: {len(prompts)}\n")
        print("=" * 60)
        
        for i, prompt in enumerate(prompts, 1):
            print(f"\n📝 Промпт #{i}: {prompt.name}")
            print(f"   Тип: {prompt.type}")
            print(f"   Метки: {', '.join(prompt.labels) if prompt.labels else 'нет'}")
            print(f"   Версия: {prompt.version}")
            
            # Показываем первые 200 символов промпта
            prompt_text = prompt.prompt if hasattr(prompt, 'prompt') else str(prompt)
            if len(prompt_text) > 200:
                print(f"   Содержимое: {prompt_text[:200]}...")
            else:
                print(f"   Содержимое: {prompt_text}")
            
            print("-" * 60)
        
        print("\n✅ Готово!")
        
except Exception as e:
    print(f"❌ Ошибка: {e}")
    print("\n💡 Возможные причины:")
    print("   1. Неправильные API ключи")
    print("   2. Неправильный регион (попробуйте изменить host на 'https://us.cloud.langfuse.com')")
    print("   3. Проблемы с сетью")
    sys.exit(1)

