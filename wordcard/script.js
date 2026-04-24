// 单词记忆系统主逻辑
class WordMemorySystem {
    constructor() {
        this.vocabulary = [];
        this.todayWords = [];
        this.currentWordIndex = 0;
        this.userData = this.loadUserData();
        this.dailyGoal = this.userData.dailyGoal || 10;
        this.currentDate = new Date().toDateString();
        
        this.init();
    }
    
    // 初始化
    async init() {
        await this.loadVocabulary();
        this.setupEventListeners();
        this.updateDateDisplay();
        this.checkDailyReset();
        this.generateTodayWords();
        this.updateUI();
        this.renderVocabularyMap();
    }
    
    // 从cards.json加载词汇
    async loadVocabulary() {
        try {
            const response = await fetch('cards.json');
            const data = await response.json();
            this.vocabulary = data.vocabulary || [];
            console.log(`加载了 ${this.vocabulary.length} 个单词`);
        } catch (error) {
            console.error('加载词汇数据失败:', error);
            // 使用备用数据
            this.vocabulary = this.getFallbackVocabulary();
        }
    }
    
    // 备用词汇数据
    getFallbackVocabulary() {
        return [
            "description", "participant", "slightly", "foreigner", "net", "bite", 
            "cigarette", "deny", "outcome", "firm", "alcohol", "gym", "knife", 
            "sample", "threaten", "violin", "colleague", "raincoat", "academic"
        ];
    }
    
    // 加载用户数据
    loadUserData() {
        const saved = localStorage.getItem('wordMemoryData');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            dailyGoal: 10,
            wordStats: {},
            lastStudyDate: null
        };
    }
    
    // 保存用户数据
    saveUserData() {
        localStorage.setItem('wordMemoryData', JSON.stringify(this.userData));
    }
    
    // 检查是否需要重置每日任务
    checkDailyReset() {
        if (this.userData.lastStudyDate !== this.currentDate) {
            this.userData.lastStudyDate = this.currentDate;
            this.saveUserData();
        }
    }
    
    // 生成今日单词
    generateTodayWords() {
        // 获取需要复习的单词
        const reviewWords = this.getReviewWords();
        
        // 获取新单词
        const newWords = this.getNewWords();
        
        // 合并并限制数量
        this.todayWords = [...reviewWords, ...newWords].slice(0, this.dailyGoal);
        
        // 如果数量不足，补充随机单词
        if (this.todayWords.length < this.dailyGoal) {
            const remaining = this.dailyGoal - this.todayWords.length;
            const additionalWords = this.getRandomWords(remaining, this.todayWords);
            this.todayWords = [...this.todayWords, ...additionalWords];
        }
        
        // 打乱顺序
        this.shuffleArray(this.todayWords);
        
        // 重置当前单词索引
        this.currentWordIndex = 0;
    }
    
    // 获取需要复习的单词
    getReviewWords() {
        const reviewWords = [];
        for (const word of this.vocabulary) {
            const stats = this.userData.wordStats[word];
            if (stats && stats.status === 'review') {
                reviewWords.push(word);
            }
        }
        return reviewWords;
    }
    
    // 获取新单词
    getNewWords() {
        const newWords = [];
        for (const word of this.vocabulary) {
            if (!this.userData.wordStats[word]) {
                newWords.push(word);
                if (newWords.length >= this.dailyGoal / 2) break;
            }
        }
        return newWords;
    }
    
    // 获取随机单词
    getRandomWords(count, excludeWords = []) {
        const availableWords = this.vocabulary.filter(word => !excludeWords.includes(word));
        const shuffled = [...availableWords].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }
    
    // 打乱数组
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // 获取单词状态
    getWordStatus(word) {
        const stats = this.userData.wordStats[word];
        if (!stats) return 'new';
        return stats.status || 'new';
    }
    
    // 获取单词统计数据
    getWordStats(word) {
        return this.userData.wordStats[word] || {
            status: 'new',
            reviewCount: 0,
            lastReviewed: null,
            mastery: 0
        };
    }
    
    // 标记单词为已掌握
    markWordAsKnown(word) {
        const stats = this.getWordStats(word);
        stats.status = 'known';
        stats.reviewCount = (stats.reviewCount || 0) + 1;
        stats.lastReviewed = new Date().toISOString();
        stats.mastery = Math.min(100, (stats.mastery || 0) + 30);
        
        this.userData.wordStats[word] = stats;
        this.saveUserData();
    }
    
    // 标记单词为需复习
    markWordAsReview(word) {
        const stats = this.getWordStats(word);
        stats.status = 'review';
        stats.reviewCount = (stats.reviewCount || 0) + 1;
        stats.lastReviewed = new Date().toISOString();
        stats.mastery = Math.max(0, (stats.mastery || 0) - 10);
        
        this.userData.wordStats[word] = stats;
        this.saveUserData();
    }
    
    // 更新UI
    async updateUI() {
        this.updateProgress();
        await this.updateCurrentWord();
        this.updateTodayWordsList();
        this.updateStats();
    }
    
    // 更新进度
    updateProgress() {
        const completed = this.getCompletedCount();
        const progress = this.todayWords.length > 0 ? (completed / this.todayWords.length) * 100 : 0;
        
        document.getElementById('completedCount').textContent = completed;
        document.getElementById('totalGoal').textContent = this.todayWords.length;
        document.getElementById('todayProgress').textContent = `${Math.round(progress)}%`;
        document.getElementById('progressFill').style.width = `${progress}%`;
    }
    
    // 获取已完成数量
    getCompletedCount() {
        let count = 0;
        for (const word of this.todayWords) {
            const stats = this.userData.wordStats[word];
            if (stats && stats.status === 'known') {
                count++;
            }
        }
        return count;
    }
    
    // 更新当前单词
    async updateCurrentWord() {
        if (this.todayWords.length === 0) {
            document.getElementById('currentWord').textContent = '今日任务已完成！';
            document.getElementById('currentWordTranslation').textContent = '';
            document.getElementById('wordExample').textContent = '恭喜你完成了今日的单词学习任务！';
            return;
        }
        
        const currentWord = this.todayWords[this.currentWordIndex];
        const stats = this.getWordStats(currentWord);
        const translation = await this.getTranslation(currentWord);
        
        document.getElementById('currentWord').textContent = currentWord;
        document.getElementById('currentWordTranslation').textContent = translation;
        document.getElementById('wordProgress').textContent = `${stats.mastery || 0}%`;
        document.getElementById('reviewCount').textContent = stats.reviewCount || 0;
        document.getElementById('lastReviewed').textContent = stats.lastReviewed 
            ? new Date(stats.lastReviewed).toLocaleDateString() 
            : '从未';
        
        // 生成例句
        this.generateExampleSentence(currentWord);
    }
    
    // 获取单词翻译（异步）
    async getTranslation(word) {
        // 首先检查本地词典（不区分大小写）
        const lowerWord = word.toLowerCase();
        if (translationDict[word]) {
            return translationDict[word];
        } else if (translationDict[lowerWord]) {
            return translationDict[lowerWord];
        }
        
        // 如果没有本地翻译，尝试使用在线翻译API
        return await this.getOnlineTranslation(word);
    }
    
    // 获取在线翻译（使用免费翻译API）
    async getOnlineTranslation(word) {
        // 检查是否有缓存
        const cached = this.getCachedTranslation(word);
        if (cached) {
            return cached;
        }
        
        try {
            // 使用免费的翻译API（这里使用一个简单的示例）
            // 注意：实际使用时需要替换为可用的API
            const translation = await this.fetchTranslationFromAPI(word);
            
            // 缓存翻译结果
            this.cacheTranslation(word, translation);
            
            return translation;
        } catch (error) {
            console.error('在线翻译失败:', error);
            return "暂无翻译";
        }
    }
    
    // 从API获取翻译
    async fetchTranslationFromAPI(word) {
        // 这里可以使用免费的翻译API
        // 例如：使用MyMemory Translation API（免费但有速率限制）
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|zh`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.responseData && data.responseData.translatedText) {
            return data.responseData.translatedText;
        } else {
            throw new Error('API返回无效数据');
        }
    }
    
    // 获取缓存的翻译
    getCachedTranslation(word) {
        const cache = this.getTranslationCache();
        return cache[word];
    }
    
    // 缓存翻译
    cacheTranslation(word, translation) {
        const cache = this.getTranslationCache();
        cache[word] = translation;
        localStorage.setItem('translationCache', JSON.stringify(cache));
    }
    
    // 获取翻译缓存
    getTranslationCache() {
        const cached = localStorage.getItem('translationCache');
        return cached ? JSON.parse(cached) : {};
    }
    
    // 生成例句（包含翻译）
    async generateExampleSentence(word) {
        const translation = await this.getTranslation(word);
        const examples = [
            `"${word}" (${translation}) 是一个常用的英语单词。`,
            `你能用 "${word}" (${translation}) 造个句子吗？`,
            `我需要记住 "${word}" (${translation}) 这个单词的意思。`,
            `"${word}" (${translation}) 是英语学习中的重要词汇。`,
            `这个句子中使用了单词 "${word}" (${translation})。`
        ];
        
        const randomExample = examples[Math.floor(Math.random() * examples.length)];
        document.getElementById('wordExample').textContent = randomExample;
    }
    
    // 更新今日单词列表
    updateTodayWordsList() {
        const container = document.getElementById('todayWordsList');
        container.innerHTML = '';
        
        this.todayWords.forEach((word, index) => {
            const status = this.getWordStatus(word);
            const isCurrent = index === this.currentWordIndex;
            
            const wordElement = document.createElement('div');
            wordElement.className = `word-item ${status} ${isCurrent ? 'current' : ''}`;
            wordElement.textContent = word;
            wordElement.title = `点击查看 "${word}"`;
            
            // 添加状态指示器
            const statusIndicator = document.createElement('div');
            statusIndicator.className = `word-status ${status}`;
            wordElement.appendChild(statusIndicator);
            
            // 点击事件
            wordElement.addEventListener('click', () => {
                this.currentWordIndex = index;
                this.updateUI();
            });
            
            container.appendChild(wordElement);
        });
    }
    
    // 更新统计信息
    updateStats() {
        const totalWords = this.vocabulary.length;
        let knownWords = 0;
        let reviewWords = 0;
        
        for (const word of this.vocabulary) {
            const status = this.getWordStatus(word);
            if (status === 'known') knownWords++;
            if (status === 'review') reviewWords++;
        }
        
        document.getElementById('totalWordsCount').textContent = totalWords;
        document.getElementById('knownWordsCount').textContent = knownWords;
        document.getElementById('reviewWordsCount').textContent = reviewWords;
    }
    
    // 渲染词汇地图（带缩放和平移功能）
    async renderVocabularyMap(filter = 'all') {
        const container = document.getElementById('vocabularyMap');
        container.innerHTML = '';
        
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        // 创建SVG和缩放容器
        const svg = d3.select('#vocabularyMap')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');
        
        // 添加缩放容器
        const g = svg.append('g');
        
        // 创建单词节点数据
        const nodes = [];
        let nodeIndex = 0;
        
        for (let i = 0; i < this.vocabulary.length; i++) {
            const word = this.vocabulary[i];
            const stats = this.getWordStats(word);
            const status = stats.status;
            
            // 应用筛选
            if (filter !== 'all' && status !== filter) {
                continue;
            }
            
            // 根据状态确定颜色
            let color;
            switch(status) {
                case 'known': color = '#27ae60'; break;
                case 'review': color = '#e67e22'; break;
                default: color = '#3498db';
            }
            
            // 根据掌握程度确定大小
            const size = 10 + (stats.mastery || 0) / 10;
            
            // 获取翻译
            const translation = await this.getTranslation(word);
            
            nodes.push({
                id: nodeIndex++,
                word: word,
                translation: translation,
                x: Math.random() * (width - 100) + 50,
                y: Math.random() * (height - 100) + 50,
                radius: size,
                color: color,
                status: status,
                mastery: stats.mastery || 0,
                reviewCount: stats.reviewCount || 0
            });
        }
        
        // 更新筛选状态显示
        this.updateFilterStatus(filter, nodes.length);
        
        // 绘制节点
        const circles = g.selectAll('circle')
            .data(nodes)
            .enter()
            .append('circle')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', d => d.radius)
            .attr('fill', d => d.color)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .attr('opacity', 0.8)
            .on('mouseover', function(event, d) {
                // 显示工具提示（包含翻译）
                const tooltip = d3.select('#vocabularyMap')
                    .append('div')
                    .attr('class', 'tooltip')
                    .style('position', 'absolute')
                    .style('background', 'white')
                    .style('padding', '10px')
                    .style('border-radius', '6px')
                    .style('box-shadow', '0 3px 15px rgba(0,0,0,0.2)')
                    .style('pointer-events', 'none')
                    .style('z-index', '1000')
                    .style('max-width', '200px')
                    .html(`
                        <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">
                            ${d.word}
                        </div>
                        <div style="color: #666; margin-bottom: 5px;">
                            翻译: ${d.translation}
                        </div>
                        <div style="font-size: 12px; color: #888;">
                            状态: ${d.status === 'known' ? '✅ 已掌握' : d.status === 'review' ? '🔄 需复习' : '🆕 新单词'}<br>
                            掌握度: ${d.mastery}%<br>
                            复习次数: ${d.reviewCount}
                        </div>
                    `);
                
                // 高亮当前节点
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', d.radius * 1.3)
                    .attr('stroke-width', 4)
                    .attr('stroke', '#ffeb3b');
            })
            .on('mousemove', function(event) {
                // 移动工具提示
                d3.select('.tooltip')
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 15) + 'px');
            })
            .on('mouseout', function(event, d) {
                // 移除工具提示
                d3.select('.tooltip').remove();
                
                // 恢复节点大小
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', d.radius)
                    .attr('stroke-width', 2)
                    .attr('stroke', '#fff');
            })
            .on('click', (event, d) => {
                // 显示单词详情
                this.showWordDetails(d.word);
            });
        
        // 添加文字标签
        const labels = g.selectAll('text')
            .data(nodes)
            .enter()
            .append('text')
            .attr('x', d => d.x)
            .attr('y', d => d.y)
            .attr('text-anchor', 'middle')
            .attr('dy', '0.3em')
            .attr('font-size', d => Math.max(8, Math.min(14, d.radius / 1.5)))
            .attr('fill', d => d.radius > 12 ? '#fff' : '#333')
            .attr('pointer-events', 'none')
            .attr('font-weight', d => d.radius > 15 ? 'bold' : 'normal')
            .text(d => {
                if (d.radius > 12 && d.word.length <= 10) {
                    return d.word;
                } else if (d.radius > 10 && d.word.length <= 8) {
                    return d.word;
                } else if (d.radius > 8) {
                    return d.word.length > 6 ? d.word.substring(0, 3) + '...' : d.word;
                } else {
                    return '';
                }
            });
        
        // 添加力导向布局
        const simulation = d3.forceSimulation(nodes)
            .force('charge', d3.forceManyBody().strength(-5))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(d => d.radius + 2))
            .on('tick', () => {
                circles
                    .attr('cx', d => d.x)
                    .attr('cy', d => d.y);
                
                labels
                    .attr('x', d => d.x)
                    .attr('y', d => d.y);
            });
        
        // 添加缩放功能
        const zoom = d3.zoom()
            .scaleExtent([0.1, 10])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });
        
        svg.call(zoom);
        
        // 添加鼠标滚轮和拖拽支持
        svg.on("wheel.zoom", null); // 允许默认滚轮行为
        svg.on("mousedown.zoom", null); // 允许默认鼠标行为
        
        // 添加缩放控制按钮
        this.addZoomControls(svg, zoom);
    }
    
    // 添加缩放控制按钮
    addZoomControls(svg, zoom) {
        const controls = d3.select('#vocabularyMap')
            .append('div')
            .attr('class', 'zoom-controls')
            .style('position', 'absolute')
            .style('top', '10px')
            .style('right', '10px')
            .style('display', 'flex')
            .style('flex-direction', 'column')
            .style('gap', '5px')
            .style('z-index', '100');
        
        // 放大按钮
        controls.append('button')
            .attr('class', 'zoom-btn')
            .html('<i class="fas fa-search-plus"></i>')
            .on('click', () => {
                svg.transition().call(zoom.scaleBy, 1.5);
            });
        
        // 缩小按钮
        controls.append('button')
            .attr('class', 'zoom-btn')
            .html('<i class="fas fa-search-minus"></i>')
            .on('click', () => {
                svg.transition().call(zoom.scaleBy, 0.75);
            });
        
        // 重置按钮
        controls.append('button')
            .attr('class', 'zoom-btn')
            .html('<i class="fas fa-sync-alt"></i>')
            .on('click', () => {
                svg.transition().call(zoom.transform, d3.zoomIdentity);
            });
        
        // 添加CSS样式
        const style = document.createElement('style');
        style.textContent = `
            .zoom-btn {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: white;
                border: 2px solid #3498db;
                color: #3498db;
                font-size: 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .zoom-btn:hover {
                background: #3498db;
                color: white;
                transform: scale(1.1);
            }
        `;
        document.head.appendChild(style);
    }
    
    // 显示单词详情
    async showWordDetails(word) {
        const stats = this.getWordStats(word);
        const translation = await this.getTranslation(word);
        const statusText = stats.status === 'known' ? '已掌握' : 
                          stats.status === 'review' ? '需复习' : '新单词';
        
        const detailsHtml = `
            <div class="word-detail-header">
                <h4>${word}</h4>
                <div class="word-translation">${translation}</div>
            </div>
            <div class="word-detail-stats">
                <p><strong>状态:</strong> <span class="status-badge ${stats.status}">${statusText}</span></p>
                <p><strong>掌握度:</strong> <span class="mastery-value">${stats.mastery || 0}%</span></p>
                <p><strong>复习次数:</strong> <span class="review-count">${stats.reviewCount || 0}</span></p>
                <p><strong>最后复习:</strong> <span class="last-reviewed">${stats.lastReviewed 
                    ? new Date(stats.lastReviewed).toLocaleString() 
                    : '从未'}</span></p>
            </div>
            <div class="word-actions">
                <button class="action-btn known-btn mark-detail-known" data-word="${word}">
                    <i class="fas fa-check-circle"></i> 标记为已掌握
                </button>
                <button class="action-btn review-btn mark-detail-review" data-word="${word}">
                    <i class="fas fa-redo"></i> 标记为需复习
                </button>
            </div>
        `;
        
        document.getElementById('selectedWordDetails').innerHTML = detailsHtml;
        
        // 添加详情页面的按钮事件
        document.querySelectorAll('.mark-detail-known').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const word = e.target.dataset.word;
                this.markWordAsKnown(word);
                await this.updateUI();
                await this.renderVocabularyMap();
                await this.showWordDetails(word);
            });
        });
        
        document.querySelectorAll('.mark-detail-review').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const word = e.target.dataset.word;
                this.markWordAsReview(word);
                await this.updateUI();
                await this.renderVocabularyMap();
                await this.showWordDetails(word);
            });
        });
    }
    
    // 更新日期显示
    updateDateDisplay() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('currentDate').textContent = 
            now.toLocaleDateString('zh-CN', options);
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 更新每日目标
        document.getElementById('updateGoalBtn').addEventListener('click', () => {
            const newGoal = parseInt(document.getElementById('dailyGoal').value);
            if (newGoal >= 5 && newGoal <= 50) {
                this.dailyGoal = newGoal;
                this.userData.dailyGoal = newGoal;
                this.saveUserData();
                this.generateTodayWords();
                this.updateUI();
                alert(`每日目标已更新为 ${newGoal} 个单词`);
            } else {
                alert('请输入5到50之间的数字');
            }
        });
        
        // 标记为已掌握
        document.getElementById('markKnownBtn').addEventListener('click', () => {
            if (this.todayWords.length > 0) {
                const currentWord = this.todayWords[this.currentWordIndex];
                this.markWordAsKnown(currentWord);
                this.nextWord();
            }
        });
        
        // 标记为需复习
        document.getElementById('markReviewBtn').addEventListener('click', () => {
            if (this.todayWords.length > 0) {
                const currentWord = this.todayWords[this.currentWordIndex];
                this.markWordAsReview(currentWord);
                this.nextWord();
            }
        });
        
        // 下一个单词
        document.getElementById('nextWordBtn').addEventListener('click', () => {
            this.nextWord();
        });
        
        // 重置今日任务
        document.getElementById('resetTaskBtn').addEventListener('click', () => {
            if (confirm('确定要重置今日任务吗？这将重新生成今日单词列表。')) {
                this.generateTodayWords();
                this.updateUI();
                alert('今日任务已重置！');
            }
        });
        
        // 刷新词汇地图
        document.getElementById('refreshMapBtn').addEventListener('click', () => {
            this.renderVocabularyMap();
            alert('词汇地图已刷新！');
        });
        
        // 筛选词汇地图
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            // 这里可以添加筛选逻辑
            alert(`已筛选: ${e.target.options[e.target.selectedIndex].text}`);
        });
        
        // 导出数据
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportUserData();
        });
        
        // 导入数据
        document.getElementById('importDataBtn').addEventListener('click', () => {
            this.importUserData();
        });
        
        // 显示帮助
        document.getElementById('helpBtn').addEventListener('click', () => {
            this.showHelpModal();
        });
        
        // 关闭帮助模态框
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.hideHelpModal();
        });
        
        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('helpModal');
            if (e.target === modal) {
                this.hideHelpModal();
            }
        });
        
        // 窗口大小改变时重新渲染地图
        window.addEventListener('resize', () => {
            this.renderVocabularyMap();
        });
    }
    
    // 下一个单词
    nextWord() {
        if (this.todayWords.length === 0) return;
        
        this.currentWordIndex++;
        if (this.currentWordIndex >= this.todayWords.length) {
            this.currentWordIndex = 0;
        }
        this.updateUI();
    }
    
    // 导出用户数据
    exportUserData() {
        const dataStr = JSON.stringify(this.userData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `word-memory-data-${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        alert('数据已导出！');
    }
    
    // 导入用户数据
    importUserData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    this.userData = importedData;
                    this.dailyGoal = this.userData.dailyGoal || 10;
                    this.saveUserData();
                    this.generateTodayWords();
                    this.updateUI();
                    this.renderVocabularyMap();
                    alert('数据导入成功！');
                } catch (error) {
                    alert('导入失败：文件格式不正确');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    // 显示帮助模态框
    showHelpModal() {
        document.getElementById('helpModal').style.display = 'flex';
    }
    
    // 更新筛选状态显示
    updateFilterStatus(filter, count) {
        // 尝试更新词汇地图页面的筛选状态
        const filterStatus = document.getElementById('filterStatus');
        const currentFilterText = document.getElementById('currentFilterText');
        const filteredCount = document.getElementById('filteredCount');
        
        if (filterStatus && currentFilterText && filteredCount) {
            let filterText;
            switch(filter) {
                case 'all': filterText = '全部单词'; break;
                case 'known': filterText = '已掌握'; break;
                case 'review': filterText = '需复习'; break;
                case 'new': filterText = '新单词'; break;
                default: filterText = '全部单词';
            }
            
            currentFilterText.textContent = filterText;
            filteredCount.textContent = count;
        }
    }
    
    // 隐藏帮助模态框
    hideHelpModal() {
        document.getElementById('helpModal').style.display = 'none';
    }
}

// 页面加载完成后初始化系统
document.addEventListener('DOMContentLoaded', () => {
    window.wordMemorySystem = new WordMemorySystem();
});
