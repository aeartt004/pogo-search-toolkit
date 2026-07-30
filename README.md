# Pokémon GO 搜尋條件產生器 (pogo-search-toolkit)

純前端網頁工具，幫助 Pokémon GO 玩家用勾選/表單的方式組出遊戲搜尋欄可用的篩選語法字串，
不需要自己記憶或手算複雜的搜尋條件排列組合。

🌐 線上使用：https://aeartt004.github.io/pogo-search-toolkit/

## 功能

- 20 個分類的篩選條件：物種/暱稱、圖鑑編號、IV 星等、個別數值（攻/防/耐力）、
  CP/HP、抓到天數/年份、屬性、地區、夥伴等級、稀有狀態（閃光/傳說/暗影等）、
  性別、體型、進化/巨大化資訊、取得來源、自訂進階語法。
- **自動偵測衝突並拆解查詢**：Pokémon GO 搜尋語法不支援括號，且 OR（,）的
  優先權高於 AND（&）。當你同時在兩個以上分類做複選時，直接用 & 串接會產生
  錯誤的搜尋結果，本工具會自動用笛卡兒積展開成多條各自邏輯正確的查詢字串。
- **一鍵複製**：每條產生的查詢字串旁都有複製按鈕。
- **常用組合儲存**：可以把篩選組合存起來（目前為瀏覽器 localStorage），
  之後一鍵載入；也支援匯出/匯入 JSON 做跨裝置備份。

## 技術棧

純 HTML / CSS / JavaScript（無框架、無建置流程），可直接用瀏覽器開啟
`index.html`，也部署在 GitHub Pages 上供手機/電腦瀏覽器直接使用。

## 檔案結構

```
index.html          主頁面
css/style.css       樣式
js/data.js          篩選分類定義（資料驅動）
js/query-builder.js 核心邏輯：組字串 + 笛卡兒積拆解
js/storage.js       本機儲存（localStorage）
js/app.js           UI 渲染與互動
```

## 語法資料來源

篩選語法規則整理自 Pokémon GO Fandom Wiki 與 Niantic 官方說明文件。
遊戲更新後語法可能變動，若某條件在遊戲內沒有效果，請以遊戲內實際結果為準。

## 之後可能的擴充

- Firebase 帳號登入 + Firestore 雲端同步，取代/補強目前的 localStorage 儲存，
  達成跨裝置自動同步常用篩選組合。
