#!/usr/bin/env node
/**
 * mock-server.js — 受信内容をそのままログに流すモックサーバ
 *
 * 使い方:
 *   node mock-server.js            # デフォルト: ポート 3000
 *   node mock-server.js 8080       # ポート 8080 で起動
 *   PORT=8080 node mock-server.js  # 環境変数でもOK
 *
 * すべての HTTP メソッド・パスを受け付け、
 * リクエストの内容をターミナルにそのまま表示します。
 * レスポンスは常に 200 OK を返します。
 */

const http = require('http')
const querystring = require('querystring')

const PORT = parseInt(process.argv[2] || process.env.PORT || '3000', 10)

// ── 色付け用 ANSI コード ──
const c = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
}

function separator() {
  return `${c.dim}${'─'.repeat(60)}${c.reset}`
}

function timestamp() {
  return new Date().toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    fractionalSecondDigits: 3,
  })
}

const server = http.createServer((req, res) => {
  const chunks = []

  req.on('data', chunk => chunks.push(chunk))

  req.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf-8')

    // ── ログ出力 ──
    console.log('')
    console.log(separator())
    console.log(`${c.bgBlue}${c.white}${c.bold} ${req.method} ${req.url} ${c.reset}  ${c.dim}${timestamp()}${c.reset}`)
    console.log(separator())

    // ヘッダ
    console.log(`${c.cyan}${c.bold}Headers:${c.reset}`)
    for (const [key, value] of Object.entries(req.headers)) {
      console.log(`  ${c.yellow}${key}${c.reset}: ${value}`)
    }

    // ボディ
    if (body) {
      console.log('')
      console.log(`${c.green}${c.bold}Body (raw):${c.reset}`)
      console.log(`  ${body}`)

      // Content-Type に応じてパースも試みる
      const ct = (req.headers['content-type'] || '').toLowerCase()

      if (ct.includes('application/json')) {
        try {
          const parsed = JSON.parse(body)
          console.log('')
          console.log(`${c.magenta}${c.bold}Body (parsed JSON):${c.reset}`)
          console.log(JSON.stringify(parsed, null, 2).split('\n').map(l => `  ${l}`).join('\n'))
        } catch { /* パース失敗は無視 */ }
      } else if (ct.includes('application/x-www-form-urlencoded')) {
        const parsed = querystring.parse(body)
        console.log('')
        console.log(`${c.magenta}${c.bold}Body (parsed form):${c.reset}`)
        for (const [key, value] of Object.entries(parsed)) {
          console.log(`  ${c.yellow}${key}${c.reset} = ${value}`)
        }
      }
    } else {
      console.log('')
      console.log(`${c.dim}(no body)${c.reset}`)
    }

    console.log(separator())

    // ── レスポンス ──
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
    })
    res.end('OK\n')
  })
})

server.listen(PORT, () => {
  console.log('')
  console.log(`${c.bold}${c.green}✓ Mock server listening on http://localhost:${PORT}${c.reset}`)
  console.log(`${c.dim}  すべてのリクエストの内容をそのままログに出力します${c.reset}`)
  console.log(`${c.dim}  Ctrl+C で停止${c.reset}`)
  console.log('')
})
