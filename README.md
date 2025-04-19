## サーバ起動

```
npm run build
node ./build/index.js
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