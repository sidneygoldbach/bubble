class BubbleGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.gameOverElement = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('finalScore');
        this.finalLevelElement = document.getElementById('finalLevel');
        
        this.bubbles = [];
        this.score = 0;
        this.level = 1;
        this.gameRunning = true;
        this.lastBubbleSpawn = 0;
        this.bubbleSpawnRate = 2000; // milliseconds
        this.maxBubbles = 15;
        
        // Cores das bolhas com valores estratégicos
        this.bubbleColors = [
            { color: '#FF6B6B', points: 10, name: 'vermelho' },
            { color: '#4ECDC4', points: 15, name: 'azul' },
            { color: '#45B7D1', points: 20, name: 'azul claro' },
            { color: '#96CEB4', points: 25, name: 'verde' },
            { color: '#FFEAA7', points: 30, name: 'amarelo' },
            { color: '#DDA0DD', points: 35, name: 'roxo' },
            { color: '#FFB347', points: 40, name: 'laranja' }
        ];
        
        // Tamanhos das bolhas
        this.bubbleSizes = [
            { radius: 20, multiplier: 2.0, name: 'pequena' },
            { radius: 35, multiplier: 1.5, name: 'média' },
            { radius: 50, multiplier: 1.0, name: 'grande' },
            { radius: 65, multiplier: 0.5, name: 'extra grande' }
        ];
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.setupEventListeners();
        this.createAudioContext();
        this.gameLoop();
        
        // Spawn inicial de bolhas
        for (let i = 0; i < 5; i++) {
            this.spawnBubble();
        }
    }
    
    createAudioContext() {
        // Criar contexto de áudio para efeitos sonoros
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Áudio não suportado');
            this.audioContext = null;
        }
    }
    
    playSound(frequency, duration = 0.1, type = 'sine') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Touch events para dispositivos móveis
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            this.handleClick(x, y);
        });
        
        // Mouse events para desktop
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            this.handleClick(x, y);
        });
    }
    
    spawnBubble() {
        if (this.bubbles.length >= this.maxBubbles) return;
        
        const colorData = this.bubbleColors[Math.floor(Math.random() * Math.min(this.bubbleColors.length, 3 + this.level))];
        const sizeData = this.bubbleSizes[Math.floor(Math.random() * this.bubbleSizes.length)];
        
        const bubble = {
            x: Math.random() * (this.canvas.width - sizeData.radius * 2) + sizeData.radius,
            y: this.canvas.height + sizeData.radius,
            radius: sizeData.radius,
            color: colorData.color,
            points: Math.floor(colorData.points * sizeData.multiplier),
            speed: 1 + Math.random() * 2 + (this.level * 0.3),
            colorName: colorData.name,
            sizeName: sizeData.name,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.02 + Math.random() * 0.03,
            alpha: 0.8 + Math.random() * 0.2
        };
        
        this.bubbles.push(bubble);
    }
    
    updateBubbles() {
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const bubble = this.bubbles[i];
            
            // Movimento para cima com oscilação
            bubble.y -= bubble.speed;
            bubble.wobble += bubble.wobbleSpeed;
            bubble.x += Math.sin(bubble.wobble) * 0.5;
            
            // Remove bolhas que saíram da tela
            if (bubble.y + bubble.radius < 0) {
                this.bubbles.splice(i, 1);
                // Penalidade por deixar bolha escapar
                this.score = Math.max(0, this.score - 5);
                this.updateUI();
            }
        }
        
        // Spawn de novas bolhas
        const now = Date.now();
        if (now - this.lastBubbleSpawn > this.bubbleSpawnRate) {
            this.spawnBubble();
            this.lastBubbleSpawn = now;
        }
    }
    
    handleClick(x, y) {
        if (!this.gameRunning) return;
        
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const bubble = this.bubbles[i];
            const distance = Math.sqrt((x - bubble.x) ** 2 + (y - bubble.y) ** 2);
            
            if (distance <= bubble.radius) {
                // Aplicar regras de pontuação baseadas em estratégia
                const points = this.calculatePoints(bubble, i);
                this.score += points;
                
                // Efeito sonoro baseado na cor/tamanho
                const frequency = 200 + (bubble.points * 10) + (bubble.radius * 5);
                this.playSound(frequency, 0.15, 'triangle');
                
                // Criar efeito visual de explosão
                this.createExplosionEffect(bubble.x, bubble.y, bubble.color);
                
                // Remove a bolha
                this.bubbles.splice(i, 1);
                
                this.updateUI();
                this.checkLevelUp();
                break;
            }
        }
    }
    
    calculatePoints(bubble, index) {
        let points = bubble.points;
        
        // Bônus por sequência de cores similares
        const nearbyBubbles = this.bubbles.filter((b, i) => {
            if (i === index) return false;
            const distance = Math.sqrt((bubble.x - b.x) ** 2 + (bubble.y - b.y) ** 2);
            return distance < 100 && b.colorName === bubble.colorName;
        });
        
        if (nearbyBubbles.length > 0) {
            points *= (1 + nearbyBubbles.length * 0.5); // Bônus de combo
            this.playSound(400 + nearbyBubbles.length * 100, 0.2, 'square'); // Som de combo
        }
        
        // Bônus por tamanho (bolhas menores valem mais)
        if (bubble.sizeName === 'pequena') points *= 1.5;
        else if (bubble.sizeName === 'extra grande') points *= 0.8;
        
        // Bônus por velocidade de reação (bolhas mais altas valem mais)
        const heightBonus = Math.max(0, (this.canvas.height - bubble.y) / this.canvas.height);
        points *= (1 + heightBonus * 0.3);
        
        return Math.floor(points);
    }
    
    createExplosionEffect(x, y, color) {
        // Criar partículas de explosão
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * (2 + Math.random() * 3),
                vy: Math.sin(angle) * (2 + Math.random() * 3),
                color: color,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.02
            };
            
            this.animateParticle(particle);
        }
    }
    
    animateParticle(particle) {
        const animate = () => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            
            if (particle.life > 0) {
                this.ctx.save();
                this.ctx.globalAlpha = particle.life;
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
                
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
    
    checkLevelUp() {
        const newLevel = Math.floor(this.score / 500) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.bubbleSpawnRate = Math.max(800, 2000 - (this.level * 150));
            this.maxBubbles = Math.min(25, 15 + this.level);
            
            // Som de level up
            this.playSound(523, 0.1); // C5
            setTimeout(() => this.playSound(659, 0.1), 100); // E5
            setTimeout(() => this.playSound(784, 0.2), 200); // G5
        }
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
    }
    
    render() {
        // Limpar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenhar fundo com gradiente animado
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, `hsla(${Date.now() * 0.01 % 360}, 20%, 10%, 0.1)`);
        gradient.addColorStop(1, `hsla(${(Date.now() * 0.01 + 180) % 360}, 20%, 10%, 0.1)`);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenhar bolhas
        this.bubbles.forEach(bubble => {
            this.ctx.save();
            this.ctx.globalAlpha = bubble.alpha;
            
            // Sombra
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetY = 5;
            
            // Gradiente da bolha
            const bubbleGradient = this.ctx.createRadialGradient(
                bubble.x - bubble.radius * 0.3, bubble.y - bubble.radius * 0.3, 0,
                bubble.x, bubble.y, bubble.radius
            );
            bubbleGradient.addColorStop(0, bubble.color);
            bubbleGradient.addColorStop(0.7, bubble.color);
            bubbleGradient.addColorStop(1, this.darkenColor(bubble.color, 0.3));
            
            this.ctx.fillStyle = bubbleGradient;
            this.ctx.beginPath();
            this.ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Brilho
            const highlightGradient = this.ctx.createRadialGradient(
                bubble.x - bubble.radius * 0.4, bubble.y - bubble.radius * 0.4, 0,
                bubble.x - bubble.radius * 0.4, bubble.y - bubble.radius * 0.4, bubble.radius * 0.5
            );
            highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
            highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.fillStyle = highlightGradient;
            this.ctx.beginPath();
            this.ctx.arc(bubble.x - bubble.radius * 0.3, bubble.y - bubble.radius * 0.3, bubble.radius * 0.4, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }
    
    darkenColor(color, factor) {
        // Converter hex para RGB e escurecer
        const hex = color.replace('#', '');
        const r = Math.floor(parseInt(hex.substr(0, 2), 16) * (1 - factor));
        const g = Math.floor(parseInt(hex.substr(2, 2), 16) * (1 - factor));
        const b = Math.floor(parseInt(hex.substr(4, 2), 16) * (1 - factor));
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    gameLoop() {
        if (this.gameRunning) {
            this.updateBubbles();
            this.render();
            
            // Verificar condição de game over
            if (this.bubbles.length >= this.maxBubbles && this.bubbles.some(b => b.y <= 100)) {
                this.gameOver();
            }
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    gameOver() {
        this.gameRunning = false;
        this.finalScoreElement.textContent = this.score;
        this.finalLevelElement.textContent = this.level;
        this.gameOverElement.style.display = 'block';
        
        // Som de game over
        this.playSound(220, 0.3, 'sawtooth');
        setTimeout(() => this.playSound(196, 0.5, 'sawtooth'), 300);
    }
    
    restart() {
        this.bubbles = [];
        this.score = 0;
        this.level = 1;
        this.gameRunning = true;
        this.lastBubbleSpawn = 0;
        this.bubbleSpawnRate = 2000;
        this.maxBubbles = 15;
        
        this.gameOverElement.style.display = 'none';
        this.updateUI();
        
        // Spawn inicial de bolhas
        for (let i = 0; i < 5; i++) {
            this.spawnBubble();
        }
    }
}

// Inicializar o jogo
let game;

window.addEventListener('load', () => {
    game = new BubbleGame();
});

function restartGame() {
    if (game) {
        game.restart();
    }
}