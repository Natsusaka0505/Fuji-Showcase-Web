# Q-Logistics — 風險感知全球供應鏈路徑優化

> Fujitsu Quantum Simulator Challenge 2025-26｜Q-Logistics: Risk-Aware Routing Optimization in Global Supply Chains

一個把量子最佳化成果變成**可操作**的網站。調整參數,65,536 個量子態全部重解、10,000 次災害情境重跑,全部在你的瀏覽器裡即時完成 —— 沒有後端、沒有 API、沒有載入中。

**線上版**:部署後填入網址

---

## 快速開始

需要 **Node.js 20 以上**。

```bash
git clone https://github.com/Natsusaka0505/Fuji-Showcase-Web.git
cd Fuji-Showcase-Web
npm install
npm run dev
```

開 <http://localhost:3000>。

就這樣 —— 不需要資料庫、環境變數、API 金鑰。所有資料在建置時就打包進去了。

> **本機開發位置**:這個專案放在 `~/Desktop/dev/App/Fuji-App`。要用 Claude Code 開發時,在該目錄下啟動,它會自動讀取 [`CLAUDE.md`](./CLAUDE.md) 取得完整脈絡 —— 模型公式、不可違反的口徑紀律、驗證流程、缺哪些資料。
>
> ```bash
> cd ~/Desktop/dev/App/Fuji-App && claude
> ```

---

## 怎麼用這個網站

左側(手機版是頂部「參數 ▼」)是**共用參數欄**,調整後六個分頁同步更新。

### 🗺 地圖

九港航線網路。淡線是 16 條候選航段(演算法的搜尋空間),金線是當前最佳航線。

- **點任何港口** → 封鎖它,航線立刻重算
- 把 `penalty_A` 拖到 **0.74 以下** → 標題列跳出「約束失效」紅籤,演算法開始選「作弊解」

> **這是最值得示範的互動。** QUBO 看不懂「必須是一條連貫航線」這種硬約束,只能靠懲罰項。把懲罰調掉,量子會選「什麼都不選」拿 0 分 —— A=0 時有 **527 個**這種作弊態。臨界值 A\*=0.74,出貨值 8.65 是 11.7 倍安全邊際。

### ▤ 排行

- **能量地貌**:全部 65,536 個狀態的分布(對數軸)。金線=最佳合法航線,紅線=全域最低能量。**兩線重合**代表懲罰項已強到讓「數學最低點」正好是「真能走的航線」
- **可行航線排行**:24 條通過流量守恆且能從新加坡走到洛杉磯的航線
- **演算法比較**:報告中的歷史紀錄(固定,不隨參數變動)

### ⚛ 演算法 ← 三個真的在跑的求解器

| 卡片 | 在做什麼 | 耗時 |
|---|---|---|
| **Grover 自適應搜尋** | 完整 2^16 振幅向量、真的振幅放大 + BBHT 外圈 | ~150 ms |
| **振幅放大解剖** | 固定門檻,每轉一次量一次命中機率 | 即時 |
| **QAOA** | 完整複數態向量演化 + Nelder-Mead 優化角度 | ~450 ms |
| **模擬退火** | 古典對照組 | <1 ms |

「振幅放大解剖」最能說明問題:門檻 -96 時有 14 個標記態,起始命中機率 0.02%,**實測峰值落在第 53 轉,理論估計 (π/4)√(N/M) = 54 轉**。這是真的在算,不是把公式畫成線。繼續轉下去機率會掉回來(過度旋轉)——這正是 Grover 必須知道何時停手的原因。

> **可以這樣示範**:把 Grover 的 `budget` 拉到 1,就會重現平台 40q 那次的失敗模式。

### ⚠ 風險

10,000 次蒙地卡羅災害情境,算出 CVaR(最壞 5% 的平均成本)。七個滑桿可調:每日延誤成本、航程窗口、CVaR 分位、蘇伊士衝突係數、颱風強度、地震頻率、情境數,加上荷莫茲海峽封鎖開關。

預設值下會重現報告的結論:**避開蘇伊士的地中海線 CVaR95 只有蘇伊士線的 46%**。

### ⬢ 40q

平台上那次 40-qubit 執行的完整紀錄(job 7951873)。**這頁是播放,不是重算** —— 2^40 是 16 TiB 的態向量。

含「16q 即時 vs 40q 播放」對照表:同一個演算法,規模差 24 個 qubit,一個在瀏覽器 2 毫秒、一個要 1024 節點跑 44.2 小時。

### ✓ 稽核

每個災害數字都附**官方即時查詢連結**。點高雄那條,USGS 官方回傳 243,與模型內建數字完全一致。

---

## 指令

| 指令 | 用途 |
|---|---|
| `npm run dev` | 開發伺服器 |
| `npm run build` | 產線建置 |
| `npm start` | 跑產線版(需先 build) |
| `npm run verify` | **完整驗證**:三個引擎 + 型別檢查 |
| `npm run precompute` | 重新產生資料包(需 Python 3 + numpy) |
| `npm run lint` | ESLint |

### 驗證在驗什麼

```bash
npm run verify
```

不是跑過就算,是逐項對帳:

- **`verify:engine`** — TS 求解器 vs Python 預算結果,**137 個 penalty 掃描點逐點比對**,含可行性轉折、勝出航線、作弊態計數
- **`verify:risk`** — 蒙地卡羅 vs 報告發表的四條航線平均值與 CVaR95
- **`verify:algos`** — 檢查**行為**而非數字:振幅峰值是否落在理論位置、過轉是否真的損失機率、GAS 是否在多數種子命中、**是否曾宣稱低於真實最優**、QAOA 收斂是否單調
- **`typecheck`** — 應用程式與 Node 腳本分開檢查

---

## 部署

專案是標準 Next.js,首頁預渲染為靜態內容。

**Vercel**(推薦):

```bash
npx vercel
```

或在 [vercel.com](https://vercel.com) 匯入這個 repo,零設定。

---

## 這個網站的資料從哪來

### 兩個模型都是逆向還原的

這是本專案技術上最關鍵的部分 —— 因為模型被還原出來,網站才能**即時重算**,而不是查表播放。

**QUBO** — 從 `q9_16q_ising.json` 的 65 個 Pauli 項還原,與平台的 `cost_of_z` 誤差 **2.3e-13**(浮點極限):

```
ising(x) = Σ score_e · x_e + A · Σ_v (flow_v(x) − rhs_v)² − offset
```

附帶發現:**流量守恆可行 ⟺ 懲罰項為 0**。所以航線解碼只需處理少數零懲罰態,不必掃過全部 65,536 個。

**蒙地卡羅** — 從報告發表的四條航線 CVaR 表回歸還原:

```
平均延誤天數 = w · Σ颱風關港天
             + 0.7934 · w · Σ(地震數 / 11.504)
             + 7.4979 · [經過蘇伊士]
```

擬合出的蘇伊士延誤 **7.4979 天**,對上筆記中**獨立寫下**的「7.5 天期望延誤」—— 這是結構正確的證據,不是拿四個常數去湊四個數字。

平均值擬合不出尾部形狀,所以另外用 2 個參數對四個 CVaR95 值擬合(災害事件持續時間 ~ Gamma(shape=2)、蘇伊士延誤為定值),RMS 誤差 3.1%,精準復現報告的 46% headline。

### 官方資料來源

| 資料 | 來源 |
|---|---|
| 地震 | USGS ANSS ComCat |
| 颱風 | 日本氣象廳 RSMC Tokyo Best Track |
| 蘇伊士/紅海 | 蘇伊士運河管理局 + IMF PortWatch |
| 荷莫茲 | 美國能源資訊署 EIA |

每筆都附查詢字串與連結,稽核分頁可直接點開比對。

---

## 兩件刻意不宣稱的事

**1. 航段的 cost / time / geo / port / weather 分項是推測,不是事實。**

需要 `QLogistics_Champion_ProposalAligned.csv`,該檔不在原 repo 內。所以 α/β/γ 權重滑桿**還沒做** —— 現有資料只有合成後的單一 `score`,拆不開。網站中相關數字標為 `hypothesis`,並在稽核分頁明確標註。

**2. 40 qubit 是規模、管線、牆鐘的里程碑,不是最佳化的勝利。**

那次執行 `feasible=false`、航線沒走到洛杉磯。乾淨的最佳化成果(-97.4936、真 Grover、已收斂)屬於較小規模的執行。

> **口徑紀律:品質看 16q、規模看 40q。** 40q 分頁的規模數字與品質數字刻意分成兩張卡,品質卡直接掛紅籤。

另外:筆記中的 `0.9281` 屬於**另一個** local reduced QUBO,與本站的 -97.4936 不是同一個模型,兩者不可同圖並列。這條警語寫在 `meta.json` 裡。

---

## 專案結構

```
tools/precompute.py       離線產生資料包
tools/verify_*.ts         對帳腳本
src/data/q9_data/         打包進建置的資料(9 個 JSON,約 46 KB)
src/data/index.ts         型別化存取
src/engine/model.ts       QUBO 求解、航線解碼、能量直方圖
src/engine/risk.ts        蒙地卡羅與 CVaR
src/engine/grover.ts      Grover 振幅放大與 BBHT
src/engine/qaoa.ts        QAOA 態向量與模擬退火
src/lib/store.ts          共用參數;兩個引擎在 render 期間執行
src/components/panels/    六個分頁
src/components/Dashboard  外殼:桌機側欄常駐,lg 以下收成抽屜
```

### 為什麼沒有 Web Worker

因為不需要。QUBO 全掃 0.5 ms、蒙地卡羅 2 ms —— 比一個影格還短,直接在 render 期間用 `useMemo` 算完。QAOA 約 450 ms 是唯一例外,所以改成按鈕手動觸發。

---

## 修改資料後

改了 `tools/precompute.py` 或上游的 ising JSON 之後:

```bash
npm run precompute   # 重新產生 src/data/q9_data/
npm run verify       # 確認沒有破壞任何對帳
```

`precompute.py` 需要 Python 3 與 numpy。它會自己驗證向量化模型與參考實作的誤差,對不上會直接 assert 失敗。

資料來源是上游的比賽 repo(`~/Desktop/Fujitsu_Quantum_Simulator_Challenge_2025-26`),路徑寫死在腳本裡,搬動任一邊都要改。

---

## 想改這個專案?

[`CLAUDE.md`](./CLAUDE.md) 有開發需要的完整脈絡:

- 兩個模型的完整公式、常數、驗證容差
- **不可違反的口徑紀律**(品質看 16q / 規模看 40q、兩個模型不可混用、GAS 近似比必須列「—」)
- 三個驗證腳本各自檢查什麼,以及新增參數的對帳原則
- 效能預算,以及為什麼刻意不用 Web Worker
- Grover 預設值為何是那些數字(調小會直接失去命中率)
- 缺哪些資料、各自能解鎖什麼功能
- 踩過的坑:tsconfig 為何拆兩份、npm cache 權限、為何從 React Native 改成網站
