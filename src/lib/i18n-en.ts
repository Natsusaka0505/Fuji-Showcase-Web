/**
 * zh→en dictionary. Keys are the exact Traditional-Chinese source strings used
 * in the components (plus display strings carried by the data JSONs). A missing
 * key falls back to Chinese at runtime; verify_i18n fails the build-gate when a
 * key used in code has no entry here or a {placeholder} got lost in translation.
 */
export const EN: Record<string, string> = {
  // Shell / params
  "風險感知全球供應鏈路徑優化｜Fujitsu Quantum Simulator Challenge 2025-26":
    "Risk-aware global supply-chain routing | Fujitsu Quantum Simulator Challenge 2025-26",
  "衍生情境": "Derived scenario",
  "約束失效": "Constraint broken",
  "重設": "Reset",
  "參數": "Params",
  "分頁": "Tabs",
  "地圖": "Map",
  "排行": "Ranking",
  "演算法": "Algorithms",
  "風險": "Risk",
  "聯運": "Multimodal",
  "40q": "40q",
  "稽核": "Audit",
  "共用參數": "Shared parameters",
  "有 {n} 個作弊態勝過最佳合法航線": "{n} cheat states beat the best legal route",
  "低於臨界 {a}:有 {n} 個作弊態勝過最佳合法航線":
    "Below critical {a}: {n} cheat states beat the best legal route",
  "流量守恆約束強度｜臨界 A* 與出貨值僅對出貨實例校準":
    "Flow-balance constraint weight | critical A* and shipped value are calibrated for the shipped instance only",
  "流量守恆約束強度｜臨界 {a}、出貨值 {d}":
    "Flow-balance constraint weight | critical {a}, shipped {d}",
  "風險權重 λ": "Risk weight λ",
  "score = 距離 + λ·目的港風險 + 市場項｜出貨值 0.40,公式與上游 build_ising_40q.py 逐邊對帳":
    "score = distance + λ·destination risk + market term | shipped at 0.40; formula reconciled edge-by-edge with the upstream build_ising_40q.py",
  "非出貨 λ = 衍生能量地貌;−97.4936 等已發表數字不適用":
    "Non-default λ = a derived landscape; published figures such as −97.4936 do not apply",
  "荷莫茲海峽封鎖": "Strait of Hormuz blockade",
  "已封鎖 {n} 港": "{n} ports blocked",
  "全部運算在你的瀏覽器即時執行:每次調整重掃 65,536 個量子態(~0.5 ms)並重跑 10,000 次蒙地卡羅情境(~2 ms)。":
    "Everything recomputes live in your browser: each adjustment re-sweeps all 65,536 quantum states (~0.5 ms) and reruns 10,000 Monte Carlo scenarios (~2 ms).",
  "起點": "Origin",
  "終點": "Destination",
  "只列出有向路網可達的港口": "Only ports reachable on the directed network are listed",
  "非預設起終點為瀏覽器端衍生實例,未在比賽平台驗證;−97.4936、A* = 0.74 等已發表數字僅屬 Singapore → Los Angeles。":
    "A non-default endpoint pair is a browser-derived instance, never validated on the contest platform; published figures such as −97.4936 and A* = 0.74 belong to Singapore → Los Angeles only.",

  // Charts / WorldMap
  "能量分布直方圖": "Energy distribution histogram",
  "penalty 掃描曲線": "Penalty sweep curve",
  "成本分布與尾部風險": "Cost distribution and tail risk",
  "平均": "mean",
  "qubit 數與記憶體需求": "Qubit count vs memory",
  "曲線圖": "Line chart",
  "九港航線網路圖": "Nine-port route network",
  "已封鎖": "blocked",
  "最佳航線": "Best route",
  "候選航段": "Candidate legs",
  "高風險港": "High-risk port",
  "封鎖": "Blocked",

  // Audit panel
  "災害資料可稽核面板": "Auditable hazard data",
  "每港附官方即時查詢連結,可當場比對": "Each port links to the official live query for on-the-spot comparison",
  "9 港": "9 ports",
  "港": "Port",
  "地震 M5.0+": "Quakes M5.0+",
  "颱風天/年": "Typhoon days/yr",
  "查證": "Verify",
  "查詢視窗固定 2015-01-01 → 2026-07-04、半徑 300 km、規模 M5.0+。點高雄那條連結,USGS 官方回傳":
    "The query window is fixed at 2015-01-01 → 2026-07-04, radius 300 km, magnitude M5.0+. Open the Kaohsiung link and the official USGS API returns",
  ",與模型內建數字完全一致 —— 這就是「可稽核」的意義。":
    ", exactly matching the number the model shipped with — that is what “auditable” means.",
  "四大官方資料來源": "Four official data sources",
  "每筆已逐一驗證,可寫進論文": "Each one verified and citable",
  "模型出處": "Model provenance",
  "網站內每個數字怎麼來的": "Where every number on this site comes from",
  "問題實例": "Problem instance",
  "Pauli 項": "Pauli terms",
  "{n}({l} linear + {q} quadratic)": "{n} ({l} linear + {q} quadratic)",
  "此式由 {n} 個 Pauli 項逆向還原,與平台": "This form was reverse-engineered from {n} Pauli terms; against the platform's",
  "的最大誤差為": "the maximum error is",
  "(浮點極限)。網站因此能在瀏覽器端即時重算,而不是查表播放。":
    " (floating-point limit). That is why the site can recompute live in the browser instead of replaying lookup tables.",
  "災害參數原始檔(port_hazards_v2)": "Raw hazard parameter file (port_hazards_v2)",
  "發表 CVaR 表的實際輸入,來自平台證據包": "The actual input of the published CVaR table, from the platform evidence bundle",
  "原始資料": "Raw data",
  "地震 λ/年": "Quake λ/yr",
  "事件延誤(天)": "Delay per event (days)",
  "颱風關港(天/年)": "Typhoon closure (days/yr)",
  "衝突係數": "Conflict mult.",
  "+{n} 天": "+{n} d",
  "擬合模型與原始檔的對照:蘇伊士延誤擬合": "Fitted model vs the raw file: the fitted Suez delay is",
  "天,原始檔寫": "days; the raw file says",
  ";地震事件延誤擬合": "; the fitted quake event delay is",
  "。逆向還原的結構被原始資料直接證實 —— 這兩個數字先前只能靠「筆記中獨立寫下的 7.5 天」旁證。":
    ". The reverse-engineered structure is confirmed directly by the raw data — previously these two constants rested only on the independently written “7.5 days” in the notes.",
  "方法(JMA):200 km 內風暴點,10 分鐘最大風速 <64kt 記 1 天、64–95kt 記 3 天、≥96kt 記 7 天,統計 2015–2025。引用:USGS ANSS ComCat、RSMC Tokyo Best Track(JMA)、Suez baseline。原始生成器為 montecarlo_cvar.py(K=10,000、30 天窗、$267k/天、seed 7);本站 risk.ts 為對發表數字的行為等效擬合,分布形狀不同(Gamma vs Exponential),平均誤差 0.15%。":
    "Method (JMA): storm points within 200 km; closure days by 10-min max wind — <64kt: 1 day, 64–95kt: 3 days, ≥96kt: 7 days, over 2015–2025. Citations: USGS ANSS ComCat, RSMC Tokyo Best Track (JMA), Suez baseline. The original generator is montecarlo_cvar.py (K=10,000, 30-day window, $267k/day, seed 7); this site's risk.ts is a behaviourally equivalent fit to the published numbers with different distribution shapes (Gamma vs Exponential), mean error 0.15%.",
  "score 拆解:已由原始碼驗證": "Score decomposition: source-verified",
  "取代先前的 cost_norm 假設": "Replaces the former cost_norm hypothesis",
  "平台證據包內的": "In the platform evidence bundle,",
  "揭露了邊分數的生成公式:": "reveals the edge-score generator: ",
  "(λ = 0.4)。16 條邊逐一對帳:距離與風險項精確重算,市場擾動殘差全部落在半正態界內(16/16)。側欄的「風險權重 λ」滑桿即基於此拆解 —— λ = 0.40 時與比賽實例逐位一致。舊的":
    " (λ = 0.4). All 16 edges reconcile: the distance and risk terms recompute exactly and every market residual falls inside the half-normal bound (16/16). The sidebar's “risk weight λ” slider is built on this decomposition — at λ = 0.40 it is bit-identical to the contest instance. The old",
  "(相關係數 0.52 的反推假設)已退役。": " (a reverse-engineered guess at correlation 0.52) is retired.",
  "仍未驗證:α/β/γ₁γ₂γ₃ 五分項(cost/time/geo/port/weather)在 16q 實例的逐邊數值不存在 —— 該實例的拆解是 dist+λ·risk+market;五分項屬 0.9281 家族,見「聯運」分頁。":
    "Still to note: per-edge α/β/γ₁γ₂γ₃ components (cost/time/geo/port/weather) do not exist for the 16q instance — its decomposition is dist+λ·risk+market; the five components belong to the 0.9281 family, see the Multimodal tab.",

  // Algo panel
  "Grover 自適應搜尋": "Grover adaptive search",
  "BBHT 外圈｜每次調整都在你的瀏覽器重跑": "BBHT outer loop | reruns in your browser on every adjustment",
  "命中最優": "Hit optimum",
  "未命中": "Missed",
  "最優 {v}": "optimum {v}",
  "BBHT 輪次": "BBHT rounds",
  "最佳": "Best",
  "總旋轉": "Total rotations",
  "改善次數": "Improvements",
  "budget(BBHT 輪次)": "budget (BBHT rounds)",
  "平台 40q 那次只有 1 輪": "The platform 40q run had exactly 1 round",
  "shots(每輪取樣)": "shots (samples per round)",
  "亂數種子": "Random seed",
  "GAS 是機率演算法,換種子結果會變": "GAS is probabilistic — a different seed changes the outcome",
  "照平台設定:只標記能量低於 -96 的態,marked set 極小、極難找":
    "Platform setting: only states below −96 are marked; the marked set is tiny and hard to find",
  "藍點是門檻下降的時刻。每次採到更好的解,門檻就收緊、被標記的態變少,下一輪需要更多次旋轉才找得到 —— 這就是 BBHT 逐步加大 r 的機制。把":
    "Blue dots mark the moments the threshold drops. Each better sample tightens the threshold, shrinks the marked set, and makes the next round need more rotations — exactly why BBHT grows r. Pull",
  "拉到 20 以下會看到它來不及收斂,正是平台 40q 那次":
    "below 20 and it fails to converge in time — precisely why the platform's 40q run at",
  "只拿到 {v} 的原因。": "only reached {v}.",
  "這裡的 oracle 直接作用在 16 個 key qubit 上(用古典已知的能量判斷)。硬體上同一個 oracle 要靠 QFT 算術把 w(x) 寫進 value register 再讀符號位,那才是 16 key + 24 val = 40 qubit 的來源。兩者標記的態完全相同,放大動力學一致;差別在閘數 —— 那正是 40q 單輪要 {h} 的原因。":
    "The oracle here acts directly on the 16 key qubits (deciding from classically known energies). On hardware the same oracle needs QFT arithmetic to write w(x) into a value register and read its sign bit — that is where 16 key + 24 val = 40 qubits comes from. Both mark exactly the same states with identical amplification dynamics; the difference is gate count — which is why one 40q round takes {h}.",
  "振幅放大解剖": "Amplitude amplification anatomy",
  "固定門檻下,每旋轉一次測一次命中機率": "At a fixed threshold, hit probability measured after every rotation",
  "{n} 個標記態": "{n} marked states",
  "Grover 旋轉次數": "Grover rotations",
  "起始機率": "Initial prob.",
  "峰值": "Peak",
  "峰值位置": "Peak at",
  "轉": "rot",
  "理論 √(N/M)": "Theory √(N/M)",
  "門檻 y": "Threshold y",
  "越接近最優,被標記的態越少、越難找": "The closer to the optimum, the fewer marked states and the harder the search",
  "旋轉上限": "Rotation cap",
  "實測峰值落在": "The measured peak lands at",
  "轉,理論估計": "rotations; theory estimates",
  "轉 —— 這是真的在跑 2^16 個振幅,不是把公式畫出來。繼續轉下去機率會掉回來(過度旋轉),這也是 Grover 必須知道何時停手的原因。把門檻拉到 -97.4 會只剩 1 個標記態,需要約 200 轉。":
    "— this really evolves 2^16 amplitudes rather than plotting a formula. Keep rotating and the probability falls back (over-rotation), which is why Grover must know when to stop. Drag the threshold to −97.4 and only 1 marked state remains, needing about 200 rotations.",
  "p={p} 深度｜完整 2^16 態向量演化": "depth p={p} | full 2^16 state-vector evolution",
  "計算中…": "Computing…",
  "{n} 次評估": "{n} evaluations",
  "最優": "optimum",
  "Nelder-Mead 迭代": "Nelder-Mead iterations",
  "期望值": "Expectation",
  "採樣最佳": "Best sampled",
  "P(最優)": "P(optimum)",
  "p(電路深度)": "p (circuit depth)",
  "每層 = 一個成本相位 + 一個混合層": "Each layer = one cost phase + one mixer",
  "最大迭代": "Max iterations",
  "初始角度隨機,會落進不同局部解": "Random initial angles land in different local optima",
  "重新執行 QAOA": "Rerun QAOA",
  "約 0.3–1 秒,故改參數後手動觸發": "Takes ~0.3–1 s, so it runs on demand after parameter changes",
  "最可能的量測結果": "Most likely measurement outcomes",
  "⟨C⟩ 是能量期望值,不是採樣到的最低值 —— 均勻疊加態的期望值是 0,優化後降到約 -60,但採樣仍會抽到":
    "⟨C⟩ is the energy expectation, not the lowest sampled value — the uniform superposition expects 0, optimisation lowers it to about −60, yet sampling still draws",
  "。這就是報告裡「收斂到 -44.79、但命中 -97.4936」看似矛盾的原因:兩個是不同的量。":
    ". That resolves the report's apparent paradox of “converged to −44.79 yet hit −97.4936”: they are different quantities.",
  "模擬退火(古典對照)": "Simulated annealing (classical baseline)",
  "單位元翻轉 + 幾何降溫": "Single-bit flips + geometric cooling",
  "近似比 {r}": "ratio {r}",
  "退火進度": "Annealing progress",
  "近似比": "Approx. ratio",
  "接受率": "Acceptance",
  "迭代數": "Iterations",
  "起始溫度": "Start temperature",
  "太低會卡在局部解,太高等於亂數搜尋": "Too low sticks in local optima; too high is random search",
  "古典基準線。報告中 SA 拿到 -96.8297(近似比 0.9932),QAOA 則命中 -97.4936。把迭代數拉低或起始溫度調小,可以看到它卡在局部解 —— 那正是組合最佳化的難處。":
    "The classical baseline. In the report SA reached −96.8297 (ratio 0.9932) while QAOA hit −97.4936. Lower the iterations or the start temperature and watch it stick in a local optimum — the whole difficulty of combinatorial optimisation.",

  // Showcase panel
  "0.9281 多式聯運實例": "The 0.9281 multimodal instance",
  "{n} 港、{m} 條 mode-edge 全網路｜走廊排行 {p} 條": "Full network: {n} ports, {m} mode edges | {p} ranked corridors",
  "分項齊全": "Full components",
  "冠軍 Colab benchmark 的 local reduced QUBO 家族:港口網路含漢堡、釜山、杜拜等 {n} 港,每對港口各有公路/鐵路/空運/海運 mode-edge。分項來自 bundle 的 graph_q9 原始表,絕對權重文件明載且經資料驗證:α = {a}(與原始欄位比值精確一致)、β = {b}(同)、γ₁/γ₂/γ₃ = {g1}/{g2}/{g3}(一致至 ~3%,聚合效應)。256 條邊逐一驗證 Σ分項 == 邊分數(3.9e-16,浮點極限)。":
    "The champion Colab benchmark's local reduced QUBO family: a port network of {n} ports including Hamburg, Busan and Dubai, each pair carrying Road/Rail/Air/Sea mode edges. Components come from the bundle's raw graph_q9 tables, and the documented absolute weights are data-verified: α = {a} (exact ratio against the unweighted column), β = {b} (same), γ₁/γ₂/γ₃ = {g1}/{g2}/{g3} (within ~3%, an aggregation effect). All 256 edges verify Σcomponents == edge score to 3.9e-16 — the floating-point limit.",
  "口徑:0.9281 屬 local reduced 模型,與 16q ising 的 −97.4936 是兩個不同模型,不可同圖並列。此網路(含漢堡/釜山/杜拜)與 ising 家族的九港(含高雄/可倫坡/蘇伊士)也是兩套不同路網。":
    "Framing: 0.9281 belongs to the local reduced model — a different model from the 16q ising's −97.4936; never chart them together. This network (Hamburg/Busan/Dubai) is also a different roster from the ising family's nine ports (Kaohsiung/Colombo/Suez).",
  "邊分項解剖": "Edge component anatomy",
  "冠軍走廊 8 條 mode-edge 的五分項(手抄自筆記本,已與 CSV 原檔逐位對帳)":
    "Five components of the champion corridor's 8 mode edges (transcribed from the notebook, reconciled digit-by-digit with the raw CSV)",
  "長途的鹿特丹 → 洛杉磯段,γ₂ 港口與 γ₃ 天氣分項明顯比亞歐段厚 —— 這正是「風險已定價進邊分數」的具體樣貌。空運的 β 時間分項最薄、海運最厚,和 lead time(1.7 天 vs 51 天)一致。":
    "On the long Rotterdam → Los Angeles leg the γ₂ port and γ₃ weather components are visibly thicker than on the Asia–Europe leg — risk literally priced into the edge score. Air has the thinnest β time component and Sea the thickest, matching their lead times (1.7 vs 51 days).",
  "α/β/γ 權重滑桿 × 走廊排行": "α/β/γ weight sliders × corridor ranking",
  "重新加權五分項:每段的勝出運輸方式與走廊順位即時重排": "Reweight the five components: winning transport modes and corridor order rerank live",
  "復現官方排行": "Reproduces official ranking",
  "官方權重": "Official weights",
  "what-if 權重": "What-if weights",
  "{l}(官方 {w})": "{l} (official {w})",
  "α 成本": "α cost",
  "β 時間": "β time",
  "γ₁ 地緣": "γ₁ geo",
  "γ₂ 港口": "γ₂ port",
  "γ₃ 天氣": "γ₃ weather",
  "重設為官方權重": "Reset to official weights",
  "滑桿是分項的相對縮放(1.00× = 官方權重 α{a}/β{b}/γ {g1}·{g2}·{g3});每段在加權後的四種運輸方式中取最優,走廊分數 = 各段最優之和。全部 1.00× 時六條走廊分數與官方 corridor_paths.json 逐條一致,Rank 1 =":
    "The sliders scale components relatively (1.00× = the official weights α{a}/β{b}/γ {g1}·{g2}·{g3}); each leg takes its best of four transport modes under the weighting, and a corridor's score is the sum of its legs. At all-1.00× the six corridor scores match the official corridor_paths.json line by line, with rank 1 =",
  "。把 γ₃ 天氣拉高,看勝出方式從海運/鐵路翻成空運;把 α 成本拉高則反向。":
    ". Raise γ₃ weather and watch winners flip from Sea/Rail to Air; raise α cost for the reverse.",
  "災害情境:官方數字": "Disaster scenarios: official figures",
  "衝擊情境跑在 {name}({n} 變數)上": "Shock scenarios ran on {name} ({n} variables)",
  "固定紀錄": "Fixed record",
  "基準最優": "Base optimum",
  "衝擊後": "After shock",
  "成本上升": "Cost increase",
  "鹿特丹港衝擊讓原本的最優路線失寵,最優解移動到 0.940109 —— 正是上方排行第 2 名「經漢堡」走廊的分數,且 QAOA 與古典最短路給出一致答案。這是「災害改寫最優路線」的官方 benchmark 證據,與「風險」分頁的即時蒙地卡羅互為印證。":
    "The Rotterdam port shock dethrones the original best route and moves the optimum to 0.940109 — exactly the score of the rank-2 “via Hamburg” corridor above, with QAOA and the classical shortest path agreeing. Official benchmark evidence that disasters rewrite the optimal route, corroborating the live Monte Carlo on the Risk tab.",
  "此卡為 Colab benchmark 的固定歷史紀錄,不隨本站參數變動;衝擊的量級定義在 benchmark 設定內,不做即時重算。":
    "This card is a fixed record of the Colab benchmark and does not react to this site's parameters; the shock magnitudes are defined in the benchmark configuration, so no live recomputation.",
  "演算法對比(8 變數 base 情境)": "Algorithm comparison (8-variable base scenario)",
  "同一實例、多演算法、各 3 seeds 的官方成績": "Official results — same instance, many algorithms, 3 seeds each",
  "中位數": "Median",
  "可行率": "Feasible",
  "命中率": "Hit rate",
  "深度": "Depth",
  "2Q 閘": "2Q gates",
  "COBYLA 系的 QAOA 三種深度全部命中;SPSA 三次有一次落到 0.9328。ADMM 與這裡的 Grover-GAS 配置可行率 0% —— 誠實列出,不遮醜。WarmStart 深度只有 2 是因為初態已含解資訊,電路幾乎不需要演化。":
    "All three QAOA depths under COBYLA hit the optimum; SPSA dropped to 0.9328 once in three. ADMM and this Grover-GAS configuration scored 0% feasible — listed honestly, warts and all. WarmStart's depth of 2 is because the initial state already carries the solution, leaving the circuit almost nothing to do.",
  "固定歷史紀錄(Qiskit / Colab),與「演算法」分頁的瀏覽器即時模擬是兩套執行環境。16q ising 的 GAS 表現見「40q」分頁,兩者不可混讀。":
    "A fixed record (Qiskit / Colab) — a different execution environment from the live browser simulations on the Algorithms tab. For GAS on the 16q ising, see the 40q tab; do not conflate the two.",

  // Risk panel
  "目前航線的風險": "Risk of the current route",
  "{n} 次情境模擬｜{d} 天航程窗口": "{n} scenario simulations | {d}-day voyage window",
  "平均成本": "Mean cost",
  "平均延誤": "Mean delay",
  "天": "days",
  "紅色是最壞 {p}% 的情境。CVaR 回答的不是「平均要花多少」,而是「運氣最差時我會慘到什麼程度」—— 壓垮船公司的通常是極端事件,不是平均。":
    "Red is the worst {p}% of scenarios. CVaR does not answer “what does it cost on average” but “how bad does it get when luck runs out” — what sinks carriers is the extreme event, not the mean.",
  "四條航線對比": "Four routes compared",
  "同一組參數下即時重算": "Recomputed live under the same parameters",
  "最低 {name}": "lowest: {name}",
  "最低 / 蘇伊士": "Lowest / Suez",
  "風險降幅": "Risk reduction",
  "加入真實災害資料後,避開蘇伊士的地中海線尾部風險最低。真實資料直接改變了航線的風險排序 —— 這正是「災害感知最佳化」的商業價值。":
    "With real hazard data, the Mediterranean route that avoids Suez has the lowest tail risk. Real data directly reorders the routes — the business value of disaster-aware optimisation.",
  "風險參數": "Risk parameters",
  "調整後上方圖表即時更新": "The charts above update live as you adjust",
  "20,000 TEU 貨櫃輪;Drewry/Alphaliner 推算,estimate 級": "20,000 TEU container ship; derived from Drewry/Alphaliner, estimate-grade",
  "航程窗口": "Voyage window",
  "{n} 天": "{n} days",
  "暴露在災害風險下的時間長度": "How long the shipment is exposed to hazards",
  "CVaR 分位": "CVaR quantile",
  "看最壞的百分之幾": "Which worst percentile to look at",
  "蘇伊士衝突係數": "Suez conflict multiplier",
  "1.00 = 現況(已含紅海危機);1.43 = 進一步升級": "1.00 = today (Red Sea crisis included); 1.43 = further escalation",
  "颱風強度": "Typhoon intensity",
  "JMA 關港天數的縮放": "Scales the JMA port-closure days",
  "地震頻率": "Earthquake rate",
  "USGS 地震年率的縮放": "Scales the USGS annual quake rate",
  "情境數": "Scenarios",
  "越多越穩定;50,000 仍在 10 ms 內": "More is steadier; 50,000 still runs under 10 ms",
  "模型結構由報告的四條航線 CVaR 表回歸還原:平均延誤誤差 0.15%,尾部形狀以 2 個參數擬合、RMS {r}%。每日延誤成本為 estimate 級,非官方統計。":
    "The model structure was regression-recovered from the report's four-route CVaR table: mean delay error 0.15%, tail shape fitted with 2 parameters at RMS {r}%. The daily delay cost is estimate-grade, not an official statistic.",
  "災害情境": "Disaster scenarios",
  "圈選受災港口:封鎖直接改變可行航線,颱風/地震改變風險排序":
    "Mark affected ports: a blockade changes the feasible routes directly; typhoon/quake change the risk ranking",
  "颱風": "Typhoon",
  "地震": "Quake",
  "封鎖(戰爭)": "Blockade (war)",
  "目錄期內無 M5+ 地震,無基線可升級": "No M5+ quakes in the catalog window — no baseline to escalate",
  "無基線": "no baseline",
  "封鎖中": "BLOCKED",
  "災害升級倍率": "Hazard escalation factor",
  "套用在被圈選港口的颱風/地震年率上,與全域縮放相乘;1.0× 即回到基線":
    "Applied to the marked ports' typhoon/quake rates, multiplied with the global scales; 1.0× returns to baseline",
  "封鎖作用在 QUBO 可行集,最佳航線即時換路(與「地圖」分頁的點港封鎖同一件事);颱風與地震進蒙地卡羅,到「排行」分頁切「風險 CVaR」看災害如何改寫路線排序。基線災害率(JMA/USGS)永遠生效 —— 這裡圈的是「進一步升級」情境。":
    "Blockades act on the QUBO feasible set — the best route reroutes instantly (the same thing as clicking ports on the Map tab). Typhoon and quake feed the Monte Carlo: switch the Ranking tab to “Risk CVaR” to watch disasters rewrite the order. Baseline hazard rates (JMA/USGS) always apply — what you mark here is the further-escalation scenario.",

  // Quantum (40q) panel
  "態向量": "State vector",
  "執行環境": "Environment",
  "你的瀏覽器": "your browser",
  "節點": "nodes",
  "單輪耗時": "Per-round time",
  "可調至 120": "adjustable to 120",
  "結果": "Result",
  "命中 -97.4936": "hits −97.4936",
  "{v}(不可行)": "{v} (infeasible)",
  "AutoRebase 後 native 閘": "Native gates after AutoRebase",
  "optimize_light 融合後": "After optimize_light fusion",
  "融合比": "Fusion ratio",
  "瓶頸:iQFT 全域 all-to-all 閘": "Bottleneck: global all-to-all iQFT gates",
  "~100 s/閘": "~100 s/gate",
  "尾段速率": "Tail-phase rate",
  "總 qubits": "Total qubits",
  "MPI 行程": "MPI processes",
  "單輪牆鐘": "Wall-clock/round",
  "取樣數": "Shots",
  "迭代": "Iterations",
  "2^40 個振幅 × 16 bytes =": "2^40 amplitudes × 16 bytes =",
  "狀態向量,動用 1024 節點、4096 個 MPI 行程,單輪端到端跑完花了":
    "of state vector, engaging 1024 nodes and 4096 MPI processes; one end-to-end round took",
  "。這是規模與工程管線的里程碑。": ". A milestone of scale and engineering pipeline.",
  "解的品質": "Solution quality",
  "誠實對標:規模做得到,優化做不到": "Honest framing: the scale works, the optimisation does not",
  "不可行": "Infeasible",
  "已知最優": "Known optimum",
  "採樣航線(未到終點)": "Sampled route (never reaches the target)",
  "採樣值": "The sampled value",
  "比 warm-start 門檻": "is worse than the warm-start threshold",
  "還差,航線只走到 Rotterdam 就斷了、選了 {n} 條邊(退化解)。原因是 GAS 靠 BBHT 多輪逐步加大 r 才收斂,":
    "; the route breaks off at Rotterdam with {n} edges selected (a degenerate solution). GAS converges by growing r over many BBHT rounds, and",
  "只做了一次極弱放大,接近亂數。40q 要逼近最優需要很多個 44 小時輪次 = 數週,不切實際。":
    "performed a single, extremely weak amplification — near random. Approaching the optimum at 40q would need many 44-hour rounds — weeks, impractical.",
  "對外定位必須精準:40q 是規模/管線/牆鐘里程碑,不是「40q Grover 命中最優」。乾淨最優的 Grover 證據掛在 30q(-97.4936);品質看 16q、規模看 40q。":
    "Positioning must be precise: 40q is a scale/pipeline/wall-clock milestone, not “40q Grover hit the optimum”. The clean-optimum Grover evidence hangs on 30q (−97.4936); quality lives at 16q, scale at 40q.",
  "同一個演算法在「演算法」分頁跑得動 —— 那裡是 16 qubit、真的振幅放大,毫秒級收斂。把那邊的":
    "The same algorithm runs fine on the Algorithms tab — 16 qubits, real amplitude amplification, millisecond convergence. Set its",
  "調到 1,就會重現這裡看到的失敗模式。": "to 1 and you reproduce the failure mode seen here.",
  "記憶體隨 qubit 指數成長": "Memory grows exponentially with qubits",
  "每多一個 qubit,狀態向量翻倍": "Every extra qubit doubles the state vector",
  "16q 驗證規模": "16q verified scale",
  "2024 冠軍": "2024 champion",
  "本隊": "This team",
  "Fujitsu 模擬器上限 40 qubit。2024 冠軍 TU Delft 用 39q,本隊用滿上限。":
    "Fujitsu's simulator tops out at 40 qubits. The 2024 winner, TU Delft, used 39; this run uses the full ceiling.",
  "16q 即時 vs 40q 播放": "16q live vs 40q replay",
  "同一個 GAS 演算法,規模差 24 個 qubit": "The same GAS algorithm, 24 qubits apart",
  "項目": "Item",
  "16q(本站即時)": "16q (live on this site)",
  "40q(平台播放)": "40q (platform replay)",
  "規模每加一個 qubit,態向量翻倍;16q 的 1 MB 可以在瀏覽器裡每秒重算好幾次,40q 的 16 TiB 需要 1024 個節點、單輪 44 小時。演算法沒變,能做的事完全不同 —— 這就是「規模做得到、優化做不到」的具體意思。":
    "Each added qubit doubles the state vector: 16q's 1 MB recomputes several times a second in a browser, while 40q's 16 TiB needs 1024 nodes and 44 hours a round. Same algorithm, utterly different possibilities — the concrete meaning of “the scale works, the optimisation does not”.",
  "成本剖析": "Cost anatomy",
  "逐閘 ETA 實測": "Measured per-gate ETA",
  "瓶頸是 iQFT 高位 value qubit 之間的全域閘 —— 每個要對 16 TiB 做一次 all-to-all,約 100 秒。少數這種閘吃掉大半牆鐘。這是通訊 bound,加算力或 OMP 都救不了。":
    "The bottleneck is the global gates between high-order iQFT value qubits — each one does an all-to-all over 16 TiB, about 100 seconds. A handful of them eat most of the wall clock. It is communication-bound; more compute or OMP will not save it.",

  // Map panel
  "九港路網": "Nine-port network",
  "{src} → {tgt}｜16 條候選航段 = 16 qubits": "{src} → {tgt} | 16 candidate legs = 16 qubits",
  "{n} 條可行": "{n} feasible",
  "點港口可切換封鎖,航線即時重算": "Click a port to toggle a blockade — the route recomputes instantly",
  "最佳解不可行": "Best solution infeasible",
  "penalty 太低,演算法找到了作弊解": "The penalty is too low and the algorithm found a cheat solution",
  "違規": "Violating",
  "可行": "Feasible",
  "成本": "Cost",
  "航段": "Legs",
  "段": "legs",
  "轉運": "Transfers",
  "vs 最佳": "vs optimum",
  "命中": "hit",
  "衍生情境(自訂起終點或 λ):不與已發表最優 −97.4936 對比(該數字僅屬出貨實例)。":
    "Derived scenario (custom endpoints or λ): no comparison against the published optimum −97.4936, which belongs to the shipped instance only.",
  "所有可行航線都被封鎖了": "Every feasible route is blocked",
  "Penalty 為什麼必要": "Why the penalty is necessary",
  "拖動側欄 penalty_A,看約束何時失效": "Drag penalty_A in the sidebar and watch the constraint fail",
  "{n} 個作弊態": "{n} cheat states",
  "0 作弊態": "0 cheat states",
  "縱軸 = 能量比最佳合法航線更低的狀態數(對數)。這些是量子會選、但根本不是一條連貫航線的「作弊解」。A 低於":
    "The y-axis counts states (log scale) with energy below the best legal route — “cheat solutions” a quantum optimiser would pick that are not coherent routes at all. Below A =",
  "時作弊態出現,A=0 時多達": "cheat states appear, up to",
  "個 —— 演算法會選「什麼都不選」拿 0 分。": "at A=0 — where the algorithm just selects nothing and scores 0.",
  "臨界 A*": "Critical A*",
  "出貨值": "Shipped",
  "安全邊際": "Safety margin",
  "掃描曲線、臨界 A* 與安全邊際為出貨實例(SIN→LAX、λ=0.4)的預算資料;卡片右上的作弊態計數則依目前設定即時計算。":
    "The sweep curve, critical A* and safety margin are precomputed for the shipped instance (SIN→LAX, λ=0.4); the cheat-state count at the top right is computed live for the current settings.",
  "港口風險": "Port risk",
  "點列可切換封鎖": "Click a row to toggle a blockade",
  "風險分數為 QUBO 模型輸入值。地震與颱風原始數字見「稽核」分頁,每港可對 USGS 官方即時查證。":
    "Risk scores are QUBO model inputs. Raw quake and typhoon figures are on the Audit tab, verifiable per port against the official USGS API.",

  // Ranking panel
  "能量地貌": "Energy landscape",
  "全部 {n} 個狀態｜對數縱軸": "All {n} states | log y-axis",
  "{n} Pauli 項": "{n} Pauli terms",
  "最佳合法": "best legal",
  "全域最低": "global min",
  "最低": "Min",
  "最高": "Max",
  "金線是最佳合法航線,紅線是全域最低能量。兩線重合時,penalty 已經強到讓「數學最低點」正好就是「一條真的能走的航線」—— 這正是 QUBO 建模要達成的事。":
    "Gold marks the best legal route, red the global energy minimum. When they coincide, the penalty is strong enough that the mathematical minimum is exactly a route you can actually sail — precisely what QUBO modelling is for.",
  "可行航線排行": "Feasible route ranking",
  "flow-balance 通過且能從 {src} 走到 {tgt}": "Flow-balanced and actually reaching {tgt} from {src}",
  "營運分數": "Op. score",
  "風險 CVaR": "Risk CVaR",
  "目前封鎖條件下沒有任何可行航線": "No feasible route under the current blockades",
  "{n} 段": "{n} legs",
  "分數": "score",
  "風險排序以已驗證的蒙地卡羅模型計算(每航線 ≤ 4,000 情境,取 CVaR{q})。營運分數與風險成本是兩套量綱,分開呈現、不合成單一指標。在「風險」分頁圈選受災港口,這裡的排序會跟著變。":
    "The risk order runs the verified Monte Carlo per route (≤4,000 scenarios each, CVaR{q}). Operating score and risk cost are two different scales — shown separately, never fused into one index. Mark affected ports on the Risk tab and this order follows.",
  "演算法比較": "Algorithm comparison",
  "16 qubit｜錨點 = 暴力解 {v}": "16 qubits | anchor = brute force {v}",
  "最佳成本": "Best cost",
  "秒": "Sec",
  "近似比 = 最佳可行成本 ÷ 暴力解最佳可行成本,且只對可行解有意義。GAS 該列為煙霧版(feasible=False),硬算近似比不合法,故列「—」。此表為固定歷史紀錄,不隨參數變動。":
    "Approx. ratio = best feasible cost ÷ brute-force best feasible cost, and it is only meaningful for feasible solutions. The GAS row is the smoke run (feasible=False), so forcing a ratio would be illegitimate — hence “—”. This table is a fixed record and ignores the site's parameters.",
  "上表屬出貨比賽實例(SIN→LAX、λ=0.4),不隨起終點或 λ 切換。":
    "The table belongs to the shipped contest instance (SIN→LAX, λ=0.4) and does not follow endpoint or λ changes.",

  // Data-borne strings
  "蘇伊士線": "Suez route",
  "高雄可倫坡線": "Kaohsiung–Colombo route",
  "香港蘇伊士線": "Hong Kong–Suez route",
  "地中海線": "Mediterranean route",
  "暴力解 exact": "Brute force (exact)",
  "QAOA (量子)": "QAOA (quantum)",
  "命中全域最佳解;執行時間 12-30s": "Hit the global optimum; runtime 12–30 s",
  "模擬退火 SA": "Simulated annealing",
  "Grover GAS (煙霧版)": "Grover GAS (smoke run)",
  "feasible=False,近似比不適用,列 —": "feasible=False; approx. ratio not applicable — shown as —",
  "此 16q ising 的最佳值為 -97.4936。筆記中的 0.9281 / corridor rank 屬另一個 local reduced QUBO,兩者不可同圖並列。":
    "This 16q ising's optimum is −97.4936. The 0.9281 / corridor rank in the notes belongs to a different local reduced QUBO; the two must never share a chart.",
  "基準情境": "Base scenario",
  "鹿特丹港衝擊": "Rotterdam port shock",
  "天氣衝擊": "Weather shock",

  // v2 platform campaign panel
  "30 港平台實測": "30-port platform campaign",
  "TEU 前 30 大港｜15 走廊 × 7 災害組合 = 105 個 30–33 qubit 平台實例":
    "Top-30 TEU ports | 15 corridors × 7 hazard sets = 105 platform instances at 30–33 qubits",
  "30 港航線網路圖": "30-port route network",
  "古典最優": "classical optimum",
  "量子 tier-1": "quantum tier-1",
  "量子 tier-2": "quantum tier-2",
  "切換災害組合看路線翻轉:Busan → Hamburg 在地震情境走 Mundra 線、颱風情境走馬六甲線、戰爭情境(蘇伊士/紅海封鎖)整條翻到跨太平洋 + 北美陸橋。這批是富士通 1024 節點 FX700 平台的實測結果 —— 不是本站瀏覽器模擬。":
    "Flip the hazard set and watch the route flip: Busan → Hamburg goes via Mundra under earthquakes, via the Malacca line under typhoons, and under war (Suez/Red Sea closure) swings entirely trans-Pacific onto the North-American land bridge. These are measured results from Fujitsu's 1024-node FX700 platform — not this site's browser simulation.",
  "量子 vs 古典": "Quantum vs classical",
  "同一實例內對比;cost 為 full-QUBO 能量,跨實例不可比":
    "Compared within one instance; costs are full-QUBO energies and are never comparable across instances",
  "可行採樣率": "Feasible sample rate",
  "此實例的量子採樣沒有抽到任何可行態(105 個實例中有 10 個如此)—— 誠實列出,不遮醜。tier-2 結果來自後處理管線。":
    "This instance's quantum sampling drew no feasible state at all (10 of the 105 instances did) — listed honestly, warts and all. The tier-2 result comes from the post-processing pipeline.",
  "古典 top 5": "Classical top 5",
  "窮舉 {n} 條可行路徑後的排行": "Ranking after enumerating {n} feasible paths",
  "量子採樣到的可行航線": "Feasible routes the quantum sampler drew",
  "q_count = 該航線在量子採樣中出現的次數":
    "q_count = how many times the route appeared in the quantum samples",
  "此實例未採樣到可行態": "No feasible state sampled for this instance",
  "口徑與出處": "Framing and provenance",
  "整批資料的誠實聲明,原文照錄": "The dataset's own honesty statements, quoted verbatim",
  "105 個實例各自對應一個平台 job(7956384–7956556),逐實例可稽核。無雜訊古典態向量模擬、非量子硬體、不宣稱量子優勢 —— 資料自帶的聲明,本站照錄。產生時間:{d}。":
    "Each of the 105 instances maps to its own platform job (7956384–7956556), auditable one by one. Noise-free classical statevector simulation, no quantum hardware, no quantum-advantage claim — the dataset's own statement, quoted here. Generated: {d}.",
  "本分頁為平台實測結果瀏覽器:QUBO 輸入(邊分數)留在平台上,瀏覽器不做重算。與「地圖/排行/演算法」分頁的 16q 即時引擎是兩套體系。":
    "This tab is a browser for measured platform results: the QUBO inputs (edge scores) stayed on the cluster, so nothing recomputes here. A separate system from the live 16q engine behind the Map/Ranking/Algorithms tabs.",
  "30港": "30 Ports",

  // Site-wide footer disclaimer
  "本站所有量子結果均為富士通 1024×FX700 無雜訊古典態向量模擬,非量子實機,不宣稱量子優勢。":
    "All quantum results on this site are noise-free classical statevector simulations on Fujitsu's 1024× FX700 cluster — not quantum hardware; no quantum-advantage claim.",

  // v2: tier-1 pure quantum vs tier-2 hybrid
  "純量子命中古典最優":
    "Pure quantum matched classical optimum",
  "hybrid 命中古典最優":
    "Hybrid matched classical optimum",
  "純量子近似比 {r}":
    "Pure-quantum ratio {r}",
  "純量子抽樣無合法樣本":
    "Pure-quantum sampling drew no feasible route",
  "tier-2 hybrid(量子 + 古典修補)":
    "tier-2 hybrid (quantum + classical repair)",
  "無":
    "None",
  "tier-1 = 純量子抽樣的最佳合法航線;tier-2 = 量子抽樣再經古典修補的 hybrid 結果,兩者分開列示,不併入同一排行。近似比 = 該實例古典最優 cost ÷ 該解 cost,1.0 表示命中古典精確解。":
    "tier-1 is the best feasible route pure-quantum sampling returned; tier-2 is the hybrid result after classical repair. They are listed separately and never merged into one ranking. The ratio is the instance's classical optimum cost divided by that solution's cost, so 1.0 means it matched the exact classical answer.",

  // estimate-grade cost figures
  "每日延誤成本(estimate)":
    "Daily delay cost (estimate)",
  "繞好望角 +12 天(estimate)":
    "+12 days round the Cape (estimate)",
  "繞好望角 +12 天(estimate);2026-02 事實封鎖情境":
    "+12 days round the Cape (estimate); the Feb 2026 de-facto closure scenario",
  "成本怎麼算出來的":
    "How the cost is derived",
  "所有金額皆為 estimate 級,非官方統計":
    "Every currency figure is estimate-grade, not an official statistic",
  "船型基準":
    "Vessel basis",
  "20,000 TEU 貨櫃輪":
    "20,000 TEU container ship",
  "租船營運":
    "Charter and operations",
  "約 每日 15 萬美元":
    "~USD 150k per day",
  "貨物庫存持有":
    "Cargo inventory holding",
  "約 每日 11 萬美元":
    "~USD 110k per day",
  "合計 每延誤一天":
    "Total per delayed day",
  "約 26.7 萬美元 — 本站滑桿預設值":
    "~USD 267k — the slider default here",
  "來源":
    "Source",
  "Drewry / Alphaliner 產業基準推算":
    "Derived from Drewry / Alphaliner industry benchmarks",
  "模型只把「延誤天數」換算成金額,不含運價、保費、違約金或商譽損失。荷莫茲封鎖的「繞好望角 +12 天」同樣是情境假設,不是觀測值 —— 兩者都標":
    "The model converts delay days into money and nothing else: no freight rates, insurance premiums, penalties or reputational loss. The Hormuz blockade's \"+12 days round the Cape\" is likewise a modelled scenario rather than an observation — both are marked",
  "。跨實例的量子成本(cost)是 full-QUBO 能量,與這裡的美金無關、不可換算。":
    ". The quantum cost figures elsewhere are full-QUBO energies; they are unrelated to these dollars and cannot be converted into them.",

  // 40q report headlines: flagship scenarios + Figure 2 flip
  "40q QAOA 旗艦實驗":
    "40q QAOA flagship run",
  "{s} → {tg}｜{e} 條航段｜{n} 節點｜報告 {sec}":
    "{s} → {tg} | {e} legs | {n} nodes | report {sec}",
  "qubits":
    "qubits",
  "抽樣次數":
    "Shots",
  "抽中最佳解":
    "Optimum drawn",
  "次":
    "times",
  "佔合法樣本":
    "Share of feasible samples",
  "以上為 tier-1 純量子抽樣":
    "All of the above is tier-1 pure-quantum sampling",
  "情境":
    "Scenario",
  "推薦航線是否改變":
    "Recommended route changed",
  "與精確解差距":
    "Gap to exact",
  "改變":
    "Changed",
  "基準":
    "Baseline",
  "四個情境的抽樣最佳解全部等於窮舉驗證的精確解,差距為 0;而推薦航線每次都隨風險改變。這說明 40 qubit 不只是「跑得動」,而是「答案正確、且會隨情境變動」。":
    "In all four scenarios the best sampled solution equals the brute-force-verified exact optimum, a gap of zero — and the recommended route changes every time the risk does. So 40 qubits is not merely running: the answers are correct and they respond to the scenario.",
  "戰爭風險一開,航線就翻轉":
    "Turn the war risk on and the route flips",
  "{s} → {tg}｜{q} qubits｜報告 {f}":
    "{s} → {tg} | {q} qubits | report {f}",
  "戰爭風險項關閉":
    "War-risk term off",
  "戰爭風險項開啟":
    "War-risk term on",
  "戰爭風險項關閉時,最佳航線走可倫坡 / 蘇伊士走廊;開啟後整條翻到跨太平洋經洛杉磯、紐約、安特衛普。權重不是憑空設的 —— 以蘇伊士運河 2024 年通行量崩跌校準,等效 10 天延誤。這重現了 2024 年航運業真實的改道決策。":
    "With the war-risk term off, the optimal route runs through the Colombo / Suez corridor; switch it on and the whole thing flips trans-Pacific via Los Angeles, New York and Antwerp. The weight is not invented — it is calibrated on the 2024 collapse in Suez Canal transits, equivalent to a 10-day delay. This reproduces the rerouting the shipping industry actually did in 2024.",
  "40-qubit 規模里程碑(七月 Grover,誠實保留的失敗案例)":
    "40-qubit scale milestone (July Grover — the failure, kept on purpose)",
  "可倫坡 / 蘇伊士走廊":
    "Colombo / Suez corridor",
  "跨太平洋經巴拿馬":
    "Trans-Pacific via Panama",
  "直航停航":
    "Direct service suspended",
  "加高雄封港":
    "plus Kaohsiung port closure",
  "加紅海中斷":
    "plus Red Sea disruption",

  // report §8 quote; Figure 2 ratio attribution
  "報告 {s}":
    "Report {s}",
  "建立在此引擎上的互動情境應用(靜態、離線快取的網頁示範器)是一種部署形態的示範;同一套介面也能由古典解法驅動,它的價值在決策流程,而不在量子的必要性。":
    "The interactive scenario application built on this engine (a static, offline-cached web demonstrator) is a deployment-pattern illustration; the same interface could be served by a classical solver, and its value is the decision workflow, not quantum necessity.",
  "tier-1 純量子(戰爭開啟)":
    "tier-1 pure quantum (war on)",
  "tier-2 hybrid(top-512 修補)":
    "tier-2 hybrid (top-512 repair)",
  "兩個近似比皆為「戰爭風險開啟」那個實例的數值(報告 §5.2);tier-2 為 top-512 修補。平台獨立列舉的基準真值與建置期列舉一致到小數第四位(皆為 {c},full-QUBO 口徑)。":
    "Both ratios are for the war-enabled instance (report §5.2); tier-2 is top-512 repair. The platform's independently enumerated ground truth agreed with the build-time enumeration to four decimals ({c} for both, full-QUBO convention).",
  "tier-1 純量子":
    "tier-1 pure quantum",
  "tier-2 hybrid":
    "tier-2 hybrid",
};
