// 有机化学基础
const organicData = {
    hydrocarbon: {
        title: "烃类化合物",
        description: "烷烃、烯烃、炔烃与芳香烃",
        content: `
            <div class="doc-section">
                <h2>有机物概述</h2>
                <p>有机物是含碳元素的化合物（除CO、CO₂、碳酸、碳酸盐、氰化物等少数物质外）。</p>
                <h3>有机物的主要特点</h3>
                <ul>
                    <li>种类繁多：碳原子可以形成四个共价键，能形成长链、支链、环状结构</li>
                    <li>熔沸点较低：多为分子晶体</li>
                    <li>多为非电解质，溶解性遵循"相似相溶"原理</li>
                    <li>易燃烧，反应速率较慢，常伴有副反应</li>
                </ul>
                <h3>烃的分类</h3>
                <div class="code-block">
                    <pre>烃
├── 链烃（脂肪烃）
│   ├── 饱和链烃：烷烃（通式CnH₂n₊₂）
│   ├── 不饱和链烃
│   │   ├── 烯烃（含C=C，通式CnH₂n）
│   │   └── 炔烃（含C≡C，通式CnH₂n₋₂）
└── 环烃
    ├── 脂环烃
    └── 芳香烃（含苯环）</pre>
                </div>
            </div>
            <div class="doc-section">
                <h2>烷烃（饱和烃）</h2>
                <h3>甲烷（CH₄）的性质</h3>
                <p>最简单的有机物，正四面体结构，碳原子采用sp³杂化。</p>
                <h4>取代反应</h4>
                <div class="reaction-card">
                    CH₄ + Cl₂ → CH₃Cl + HCl（光照）<br>
                    CH₃Cl + Cl₂ → CH₂Cl₂ + HCl（继续取代）<br>
                    CH₂Cl₂ + Cl₂ → CHCl₃ + HCl<br>
                    CHCl₃ + Cl₂ → CCl₄ + HCl
                </div>
                <div class="warning-note">
                    取代反应特点：逐步进行，产物复杂，得到混合物。1 mol H被取代消耗1 mol Cl₂。
                </div>
                <h3>烷烃的通性</h3>
                <ul>
                    <li>通式：CₙH₂ₙ₊₂（n≥1）</li>
                    <li>物理性质：随碳原子数增加，熔沸点升高，密度增大；C₁~C₄为气态</li>
                    <li>化学性质：稳定，光照下可与卤素发生取代反应，可燃烧</li>
                </ul>
                <div class="reaction-card">
                    燃烧通式：CₙH₂ₙ₊₂ + (3n+1)/2 O₂ → nCO₂ + (n+1)H₂O
                </div>
            </div>
            <div class="doc-section">
                <h2>烯烃（不饱和烃）</h2>
                <h3>乙烯（C₂H₄）的性质</h3>
                <p>平面结构，碳原子采用sp²杂化，含C=C双键（一个σ键，一个π键）。</p>
                <h4>加成反应</h4>
                <div class="reaction-card">
                    与溴水：CH₂=CH₂ + Br₂ → CH₂Br-CH₂Br（1,2-二溴乙烷，溴水褪色）<br>
                    与H₂：CH₂=CH₂ + H₂ → CH₃-CH₃（Ni催化，加热）<br>
                    与HCl：CH₂=CH₂ + HCl → CH₃-CH₂Cl<br>
                    与H₂O：CH₂=CH₂ + H₂O → CH₃-CH₂OH（催化剂，加热加压）
                </div>
                <h4>氧化反应</h4>
                <div class="reaction-card">
                    燃烧：C₂H₄ + 3O₂ → 2CO₂ + 2H₂O（火焰明亮，有黑烟）<br>
                    被KMnO₄氧化：使酸性KMnO₄溶液褪色
                </div>
                <h4>加聚反应</h4>
                <div class="reaction-card">
                    nCH₂=CH₂ → [CH₂-CH₂]n（聚乙烯）
                </div>
                <h3>烯烃的通性</h3>
                <ul>
                    <li>通式：CₙH₂ₙ（n≥2）</li>
                    <li>官能团：碳碳双键（C=C）</li>
                    <li>特征反应：加成反应、氧化反应、加聚反应</li>
                </ul>
            </div>
            <div class="doc-section">
                <h2>炔烃</h2>
                <h3>乙炔（C₂H₂）的性质</h3>
                <p>直线形结构，碳原子采用sp杂化，含C≡C三键。</p>
                <h4>加成反应</h4>
                <div class="reaction-card">
                    CH≡CH + 2Br₂ → CHBr₂-CHBr₂（完全加成）<br>
                    CH≡CH + HCl → CH₂=CHCl（氯乙烯，制聚氯乙烯）
                </div>
                <h4>氧化反应</h4>
                <div class="reaction-card">
                    燃烧：2C₂H₂ + 5O₂ → 4CO₂ + 2H₂O（火焰明亮，有浓烈黑烟）<br>
                    使酸性KMnO₄溶液褪色
                </div>
                <h4>实验室制法</h4>
                <div class="reaction-card">
                    CaC₂ + 2H₂O → Ca(OH)₂ + C₂H₂↑
                </div>
            </div>
            <div class="doc-section">
                <h2>芳香烃</h2>
                <h3>苯（C₆H₆）的性质</h3>
                <p>平面正六边形结构，所有原子共平面，碳原子采用sp²杂化，存在大π键。</p>
                <h4>取代反应（苯的特征反应）</h4>
                <div class="reaction-card">
                    卤代：C₆H₆ + Br₂ → C₆H₅Br + HBr（FeBr₃催化）<br>
                    硝化：C₆H₆ + HNO₃ → C₆H₅NO₂ + H₂O（浓H₂SO₄催化，50~60℃）<br>
                    磺化：C₆H₆ + H₂SO₄(浓) → C₆H₅SO₃H + H₂O（加热）
                </div>
                <h4>加成反应（难进行）</h4>
                <div class="reaction-card">
                    C₆H₆ + 3H₂ → C₆H₁₂（环己烷，Ni催化，加热）
                </div>
                <h3>苯的同系物</h3>
                <p>含一个苯环，侧链为烷基，通式CₙH₂ₙ₋₆（n≥6）。</p>
                <div class="reaction-card">
                    甲苯：C₆H₅-CH₃<br>
                    侧链易被KMnO₄氧化：C₆H₅-CH₃ →(KMnO₄) C₆H₅-COOH（苯甲酸）<br>
                    说明苯环影响侧链，使甲基易被氧化
                </div>
            </div>
        `
    },
    isomerism: {
        title: "同分异构体",
        description: "有机化合物的同分异构现象与书写方法",
        content: `
            <div class="doc-section">
                <h2>同分异构现象</h2>
                <p>化合物具有相同的分子式，但具有不同结构的现象，叫做同分异构现象。具有同分异构现象的化合物互称为同分异构体。</p>
                <h3>同分异构体的类型</h3>
                <table>
                    <tr><th>类型</th><th>定义</th><th>实例</th></tr>
                    <tr><td>碳链异构</td><td>碳骨架不同</td><td>正丁烷与异丁烷</td></tr>
                    <tr><td>位置异构</td><td>官能团位置不同</td><td>1-丙醇与2-丙醇</td></tr>
                    <tr><td>官能团异构</td><td>官能团种类不同</td><td>乙醇与二甲醚</td></tr>
                    <tr><td>立体异构</td><td>空间结构不同</td><td>顺反异构、对映异构</td></tr>
                </table>
            </div>
            <div class="doc-section">
                <h2>烷烃的同分异构体书写</h2>
                <h3>减碳法（主链由长到短）</h3>
                <ol>
                    <li>写出最长碳链的直链烷烃</li>
                    <li>主链减少一个碳原子，作为甲基取代基，从中间向两边移动</li>
                    <li>主链再减少一个碳原子，作为两个甲基或一个乙基取代基</li>
                    <li>检查是否有重复结构</li>
                </ol>
                <h3>实例：C₆H₁₄的同分异构体</h3>
                <div class="code-block">
                    <pre>1. CH₃-CH₂-CH₂-CH₂-CH₂-CH₃（正己烷）
2. CH₃-CH(CH₃)-CH₂-CH₂-CH₃（2-甲基戊烷）
3. CH₃-CH₂-CH(CH₃)-CH₂-CH₃（3-甲基戊烷）
4. CH₃-C(CH₃)₂-CH₂-CH₃（2,2-二甲基丁烷）
5. CH₃-CH(CH₃)-CH(CH₃)-CH₃（2,3-二甲基丁烷）</pre>
                </div>
            </div>
            <div class="doc-section">
                <h2>含官能团化合物的同分异构体</h2>
                <h3>一卤代烷的同分异构体</h3>
                <p>等效氢法：判断分子中有多少种不同化学环境的氢原子，就有多少种一卤代物。</p>
                <div class="code-block">
                    <pre>等效氢判断原则：
1. 同一碳原子上的氢等效
2. 同一碳原子上的甲基氢等效
3. 镜面对称的氢等效

例：新戊烷 C(CH₃)₄ 的一氯代物只有1种
     甲苯的一氯代物有4种（邻、间、对、甲基）</pre>
                </div>
                <h3>醇的同分异构体</h3>
                <p>先写碳骨架异构，再移动羟基位置。</p>
                <div class="reaction-card">
                    C₄H₉OH（丁醇）的同分异构体：<br>
                    1. CH₃CH₂CH₂CH₂OH（1-丁醇）<br>
                    2. CH₃CH₂CH(OH)CH₃（2-丁醇）<br>
                    3. (CH₃)₂CHCH₂OH（2-甲基-1-丙醇）<br>
                    4. (CH₃)₃COH（2-甲基-2-丙醇）
                </div>
            </div>
            <div class="doc-section">
                <h2>常见官能团异构</h2>
                <table>
                    <tr><th>分子式通式</th><th>可能的官能团类别</th><th>实例</th></tr>
                    <tr><td>CₙH₂ₙ₊₂O</td><td>醇或醚</td><td>C₂H₆O：乙醇、二甲醚</td></tr>
                    <tr><td>CₙH₂ₙO</td><td>醛、酮、烯醇、环醇</td><td>C₃H₆O：丙醛、丙酮</td></tr>
                    <tr><td>CₙH₂ₙO₂</td><td>羧酸、酯、羟基醛</td><td>C₃H₆O₂：丙酸、甲酸乙酯</td></tr>
                    <tr><td>CₙH₂ₙ₋₆O</td><td>酚、芳香醇、芳香醚</td><td>C₇H₈O：苯甲醇、邻甲酚</td></tr>
                </table>
            </div>
        `
    },
    "hydrocarbon-derivative": {
        title: "烃的衍生物",
        description: "卤代烃、醇、酚、醛、羧酸与酯",
        content: `
            <div class="doc-section">
                <h2>卤代烃</h2>
                <h3>溴乙烷（C₂H₅Br）的性质</h3>
                <h4>取代反应（水解反应）</h4>
                <div class="reaction-card">
                    C₂H₅Br + NaOH → C₂H₅OH + NaBr（水溶液，加热）
                </div>
                <h4>消去反应</h4>
                <div class="reaction-card">
                    C₂H₅Br + NaOH → CH₂=CH₂↑ + NaBr + H₂O（乙醇溶液，加热）
                </div>
                <div class="warning-note">
                    消去反应条件：卤代烃中连卤素的碳原子邻位碳上有氢原子；NaOH的醇溶液、加热。
                </div>
            </div>
            <div class="doc-section">
                <h2>醇</h2>
                <h3>乙醇（C₂H₅OH）的性质</h3>
                <h4>与钠反应</h4>
                <div class="reaction-card">
                    2C₂H₅OH + 2Na → 2C₂H₅ONa + H₂↑<br>
                    （乙醇羟基氢活泼性弱于水）
                </div>
                <h4>氧化反应</h4>
                <div class="reaction-card">
                    燃烧：C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O<br>
                    催化氧化：2C₂H₅OH + O₂ → 2CH₃CHO + 2H₂O（Cu或Ag催化，加热）
                </div>
                <h4>消去反应</h4>
                <div class="reaction-card">
                    C₂H₅OH → CH₂=CH₂↑ + H₂O（浓H₂SO₄，170℃）
                </div>
                <h4>酯化反应</h4>
                <div class="reaction-card">
                    C₂H₅OH + CH₃COOH ⇌ CH₃COOC₂H₅ + H₂O（浓H₂SO₄催化，加热）
                </div>
            </div>
            <div class="doc-section">
                <h2>酚</h2>
                <h3>苯酚（C₆H₅OH）的性质</h3>
                <h4>弱酸性（酸性：H₂CO₃ > 苯酚 > HCO₃⁻）</h4>
                <div class="reaction-card">
                    C₆H₅OH + NaOH → C₆H₅ONa + H₂O<br>
                    C₆H₅ONa + CO₂ + H₂O → C₆H₅OH↓ + NaHCO₃（不能生成Na₂CO₃）
                </div>
                <h4>取代反应</h4>
                <div class="reaction-card">
                    C₆H₅OH + 3Br₂ → C₆H₂Br₃OH↓（白色，三溴苯酚）+ 3HBr<br>
                    （苯酚与浓溴水反应，可用于定性检验和定量测定）
                </div>
                <h4>显色反应</h4>
                <div class="reaction-card">
                    苯酚 + FeCl₃ → 紫色溶液（用于检验苯酚）
                </div>
                <h4>氧化反应</h4>
                <p>苯酚在空气中易被氧化而显粉红色。</p>
            </div>
            <div class="doc-section">
                <h2>醛</h2>
                <h3>乙醛（CH₃CHO）的性质</h3>
                <h4>氧化反应</h4>
                <div class="reaction-card">
                    银镜反应：CH₃CHO + 2Ag(NH₃)₂OH → CH₃COONH₄ + 2Ag↓ + 3NH₃ + H₂O（水浴加热）<br>
                    与新制Cu(OH)₂：CH₃CHO + 2Cu(OH)₂ + NaOH → CH₃COONa + Cu₂O↓（砖红）+ 3H₂O（加热煮沸）<br>
                    催化氧化：2CH₃CHO + O₂ → 2CH₃COOH（催化剂，加热）
                </div>
                <h4>还原反应（加成反应）</h4>
                <div class="reaction-card">
                    CH₃CHO + H₂ → CH₃CH₂OH（Ni催化，加热）
                </div>
            </div>
            <div class="doc-section">
                <h2>羧酸</h2>
                <h3>乙酸（CH₃COOH）的性质</h3>
                <h4>酸的通性（弱酸）</h4>
                <div class="reaction-card">
                    2CH₃COOH + Na₂CO₃ → 2CH₃COONa + H₂O + CO₂↑<br>
                    CH₃COOH + NaOH → CH₃COONa + H₂O
                </div>
                <h4>酯化反应</h4>
                <div class="reaction-card">
                    CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O<br>
                    （可逆反应，浓H₂SO₄作催化剂和吸水剂）
                </div>
            </div>
            <div class="doc-section">
                <h2>酯</h2>
                <h3>乙酸乙酯（CH₃COOC₂H₅）的性质</h3>
                <h4>水解反应</h4>
                <div class="reaction-card">
                    酸性条件：CH₃COOC₂H₅ + H₂O ⇌ CH₃COOH + C₂H₅OH（可逆，稀H₂SO₄催化）<br>
                    碱性条件：CH₃COOC₂H₅ + NaOH → CH₃COONa + C₂H₅OH（完全）
                </div>
                <div class="success-note">
                    酯在碱性条件下的水解又称为皂化反应，是完全反应。
                </div>
            </div>
            <div class="doc-section">
                <h2>重要官能团性质总结</h2>
                <table>
                    <tr><th>官能团</th><th>结构</th><th>特征反应</th></tr>
                    <tr><td>碳碳双键</td><td>C=C</td><td>加成、氧化、加聚</td></tr>
                    <tr><td>碳碳三键</td><td>C≡C</td><td>加成、氧化</td></tr>
                    <tr><td>卤原子</td><td>-X</td><td>水解、消去</td></tr>
                    <tr><td>羟基</td><td>-OH</td><td>取代、消去、氧化、酯化</td></tr>
                    <tr><td>醛基</td><td>-CHO</td><td>氧化（银镜、斐林）、还原</td></tr>
                    <tr><td>羧基</td><td>-COOH</td><td>酸性、酯化</td></tr>
                    <tr><td>酯基</td><td>-COOR</td><td>水解</td></tr>
                </table>
            </div>
        `
    },
    biomacromolecule: {
        title: "生物大分子",
        description: "糖类、油脂与蛋白质",
        content: `
            <div class="doc-section">
                <h2>糖类</h2>
                <p>多羟基醛或多羟基酮及能水解生成它们的物质。</p>
                <table>
                    <tr><th>类别</th><th>特点</th><th>代表物</th><th>分子式</th></tr>
                    <tr><td>单糖</td><td>不能水解</td><td>葡萄糖、果糖</td><td>C₆H₁₂O₆</td></tr>
                    <tr><td>二糖</td><td>水解生成2分子单糖</td><td>蔗糖、麦芽糖</td><td>C₁₂H₂₂O₁₁</td></tr>
                    <tr><td>多糖</td><td>水解生成多个单糖</td><td>淀粉、纤维素</td><td>(C₆H₁₀O₅)n</td></tr>
                </table>
                <h3>葡萄糖的性质</h3>
                <div class="reaction-card">
                    结构：CH₂OH(CHOH)₄CHO（多羟基醛）<br>
                    银镜反应：CH₂OH(CHOH)₄CHO + 2Ag(NH₃)₂OH → CH₂OH(CHOH)₄COONH₄ + 2Ag↓ + 3NH₃ + H₂O<br>
                    与新制Cu(OH)₂反应：加热生成砖红色Cu₂O沉淀<br>
                    发酵：C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂（酒化酶）
                </div>
                <h3>淀粉与纤维素的性质</h3>
                <ul>
                    <li>无还原性，不能发生银镜反应</li>
                    <li>水解最终产物都是葡萄糖</li>
                    <li>淀粉遇碘变蓝（检验淀粉或碘）</li>
                </ul>
            </div>
            <div class="doc-section">
                <h2>油脂</h2>
                <p>高级脂肪酸与甘油形成的酯，属于酯类。</p>
                <h3>油脂的结构</h3>
                <div class="reaction-card">
                    油脂（甘油三酯）：<br>
                    CH₂-O-CO-R₁<br>
                    CH-O-CO-R₂<br>
                    CH₂-O-CO-R₃<br>
                    R₁、R₂、R₃为高级脂肪酸的烃基
                </div>
                <h3>油脂的化学性质</h3>
                <h4>水解反应</h4>
                <div class="reaction-card">
                    酸性条件：油脂 + 3H₂O → 3高级脂肪酸 + 甘油<br>
                    碱性条件（皂化反应）：油脂 + 3NaOH → 3高级脂肪酸钠 + 甘油
                </div>
                <h4>氢化反应（油脂的硬化）</h4>
                <div class="reaction-card">
                    不饱和油脂 + H₂ → 饱和油脂（Ni催化，加热）
                </div>
                <table>
                    <tr><th>比较</th><th>油</th><th>脂肪</th></tr>
                    <tr><td>状态</td><td>液态</td><td>固态</td></tr>
                    <tr><td>来源</td><td>植物种子</td><td>动物脂肪</td></tr>
                    <tr><td>结构</td><td>含较多不饱和键</td><td>主要为饱和键</td></tr>
                </table>
            </div>
            <div class="doc-section">
                <h2>蛋白质</h2>
                <p>由氨基酸通过肽键连接形成的高分子化合物。</p>
                <h3>氨基酸</h3>
                <div class="reaction-card">
                    通式：NH₂-CHR-COOH（同时含氨基和羧基）<br>
                    两性：既能与酸反应，又能与碱反应
                </div>
                <h3>蛋白质的性质</h3>
                <h4>两性</h4>
                <p>蛋白质分子含氨基（碱性）和羧基（酸性），具有两性。</p>
                <h4>水解</h4>
                <p>蛋白质 →(酸/碱/酶) 多肽 → 氨基酸</p>
                <h4>盐析</h4>
                <p>加入浓的轻金属盐（如Na₂SO₄、(NH₄)₂SO₄）使蛋白质析出，可逆，用于分离提纯蛋白质。</p>
                <h4>变性</h4>
                <p>加热、紫外线、强酸、强碱、重金属盐、有机溶剂、甲醛等使蛋白质失去生理活性，不可逆。</p>
                <h4>颜色反应</h4>
                <div class="reaction-card">
                    蛋白质 + 浓HNO₃ → 黄色（含苯环的蛋白质）<br>
                    蛋白质灼烧：有烧焦羽毛气味（检验蛋白质）
                </div>
            </div>
        `
    },
    polymer: {
        title: "合成高分子",
        description: "加聚反应与缩聚反应",
        content: `
            <div class="doc-section">
                <h2>高分子化合物</h2>
                <p>相对分子质量很大（通常在10⁴以上）的化合物，由小分子（单体）通过聚合反应形成。</p>
                <h3>基本概念</h3>
                <table>
                    <tr><th>概念</th><th>定义</th><th>实例</th></tr>
                    <tr><td>单体</td><td>能合成高分子的小分子化合物</td><td>乙烯、氯乙烯</td></tr>
                    <tr><td>链节</td><td>高分子中重复的结构单元</td><td>-CH₂-CH₂-</td></tr>
                    <tr><td>聚合度</td><td>高分子中含有链节的数目</td><td>n</td></tr>
                </table>
                <div class="formula-box">
                    高分子化合物 = n × 链节
                </div>
            </div>
            <div class="doc-section">
                <h2>加聚反应</h2>
                <p>不饱和单体通过加成反应聚合成高分子的反应，无小分子生成。</p>
                <h3>常见加聚反应</h3>
                <div class="reaction-card">
                    聚乙烯：nCH₂=CH₂ → [CH₂-CH₂]n<br>
                    聚氯乙烯：nCH₂=CHCl → [CH₂-CHCl]n<br>
                    聚丙烯：nCH₂=CHCH₃ → [CH₂-CH(CH₃)]n<br>
                    聚苯乙烯：nCH₂=CHC₆H₅ → [CH₂-CH(C₆H₅)]n<br>
                    有机玻璃：nCH₂=C(CH₃)COOCH₃ → [CH₂-C(CH₃)(COOCH₃)]n
                </div>
                <h3>单体的判断</h3>
                <div class="code-block">
                    <pre>"无双键，两碳一切；有双键，四碳一切"
加聚产物找单体：从一端开始，每两个碳断开，单键改双键、双键改单键</pre>
                </div>
            </div>
            <div class="doc-section">
                <h2>缩聚反应</h2>
                <p>单体间通过缩合反应生成高分子，同时生成小分子（如H₂O、HCl等）。</p>
                <h3>常见缩聚反应</h3>
                <h4>聚酯类</h4>
                <div class="reaction-card">
                    对苯二甲酸与乙二醇：<br>
                    nHOOC-C₆H₄-COOH + nHO-CH₂-CH₂-OH →<br>
                    [CO-C₆H₄-CO-O-CH₂-CH₂-O]n + 2nH₂O（涤纶）
                </div>
                <h4>聚酰胺类</h4>
                <div class="reaction-card">
                    己二酸与己二胺：<br>
                    nHOOC(CH₂)₄COOH + nH₂N(CH₂)₆NH₂ →<br>
                    [CO(CH₂)₄CONH(CH₂)₆NH]n + 2nH₂O（尼龙-66）
                </div>
                <h4>酚醛树脂</h4>
                <div class="reaction-card">
                    nC₆H₅OH + nHCHO → [C₆H₃OH-CH₂]n + nH₂O（酸或碱催化）
                </div>
            </div>
            <div class="doc-section">
                <h2>常见合成材料</h2>
                <table>
                    <tr><th>材料</th><th>单体</th><th>反应类型</th><th>用途</th></tr>
                    <tr><td>聚乙烯(PE)</td><td>乙烯</td><td>加聚</td><td>薄膜、容器</td></tr>
                    <tr><td>聚氯乙烯(PVC)</td><td>氯乙烯</td><td>加聚</td><td>管道、电线外皮</td></tr>
                    <tr><td>聚苯乙烯(PS)</td><td>苯乙烯</td><td>加聚</td><td>泡沫塑料</td></tr>
                    <tr><td>酚醛树脂</td><td>苯酚、甲醛</td><td>缩聚</td><td>电木</td></tr>
                    <tr><td>涤纶(聚酯纤维)</td><td>对苯二甲酸、乙二醇</td><td>缩聚</td><td>服装、绳索</td></tr>
                    <tr><td>尼龙(聚酰胺)</td><td>己二酸、己二胺</td><td>缩聚</td><td>纤维、工程塑料</td></tr>
                </table>
            </div>
        `
    }
};
