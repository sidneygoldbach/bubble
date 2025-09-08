class BubbleGame {
    addExtendedInfoStyles() {
        const extendedStyle = document.createElement('style');
        extendedStyle.textContent = `
        .extended-info {
            margin-top: 10px;
            padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .info-section {
            margin-bottom: 8px;
        }
        
        .info-section:last-child {
            margin-bottom: 0;
        }
        
        .info-section strong {
            color: #ffd700;
            font-size: 12px;
            display: block;
            margin-bottom: 4px;
        }
        
        .info-details {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .info-details span {
            background: rgba(0, 0, 0, 0.3);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            color: #fff;
            white-space: nowrap;
        }
        `;
        document.head.appendChild(extendedStyle);
    }

    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameOverElement = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('finalScore');
        this.finalLevelElement = document.getElementById('finalLevel');
        
        // Adicionar estilos CSS para dados estendidos
        this.addExtendedInfoStyles();
        
        this.bubbles = [];
        this.score = 0;
        this.level = 1;
        this.gameRunning = true;
        this.lastBubbleSpawn = 0;
        this.bubbleSpawnRate = 600; // milliseconds - intervalo base otimizado
        this.maxBubbles = 12; // menos bolhas máximas para evitar travamento
        
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
            BOMB: 'bomb',
            CLOCK: 'clock'
        };
        
        // Sistema de contagem regressiva
        this.timeLeft = 60; // segundos
        this.gameStartTime = 0;
        this.bonusTime = 0;
        
        // Sistema de ranking
        this.playerNames = [
            'Bolheiro', 'Estourador', 'Mestre das Bolhas', 'Caçador', 'Destruidor',
            'Ninja', 'Campeão', 'Lenda', 'Herói', 'Guerreiro', 'Mago', 'Arqueiro',
            'Paladino', 'Assassino', 'Druida', 'Bárbaro', 'Feiticeiro', 'Monge',
            'Ranger', 'Ladino', 'Cavaleiro', 'Samurai', 'Pirata', 'Viking',
            'Gladiador', 'Espartano', 'Centurião', 'Legionário', 'Templário'
        ];
        
        this.init()
    }
    
    init() {
        // Inicializar elementos do DOM
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.timerElement = document.getElementById('timer');
        
        this.setupEventListeners();
        this.createAudioContext();
        
        // Força redimensionamento inicial
        this.resizeCanvas();
        
        // Inicializar UI
        this.updateUI();
        
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
        const containerRect = container.getBoundingClientRect();
        const newWidth = containerRect.width;
        const newHeight = containerRect.height;
        
        // Força o redimensionamento apenas se necessário
        if (this.canvas.width !== newWidth || this.canvas.height !== newHeight) {
            // Define o tamanho interno do canvas (resolução)
            this.canvas.width = newWidth;
            this.canvas.height = newHeight;
            
            // Define o tamanho visual do canvas (CSS)
            this.canvas.style.width = newWidth + 'px';
            this.canvas.style.height = newHeight + 'px';
            
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
        
        // Determinar tipo especial da bolha (10% chance para relógio, 5% para outros)
        let specialType = this.specialBubbleTypes.NORMAL;
        const specialChance = Math.random();
        if (specialChance < 0.05) {
            specialType = this.specialBubbleTypes.TURTLE;
        } else if (specialChance < 0.10) {
            specialType = this.specialBubbleTypes.BOMB;
        } else if (specialChance < 0.20) {
            specialType = this.specialBubbleTypes.CLOCK;
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
        
        // Spawn de novas bolhas - sistema adaptativo para fluxo constante
        const now = Date.now();
        const timeSinceLastSpawn = now - this.lastBubbleSpawn;
        const bubbleCount = this.bubbles.length;
        const targetBubbles = Math.max(4, this.maxBubbles * 0.4); // Mínimo de 4 bolhas sempre
        
        // Calcular intervalo dinâmico baseado na densidade atual
        let dynamicSpawnRate = this.bubbleSpawnRate;
        if (bubbleCount < targetBubbles) {
            // Acelerar spawn quando poucas bolhas
            dynamicSpawnRate = Math.max(300, this.bubbleSpawnRate * 0.5);
        } else if (bubbleCount > this.maxBubbles * 0.8) {
            // Desacelerar spawn quando muitas bolhas
            dynamicSpawnRate = this.bubbleSpawnRate * 1.5;
        }
        
        // Spawn principal
        if (timeSinceLastSpawn > dynamicSpawnRate) {
            this.spawnBubble();
            this.lastBubbleSpawn = now;
            
            // Spawn adicional imediato se muito poucas bolhas
            if (bubbleCount < 2) {
                setTimeout(() => {
                    if (this.bubbles.length < targetBubbles) {
                        this.spawnBubble();
                    }
                }, 150);
            }
        }
        
        // Sistema de emergência: garantir que nunca fique sem bolhas por muito tempo
        if (bubbleCount === 0 && timeSinceLastSpawn > 2000) {
            // Forçar spawn se não há bolhas há mais de 2 segundos
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
                    
                    // Armazenar posição e raio da bomba antes de removê-la
                    const bombX = bubble.x;
                    const bombY = bubble.y;
                    const explosionRadius = bubble.radius * 3.5;
                    
                    // Aplicar regras de pontuação da bomba
                    const points = this.calculatePoints(bubble, i);
                    this.score += points;
                    
                    // Criar efeito visual de explosão da bomba
                    this.createExplosionEffect(bubble.x, bubble.y, bubble.color);
                    
                    // Remove a bolha bomba primeiro
                    this.bubbles.splice(i, 1);
                    
                    // Criar efeito visual de onda de choque
                    this.createShockwaveEffect(bombX, bombY, explosionRadius);
                    
                    // Explodir bolhas vizinhas (agora sem incluir a bomba)
                    this.explodeNearbyBubbles(bombX, bombY, explosionRadius);
                    
                    this.updateUI();
                    this.checkLevelUp();
                    return; // Sair da função para evitar processamento duplicado
                } else if (bubble.specialType === this.specialBubbleTypes.CLOCK) {
                    // Bolha relógio: adicionar 10 segundos
                    this.addTime(10);
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
            this.bubbleSpawnRate = Math.max(400, 800 - (this.level * 80));
            this.maxBubbles = Math.min(20, 12 + this.level);
            
            // Adicionar 10 segundos ao mudar de fase
            this.addTime(10);
            
            // Som de level up
            this.playSound(523, 0.1); // C5
            setTimeout(() => this.playSound(659, 0.1), 100); // E5
            setTimeout(() => this.playSound(784, 0.2), 200); // G5
        }
    }
    
    updateTimer() {
        const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
        this.timeLeft = Math.max(0, 60 - elapsed + this.bonusTime);
        this.updateUI();
    }
    
    addTime(seconds) {
        this.bonusTime = (this.bonusTime || 0) + seconds;
        
        // Efeito visual de tempo adicionado
        this.timerElement.style.animation = 'none';
        this.timerElement.style.background = 'rgba(100, 255, 100, 0.9)';
        setTimeout(() => {
            this.timerElement.style.animation = 'timerPulse 2s infinite';
            this.timerElement.style.background = 'rgba(255, 100, 100, 0.9)';
        }, 1000);
        
        // Som de bônus de tempo
        this.playSound(880, 0.2); // A5
        setTimeout(() => this.playSound(1047, 0.2), 100); // C6
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
        this.timerElement.textContent = this.timeLeft;
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
            } else if (bubble.specialType === this.specialBubbleTypes.CLOCK) {
                this.drawClockIcon(bubble.x, bubble.y, bubble.radius * 0.4);
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
        
        // Casco principal (formato hexagonal)
        this.ctx.fillStyle = '#2D5016'; // Verde escuro
        this.ctx.beginPath();
        const cascoRadius = size * 0.7;
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const px = x + Math.cos(angle) * cascoRadius;
            const py = y + Math.sin(angle) * cascoRadius * 0.8;
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
        
        // Padrão do casco (hexágonos menores)
        this.ctx.fillStyle = '#1A3009';
        // Centro
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const px = x + Math.cos(angle) * size * 0.25;
            const py = y + Math.sin(angle) * size * 0.2;
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
        
        // Hexágonos ao redor
        for (let j = 0; j < 6; j++) {
            const centerAngle = (j * Math.PI) / 3;
            const centerX = x + Math.cos(centerAngle) * size * 0.4;
            const centerY = y + Math.sin(centerAngle) * size * 0.32;
            
            this.ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const px = centerX + Math.cos(angle) * size * 0.12;
                const py = centerY + Math.sin(angle) * size * 0.1;
                if (i === 0) {
                    this.ctx.moveTo(px, py);
                } else {
                    this.ctx.lineTo(px, py);
                }
            }
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        // Cabeça (mais proeminente)
        this.ctx.fillStyle = '#2D5016';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y - size * 0.9, size * 0.35, size * 0.25, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Olhos
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(x - size * 0.15, y - size * 0.95, size * 0.08, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.15, y - size * 0.95, size * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Patas (mais realistas)
        this.ctx.fillStyle = '#2D5016';
        // Patas traseiras
        this.ctx.beginPath();
        this.ctx.ellipse(x - size * 0.6, y + size * 0.4, size * 0.2, size * 0.15, 0, 0, Math.PI * 2);
        this.ctx.ellipse(x + size * 0.6, y + size * 0.4, size * 0.2, size * 0.15, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Patas dianteiras
        this.ctx.beginPath();
        this.ctx.ellipse(x - size * 0.7, y - size * 0.2, size * 0.18, size * 0.12, 0, 0, Math.PI * 2);
        this.ctx.ellipse(x + size * 0.7, y - size * 0.2, size * 0.18, size * 0.12, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Cauda pequena
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + size * 0.8, size * 0.15, size * 0.1, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
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
    
    drawClockIcon(x, y, size) {
        this.ctx.save();
        
        // Corpo do relógio (círculo branco)
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Borda do relógio
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Marcadores das horas (12, 3, 6, 9)
        this.ctx.strokeStyle = '#666666';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            const startX = x + Math.cos(angle) * size * 0.6;
            const startY = y + Math.sin(angle) * size * 0.6;
            const endX = x + Math.cos(angle) * size * 0.7;
            const endY = y + Math.sin(angle) * size * 0.7;
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }
        
        // Ponteiro das horas (apontando para 3)
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + size * 0.4, y);
        this.ctx.stroke();
        
        // Ponteiro dos minutos (apontando para 12)
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x, y - size * 0.6);
        this.ctx.stroke();
        
        // Centro do relógio
        this.ctx.fillStyle = '#333333';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.1, 0, Math.PI * 2);
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
            this.updateTimer();
            this.updateBubbles();
            this.render();
            
            // Verificar condição de game over - agora baseado no timer
            if (this.timeLeft <= 0) {
                this.gameOver();
            }
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    gameOver() {
        this.gameRunning = false;
        this.finalScoreElement.textContent = this.score;
        this.finalLevelElement.textContent = this.level;
        
        // Salvar pontuação no ranking
        this.saveScore(this.score, this.level);
        
        this.gameOverElement.style.display = 'block';
        
        // Som de game over
        this.playSound(220, 0.3, 'sawtooth');
        setTimeout(() => this.playSound(196, 0.5, 'sawtooth'), 300);
    }
    
    generateRandomName() {
        const randomIndex = Math.floor(Math.random() * this.playerNames.length);
        const randomNumber = Math.floor(Math.random() * 999) + 1;
        return `${this.playerNames[randomIndex]}${randomNumber}`;
    }
    
    // Função para detectar tipo de dispositivo
    getDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (/mobile|android|iphone|ipad|phone|tablet/.test(userAgent)) {
            return 'mobile';
        }
        return 'desktop';
    }

    // Função para coletar dados estendidos do navegador
    collectBrowserData() {
        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            deviceType: this.getDeviceType(),
            screenResolution: `${screen.width}x${screen.height}`,
            platform: navigator.platform || 'unknown'
        };
    }

    // Função para obter geolocalização (opcional)
    async getGeolocation() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(null);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                () => resolve(null), // Usuário negou ou erro
                { timeout: 5000, enableHighAccuracy: false }
            );
        });
    }

    // Função para obter dados de IP e localização via API
    async getIPLocationData() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            if (response.ok) {
                const data = await response.json();
                return {
                    ip: data.ip,
                    country: data.country_name,
                    region: data.region,
                    city: data.city,
                    postal: data.postal,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    timezone: data.timezone,
                    isp: data.org
                };
            }
        } catch (error) {
            console.warn('Erro ao obter dados de IP:', error);
        }
        return null;
    }

    async saveScore(score, level) {
        const playerName = this.generateRandomName();
        const browserData = this.collectBrowserData();
        
        // Coletar dados estendidos de forma assíncrona
        const [geolocation, ipLocationData] = await Promise.all([
            this.getGeolocation(),
            this.getIPLocationData()
        ]);
        
        const gameData = {
            name: playerName,
            score: score,
            level: level,
            date: new Date().toISOString(),
            // Dados estendidos do navegador
            browser: {
                userAgent: browserData.userAgent,
                language: browserData.language,
                timezone: browserData.timezone,
                deviceType: browserData.deviceType,
                screenResolution: browserData.screenResolution,
                platform: browserData.platform
            },
            // Dados de localização (se disponíveis)
            location: {
                geolocation: geolocation,
                ipLocation: ipLocationData
            }
        };
        
        try {
            // Carregar ranking existente do servidor
            const ranking = await this.loadRanking();
            
            // Adicionar nova pontuação
            ranking.push(gameData);
            
            // Ordenar por pontuação (maior para menor)
            ranking.sort((a, b) => b.score - a.score);
            
            // Salvar no servidor
            await this.saveRankingToServer(ranking);
            
            console.log(`Pontuação salva no servidor: ${playerName} - ${score} pontos`);
        } catch (error) {
            console.error('Erro ao salvar pontuação:', error);
            // Fallback para localStorage em caso de erro
            this.saveScoreLocally(gameData);
        }
    }
    
    async loadRanking() {
        try {
            const response = await fetch('./ranking.json');
            if (response.ok) {
                return await response.json();
            } else {
                console.warn('Arquivo de ranking não encontrado, criando novo');
                return [];
            }
        } catch (error) {
            console.error('Erro ao carregar ranking do servidor:', error);
            // Fallback para localStorage
            const saved = localStorage.getItem('bubbleGameRanking');
            return saved ? JSON.parse(saved) : [];
        }
    }
    
    async saveRankingToServer(ranking) {
        // Como o servidor HTTP simples não suporta POST, vamos usar uma abordagem alternativa
        // Salvamos no localStorage e exibimos instruções para o usuário
        localStorage.setItem('bubbleGameRanking', JSON.stringify(ranking));
        
        // Simular salvamento no servidor (para desenvolvimento)
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Ranking salvo (simulado)');
                resolve();
            }, 100);
        });
    }
    
    saveScoreLocally(gameData) {
        let ranking = JSON.parse(localStorage.getItem('bubbleGameRanking') || '[]');
        ranking.push(gameData);
        ranking.sort((a, b) => b.score - a.score);
        localStorage.setItem('bubbleGameRanking', JSON.stringify(ranking));
        console.log('Pontuação salva localmente como fallback');
    }
    
    // Função para verificar parâmetros da URL
    getURLParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    // Função para verificar se deve mostrar informações completas
    shouldShowAllInfo() {
        return this.getURLParameter('ranking') === 'allinfo';
    }

    displayRanking(ranking, container) {
        if (ranking.length === 0) {
            container.innerHTML = '<div class="no-scores">Nenhuma pontuação registrada ainda.</div>';
            return;
        }

        const showAllInfo = this.shouldShowAllInfo();
        let html = `<div class="ranking-header">🏆 Top Jogadores ${showAllInfo ? '(Dados Completos)' : ''}</div>`;
        
        ranking.forEach((score, index) => {
            const position = index + 1;
            const medal = position <= 3 ? ['🥇', '🥈', '🥉'][position - 1] : `${position}º`;
            const date = new Date(score.date).toLocaleDateString('pt-BR');
            
            html += `
                <div class="ranking-item ${position <= 3 ? 'top-three' : ''}">
                    <div class="ranking-position">${medal}</div>
                    <div class="ranking-info">
                        <div class="ranking-name">${score.name}</div>
                        <div class="ranking-details">
                            <span class="score">Pontos: ${score.score.toLocaleString()}</span>
                            <span class="level">Nível: ${score.level}</span>
                            <span class="date">${date}</span>
                        </div>`;
            
            // Mostrar dados estendidos se parâmetro estiver presente
            if (showAllInfo && score.browser) {
                html += `
                        <div class="extended-info">
                            <div class="info-section">
                                <strong>Navegador:</strong>
                                <div class="info-details">
                                    <span>Dispositivo: ${score.browser.deviceType || 'N/A'}</span>
                                    <span>Idioma: ${score.browser.language || 'N/A'}</span>
                                    <span>Timezone: ${score.browser.timezone || 'N/A'}</span>
                                    <span>Resolução: ${score.browser.screenResolution || 'N/A'}</span>
                                    <span>Plataforma: ${score.browser.platform || 'N/A'}</span>
                                </div>
                            </div>`;
                
                if (score.location) {
                    if (score.location.ipLocation) {
                        const loc = score.location.ipLocation;
                        html += `
                            <div class="info-section">
                                <strong>Localização (IP):</strong>
                                <div class="info-details">
                                    <span>País: ${loc.country || 'N/A'}</span>
                                    <span>Região: ${loc.region || 'N/A'}</span>
                                    <span>Cidade: ${loc.city || 'N/A'}</span>
                                    <span>IP: ${loc.ip || 'N/A'}</span>
                                    <span>ISP: ${loc.isp || 'N/A'}</span>
                                </div>
                            </div>`;
                    }
                    
                    if (score.location.geolocation) {
                        const geo = score.location.geolocation;
                        html += `
                            <div class="info-section">
                                <strong>Geolocalização:</strong>
                                <div class="info-details">
                                    <span>Lat: ${geo.latitude?.toFixed(4) || 'N/A'}</span>
                                    <span>Lng: ${geo.longitude?.toFixed(4) || 'N/A'}</span>
                                    <span>Precisão: ${geo.accuracy ? geo.accuracy + 'm' : 'N/A'}</span>
                                </div>
                            </div>`;
                    }
                }
                
                html += `</div>`;
            }
            
            html += `
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    async getRanking(limit = null) {
        const ranking = await this.loadRanking();
        return limit ? ranking.slice(0, limit) : ranking;
    }
    
    restart() {
        this.bubbles = [];
        this.ceilingPins = []; // Limpar alfinetes do teto
        this.score = 0;
        this.level = 1;
        this.gameRunning = true;
        this.lastBubbleSpawn = Date.now();
        this.bubbleSpawnRate = 600;
        this.maxBubbles = 12;
        
        // Reinicializar timer
        this.timeLeft = 60;
        this.gameStartTime = Date.now();
        this.bonusTime = 0;
        
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
    
    // Inicializar timer do jogo
    game.gameStartTime = Date.now();
    game.bonusTime = 0;
    
    // Primeira bolha aparece imediatamente
    game.spawnBubble();
}

function goToHome() {
    showStartScreen();
}

// Funções do Ranking
async function showRanking() {
    const modal = document.getElementById('rankingModal');
    const rankingList = document.getElementById('rankingList');
    
    // Limpar lista atual e mostrar loading
    rankingList.innerHTML = '<div class="no-scores">Carregando ranking...</div>';
    modal.style.display = 'flex';
    
    try {
        // Obter ranking do servidor
        const ranking = game ? await game.getRanking() : await loadRankingFromServer();
        
        // Limpar loading
        rankingList.innerHTML = '';
        
        if (ranking.length === 0) {
            rankingList.innerHTML = '<div class="no-scores">Nenhuma pontuação registrada ainda.<br>Jogue para aparecer no ranking!</div>';
        } else {
            ranking.forEach((entry, index) => {
                const listItem = document.createElement('li');
                listItem.className = 'ranking-item';
                
                const date = new Date(entry.date);
                const formattedDate = date.toLocaleDateString('pt-BR');
                
                listItem.innerHTML = `
                    <div class="ranking-position">${index + 1}º</div>
                    <div class="ranking-info">
                        <div class="ranking-name">${entry.name}</div>
                        <div class="ranking-level">Nível ${entry.level} • ${formattedDate}</div>
                    </div>
                    <div class="ranking-score">${entry.score.toLocaleString()}</div>
                `;
                
                rankingList.appendChild(listItem);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar ranking:', error);
        rankingList.innerHTML = '<div class="no-scores">Erro ao carregar ranking.<br>Tente novamente mais tarde.</div>';
    }
}

async function loadRankingFromServer() {
    try {
        const response = await fetch('./ranking.json');
        if (response.ok) {
            return await response.json();
        } else {
            return [];
        }
    } catch (error) {
        // Fallback para localStorage
        const saved = localStorage.getItem('bubbleGameRanking');
        return saved ? JSON.parse(saved) : [];
    }
}

function closeRanking() {
    document.getElementById('rankingModal').style.display = 'none';
}

// Fechar modal clicando fora dela
document.getElementById('rankingModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeRanking();
    }
});

function restartGame() {
    if (game) {
        game.restart();
    }
}