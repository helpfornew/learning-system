// 化学反应原理
const principleData = {
    thermochemistry: {
        title: "热化学",
        description: "化学反应中的能量变化与热化学方程式",
        content: `
            <div class="doc-section">
                <h2>化学反应中的能量变化</h2>
                <p>化学反应的本质是旧化学键断裂（吸热）和新化学键形成（放热）的过程。</p>
                <h3>放热反应与吸热反应</h3>
                <table>
                    <tr><th>比较</th><th>放热反应</th><th>吸热反应</th></tr>
                    <tr><td>能量变化</td><td>反应物总能量 > 生成物总能量</td><td>反应物总能量 < 生成物总能量</td></tr>
                    <tr><td>ΔH符号</td><td>ΔH < 0</td><td>ΔH > 0</td></tr>
                    <tr><td>实例</td><td>燃烧、中和、大多数化合</td><td>大多数分解、C+CO₂、C+H₂O</td></tr>
                </table>
            </div>
            <div class="doc-section">
                <h2>焓变（ΔH）与热化学方程式</h2>
                <h3>反应热与焓变</h3>
                <div class="formula-box">
                    ΔH = H(生成物) - H(反应物) = Q（恒压条件下）
                </div>
                <p>单位：kJ/mol（指每摩尔反应的焓变）</p>
                <h3>热化学方程式书写</h3>
                <ol>
                    <li>注明各物质的聚集状态：g（气）、l（液）、s（固）、aq（溶液）</li>
                    <li>ΔH写在方程式右边，放热为负，吸热为正</li>
                    <li>系数表示物质的量，可以是分数</li>
                    <li>ΔH与计量数成正比</li>
                </ol>
                <div class="reaction-card">
                    H₂(g) + 1/2O₂(g) = H₂O(l)  ΔH = -285.8 kJ/mol<br>
                    2H₂(g) + O₂(g) = 2H₂O(l)  ΔH = -571.6 kJ/mol
                </div>
            </div>
            <div class="doc-section">
                <h2>反应热的计算</h2>
                <h3>盖斯定律</h3>
                <p>化学反应的反应热只与反应的始态和终态有关，而与反应的途径无关。</p>
                <div class="code-block">
                    <pre>应用：通过已知反应的热效应，计算难以直接测量的反应热。
若反应：C + 1/2O₂ = CO  ΔH₁
    CO + 1/2O₂ = CO₂  ΔH₂
则：C + O₂ = CO₂  ΔH = ΔH₁ + ΔH₂</pre>
                </div>
                <h3>根据键能计算</h3>
                <div class="formula-box">
                    ΔH = 反应物总键能 - 生成物总键能<br>
                    （或：ΔH = 断裂旧键吸收的能量 - 形成新键释放的能量）
                </div>
                <h3>常见键能数据（kJ/mol）</h3>
                <table>
                    <tr><th>化学键</th><th>键能</th><th>化学键</th><th>键能</th></tr>
                    <tr><td>H-H</td><td>436</td><td>C-C</td><td>347</td></tr>
                    <tr><td>O=O</td><td>498</td><td>C=C</td><td>614</td></tr>
                    <tr><td>H-O</td><td>463</td><td>C≡C</td><td>839</td></tr>
                    <tr><td>H-Cl</td><td>431</td><td>C-H</td><td>413</td></tr>
                </table>
            </div>
            <div class="doc-section">
                <h2>燃烧热与中和热</h2>
                <h3>燃烧热</h3>
                <p>1 mol纯物质完全燃烧生成稳定的氧化物时所放出的热量。</p>
                <ul>
                    <li>稳定氧化物：C→CO₂(g)、H→H₂O(l)、S→SO₂(g)</li>
                    <li>表示：ΔH < 0，或燃烧热取正值</li>
                </ul>
                <h3>中和热</h3>
                <p>在稀溶液中，强酸与强碱发生中和反应生成1 mol H₂O时所放出的热量。</p>
                <div class="reaction-card">
                    H⁺(aq) + OH⁻(aq) = H₂O(l)  ΔH = -57.3 kJ/mol
                </div>
                <div class="warning-note">
                    弱酸或弱碱参与的中和反应，由于电离吸热，放出的热量小于57.3 kJ/mol；浓硫酸稀释时放热，使测定值偏大。
                </div>
            </div>
        `
    },
    "reaction-rate": {
        title: "化学反应速率",
        description: "反应速率的表示与影响因素",
        content: `
            <div class="doc-section">
                <h2>化学反应速率</h2>
                <h3>定义与表示</h3>
                <p>单位时间内反应物浓度的减少或生成物浓度的增加。</p>
                <div class="formula-box">
                    v = Δc / Δt  单位：mol/(L·s) 或 mol/(L·min)
                </div>
                <h3>速率之比等于化学计量数之比</h3>
                <p>对于反应：mA + nB ⇌ pC + qD</p>
                <div class="formula-box">
                    v(A) : v(B) : v(C) : v(D) = m : n : p : q
                </div>
            </div>
            <div class="doc-section">
                <h2>影响化学反应速率的因素</h2>
                <table>
                    <tr><th>因素</th><th>影响规律</th><th>微观解释</th></tr>
                    <tr><td>浓度</td><td>浓度增大，速率加快</td><td>单位体积内活化分子数增多</td></tr>
                    <tr><td>压强（气体）</td><td>压强增大，速率加快</td><td>相当于增大浓度</td></tr>
                    <tr><td>温度</td><td>温度升高，速率加快（一般每升10℃，速率增大2~4倍）</td><td>活化分子百分数增大</td></tr>
                    <tr><td>催化剂</td><td>使用正催化剂，速率加快</td><td>降低活化能，活化分子百分数增大</td></tr>
                    <tr><td>接触面积</td><td>固体表面积增大，速率加快</td><td>反应机会增多</td></tr>
                </table>
            </div>
            <div class="doc-section">
                <h2>活化分子与活化能</h2>
                <h3>有效碰撞理论</h3>
                <ul>
                    <li>碰撞是反应发生的必要条件</li>
                    <li>有效碰撞：能够发生化学反应的碰撞</li>
                    <li>活化分子：具有足够能量，能够发生有效碰撞的分子</li>
                    <li>活化能(Eₐ)：活化分子比普通分子多出的能量</li>
                </ul>
                <h3>反应速率与活化能的关系</h3>
                <div class="code-block">
                    <pre>活化能越低 → 活化分子百分数越高 → 有效碰撞频率越高 → 反应速率越快
催化剂的作用：改变反应历程，降低活化能，同等程度地加快正逆反应速率</pre>
                </div>
            </div>
        `
    },
    equilibrium: {
        title: "化学平衡",
        description: "可逆反应与化学平衡移动",
        content: `
            <div class="doc-section">
                <h2>可逆反应与化学平衡</h2>
                <h3>可逆反应</h3>
                <p>在同一条件下，既能向正反应方向进行，又能向逆反应方向进行的反应。</p>
                <div class="warning-note">
                    判断可逆反应的关键是"同一条件"。如2H₂O →(电解) 2H₂ + O₂ 与 2H₂ + O₂ →(点燃) 2H₂O 不是可逆反应（条件不同）。
                </div>
                <h3>化学平衡状态的特征</h3>
                <div class="code-block">
                    <pre>逆：研究对象是可逆反应
等：v(正) = v(逆) ≠ 0（动态平衡）
动：动态平衡，反应仍在进行
定：各组分浓度保持不变
变：条件改变，平衡可能发生移动</pre>
                </div>
                <h3>平衡状态的判断标志</h3>
                <ul>
                    <li>同一物质的生成速率等于消耗速率</li>
                    <li>各组分的浓度、百分含量、物质的量保持不变</li>
                    <li>对于有颜色的物质，颜色不再变化</li>
                    <li>对于气体反应，恒温恒容时总压强不再变化（反应前后气体分子数不等）</li>
                    <li>恒温恒容时混合气体的平均相对分子质量不再变化（反应前后气体分子数不等或有固体/液体参与）</li>
                </ul>
            </div>
            <div class="doc-section">
                <h2>化学平衡常数（K）</h2>
                <h3>定义与表达式</h3>
                <p>对于可逆反应：mA(g) + nB(g) ⇌ pC(g) + qD(g)</p>
                <div class="formula-box">
                    K = [C]ᵖ[D]ᵑ / [A]ᵐ[B]ⁿ<br>
                    （固体和纯液体的浓度视为常数1，不写入表达式）
                </div>
                <h3>K的性质</h3>
                <ul>
                    <li>K只与温度有关，与浓度、压强无关</li>
                    <li>温度升高，若K增大，则正反应为吸热反应；若K减小，则正反应为放热反应</li>
                    <li>K值越大，反应进行程度越大，反应物转化率越高</li>
                    <li>正逆反应的平衡常数互为倒数：K(正) × K(逆) = 1</li>
                </ul>
                <h3>浓度商（Q）与平衡移动</h3>
                <div class="code-block">
                    <pre>Q < K：反应向正方向进行（v正 > v逆）
Q = K：反应处于平衡状态（v正 = v逆）
Q > K：反应向逆方向进行（v正 < v逆）</pre>
                </div>
            </div>
            <div class="doc-section">
                <h2>化学平衡的移动（勒夏特列原理）</h2>
                <p>如果改变影响平衡的一个条件（浓度、压强、温度），平衡将向能够减弱这种改变的方向移动。</p>
                <table>
                    <tr><th>条件改变</th><th>平衡移动方向</th><th>说明</th></tr>
                    <tr><td>增大反应物浓度</td><td>向正反应方向</td><td>减小反应物浓度则向逆方向</td></tr>
                    <tr><td>增大压强（气体）</td><td>向气体分子数减少的方向</td><td>减小压强则向分子数增多的方向</td></tr>
                    <tr><td>升高温度</td><td>向吸热反应方向</td><td>降低温度则向放热方向</td></tr>
                    <tr><td>使用催化剂</td><td>不移动</td><td>同等程度改变正逆反应速率，缩短达到平衡的时间</td></tr>
                </table>
                <div class="success-note">
                    平衡移动只能"减弱"条件的改变，不能"消除"。例如升温平衡向吸热方向移动，但新平衡温度仍比原平衡高。
                </div>
            </div>
            <div class="doc-section">
                <h2>转化率与产率计算</h2>
                <div class="formula-box">
                    转化率 = (已转化的反应物量 / 起始反应物量) × 100%<br>
                    产率 = (实际产量 / 理论产量) × 100%
                </div>
                <h3>化学平衡计算的三段式</h3>
                <div class="code-block">
                    <pre>对于反应：mA + nB ⇌ pC + qD
起始量(mol)：   a     b      0     0
变化量(mol)：  -mx   -nx    +px   +qx
平衡量(mol)： a-mx  b-nx    px    qx

根据平衡时已知条件（浓度、压强等）列方程求解x。</pre>
                </div>
            </div>
        `
    },
    electrolyte: {
        title: "水溶液中的离子平衡",
        description: "弱电解质的电离、盐类水解与沉淀溶解平衡",
        content: `
            <div class="doc-section">
                <h2>弱电解质的电离平衡</h2>
                <h3>电离平衡常数（Kₐ、Kᵦ）</h3>
                <p>对于弱酸：HA ⇌ H⁺ + A⁻</p>
                <div class="formula-box">
                    Kₐ = [H⁺][A⁻] / [HA]
                </div>
                <h3>电离平衡的影响因素</h3>
                <table>
                    <tr><th>条件</th><th>平衡移动</th><th>电离程度</th><th>Kₐ</th></tr>
                    <tr><td>升温</td><td>正向</td><td>增大</td><td>增大</td></tr>
                    <tr><td>稀释</td><td>正向</td><td>增大</td><td>不变</td></tr>
                    <tr><td>加同种离子</td><td>逆向</td><td>减小</td><td>不变</td></tr>
                </table>
                <h3>水的电离与离子积</h3>
                <div class="reaction-card">
                    H₂O ⇌ H⁺ + OH⁻  ΔH > 0<br>
                    Kᵥ = [H⁺][OH⁻] = 1.0 × 10⁻¹⁴（25℃）
                </div>
                <p>温度升高，Kᵥ增大；加入酸或碱抑制水的电离；加入可水解的盐促进水的电离。</p>
            </div>
            <div class="doc-section">
                <h2>溶液的酸碱性与pH</h2>
                <div class="formula-box">
                    pH = -lg[H⁺]；pOH = -lg[OH⁻]<br>
                    pH + pOH = 14（25℃）
                </div>
                <table>
                    <tr><th>溶液</th><th>[H⁺]与[OH⁻]关系</th><th>pH（25℃）</th></tr>
                    <tr><td>酸性</td><td>[H⁺] > [OH⁻]</td><td>pH < 7</td></tr>
                    <tr><td>中性</td><td>[H⁺] = [OH⁻] = 10⁻⁷</td><td>pH = 7</td></tr>
                    <tr><td>碱性</td><td>[H⁺] < [OH⁻]</td><td>pH > 7</td></tr>
                </table>
                <div class="warning-note">
                    pH = 7不一定显中性，只有在25℃时成立。中性溶液的本质是[H⁺] = [OH⁻]。
                </div>
            </div>
            <div class="doc-section">
                <h2>盐类水解</h2>
                <p>盐电离出的离子与水电离出的H⁺或OH⁻结合生成弱电解质的反应。</p>
                <h3>水解规律</h3>
                <div class="code-block">
                    <pre>有弱才水解，无弱不水解
谁弱谁水解，谁强显谁性
越弱越水解，都弱都水解</pre>
                </div>
                <table>
                    <tr><th>盐的类型</th><th>水解离子</th><th>溶液酸碱性</th><th>实例</th></tr>
                    <tr><td>强酸强碱盐</td><td>无</td><td>中性</td><td>NaCl、KNO₃</td></tr>
                    <tr><td>强酸弱碱盐</td><td>阳离子</td><td>酸性</td><td>NH₄Cl、CuSO₄</td></tr>
                    <tr><td>弱酸强碱盐</td><td>阴离子</td><td>碱性</td><td>CH₃COONa、Na₂CO₃</td></tr>
                    <tr><td>弱酸弱碱盐</td><td>阴阳离子</td><td>看相对强弱</td><td>CH₃COONH₄</td></tr>
                </table>
                <h3>水解方程式书写</h3>
                <div class="reaction-card">
                    单水解：NH₄⁺ + H₂O ⇌ NH₃·H₂O + H⁺<br>
                    CO₃²⁻ + H₂O ⇌ HCO₃⁻ + OH⁻（分步，以第一步为主）<br><br>
                    双水解：Al³⁺ + 3HCO₃⁻ = Al(OH)₃↓ + 3CO₂↑（完全进行）
                </div>
            </div>
            <div class="doc-section">
                <h2>沉淀溶解平衡</h2>
                <h3>溶度积（Kₛₚ）</h3>
                <p>对于沉淀：AₘBₙ(s) ⇌ mAⁿ⁺(aq) + nBᵐ⁻(aq)</p>
                <div class="formula-box">
                    Kₛₚ = [Aⁿ⁺]ᵐ[Bᵐ⁻]ⁿ
                </div>
                <h3>溶度积规则</h3>
                <ul>
                    <li>Q < Kₛₚ：溶液不饱和，无沉淀析出或沉淀溶解</li>
                    <li>Q = Kₛₚ：溶液饱和，处于沉淀溶解平衡</li>
                    <li>Q > Kₛₚ：溶液过饱和，有沉淀析出</li>
                </ul>
                <h3>沉淀的生成、溶解与转化</h3>
                <table>
                    <tr><th>过程</th><th>方法</th><th>实例</th></tr>
                    <tr><td>沉淀生成</td><td>加入沉淀剂、调节pH</td><td>加AgNO₃生成AgCl沉淀</td></tr>
                    <tr><td>沉淀溶解</td><td>加酸、氧化还原、配位</td><td>CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑</td></tr>
                    <tr><td>沉淀转化</td><td>转化为更难溶的沉淀</td><td>AgCl(白) → AgBr(淡黄) → AgI(黄) → Ag₂S(黑)</td></tr>
                </table>
            </div>
        `
    },
    electrochemistry: {
        title: "电化学基础",
        description: "原电池与电解池原理及应用",
        content: `
            <div class="doc-section">
                <h2>原电池</h2>
                <h3>构成条件</h3>
                <ul>
                    <li>两种活动性不同的电极材料（金属或导电非金属）</li>
                    <li>电解质溶液或熔融电解质</li>
                    <li>形成闭合回路（导线连接或直接接触）</li>
                    <li>自发进行的氧化还原反应</li>
                </ul>
                <h3>工作原理</h3>
                <table>
                    <tr><th>电极</th><th>负极</th><th>正极</th></tr>
                    <tr><td>反应类型</td><td>氧化反应</td><td>还原反应</td></tr>
                    <tr><td>电子流向</td><td>电子流出</td><td>电子流入</td></tr>
                    <tr><td>离子移动</td><td>阴离子移向负极</td><td>阳离子移向正极</td></tr>
                </table>
                <h3>铜锌原电池示例</h3>
                <div class="reaction-card">
                    负极（Zn）：Zn - 2e⁻ → Zn²⁺（氧化）<br>
                    正极（Cu）：2H⁺ + 2e⁻ → H₂↑（还原）<br>
                    总反应：Zn + 2H⁺ → Zn²⁺ + H₂↑
                </div>
                <h3>常见化学电源</h3>
                <table>
                    <tr><th>电池</th><th>负极反应</th><th>正极反应</th><th>总反应</th></tr>
                    <tr><td>干电池</td><td>Zn - 2e⁻ → Zn²⁺</td><td>2NH₄⁺ + 2e⁻ → 2NH₃ + H₂</td><td>Zn + 2NH₄⁺ → Zn²⁺ + 2NH₃ + H₂</td></tr>
                    <tr><td>铅蓄电池</td><td>Pb + SO₄²⁻ - 2e⁻ → PbSO₄</td><td>PbO₂ + 4H⁺ + SO₄²⁻ + 2e⁻ → PbSO₄ + 2H₂O</td><td>Pb + PbO₂ + 2H₂SO₄ → 2PbSO₄ + 2H₂O</td></tr>
                    <tr><td>氢氧燃料电池</td><td>2H₂ - 4e⁻ → 4H⁺</td><td>O₂ + 4H⁺ + 4e⁻ → 2H₂O</td><td>2H₂ + O₂ → 2H₂O</td></tr>
                </table>
            </div>
            <div class="doc-section">
                <h2>电解池</h2>
                <h3>构成条件</h3>
                <ul>
                    <li>直流电源</li>
                    <li>两个电极（阴极、阳极）</li>
                    <li>电解质溶液或熔融电解质</li>
                    <li>形成闭合回路</li>
                </ul>
                <h3>工作原理</h3>
                <table>
                    <tr><th>电极</th><th>阴极（接负极）</th><th>阳极（接正极）</th></tr>
                    <tr><td>反应类型</td><td>还原反应</td><td>氧化反应</td></tr>
                    <tr><td>电子流向</td><td>电子流入</td><td>电子流出</td></tr>
                </table>
                <h3>离子放电顺序</h3>
                <div class="code-block">
                    <pre>阳极（失电子，氧化）：
活性电极（Ag以前金属）> S²⁻ > I⁻ > Br⁻ > Cl⁻ > OH⁻ > 含氧酸根 > F⁻

阴极（得电子，还原）：
Ag⁺ > Hg²⁺ > Fe³⁺ > Cu²⁺ > H⁺(酸) > Pb²⁺ > Sn²⁺ > Fe²⁺ > Zn²⁺ > H⁺(水) > Al³⁺ > ...</pre>
                </div>
                <h3>电解类型</h3>
                <table>
                    <tr><th>类型</th><th>特点</th><th>实例</th></tr>
                    <tr><td>电解水型</td><td>电解含氧酸、强碱、活泼金属含氧酸盐</td><td>电解H₂SO₄、NaOH、Na₂SO₄溶液</td></tr>
                    <tr><td>电解电解质型</td><td>电解无氧酸、不活泼金属无氧酸盐</td><td>电解HCl、CuCl₂溶液</td></tr>
                    <tr><td>放氢生碱型</td><td>电解活泼金属无氧酸盐</td><td>电解NaCl溶液</td></tr>
                    <tr><td>放氧生酸型</td><td>电解不活泼金属含氧酸盐</td><td>电解CuSO₄、AgNO₃溶液</td></tr>
                </table>
            </div>
            <div class="doc-section">
                <h2>原电池与电解池比较</h2>
                <table>
                    <tr><th>比较</th><th>原电池</th><th>电解池</th></tr>
                    <tr><td>能量转化</td><td>化学能→电能</td><td>电能→化学能</td></tr>
                    <tr><td>反应类型</td><td>自发进行的氧化还原反应</td><td>非自发的氧化还原反应</td></tr>
                    <tr><td>电子流向</td><td>负极→正极（外电路）</td><td>电源负极→阴极，阳极→电源正极</td></tr>
                    <tr><td>阴/负极</td><td>负极：氧化</td><td>阴极：还原</td></tr>
                    <tr><td>阳/正极</td><td>正极：还原</td><td>阳极：氧化</td></tr>
                </table>
                <h3>电镀与电解精炼</h3>
                <ul>
                    <li><strong>电镀：</strong>镀件作阴极，镀层金属作阳极，含镀层金属离子的溶液作电镀液</li>
                    <li><strong>电解精炼铜：</strong>粗铜作阳极，纯铜作阴极，CuSO₄溶液作电解液</li>
                </ul>
            </div>
        `
    }
};
