// 常见化学方程式
const equationsData = {
    equations: {
        title: "常见化学方程式",
        description: "高中化学重要反应方程式汇编",
        content: `
            <div class="doc-section">
                <h2>一、金属元素反应方程式</h2>
                <h3>1. 钠及其化合物</h3>
                <div class="reaction-card">
                    2Na + 2H₂O → 2NaOH + H₂↑<br>
                    4Na + O₂ → 2Na₂O（常温）<br>
                    2Na + O₂ → Na₂O₂（加热）<br><br>
                    2Na₂O₂ + 2H₂O → 4NaOH + O₂↑<br>
                    2Na₂O₂ + 2CO₂ → 2Na₂CO₃ + O₂<br><br>
                    Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑<br>
                    2NaHCO₃ → Na₂CO₃ + H₂O + CO₂↑（加热）<br>
                    NaHCO₃ + NaOH → Na₂CO₃ + H₂O
                </div>
                <h3>2. 铝及其化合物</h3>
                <div class="reaction-card">
                    2Al + 6HCl → 2AlCl₃ + 3H₂↑<br>
                    2Al + 2NaOH + 2H₂O → 2NaAlO₂ + 3H₂↑<br>
                    4Al + 3O₂ → 2Al₂O₃<br><br>
                    Al₂O₃ + 6HCl → 2AlCl₃ + 3H₂O<br>
                    Al₂O₃ + 2NaOH → 2NaAlO₂ + H₂O<br><br>
                    Al(OH)₃ + 3HCl → AlCl₃ + 3H₂O<br>
                    Al(OH)₃ + NaOH → NaAlO₂ + 2H₂O<br>
                    Al³⁺ + 3NH₃·H₂O → Al(OH)₃↓ + 3NH₄⁺<br><br>
                    Al³⁺ + 3OH⁻ → Al(OH)₃↓<br>
                    Al³⁺ + 4OH⁻（过量）→ AlO₂⁻ + 2H₂O<br>
                    AlO₂⁻ + H⁺ + H₂O → Al(OH)₃↓<br>
                    AlO₂⁻ + 4H⁺（过量）→ Al³⁺ + 2H₂O
                </div>
                <h3>3. 铁及其化合物</h3>
                <div class="reaction-card">
                    3Fe + 2O₂ → Fe₃O₄（点燃）<br>
                    2Fe + 3Cl₂ → 2FeCl₃（点燃）<br>
                    Fe + S → FeS（加热）<br>
                    3Fe + 4H₂O(g) → Fe₃O₄ + 4H₂（高温）<br>
                    Fe + 2HCl → FeCl₂ + H₂↑<br>
                    Fe + CuSO₄ → FeSO₄ + Cu<br><br>
                    FeO + 2HCl → FeCl₂ + H₂O<br>
                    Fe₂O₃ + 6HCl → 2FeCl₃ + 3H₂O<br>
                    Fe₃O₄ + 8HCl → FeCl₂ + 2FeCl₃ + 4H₂O<br><br>
                    Fe²⁺ + 2OH⁻ → Fe(OH)₂↓（白色）<br>
                    4Fe(OH)₂ + O₂ + 2H₂O → 4Fe(OH)₃（红褐色）<br>
                    Fe³⁺ + 3OH⁻ → Fe(OH)₃↓（红褐色）<br><br>
                    Fe³⁺ + 3SCN⁻ → Fe(SCN)₃（血红色）<br>
                    2Fe³⁺ + Fe → 3Fe²⁺<br>
                    2Fe²⁺ + Cl₂ → 2Fe³⁺ + 2Cl⁻
                </div>
                <h3>4. 铜及其化合物</h3>
                <div class="reaction-card">
                    2Cu + O₂ → 2CuO（加热）<br>
                    2Cu + S → Cu₂S（加热）<br>
                    Cu + 2H₂SO₄(浓) → CuSO₄ + SO₂↑ + 2H₂O（加热）<br>
                    Cu + 4HNO₃(浓) → Cu(NO₃)₂ + 2NO₂↑ + 2H₂O<br>
                    3Cu + 8HNO₃(稀) → 3Cu(NO₃)₂ + 2NO↑ + 4H₂O<br><br>
                    Cu²⁺ + 2OH⁻ → Cu(OH)₂↓（蓝色）<br>
                    Cu(OH)₂ → CuO + H₂O（加热）<br>
                    CH₃CHO + 2Cu(OH)₂ + NaOH → CH₃COONa + Cu₂O↓ + 3H₂O
                </div>
                <h3>5. 镁及其化合物</h3>
                <div class="reaction-card">
                    2Mg + O₂ → 2MgO（点燃）<br>
                    3Mg + N₂ → Mg₃N₂（点燃）<br>
                    Mg + 2HCl → MgCl₂ + H₂↑<br>
                    MgCl₂ + Ca(OH)₂ → Mg(OH)₂↓ + CaCl₂
                </div>
            </div>
            <div class="doc-section">
                <h2>二、非金属元素反应方程式</h2>
                <h3>1. 氯及其化合物</h3>
                <div class="reaction-card">
                    H₂ + Cl₂ → 2HCl（点燃/光照）<br>
                    2Na + Cl₂ → 2NaCl（点燃）<br>
                    Cu + Cl₂ → CuCl₂（点燃）<br>
                    2Fe + 3Cl₂ → 2FeCl₃（点燃）<br><br>
                    Cl₂ + H₂O ⇌ HCl + HClO<br>
                    Cl₂ + 2NaOH → NaCl + NaClO + H₂O<br>
                    2Cl₂ + 2Ca(OH)₂ → CaCl₂ + Ca(ClO)₂ + 2H₂O<br><br>
                    MnO₂ + 4HCl(浓) → MnCl₂ + Cl₂↑ + 2H₂O（加热）<br>
                    2KMnO₄ + 16HCl(浓) → 2KCl + 2MnCl₂ + 5Cl₂↑ + 8H₂O<br><br>
                    2HClO → 2HCl + O₂↑（光照）<br>
                    Ca(ClO)₂ + CO₂ + H₂O → CaCO₃↓ + 2HClO
                </div>
                <h3>2. 硫及其化合物</h3>
                <div class="reaction-card">
                    S + H₂ → H₂S（加热）<br>
                    S + O₂ → SO₂（点燃）<br>
                    Fe + S → FeS（加热）<br>
                    2Cu + S → Cu₂S（加热）<br><br>
                    SO₂ + H₂O ⇌ H₂SO₃<br>
                    SO₂ + 2NaOH → Na₂SO₃ + H₂O<br>
                    2SO₂ + O₂ ⇌ 2SO₃（催化剂，加热）<br>
                    SO₂ + Cl₂ + 2H₂O → H₂SO₄ + 2HCl<br>
                    SO₂ + 2H₂S → 3S↓ + 2H₂O<br><br>
                    Cu + 2H₂SO₄(浓) → CuSO₄ + SO₂↑ + 2H₂O（加热）<br>
                    C + 2H₂SO₄(浓) → CO₂↑ + 2SO₂↑ + 2H₂O（加热）<br><br>
                    Na₂SO₃ + H₂SO₄ → Na₂SO₄ + SO₂↑ + H₂O
                </div>
                <h3>3. 氮及其化合物</h3>
                <div class="reaction-card">
                    N₂ + O₂ → 2NO（放电）<br>
                    N₂ + 3H₂ ⇌ 2NH₃（高温高压催化剂）<br>
                    N₂ + 3Mg → Mg₃N₂（点燃）<br><br>
                    2NO + O₂ → 2NO₂<br>
                    3NO₂ + H₂O → 2HNO₃ + NO<br>
                    2NO₂ ⇌ N₂O₄<br><br>
                    NH₃ + H₂O ⇌ NH₃·H₂O ⇌ NH₄⁺ + OH⁻<br>
                    NH₃ + HCl → NH₄Cl<br>
                    4NH₃ + 5O₂ → 4NO + 6H₂O（催化剂，加热）<br><br>
                    2NH₄Cl + Ca(OH)₂ → CaCl₂ + 2NH₃↑ + 2H₂O（加热）<br>
                    NH₄HCO₃ → NH₃↑ + H₂O + CO₂↑（加热）<br><br>
                    Cu + 4HNO₃(浓) → Cu(NO₃)₂ + 2NO₂↑ + 2H₂O<br>
                    3Cu + 8HNO₃(稀) → 3Cu(NO₃)₂ + 2NO↑ + 4H₂O<br>
                    C + 4HNO₃(浓) → CO₂↑ + 4NO₂↑ + 2H₂O（加热）<br>
                    4HNO₃ → 4NO₂↑ + O₂↑ + 2H₂O（光照/加热）
                </div>
                <h3>4. 硅及其化合物</h3>
                <div class="reaction-card">
                    Si + O₂ → SiO₂（加热）<br>
                    Si + 2NaOH + H₂O → Na₂SiO₃ + 2H₂↑<br>
                    Si + 4HF → SiF₄↑ + 2H₂↑<br><br>
                    SiO₂ + 2NaOH → Na₂SiO₃ + H₂O<br>
                    SiO₂ + 4HF → SiF₄↑ + 2H₂O<br>
                    SiO₂ + CaO → CaSiO₃（高温）<br>
                    SiO₂ + 2C → Si + 2CO↑（高温）<br><br>
                    Na₂SiO₃ + CO₂ + H₂O → Na₂CO₃ + H₂SiO₃↓<br>
                    Na₂SiO₃ + 2HCl → 2NaCl + H₂SiO₃↓
                </div>
                <h3>5. 碳及其化合物</h3>
                <div class="reaction-card">
                    C + O₂ → CO₂（充分燃烧）<br>
                    2C + O₂ → 2CO（不充分燃烧）<br>
                    C + CO₂ → 2CO（高温）<br>
                    C + 2CuO → 2Cu + CO₂↑（高温）<br>
                    C + H₂O(g) → CO + H₂（高温，水煤气）<br><br>
                    CaCO₃ → CaO + CO₂↑（高温）<br>
                    CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑<br>
                    CaCO₃ + CO₂ + H₂O → Ca(HCO₃)₂<br>
                    Ca(HCO₃)₂ → CaCO₃↓ + CO₂↑ + H₂O（加热）
                </div>
            </div>
            <div class="doc-section">
                <h2>三、有机化学反应方程式</h2>
                <h3>1. 烷烃</h3>
                <div class="reaction-card">
                    CH₄ + 2O₂ → CO₂ + 2H₂O（燃烧）<br>
                    CH₄ + Cl₂ → CH₃Cl + HCl（光照）<br>
                    CH₃Cl + Cl₂ → CH₂Cl₂ + HCl（光照）<br><br>
                    CₙH₂ₙ₊₂ + (3n+1)/2 O₂ → nCO₂ + (n+1)H₂O（燃烧通式）
                </div>
                <h3>2. 烯烃</h3>
                <div class="reaction-card">
                    CH₂=CH₂ + 3O₂ → 2CO₂ + 2H₂O（燃烧）<br>
                    CH₂=CH₂ + Br₂ → CH₂BrCH₂Br<br>
                    CH₂=CH₂ + H₂ → CH₃CH₃（Ni催化）<br>
                    CH₂=CH₂ + HCl → CH₃CH₂Cl<br>
                    CH₂=CH₂ + H₂O → CH₃CH₂OH（催化剂）<br><br>
                    nCH₂=CH₂ → [CH₂-CH₂]n（聚乙烯）<br>
                    nCH₂=CHCl → [CH₂-CHCl]n（聚氯乙烯）
                </div>
                <h3>3. 炔烃</h3>
                <div class="reaction-card">
                    2C₂H₂ + 5O₂ → 4CO₂ + 2H₂O（燃烧）<br>
                    CH≡CH + Br₂ → CHBr=CHBr<br>
                    CH≡CH + 2Br₂ → CHBr₂CHBr₂<br>
                    CH≡CH + HCl → CH₂=CHCl<br><br>
                    CaC₂ + 2H₂O → Ca(OH)₂ + C₂H₂↑
                </div>
                <h3>4. 芳香烃</h3>
                <div class="reaction-card">
                    C₆H₆ + Br₂ → C₆H₅Br + HBr（FeBr₃催化）<br>
                    C₆H₆ + HNO₃ → C₆H₅NO₂ + H₂O（浓H₂SO₄，50-60℃）<br>
                    C₆H₆ + H₂SO₄(浓) → C₆H₅SO₃H + H₂O（加热）<br>
                    C₆H₆ + 3H₂ → C₆H₁₂（Ni催化）<br><br>
                    C₆H₅-CH₃ → C₆H₅-COOH（KMnO₄氧化）
                </div>
                <h3>5. 卤代烃</h3>
                <div class="reaction-card">
                    C₂H₅Br + NaOH → C₂H₅OH + NaBr（水溶液，加热）<br>
                    C₂H₅Br + NaOH → CH₂=CH₂↑ + NaBr + H₂O（醇溶液，加热）
                </div>
                <h3>6. 醇</h3>
                <div class="reaction-card">
                    2C₂H₅OH + 2Na → 2C₂H₅ONa + H₂↑<br>
                    2C₂H₅OH + O₂ → 2CH₃CHO + 2H₂O（Cu催化，加热）<br>
                    C₂H₅OH → CH₂=CH₂↑ + H₂O（浓H₂SO₄，170℃）<br>
                    C₂H₅OH + HBr → C₂H₅Br + H₂O（加热）
                </div>
                <h3>7. 酚</h3>
                <div class="reaction-card">
                    C₆H₅OH + NaOH → C₆H₅ONa + H₂O<br>
                    C₆H₅OH + 3Br₂ → C₆H₂Br₃OH↓ + 3HBr<br><br>
                    C₆H₅ONa + CO₂ + H₂O → C₆H₅OH↓ + NaHCO₃
                </div>
                <h3>8. 醛</h3>
                <div class="reaction-card">
                    CH₃CHO + H₂ → CH₃CH₂OH（Ni催化）<br>
                    2CH₃CHO + O₂ → 2CH₃COOH（催化剂）<br><br>
                    CH₃CHO + 2Ag(NH₃)₂OH → CH₃COONH₄ + 2Ag↓ + 3NH₃ + H₂O<br>
                    CH₃CHO + 2Cu(OH)₂ + NaOH → CH₃COONa + Cu₂O↓ + 3H₂O
                </div>
                <h3>9. 羧酸与酯</h3>
                <div class="reaction-card">
                    CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O（浓H₂SO₄）<br>
                    CH₃COOC₂H₅ + H₂O ⇌ CH₃COOH + C₂H₅OH（稀H₂SO₄）<br>
                    CH₃COOC₂H₅ + NaOH → CH₃COONa + C₂H₅OH<br><br>
                    2CH₃COOH + Na₂CO₃ → 2CH₃COONa + H₂O + CO₂↑
                </div>
                <h3>10. 糖类</h3>
                <div class="reaction-card">
                    C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O（葡萄糖燃烧）<br>
                    CH₂OH(CHOH)₄CHO + 2Ag(NH₃)₂OH → CH₂OH(CHOH)₄COONH₄ + 2Ag↓ + 3NH₃ + H₂O<br>
                    C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂↑（酒化酶）<br><br>
                    (C₆H₁₀O₅)n + nH₂O → nC₆H₁₂O₆（淀粉水解，酸或酶催化）
                </div>
            </div>
            <div class="doc-section">
                <h2>四、离子反应方程式</h2>
                <h3>1. 酸碱反应</h3>
                <div class="reaction-card">
                    H⁺ + OH⁻ → H₂O<br>
                    H⁺ + NH₃·H₂O → NH₄⁺ + H₂O<br>
                    OH⁻ + HCO₃⁻ → CO₃²⁻ + H₂O<br>
                    OH⁻ + NH₄⁺ → NH₃·H₂O
                </div>
                <h3>2. 沉淀反应</h3>
                <div class="reaction-card">
                    Ag⁺ + Cl⁻ → AgCl↓<br>
                    Ba²⁺ + SO₄²⁻ → BaSO₄↓<br>
                    Ca²⁺ + CO₃²⁻ → CaCO₃↓<br>
                    Mg²⁺ + 2OH⁻ → Mg(OH)₂↓<br>
                    Fe³⁺ + 3OH⁻ → Fe(OH)₃↓<br>
                    Cu²⁺ + 2OH⁻ → Cu(OH)₂↓<br>
                    Al³⁺ + 3OH⁻ → Al(OH)₃↓<br>
                    AlO₂⁻ + H⁺ + H₂O → Al(OH)₃↓<br>
                    SiO₃²⁻ + 2H⁺ → H₂SiO₃↓
                </div>
                <h3>3. 氧化还原反应</h3>
                <div class="reaction-card">
                    Cl₂ + 2I⁻ → 2Cl⁻ + I₂<br>
                    Br₂ + 2I⁻ → 2Br⁻ + I₂<br>
                    2Fe³⁺ + Fe → 3Fe²⁺<br>
                    2Fe³⁺ + Cu → 2Fe²⁺ + Cu²⁺<br>
                    2Fe³⁺ + 2I⁻ → 2Fe²⁺ + I₂<br>
                    Cl₂ + 2Fe²⁺ → 2Cl⁻ + 2Fe³⁺<br>
                    MnO₄⁻ + 5Fe²⁺ + 8H⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O
                </div>
                <h3>4. 双水解反应</h3>
                <div class="reaction-card">
                    Al³⁺ + 3HCO₃⁻ → Al(OH)₃↓ + 3CO₂↑<br>
                    Al³⁺ + 3AlO₂⁻ + 6H₂O → 4Al(OH)₃↓<br>
                    2Al³⁺ + 3CO₃²⁻ + 3H₂O → 2Al(OH)₃↓ + 3CO₂↑<br>
                    Fe³⁺ + 3HCO₃⁻ → Fe(OH)₃↓ + 3CO₂↑
                </div>
            </div>
            <div class="doc-section">
                <h2>五、电化学反应方程式</h2>
                <h3>1. 原电池</h3>
                <div class="reaction-card">
                    铜锌原电池：<br>
                    负极：Zn - 2e⁻ → Zn²⁺<br>
                    正极：2H⁺ + 2e⁻ → H₂↑<br><br>
                    氢氧燃料电池（酸性）：<br>
                    负极：2H₂ - 4e⁻ → 4H⁺<br>
                    正极：O₂ + 4H⁺ + 4e⁻ → 2H₂O<br><br>
                    氢氧燃料电池（碱性）：<br>
                    负极：2H₂ + 4OH⁻ - 4e⁻ → 4H₂O<br>
                    正极：O₂ + 2H₂O + 4e⁻ → 4OH⁻
                </div>
                <h3>2. 电解池</h3>
                <div class="reaction-card">
                    电解饱和食盐水：<br>
                    阴极：2H⁺ + 2e⁻ → H₂↑ 或 2H₂O + 2e⁻ → H₂↑ + 2OH⁻<br>
                    阳极：2Cl⁻ - 2e⁻ → Cl₂↑<br>
                    总：2NaCl + 2H₂O → 2NaOH + H₂↑ + Cl₂↑（电解）<br><br>
                    电解硫酸铜溶液：<br>
                    阴极：Cu²⁺ + 2e⁻ → Cu<br>
                    阳极：4OH⁻ - 4e⁻ → 2H₂O + O₂↑<br>
                    总：2CuSO₄ + 2H₂O → 2Cu + O₂↑ + 2H₂SO₄（电解）<br><br>
                    电解熔融氧化铝：<br>
                    阴极：4Al³⁺ + 12e⁻ → 4Al<br>
                    阳极：6O²⁻ - 12e⁻ → 3O₂↑<br>
                    总：2Al₂O₃ → 4Al + 3O₂↑（电解）
                </div>
                <h3>3. 金属腐蚀</h3>
                <div class="reaction-card">
                    吸氧腐蚀：<br>
                    负极：2Fe - 4e⁻ → 2Fe²⁺<br>
                    正极：O₂ + 2H₂O + 4e⁻ → 4OH⁻<br><br>
                    析氢腐蚀：<br>
                    负极：Fe - 2e⁻ → Fe²⁺<br>
                    正极：2H⁺ + 2e⁻ → H₂↑
                </div>
            </div>
        `
    }
};
