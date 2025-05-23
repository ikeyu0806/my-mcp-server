import {
  McpServer,
  // ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import trash from 'trash'
import { exec } from 'child_process'
import axios from 'axios'
import puppeteer from 'puppeteer'
import { Client } from '@notionhq/client'

// Create an MCP server
const server = new McpServer({
  name: 'MyMCPServer',
  version: '1.0.0',
})

server.tool(
  'fetch_news',
  'ニュースを収集する',
  { query: z.string() },
  async ({ query }) => {
    const now = new Date()
    now.setDate(now.getDate() - 1)

    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0') // 月は0始まり
    const day = String(now.getDate()).padStart(2, '0')

    const from = `${year}-${month}-${day}`

    const endpoint = `https://newsapi.org/v2/everything?q=${query}&from=${from}&sortBy=popularity&apiKey=${process.env.NEWS_API_KEY}`
    const response = await axios.get(endpoint)

    const articles = response.data.articles
    const contents = articles
      .map((article: { title: string; url: string }) => {
        return `${article.title} ${article.url}`
      })
      .join('\n')

    return {
      content: [
        {
          type: 'text',
          text: `${query}のニュースを取得しました。${contents}`,
        },
      ],
    }
  },
)

server.tool(
  'fetch_webpage',
  '与えられたURLにGETリクエストを送ってページのmain要素を取得する',
  { url: z.string() },
  async ({ url }) => {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'domcontentloaded' })

    const mainHTML = await page.$eval('main', (el) => el.innerHTML)

    await browser.close()

    return {
      content: [
        {
          type: 'text',
          text: `${url}の要素を取得しました。${mainHTML}`,
        },
      ],
    }
  },
)

server.tool(
  'clean_desktop_files',
  'ローカルファイルのデスクトップファイルを削除する',
  {},
  async () => {
    const desktopPath = path.join(os.homedir(), 'Desktop')

    const files = await fs.readdir(desktopPath)

    const fullPaths = files.map((file) => path.join(desktopPath, file))

    trash(fullPaths)

    return {
      content: [
        {
          type: 'text',
          text: '削除しました',
        },
      ],
    }
  },
)

server.tool('docker_prune', 'Dockerの不要なデータを削除する', {}, async () => {
  exec('docker system prune -f', (error, stdout, stderr) => {
    if (error) {
      console.error(`エラー: ${error.message}`)
      return
    }
    if (stderr) {
      console.error(`標準エラー: ${stderr}`)
      return
    }
    console.log(`標準出力: ${stdout}`)
  })

  return {
    content: [
      {
        type: 'text',
        text: 'Dockerの不要なデータを削除しました',
      },
    ],
  }
})

server.tool('get_it_hotentry', 'ITのホットエントリを取得する', {}, async () => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  await page.goto('https://b.hatena.ne.jp/hotentry/it')

  const entries = await page.$$eval(
    'h3.entrylist-contents-title a',
    (elements) =>
      elements.map((el) => ({
        title: el.textContent ? el.textContent.trim() : '',
        href: el.href,
      })),
  )

  const text_entries = entries
    .map((entry) => `${entry.title} ${entry.href}`)
    .join('\n')

  return {
    content: [
      {
        type: 'text',
        text: text_entries,
      },
    ],
  }
})

// notion操作Tool
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

async function getPageContent(pageId: string) {
  // ブロックを取得（ページの中身）
  const blocks = []
  let cursor = undefined

  do {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
    })

    blocks.push(...response.results)
    cursor = response.has_more ? response.next_cursor : undefined
  } while (cursor)

  return blocks
}

server.tool(
  'get_notion_page',
  'Notionのページを取得する',
  { page_id: z.string() },
  async ({ page_id }) => {
    let result = [] as any[]
    getPageContent(page_id)
      .then((blocks) => {
        result.push(blocks)
      })
      .catch(console.error)

    const result_text = result.join('\n')

    return {
      content: [
        {
          type: 'text',
          text: `${page_id}の内容を取得しました。${result_text}`,
        },
      ],
    }
  },
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  // 標準出力をするとサーバーのレスポンスとして解釈されてしまうので、標準エラー出力に出力する
  console.error('MCP Server running on stdio')
}

main().catch((error) => {
  console.error('Error starting MCP server:', error)
  process.exit(1)
})
