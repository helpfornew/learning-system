// 化学计算专题
const calculationData = {
    calculation: {
        title: "化学计算专题",
        description: "高中化学常用计算方法与技巧",
        content: `
            <div class="doc-section">
                <h2>守恒法</h2>
                <p>化学反应中遵循各种守恒关系，利用守恒可以快速解题。</p>
                <h3>质量守恒</h3>
                <p>反应前后物质的总质量不变。</p>
                <div class="reaction-card">
                    例：2.3g Na 在空气中燃烧，生成3.5g固体，求生成的Na₂O和Na₂O₂的物质的量比。<br>
                    解：设Na₂O为x mol，Na₂O₂为y mol<br>
                    根据Na守恒：2x + 2y = 2.3/23 = 0.1<br>
                    根据质量：62x + 78y = 3.5<br>
                    解得：x = 0.025，y = 0.025<br>
                    比例：1:1
                </div>
                <h3>电荷守恒</h3>
                <p>溶液中阳离子所带正电荷总数等于阴离子所带负电荷总数。</p>
                <div class="reaction-card">
                    例：某溶液中含有Na⁺、Mg²⁺、Cl⁻、SO₄²⁻，已知[Na⁺]=0.1mol/L，[Mg²⁺]=0.05mol/L，[Cl⁻]=0.1mol/L，求[SO₄²⁻]。<br>
                    解：电荷守恒：[Na⁺] + 2[Mg²⁺] = [Cl⁻] + 2[SO₄²⁻]<br>
                    0.1 + 2×0.05 = 0.1 + 2[SO₄²⁻]<br>
                    [SO₄²⁻] = 0.05 mol/L
                </div>
                <h3>电子守恒</h3>
                <p>氧化还原反应中，氧化剂得电子总数等于还原剂失电子总数。</p>
                <div class="reaction-card">
                    例：3.84g Cu与足量稀HNO₃反应，求生成的NO在标况下的体积。<br>
                    解：Cu → Cu²⁺，失2e⁻；NO₃⁻ → NO，得3e⁻<br>
                    n(Cu) = 3.84/64 = 0.06 mol，失电子0.12 mol<br>
                    n(NO) = 0.12/3 = 0.04 mol<br>
                    V(NO) = 0.04 × 22.4 = 0.896 L
                </div>
                <h3>原子守恒</h3>
                <p>反应前后某元素的原子总数不变。</p>
            </div>
            <div class="doc-section">
                <h2>差量法</h2>
                <p>利用反应前后固体质量、气体体积等差量进行计算。</p>
                <h3>质量差</h3>
                <div class="reaction-card">
                    例：将10g铁棒放入CuSO₄溶液，取出后质量为10.8g，求生成的Cu质量。<br>
                    解：Fe + CuSO₄ → FeSO₄ + Cu  Δm<br>
                        56              64     8<br>
                        x               y     0.8g<br>
                    x = 5.6g，y = 6.4g<br>
                    生成Cu 6.4g
                </div>
                <h3>体积差</h3>
                <div class="reaction-card">
                    例：将40mL NO和NO₂混合气体通入水中，剩余20mL气体，求原混合气体中NO体积。<br>
                    解：3NO₂ + H₂O → 2HNO₃ + NO  ΔV=2<br>
                    体积减少20mL，则V(NO₂) = 30mL，V(NO) = 10mL
                </div>
            </div>
            <div class="doc-section">
                <h2>十字交叉法（平均法）</h2>
                <p>适用于两组分混合体系的平均值计算。</p>
                <h3>平均相对分子质量</h3>
                <div class="reaction-card">
                    例：CH₄和CO₂混合气体平均相对分子质量为30，求体积比。<br>
                    解：  CH₄  16      14（CO₂的差）<br>
                          \\   /<br>
                            30<br>
                          /   \\<br>
                    CO₂  44      14（CH₄的差）<br>
                    体积比：V(CH₄):V(CO₂) = 14:14 = 1:1
                </div>
                <h3>平均原子量</h3>
                <div class="reaction-card">
                    例：某氯化物中Cl含量为81.6%，求另一种同位素³⁷Cl的丰度。<br>
                    解：设³⁵Cl丰度为x，³⁷Cl为(1-x)<br>
                    35x + 37(1-x) = 35.5×0.816/0.816...（具体计算略）
                </div>
            </div>
            <div class="doc-section">
                <h2>关系式法</h2>
                <p>多步反应中找出已知量与未知量的关系式。</p>
                <div class="reaction-card">
                    例：用氨氧化法制硝酸，NH₃ → NO → NO₂ → HNO₃，求1mol NH₃理论上可得多少mol HNO₃。<br>
                    解：NH₃ ~ HNO₃（原子守恒）<br>
                    1mol NH₃可得1mol HNO₃<br>
                    考虑实际生产中循环，产率通常为96%
                </div>
            </div>
            <div class="doc-section">
                <h2>极值法（极端假设法）</h2>
                <p>假设混合物为纯物质，计算极值确定范围。</p>
                <div class="reaction-card">
                    例：18.4g Na₂CO₃和NaHCO₃混合物与100mL 2mol/L HCl反应，求生成的CO₂在标况下的体积范围。<br>
                    解：假设全是Na₂CO₃：n(CO₂) = 18.4/106 = 0.174 mol，V = 3.89 L<br>
                    假设全是NaHCO₃：n(CO₂) = 18.4/84 = 0.219 mol，V = 4.91 L<br>
                    实际体积范围：3.89 L < V < 4.91 L
                </div>
            </div>
            <div class="doc-section">
                <h2>综合计算常见题型</h2>
                <table>
                    <tr><th>题型</th><th>解题要点</th></tr>
                    <tr><td>金属与酸反应</td><td>判断过量、注意硝酸的特殊性（不产生H₂）</td></tr>
                    <tr><td>混合气体计算</td><td>利用平均分子量、体积比、十字交叉法</td></tr>
                    <tr><td>溶液浓度计算</td><td>注意单位换算、稀释定律</td></tr>
                    <tr><td>化学平衡计算</td><td>三段式、转化率、产率</td></tr>
                    <tr><td>电化学计算</td><td>电子守恒、法拉第常数（F = 96500 C/mol）</td></tr>
                    <tr><td>热化学计算</td><td>盖斯定律、键能与焓变</td></tr>
                </table>
            </div>
        `
    }
};
