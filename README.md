# dgm

PC画面に万華鏡キットを当ててのぞくための、動く幾何学模様を表示する小さなブラウザ作品です。

https://vestige.github.io/dgm/

## 使い方

1. `npm install`
2. `npm run build`
3. `index.html` をブラウザで開く
4. または `npm run serve` のあと `http://127.0.0.1:8000/` を開く

## できること

- 動く幾何学模様を全画面に表示
- プリセットや色を切り替え
- スピード、量、大きさ、残像を調整
- 鏡面シミュレーションで万華鏡っぽい反射を表示
- 丸い「のぞき窓」表示に切り替え
- 距離スライダーでボケ感を調整
- 十字キーで視野を動かして見え方をずらす

左上のパネルで模様を変えて、画面に万華鏡キットを当ててのぞきます。

キーボード操作:

- `←` `↑` `→` `↓`: 視野を動かす
- `c`: 視野を中央に戻す
- `f`: 全画面
- `h`: パネルの表示切り替え

## ファイル構成

- `index.html`: 画面の見た目
- `style.css`: 色やレイアウト
- `src/main.ts`: 元のTypeScriptコード
- `script.js`: ブラウザで読むビルド後のJavaScript
- `tsconfig.json`: TypeScriptの設定

## 改造の入口

- `src/main.ts` の `settings.speed` を変えてみる
- `palettes` の色コードを好きな色に変える
- `drawPetals()` をまねして新しい `draw...()` 関数を作る

## GitHub Pages

この構成は静的サイトなので、そのまま GitHub Pages に公開できます。
