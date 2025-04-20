## サーバ起動

```
npm run build
node ./build/index.js
```

## Claude Desktopでの使い方
claude_desktop_config.jsonにローカルの`my-mcp-server/build/index.js`のパスとNews APIのパスを設定してください。

コードを書き換えた場合はnpm run buildを実行して変更を反映させてください

## プロンプト例
ニュース収集Toolを実行する場合
```
Appleのニュースを収集して
```

## prettier
```
npm run prettier
```

## メモ
MACのホストで開発しているのでnodeの管理が必要
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
nvm install node
```

プロジェクト作成
```
npm init -y
npm install typescript
npx tsc --init
```