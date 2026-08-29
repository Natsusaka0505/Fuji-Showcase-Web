# CLAUDE.md

開發脈絡。`README.md` 是給使用者看的「怎麼用」,這份是給 Claude 看的「怎麼改」。

## 專案位置

```
專案根目錄   ~/Desktop/dev/App/Fuji-App        ← 在這裡啟動 Claude
GitHub      https://github.com/Natsusaka0505/Fuji-Showcase-Web
上游資料源   ~/Desktop/Fujitsu_Quantum_Simulator_Challenge_2025-26
```

上游是比賽的原始 repo(Obsidian 筆記 + 平台程式碼 + ising 實例),**不是子模組,不會自動同步**。要重新產生資料包時 `tools/precompute.py` 會去讀它的絕對路徑,搬動任一邊都要改。

技術棧:Next.js 16 App Router + TypeScript + Tailwind v4。無後端、無資料庫、無環境變數。

---

## 這個專案在做什麼

把量子最佳化的比賽成果變成可操作的網站。核心特點是**瀏覽器端即時重算**,不是查表播放 —— 因為兩個模型都被逆向還原出來了。

### 模型一:QUBO(已驗證,誤差 2.3e-13)

從 `q9_16q_ising.json` 的 65 個 Pauli 項還原:

```
ising(x) = Σ score_e · x_e + A · Σ_v (flow_v(x) − rhs_v)² − offset
```

- `A` = `penalty_A` = 8.650258766608507(可調)
- `offset` = `ising_offset` = 98.95092885998875(實例常數)
- 全域最佳 **−97.49363014104011**,航線 `Singapore → Suez/Port Said → Rotterdam → Los Angeles`
- 24 條乾淨可行航線

**關鍵簡化**:`penalty[z] === 0` ⟺ 流量守恆可行。所以建構時只需對少數零懲罰態做航線解碼,不必掃全部 65,536 個。改 `model.ts` 時別破壞這個捷徑。

**懲罰臨界值 A\* = 0.74**。低於它會出現「作弊態」(能量比最佳合法航線更低,但根本不是連貫航線),A=0 時有 527 個。出貨值 8.65 是 11.7 倍安全邊際。這是網站最值得示範的互動。

### 模型二:蒙地卡羅(由四條航線 CVaR 表回歸還原)

```
平均延誤天數 = w · Σ颱風關港天
             + 0.7934 · w · Σ(地震數 / 11.504)
             + 7.4979 · [經過蘇伊士]        w = 航程天數 / 365
```

平均值誤差 0.15%。擬合出的蘇伊士延誤 7.4979 天對上筆記中**獨立寫下**的「7.5 天期望延誤」—— 這是結構正確的證據,不是四個常數湊四個數字。

平均值擬合不出尾部,所以另用 2 個參數對四個 CVaR95 擬合:災害事件持續時間 ~ Gamma(shape=2)、蘇伊士延誤為定值。RMS 3.1%,精準復現 46% headline。

> `suezConflictMultiplier` 預設是 **1.0 不是 1.43**。擬合出的 7.4979 天已內含紅海危機,再乘 1.43 會變 10.7 天、復現不了報告數字。滑桿上的 1.43 定位成「進一步升級情境」。

---

## 不可違反的口徑紀律

這幾條是比賽的誠實性底線,改動任何顯示文字前先確認沒有踩到:

1. **品質看 16q、規模看 40q。** 40q 那次 `feasible=false`、航線沒到洛杉磯。絕不可寫成「40q Grover 命中最優」。乾淨最優的 Grover 證據掛在 30q。
2. **`0.9281` 與 `−97.4936` 是兩個不同模型。** 前者屬另一個 local reduced QUBO。兩者不可同圖並列。警語寫在 `meta.json` 的 `caveat`。
3. **GAS 近似比列「—」,不可硬算。** 近似比只對可行解有意義;GAS 那列 `feasible=false`,`-44.5631 ÷ -97.4936 = 0.457` 不是合法近似比。
4. **每日延誤成本 267k 是 estimate 級**,由 Drewry/Alphaliner 推算,非官方統計。顯示處要標。
5. **航段的 cost/time/geo/port/weather 分項是推測。** 見下方「缺失資料」。任何顯示都要標 hypothesis。

---

## 驗證紀律

```bash
npm run verify     # engine + risk + algos + typecheck
```

**改動任何引擎後必跑,綠了才能宣稱正確。** 三個腳本檢查的東西不同:

- `verify:engine` — TS 求解器 vs Python 預算結果,**137 個 penalty 掃描點逐點比對**(不是只比端點),含可行性轉折、勝出航線、作弊態計數
- `verify:risk` — vs 報告發表的四條航線平均值與 CVaR95,含 46% 比值斷言
- `verify:algos` — 檢查**行為**而非數字:振幅峰值是否落在理論位置、過轉是否真的損失機率、GAS 是否在多數種子命中、**是否曾宣稱低於真實最優**、QAOA 收斂是否單調

新增任何參數的原則:**先與已發表數字對帳,對得上才上線;對不上就標「未驗證」或不做。** 現有的 `cost_norm_hypothesis` 就是這樣處理的。

---

## 效能預算

| 操作 | 實測 | 何時算 |
|---|---|---|
| QUBO 全掃 65,536 態 | 0.5 ms | render 期間 `useMemo` |
| 蒙地卡羅 10,000 情境 | 2 ms | render 期間 `useMemo` |
| Grover BBHT 60 輪 | 150 ms | render 期間 `useMemo` |
| QAOA p=2 / 60 迭代 | 450 ms | **按鈕手動觸發** |
| 引擎建構(一次) | 15–20 ms | 模組載入時 |

**沒有 Web Worker 是刻意的** —— 前三項比一個影格還短,丟進 worker 只會增加序列化成本與複雜度。QAOA 是唯一例外,用 `useTransition` + 按鈕。

若未來加入更大的實例:**變數數 ≤ 22**(2^22 = 4M 態,約 100 ms)才適合即時算。40 變數(2^40)不可能,只能播放。

---

## 演算法引擎的注意事項

### `grover.ts`

真的振幅放大:oracle 翻轉符號、擴散對均值反射、BBHT 外圈收緊門檻。振幅全程為實數(均勻起始 + 符號翻轉 + 均值反射),所以只用一個 `Float64Array`。

**預設 `budget: 60` / `mMax: 256` 是調過的,別隨手改小。** 旋轉窗口以 8/7 成長,budget 太短就長不到門檻需要的旋轉數:

| budget | 命中率 | 耗時 |
|---|---|---|
| 20 | 0/20 | 88 ms |
| **60** | **17/20** | **152 ms** |
| 100 | 20/20 | 801 ms |

沒取 100 是因為**每次都成功的預設值是調出來的展示,不是誠實的演算法**。GAS 本來就是機率性的。

**已知簡化(UI 上有標註,別拿掉)**:oracle 直接讀古典已知能量,而非用 QFT 算術把 w(x) 寫進 value register 再讀符號位。兩者標記的態完全相同、放大動力學一致;差別在閘數,而那正是真實電路要 16 key + 24 val = 40 qubit、單輪 44 小時的原因。

### `qaoa.ts`

成本 Hamiltonian 是對角的,所以那層只是逐元素相位,真正的工作在 mixer。能量在進入相位前先除以全域跨度正規化 —— 沒有這步,優化器得自己摸索出 1e-3 等級的步長。

⟨C⟩(期望值)與採樣最低值是**兩個不同的量**。報告裡「收斂到 -44.79 卻命中 -97.4936」看似矛盾就是這個原因,UI 有解釋。

---

## 缺失資料與各自能解鎖什麼

| 缺的檔 | 解鎖 | 優先度 |
|---|---|---|
| `QLogistics_Champion_ProposalAligned.csv` | **α/β/γ 權重滑桿**(cost/time/geo/port/weather) | 🥇 最高 |
| 其他 ising JSON | 多走廊切換(需變數數 ≤ 22 才能即時) | 🥈 |
| `port_hazards_v2.json` | 逐港災害細節、分災種開關 | 🥉 |
| branch `q9_gas_grover` 的 `gas_result.json` | 30q 乾淨結果,補完 16/30/40q 三段對比 | 中 |
| `q9_benchmark_champion.py` | 分項計算邏輯(可替代 CSV 反推) | 中 |

**權重滑桿是唯一真正卡住的東西。** 現在 16 條航段只有合成後的單一 `score`,拆不開。`edges.json` 裡的 `cost_norm_hypothesis` / `risk_norm_hypothesis` 是我反推的假設(score = (1−λ)·cost + λ·risk_dest/max,相關係數 0.52、implied cost 全落在 [0,1]),**未經驗證,不可對外標示為事實**。

拿到 CSV 後要先驗證 `Σ權重×分項 == edge_score_q9`,對得上才做成滑桿。

---

## 專案慣例與踩過的坑

### tsconfig 拆兩份

- `tsconfig.json` — Next.js 應用程式,`exclude: ["tools"]`
- `tsconfig.tools.json` — Node 腳本,需要 `types: ["node"]` 與 `allowImportingTsExtensions`

`tools/*.ts` 用 `node --experimental-strip-types` 跑,**relative import 必須帶 `.ts` 副檔名**,這在 Next 的設定下會報錯,所以才拆開。`npm run typecheck` 兩份都檢查。

### `precompute.py`

需要 Python 3 + numpy。輸出到 `src/data/q9_data/`(不是 `assets/`,那是舊的 React Native 結構)。它自己會 assert 向量化模型與參考實作 `cost_of_z` 的一致性,對不上直接失敗。

改了上游 ising JSON 或這支腳本後:

```bash
npm run precompute && npm run verify
```

### npm cache 權限

這台機器的 `~/.npm/_cacache` 有 root 權限殘留檔,`npm install` 可能噴 EACCES。繞法:

```bash
npm install --cache /tmp/npmcache
```

### 歷史:曾經是 React Native

初版用 Expo 做成 app,後來改成網站。轉換時**兩個引擎與驗證腳本一行沒改** —— 它們是純 TS,沒有任何 RN 依賴。只有版面層重寫,charts 從 `react-native-svg` 換成原生 SVG(標籤語法幾乎相同)。

放棄 RN 的原因:`expo` 套件版本(57.0.18)比 Expo Go 最新版(57.0.9)還新,Expo Go 直接拒跑;改走 development build 又卡在本機缺 iOS 26.5 模擬器 runtime。網站版把這整串問題都繞掉了。

---

## 檔案地圖

```
tools/precompute.py       離線產生資料包(讀上游 repo)
tools/verify_engine.ts    QUBO 對帳(137 點掃描)
tools/verify_risk.ts      蒙地卡羅對帳(四條航線)
tools/verify_algos.ts     Grover / QAOA / SA 行為檢查
src/data/q9_data/         打包進建置的資料(9 個 JSON,約 46 KB)
src/data/index.ts         型別化存取 + 格式化函式 + CRITICAL_A
src/engine/model.ts       QUBO 求解、航線解碼、能量直方圖
src/engine/risk.ts        蒙地卡羅與 CVaR
src/engine/grover.ts      Grover 振幅放大與 BBHT
src/engine/qaoa.ts        QAOA 態向量與模擬退火
src/lib/store.ts          共用參數 context;兩個引擎在 render 期間執行
src/components/ui.tsx     Card / Stat / Chip / Slider / Toggle / Caveat
src/components/charts.tsx Histogram / SweepChart / TailChart / LineChart / Bar / QubitScale
src/components/WorldMap   等距投影,跨換日線的航段會斷成兩段
src/components/panels/    六個分頁
src/components/Dashboard  外殼:桌機側欄常駐,lg 以下收成抽屜
```

配色來自報告的冠軍配色:深藍 `#1f3a5f` / 金 `#d4a017`,定義在 `globals.css` 的 `@theme`。
