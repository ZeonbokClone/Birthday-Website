// ===== 音乐和音效管理系统 =====
class AudioManager {
    constructor() {
        this.backgroundMusic = document.getElementById('backgroundMusic');
        this.fireworkLaunch = document.getElementById('fireworkLaunch');
        this.fireworkExplosions = [
            document.getElementById('fireworkExplosion1'),
            document.getElementById('fireworkExplosion2'),
            document.getElementById('fireworkExplosion3')
        ];
        this.birthdayMusic = document.getElementById('birthdayMusic');
        
        this.isPlaying = false;
        this.currentVolume = 0.3;
        this.soundEnabled = true;
        this.useGeneratedAudio = false;
        
        this.initializeAudio();
        this.setupMusicControls();
        this.createLocalAudioFiles();
    }
    
    // 创建本地音频文件（使用Web Audio API生成简单音效）
    createLocalAudioFiles() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 生成背景音乐（简单的和弦循环）
            this.createBackgroundMusicBuffer();
            
            // 生成烟花音效
            this.createFireworkSounds();
        } catch (error) {
            console.log('Web Audio API 不支持:', error);
            this.useGeneratedAudio = false;
        }
    }
    
    createBackgroundMusicBuffer() {
        const duration = 16; // 16秒循环，更长的旋律
        const sampleRate = this.audioContext.sampleRate;
        const numSamples = duration * sampleRate;
        const buffer = this.audioContext.createBuffer(2, numSamples, sampleRate);
        
        // 生日快乐的简单旋律（C大调）
        const melody = [
            {note: 261.63, start: 0, duration: 0.5},    // C
            {note: 261.63, start: 0.5, duration: 0.5},  // C
            {note: 293.66, start: 1, duration: 1},      // D
            {note: 261.63, start: 2, duration: 1},      // C
            {note: 349.23, start: 3, duration: 1},      // F
            {note: 329.63, start: 4, duration: 2},      // E
            
            {note: 261.63, start: 6, duration: 0.5},    // C
            {note: 261.63, start: 6.5, duration: 0.5},  // C
            {note: 293.66, start: 7, duration: 1},      // D
            {note: 261.63, start: 8, duration: 1},      // C
            {note: 392.00, start: 9, duration: 1},      // G
            {note: 349.23, start: 10, duration: 2},     // F
            
            {note: 261.63, start: 12, duration: 0.5},   // C
            {note: 261.63, start: 12.5, duration: 0.5}, // C
            {note: 523.25, start: 13, duration: 1},     // C5
            {note: 440.00, start: 14, duration: 1},     // A
            {note: 349.23, start: 15, duration: 0.5},   // F
            {note: 329.63, start: 15.5, duration: 0.5}, // E
        ];
        
        // 和弦进行
        const chords = [
            {notes: [261.63, 329.63, 392.00], start: 0, duration: 4},    // C major
            {notes: [349.23, 440.00, 523.25], start: 4, duration: 2},    // F major
            {notes: [261.63, 329.63, 392.00], start: 6, duration: 4},    // C major
            {notes: [392.00, 493.88, 587.33], start: 10, duration: 2},   // G major
            {notes: [261.63, 329.63, 392.00], start: 12, duration: 4},   // C major
        ];
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < numSamples; i++) {
                const time = i / sampleRate;
                let sample = 0;
                
                // 主旋律
                melody.forEach(note => {
                    if (time >= note.start && time < note.start + note.duration) {
                        const noteTime = time - note.start;
                        const envelope = Math.exp(-noteTime * 2) * (1 - noteTime / note.duration);
                        const vibrato = 1 + 0.02 * Math.sin(2 * Math.PI * 5 * noteTime); // 轻微颤音
                        sample += Math.sin(2 * Math.PI * note.note * vibrato * noteTime) * envelope * 0.15;
                    }
                });
                
                // 和弦背景
                chords.forEach(chord => {
                    if (time >= chord.start && time < chord.start + chord.duration) {
                        const chordTime = time - chord.start;
                        const envelope = Math.exp(-chordTime * 0.5) * 0.7;
                        chord.notes.forEach(freq => {
                            sample += Math.sin(2 * Math.PI * freq * chordTime) * envelope * 0.05;
                        });
                    }
                });
                
                // 轻柔的白噪声作为背景
                sample += (Math.random() * 2 - 1) * 0.01;
                
                // 限制音量
                sample = Math.max(-0.5, Math.min(0.5, sample));
                
                channelData[i] = sample;
            }
        }
        
        this.backgroundMusicBuffer = buffer;
    }
    
    createFireworkSounds() {
        // 烟花发射音效
        this.launchBuffer = this.createNoiseBuffer(0.5, 'launch');
        
        // 爆炸音效
        this.explosionBuffers = [
            this.createNoiseBuffer(1.2, 'explosion'),
            this.createNoiseBuffer(1.0, 'explosion'),
            this.createNoiseBuffer(1.5, 'explosion')
        ];
    }
    
    createNoiseBuffer(duration, type) {
        const sampleRate = this.audioContext.sampleRate;
        const numSamples = duration * sampleRate;
        const buffer = this.audioContext.createBuffer(2, numSamples, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < numSamples; i++) {
                const time = i / sampleRate;
                let sample = 0;
                
                if (type === 'launch') {
                    // 更真实的发射音效：嘶嘶声 + 上升哨叫
                    const progress = time / duration;
                    
                    // 嘶嘶声成分（高频噪音）
                    const hiss = (Math.random() - 0.5) * 0.3 * Math.pow(1 - progress, 2);
                    
                    // 哨叫成分（频率上升）
                    const whistleFreq = 300 + progress * 1500; // 300Hz -> 1800Hz
                    const whistle = Math.sin(2 * Math.PI * whistleFreq * time) * (1 - progress) * 0.4;
                    
                    // 低频隆隆声
                    const rumble = Math.sin(2 * Math.PI * 50 * time) * (1 - progress) * 0.2;
                    
                    sample = hiss + whistle + rumble;
                } else if (type === 'explosion') {
                    // 更真实的爆炸音效
                    const progress = time / duration;
                    
                    // 初始爆炸冲击（前0.1秒）
                    if (progress < 0.1) {
                        // 强烈的初始爆炸声
                        const impact = Math.pow(1 - progress * 10, 3);
                        sample = (Math.random() - 0.5) * impact;
                        // 低频冲击波
                        sample += Math.sin(2 * Math.PI * 30 * time) * impact * 0.8;
                    }
                    
                    // 爆炸回响和碎片声（0.1秒后）
                    else {
                        const envelope = Math.exp(-3 * progress);
                        
                        // 多层次噪音模拟碎片
                        const crackle = (Math.random() - 0.5) * envelope * 0.6;
                        
                        // 低频隆隆声
                        const rumble = Math.sin(2 * Math.PI * 40 * time) * envelope * 0.3;
                        const rumble2 = Math.sin(2 * Math.PI * 80 * time) * envelope * 0.2;
                        
                        // 中频共鸣
                        const resonance = Math.sin(2 * Math.PI * 150 * time) * envelope * 0.15;
                        
                        sample = crackle + rumble + rumble2 + resonance;
                    }
                }
                
                // 限制振幅防止削波
                sample = Math.max(-1, Math.min(1, sample));
                channelData[i] = sample;
            }
        }
        
        return buffer;
    }
    
    initializeAudio() {
        // 设置初始音量
        this.setVolume(this.currentVolume);
        
        // 处理音频加载错误，使用生成的音频
        if (this.backgroundMusic) {
            this.backgroundMusic.addEventListener('error', () => {
                console.log('背景音乐加载失败，使用生成音频');
                this.useGeneratedAudio = true;
            });
            
            // 音频可以播放时的处理
            this.backgroundMusic.addEventListener('canplaythrough', () => {
                console.log('背景音乐加载成功');
            });
            
            // 循环播放背景音乐
            this.backgroundMusic.loop = true;
        }
    }
    
    setupMusicControls() {
        const musicToggle = document.getElementById('musicToggle');
        const volumeToggle = document.getElementById('volumeToggle');
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeSliderContainer = document.getElementById('volumeSliderContainer');
        const musicIcon = document.querySelector('.music-icon');
        const volumeIcon = document.querySelector('.volume-icon');
        
        if (!musicToggle) return;
        
        // 播放/暂停切换
        musicToggle.addEventListener('click', () => {
            this.toggleMusic();
            musicToggle.classList.toggle('active', this.isPlaying);
            if (musicIcon) {
                musicIcon.classList.toggle('playing', this.isPlaying);
                musicIcon.textContent = this.isPlaying ? '⏸️' : '🎵';
            }
        });
        
        // 音量控制切换
        if (volumeToggle && volumeSliderContainer) {
            volumeToggle.addEventListener('click', () => {
                volumeSliderContainer.classList.toggle('show');
                if (volumeIcon) {
                    volumeIcon.classList.add('animating');
                    setTimeout(() => volumeIcon.classList.remove('animating'), 500);
                }
            });
        }
        
        // 音量滑块
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.currentVolume = e.target.value / 100;
                this.setVolume(this.currentVolume);
                this.updateVolumeIcon();
            });
            
            // 设置初始音量滑块值
            volumeSlider.value = this.currentVolume * 100;
        }
    }
    
    toggleMusic() {
        if (this.isPlaying) {
            this.pauseMusic();
        } else {
            this.playMusic();
        }
    }
    
    async playMusic() {
        try {
            // 确保音频上下文已启动
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            if (this.useGeneratedAudio && this.backgroundMusicBuffer) {
                this.playGeneratedMusic();
            } else if (this.backgroundMusic) {
                await this.backgroundMusic.play();
            }
            this.isPlaying = true;
            console.log('音乐开始播放');
        } catch (error) {
            console.log('音乐播放失败，尝试生成音频:', error);
            if (this.backgroundMusicBuffer) {
                this.useGeneratedAudio = true;
                this.playGeneratedMusic();
            }
        }
    }
    
    playGeneratedMusic() {
        if (this.generatedMusicSource) {
            this.generatedMusicSource.stop();
        }
        
        this.generatedMusicSource = this.audioContext.createBufferSource();
        this.generatedMusicSource.buffer = this.backgroundMusicBuffer;
        this.generatedMusicSource.loop = true;
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = this.currentVolume;
        
        this.generatedMusicSource.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        this.generatedMusicSource.start();
        this.isPlaying = true;
    }
    
    pauseMusic() {
        if (this.useGeneratedAudio && this.generatedMusicSource) {
            this.generatedMusicSource.stop();
            this.generatedMusicSource = null;
        } else if (this.backgroundMusic) {
            this.backgroundMusic.pause();
        }
        this.isPlaying = false;
        console.log('音乐暂停');
    }
    
    setVolume(volume) {
        this.currentVolume = Math.max(0, Math.min(1, volume));
        
        if (this.backgroundMusic) this.backgroundMusic.volume = this.currentVolume;
        if (this.birthdayMusic) this.birthdayMusic.volume = this.currentVolume;
        
        if (this.fireworkLaunch) this.fireworkLaunch.volume = this.currentVolume * 0.7;
        this.fireworkExplosions.forEach(audio => {
            if (audio) audio.volume = this.currentVolume * 0.8;
        });
        
        this.updateVolumeIcon();
    }
    
    updateVolumeIcon() {
        const volumeIcon = document.querySelector('.volume-icon');
        if (!volumeIcon) return;
        
        if (this.currentVolume === 0) {
            volumeIcon.textContent = '🔇';
        } else if (this.currentVolume < 0.3) {
            volumeIcon.textContent = '🔈';
        } else if (this.currentVolume < 0.7) {
            volumeIcon.textContent = '🔉';
        } else {
            volumeIcon.textContent = '🔊';
        }
    }
    
    // 播放烟花发射音效
    async playFireworkLaunch() {
        if (!this.soundEnabled) return;
        
        try {
            // 确保音频上下文已启动
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // 总是使用生成的音效，因为更可靠
            if (this.audioContext && this.launchBuffer) {
                this.playGeneratedSound(this.launchBuffer);
            }
        } catch (error) {
            console.log('烟花发射音效播放失败:', error);
        }
    }
    
    // 播放烟花爆炸音效
    async playFireworkExplosion() {
        if (!this.soundEnabled) return;
        
        try {
            // 确保音频上下文已启动
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            const randomIndex = Math.floor(Math.random() * (this.explosionBuffers?.length || 3));
            
            // 总是使用生成的音效，因为更可靠
            if (this.audioContext && this.explosionBuffers && this.explosionBuffers[randomIndex]) {
                this.playGeneratedSound(this.explosionBuffers[randomIndex]);
            }
        } catch (error) {
            console.log('烟花爆炸音效播放失败:', error);
        }
    }
    
    playGeneratedSound(buffer) {
        if (!this.audioContext || !buffer) return;
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = this.currentVolume;
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        source.start();
    }
    
    // 播放生日快乐音乐
    playBirthdayMusic() {
        try {
            if (this.birthdayMusic) {
                this.birthdayMusic.currentTime = 0;
                this.birthdayMusic.play();
            }
        } catch (error) {
            console.log('生日音乐播放失败:', error);
        }
    }
    
    // 停止所有音效
    stopAllSounds() {
        this.pauseMusic();
        if (this.birthdayMusic) {
            this.birthdayMusic.pause();
            this.birthdayMusic.currentTime = 0;
        }
    }
}

// 全局音频管理器
let audioManager;

// 初始化页面和进度指示器
document.addEventListener('DOMContentLoaded', function () {
    // 初始化音频管理器
    audioManager = new AudioManager();
    // 确保页面从顶部开始
    window.scrollTo(0, 0);
    const sections = document.querySelectorAll('.page-section');
    const indicatorItems = document.querySelectorAll('.progress-indicator li');

    // 监听滚动更新指示器
    window.addEventListener('scroll', () => {
        let current = 0;
        sections.forEach((section, idx) => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= window.innerHeight / 2) {
                current = idx;
            }
        });
        indicatorItems.forEach((li, idx) => {
            li.classList.toggle('active', idx === current);
        });
    });

    // 进度指示器点击跳转
    indicatorItems.forEach((li, idx) => {
        li.addEventListener('click', () => {
            sections[idx].scrollIntoView({ behavior: 'smooth' });
        });
    });

    // 导航链接平滑滚动
    document.querySelectorAll('.top-nav .menu a').forEach(a => {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ===== 魔镜主页功能 =====

    // 星空背景动画
    function drawStarfield() {
        const canvas = document.getElementById('starfield');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let w = window.innerWidth;
        let h = window.innerHeight;
        canvas.width = w;
        canvas.height = h;
        const stars = Array.from({length: 120}, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 1.2 + 0.3,
            o: Math.random() * 0.5 + 0.5,
            s: Math.random() * 0.3 + 0.1
        }));
        function animate() {
            ctx.clearRect(0, 0, w, h);
            for (const star of stars) {
                ctx.save();
                ctx.globalAlpha = star.o;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.r, 0, 2 * Math.PI);
                ctx.fillStyle = '#fff';
                ctx.shadowColor = '#FEE440';
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.restore();
                star.x += star.s;
                if (star.x > w) star.x = 0;
            }
            requestAnimationFrame(animate);
        }
        animate();
        window.addEventListener('resize', () => {
            w = window.innerWidth;
            h = window.innerHeight;
            canvas.width = w;
            canvas.height = h;
        });
    }

    // 魔镜回应动画
    function showMirrorResponse(text) {
        const resp = document.getElementById('mirrorResponse');
        if (!resp) return;
        resp.textContent = text;
        resp.classList.remove('animate', 'text-sparkle');
        void resp.offsetWidth; // 强制重绘
        resp.classList.add('animate', 'text-sparkle');
        
        // 添加烟花粒子特效
        createTextSparkles(resp);
    }
    
    // 创建文字烟花特效
    function createTextSparkles(element) {
        const rect = element.getBoundingClientRect();
        const container = element.parentElement;
        
        // 清除之前的粒子
        const oldParticles = container.querySelectorAll('.sparkle-particle');
        oldParticles.forEach(p => p.remove());
        
        // 创建新的烟花粒子
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'sparkle-particle';
                
                // 随机位置在文字周围
                const x = Math.random() * rect.width;
                const y = Math.random() * rect.height;
                
                particle.style.left = x + 'px';
                particle.style.top = y + 'px';
                particle.style.animationDelay = Math.random() * 0.5 + 's';
                
                element.appendChild(particle);
                
                // 动画结束后移除粒子
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.remove();
                    }
                }, 1500);
            }, i * 100);
        }
    }

    // 粒子爆发动画
    function mirrorParticles(x, y) {
        const container = document.querySelector('.magic-mirror-container');
        if (!container) return;
        const colors = ['#9B5DE5', '#F15BB5', '#FEE440', '#fff'];
        for (let i = 0; i < 24; i++) {
            const p = document.createElement('div');
            p.className = 'mirror-particle';
            p.style.background = colors[Math.floor(Math.random()*colors.length)];
            p.style.left = x + 'px';
            p.style.top = y + 'px';
            p.style.setProperty('--angle', (Math.random()*360)+'deg');
            p.style.setProperty('--dist', (40+Math.random()*60)+'px');
            container.appendChild(p);
            setTimeout(() => p.remove(), 900);
        }
    }

    // 输入框交互
    function setupMirrorInput() {
        const form = document.getElementById('mirrorInputForm');
        const input = document.getElementById('mirrorInput');
        if (!form || !input) return;
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const val = input.value.trim();
            if (!val) return;
            // 粒子动画在镜子中心
            const mirror = document.querySelector('.magic-mirror');
            if (mirror) {
                const rect = mirror.getBoundingClientRect();
                mirrorParticles(rect.left + rect.width/2, rect.top + rect.height/2);
            }
            // 魔镜回应 - 丰富的交互逻辑
            let reply = '魔镜听到了你的声音~';
            
            // 关于Zilin的询问
            if (/zilin|紫琳|hello|hi|你好/i.test(val)) {
                const zilinReplies = [
                    'Zilin是世界上最美的人！✨',
                    '遇见Zilin是这个世界最美好的事~',
                    'Zilin的笑容比星星还亮！🌟',
                    '你说的是那个可爱到不行的Zilin吗？💕'
                ];
                reply = zilinReplies[Math.floor(Math.random() * zilinReplies.length)];
            }
            // 生日相关
            else if (/生日|happy birthday|祝福|birthday/i.test(val)) {
                const birthdayReplies = [
                    '生日快乐！愿你的每一天都充满阳光！🎂',
                    '今天是特别的日子吗？生日快乐！🎉',
                    '愿所有美好如期而至，生日快乐！🌸',
                    '又长大一岁啦！生日快乐，永远年轻美丽！✨'
                ];
                reply = birthdayReplies[Math.floor(Math.random() * birthdayReplies.length)];
                
                // 检查是否是生日当天，如果是则触发烟花
                const now = new Date();
                const birthdayDate = new Date('2025-07-28T00:00:00+01:00');
                const diff = birthdayDate - now;
                
                if (diff <= 0 && /生日快乐/i.test(val)) {
                    // 延迟一秒后跳转到倒计时页面并触发烟花
                    setTimeout(() => {
                        document.getElementById('countdown').scrollIntoView({ behavior: 'smooth' });
                        setTimeout(() => {
                            const testFireworksBtn = document.getElementById('testFireworksBtn');
                            if (testFireworksBtn) {
                                testFireworksBtn.click();
                            }
                        }, 1000);
                    }, 1000);
                }
            }
            // 爱意表达
            else if (/love|爱|喜欢|想你/i.test(val)) {
                const loveReplies = [
                    '爱你哦~ 💖',
                    '心中满满都是爱呢~',
                    '被爱包围的感觉真好！💕',
                    '爱意满满，幸福加倍！✨',
                    '这份爱，魔镜都感受到了~'
                ];
                reply = loveReplies[Math.floor(Math.random() * loveReplies.length)];
            }
            // 最美询问
            else if (/最美|谁最美|最漂亮|最好看|beautiful/i.test(val)) {
                const beautyReplies = [
                    '当然是Zilin最美啦！无可争议！👑',
                    '还用问吗？当然是可爱的Zilin！',
                    'Zilin的美貌让星星都黯然失色~',
                    '世界上最美的人？那必须是Zilin！✨'
                ];
                reply = beautyReplies[Math.floor(Math.random() * beautyReplies.length)];
            }
            // 心情相关
            else if (/心情|开心|高兴|快乐|happy|sad|难过|伤心/i.test(val)) {
                if (/开心|高兴|快乐|happy/i.test(val)) {
                    const happyReplies = [
                        '看到你开心，魔镜也很开心呢！😊',
                        '快乐是会传染的，继续保持哦！',
                        '开心的笑容最美丽了！✨',
                        '愿这份快乐永远伴随你~'
                    ];
                    reply = happyReplies[Math.floor(Math.random() * happyReplies.length)];
                } else {
                    const sadReplies = [
                        '别难过，魔镜陪着你~',
                        '每朵云都有银边，困难会过去的💪',
                        '你值得所有美好，加油！',
                        '给你一个魔镜牌拥抱！🤗'
                    ];
                    reply = sadReplies[Math.floor(Math.random() * sadReplies.length)];
                }
            }
            // 时间相关
            else if (/时间|几点|今天|明天|时候/i.test(val)) {
                const timeReplies = [
                    '时间过得真快，要珍惜当下哦~',
                    '每一刻都是珍贵的回忆！',
                    '时光荏苒，但美好永恒✨',
                    '现在就是最好的时候！'
                ];
                reply = timeReplies[Math.floor(Math.random() * timeReplies.length)];
            }
            // 梦想愿望
            else if (/梦想|愿望|希望|想要|wish|dream/i.test(val)) {
                const dreamReplies = [
                    '梦想一定会实现的，加油！🌟',
                    '魔镜许你一个美好的愿望~',
                    '相信自己，梦想会照进现实！',
                    '愿望很美好，努力去实现吧！✨'
                ];
                reply = dreamReplies[Math.floor(Math.random() * dreamReplies.length)];
            }
            // 魔镜相关
            else if (/魔镜|mirror|你是谁|你好/i.test(val)) {
                const mirrorReplies = [
                    '我是知晓一切的魔镜~',
                    '我是你最忠实的魔镜朋友！✨',
                    '魔镜魔镜，为你服务~',
                    '我是这里最神奇的魔镜！🪞'
                ];
                reply = mirrorReplies[Math.floor(Math.random() * mirrorReplies.length)];
            }
            // 天气相关
            else if (/天气|下雨|晴天|weather/i.test(val)) {
                const weatherReplies = [
                    '无论什么天气，你都是最美的风景！',
                    '阳光不如你的笑容灿烂~',
                    '就算下雨，你也是我心中的晴天！☀️',
                    '天气很好呢，就像遇见你一样美好！'
                ];
                reply = weatherReplies[Math.floor(Math.random() * weatherReplies.length)];
            }
            // 食物相关
            else if (/饿|吃|食物|好吃|food/i.test(val)) {
                const foodReplies = [
                    '记得好好吃饭哦，健康最重要！',
                    '美食配美人，完美！😋',
                    '吃饱饱才有力气变更美哦~',
                    '愿你的生活像蜂蜜一样甜！🍯'
                ];
                reply = foodReplies[Math.floor(Math.random() * foodReplies.length)];
            }
            // 睡觉相关
            else if (/困|睡觉|晚安|sleep|tired/i.test(val)) {
                const sleepReplies = [
                    '晚安，愿你有个甜美的梦~',
                    '好好休息，明天又是美好的一天！',
                    '睡个好觉，梦里都是快乐！😴',
                    '魔镜陪你入眠，晚安亲爱的~'
                ];
                reply = sleepReplies[Math.floor(Math.random() * sleepReplies.length)];
            }
            // 工作学习
            else if (/工作|学习|忙|累|tired|work|study/i.test(val)) {
                const workReplies = [
                    '辛苦了！记得劳逸结合哦~',
                    '努力的你最棒了！💪',
                    '忙碌中也要照顾好自己！',
                    '加油！你一定可以的！✨'
                ];
                reply = workReplies[Math.floor(Math.random() * workReplies.length)];
            }
            // 默认回复（增加多样性，带引导）
            else {
                const defaultReplies = [
                    '魔镜听到了你的话~ 想聊聊别的吗？',
                    '你说的很有道理呢！还有什么想分享的？',
                    '继续和魔镜聊天吧~ 比如问问"谁最美"？',
                    '魔镜很喜欢听你说话！今天开心吗？',
                    '有什么想问魔镜的吗？试试"生日快乐"？',
                    '你的话让魔镜很开心呢~ 想听听赞美吗？',
                    '魔镜在认真听哦！✨ 聊聊Zilin怎么样？'
                ];
                reply = defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
            }
            showMirrorResponse(reply);
            input.value = '';
            
            // 重置提示计时器
            if (window.resetMirrorHint) {
                window.resetMirrorHint();
            }
        });
    }

    // 粒子样式
    const style = document.createElement('style');
    style.textContent = `
.mirror-particle {
    position: fixed;
    width: 10px; height: 10px;
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999;
    animation: mirror-particle-explode 0.9s cubic-bezier(.68,-0.55,.27,1.55) forwards;
}
@keyframes mirror-particle-explode {
    0% { opacity: 1; transform: translate(0,0) scale(1); }
    80% { opacity: 1; }
    100% { opacity: 0; transform: rotate(var(--angle)) translate(var(--dist)) scale(0.5); }
}
`;
    document.head.appendChild(style);

    // 魔镜引导提示功能
    function setupMirrorHints() {
        const mirrorResponse = document.getElementById('mirrorResponse');
        if (!mirrorResponse) return;
        
        // 主动提示问题列表
        const hintQuestions = [
            "想听魔镜夸夸Zilin吗？试试输入'Zilin'~ 💕",
            "今天心情怎么样？告诉魔镜'开心'或'难过'吧~",
            "问问魔镜'谁最美'，让我告诉你答案！👑", 
            "输入'生日快乐'让魔镜送上祝福！🎂",
            "告诉魔镜'爱你'，听听甜蜜回应~ 💖",
            "想知道魔镜的身份？问问'你是谁'吧！🪞",
            "聊聊天气如何？输入'天气'试试看~",
            "困了吗？输入'晚安'获得温馨祝福😴",
            "工作累了吗？告诉魔镜'累了'~ 💪",
            "有什么梦想？和魔镜聊聊'愿望'吧！🌟"
        ];
        
        let hintIndex = 0;
        let isShowingHint = false;
        
        // 无操作15秒后显示提示
        function showHint() {
            if (!isShowingHint) {
                isShowingHint = true;
                const question = hintQuestions[hintIndex % hintQuestions.length];
                showMirrorResponse(question);
                hintIndex++;
                
                // 5秒后清空显示内容
                setTimeout(() => {
                    if (isShowingHint) {
                        const resp = document.getElementById('mirrorResponse');
                        if (resp) {
                            resp.textContent = '';
                            resp.classList.remove('animate', 'text-sparkle');
                        }
                    }
                }, 5000);
            }
        }
        
        let hintTimer;
        
        // 重置提示计时器
        function resetHintTimer() {
            isShowingHint = false;
            clearTimeout(hintTimer);
            hintTimer = setTimeout(showHint, 15000);
        }
        
        // 监听用户交互
        const mirrorInput = document.getElementById('mirrorInput');
        if (mirrorInput) {
            mirrorInput.addEventListener('focus', resetHintTimer);
            mirrorInput.addEventListener('input', resetHintTimer);
        }
        
        // 初始启动提示计时器
        resetHintTimer();
        
        // 暴露重置方法给其他函数使用
        window.resetMirrorHint = resetHintTimer;
    }

    // 初始化魔镜
    if (document.getElementById('mirror')) {
        drawStarfield();
        setupMirrorInput();
        setupMirrorHints();
    }

    // ===== 童话故事书功能 =====
    
    function setupStorybook() {
        console.log('Setting up storybook...');
        const pages = document.querySelectorAll('#storybook-flipbook .page');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const currentPageSpan = document.getElementById('currentPage');
        const totalPagesSpan = document.getElementById('totalPages');
        
        console.log('Found', pages.length, 'pages');
        console.log('Prev button:', prevBtn);
        console.log('Next button:', nextBtn);
        
        if (!pages.length || !prevBtn || !nextBtn) {
            console.error('Storybook setup failed - missing elements');
            return;
        }
        
        let currentPage = 0;
        const totalPages = pages.length;
        
        // 设置总页数
        if (totalPagesSpan) totalPagesSpan.textContent = totalPages;
        
        // 初始化页面状态
        pages.forEach((page, index) => {
            // 限制Z-index，避免覆盖控件，确保正确的层叠顺序
            const zIndex = Math.min(99, totalPages - index);
            page.style.zIndex = zIndex;
            page.style.transform = 'rotateY(0deg)';
            page.style.transformOrigin = 'left center';
            page.style.transition = 'transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1)';
            // 不要重新设置position，使用CSS中的设置
            page.style.top = '0';
            page.style.left = '0';
            
            // 获取页面标题用于调试
            const title = page.querySelector('h3') ? page.querySelector('h3').textContent : 
                         page.querySelector('h1') ? page.querySelector('h1').textContent : 
                         `Page ${index + 1}`;
            console.log(`Page ${index}: "${title}" z-index = ${zIndex}`);
        });
        
        // 更新页码显示
        function updatePageNumber() {
            if (currentPageSpan) {
                currentPageSpan.textContent = currentPage + 1;
            }
            prevBtn.disabled = currentPage === 0;
            nextBtn.disabled = currentPage === totalPages - 1;
        }
        
        // 翻页动画
        function flipPage(direction) {
            console.log('Flip page:', direction, 'Current page:', currentPage);
            if (direction === 'next' && currentPage < totalPages - 1) {
                const page = pages[currentPage];
                page.style.transform = 'rotateY(-180deg)';
                page.style.zIndex = Math.min(99, currentPage);
                currentPage++;
                console.log('Flipped to page:', currentPage + 1);
            } else if (direction === 'prev' && currentPage > 0) {
                currentPage--;
                const page = pages[currentPage];
                page.style.transform = 'rotateY(0deg)';
                page.style.zIndex = Math.min(99, totalPages - currentPage);
                console.log('Flipped back to page:', currentPage + 1);
            }
            updatePageNumber();
        }
        
        // 绑定按钮事件
        nextBtn.addEventListener('click', () => {
            console.log('Next button clicked');
            flipPage('next');
        });
        prevBtn.addEventListener('click', () => {
            console.log('Prev button clicked');
            flipPage('prev');
        });
        
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('storybook').getBoundingClientRect().top <= window.innerHeight / 2) {
                if (e.key === 'ArrowRight') flipPage('next');
                if (e.key === 'ArrowLeft') flipPage('prev');
            }
        });
        
        updatePageNumber();
    }
    
    // 初始化故事书
    if (document.getElementById('storybook')) {
        setupStorybook();
    }

    // ===== 心动相册功能 =====
    
    function setupAlbum() {
        const gallery = document.getElementById('photoGallery');
        const modal = document.getElementById('photoModal');
        const modalImg = document.getElementById('modalImg');
        const modalCaption = document.getElementById('modalCaption');
        const modalClose = document.querySelector('.modal-close');
        const filterBtns = document.querySelectorAll('.timeline-btn');
        const photoItems = document.querySelectorAll('.photo-item');
        
        if (!gallery || !modal) return;
        
        // 筛选功能
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // 更新按钮状态
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                const filter = this.dataset.filter;
                
                // 筛选照片
                photoItems.forEach((item, index) => {
                    const year = item.dataset.year;
                    
                    if (filter === 'all' || year === filter) {
                        item.style.display = 'block';
                        // 延迟动画效果
                        setTimeout(() => {
                            item.style.animation = 'none';
                            void item.offsetWidth; // 触发重绘
                            item.style.animation = 'fadeInUp 0.6s ease-out';
                        }, index * 50);
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
        
        // 点击图片打开模态框
        photoItems.forEach(item => {
            item.addEventListener('click', function() {
                const img = this.querySelector('img');
                const title = this.querySelector('.photo-title').textContent;
                const desc = this.querySelector('.photo-description').textContent;
                const date = this.querySelector('.photo-date').textContent;
                
                modal.style.display = 'block';
                modalImg.src = img.src;
                modalCaption.innerHTML = `<strong>${title}</strong><br>${desc}<br><small>${date}</small>`;
                
                // 防止背景滚动
                document.body.style.overflow = 'hidden';
            });
        });
        
        // 关闭模态框
        modalClose.addEventListener('click', closeModal);
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        function closeModal() {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        
        // ESC键关闭
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                closeModal();
            }
        });
        
        // 懒加载图片
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    // 实际使用时替换为真实图片URL
                    // img.src = img.dataset.src;
                    observer.unobserve(img);
                }
            });
        });
        
        photoItems.forEach(item => {
            const img = item.querySelector('img');
            imageObserver.observe(img);
        });
    }
    
    // 初始化相册
    if (document.getElementById('album')) {
        setupAlbum();
    }

    // ===== 生日倒计时功能 =====
    
    function setupCountdown() {
        // 设置生日日期为7月28日英国时间 (UTC+1)
        const birthdayDate = new Date('2025-07-28T00:00:00+01:00');
        const countdownDisplay = document.getElementById('countdownDisplay');
        const fireworksContainer = document.getElementById('fireworksContainer');
        const floatingCountdown = document.getElementById('floatingCountdown');
        
        if (!countdownDisplay) return;

        

        
        function updateCountdown() {
            const now = new Date();
            const diff = birthdayDate - now;
            
            if (diff <= 0) {
                // 生日当天，但只在第一次到达零点时自动弹出
                const hasShownAutoSurprise = localStorage.getItem('birthdayAutoShown2025');
                const currentDate = now.toLocaleDateString();
                
                // 检查是否是生日当天的零点附近（前后5分钟）
                const isAroundMidnight = now.getHours() === 0 && now.getMinutes() < 5;
                
                if (!hasShownAutoSurprise && isAroundMidnight) {
                    // 标记已自动显示过
                    localStorage.setItem('birthdayAutoShown2025', currentDate);
                    showBirthdaySurprise();
                }
                
                // 更新显示为生日当天
                document.getElementById('days').textContent = '00';
                document.getElementById('hours').textContent = '00';
                document.getElementById('minutes').textContent = '00';
                document.getElementById('seconds').textContent = '00';
                
                if (floatingCountdown) {
                    floatingCountdown.textContent = '🎉 生日快乐！';
                    floatingCountdown.classList.add('birthday-today');
                }
                return;
            }
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            document.getElementById('days').textContent = String(days).padStart(2, '0');
            document.getElementById('hours').textContent = String(hours).padStart(2, '0');
            document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
            document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
            
            // 更新悬浮倒计时
            if (floatingCountdown) {
                if (days > 0) {
                    floatingCountdown.textContent = `🎂 还有 ${days} 天`;
                } else if (hours > 0) {
                    floatingCountdown.textContent = `🎂 还有 ${hours} 小时`;
                } else {
                    floatingCountdown.textContent = `🎂 还有 ${minutes} 分钟`;
                }
            }
        }
        
        function showBirthdaySurprise() {
            // 只有在倒计时页面可见时才显示烟花
            const countdownSection = document.getElementById('countdown');
            const rect = countdownSection.getBoundingClientRect();
            const isCountdownVisible = rect.top <= window.innerHeight && rect.bottom >= 0;
            
            if (isCountdownVisible) {
                countdownDisplay.style.display = 'none';
                if (fireworksContainer) {
                    fireworksContainer.style.display = 'block';
                    startFireworks();
                    
                    // 播放生日快乐音乐
                    if (audioManager) {
                        setTimeout(() => {
                            audioManager.playBirthdayMusic();
                        }, 1000); // 延迟1秒播放，让烟花先开始
                    }
                }
            }
            
            if (floatingCountdown) {
                floatingCountdown.textContent = '🎉 生日快乐！';
                floatingCountdown.classList.add('birthday-today');
            }
        }
        
        // 简化烟花效果
        function startFireworks() {
            const canvas = document.getElementById('fireworksCanvas');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            const fireworks = [];
            const particles = [];
            
            // 生日主题色彩
            const colors = ['#FF69B4', '#FFD700', '#9370DB', '#00CED1', '#FF4500', '#32CD32'];
            
            class Firework {
                constructor() {
                    this.x = Math.random() * canvas.width;
                    this.y = canvas.height;
                    this.targetY = Math.random() * (canvas.height * 0.5) + 50;
                    this.speed = Math.random() * 3 + 5;
                    this.color = colors[Math.floor(Math.random() * colors.length)];
                    
                    // 播放发射音效
                    if (audioManager) {
                        audioManager.playFireworkLaunch();
                    }
                }
                
                update() {
                    this.y -= this.speed;
                    
                    if (this.y <= this.targetY) {
                        this.explode();
                        return true; // 移除这个烟花
                    }
                    return false;
                }
                
                explode() {
                    // 播放爆炸音效
                    if (audioManager) {
                        audioManager.playFireworkExplosion();
                    }
                    
                    // 创建粒子
                    const particleCount = 20 + Math.random() * 20;
                    for (let i = 0; i < particleCount; i++) {
                        const angle = (Math.PI * 2 * i) / particleCount;
                        const speed = Math.random() * 4 + 2;
                        particles.push(new Particle(
                            this.x, 
                            this.y, 
                            this.color,
                            Math.cos(angle) * speed,
                            Math.sin(angle) * speed
                        ));
                    }
                }
                
                draw() {
                    ctx.save();
                    ctx.fillStyle = this.color;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = this.color;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }
            
            class Particle {
                constructor(x, y, color, vx, vy) {
                    this.x = x;
                    this.y = y;
                    this.vx = vx;
                    this.vy = vy;
                    this.color = color;
                    this.opacity = 1;
                    this.size = Math.random() * 3 + 1;
                    this.gravity = 0.05;
                    this.friction = 0.98;
                }
                
                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vy += this.gravity;
                    this.vx *= this.friction;
                    this.vy *= this.friction;
                    this.opacity -= 0.01;
                    
                    return this.opacity <= 0;
                }
                
                draw() {
                    ctx.save();
                    ctx.globalAlpha = this.opacity;
                    ctx.fillStyle = this.color;
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = this.color;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }
            
            function animate() {
                // 清除画布
                ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // 随机创建新烟花
                if (Math.random() < 0.05) {
                    fireworks.push(new Firework());
                }
                
                // 更新和绘制烟花
                for (let i = fireworks.length - 1; i >= 0; i--) {
                    if (fireworks[i].update()) {
                        fireworks.splice(i, 1);
                    } else {
                        fireworks[i].draw();
                    }
                }
                
                // 更新和绘制粒子
                for (let i = particles.length - 1; i >= 0; i--) {
                    if (particles[i].update()) {
                        particles.splice(i, 1);
                    } else {
                        particles[i].draw();
                    }
                }
                
                // 保存动画ID以便停止
                window.fireworksAnimationId = requestAnimationFrame(animate);
            }
            
            animate();
            
            // 窗口大小变化时重新设置画布
            window.addEventListener('resize', () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            });
        }
        
        // 每秒更新倒计时
        updateCountdown();
        setInterval(updateCountdown, 1000);
        
        // 悬浮球点击跳转到倒计时
        if (floatingCountdown) {
            floatingCountdown.addEventListener('click', () => {
                document.getElementById('countdown').scrollIntoView({ behavior: 'smooth' });
            });
        }
        
        // 生日专属相册按钮功能
        const viewSpecialAlbumBtn = document.getElementById('viewSpecialAlbum');
        if (viewSpecialAlbumBtn) {
            viewSpecialAlbumBtn.addEventListener('click', () => {
                // 关闭烟花界面
                if (fireworksContainer) {
                    fireworksContainer.style.display = 'none';
                    // 停止所有烟花相关的动画和音效
                    if (window.fireworksAnimationId) {
                        cancelAnimationFrame(window.fireworksAnimationId);
                        window.fireworksAnimationId = null;
                    }
                    // 停止所有音效
                    if (audioManager) {
                        audioManager.stopAllSounds();
                    }
                }
                document.body.style.overflow = 'auto';
                
                // 跳转到相册页面
                document.getElementById('album').scrollIntoView({ behavior: 'smooth' });
            });
        }
        
        // 生日烟花按钮功能
        const testFireworksBtn = document.getElementById('testFireworksBtn');
        if (testFireworksBtn) {
            // 检查是否是生日当天
            const checkBirthdayAndUpdateButton = () => {
                const now = new Date();
                const diff = birthdayDate - now;
                
                if (diff <= 0) {
                    // 生日当天，更改按钮文本
                    testFireworksBtn.textContent = '🎂 生日快乐';
                    testFireworksBtn.style.fontSize = '1.2rem';
                    testFireworksBtn.style.fontWeight = 'bold';
                } else {
                    // 非生日当天，显示预览文本
                    testFireworksBtn.textContent = '🎆 预览生日烟花';
                }
            };
            
            // 初始检查
            checkBirthdayAndUpdateButton();
            
            // 每分钟检查一次，以便在日期变化时更新按钮
            setInterval(checkBirthdayAndUpdateButton, 60000);
            
            testFireworksBtn.addEventListener('click', () => {
                showBirthdaySurprise();
            });
        }
    }
    
    // 初始化倒计时
    setupCountdown();

    // ===== 祝福星愿墙功能 =====
    
    function setupWishWall() {
        const canvas = document.getElementById('wishStarsCanvas');
        const wishModal = document.getElementById('wishModal');
        const addWishModal = document.getElementById('addWishModal');
        const addWishBtn = document.getElementById('addWishBtn');
        const showAllWishesBtn = document.getElementById('showAllWishesBtn');
        
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // 设置canvas大小
        function resizeCanvas() {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = 400; // 固定高度
        }
        
        resizeCanvas();
        
        // 预设的祝福内容（已清空，等待添加）
        const defaultWishes = [
            { type: '💝', title: '生日祝福', content: '以梦为马不负韶华！老妈祝小棉袄健康快乐平安！', author: '妈妈'},
            { type: '❤️', title: '爱意表达', content: '姐姐对我好些！', author: 'Harry'},
            { type: '🌟', title: '美好祝愿', content: '祝姐姐学业有成、才华横溢、家财万贯、越长越漂亮、天天快乐！', author: '香香'},
            { type: '🎯', title: '未来期望', content: 'Dear Zilin, Happy Birthday! Hope all efforts follow by great return! 愿心想事成，如愿而行！', author: 'Lily阿姨'},
            { type: '💝', title: '温馨话语', content: 'dear Zilin Sister,  Hope you have a wonderful time on your birthday! 祝亲爱的姐姐生日快乐,身体健康，开开心心！', author: 'William'},
            { type: '❤️', title: '特别时刻', content: '小宝贝生日快乐哦！天天开心，吃好睡好，永远爱你！', author: '帅哥'},
            { type: '🌟', title: '珍贵回忆', content: '宝贝宝贝生日快乐！很开心又陪你过了一年！愿你活的自由 随性 洒脱 爱别人的同时更加爱自己！愿你想要的都得到 得到的都美好！愿我们友谊长存！祝我的好闺闺Zilin生日快乐！爱你爱你！', author: '雪琪'},
            { type: '🎯', title: '美好祝愿', content: '我们㊗️美丽可爱的姿麟生日快乐🎂🎂🎂愿所有美好都属于你！新的一岁，做永远快乐幸福的女孩，一路繁花一生被爱！', author: '竣博妈妈'}
        ];
        
        // 清除之前的存储
        localStorage.removeItem('birthday_wishes');
        
        // 获取存储的祝福
        let wishes = JSON.parse(localStorage.getItem('birthday_wishes') || JSON.stringify(defaultWishes));
        
        // 星星对象
        const stars = [];
        
        class WishStar {
            constructor(wish, index) {
                this.wish = wish;
                this.x = Math.random() * (canvas.width - 150) + 75;
                this.y = Math.random() * (canvas.height - 150) + 75;
                this.size = Math.random() * 8 + 6; // 更大的星星尺寸 (6-14像素)
                this.twinkleSpeed = Math.random() * 0.02 + 0.01;
                this.twinklePhase = Math.random() * Math.PI * 2;
                this.glowIntensity = 0;
                this.targetGlow = 0;
                this.hue = Math.random() * 60 + 280; // 紫色到粉色范围
                this.clickRadius = 35; // 更大的点击范围
                this.baseOpacity = 0.8 + Math.random() * 0.2; // 基础透明度
            }
            
            update() {
                this.twinklePhase += this.twinkleSpeed;
                this.glowIntensity += (this.targetGlow - this.glowIntensity) * 0.1;
            }
            
            draw() {
                const opacity = this.baseOpacity + Math.sin(this.twinklePhase) * 0.3;
                
                ctx.save();
                
                // 外层光晕
                const glowSize = this.size + this.glowIntensity * 8;
                ctx.shadowBlur = 15 + this.glowIntensity * 30;
                ctx.shadowColor = `hsl(${this.hue}, 90%, 80%)`;
                
                // 绘制外层光晕星星
                ctx.fillStyle = `hsla(${this.hue}, 70%, 85%, ${opacity * 0.4})`;
                this.drawStar(this.x, this.y, glowSize);
                
                // 绘制内层星星
                ctx.shadowBlur = 8 + this.glowIntensity * 15;
                ctx.fillStyle = `hsla(${this.hue}, 90%, 75%, ${opacity})`;
                this.drawStar(this.x, this.y, this.size + this.glowIntensity * 3);
                
                // 绘制核心亮点
                ctx.shadowBlur = 5;
                ctx.fillStyle = `hsla(${this.hue}, 100%, 90%, ${opacity * 1.2})`;
                this.drawStar(this.x, this.y, this.size * 0.6);
                
                ctx.restore();
            }
            
            drawStar(x, y, size) {
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 144 - 90) * Math.PI / 180;
                    const radius = i % 2 === 0 ? size : size / 2;
                    const px = x + Math.cos(angle) * radius;
                    const py = y + Math.sin(angle) * radius;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
            }
            
            isClicked(mouseX, mouseY) {
                const distance = Math.sqrt((mouseX - this.x) ** 2 + (mouseY - this.y) ** 2);
                return distance < this.clickRadius;
            }
            
            setHover(isHover) {
                this.targetGlow = isHover ? 1 : 0;
            }
        }
        
        // 创建星星
        function createStars() {
            stars.length = 0;
            wishes.forEach((wish, index) => {
                stars.push(new WishStar(wish, index));
            });
        }
        
        // 动画循环
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            stars.forEach(star => {
                star.update();
                star.draw();
            });
            
            requestAnimationFrame(animate);
        }
        
        // 鼠标交互
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            stars.forEach(star => {
                const isHover = star.isClicked(mouseX, mouseY);
                star.setHover(isHover);
                canvas.style.cursor = isHover ? 'pointer' : 'default';
            });
        });
        
        // 点击星星显示祝福
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const clickedStar = stars.find(star => star.isClicked(mouseX, mouseY));
            if (clickedStar) {
                showWish(clickedStar.wish);
            }
        });
        
        // 显示祝福卡片
        function showWish(wish) {
            document.getElementById('wishType').textContent = wish.type;
            document.getElementById('wishTitle').textContent = wish.title;
            document.getElementById('wishContent').textContent = wish.content;
            document.getElementById('wishDate').textContent = wish.date;
            document.getElementById('wishAuthor').textContent = wish.author;
            
            wishModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
        
        // 关闭祝福卡片
        document.querySelector('.wish-modal-close').addEventListener('click', closeWishModal);
        wishModal.addEventListener('click', (e) => {
            if (e.target === wishModal) closeWishModal();
        });
        
        function closeWishModal() {
            wishModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        
        // 添加祝福功能
        addWishBtn.addEventListener('click', () => {
            addWishModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        });
        
        document.querySelector('.add-wish-modal-close').addEventListener('click', closeAddWishModal);
        addWishModal.addEventListener('click', (e) => {
            if (e.target === addWishModal) closeAddWishModal();
        });
        
        function closeAddWishModal() {
            addWishModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        
        // 提交新祝福
        document.getElementById('addWishForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const type = document.getElementById('wishTypeSelect').value;
            const content = document.getElementById('wishContentInput').value.trim();
            const author = document.getElementById('wishAuthorInput').value.trim() || '匿名';
            
            if (!content) {
                alert('请填写祝福内容！');
                return;
            }
            
            const typeMap = {
                '💝': '生日祝福',
                '❤️': '爱意表达',
                '🌟': '美好祝愿',
                '🎯': '未来期望'
            };
            
            const newWish = {
                type: type,
                title: typeMap[type],
                content: content,
                author: author,
                date: new Date().toLocaleDateString('zh-CN').replace(/\//g, '.')
            };
            
            wishes.push(newWish);
            localStorage.setItem('birthday_wishes', JSON.stringify(wishes));
            
            createStars();
            closeAddWishModal();
            
            // 清空表单
            document.getElementById('addWishForm').reset();
            
            // 显示成功提示
            setTimeout(() => {
                alert('✨ 祝福已添加到星愿墙！');
            }, 300);
        });
        
        // 查看所有祝福
        showAllWishesBtn.addEventListener('click', () => {
            let allWishesText = '🌟 所有祝福：\n\n';
            wishes.forEach((wish, index) => {
                allWishesText += `${index + 1}. ${wish.type} ${wish.title}\n${wish.content}\n——${wish.author} (${wish.date})\n\n`;
            });
            alert(allWishesText);
        });
        
        // 窗口大小改变时重新调整
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            createStars();
        });
        
        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (wishModal.style.display === 'block') closeWishModal();
                if (addWishModal.style.display === 'block') closeAddWishModal();
            }
        });
        
        // 窗口大小调整
        window.addEventListener('resize', () => {
            resizeCanvas();
            createStars();
        });
        
        // 初始化
        createStars();
        animate();
    }
    
    // 初始化祝福星愿墙
    if (document.getElementById('wishes')) {
        setupWishWall();
    }

    // ===== 小游戏功能 =====
    
    function setupGames() {
        const gameCards = document.querySelectorAll('.game-card');
        const gameModal = document.getElementById('gameModal');
        const gameContent = document.getElementById('gameContent');
        const gameModalClose = document.querySelector('.game-modal-close');
        
        // 游戏数据
        let currentGame = null;
        let snakeHighScore = localStorage.getItem('snakeHighScore') || 0;
        let tetrisHighScore = localStorage.getItem('tetrisHighScore') || 0;
        
        // 更新最高分显示
        document.getElementById('snakeHighScore').textContent = snakeHighScore;
        document.getElementById('tetrisHighScore').textContent = tetrisHighScore;
        
        // 游戏卡片点击事件
        gameCards.forEach(card => {
            const playBtn = card.querySelector('.play-btn');
            const gameType = card.dataset.game;
            
            playBtn.addEventListener('click', () => {
                currentGame = gameType;
                openGameModal(gameType);
            });
        });
        
        // 打开游戏模态框
        function openGameModal(gameType) {
            gameModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            if (gameType === 'snake') {
                gameContent.innerHTML = createSnakeGame();
                initSnakeGame();
            } else if (gameType === 'tetris') {
                gameContent.innerHTML = createTetrisGame();
                initTetrisGame();
            }
        }
        
        // 关闭游戏模态框
        function closeGameModal() {
            gameModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            gameContent.innerHTML = '';
            currentGame = null;
        }
        
        gameModalClose.addEventListener('click', closeGameModal);
        gameModal.addEventListener('click', (e) => {
            if (e.target === gameModal) closeGameModal();
        });
        
        // 创建贪吃蛇游戏HTML
        function createSnakeGame() {
            return `
                <div class="snake-game">
                    <div class="game-header">
                        <h3>🐍 贪吃蛇</h3>
                        <div class="game-info">
                            <span>分数: <span id="snakeScore">0</span></span>
                            <span>最高分: <span id="snakeCurrentHigh">${snakeHighScore}</span></span>
                        </div>
                    </div>
                    <canvas id="snakeCanvas" width="400" height="400"></canvas>
                    <div class="game-controls">
                        <button id="snakeStartBtn">开始游戏</button>
                        <button id="snakePauseBtn" disabled>暂停</button>
                        <button id="snakeRestartBtn">重新开始</button>
                    </div>
                    <div class="game-instructions">
                        <p>使用 WASD 或方向键控制贪吃蛇移动</p>
                        <p>吃到食物可以获得分数，碰到墙壁或自己身体会结束游戏</p>
                    </div>
                </div>
            `;
        }
        
        // 创建俄罗斯方块游戏HTML
        function createTetrisGame() {
            return `
                <div class="tetris-game">
                    <div class="game-header">
                        <h3>🧱 俄罗斯方块</h3>
                        <div class="game-info">
                            <span>分数: <span id="tetrisScore">0</span></span>
                            <span>等级: <span id="tetrisLevel">1</span></span>
                            <span>最高分: <span id="tetrisCurrentHigh">${tetrisHighScore}</span></span>
                        </div>
                    </div>
                    <div class="tetris-container">
                        <canvas id="tetrisCanvas" width="300" height="600"></canvas>
                        <div class="tetris-side">
                            <div class="next-piece">
                                <h4>下一个</h4>
                                <canvas id="nextPieceCanvas" width="100" height="100"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="game-controls">
                        <button id="tetrisStartBtn">开始游戏</button>
                        <button id="tetrisPauseBtn" disabled>暂停</button>
                        <button id="tetrisRestartBtn">重新开始</button>
                    </div>
                    <div class="game-instructions">
                        <p>使用 A/D 或 ←/→ 控制左右移动</p>
                        <p>使用 S 或 ↓ 加速下落，空格键旋转方块</p>
                        <p>消除一行可以获得分数，游戏会随等级提升变快</p>
                    </div>
                </div>
            `;
        }
        
        // 贪吃蛇游戏逻辑
        function initSnakeGame() {
            const canvas = document.getElementById('snakeCanvas');
            const ctx = canvas.getContext('2d');
            const scoreElement = document.getElementById('snakeScore');
            const startBtn = document.getElementById('snakeStartBtn');
            const pauseBtn = document.getElementById('snakePauseBtn');
            const restartBtn = document.getElementById('snakeRestartBtn');
            
            const gridSize = 20;
            const tileCount = canvas.width / gridSize;
            
            let snake = [
                {x: 10, y: 10}
            ];
            let food = {};
            let dx = 0;
            let dy = 0;
            let score = 0;
            let gameRunning = false;
            let gamePaused = false;
            let gameLoop;
            
            function generateFood() {
                food = {
                    x: Math.floor(Math.random() * tileCount),
                    y: Math.floor(Math.random() * tileCount)
                };
                
                // 确保食物不在蛇身上
                for (let segment of snake) {
                    if (segment.x === food.x && segment.y === food.y) {
                        generateFood();
                        return;
                    }
                }
            }
            
            function drawGame() {
                // 清空画布
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // 绘制蛇
                ctx.fillStyle = '#4CAF50';
                for (let segment of snake) {
                    ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
                }
                
                // 绘制食物
                ctx.fillStyle = '#FF5722';
                ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
            }
            
            function update() {
                if (!gameRunning || gamePaused) return;
                
                const head = {x: snake[0].x + dx, y: snake[0].y + dy};
                
                // 检查碰撞
                if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
                    gameOver();
                    return;
                }
                
                for (let segment of snake) {
                    if (head.x === segment.x && head.y === segment.y) {
                        gameOver();
                        return;
                    }
                }
                
                snake.unshift(head);
                
                // 检查是否吃到食物
                if (head.x === food.x && head.y === food.y) {
                    score += 10;
                    scoreElement.textContent = score;
                    generateFood();
                } else {
                    snake.pop();
                }
                
                drawGame();
            }
            
            function gameOver() {
                gameRunning = false;
                clearInterval(gameLoop);
                
                if (score > snakeHighScore) {
                    snakeHighScore = score;
                    localStorage.setItem('snakeHighScore', snakeHighScore);
                    document.getElementById('snakeHighScore').textContent = snakeHighScore;
                    document.getElementById('snakeCurrentHigh').textContent = snakeHighScore;
                    alert(`新纪录！您的分数：${score}`);
                } else {
                    alert(`游戏结束！您的分数：${score}`);
                }
                
                startBtn.disabled = false;
                pauseBtn.disabled = true;
            }
            
            function startGame() {
                snake = [{x: 10, y: 10}];
                dx = 1;  // 默认向右移动
                dy = 0;
                score = 0;
                scoreElement.textContent = score;
                generateFood();
                gameRunning = true;
                gamePaused = false;
                
                startBtn.disabled = true;
                pauseBtn.disabled = false;
                
                gameLoop = setInterval(update, 150);
                drawGame();
            }
            
            function pauseGame() {
                gamePaused = !gamePaused;
                pauseBtn.textContent = gamePaused ? '继续' : '暂停';
            }
            
            function restartGame() {
                gameRunning = false;
                gamePaused = false;
                clearInterval(gameLoop);
                startGame();
            }
            
            // 键盘控制
            function handleKeyPress(e) {
                if (!gameRunning || gamePaused) return;
                
                const key = e.key.toLowerCase();
                
                // 防止反向移动
                if ((key === 'w' || key === 'arrowup') && dy !== 1) {
                    dx = 0; dy = -1;
                } else if ((key === 's' || key === 'arrowdown') && dy !== -1) {
                    dx = 0; dy = 1;
                } else if ((key === 'a' || key === 'arrowleft') && dx !== 1) {
                    dx = -1; dy = 0;
                } else if ((key === 'd' || key === 'arrowright') && dx !== -1) {
                    dx = 1; dy = 0;
                }
            }
            
            // 事件监听
            startBtn.addEventListener('click', startGame);
            pauseBtn.addEventListener('click', pauseGame);
            restartBtn.addEventListener('click', restartGame);
            document.addEventListener('keydown', handleKeyPress);
            
            // 初始化画布
            drawGame();
        }
        
        // 俄罗斯方块游戏逻辑
        function initTetrisGame() {
            const canvas = document.getElementById('tetrisCanvas');
            const ctx = canvas.getContext('2d');
            const nextCanvas = document.getElementById('nextPieceCanvas');
            const nextCtx = nextCanvas.getContext('2d');
            const scoreElement = document.getElementById('tetrisScore');
            const levelElement = document.getElementById('tetrisLevel');
            const startBtn = document.getElementById('tetrisStartBtn');
            const pauseBtn = document.getElementById('tetrisPauseBtn');
            const restartBtn = document.getElementById('tetrisRestartBtn');
            
            const gridWidth = 10;
            const gridHeight = 20;
            const blockSize = 30;
            
            let board = Array(gridHeight).fill().map(() => Array(gridWidth).fill(0));
            let currentPiece = null;
            let nextPiece = null;
            let score = 0;
            let level = 1;
            let lines = 0;
            let gameRunning = false;
            let gamePaused = false;
            let gameLoop;
            let dropTime = 1000;
            
            // 方块类型
            const pieces = [
                // I
                [
                    [1, 1, 1, 1]
                ],
                // O
                [
                    [1, 1],
                    [1, 1]
                ],
                // T
                [
                    [0, 1, 0],
                    [1, 1, 1]
                ],
                // S
                [
                    [0, 1, 1],
                    [1, 1, 0]
                ],
                // Z
                [
                    [1, 1, 0],
                    [0, 1, 1]
                ],
                // J
                [
                    [1, 0, 0],
                    [1, 1, 1]
                ],
                // L
                [
                    [0, 0, 1],
                    [1, 1, 1]
                ]
            ];
            
            const colors = ['#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#3877FF'];
            
            function createPiece() {
                const typeId = Math.floor(Math.random() * pieces.length);
                return {
                    shape: pieces[typeId],
                    color: colors[typeId],
                    x: Math.floor(gridWidth / 2) - Math.floor(pieces[typeId][0].length / 2),
                    y: 0
                };
            }
            
            function drawBlock(ctx, x, y, color) {
                ctx.fillStyle = color;
                ctx.fillRect(x * blockSize, y * blockSize, blockSize - 1, blockSize - 1);
            }
            
            function drawBoard() {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // 绘制已放置的方块
                for (let y = 0; y < gridHeight; y++) {
                    for (let x = 0; x < gridWidth; x++) {
                        if (board[y][x]) {
                            drawBlock(ctx, x, y, board[y][x]);
                        }
                    }
                }
                
                // 绘制当前方块
                if (currentPiece) {
                    for (let y = 0; y < currentPiece.shape.length; y++) {
                        for (let x = 0; x < currentPiece.shape[y].length; x++) {
                            if (currentPiece.shape[y][x]) {
                                drawBlock(ctx, currentPiece.x + x, currentPiece.y + y, currentPiece.color);
                            }
                        }
                    }
                }
            }
            
            function drawNextPiece() {
                nextCtx.fillStyle = '#000';
                nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
                
                if (nextPiece) {
                    const offsetX = (nextCanvas.width / blockSize - nextPiece.shape[0].length) / 2;
                    const offsetY = (nextCanvas.height / blockSize - nextPiece.shape.length) / 2;
                    
                    for (let y = 0; y < nextPiece.shape.length; y++) {
                        for (let x = 0; x < nextPiece.shape[y].length; x++) {
                            if (nextPiece.shape[y][x]) {
                                nextCtx.fillStyle = nextPiece.color;
                                nextCtx.fillRect(
                                    (offsetX + x) * (blockSize * 0.6),
                                    (offsetY + y) * (blockSize * 0.6),
                                    blockSize * 0.6 - 1,
                                    blockSize * 0.6 - 1
                                );
                            }
                        }
                    }
                }
            }
            
            function canMove(piece, dx, dy, shape = piece.shape) {
                for (let y = 0; y < shape.length; y++) {
                    for (let x = 0; x < shape[y].length; x++) {
                        if (shape[y][x]) {
                            const newX = piece.x + x + dx;
                            const newY = piece.y + y + dy;
                            
                            if (newX < 0 || newX >= gridWidth || newY >= gridHeight) {
                                return false;
                            }
                            
                            if (newY >= 0 && board[newY][newX]) {
                                return false;
                            }
                        }
                    }
                }
                return true;
            }
            
            function placePiece() {
                for (let y = 0; y < currentPiece.shape.length; y++) {
                    for (let x = 0; x < currentPiece.shape[y].length; x++) {
                        if (currentPiece.shape[y][x]) {
                            const boardY = currentPiece.y + y;
                            const boardX = currentPiece.x + x;
                            
                            if (boardY >= 0) {
                                board[boardY][boardX] = currentPiece.color;
                            }
                        }
                    }
                }
                
                clearLines();
                currentPiece = nextPiece;
                nextPiece = createPiece();
                
                if (!canMove(currentPiece, 0, 0)) {
                    gameOver();
                }
            }
            
            function clearLines() {
                let linesCleared = 0;
                
                for (let y = gridHeight - 1; y >= 0; y--) {
                    if (board[y].every(cell => cell !== 0)) {
                        board.splice(y, 1);
                        board.unshift(Array(gridWidth).fill(0));
                        linesCleared++;
                        y++; // 重新检查当前行
                    }
                }
                
                if (linesCleared > 0) {
                    lines += linesCleared;
                    score += linesCleared * 100 * level;
                    level = Math.floor(lines / 10) + 1;
                    dropTime = Math.max(100, 1000 - (level - 1) * 100);
                    
                    scoreElement.textContent = score;
                    levelElement.textContent = level;
                }
            }
            
            function rotatePiece() {
                if (!currentPiece) return;
                
                const rotated = currentPiece.shape[0].map((_, i) =>
                    currentPiece.shape.map(row => row[i]).reverse()
                );
                
                if (canMove(currentPiece, 0, 0, rotated)) {
                    currentPiece.shape = rotated;
                }
            }
            
            function gameOver() {
                gameRunning = false;
                clearInterval(gameLoop);
                
                if (score > tetrisHighScore) {
                    tetrisHighScore = score;
                    localStorage.setItem('tetrisHighScore', tetrisHighScore);
                    document.getElementById('tetrisHighScore').textContent = tetrisHighScore;
                    document.getElementById('tetrisCurrentHigh').textContent = tetrisHighScore;
                    alert(`新纪录！您的分数：${score}`);
                } else {
                    alert(`游戏结束！您的分数：${score}`);
                }
                
                startBtn.disabled = false;
                pauseBtn.disabled = true;
            }
            
            function update() {
                if (!gameRunning || gamePaused) return;
                
                if (canMove(currentPiece, 0, 1)) {
                    currentPiece.y++;
                } else {
                    placePiece();
                }
                
                drawBoard();
                drawNextPiece();
            }
            
            function startGame() {
                board = Array(gridHeight).fill().map(() => Array(gridWidth).fill(0));
                score = 0;
                level = 1;
                lines = 0;
                dropTime = 1000;
                
                scoreElement.textContent = score;
                levelElement.textContent = level;
                
                currentPiece = createPiece();
                nextPiece = createPiece();
                
                gameRunning = true;
                gamePaused = false;
                
                startBtn.disabled = true;
                pauseBtn.disabled = false;
                
                gameLoop = setInterval(update, dropTime);
                drawBoard();
                drawNextPiece();
            }
            
            function pauseGame() {
                gamePaused = !gamePaused;
                pauseBtn.textContent = gamePaused ? '继续' : '暂停';
            }
            
            function restartGame() {
                gameRunning = false;
                gamePaused = false;
                clearInterval(gameLoop);
                startGame();
            }
            
            // 键盘控制
            function handleKeyPress(e) {
                if (!gameRunning || gamePaused) return;
                
                const key = e.key.toLowerCase();
                
                if (key === 'a' || key === 'arrowleft') {
                    if (canMove(currentPiece, -1, 0)) {
                        currentPiece.x--;
                    }
                } else if (key === 'd' || key === 'arrowright') {
                    if (canMove(currentPiece, 1, 0)) {
                        currentPiece.x++;
                    }
                } else if (key === 's' || key === 'arrowdown') {
                    if (canMove(currentPiece, 0, 1)) {
                        currentPiece.y++;
                    }
                } else if (key === ' ') {
                    e.preventDefault();
                    rotatePiece();
                }
                
                drawBoard();
            }
            
            // 事件监听
            startBtn.addEventListener('click', startGame);
            pauseBtn.addEventListener('click', pauseGame);
            restartBtn.addEventListener('click', restartGame);
            document.addEventListener('keydown', handleKeyPress);
            
            // 初始化画布
            drawBoard();
            drawNextPiece();
        }
    }
    
    // 初始化游戏
    if (document.getElementById('games')) {
        setupGames();
    }
});