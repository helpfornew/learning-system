// 化学实验
const labData = {
    "lab-basic": {
        title: "化学实验基础",
        description: "化学实验安全与常用仪器",
        content: `
            <div class="doc-section">
                <h2>化学实验安全</h2>
                <h3>常见危险化学品标志</h3>
                <table>
                    <tr><th>标志</th><th>含义</th><th>实例</th></tr>
                    <tr><td>爆炸品</td><td>易发生爆炸</td><td>硝酸铵、TNT</td></tr>
                    <tr><td>易燃物</td><td>易燃烧</td><td>汽油、酒精</td></tr>
                    <tr><td>氧化剂</td><td>具有强氧化性</td><td>高锰酸钾、硝酸</td></tr>
                    <tr><td>腐蚀品</td><td>具有腐蚀性</td><td>浓硫酸、氢氧化钠</td></tr>
                    <tr><td>有毒品</td><td>具有毒性</td><td>汞、氰化物</td></tr>
                </table>
                <h3>实验安全规则</h3>
                <ul>
                    <li>不能用手直接接触药品，不能尝药品味道，不能直接闻气体</li>
                    <li>易燃物远离火源，点燃可燃性气体前要验纯</li>
                    <li>加热液体时加入沸石防止暴沸</li>
                    <li>稀释浓硫酸时将酸缓慢加入水中，并不断搅拌</li>
                    <li>使用酒精灯时不准对点，不准吹灭</li>
                </ul>
                <h3>常见事故处理</h3>
                <table>
                    <tr><th>事故</th><th>处理方法</th></tr>
                    <tr><td>酒精灯失火</td><td>用湿抹布盖灭</td></tr>
                    <tr><td>少量酸/碱沾到皮肤</td><td>立即用大量水冲洗，再涂NaHCO₃或硼酸溶液</td></tr>
                    <tr><td>酸/碱溅入眼睛</td><td>立即用大量水冲洗，边洗边眨眼睛，就医</td></tr>
                    <tr><td>汞洒落</td><td>撒上硫粉，生成HgS</td></tr>
                    <tr><td>烫伤/灼伤</td><td>用冷水冲洗，就医</td></tr>
                </table>
            </div>
            <div class="doc-section">
                <h2>常用实验仪器</h2>
                <h3>可直接加热的仪器</h3>
                <p>试管、坩埚、蒸发皿、燃烧匙</p>
                <h3>需垫石棉网加热的仪器</h3>
                <p>烧杯、烧瓶、锥形瓶</p>
                <h3>不能加热的仪器</h3>
                <p>容量瓶、量筒、集气瓶、漏斗</p>
                <h3>计量仪器</h3>
                <table>
                    <tr><th>仪器</th><th>用途</th><th>精度</th></tr>
                    <tr><td>托盘天平</td><td>称量固体质量</td><td>0.1 g</td></tr>
                    <tr><td>量筒</td><td>量取液体体积</td><td>0.1 mL</td></tr>
                    <tr><td>容量瓶</td><td>配制一定物质的量浓度溶液</td><td>规格固定</td></tr>
                    <tr><td>滴定管</td><td>滴定操作，精确量取液体</td><td>0.01 mL</td></tr>
                </table>
            </div>
        `
    },
    "lab-operation": {
        title: "基本实验操作",
        description: "物质的分离与提纯方法",
        content: `
            <div class="doc-section">
                <h2>物质的分离与提纯</h2>
                <table>
                    <tr><th>方法</th><th>适用范围</th><th>实例</th></tr>
                    <tr><td>过滤</td><td>固液分离</td><td>除去泥沙</td></tr>
                    <tr><td>蒸发结晶</td><td>可溶性固体与溶剂分离</td><td>从NaCl溶液中获得NaCl晶体</td></tr>
                    <tr><td>冷却结晶</td><td>溶解度随温度变化较大的物质</td><td>KNO₃与NaCl的分离</td></tr>
                    <tr><td>萃取分液</td><td>溶质在互不相溶溶剂中溶解度不同</td><td>CCl₄萃取碘水中的碘</td></tr>
                    <tr><td>蒸馏</td><td>沸点不同的液体混合物</td><td>制取蒸馏水，分离酒精与水</td></tr>
                    <tr><td>升华</td><td>某些固体受热直接变为气体</td><td>分离碘与泥沙</td></tr>
                    <tr><td>渗析</td><td>胶体与溶液的分离</td><td>除去淀粉胶体中的NaCl</td></tr>
                </table>
            </div>
            <div class="doc-section">
                <h2>常见离子检验</h2>
                <table>
                    <tr><th>离子</th><th>检验方法</th><th>现象</th></tr>
                    <tr><td>H⁺</td><td>紫色石蕊试液/pH试纸</td><td>变红/pH<7</td></tr>
                    <tr><td>OH⁻</td><td>酚酞试液/pH试纸</td><td>变红/pH>7</td></tr>
                    <tr><td>Cl⁻</td><td>AgNO₃溶液+稀HNO₃</td><td>白色沉淀，不溶于稀HNO₃</td></tr>
                    <tr><td>SO₄²⁻</td><td>BaCl₂溶液+稀HCl</td><td>白色沉淀，不溶于稀HCl</td></tr>
                    <tr><td>CO₃²⁻</td><td>稀HCl+澄清石灰水</td><td>产生气体，使石灰水变浑浊</td></tr>
                    <tr><td>NH₄⁺</td><td>NaOH溶液，加热</td><td>产生刺激性气味气体，使湿润红色石蕊试纸变蓝</td></tr>
                    <tr><td>Fe³⁺</td><td>KSCN溶液</td><td>溶液变血红色</td></tr>
                    <tr><td>Fe²⁺</td><td>KSCN溶液→氯水</td><td>先无现象，后变血红色</td></tr>
                </table>
            </div>
            <div class="doc-section">
                <h2>试纸的使用</h2>
                <table>
                    <tr><th>试纸</th><th>用途</th><th>使用方法</th></tr>
                    <tr><td>pH试纸</td><td>测定溶液pH</td><td>玻璃棒蘸取溶液滴在试纸上，与标准比色卡对比</td></tr>
                    <tr><td>红色石蕊试纸</td><td>检验碱性气体</td><td>湿润后接触气体，变蓝则有碱性气体</td></tr>
                    <tr><td>蓝色石蕊试纸</td><td>检验酸性气体</td><td>湿润后接触气体，变红则有酸性气体</td></tr>
                    <tr><td>淀粉-KI试纸</td><td>检验氧化性气体</td><td>湿润后接触气体，变蓝则有氧化性气体</td></tr>
                </table>
                <div class="warning-note">
                    pH试纸使用前不能湿润（测定气体pH除外），石蕊试纸使用前必须湿润。
                </div>
            </div>
        `
    },
    "lab-gas": {
        title: "气体制备与收集",
        description: "常见气体的实验室制法",
        content: `
            <div class="doc-section">
                <h2>气体制备装置</h2>
                <h3>发生装置选择</h3>
                <table>
                    <tr><th>装置类型</th><th>适用条件</th><th>实例</th></tr>
                    <tr><td>固固加热型</td><td>固体+固体，加热</td><td>O₂、NH₃</td></tr>
                    <tr><td>固液不加热型</td><td>固体+液体，不加热</td><td>H₂、CO₂、H₂S</td></tr>
                    <tr><td>固液加热型</td><td>固体+液体，加热</td><td>Cl₂、HCl</td></tr>
                </table>
                <h3>收集方法</h3>
                <table>
                    <tr><th>收集方法</th><th>适用气体</th><th>特点</th></tr>
                    <tr><td>向上排空气法</td><td>密度比空气大（Mr>29）</td><td>CO₂、Cl₂、HCl、SO₂</td></tr>
                    <tr><td>向下排空气法</td><td>密度比空气小（Mr<29）</td><td>H₂、NH₃</td></tr>
                    <tr><td>排水法</td><td>不溶于水或微溶于水</td><td>O₂、H₂、NO、C₂H₄</td></tr>
                    <tr><td>排饱和溶液法</td><td>能溶于水</td><td>Cl₂（饱和NaCl）、CO₂（饱和NaHCO₃）</td></tr>
                </table>
            </div>
            <div class="doc-section">
                <h2>常见气体制备</h2>
                <h3>氧气（O₂）</h3>
                <div class="reaction-card">
                    2KMnO₄ → K₂MnO₄ + MnO₂ + O₂↑（加热）<br>
                    2KClO₃ →(MnO₂/△) 2KCl + 3O₂↑<br>
                    2H₂O₂ →(MnO₂) 2H₂O + O₂↑
                </div>
                <h3>氢气（H₂）</h3>
                <div class="reaction-card">
                    Zn + H₂SO₄(稀) → ZnSO₄ + H₂↑<br>
                    注意：不能用浓硫酸或硝酸（发生氧化还原反应不生成H₂）
                </div>
                <h3>二氧化碳（CO₂）</h3>
                <div class="reaction-card">
                    CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑<br>
                    注意：不能用硫酸（CaSO₄微溶，覆盖在表面阻止反应）<br>
                    不能用浓盐酸（挥发性强，CO₂中混有HCl）
                </div>
                <h3>氯气（Cl₂）</h3>
                <div class="reaction-card">
                    MnO₂ + 4HCl(浓) → MnCl₂ + Cl₂↑ + 2H₂O（加热）<br>
                    2KMnO₄ + 16HCl(浓) → 2KCl + 2MnCl₂ + 5Cl₂↑ + 8H₂O
                </div>
                <h3>氨气（NH₃）</h3>
                <div class="reaction-card">
                    2NH₄Cl + Ca(OH)₂ → CaCl₂ + 2NH₃↑ + 2H₂O（加热）<br>
                    浓氨水加热或加碱：NH₃·H₂O →(△) NH₃↑ + H₂O
                </div>
            </div>
            <div class="doc-section">
                <h2>气体的净化与干燥</h2>
                <h3>干燥剂选择</h3>
                <table>
                    <tr><th>干燥剂</th><th>可干燥气体</th><th>不能干燥气体</th></tr>
                    <tr><td>浓硫酸</td><td>H₂、O₂、CO₂、SO₂、Cl₂、HCl</td><td>NH₃、H₂S、HI、HBr</td></tr>
                    <tr><td>碱石灰</td><td>H₂、O₂、NH₃、CH₄</td><td>CO₂、SO₂、HCl、Cl₂</td></tr>
                    <tr><td>无水CaCl₂</td><td>大多数气体</td><td>NH₃（形成CaCl₂·8NH₃）</td></tr>
                    <tr><td>P₂O₅</td><td>H₂、O₂、CO₂、HCl</td><td>NH₃</td></tr>
                </table>
                <h3>尾气处理</h3>
                <ul>
                    <li>吸收式：Cl₂、HCl、H₂S、SO₂、NH₃（用水或碱液吸收）</li>
                    <li>燃烧式：H₂、CO（点燃）</li>
                    <li>收集式：少量有毒气体（气球收集）</li>
                </ul>
            </div>
        `
    },
    "lab-detection": {
        title: "物质的检验与鉴别",
        description: "常见物质和离子的检验方法",
        content: `
            <div class="doc-section">
                <h2>有机物的检验与鉴别</h2>
                <table>
                    <tr><th>待检验物质</th><th>试剂/方法</th><th>现象</th></tr>
                    <tr><td>乙烯/烯烃</td><td>溴水或酸性KMnO₄溶液</td><td>褪色</td></tr>
                    <tr><td>乙炔/炔烃</td><td>溴水或酸性KMnO₄溶液</td><td>褪色</td></tr>
                    <tr><td>苯</td><td>加入溴水</td><td>分层，上层呈橙红色（萃取）</td></tr>
                    <tr><td>甲苯</td><td>酸性KMnO₄溶液</td><td>褪色</td></tr>
                    <tr><td>乙醇</td><td>Na</td><td>产生气泡</td></tr>
                    <tr><td>苯酚</td><td>浓溴水或FeCl₃溶液</td><td>白色沉淀/紫色</td></tr>
                    <tr><td>醛基(-CHO)</td><td>银氨溶液或新制Cu(OH)₂</td><td>银镜/砖红色沉淀</td></tr>
                    <tr><td>淀粉</td><td>碘水</td><td>变蓝</td></tr>
                    <tr><td>蛋白质</td><td>灼烧</td><td>烧焦羽毛气味</td></tr>
                </table>
            </div>
            <div class="doc-section">
                <h2>无机物的检验与鉴别</h2>
                <h3>阳离子检验</h3>
                <table>
                    <tr><th>离子</th><th>检验方法</th><th>现象</th></tr>
                    <tr><td>Na⁺</td><td>焰色反应</td><td>黄色火焰</td></tr>
                    <tr><td>K⁺</td><td>焰色反应（透过蓝色钴玻璃）</td><td>紫色火焰</td></tr>
                    <tr><td>Ca²⁺</td><td>焰色反应</td><td>砖红色火焰</td></tr>
                    <tr><td>Mg²⁺</td><td>NaOH溶液</td><td>白色沉淀，不溶于过量NaOH</td></tr>
                    <tr><td>Al³⁺</td><td>NaOH溶液</td><td>白色沉淀，溶于过量NaOH</td></tr>
                    <tr><td>Fe²⁺</td><td>NaOH溶液→放置</td><td>白色→灰绿色→红褐色</td></tr>
                    <tr><td>Fe³⁺</td><td>KSCN溶液</td><td>血红色</td></tr>
                    <tr><td>Cu²⁺</td><td>NaOH溶液</td><td>蓝色沉淀</td></tr>
                    <tr><td>NH₄⁺</td><td>NaOH溶液加热</td><td>刺激性气味气体，使湿润红色石蕊试纸变蓝</td></tr>
                </table>
                <h3>阴离子检验</h3>
                <table>
                    <tr><th>离子</th><th>检验方法</th><th>现象</th></tr>
                    <tr><td>Cl⁻</td><td>AgNO₃+稀HNO₃</td><td>白色沉淀</td></tr>
                    <tr><td>Br⁻</td><td>AgNO₃+稀HNO₃或氯水+CCl₄</td><td>淡黄色沉淀或CCl₄层呈橙红色</td></tr>
                    <tr><td>I⁻</td><td>AgNO₃+稀HNO₃或氯水+CCl₄</td><td>黄色沉淀或CCl₄层呈紫红色</td></tr>
                    <tr><td>SO₄²⁻</td><td>BaCl₂+稀HCl</td><td>白色沉淀</td></tr>
                    <tr><td>CO₃²⁻</td><td>稀HCl+澄清石灰水</td><td>产生使石灰水变浑浊的气体</td></tr>
                    <tr><td>SO₃²⁻</td><td>稀HCl+品红溶液</td><td>产生气体，使品红褪色</td></tr>
                </table>
            </div>
            <div class="doc-section">
                <h2>气体的检验</h2>
                <table>
                    <tr><th>气体</th><th>检验方法</th><th>现象</th></tr>
                    <tr><td>O₂</td><td>带火星的木条</td><td>木条复燃</td></tr>
                    <tr><td>H₂</td><td>点燃，罩干冷烧杯</td><td>淡蓝色火焰，烧杯内壁有水珠</td></tr>
                    <tr><td>CO₂</td><td>澄清石灰水</td><td>石灰水变浑浊</td></tr>
                    <tr><td>Cl₂</td><td>湿润的KI-淀粉试纸</td><td>试纸变蓝</td></tr>
                    <tr><td>NH₃</td><td>湿润的红色石蕊试纸</td><td>试纸变蓝</td></tr>
                    <tr><td>SO₂</td><td>品红溶液</td><td>品红褪色，加热恢复红色</td></tr>
                    <tr><td>NO₂</td><td>观察颜色+水</td><td>红棕色气体，溶于水生成无色气体</td></tr>
                    <tr><td>HCl</td><td>AgNO₃溶液</td><td>白色沉淀</td></tr>
                </table>
            </div>
        `
    }
};
