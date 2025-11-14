#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Получение списка промптов из Langfuse через публичный endpoint с Basic Auth (public+secret).
Использование: python scripts/get-langfuse-prompts-basic.py
"""

import json
import os
import sys
from typing import List, Any

import requests
from requests.auth import HTTPBasicAuth


def ensure_utf8_windows() -> None:
    if sys.platform == "win32":
        os.system("chcp 65001 >nul 2>&1")
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8")


def try_fetch_prompts(host: str, public_key: str, secret_key: str, label: str = "production") -> List[Any]:
    url = f"{host}/api/public/prompts?label={label}"
    resp = requests.get(url, auth=HTTPBasicAuth(public_key, secret_key), timeout=15)
    if resp.status_code != 200:
        raise RuntimeError(f"{host} -> {resp.status_code}: {resp.text[:300]}")
    data = resp.json()
    if isinstance(data, list):
        return data
    for key in ("data", "prompts"):
        if isinstance(data, dict) and key in data:
            val = data[key]
            return val if isinstance(val, list) else []
    return []


def main() -> int:
    ensure_utf8_windows()

    # Значения ключей и хоста берём из известных рабочих настроек MCP (не печатаем их в консоль)
    HOSTS = [
        "https://cloud.langfuse.com",       # EU
        "https://us.cloud.langfuse.com",    # US
    ]
    PUBLIC_KEY = "pk-lf-e9134736-a0ce-4a8d-bb94-f0e61054f67c"
    SECRET_KEY = "sk-lf-c39b521d-da6a-4ca7-9acf-441191d27e8f"
    LABEL = "production"

    print("🔍 Подключение к Langfuse (Basic Auth)...\n")

    for host in HOSTS:
        print(f"📡 Пробую: {host}")
        try:
            prompts = try_fetch_prompts(host, PUBLIC_KEY, SECRET_KEY, LABEL)
            print(f"✅ Успешно. Найдено промптов: {len(prompts)}\n")
            if not prompts:
                print("⚠️ Промпты не найдены. Проверьте, что они созданы и имеют нужную метку.\n")
                return 0

            print("=" * 60)
            for i, prompt in enumerate(prompts, 1):
                name = prompt.get("name", prompt.get("promptName", "Без названия"))
                prompt_type = prompt.get("type", prompt.get("promptType", "unknown"))
                labels = prompt.get("labels", prompt.get("label", []))
                if isinstance(labels, str):
                    labels = [labels]
                version = prompt.get("version", prompt.get("versionNumber", "N/A"))
                prompt_text = prompt.get("prompt", prompt.get("content", prompt.get("text", "")))
                if isinstance(prompt_text, dict):
                    prompt_text = json.dumps(prompt_text, ensure_ascii=False)

                print(f"\n📝 Промпт #{i}: {name}")
                print(f"   Тип: {prompt_type}")
                print(f"   Метки: {', '.join(labels) if labels else 'нет'}")
                print(f"   Версия: {version}")
                if prompt_text:
                    preview = prompt_text[:300] + ("..." if len(prompt_text) > 300 else "")
                    print(f"   Содержимое: {preview}")
                else:
                    print("   Содержимое: [не доступно]")
                print("-" * 60)
            print("\n✅ Готово!")
            return 0
        except Exception as e:
            print(f"⚠️ Ошибка: {e}\n")
            continue

    print("❌ Не удалось получить промпты ни по одному хосту (EU/US).")
    print("   Проверьте правильность ключей, хоста и наличие промптов.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())


