import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'

import { resolve } from 'path'

/**
 * 檢查使用者根目錄下的 localhost 憑證，決定是否啟用 HTTPS。
 * @returns {false | { key: Buffer, cert: Buffer }} 如果檔案存在，回傳 HTTPS 設定，否則回傳 false。
 */
export function useHttpsConfig() {
  const homeDir = homedir()
  const httpsKeyPath = resolve(homeDir, 'localhost-key.pem')
  const httpsCertPath = resolve(homeDir, 'localhost.pem')

  // 檢查檔案是否存在
  const hasHttpsKey = existsSync(httpsKeyPath)
  const hasHttpsCert = existsSync(httpsCertPath)
  const useHttps = hasHttpsKey && hasHttpsCert

  if (!useHttps) {
    console.warn(
      '\x1b[33m%s\x1b[0m',
      `⚠️  HTTPS 未啟用，因為找不到憑證：
  - ${!hasHttpsKey ? `Key 缺少：${httpsKeyPath}` : ''}
  - ${!hasHttpsCert ? `Cert 缺少：${httpsCertPath}` : ''}
  
  如果要啟用 HTTPS，請執行：
  mkcert -key-file ~/localhost-key.pem -cert-file ~/localhost.pem localhost
  然後重新啟動 Vite。\n`,
    )
    return false
  }

  return {
    key: readFileSync(httpsKeyPath),
    cert: readFileSync(httpsCertPath),
  }
}
