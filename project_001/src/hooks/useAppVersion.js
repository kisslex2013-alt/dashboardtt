import { useEffect, useState } from 'react'

function useAppVersion() {
  const [info, setInfo] = useState({ version: null, build: null })

  useEffect(() => {
    fetch('/version.json')
      .then(res => res.json())
      .then(data => {
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

