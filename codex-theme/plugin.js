/**
 * Codex theme for the DeepSeek Harness web UI.
 *
 * The host half inlines `codex-theme.css` into every index response, so no
 * extra stylesheet request can fail or be cached stale. The file is read from
 * disk at render time: edit the CSS, reload the page, and the change is live
 * without restarting the server or rebuilding anything.
 *
 * The route is kept as well so the sheet can be inspected directly at
 * /codex-theme.css while debugging.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const name = 'codex-theme'

const STYLESHEET = fileURLToPath(new URL('./codex-theme.css', import.meta.url))
const ROUTE = '/codex-theme.css'

/** Read the stylesheet, reporting a readable reason rather than throwing. */
function readStylesheet() {
  try {
    return { css: readFileSync(STYLESHEET, 'utf8') }
  } catch (error) {
    return { error: `codex-theme: cannot read ${STYLESHEET}: ${String(error?.message ?? error)}` }
  }
}

function serveStylesheet(_req, res) {
  const { css, error } = readStylesheet()
  if (error !== undefined) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
    res.end(`${error}\n`)
    return
  }
  res.writeHead(200, {
    'content-type': 'text/css; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(css),
  })
  res.end(css)
}

export function apply(ctx) {
  ctx.inject(['webServer'], (webCtx) => {
    const webServer = webCtx.webServer

    webCtx.effect(() => {
      const removeRoute = webServer.register({ kind: 'exact', path: ROUTE, handler: serveStylesheet })

      // A raw tap runs after structured rows, so the block lands last in <head>.
      const removeTap = webServer.tapIndex((html) => {
        if (!html.includes('</head>')) return html
        const { css, error } = readStylesheet()
        if (error !== undefined) return html.replace('</head>', `<script>console.error(${JSON.stringify(error)})</script></head>`)
        return html.replace('</head>', `<style data-codex-theme>${css}</style>\n</head>`)
      })

      return () => {
        removeTap()
        removeRoute()
      }
    })
  })
}
