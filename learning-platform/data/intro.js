// 化学基本概念
const introData = {
    intro: {
        title: "化学研究对象与方法",
        description: "化学是在原子、分子层次上研究物质的组成、结构、性质及变化规律的科学",
        content: `
            <div class="doc-section">
                <h2>化学的研究对象</h2>
                <p>化学是研究物质的科学，包括物质的存在、组成、结构、性质及其变化规律。</p>
                <h3>物质的分类</h3>
                <table>
                    <tr><th>分类依据</th><th>类别</th><th>定义</th></tr>
                    <tr><td>组成</td><td>纯净物</td><td>由一种物质组成，有固定的组成和性质</td></tr>
                    <tr><td>组成</td><td>混合物</td><td>由两种或两种以上物质混合而成</td></tr>
                    <tr><td>元素组成</td><td>单质</td><td>由同种元素组成的纯净物</td></tr>
                    <tr><td>元素组成</td><td>化合物</td><td>由不同种元素组成的纯净物</td></tr>
                </table>
                <h3>物理变化与化学变化</h3>
                <table>
                    <tr><th>比较</th><th>物理变化</th><th>化学变化</th></tr>
                    <tr><td>本质区别</td><td>无新物质生成</td><td>有新物质生成</td></tr>
                    <tr><td>微观实质</td><td>分子间距离或排列方式改变</td><td>分子破裂，原子重新组合</td></tr>
                    <tr><td>实例</td><td>熔化、蒸发、凝固</td><td>燃烧、分解、化合</td></tr>
                </table>
                <div class="warning-note">
                    判断化学变化的根本依据是有无新物质生成，不能仅根据现象（如发光、放热）判断。
                </div>
            </div>
            <div class="doc-section">
                <h2>化学用语</h2>
                <h3>元素符号与化学式</h3>
                <div class="code-block">
                    <pre>元素符号：H(氢) O(氧) C(碳) N(氮) Na(钠) Fe(铁)
化学式：H₂O(水) CO₂(二氧化碳) NaCl(氯化钠)</pre>
                </div>
                <h3>化学方程式</h3>
                <p>用化学式表示化学反应的式子，遵循质量守恒定律。</p>
                <div class="formula-box">
                    2H₂ + O₂ → 2H₂O
                </div>
                <div class="success-note">
                    书写化学方程式三步骤：写（写出反应物和生成物化学式）、配（配平）、注（注明条件和状态符号）。
                </div>
            </div>
        `
    },
    mole: {
        title: "物质的量",
        description: "联系微观粒子数与宏观质量的桥梁",
        content: `
            <div class="doc-section">
                <h2>物质的量（n）</h2>
                <p>物质的量是表示含有一定数目粒子的集合体，是国际单位制中七个基本物理量之一。</p>
                <div class="formula-box">
                    n = N / Nₐ = m / M
                </div>
                <table>
                    <tr><th>符号</th><th>名称</th><th>单位</th><th>含义</th></tr>
                    <tr><td>n</td><td>物质的量</td><td>mol（摩尔）</td><td>含有粒子的集合体数量</td></tr>
                    <tr><td>N</td><td>粒子数</td><td>个</td><td>微观粒子的实际个数</td></tr>
                    <tr><td>Nₐ</td><td>阿伏加德罗常数</td><td>mol⁻¹</td><td>约 6.02 × 10²³ mol⁻¹</td></tr>
                    <tr><td>m</td><td>质量</td><td>g</td><td>物质的质量</td></tr>
                    <tr><td>M</td><td>摩尔质量</td><td>g/mol</td><td>单位物质的量的质量</td></tr>
                </table>
                <div class="demo-note">
                    1 mol 任何粒子所含的粒子数均为 Nₐ 个。1 mol ¹²C 的质量为 12 g。
                </div>
            </div>
            <div class="doc-section">
                <h2>阿伏加德罗常数（Nₐ）</h2>
                <p>Nₐ ≈ 6.02 × 10²³ mol⁻¹，是一个精确值，实验测得约为 6.02214076 × 10²³。</p>
                <h3>常见考点与陷阱</h3>
                <ul>
                    <li><strong>状况陷阱：</strong>22.4 L/mol 仅适用于标准状况（0℃，101 kPa）的气体</li>
                    <li><strong>状态陷阱：</strong>标准状况下 H₂O、SO₃、CCl₄ 等为液态或固态</li>
                    <li><strong>可逆反应：</strong>如 2NO₂ ⇌ N₂O₄，无法计算具体粒子数</li>
                    <li><strong>水解与电离：</strong>弱电解质部分电离，盐类发生水解</li>
                    <li><strong>化学键：</strong>P₄ 含 6 个 P-P 键，金刚石含 2 mol C-C 键/mol C</li>
                </ul>
            </div>
        `
    },
    gas: {
        title: "气体摩尔体积",
        description: "标准状况下气体的体积与物质的量关系",
        content: `
            <div class="doc-section">
                <h2>气体摩尔体积（Vₘ）</h2>
                <p>单位物质的量的气体所占的体积称为气体摩尔体积。</p>
                <div class="formula-box">
                    Vₘ = V / n
                </div>
                <p>标准状况（STP）：0℃（273.15 K），101 kPa（1 标准大气压）</p>
                <div class="code-block">
                    <pre>标准状况下：Vₘ ≈ 22.4 L/mol
公式：V = n × 22.4 L/mol（仅限标准状况气体）</pre>
                </div>
                <div class="warning-note">
                    注意：常温常压（25℃，101 kPa）下 Vₘ ≈ 24.5 L/mol，不是 22.4 L/mol！
                </div>
            </div>
            <div class="doc-section">
                <h2>阿伏加德罗定律</h2>
                <p>同温同压下，相同体积的任何气体含有相同数目的分子。</p>
                <h3>推论（理想气体状态方程：PV = nRT）</h3>
                <table>
                    <tr><th>条件</th><th>结论</th></tr>
                    <tr><td>同温同压</td><td>气体体积之比 = 物质的量之比</td></tr>
                    <tr><td>同温同容</td><td>气体压强之比 = 物质的量之比</td></tr>
                    <tr><td>同温同压</td><td>气体密度之比 = 摩尔质量之比</td></tr>
                </table>
            </div>
        `
    },
    solution: {
        title: "物质的量浓度",
        description: "溶液中溶质的物质的量与溶液体积的比值",
        content: `
            <div class="doc-section">
                <h2>物质的量浓度（c）</h2>
                <p>单位体积溶液里所含溶质 B 的物质的量。</p>
                <div class="formula-box">
                    c(B) = n(B) / V（单位：mol/L）
                </div>
                <h3>计算公式</h3>
                <ul>
                    <li>c = n / V（基本公式）</li>
                    <li>c = 1000ρw / M（已知质量分数和密度）</li>
                    <li>c₁V₁ = c₂V₂（稀释定律）</li>
                </ul>
                <div class="code-block">
                    <pre>已知：98% 浓硫酸，密度 1.84 g/cm³，求物质的量浓度
c = 1000 × 1.84 × 98% / 98 = 18.4 mol/L</pre>
                </div>
            </div>
            <div class="doc-section">
                <h2>一定物质的量浓度溶液的配制</h2>
                <h3>所需仪器</h3>
                <p>容量瓶（100 mL、250 mL、500 mL、1000 mL）、烧杯、玻璃棒、胶头滴管、托盘天平（或量筒）</p>
                <h3>操作步骤</h3>
                <ol>
                    <li><strong>计算：</strong>计算所需溶质的质量或浓溶液的体积</li>
                    <li><strong>称量/量取：</strong>用天平称量固体或量筒量取液体</li>
                    <li><strong>溶解/稀释：</strong>在烧杯中进行，用玻璃棒搅拌</li>
                    <li><strong>冷却：</strong>恢复至室温（放热或吸热过程需冷却）</li>
                    <li><strong>转移：</strong>沿玻璃棒注入容量瓶</li>
                    <li><strong>洗涤：</strong>洗涤烧杯和玻璃棒 2-3 次，洗液一并转移</li>
                    <li><strong>定容：</strong>加水至距刻度线 1-2 cm 处，改用胶头滴管滴加</li>
                    <li><strong>摇匀：</strong>盖塞反复颠倒摇匀</li>
                </ol>
                <div class="warning-note">
                    容量瓶使用注意：不能溶解固体、不能稀释浓溶液、不能长期储存溶液、不能加热。
                </div>
            </div>
        `
    },
    colloid: {
        title: "分散系与胶体",
        description: "分散系的分类与胶体的性质",
        content: `
            <div class="doc-section">
                <h2>分散系</h2>
                <p>一种或几种物质分散到另一种物质中形成的混合物。</p>
                <h3>分散系的分类（按分散质粒子大小）</h3>
                <table>
                    <tr><th>分散系</th><th>溶液</th><th>胶体</th><th>浊液（悬浊液/乳浊液）</th></tr>
                    <tr><td>分散质直径</td><td>&lt; 1 nm</td><td>1 ~ 100 nm</td><td>&gt; 100 nm</td></tr>
                    <tr><td>外观</td><td>均一、透明</td><td>均一、较透明</td><td>不均一、不透明</td></tr>
                    <tr><td>稳定性</td><td>稳定</td><td>较稳定</td><td>不稳定，易分层或沉淀</td></tr>
                    <tr><td>能否透过滤纸</td><td>能</td><td>能</td><td>不能（悬浊液）</td></tr>
                    <tr><td>能否透过半透膜</td><td>能</td><td>不能</td><td>不能</td></tr>
                    <tr><td>实例</td><td>NaCl溶液、蔗糖溶液</td><td>Fe(OH)₃胶体、淀粉胶体</td><td>泥水、油水混合物</td></tr>
                </table>
            </div>
            <div class="doc-section">
                <h2>胶体的性质</h2>
                <h3>丁达尔效应</h3>
                <p>当光束通过胶体时，由于胶体粒子对光线的散射，可以看到一条光亮的"通路"。这是区分胶体和溶液的最常用方法。</p>
                <div class="demo-note">
                    丁达尔效应是胶体的特有性质，可用于鉴别胶体和溶液。
                </div>
                <h3>布朗运动</h3>
                <p>胶体粒子在分散剂中做无规则运动，是胶体稳定存在的原因之一。</p>
                <h3>电泳</h3>
                <p>在外加电场作用下，带电的胶体粒子向相反电极移动的现象。说明胶体粒子带有电荷。</p>
                <table>
                    <tr><th>胶体粒子</th><th>所带电荷</th><th>电泳方向</th></tr>
                    <tr><td>金属氧化物、金属氢氧化物（如Fe(OH)₃）</td><td>正电</td><td>向阴极移动</td></tr>
                    <tr><td>金属硫化物、硅酸、土壤胶体</td><td>负电</td><td>向阳极移动</td></tr>
                </table>
                <h3>聚沉</h3>
                <p>使胶体粒子聚集成较大颗粒而沉降的过程。</p>
                <ul>
                    <li>加热：加速胶体粒子运动碰撞</li>
                    <li>加入电解质：中和胶体粒子电荷</li>
                    <li>加入带相反电荷的胶体：电荷中和</li>
                </ul>
            </div>
            <div class="doc-section">
                <h2>胶体的制备与提纯</h2>
                <h3>Fe(OH)₃胶体的制备</h3>
                <div class="reaction-card">
                    FeCl₃ + 3H₂O → Fe(OH)₃(胶体) + 3HCl（煮沸）<br>
                    注意：不能搅拌，不能加热过度（会生成沉淀）
                </div>
                <h3>胶体的提纯——渗析</h3>
                <p>利用半透膜将胶体中的小分子或离子除去。如除去淀粉胶体中的NaCl，可将胶体装入半透膜袋中，浸泡在蒸馏水中。</p>
            </div>
        `
    }
};
