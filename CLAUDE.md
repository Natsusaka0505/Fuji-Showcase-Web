# CLAUDE.md

開發脈絡。`README.md` 是給使用者看的「怎麼用」,這份是給 Claude 看的「怎麼改」。

## 專案位置

```
專案根目錄   ~/Desktop/dev/App/Fuji-App        ← 在這裡啟動 Claude
GitHub      https://github.com/Natsusaka0505/Fuji-Showcase-Web
上游資料源   ~/Desktop/Fujitsu_Quantum_Simulator_Challenge_2025-26
證據包       ~/Desktop/q9_full_evidence_20260705.tar.gz(stage40 平台完整證據)
Colab bundle ~/Desktop/Fujitsu_Quantum_Simulator_Challenge_2025-26-main/outputs/q9_qarp_exports/work/.../graph_q9/
```

graph_q9 內有 `QLogistics_Champion_ProposalAligned.csv`(15.7 MB 出貨行資料)與 `artifacts/q9_graph/`(node/pair/mode edge 聚合表 + corridor_paths.json)。`tools/extract_showcase_network.py` 讀它的絕對路徑產生 `showcase_network.json`,搬動要改。

證據包內容:`src/`(build_ising_40q.py、montecarlo_cvar.py 等**原始生成器**)、`outputs/stage40/risk/`(port_hazards_v2.json、route_risk.json = 發表 CVaR 表原檔)、三個 40q ising 變體、全部 slurm/logs。

**兩個模型家族的分項體系不同,別搞混**:16q ising(−97.4936)由 build_ising_40q.py 生成,分解是 dist + λ·risk + market 三項(λ 滑桿);0.9281 家族由 CSV 管線生成,分解是 α/β/γ₁γ₂γ₃ 五項(聯運分頁權重滑桿)。「16q 逐邊五分項」這個東西**不存在** —— 早期缺失表的那條假設是錯的。

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

### 模型二:蒙地卡羅(由四條航線 CVaR 表回歸還原;結構已被原始碼證實)

```
平均延誤天數 = w · Σ颱風關港天
             + 0.7934 · w · Σ(地震數 / 11.504)
             + 7.4979 · [經過蘇伊士]        w = 航程天數 / 365
```

平均值誤差 0.15%。擬合出的蘇伊士延誤 7.4979 天對上筆記中**獨立寫下**的「7.5 天期望延誤」—— 這是結構正確的證據,不是四個常數湊四個數字。

平均值擬合不出尾部,所以另用 2 個參數對四個 CVaR95 擬合:災害事件持續時間 ~ Gamma(shape=2)、蘇伊士延誤為定值。RMS 3.1%,精準復現 46% headline。

> `suezConflictMultiplier` 預設是 **1.0 不是 1.43**。擬合出的 7.4979 天已內含紅海危機,再乘 1.43 會變 10.7 天、復現不了報告數字。滑桿上的 1.43 定位成「進一步升級情境」。

證據包到手後的對帳:發表表的真正生成器是 `montecarlo_cvar.py` + `port_hazards_v2.json`(K=10,000、30 天窗、$267k/天、seed 7 全對上)。擬合常數被原始檔直接證實:7.4979→原始 7.5、0.7934→0.792、目錄年數 11.504→11.500。**結構差異保留不改**:原始碼用 Exponential 事件延誤、颱風天數直接進 Poisson、每段取兩端港延誤平均;risk.ts 是對發表數字的行為等效擬合(Gamma k=2、逐港加總),平均誤差 0.15% —— 錨定的是發表數字,不重寫。

---

## 可調起終點與災害情境(2a 互動層)

### 起終點(rhs 參數化)

`Q9Model` 建構子接受 `endpoints`,rhs 由起終點推導(+1 起點、−1 終點);`store.ts` 以 `${source}→${target}` 為 key 快取 model(~20 ms/組,session 存活)。路網稀疏且單向(LAX 純 sink),PairPicker 只列可達組合 —— `reachableTargets` 的依據:**簡單有向路徑 ⟺ 存在合法航線**(路徑天然流量守恆)。

非預設組合 = 瀏覽器端衍生實例,從 store 取 `derivedPair`。所有掛已發表數字的地方(vs −97.4936、A* 掃描卡、penalty hint)都要 gate。AlgoPanel 錨點因此改為即時能量最低值,不再引用 baked optimum。

### 災害情境(per-port 升級)

`RiskParams` 增 `typhoonEscalatedPorts` / `quakeEscalatedPorts` / `hazardEscalation`。**空集合必須 bit-for-bit 復現擬合基線**(verify:risk 鎖定)。戰爭 = 既有 `blockedPorts` 硬封鎖(QUBO 層),不進蒙地卡羅 —— 只有蘇伊士有擬合過的衝突係數。零地震港 UI 顯示「無基線」不可點。

### 風險排序

排行分頁「風險 CVaR」模式對每條合法航線各跑一次 MC,情境數 cap 4,000 維持拖曳流暢。**營運分數與風險 USD 是兩套量綱,分開呈現、絕不合成單一指標** —— score→USD 換算沒有依據(見口徑紀律 5)。

### 風險權重 λ 滑桿(score 拆解)

證據包的 `build_ising_40q.py` 揭露 score 生成公式:

```
score_e = haversine(o,d)/20000 + λ·port_risk[dest]/max + |N(0,0.03)|market
λ = risk_lambda_default = 0.4;port_risk = mean + 0.6·CVaR20(蒙地卡羅)
```

16 條邊逐一對帳通過(距離與風險項精確重算,market 殘差 ∈ [0.0015, 0.0902] 全在半正態界)。`model.ts` 的 `decomposeScores` 把 market 當殘差反推,`scoresForLambda` 重組 —— **λ=0.4 時 app 直接用 baked scores(scores=undefined),逐位一致**;重組僅到 1e-12(浮點結合律)。舊 `cost_norm_hypothesis` 已退役,AuditPanel 有交代。

**口徑**:非 0.4 的 λ = 衍生能量地貌。`store.derived = derivedPair || λ≠0.4`,所有已發表數字的顯示都 gate 在 `derived` 上(不是 `derivedPair`)。

### i18n(中英切換)

自製 gettext 式輕量 i18n,無外部套件:`src/lib/i18n.tsx`(context + `t()`)+ `src/lib/i18n-en.ts`(平面 zh→en 字典)。**中文原文就是 key**,缺譯 fallback 中文永不破版;`{var}` 佔位符查表後才插值。locale 存 localStorage(`q9-locale`),header 的 EN/中 按鈕切換。資料檔內的顯示文字(cvar 航線名、algo 列、meta.caveat、showcase 情境標籤)也走 `t(變數)`,字典有對應條目。

`verify:i18n` 掃全部元件的 `t("…")` + 資料檔字串,斷言:每個 key 有 EN 條目、佔位符翻譯後仍在、字典無孤兒條目。**新增任何 UI 文字都要包 `t()` 並補字典,verify 會擋。**

### 0.9281 聯運分頁(showcase.json + showcase_network.json)

「聯運」分頁有兩層資料:`showcase.json`(8 mode-edge,手抄自 `q9_benchmark_champion_colab_ok.ipynb` cells 12/14)與 `showcase_network.json`(9 港/64 pair/256 mode-edge 全網路,`tools/extract_showcase_network.py` 從 graph_q9 artifacts 抽取,`npm run precompute:showcase` 重生)。兩層由 verify:showcase 互相對帳(手抄 8 邊 vs CSV ≤1e-6)。

權重滑桿驅動**走廊排行**:每段在加權後四種運輸方式取最優、走廊分數 = 各段最優和;全部 1.00× 復現官方 corridor_paths.json 六條分數(Rank 1 = 0.928146 = SIN→RTM|Road + RTM→LAX|Rail)。滑桿語意是分項相對縮放,絕對權重(α0.30/β0.20/γ 0.20·0.15·0.15)已由 CSV 欄位驗證。災害情境卡(port shock → 0.940109 = 漢堡線)與演算法表為固定紀錄。

---

## 不可違反的口徑紀律

這幾條是比賽的誠實性底線,改動任何顯示文字前先確認沒有踩到:

1. **品質看 16q、規模看 40q。** 40q 那次 `feasible=false`、航線沒到洛杉磯。絕不可寫成「40q Grover 命中最優」。乾淨最優的 Grover 證據掛在 30q。
2. **`0.9281` 與 `−97.4936` 是兩個不同模型。** 前者屬另一個 local reduced QUBO。兩者不可同圖並列。警語寫在 `meta.json` 的 `caveat`。
3. **GAS 近似比列「—」,不可硬算。** 近似比只對可行解有意義;GAS 那列 `feasible=false`,`-44.5631 ÷ -97.4936 = 0.457` 不是合法近似比。
4. **每日延誤成本 267k 是 estimate 級**,由 Drewry/Alphaliner 推算,非官方統計。顯示處要標。
5. **航段的 cost/time/geo/port/weather 分項是推測。** 見下方「缺失資料」。任何顯示都要標 hypothesis。
6. **非 SIN→LAX 起終點是衍生情境。** 未在比賽平台跑過,UI 必掛「衍生情境」標示,不得與 −97.4936、A* = 0.74、掃描曲線並列比較。

---

## 驗證紀律

```bash
npm run verify     # engine + risk + algos + typecheck
```

**改動任何引擎後必跑,綠了才能宣稱正確。** 三個腳本檢查的東西不同:

- `verify:engine` — TS 求解器 vs Python 預算結果,**137 個 penalty 掃描點逐點比對**(不是只比端點),含可行性轉折、勝出航線、作弊態計數;另掃 **72 組起終點**與推導 rhs 對帳;score 拆解:λ=0.4 重組 ≤1e-12、16 個 market 殘差全在 [0, 0.12]
- `verify:risk` — vs 報告發表的四條航線平均值與 CVaR95,含 46% 比值斷言;災害升級三斷言:空集合 bit-identical、只影響過港航線、closed-form 與模擬 <5% 吻合;**vs port_hazards_v2.json 原始檔**:擬合 7.4979 vs 原始 7.5、0.7934 vs 0.792、9 港逐欄一致(原始檔 λ 隱含 11.500 年目錄,擬合 11.504)
- `verify:i18n` — i18n 完整性:339 個 key 全有 EN 條目、佔位符存活、無孤兒
- `verify:showcase` — 聯運分頁雙層對帳:手抄 8 邊分項加總與 16 組合排行 vs 官方前 12 名;全網路 256 邊分項加總、6 條走廊分數重算、手抄 vs CSV 逐位(≤1e-6)、Rank 1 = 0.928146
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

若未來加入更大的實例:**變數數 ≤ 22**(2^22 = 4M 態,約 100 ms)是全掃的理論上限,但 `energies()` 每次 solve 配置 2×2^n 的 Float64Array,n=22 暫存 64 MB,手機撐不住 —— 實務即時上限抓 **n ≤ 20**,且要先把 `energies()` 改成 buffer 重用。更大的路網走兩層:路由/風險層用圖演算法(Yen k-shortest + 既有 MC,規模不設限);量子展示層由選定走廊動態抽 ≤ 20 邊的子圖建 QUBO,六個分頁照用。40 變數(2^40)不可能,只能播放。

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
| ~~`QLogistics_Champion_ProposalAligned.csv`~~ | **已取得**(graph_q9)。解鎖:0.9281 家族全網路(9 港/64 pair/256 mode-edge)+ 絕對權重驗證 + 走廊排行。注意:CSV 路網也只有 9 港(Antwerp/Busan/Dubai/Hamburg/LA/Marseille/RTM/SHA/SIN),**沒有 30 港** | ✅ |
| 其他 ising JSON | 證據包有 40q 三變體(40/rcm/sparse),**> 22 變數不能即時**,只可做靜態分析;≤22 的多走廊實例仍缺 | 🥈 |
| ~~`port_hazards_v2.json`~~ | **已取得**(證據包),收進 q9_data、稽核分頁展示、verify:risk 對帳 | ✅ |
| 30q `gas_result.json` | 30q 乾淨結果,補完 16/30/40q 三段對比。**從未 commit 進任何 branch** —— 在平台 `~/qarp_q9/outputs/`,拉回指令見上游 `platform_gas/README.md`(qsim → VPS → 本機) | 中 |
| `q9_benchmark_champion.py` | 分項計算邏輯。本體只在 Colab `/content`;其用法與部分輸出已嵌在上游根目錄的 `q9_benchmark_champion_colab_ok.ipynb` | 中 |

**權重滑桿是唯一真正卡住的東西。** 現在 16 條航段只有合成後的單一 `score`,拆不開。`edges.json` 裡的 `cost_norm_hypothesis` / `risk_norm_hypothesis` 是我反推的假設(score = (1−λ)·cost + λ·risk_dest/max,相關係數 0.52、implied cost 全落在 [0,1]),**未經驗證,不可對外標示為事實**。

CSV 對帳已完成:256 邊 Σ分項==score 到 3.9e-16;絕對權重 α=0.30、β=0.20 與未加權欄位比值精確一致(1e-16/1e-14),γ₁γ₂γ₃=0.20/0.15/0.15 一致至 ~3%(聚合效應,extract 腳本以 5% 容差鎖住)。

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

### CSS grid 手機溢位

grid item 預設 `min-width: auto`,子孫的 `min-w-[440px]` 表格會把單欄 grid 撐得比 viewport 寬(內層的 `overflow-x-auto` 包裹擋不住 —— 它不改變 grid item 的 min-content 貢獻),於是 body 橫向捲、sticky navbar 看似沒填滿。解法已就位:`Card` 根節點掛 `min-w-0`、Dashboard 外殼掛 `overflow-x-clip`(`clip` 不建立 scroll container,不破壞 sticky)。別拿掉 Card 的 `min-w-0`。

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
src/data/q9_data/         打包進建置的資料(12 個 JSON;showcase* 來自 Colab bundle,port_hazards_v2 來自證據包)
tools/extract_showcase_network.py  從 graph_q9 抽 0.9281 全網路(含權重比值斷言)
src/data/index.ts         型別化存取 + 格式化函式 + CRITICAL_A
src/engine/model.ts       QUBO 求解、航線解碼、能量直方圖
src/engine/risk.ts        蒙地卡羅與 CVaR
src/engine/grover.ts      Grover 振幅放大與 BBHT
src/engine/qaoa.ts        QAOA 態向量與模擬退火
src/lib/store.ts          共用參數 context;model 依起終點快取;兩個引擎在 render 期間執行
src/components/ui.tsx     Card / Stat / Chip / Slider / Toggle / Caveat
src/components/charts.tsx Histogram / SweepChart / TailChart / LineChart / Bar / QubitScale
src/components/WorldMap   等距投影,跨換日線的航段會斷成兩段
src/components/panels/    七個分頁(含「聯運」= 0.9281 showcase)
src/components/Dashboard  外殼:桌機側欄常駐,lg 以下收成抽屜
```

配色來自報告的冠軍配色:深藍 `#1f3a5f` / 金 `#d4a017`,定義在 `globals.css` 的 `@theme`。
