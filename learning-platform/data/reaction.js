// 化学反应基础
const reactionData = {
    "ion-reaction": {
        title: "离子反应",
        description: "电解质在溶液中的反应本质",
        content: `
            <div class="doc-section">
                <h2>电解质与非电解质</h2>
                <table>
                    <tr><th>类别</th><th>定义</th><th>实例</th></tr>
                    <tr><td>电解质</td><td>在水溶液或熔融状态下能导电的化合物</td><td>酸、碱、盐、活泼金属氧化物、水</td></tr>
                    <tr><td>非电解质</td><td>在水溶液和熔融状态下都不能导电的化合物</td><td>蔗糖、酒精、CO₂、SO₂、NH₃</td></tr>
                    <tr><td>强电解质</td><td>完全电离的电解质</td><td>强酸、强碱、大部分盐</td></tr>
                    <tr><td>弱电解质</td><td>部分电离的电解质</td><td>弱酸、弱碱、水</td></tr>
                </table>
                <div class="demo-note">
                    CO₂、SO₂、NH₃ 的水溶液能导电，是因为生成了 H₂CO₃、H₂SO₃、NH₃·H₂O，它们本身是非电解质。
                </div>
            </div>
            <div class="doc-section">
                <h2>离子反应</h2>
                <p>有离子参加或生成的化学反应，通常在水溶液中进行。</p>
                <h3>离子方程式书写步骤</h3>
                <ol>
                    <li>写出完整的化学方程式</li>
                    <li>将易溶强电解质拆成离子形式</li>
                    <li>删去两边相同的离子（ spectator ions ）</li>
                    <li>检查原子守恒和电荷守恒</li>
                </ol>
                <h3>离子共存判断</h3>
                <p>离子不能共存的情况：</p>
                <ul>
                    <li>生成沉淀（如 Ag⁺ 与 Cl⁻，Ba²⁺ 与 SO₄²⁻）</li>
                    <li>生成气体（如 H⁺ 与 CO₃²⁻，NH₄⁺ 与 OH⁻）</li>
                    <li>生成弱电解质（如 H⁺ 与 OH⁻，H⁺ 与 CH₃COO⁻）</li>
                    <li>发生氧化还原反应（如 Fe³⁺ 与 I⁻）</li>
                    <li>发生双水解（如 Al³⁺ 与 CO₃²⁻，Al³⁺ 与 AlO₂⁻）</li>
                </ul>
            </div>
        `
    },
    redox: {
        title: "氧化还原反应",
        description: "有电子转移（得失或偏移）的化学反应",
        content: `
            <div class="doc-section">
                <h2>氧化还原反应的本质</h2>
                <p>反应过程中有电子的转移（得失或共用电子对偏移）。</p>
                <table>
                    <tr><th>概念</th><th>定义</th><th>实质</th></tr>
                    <tr><td>氧化反应</td><td>元素化合价升高的反应</td><td>失去电子</td></tr>
                    <tr><td>还原反应</td><td>元素化合价降低的反应</td><td>得到电子</td></tr>
                    <tr><td>氧化剂</td><td>得到电子的物质</td><td>化合价降低，被还原</td></tr>
                    <tr><td>还原剂</td><td>失去电子的物质</td><td>化合价升高，被氧化</td></tr>
                </table>
                <div class="code-block">
                    <pre>口诀：升失氧，降得还
化合价升高 → 失去电子 → 被氧化 → 作还原剂
化合价降低 → 得到电子 → 被还原 → 作氧化剂</pre>
                </div>
            </div>
            <div class="doc-section">
                <h2>常见氧化剂与还原剂</h2>
                <table>
                    <tr><th>类型</th><th>实例</th><th>产物</th></tr>
                    <tr><td>活泼非金属</td><td>Cl₂、Br₂、O₂</td><td>Cl⁻、Br⁻、O²⁻</td></tr>
                    <tr><td>高价化合物</td><td>KMnO₄、K₂Cr₂O₇、浓H₂SO₄、HNO₃</td><td>Mn²⁺、Cr³⁺、SO₂、NO/NO₂</td></tr>
                    <tr><td>金属阳离子</td><td>Fe³⁺、Cu²⁺、Ag⁺</td><td>Fe²⁺、Cu、Ag</td></tr>
                    <tr><td>过氧化物</td><td>H₂O₂、Na₂O₂</td><td>H₂O、NaOH</td></tr>
                </table>
                <h3>氧化性还原性强弱比较</h3>
                <ol>
                    <li>根据金属活动性顺序：K > Ca > Na > Mg > Al > Zn > Fe > Sn > Pb > (H) > Cu > Hg > Ag > Pt > Au</li>
                    <li>根据反应方程式：氧化剂 + 还原剂 → 还原产物 + 氧化产物<br>
                    氧化性：氧化剂 > 氧化产物；还原性：还原剂 > 还原产物</li>
                </ol>
            </div>
            <div class="doc-section">
                <h2>氧化还原反应配平</h2>
                <h3>化合价升降法（电子守恒法）</h3>
                <ol>
                    <li>标出变价元素的化合价</li>
                    <li>计算升降总数，找出最小公倍数</li>
                    <li>根据得失电子相等确定氧化剂、还原剂系数</li>
                    <li>用观察法配平其他物质</li>
                    <li>检查原子守恒和电荷守恒</li>
                </ol>
                <div class="reaction-card">
                    例：KMnO₄ + HCl → KCl + MnCl₂ + Cl₂ + H₂O<br>
                    Mn: +7 → +2，降 5；Cl: -1 → 0，升 1（2个Cl）<br>
                    2KMnO₄ + 16HCl = 2KCl + 2MnCl₂ + 5Cl₂↑ + 8H₂O
                </div>
            </div>
        `
    },
    "reaction-types": {
        title: "化学反应类型",
        description: "基本反应类型与氧化还原反应的关系",
        content: `
            <div class="doc-section">
                <h2>四种基本反应类型</h2>
                <table>
                    <tr><th>反应类型</th><th>通式</th><th>实例</th></tr>
                    <tr><td>化合反应</td><td>A + B → AB</td><td>2H₂ + O₂ → 2H₂O</td></tr>
                    <tr><td>分解反应</td><td>AB → A + B</td><td>2KClO₃ → 2KCl + 3O₂↑</td></tr>
                    <tr><td>置换反应</td><td>A + BC → AC + B</td><td>Zn + H₂SO₄ → ZnSO₄ + H₂↑</td></tr>
                    <tr><td>复分解反应</td><td>AB + CD → AD + CB</td><td>NaCl + AgNO₃ → AgCl↓ + NaNO₃</td></tr>
                </table>
            </div>
            <div class="doc-section">
                <h2>基本反应类型与氧化还原反应的关系</h2>
                <table>
                    <tr><th>反应类型</th><th>是否为氧化还原反应</th><th>说明</th></tr>
                    <tr><td>化合反应</td><td>部分是</td><td>有单质参加的是（如 2H₂ + O₂），无单质参加的多数不是</td></tr>
                    <tr><td>分解反应</td><td>部分是</td><td>有单质生成的是（如 2KClO₃），无单质生成的多数不是</td></tr>
                    <tr><td>置换反应</td><td>全部是</td><td>一定有单质参加和生成，一定涉及化合价变化</td></tr>
                    <tr><td>复分解反应</td><td>全部不是</td><td>只是离子交换，无化合价变化</td></tr>
                </table>
                <div class="success-note">
                    置换反应一定是氧化还原反应，复分解反应一定不是氧化还原反应。
                </div>
            </div>
        `
    }
};
