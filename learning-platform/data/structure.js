// 物质结构
const structureData = {
    "atomic-structure": {
        title: "原子结构与元素周期表",
        description: "原子核外电子排布与元素周期律基础",
        content: `
            <div class="doc-section">
                <h2>原子的构成</h2>
                <div class="formula-box">
                    原子: 原子核(质子 + 中子) + 核外电子
                </div>
                <table>
                    <tr><th>粒子</th><th>质量/kg</th><th>相对质量</th><th>电荷</th><th>作用</th></tr>
                    <tr><td>质子</td><td>1.673×10⁻²⁷</td><td>≈1</td><td>+1</td><td>决定元素种类</td></tr>
                    <tr><td>中子</td><td>1.675×10⁻²⁷</td><td>≈1</td><td>0</td><td>决定核素种类</td></tr>
                    <tr><td>电子</td><td>9.109×10⁻³¹</td><td>1/1836</td><td>-1</td><td>决定化学性质</td></tr>
                </table>
                <h3>等量关系</h3>
                <ul>
                    <li>质子数 = 核电荷数 = 核外电子数 = 原子序数</li>
                    <li>质量数(A) = 质子数(Z) + 中子数(N)</li>
                </ul>
                <div class="code-block">
                    <pre>核素符号：ᵃX 或 ᴬZX（A质量数，Z质子数）
例：¹⁶₈O 表示氧元素，质量数16，质子数8，中子数8</pre>
                </div>
            </div>
            <div class="doc-section">
                <h2>核外电子排布</h2>
                <h3>电子层（能层）</h3>
                <table>
                    <tr><th>电子层</th><th>K</th><th>L</th><th>M</th><th>N</th><th>O</th><th>P</th></tr>
                    <tr><td>n（层数）</td><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td></tr>
                    <tr><td>最多容纳电子</td><td>2</td><td>8</td><td>18</td><td>32</td><td>50</td><td>72</td></tr>
                </table>
                <p>每层最多容纳 2n² 个电子；最外层不超过 8 个（K层不超过 2 个）；次外层不超过 18 个。</p>
                <h3>短周期元素原子结构特点</h3>
                <table>
                    <tr><th>族</th><th>最外层电子数</th><th>得失电子</th><th>金属/非金属</th></tr>
                    <tr><td>IA、IIA</td><td>1~2</td><td>易失去</td><td>金属</td></tr>
                    <tr><td>IIIA~VIIA</td><td>3~7</td><td>易得到（或失去）</td><td>多数非金属</td></tr>
                    <tr><td>0族</td><td>8（He为2）</td><td>稳定</td><td>稀有气体</td></tr>
                </table>
            </div>
            <div class="doc-section">
                <h2>元素周期表</h2>
                <h3>周期表结构</h3>
                <ul>
                    <li>7个周期（横行）：3个短周期、4个长周期</li>
                    <li>18个纵列，16个族</li>
                    <li>主族（IA~VIIA）、副族（IB~VIIB）、VIII族（8~10列）、0族</li>
                </ul>
                <h3>分区</h3>
                <table>
                    <tr><th>区</th><th>价电子构型</th><th>元素</th></tr>
                    <tr><td>s区</td><td>ns¹⁻²</td><td>IA、IIA族</td></tr>
                    <tr><td>p区</td><td>ns²np¹⁻⁶</td><td>IIIA~VIIA、0族</td></tr>
                    <tr><td>d区</td><td>(n-1)d¹⁻⁹ns¹⁻²</td><td>IIIB~VIIB、VIII族</td></tr>
                    <tr><td>ds区</td><td>(n-1)d¹⁰ns¹⁻²</td><td>IB、IIB族</td></tr>
                </table>
            </div>
        `
    },
    "periodic-law": {
        title: "元素周期律",
        description: "元素性质随原子序数递增的周期性变化",
        content: `
            <div class="doc-section">
                <h2>元素周期律</h2>
                <p>元素的性质随着原子序数的递增而呈周期性变化的规律。</p>
                <h3>实质</h3>
                <p>元素原子核外电子排布的周期性变化，决定了元素性质的周期性变化。</p>
                <h3>同周期元素性质递变（从左到右）</h3>
                <table>
                    <tr><th>性质</th><th>变化趋势</th><th>原因</th></tr>
                    <tr><td>原子半径</td><td>逐渐减小</td><td>核电荷数增加，电子层数相同</td></tr>
                    <tr><td>金属性</td><td>逐渐减弱</td><td>失电子能力减弱</td></tr>
                    <tr><td>非金属性</td><td>逐渐增强</td><td>得电子能力增强</td></tr>
                    <tr><td>最高价氧化物对应水化物</td><td>碱性减弱，酸性增强</td><td>金属性减弱，非金属性增强</td></tr>
                    <tr><td>气态氢化物稳定性</td><td>逐渐增强</td><td>非金属性增强</td></tr>
                </table>
                <h3>同主族元素性质递变（从上到下）</h3>
                <table>
                    <tr><th>性质</th><th>变化趋势</th><th>原因</th></tr>
                    <tr><td>原子半径</td><td>逐渐增大</td><td>电子层数增加</td></tr>
                    <tr><td>金属性</td><td>逐渐增强</td><td>失电子能力增强</td></tr>
                    <tr><td>非金属性</td><td>逐渐减弱</td><td>得电子能力减弱</td></tr>
                    <tr><td>最高价氧化物对应水化物</td><td>碱性增强，酸性减弱</td><td>金属性增强，非金属性减弱</td></tr>
                    <tr><td>气态氢化物稳定性</td><td>逐渐减弱</td><td>非金属性减弱</td></tr>
                </table>
            </div>
            <div class="doc-section">
                <h2>金属性与非金属性判断依据</h2>
                <h3>金属性强弱判断</h3>
                <ul>
                    <li>单质与水或酸反应置换出氢气的难易程度（越易越强）</li>
                    <li>最高价氧化物对应水化物的碱性强弱（越强金属性越强）</li>
                    <li>金属活动性顺序</li>
                    <li>单质还原性强弱或阳离子氧化性强弱</li>
                    <li>置换反应：金属性强的置换金属性弱的</li>
                </ul>
                <h3>非金属性强弱判断</h3>
                <ul>
                    <li>单质与氢气反应生成气态氢化物的难易（越易越强）</li>
                    <li>气态氢化物的稳定性（越稳定越强）</li>
                    <li>最高价氧化物对应水化物的酸性强弱（越强非金属性越强）</li>
                    <li>单质氧化性强弱或阴离子还原性强弱</li>
                    <li>置换反应：非金属性强的置换非金属性弱的</li>
                </ul>
            </div>
            <div class="doc-section">
                <h2>微粒半径比较</h2>
                <div class="code-block">
                    <pre>三看法则：
1. 看电子层数：电子层数越多，半径越大
2. 看核电荷数：电子层相同，核电荷数越大，半径越小
3. 看电子数：核电荷数相同，电子数越多，半径越大

例：r(Na) > r(Mg) > r(Al)；r(Na⁺) < r(Ne) < r(F⁻) < r(O²⁻)</pre>
                </div>
            </div>
        `
    },
    "chemical-bond": {
        title: "化学键",
        description: "离子键、共价键与金属键",
        content: `
            <div class="doc-section">
                <h2>化学键类型</h2>
                <table>
                    <tr><th>键型</th><th>成键本质</th><th>成键微粒</th><th>存在</th><th>实例</th></tr>
                    <tr><td>离子键</td><td>静电作用</td><td>阴、阳离子</td><td>离子化合物</td><td>NaCl、CaO</td></tr>
                    <tr><td>共价键</td><td>共用电子对</td><td>原子</td><td>共价化合物、非金属单质</td><td>H₂O、CO₂</td></tr>
                    <tr><td>金属键</td><td>自由电子与金属阳离子</td><td>金属阳离子与电子</td><td>金属单质、合金</td><td>Fe、Cu</td></tr>
                </table>
            </div>
            <div class="doc-section">
                <h2>离子键</h2>
                <p>阴、阳离子间通过静电作用形成的化学键。</p>
                <h3>形成条件</h3>
                <ul>
                    <li>活泼金属（IA、IIA族）与活泼非金属（VIA、VIIA族）之间</li>
                    <li>铵根离子与阴离子之间</li>
                </ul>
                <h3>离子化合物</h3>
                <p>含有离子键的化合物，包括：</p>
                <ul>
                    <li>大多数盐（包括铵盐）</li>
                    <li>强碱：NaOH、KOH、Ba(OH)₂等</li>
                    <li>活泼金属氧化物：Na₂O、CaO、MgO等</li>
                </ul>
                <div class="demo-note">
                    离子化合物中一定含离子键，可能含共价键（如NaOH中的O-H键、Na₂O₂中的O-O键）。
                </div>
            </div>
            <div class="doc-section">
                <h2>共价键</h2>
                <p>原子间通过共用电子对形成的化学键。</p>
                <h3>共价键分类</h3>
                <table>
                    <tr><th>分类</th><th>定义</th><th>实例</th></tr>
                    <tr><td>极性键</td><td>不同种原子间，电子对偏向电负性大的原子</td><td>H-Cl、C-O、O-H</td></tr>
                    <tr><td>非极性键</td><td>同种原子间，电子对不偏移</td><td>H-H、Cl-Cl、C-C</td></tr>
                    <tr><td>σ键</td><td>头碰头重叠，轴对称</td><td>单键、双键中的一个键</td></tr>
                    <tr><td>π键</td><td>肩并肩重叠，镜面对称</td><td>双键、三键中的键</td></tr>
                </table>
                <h3>共价化合物</h3>
                <p>只含共价键的化合物，包括：</p>
                <ul>
                    <li>非金属氢化物：HCl、H₂O、NH₃等</li>
                    <li>非金属氧化物：CO₂、SO₂、NO₂等</li>
                    <li>含氧酸：H₂SO₄、HNO₃、HClO等</li>
                    <li>大多数有机物</li>
                </ul>
                <div class="warning-note">
                    共价化合物中只含共价键，不含离子键。含共价键的物质不一定是共价化合物（如NaOH、Na₂O₂、单质）。
                </div>
            </div>
            <div class="doc-section">
                <h2>化学键与化合物类型判断</h2>
                <table>
                    <tr><th>物质类型</th><th>所含化学键</th><th>熔融是否导电</th></tr>
                    <tr><td>离子化合物</td><td>一定有离子键，可能有共价键</td><td>导电</td></tr>
                    <tr><td>共价化合物</td><td>只有共价键</td><td>不导电</td></tr>
                    <tr><td>非金属单质</td><td>只有共价键（稀有气体无键）</td><td>不导电</td></tr>
                    <tr><td>金属单质</td><td>金属键</td><td>导电</td></tr>
                </table>
            </div>
        `
    },
    "molecular-structure": {
        title: "分子结构与性质",
        description: "VSEPR理论与分子性质的关系",
        content: `
            <div class="doc-section">
                <h2>分子的立体构型</h2>
                <h3>VSEPR理论（价层电子对互斥理论）</h3>
                <p>中心原子周围的价层电子对（成键电子对 + 孤电子对）相互排斥，趋向于尽可能远离，从而决定分子的空间构型。</p>
                <div class="formula-box">
                    价层电子对数 = σ键数 + 孤电子对数<br>
                    孤电子对数 = (a - xb) / 2<br>
                    a：中心原子价电子数；b：配位原子最多能接受的电子数；x：配位原子数
                </div>
                <h3>常见分子的立体构型</h3>
                <table>
                    <tr><th>价层电子对数</th><th>孤电子对数</th><th>VSEPR模型</th><th>分子构型</th><th>实例</th><th>键角</th></tr>
                    <tr><td>2</td><td>0</td><td>直线形</td><td>直线形</td><td>CO₂、BeCl₂</td><td>180°</td></tr>
                    <tr><td>3</td><td>0</td><td>平面三角形</td><td>平面三角形</td><td>BF₃、SO₃</td><td>120°</td></tr>
                    <tr><td>3</td><td>1</td><td>平面三角形</td><td>V形（角形）</td><td>SO₂</td><td>≈120°</td></tr>
                    <tr><td>4</td><td>0</td><td>正四面体</td><td>正四面体</td><td>CH₄、CCl₄</td><td>109°28′</td></tr>
                    <tr><td>4</td><td>1</td><td>正四面体</td><td>三角锥形</td><td>NH₃</td><td>107°</td></tr>
                    <tr><td>4</td><td>2</td><td>正四面体</td><td>V形（角形）</td><td>H₂O</td><td>104.5°</td></tr>
                </table>
            </div>
            <div class="doc-section">
                <h2>分子的极性</h2>
                <h3>极性分子与非极性分子</h3>
                <table>
                    <tr><th>类型</th><th>定义</th><th>判断方法</th><th>实例</th></tr>
                    <tr><td>非极性分子</td><td>正、负电荷中心重合</td><td>结构对称</td><td>CO₂、CH₄、BF₃</td></tr>
                    <tr><td>极性分子</td><td>正、负电荷中心不重合</td><td>结构不对称</td><td>H₂O、NH₃、HCl</td></tr>
                </table>
                <div class="code-block">
                    <pre>判断规律：
1. 只含非极性键的分子一定是非极性分子（如O₂、N₂）
2. 含极性键的分子：结构对称→非极性分子；结构不对称→极性分子
3. AB型分子：极性分子；AB₂型：直线形非极性，V形极性；AB₃型：平面三角形非极性，三角锥形极性；AB₄型：正四面体非极性</pre>
                </div>
            </div>
            <div class="doc-section">
                <h2>分子间作用力与氢键</h2>
                <h3>范德华力</h3>
                <p>分子间普遍存在的作用力，包括色散力、诱导力、取向力。影响物质熔沸点：组成和结构相似的分子，相对分子质量越大，范德华力越强，熔沸点越高。</p>
                <h3>氢键</h3>
                <p>已经与电负性很大的原子（N、O、F）形成共价键的氢原子，与另一个电负性很大的原子之间的作用力。</p>
                <ul>
                    <li>表示：X—H···Y（X、Y为N、O、F）</li>
                    <li>特点：比范德华力强，比化学键弱</li>
                    <li>存在：H₂O、NH₃、HF、醇、羧酸、蛋白质、DNA等</li>
                </ul>
                <h3>氢键对物质性质的影响</h3>
                <ul>
                    <li>熔沸点：分子间氢键使熔沸点升高（如H₂O > H₂S）</li>
                    <li>溶解性：能与水形成氢键的物质易溶于水</li>
                    <li>密度：冰的密度比水小（氢键使水分子形成疏松结构）</li>
                </ul>
            </div>
        `
    },
    crystal: {
        title: "晶体结构与性质",
        description: "四大晶体类型的结构与性质",
        content: `
            <div class="doc-section">
                <h2>晶体与非晶体</h2>
                <table>
                    <tr><th>比较</th><th>晶体</th><th>非晶体</th></tr>
                    <tr><td>微观结构</td><td>微粒呈周期性有序排列</td><td>微粒排列无序</td></tr>
                    <tr><td>自范性</td><td>有（能自发形成多面体外形）</td><td>无</td></tr>
                    <tr><td>熔点</td><td>固定熔点</td><td>无固定熔点（软化温度范围）</td></tr>
                    <tr><td>各向异性</td><td>有</td><td>无</td></tr>
                    <tr><td>X-射线衍射</td><td>有明锐的衍射峰</td><td>无或弥散</td></tr>
                </table>
            </div>
            <div class="doc-section">
                <h2>四大晶体类型</h2>
                <table>
                    <tr><th>晶体类型</th><th>构成微粒</th><th>微粒间作用力</th><th>熔沸点</th><th>硬度</th><th>导电性</th><th>实例</th></tr>
                    <tr><td>离子晶体</td><td>阴、阳离子</td><td>离子键</td><td>较高</td><td>较大</td><td>熔融或溶于水导电</td><td>NaCl、CaO</td></tr>
                    <tr><td>原子晶体</td><td>原子</td><td>共价键</td><td>很高</td><td>很大</td><td>一般不导电</td><td>金刚石、SiO₂、SiC</td></tr>
                    <tr><td>分子晶体</td><td>分子</td><td>范德华力、氢键</td><td>较低</td><td>较小</td><td>不导电</td><td>CO₂、H₂O、I₂</td></tr>
                    <tr><td>金属晶体</td><td>金属阳离子+自由电子</td><td>金属键</td><td>一般较高</td><td>一般较大</td><td>良好导电性</td><td>Fe、Cu、合金</td></tr>
                </table>
            </div>
            <div class="doc-section">
                <h2>典型晶体结构</h2>
                <h3>NaCl晶体</h3>
                <ul>
                    <li>每个Na⁺周围有6个Cl⁻，每个Cl⁻周围有6个Na⁺（配位数6:6）</li>
                    <li>晶胞中含4个Na⁺和4个Cl⁻</li>
                </ul>
                <h3>CsCl晶体</h3>
                <ul>
                    <li>每个Cs⁺周围有8个Cl⁻，每个Cl⁻周围有8个Cs⁺（配位数8:8）</li>
                    <li>晶胞中含1个Cs⁺和1个Cl⁻</li>
                </ul>
                <h3>金刚石</h3>
                <ul>
                    <li>每个C原子与4个C原子以共价键相连，形成正四面体结构</li>
                    <li>最小环为6元环</li>
                    <li>1 mol金刚石含2 mol C-C键</li>
                </ul>
                <h3>二氧化硅（SiO₂）</h3>
                <ul>
                    <li>每个Si原子与4个O原子相连，每个O原子与2个Si原子相连</li>
                    <li>化学式SiO₂表示Si与O的原子个数比为1:2</li>
                    <li>1 mol SiO₂含4 mol Si-O键</li>
                </ul>
                <h3>干冰（CO₂）</h3>
                <ul>
                    <li>面心立方结构，分子间以范德华力结合</li>
                    <li>每个CO₂分子周围有12个紧邻的CO₂分子</li>
                </ul>
            </div>
        `
    }
};
