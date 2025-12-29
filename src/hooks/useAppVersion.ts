import { useEffect, useState } from 'react'

interface VersionInfo {
  version: string | null
  build: string | null
}

interface VersionData {
  version?: string
  build?: string
}

/**
 * Хук для получения версии приложения из version.json
 * @returns Объект с version и build номером
 */
function useAppVersion(): VersionInfo {
  const [info, setInfo] = useState<VersionInfo>({ version: null, build: null })

  useEffect(() => {
    fetch('/version.json')
      .then((res) => res.json() as Promise<VersionData>)
      .then((data) => {
        setInfo({
          version: data.version || null,
          build: data.build || null,
        })
      })
      .catch(() => {
        // на всякий случай дефолт
        setInfo({ version: '1.3.0', build: null })
      })
  }, [])

  return info
}

export { useAppVersion }
