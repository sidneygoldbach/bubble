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
        
        // Sistema de alfinetes no teto
        this.ceilingPins = [];
        this.ceilingHeight = 30; // altura do teto em pixels
        
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
        
        // Sistema de power-ups
        this.powerUps = {
            slowMotion: {
                active: false,
                duration: 5000, // 5 segundos
                endTime: 0,
                speedMultiplier: 0.3 // 30% da velocidade normal
            }
        };
        
        // Tipos de bolhas especiais
        this.specialBubbleTypes = {
            NORMAL: 'normal',
            TURTLE: 'turtle',
            BOMB: 'bomb'
        };
        
        this.init()
    }
    
    init() {
        this.setupEventListeners();
        this.createAudioContext();
        
        // Força redimensionamento inicial
        this.resizeCanvas();
        
        this.gameLoop();
        
        // Só spawn bolhas se o jogo foi iniciado
        if (gameStarted) {
            for (let i = 0; i < 5; i++) {
                this.spawnBubble();
            }
        }
    }
    
    createCeilingPin(x, color) {
        // Cria um mini alfinete no teto
        const pin = {
            x: x,
            y: this.ceilingHeight - 5,
            color: color,
            size: 3, // tamanho pequeno em pixels
            createdAt: Date.now(),
            fadeOut: false
        };
        
        this.ceilingPins.push(pin);
        
        // Limita o número de alfinetes para não sobrecarregar
         if (this.ceilingPins.length > 50) {
             this.ceilingPins.shift(); // remove o mais antigo
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
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        
        // Força o redimensionamento apenas se necessário
        if (this.canvas.width !== newWidth || this.canvas.height !== newHeight) {
            this.canvas.width = newWidth;
            this.canvas.height = newHeight;
            
            // Força uma nova renderização
            if (this.gameRunning) {
                this.render();
            }
        }
    }
    
    setupEventListeners() {
        // Redimensionamento da janela
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
        
        // Observer para mudanças no container
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                this.resizeCanvas();
            });
            this.resizeObserver.observe(this.canvas.parentElement);
        }
        
        // Redimensionamento inicial com delay para garantir que o DOM esteja pronto
        setTimeout(() => {
            this.resizeCanvas();
        }, 100);
        
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
        
        // Determinar tipo especial da bolha (5% chance para cada tipo especial)
        let specialType = this.specialBubbleTypes.NORMAL;
        const specialChance = Math.random();
        if (specialChance < 0.05) {
            specialType = this.specialBubbleTypes.TURTLE;
        } else if (specialChance < 0.10) {
            specialType = this.specialBubbleTypes.BOMB;
        }
        
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
            alpha: 0.8 + Math.random() * 0.2,
            specialType: specialType
        };
        
        this.bubbles.push(bubble);
    }
    
    updateBubbles() {
        // Verificar se o power-up de slow motion expirou
        if (this.powerUps.slowMotion.active && Date.now() > this.powerUps.slowMotion.endTime) {
            this.powerUps.slowMotion.active = false;
        }
        
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const bubble = this.bubbles[i];
            
            // Aplicar efeito de slow motion se ativo
            let currentSpeed = bubble.speed;
            if (this.powerUps.slowMotion.active) {
                currentSpeed *= this.powerUps.slowMotion.speedMultiplier;
            }
            
            // Movimento para cima com oscilação
            bubble.y -= currentSpeed;
            bubble.wobble += bubble.wobbleSpeed;
            bubble.x += Math.sin(bubble.wobble) * 0.5;
            
            // Verifica se a bolha bateu no teto
            if (bubble.y - bubble.radius <= this.ceilingHeight) {
                // Cria um alfinete no local onde a bolha bateu
                this.createCeilingPin(bubble.x, bubble.color);
                
                // Remove a bolha
                this.bubbles.splice(i, 1);
                
                // Penalidade por deixar bolha bater no teto
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
                // Verificar se é uma bolha especial e aplicar efeitos
                if (bubble.specialType === this.specialBubbleTypes.TURTLE) {
                    // Ativar slow motion
                    this.powerUps.slowMotion.active = true;
                    this.powerUps.slowMotion.endTime = Date.now() + this.powerUps.slowMotion.duration;
                    
                    // Efeito sonoro especial para tartaruga
                    this.playSound(300, 0.3, 'sine');
                    setTimeout(() => this.playSound(250, 0.4, 'sine'), 150);
                    setTimeout(() => this.playSound(200, 0.5, 'sine'), 300);
                } else if (bubble.specialType === this.specialBubbleTypes.BOMB) {
                    // Efeito sonoro especial para bomba (antes da explosão)
                    this.playSound(100, 0.2, 'square');
                    
                    // Criar efeito visual de onda de choque
                    this.createShockwaveEffect(bubble.x, bubble.y, bubble.radius * 2.5);
                    
                    // Explodir bolhas vizinhas
                    this.explodeNearbyBubbles(bubble.x, bubble.y, bubble.radius * 2.5);
                }
                
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
    
    explodeNearbyBubbles(centerX, centerY, explosionRadius) {
        const explodedBubbles = [];
        
        // Encontrar bolhas dentro do raio de explosão
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const bubble = this.bubbles[i];
            const distance = Math.sqrt((centerX - bubble.x) ** 2 + (centerY - bubble.y) ** 2);
            
            if (distance <= explosionRadius) {
                // Adicionar pontos da bolha explodida
                this.score += Math.floor(bubble.points * 0.8); // 80% dos pontos normais
                
                // Criar efeito visual
                this.createExplosionEffect(bubble.x, bubble.y, bubble.color);
                
                // Armazenar dados da bolha antes de remover
                explodedBubbles.push(bubble);
                
                // Remover bolha
                this.bubbles.splice(i, 1);
            }
        }
        
        // Efeito sonoro especial para explosão em área
        if (explodedBubbles.length > 1) {
            this.playSound(150, 0.3, 'sawtooth'); // Som grave de explosão
            setTimeout(() => this.playSound(800, 0.2, 'triangle'), 100); // Som agudo de finalização
        }
        
        return explodedBubbles.length;
    }
    
    createShockwaveEffect(x, y, maxRadius) {
        const shockwave = {
            x: x,
            y: y,
            radius: 0,
            maxRadius: maxRadius,
            alpha: 1,
            startTime: Date.now()
        };
        
        const animateShockwave = () => {
            const elapsed = Date.now() - shockwave.startTime;
            const duration = 500; // 500ms de duração
            const progress = Math.min(elapsed / duration, 1);
            
            shockwave.radius = shockwave.maxRadius * progress;
            shockwave.alpha = 1 - progress;
            
            // Desenhar onda de choque
            this.ctx.save();
            this.ctx.globalAlpha = shockwave.alpha;
            this.ctx.strokeStyle = '#FF4500';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.arc(shockwave.x, shockwave.y, shockwave.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Anel interno
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(shockwave.x, shockwave.y, shockwave.radius * 0.7, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
            
            if (progress < 1) {
                requestAnimationFrame(animateShockwave);
            }
        };
        
        animateShockwave();
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
        
        // Desenhar teto
        this.ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.ceilingHeight);
        
        // Desenhar alfinetes no teto
        this.ceilingPins.forEach(pin => {
            this.ctx.fillStyle = pin.color;
            this.ctx.beginPath();
            this.ctx.arc(pin.x, pin.y, pin.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Desenhar a "agulha" do alfinete
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(pin.x, pin.y);
            this.ctx.lineTo(pin.x, pin.y - 8);
            this.ctx.stroke();
        });
        
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
            
            // Desenhar ícones especiais
            if (bubble.specialType === this.specialBubbleTypes.TURTLE) {
                this.drawTurtleIcon(bubble.x, bubble.y, bubble.radius * 0.4);
            } else if (bubble.specialType === this.specialBubbleTypes.BOMB) {
                this.drawBombIcon(bubble.x, bubble.y, bubble.radius * 0.4);
            }
            
            this.ctx.restore();
        });
        
        // Indicador visual de slow motion
        if (this.powerUps.slowMotion.active) {
            const timeLeft = this.powerUps.slowMotion.endTime - Date.now();
            const progress = timeLeft / this.powerUps.slowMotion.duration;
            
            // Fundo do indicador
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, 10, 200, 30);
            
            // Barra de progresso
            this.ctx.fillStyle = '#4ECDC4';
            this.ctx.fillRect(15, 15, 190 * progress, 20);
            
            // Texto
            this.ctx.fillStyle = 'white';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🐢 SLOW MOTION', 110, 28);
            this.ctx.textAlign = 'left';
        }
    }
    
    drawTurtleIcon(x, y, size) {
        this.ctx.save();
        this.ctx.fillStyle = '#2D5016'; // Verde escuro
        
        // Corpo da tartaruga (oval)
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, size * 0.8, size * 0.6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Cabeça
        this.ctx.beginPath();
        this.ctx.arc(x, y - size * 0.4, size * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Patas
        this.ctx.beginPath();
        this.ctx.arc(x - size * 0.5, y + size * 0.3, size * 0.15, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.5, y + size * 0.3, size * 0.15, 0, Math.PI * 2);
        this.ctx.arc(x - size * 0.3, y - size * 0.1, size * 0.12, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.3, y - size * 0.1, size * 0.12, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Casco (linhas)
        this.ctx.strokeStyle = '#1A3009';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.4, y - size * 0.2);
        this.ctx.lineTo(x + size * 0.4, y - size * 0.2);
        this.ctx.moveTo(x - size * 0.4, y + size * 0.2);
        this.ctx.lineTo(x + size * 0.4, y + size * 0.2);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    drawBombIcon(x, y, size) {
        this.ctx.save();
        
        // Corpo da bomba (círculo preto)
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.beginPath();
        this.ctx.arc(x, y + size * 0.1, size * 0.7, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Pavio
        this.ctx.strokeStyle = '#8B4513'; // Marrom
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.2, y - size * 0.4);
        this.ctx.lineTo(x - size * 0.4, y - size * 0.8);
        this.ctx.stroke();
        
        // Chama do pavio
        this.ctx.fillStyle = '#FF4500'; // Laranja avermelhado
        this.ctx.beginPath();
        this.ctx.ellipse(x - size * 0.4, y - size * 0.8, size * 0.15, size * 0.2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Centro da chama (amarelo)
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.ellipse(x - size * 0.4, y - size * 0.8, size * 0.08, size * 0.12, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Brilho na bomba
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(x - size * 0.2, y - size * 0.1, size * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
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
        this.ceilingPins = []; // Limpar alfinetes do teto
        this.score = 0;
        this.level = 1;
        this.gameRunning = true;
        this.lastBubbleSpawn = Date.now();
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
let gameStarted = false;

window.addEventListener('load', () => {
    // Não inicializar o jogo automaticamente
    showStartScreen();
});

function showStartScreen() {
    document.getElementById('startScreen').style.display = 'flex';
    document.getElementById('gameArea').style.display = 'none';
    gameStarted = false;
    
    // Parar o jogo se estiver rodando
    if (game) {
        game.gameRunning = false;
    }
}

function startGame() {
    gameStarted = true;
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameArea').style.display = 'block';
    
    // Inicializar o jogo
    game = new BubbleGame();
    game.init();
    
    // Força redimensionamento após mostrar o container
    setTimeout(() => {
        game.resizeCanvas();
    }, 50);
    
    // Iniciar o spawn de bolhas
    game.gameRunning = true;
    
    // Primeira bolha aparece imediatamente
    game.spawnBubble();
}

function goToHome() {
    showStartScreen();
}

function restartGame() {
    if (game) {
        game.restart();
    }
}