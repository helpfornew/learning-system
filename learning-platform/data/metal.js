// 金属元素
const metalData = {
    sodium: {
        title: "钠及其化合物",
        description: "活泼金属钠的性质、制备与应用",
        content: `
            <div class="doc-section">
                <h2>钠单质的性质</h2>
                <h3>物理性质</h3>
                <ul>
                    <li>银白色金属光泽，质软（可用小刀切割）</li>
                    <li>密度 0.97 g/cm³，比水小</li>
                    <li>熔点 97.8℃，沸点 883℃</li>
                    <li>良好的导电性和导热性</li>
                </ul>
                <h3>化学性质</h3>
                <p>钠是极活泼金属，易失去最外层 1 个电子，表现强还原性。</p>
                <h4>与氧气反应</h4>
                <div class="reaction-card">
                    常温：4Na + O₂ → 2Na₂O（白色固体，氧化钠）<br>
                    加热：2Na + O₂ → Na₂O₂（淡黄色固体，过氧化钠）
                </div>
                <h4>与水反应</h4>
                <div class="reaction-card">
                    2Na + 2H₂O → 2NaOH + H₂↑<br>
                    现象：浮（密度小）、熔（放热）、游（气体推动）、响（H₂燃烧）、红（酚酞变红）
                </div>
                <div class="warning-note">
                    钠着火不能用水或泡沫灭火器扑灭，应用干燥的沙土覆盖。
                </div>
            </div>
            <div class="doc-section">
                <h2>钠的重要化合物</h2>
                <h3>氧化钠（Na₂O）与过氧化钠（Na₂O₂）</h3>
                <table>
                    <tr><th>性质</th><th>Na₂O</th><th>Na₂O₂</th></tr>
                    <tr><td>颜色状态</td><td>白色固体</td><td>淡黄色固体</td></tr>
                    <tr><td>氧元素化合价</td><td>-2</td><td>-1</td></tr>
                    <tr><td>与H₂O反应</td><td>Na₂O + H₂O → 2NaOH</td><td>2Na₂O₂ + 2H₂O → 4NaOH + O₂↑</td></tr>
                    <tr><td>与CO₂反应</td><td>Na₂O + CO₂ → Na₂CO₃</td><td>2Na₂O₂ + 2CO₂ → 2Na₂CO₃ + O₂</td></tr>
                    <tr><td>用途</td><td>制氢氧化钠</td><td>供氧剂、漂白剂</td></tr>
                </table>
                <h3>碳酸钠（Na₂CO₃）与碳酸氢钠（NaHCO₃）</h3>
                <table>
                    <tr><th>性质</th><th>Na₂CO₃（苏打/纯碱）</th><th>NaHCO₃（小苏打）</th></tr>
                    <tr><td>俗名</td><td>纯碱、苏打</td><td>小苏打</td></tr>
                    <tr><td>溶解性</td><td>易溶于水</td><td>可溶于水（溶解度比Na₂CO₃小）</td></tr>
                    <tr><td>热稳定性</td><td>稳定，受热不分解</td><td>受热易分解：2NaHCO₃ → Na₂CO₃ + H₂O + CO₂↑</td></tr>
                    <tr><td>与酸反应</td><td>Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑</td><td>NaHCO₃ + HCl → NaCl + H₂O + CO₂↑（更剧烈）</td></tr>
                    <tr><td>与碱反应</td><td>不反应</td><td>NaHCO₃ + NaOH → Na₂CO₃ + H₂O</td></tr>
                </table>
                <div class="demo-note">
                    鉴别Na₂CO₃与NaHCO₃的方法：加热（NaHCO₃分解产生气体）、加CaCl₂（Na₂CO₃产生沉淀）、逐滴加酸（Na₂CO₃开始无气泡）。
                </div>
            </div>
        `
    },
    iron: {
        title: "铁及其化合物",
        description: "变价金属铁的性质与转化",
        content: `
            <div class="doc-section">
                <h2>铁单质的性质</h2>
                <h3>物理性质</h3>
                <ul>
                    <li>银白色金属光泽，粉末状为黑色</li>
                    <li>密度 7.86 g/cm³，熔点 1535℃</li>
                    <li>具有铁磁性，能被磁铁吸引</li>
                    <li>良好的延展性和导电导热性</li>
                </ul>
                <h3>化学性质</h3>
                <h4>与氧气反应</h4>
                <div class="reaction-card">
                    3Fe + 2O₂ → Fe₃O₄（点燃，火星四射，生成黑色固体）<br>
                    注意：铁丝在纯氧中燃烧生成Fe₃O₄（FeO·Fe₂O₃），不是Fe₂O₃
                </div>
                <h4>与水蒸气反应</h4>
                <div class="reaction-card">
                    3Fe + 4H₂O(g) → Fe₃O₄ + 4H₂（高温条件）
                </div>
                <h4>与酸反应</h4>
                <div class="reaction-card">
                    Fe + 2HCl → FeCl₂ + H₂↑<br>
                    Fe + H₂SO₄(稀) → FeSO₄ + H₂↑<br>
                    注意：铁遇浓硫酸、浓硝酸常温钝化
                </div>
            </div>
            <div class="doc-section">
                <h2>铁三角转化关系</h2>
                <div class="code-block">
                    <pre>          氧化剂（Cl₂、HNO₃、H₂O₂等）
                ↗                        ↘
          Fe²⁺  ←——————————————————→  Fe³⁺
                ↖                        ↙
                  还原剂（Fe、Cu、I⁻等）
                            ↓
                           Fe
                    </pre>
                </div>
                <h3>Fe²⁺ 与 Fe³⁺ 的检验</h3>
                <table>
                    <tr><th>离子</th><th>检验方法</th><th>现象</th></tr>
                    <tr><td>Fe²⁺</td><td>加KSCN溶液，再通Cl₂或加H₂O₂</td><td>先无明显现象，后变血红色</td></tr>
                    <tr><td>Fe²⁺</td><td>加NaOH溶液</td><td>白色沉淀→灰绿色→红褐色</td></tr>
                    <tr><td>Fe³⁺</td><td>加KSCN溶液</td><td>溶液立即变血红色</td></tr>
                    <tr><td>Fe³⁺</td><td>加NaOH溶液</td><td>立即生成红褐色沉淀</td></tr>
                    <tr><td>Fe³⁺</td><td>加苯酚溶液</td><td>溶液变紫色</td></tr>
                </table>
                <div class="reaction-card">
                    Fe³⁺ + 3SCN⁻ → Fe(SCN)₃（血红色，可逆反应）<br>
                    Fe³⁺ + 3OH⁻ → Fe(OH)₃↓（红褐色）<br>
                    Fe²⁺ + 2OH⁻ → Fe(OH)₂↓（白色），4Fe(OH)₂ + O₂ + 2H₂O → 4Fe(OH)₃
                </div>
            </div>
            <div class="doc-section">
                <h2>铁的氧化物与氢氧化物</h2>
                <table>
                    <tr><th>物质</th><th>化学式</th><th>颜色</th><th>性质</th></tr>
                    <tr><td>氧化亚铁</td><td>FeO</td><td>黑色</td><td>碱性氧化物，不稳定</td></tr>
                    <tr><td>氧化铁</td><td>Fe₂O₃</td><td>红棕色</td><td>碱性氧化物，铁锈主要成分</td></tr>
                    <tr><td>四氧化三铁</td><td>Fe₃O₄</td><td>黑色</td><td>磁性氧化物，可看作FeO·Fe₂O₃</td></tr>
                    <tr><td>氢氧化亚铁</td><td>Fe(OH)₂</td><td>白色</td><td>极易被氧化</td></tr>
                    <tr><td>氢氧化铁</td><td>Fe(OH)₃</td><td>红褐色</td><td>受热分解生成Fe₂O₃</td></tr>
                </table>
            </div>
        `
    },
    aluminum: {
        title: "铝及其化合物",
        description: "两性金属铝的特性与应用",
        content: `
            <div class="doc-section">
                <h2>铝单质的性质</h2>
                <h3>物理性质</h3>
                <ul>
                    <li>银白色金属，质轻（密度 2.70 g/cm³）</li>
                    <li>良好的延展性、导电性和导热性</li>
                    <li>表面易形成致密的氧化膜</li>
                </ul>
                <h3>化学性质</h3>
                <h4>与氧气反应</h4>
                <div class="reaction-card">
                    4Al + 3O₂ → 2Al₂O₃（常温下形成致密氧化膜，保护内部铝）
                </div>
                <h4>与酸反应</h4>
                <div class="reaction-card">
                    2Al + 6HCl → 2AlCl₃ + 3H₂↑<br>
                    注意：常温下铝遇浓硫酸、浓硝酸钝化
                </div>
                <h4>与碱反应（两性）</h4>
                <div class="reaction-card">
                    2Al + 2NaOH + 2H₂O → 2NaAlO₂ + 3H₂↑<br>
                    或：2Al + 2NaOH + 6H₂O → 2Na[Al(OH)₄] + 3H₂↑
                </div>
                <div class="demo-note">
                    铝与碱溶液反应的实质：铝先与水反应生成Al(OH)₃和H₂，Al(OH)₃再与NaOH反应。
                </div>
            </div>
            <div class="doc-section">
                <h2>氧化铝与氢氧化铝的两性</h2>
                <h3>氧化铝（Al₂O₃）</h3>
                <table>
                    <tr><th>反应类型</th><th>反应方程式</th></tr>
                    <tr><td>与酸反应</td><td>Al₂O₃ + 6HCl → 2AlCl₃ + 3H₂O</td></tr>
                    <tr><td>与碱反应</td><td>Al₂O₃ + 2NaOH → 2NaAlO₂ + H₂O</td></tr>
                </table>
                <h3>氢氧化铝（Al(OH)₃）</h3>
                <table>
                    <tr><th>反应类型</th><th>反应方程式</th></tr>
                    <tr><td>与酸反应</td><td>Al(OH)₃ + 3HCl → AlCl₃ + 3H₂O</td></tr>
                    <tr><td>与碱反应</td><td>Al(OH)₃ + NaOH → NaAlO₂ + 2H₂O</td></tr>
                    <tr><td>热分解</td><td>2Al(OH)₃ → Al₂O₃ + 3H₂O</td></tr>
                </table>
                <div class="code-block">
                    <pre>Al³⁺ ←——加酸—— Al(OH)₃ ——加碱——→ AlO₂⁻
            或两性氢氧化物特性</pre>
                </div>
                <h3>铝离子（Al³⁺）与偏铝酸根（AlO₂⁻）的转化</h3>
                <div class="reaction-card">
                    Al³⁺ + 3OH⁻ → Al(OH)₃↓<br>
                    Al³⁺ + 4OH⁻（过量）→ AlO₂⁻ + 2H₂O<br><br>
                    AlO₂⁻ + H⁺ + H₂O → Al(OH)₃↓<br>
                    AlO₂⁻ + 4H⁺（过量）→ Al³⁺ + 2H₂O
                </div>
            </div>
        `
    },
    copper: {
        title: "铜及其化合物",
        description: "不活泼金属铜的性质与应用",
        content: `
            <div class="doc-section">
                <h2>铜单质的性质</h2>
                <h3>物理性质</h3>
                <ul>
                    <li>紫红色金属光泽，具有良好的延展性</li>
                    <li>密度 8.96 g/cm³，熔点 1083℃</li>
                    <li>优良的导电性和导热性（仅次于银）</li>
                </ul>
                <h3>化学性质</h3>
                <p>铜是不活泼金属，在金属活动性顺序中位于氢之后。</p>
                <h4>与氧气反应</h4>
                <div class="reaction-card">
                    2Cu + O₂ → 2CuO（加热，黑色固体）<br>
                    注意：常温下铜在干燥空气中稳定，在潮湿空气中生成铜绿
                </div>
                <h4>与酸反应</h4>
                <div class="reaction-card">
                    Cu + 2H₂SO₄(浓) → CuSO₄ + SO₂↑ + 2H₂O（加热）<br>
                    Cu + 4HNO₃(浓) → Cu(NO₃)₂ + 2NO₂↑ + 2H₂O<br>
                    3Cu + 8HNO₃(稀) → 3Cu(NO₃)₂ + 2NO↑ + 4H₂O<br>
                    注意：铜与非氧化性酸（稀HCl、稀H₂SO₄）不反应
                </div>
                <h4>与盐溶液反应</h4>
                <div class="reaction-card">
                    Cu + 2AgNO₃ → Cu(NO₃)₂ + 2Ag<br>
                    Cu + 2FeCl₃ → CuCl₂ + 2FeCl₂
                </div>
            </div>
            <div class="doc-section">
                <h2>铜的重要化合物</h2>
                <h3>氧化铜（CuO）与氧化亚铜（Cu₂O）</h3>
                <table>
                    <tr><th>性质</th><th>CuO</th><th>Cu₂O</th></tr>
                    <tr><td>颜色</td><td>黑色</td><td>砖红色</td></tr>
                    <tr><td>稳定性</td><td>稳定</td><td>受热易歧化</td></tr>
                    <tr><td>与酸反应</td><td>CuO + 2HCl → CuCl₂ + H₂O</td><td>Cu₂O + 2HCl → CuCl₂ + Cu + H₂O</td></tr>
                    <tr><td>生成条件</td><td>铜在空气中加热</td><td>葡萄糖与新制Cu(OH)₂反应</td></tr>
                </table>
                <h3>氢氧化铜（Cu(OH)₂）</h3>
                <p>蓝色沉淀，难溶于水，受热分解生成CuO。</p>
                <div class="reaction-card">
                    Cu²⁺ + 2OH⁻ → Cu(OH)₂↓（蓝色）<br>
                    Cu(OH)₂ → CuO + H₂O（加热）<br>
                    特征反应：Cu(OH)₂ + 葡萄糖 → Cu₂O↓（砖红）+ 葡萄糖酸（加热）
                </div>
                <h3>硫酸铜（CuSO₄）</h3>
                <p>白色粉末（无水），吸水后变蓝（CuSO₄·5H₂O，胆矾或蓝矾），用于检验水。</p>
                <div class="reaction-card">
                    CuSO₄·5H₂O → CuSO₄ + 5H₂O（白色，加热）<br>
                    CuSO₄ + 5H₂O → CuSO₄·5H₂O（蓝色，吸水）
                </div>
                <div class="demo-note">
                    无水CuSO₄可用于检验有机化合物中是否含水，但不能用作干燥剂（吸水能力弱）。
                </div>
            </div>
        `
    },
    metals: {
        title: "金属材料",
        description: "合金、金属冶炼与金属腐蚀防护",
        content: `
            <div class="doc-section">
                <h2>合金</h2>
                <p>合金是由两种或两种以上的金属（或金属与非金属）熔合而成的具有金属特性的物质。</p>
                <table>
                    <tr><th>合金</th><th>组成</th><th>特性</th><th>用途</th></tr>
                    <tr><td>生铁/钢</td><td>Fe + C（2%~4.3%/0.03%~2%）</td><td>硬度大、韧性好</td><td>建筑、机械</td></tr>
                    <tr><td>不锈钢</td><td>Fe + Cr + Ni</td><td>抗腐蚀</td><td>医疗器械</td></tr>
                    <tr><td>黄铜</td><td>Cu + Zn</td><td>易加工</td><td>仪表零件</td></tr>
                    <tr><td>青铜</td><td>Cu + Sn</td><td>耐磨</td><td>轴承、齿轮</td></tr>
                    <tr><td>硬铝</td><td>Al + Cu + Mg + Mn</td><td>强度高、密度小</td><td>航空材料</td></tr>
                </table>
                <div class="success-note">
                    合金的熔点一般低于各成分金属，硬度和强度一般高于各成分金属。
                </div>
            </div>
            <div class="doc-section">
                <h2>金属的冶炼</h2>
                <table>
                    <tr><th>金属活动性</th><th>冶炼方法</th><th>实例</th></tr>
                    <tr><td>K、Ca、Na、Mg、Al</td><td>电解法</td><td>2Al₂O₃(熔融) → 4Al + 3O₂↑（电解）</td></tr>
                    <tr><td>Zn、Fe、Sn、Pb、Cu</td><td>热还原法</td><td>Fe₂O₃ + 3CO → 2Fe + 3CO₂（高温）</td></tr>
                    <tr><td>Hg、Ag</td><td>热分解法</td><td>2HgO → 2Hg + O₂↑（加热）</td></tr>
                    <tr><td>Pt、Au</td><td>物理方法</td><td>淘金</td></tr>
                </table>
            </div>
            <div class="doc-section">
                <h2>金属的腐蚀与防护</h2>
                <h3>化学腐蚀与电化学腐蚀</h3>
                <table>
                    <tr><th>比较</th><th>化学腐蚀</th><th>电化学腐蚀</th></tr>
                    <tr><td>条件</td><td>金属与干燥气体或液体直接接触</td><td>不纯金属在电解质溶液中形成原电池</td></tr>
                    <tr><td>现象</td><td>无电流产生</td><td>有微弱电流产生</td></tr>
                    <tr><td>速率</td><td>较慢</td><td>较快（更普遍）</td></tr>
                </table>
                <h3>钢铁的电化学腐蚀</h3>
                <p><strong>吸氧腐蚀</strong>（中性/弱酸性）：</p>
                <div class="reaction-card">
                    负极：2Fe - 4e⁻ → 2Fe²⁺<br>
                    正极：O₂ + 2H₂O + 4e⁻ → 4OH⁻<br>
                    总：2Fe + O₂ + 2H₂O → 2Fe(OH)₂ → Fe₂O₃·nH₂O（铁锈）
                </div>
                <h3>金属防护方法</h3>
                <ul>
                    <li>覆盖保护层：涂油漆、电镀、搪瓷、氧化膜</li>
                    <li>改变金属内部结构：制成不锈钢等合金</li>
                    <li>电化学保护法：牺牲阳极法（原电池原理）、外加电流法（电解池原理）</li>
                </ul>
            </div>
        `
    }
};
