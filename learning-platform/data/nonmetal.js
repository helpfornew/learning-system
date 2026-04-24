// 非金属元素
const nonmetalData = {
    chlorine: {
        title: "氯及其化合物",
        description: "活泼非金属氯气的性质与含氯化合物",
        content: `
            <div class="doc-section">
                <h2>氯气（Cl₂）的性质</h2>
                <h3>物理性质</h3>
                <ul>
                    <li>黄绿色气体，有刺激性气味</li>
                    <li>密度比空气大，可溶于水（1:2），易液化</li>
                    <li>有毒，是重要化工原料</li>
                </ul>
                <h3>化学性质</h3>
                <h4>与金属反应</h4>
                <div class="reaction-card">
                    2Na + Cl₂ → 2NaCl（点燃，黄色火焰，白烟）<br>
                    Cu + Cl₂ → CuCl₂（点燃，棕黄色烟）<br>
                    2Fe + 3Cl₂ → 2FeCl₃（点燃，棕褐色烟）
                </div>
                <div class="warning-note">
                    氯气与变价金属反应，金属显高价：Fe + Cl₂ → FeCl₃（不是FeCl₂）
                </div>
                <h4>与非金属反应</h4>
                <div class="reaction-card">
                    H₂ + Cl₂ → 2HCl（点燃安静燃烧，苍白色火焰；光照爆炸）
                </div>
                <h4>与水反应</h4>
                <div class="reaction-card">
                    Cl₂ + H₂O ⇌ HCl + HClO（次氯酸）<br>
                    氯水成分：Cl₂、H₂O、HClO、H⁺、Cl⁻、ClO⁻、OH⁻
                </div>
                <h4>与碱反应</h4>
                <div class="reaction-card">
                    Cl₂ + 2NaOH → NaCl + NaClO + H₂O（制漂白液）<br>
                    2Cl₂ + 2Ca(OH)₂ → CaCl₂ + Ca(ClO)₂ + 2H₂O（制漂白粉）
                </div>
            </div>
            <div class="doc-section">
                <h2>次氯酸与漂白粉</h2>
                <h3>次氯酸（HClO）的性质</h3>
                <ul>
                    <li>弱酸性（比碳酸还弱）：HClO ⇌ H⁺ + ClO⁻</li>
                    <li>强氧化性：漂白、杀菌、消毒</li>
                    <li>不稳定性：2HClO → 2HCl + O₂↑（光照分解）</li>
                </ul>
                <h3>漂白粉</h3>
                <p>主要成分：CaCl₂ 和 Ca(ClO)₂；有效成分：Ca(ClO)₂</p>
                <div class="reaction-card">
                    漂白原理：Ca(ClO)₂ + CO₂ + H₂O → CaCO₃↓ + 2HClO<br>
                    失效原理：Ca(ClO)₂ + CO₂ + H₂O → CaCO₃ + 2HClO，2HClO → 2HCl + O₂↑
                </div>
            </div>
            <div class="doc-section">
                <h2>氯气的实验室制法</h2>
                <div class="reaction-card">
                    MnO₂ + 4HCl(浓) → MnCl₂ + Cl₂↑ + 2H₂O（加热）<br>
                    2KMnO₄ + 16HCl(浓) → 2KCl + 2MnCl₂ + 5Cl₂↑ + 8H₂O（不加热）
                </div>
                <h3>制备装置</h3>
                <ul>
                    <li>发生装置：固液加热型（或固液不加热型）</li>
                    <li>净化：先通过饱和食盐水除 HCl，再通过浓硫酸干燥</li>
                    <li>收集：向上排空气法或排饱和食盐水法</li>
                    <li>尾气处理：用 NaOH 溶液吸收</li>
                </ul>
            </div>
        `
    },
    sulfur: {
        title: "硫及其化合物",
        description: "硫的多种价态及其转化关系",
        content: `
            <div class="doc-section">
                <h2>硫单质（S）的性质</h2>
                <h3>物理性质</h3>
                <ul>
                    <li>淡黄色晶体，质脆，易研成粉末</li>
                    <li>不溶于水，微溶于酒精，易溶于 CS₂</li>
                    <li>熔点较低（112.8℃）</li>
                </ul>
                <h3>化学性质</h3>
                <div class="reaction-card">
                    与金属：Fe + S → FeS（加热，生成低价硫化物）<br>
                    2Cu + S → Cu₂S（加热）<br>
                    Hg + S → HgS（常温，处理洒落的汞）<br><br>
                    与非金属：S + O₂ → SO₂（点燃，蓝紫色火焰）<br>
                    S + H₂ → H₂S（加热）
                </div>
            </div>
            <div class="doc-section">
                <h2>二氧化硫（SO₂）的性质</h2>
                <h3>物理性质</h3>
                <ul>
                    <li>无色有刺激性气味的气体</li>
                    <li>密度比空气大，易溶于水（1:40）</li>
                    <li>有毒，是大气污染物</li>
                </ul>
                <h3>化学性质</h3>
                <h4>酸性氧化物通性</h4>
                <div class="reaction-card">
                    SO₂ + H₂O ⇌ H₂SO₃（亚硫酸，中强酸）<br>
                    SO₂ + 2NaOH → Na₂SO₃ + H₂O<br>
                    SO₂ + CaO → CaSO₃
                </div>
                <h4>还原性（主要性质）</h4>
                <div class="reaction-card">
                    2SO₂ + O₂ ⇌ 2SO₃（催化剂，加热）<br>
                    SO₂ + Cl₂ + 2H₂O → H₂SO₄ + 2HCl<br>
                    SO₂ + Br₂ + 2H₂O → H₂SO₄ + 2HBr
                </div>
                <h4>氧化性</h4>
                <div class="reaction-card">
                    SO₂ + 2H₂S → 3S↓ + 2H₂O
                </div>
                <h4>漂白性</h4>
                <p>SO₂能与某些有色物质结合生成不稳定的无色物质，加热可恢复原色（可逆漂白）。</p>
                <div class="demo-note">
                    SO₂使品红溶液褪色（加热恢复红色），不能使酸碱指示剂褪色；Cl₂使品红溶液褪色（不可逆）。
                </div>
            </div>
            <div class="doc-section">
                <h2>硫酸（H₂SO₄）的性质</h2>
                <h3>稀硫酸的性质</h3>
                <p>具有酸的通性：与活泼金属、碱、碱性氧化物、盐反应。</p>
                <h3>浓硫酸的特性</h3>
                <table>
                    <tr><th>特性</th><th>表现</th><th>实例</th></tr>
                    <tr><td>吸水性</td><td>吸收现成的水分子</td><td>作干燥剂（不能干燥NH₃、H₂S等）</td></tr>
                    <tr><td>脱水性</td><td>按H:O=2:1比例脱去有机物中的氢氧</td><td>使蔗糖炭化变黑</td></tr>
                    <tr><td>强氧化性</td><td>与金属、非金属反应</td><td>Cu + 2H₂SO₄(浓) → CuSO₄ + SO₂↑ + 2H₂O</td></tr>
                </table>
                <div class="warning-note">
                    浓硫酸稀释：将浓硫酸沿器壁缓缓注入水中，并不断搅拌。切不可将水倒入浓硫酸中！
                </div>
            </div>
        `
    },
    nitrogen: {
        title: "氮及其化合物",
        description: "氮的固定与硝酸的性质",
        content: `
            <div class="doc-section">
                <h2>氮气（N₂）的性质</h2>
                <h3>物理性质</h3>
                <ul>
                    <li>无色无味气体，密度略小于空气</li>
                    <li>难溶于水</li>
                    <li>液态氮沸点-196℃（77K）</li>
                </ul>
                <h3>化学性质</h3>
                <p>N≡N 键能大（946 kJ/mol），化学性质稳定，通常条件下不易与其他物质反应。</p>
                <div class="reaction-card">
                    N₂ + O₂ → 2NO（放电条件）<br>
                    N₂ + 3H₂ ⇌ 2NH₃（高温高压催化剂，合成氨）<br>
                    N₂ + 3Mg → Mg₃N₂（点燃）
                </div>
                <h3>氮的固定</h3>
                <p>将游离态氮转化为化合态氮的过程：</p>
                <ul>
                    <li>自然固氮：雷电固氮、生物固氮（根瘤菌）</li>
                    <li>人工固氮：合成氨工业</li>
                </ul>
            </div>
            <div class="doc-section">
                <h2>氮的氧化物</h2>
                <table>
                    <tr><th>氧化物</th><th>N化合价</th><th>性质</th></tr>
                    <tr><td>N₂O</td><td>+1</td><td>笑气</td></tr>
                    <tr><td>NO</td><td>+2</td><td>无色气体，遇空气变红棕，有毒</td></tr>
                    <tr><td>N₂O₃</td><td>+3</td><td>亚硝酸酐</td></tr>
                    <tr><td>NO₂</td><td>+4</td><td>红棕色气体，易溶于水</td></tr>
                    <tr><td>N₂O₅</td><td>+5</td><td>硝酸酐</td></tr>
                </table>
                <h3>NO 和 NO₂ 的重要反应</h3>
                <div class="reaction-card">
                    2NO + O₂ → 2NO₂（无色变红棕色）<br>
                    3NO₂ + H₂O → 2HNO₃ + NO<br>
                    2NO₂ ⇌ N₂O₄（可逆反应，放热）
                </div>
                <div class="demo-note">
                    收集NO用排水法（与O₂反应），收集NO₂用向上排空气法（与水反应）。
                </div>
            </div>
            <div class="doc-section">
                <h2>氨气（NH₃）的性质</h2>
                <h3>物理性质</h3>
                <ul>
                    <li>无色有刺激性气味气体</li>
                    <li>密度比空气小，极易溶于水（1:700）</li>
                    <li>易液化（作制冷剂）</li>
                </ul>
                <h3>化学性质</h3>
                <h4>碱性</h4>
                <div class="reaction-card">
                    NH₃ + H₂O ⇌ NH₃·H₂O ⇌ NH₄⁺ + OH⁻<br>
                    NH₃ + HCl → NH₄Cl（白烟）<br>
                    2NH₃ + H₂SO₄ → (NH₄)₂SO₄
                </div>
                <h4>还原性</h4>
                <div class="reaction-card">
                    4NH₃ + 5O₂ → 4NO + 6H₂O（催化剂加热，氨的催化氧化）<br>
                    8NH₃ + 3Cl₂ → N₂ + 6NH₄Cl
                </div>
                <h3>氨气的实验室制法</h3>
                <div class="reaction-card">
                    2NH₄Cl + Ca(OH)₂ → CaCl₂ + 2NH₃↑ + 2H₂O（加热）<br>
                    浓氨水加热或加碱：NH₃·H₂O →(△) NH₃↑ + H₂O
                </div>
            </div>
            <div class="doc-section">
                <h2>硝酸（HNO₃）的性质</h2>
                <h3>物理性质</h3>
                <ul>
                    <li>无色易挥发液体，有刺激性气味</li>
                    <li>与水以任意比互溶</li>
                    <li>浓硝酸（69%）和发烟硝酸（>98%）</li>
                </ul>
                <h3>化学性质</h3>
                <h4>不稳定性</h4>
                <div class="reaction-card">
                    4HNO₃ → 4NO₂↑ + O₂↑ + 2H₂O（光照或加热）<br>
                    浓硝酸常呈黄色（溶解NO₂），应避光保存于棕色瓶
                </div>
                <h4>强氧化性</h4>
                <p>浓硝酸与铜：Cu + 4HNO₃(浓) → Cu(NO₃)₂ + 2NO₂↑ + 2H₂O</p>
                <p>稀硝酸与铜：3Cu + 8HNO₃(稀) → 3Cu(NO₃)₂ + 2NO↑ + 4H₂O</p>
                <p>常温下，浓硝酸使 Fe、Al 钝化</p>
                <div class="warning-note">
                    硝酸与金属反应不产生H₂，而是氮的氧化物。氧化性：浓HNO₃ > 稀HNO₃。
                </div>
            </div>
        `
    },
    silicon: {
        title: "硅及其化合物",
        description: "无机非金属材料的主角",
        content: `
            <div class="doc-section">
                <h2>硅单质的性质</h2>
                <h3>物理性质</h3>
                <ul>
                    <li>灰黑色固体，有金属光泽</li>
                    <li>硬度大，熔点高（1410℃）</li>
                    <li>半导体材料</li>
                </ul>
                <h3>化学性质</h3>
                <div class="reaction-card">
                    Si + O₂ → SiO₂（加热）<br>
                    Si + 2Cl₂ → SiCl₄（加热）<br>
                    Si + 2NaOH + H₂O → Na₂SiO₃ + 2H₂↑<br>
                    Si + 4HF → SiF₄↑ + 2H₂↑
                </div>
                <h3>制备</h3>
                <div class="reaction-card">
                    SiO₂ + 2C → Si + 2CO↑（高温，制粗硅）<br>
                    Si + 2Cl₂ → SiCl₄（提纯）<br>
                    SiCl₄ + 2H₂ → Si + 4HCl（制纯硅）
                </div>
            </div>
            <div class="doc-section">
                <h2>二氧化硅（SiO₂）的性质</h2>
                <h3>物理性质</h3>
                <ul>
                    <li>无色透明晶体（石英、水晶）</li>
                    <li>硬度大，熔点高（1713℃）</li>
                    <li>不溶于水</li>
                </ul>
                <h3>化学性质</h3>
                <div class="reaction-card">
                    酸性氧化物：SiO₂ + 2NaOH → Na₂SiO₃ + H₂O<br>
                    与HF反应：SiO₂ + 4HF → SiF₄↑ + 2H₂O（腐蚀玻璃）<br>
                    与碳反应：SiO₂ + 2C → Si + 2CO↑（高温）<br>
                    与氧化钙：SiO₂ + CaO → CaSiO₃（高温）
                </div>
                <div class="warning-note">
                    SiO₂虽然是酸性氧化物，但能与HF反应，且不与水反应生成硅酸。
                </div>
            </div>
            <div class="doc-section">
                <h2>硅酸与硅酸盐</h2>
                <h3>硅酸（H₂SiO₃）</h3>
                <p>白色胶状沉淀，不溶于水，酸性比碳酸还弱。</p>
                <div class="reaction-card">
                    Na₂SiO₃ + CO₂ + H₂O → Na₂CO₃ + H₂SiO₃↓<br>
                    证明酸性：H₂CO₃ > H₂SiO₃
                </div>
                <h3>硅酸钠（Na₂SiO₃）</h3>
                <p>水溶液俗称水玻璃，有粘性，可作黏合剂、防腐剂、防火剂。</p>
                <h3>常见硅酸盐材料</h3>
                <table>
                    <tr><th>材料</th><th>主要成分</th><th>用途</th></tr>
                    <tr><td>普通玻璃</td><td>Na₂SiO₃、CaSiO₃、SiO₂</td><td>门窗、器皿</td></tr>
                    <tr><td>水泥</td><td>硅酸三钙、硅酸二钙、铝酸三钙</td><td>建筑材料</td></tr>
                    <tr><td>陶瓷</td><td>硅酸盐</td><td>日用器皿、工艺品</td></tr>
                </table>
            </div>
        `
    }
};
