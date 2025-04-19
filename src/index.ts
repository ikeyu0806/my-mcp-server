import {
  McpServer,
  ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import trash from 'trash'
import { exec } from 'child_process'

// Create an MCP server
const server = new McpServer({
  name: 'MyMCPServer',
  version: '1.0.0',
})

// SDKのREADMEにあったサンプル
// Add an addition tool
server.tool('add', { a: z.number(), b: z.number() }, async ({ a, b }) => ({
  content: [{ type: 'text', text: String(a + b) }],
}))

server.tool(
  'fetch_it_news',
  'ITニュースを収集する',
  {},
  async () => {
    const hotentryData = await fetch('https://b.hatena.ne.jp/hotentry/it').then(
      (res) => res.text(),
    )

    return {
      content: [
        {
          type: 'text',
          text: hotentryData,
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

server.tool(
  'docker_prune',
  'Dockerの不要なデータを削除する',
  {},
  async () => {
    exec('docker system prune -f', (error, stdout, stderr) => {
      if (error) {
        console.error(`エラー: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`標準エラー: ${stderr}`);
        return;
      }
      console.log(`標準出力: ${stdout}`);
    })

    return {
      content: [
        {
          type: 'text',
          text: 'Dockerの不要なデータを削除しました',
        },
      ],
    }
  },
)

// SDKのREADMEにあったサンプル
// Add a dynamic greeting resource
server.resource(
  'greeting',
  new ResourceTemplate('greeting://{name}', { list: undefined }),
  async (uri, { name }) => ({
    contents: [
      {
        uri: uri.href,
        text: `Hello, ${name}!`,
      },
    ],
  }),
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
