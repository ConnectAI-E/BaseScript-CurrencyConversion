import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { bitable } from '@base-open/web-api'
import { initI18n } from './i18n'
import App from './App'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LoadApp />
  </React.StrictMode>
)

function LoadApp() {
  const [load, setLoad] = useState(false)
  useEffect(() => {
    bitable.bridge.getLanguage().then((lang) => {
      initI18n(lang as any);
      setLoad(true)
    })
  }, [])

  if (load) {
    return <App />
  }

  return <></>
}
