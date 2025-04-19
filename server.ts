import express from 'express'
import cors from 'cors'
import { Request, Response } from 'express'

// MCPプロトコルの型を定義
interface MCPRequest {
  query: string
  conversation_id: string
  request_id: string
  parameters?: Record<string, any>
}

interface MCPResponse {
  response: string
  status: 'success' | 'error'
  error?: string
}

const app = express()
app.use(cors())
app.use(express.json())

// ヘルスチェックエンドポイント
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy' })
})

// MCPエンドポイント
app.post('/mcp', (req: Request, res: Response) => {
  try {
    const mcpRequest = req.body as MCPRequest
    console.log('受信したMCPリクエスト:', JSON.stringify(mcpRequest, null, 2))

    // クエリに基づいてリクエストを処理
    const response = processQuery(mcpRequest)

    res.status(200).json({
      status: 'success',
      response,
    } as MCPResponse)
  } catch (error) {
    console.error('MCPリクエストの処理中にエラーが発生:', error)
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : '不明なエラー',
      response:
        '申し訳ありませんが、リクエストの処理中にエラーが発生しました。',
    } as MCPResponse)
  }
})

// 様々なクエリタイプを処理する関数
function processQuery(request: MCPRequest): string {
  const { query, parameters } = request

  // クエリ処理の例 - 使い方に応じてカスタマイズしてください
  switch (query) {
    case 'getCurrentTime':
      return `現在の時刻は ${new Date().toLocaleTimeString()} です`

    case 'getWeather':
      const location = parameters?.location || '不明'
      // 実際のアプリではここで天気APIを呼び出す
      return `${location} の天気は現在晴れで 72°F です`

    case 'calculateSum':
      if (parameters?.numbers && Array.isArray(parameters.numbers)) {
        const sum = parameters.numbers.reduce(
          (a: number, b: number) => a + b,
          0,
        )
        return `数値の合計は ${sum} です`
      }
      return '合計計算のための無効なパラメータです'

    default:
      return `未認識のクエリ: ${query}`
  }
}

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`MCPサーバーがポート ${PORT} で実行中`)
})
