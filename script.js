// ============== КОНСТАНТЫ И НАСТРОЙКИ ==============
const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const PLAYER_SPEED = 5;
const CAMERA_SPEED = 5;
const GROUND_Y = 500;
const PLAYER_SIZE = 40;

// ============== КЛАСС ИГРОКА ==============
class Player {
    constructor() {
        this.x = 100;
        this.y = GROUND_Y - PLAYER_SIZE;
        this.width = PLAYER_SIZE;
        this.height = PLAYER_SIZE;
        this.velocityY = 0;
        this.isJumping = false;
        this.isAlive = true;
        this.rotation = 0;
        this.color = '#ffff00';
        this.trail = [];
        this.trailLength = 10;
        
        // Физика как в оригинале
        this.gravity = GRAVITY;
        this.jumpForce = JUMP_FORCE;
    }
    
    jump() {
        if (!this.isJumping && this.isAlive) {
            this.velocityY = this.jumpForce;
            this.isJumping = true;
            playSound('jump');
            
            // Создать частицы прыжка
            createParticles(this.x + this.width/2, this.y + this.height, 10, '#ffff00');
        }
    }
    
    update() {
        if (!this.isAlive) return;
        
        // Гравитация
        this.velocityY += this.gravity;
        this.y += this.velocityY;
        
        // Проверка земли
        if (this.y >= GROUND_Y - this.height) {
            this.y = GROUND_Y - this.height;
            this.velocityY = 0;
            this.isJumping = false;
        }
        
        // Проверка потолка
        if (this.y < 0) {
            this.y = 0;
            this.velocityY = 0;
        }
        
        // Вращение
        this.rotation += this.velocityY * 0.1;
        
        // След
        this.trail.push({x: this.x, y: this.y, rotation: this.rotation});
        if (this.trail.length > this.trailLength) {
            this.trail.shift();
        }
    }
    
    draw(ctx) {
        // Рисуем след
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = i / this.trail.length * 0.5;
            ctx.save();
            ctx.translate(this.trail[i].x + this.width/2, this.trail[i].y + this.height/2);
            ctx.rotate(this.trail[i].rotation);
            ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
            ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
            ctx.restore();
        }
        
        // Рисуем игрока
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.rotation);
        
        // Основной квадрат
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Обводка
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Эффект свечения
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        ctx.shadowBlur = 0;
        
        ctx.restore();
    }
    
    reset() {
        this.x = 100;
        this.y = GROUND_Y - PLAYER_SIZE;
        this.velocityY = 0;
        this.isJumping = false;
        this.isAlive = true;
        this.rotation = 0;
        this.trail = [];
    }
}

// ============== КЛАСС ПРЕПЯТСТВИЙ ==============
class Obstacle {
    constructor(type, x, y, width, height, options = {}) {
        this.type = type; // 'spike', 'block', 'moving', 'portal'
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = options.color || '#ff0000';
        this.speed = options.speed || 0;
        this.direction = options.direction || 1;
        this.startX = x;
        this.startY = y;
        this.moveDistance = options.moveDistance || 100;
        this.isDeadly = options.isDeadly !== false;
        this.rotation = 0;
        
        // Для порталов
        this.targetRotation = options.targetRotation || 0;
        this.portalType = options.portalType || 'normal';
    }
    
    update() {
        // Движение для подвижных платформ
        if (this.type === 'moving') {
            this.x += this.speed * this.direction;
            if (Math.abs(this.x - this.startX) > this.moveDistance) {
                this.direction *= -1;
            }
        }
        
        // Вращение для порталов
        if (this.type === 'portal') {
            this.rotation += 0.1;
        }
    }
    
    draw(ctx) {
        ctx.save();
        
        switch(this.type) {
            case 'spike':
                // Шип
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + this.height);
                ctx.lineTo(this.x + this.width/2, this.y);
                ctx.lineTo(this.x + this.width, this.y + this.height);
                ctx.closePath();
                ctx.fill();
                
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 15;
                ctx.fill();
                break;
                
            case 'block':
                // Блок
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                
                // Текстура
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                for(let i = 0; i < this.width; i += 10) {
                    for(let j = 0; j < this.height; j += 10) {
                        ctx.strokeRect(this.x + i, this.y + j, 10, 10);
                    }
                }
                
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 10;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                break;
                
            case 'portal':
                // Портал
                ctx.translate(this.x + this.width/2, this.y + this.height/2);
                ctx.rotate(this.rotation);
                
                ctx.fillStyle = this.portalType === 'gravity' ? '#00ffff' : '#ff00ff';
                ctx.beginPath();
                ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(0, 0, this.width/4, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.shadowColor = ctx.fillStyle;
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'moving':
                // Движущаяся платформа
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                
                // Анимация движения
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 3;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(this.x, this.y, this.width, this.height);
                ctx.setLineDash([]);
                break;
        }
        
        ctx.restore();
        ctx.shadowBlur = 0;
    }
    
    collides(player) {
        return player.x < this.x + this.width &&
               player.x + player.width > this.x &&
               player.y < this.y + this.height &&
               player.y + player.height > this.y;
    }
}

// ============== КЛАСС УРОВНЯ ==============
class Level {
    constructor(levelData) {
        this.name = levelData.name;
        this.length = levelData.length;
        this.obstacles = [];
        this.decorations = [];
        this.background = levelData.background || '#000';
        this.gravity = levelData.gravity || GRAVITY;
        this.music = levelData.music;
        this.cameraX = 0;
        this.progress = 0;
        
        // Загрузка препятствий
        levelData.obstacles.forEach(obs => {
            this.obstacles.push(new Obstacle(
                obs.type,
                obs.x,
                obs.y,
                obs.width,
                obs.height,
                obs.options || {}
            ));
        });
        
        // Декорации
        levelData.decorations?.forEach(dec => {
            this.decorations.push({
                x: dec.x,
                y: dec.y,
                width: dec.width,
                height: dec.height,
                color: dec.color,
                type: dec.type
            });
        });
    }
    
    update(player) {
        // Движение камеры
        const targetX = player.x - 300;
        this.cameraX += (targetX - this.cameraX) * 0.1;
        
        // Обновление препятствий
        this.obstacles.forEach(obs => obs.update());
        
        // Расчет прогресса
        this.progress = Math.min((player.x / this.length) * 100, 100);
    }
    
    draw(ctx, width, height) {
        // Фон
        ctx.fillStyle = this.background;
        ctx.fillRect(0, 0, width, height);
        
        // Градиент для глубины
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(0, 0, 50, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Сетка фона
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for(let i = 0; i < width; i += 50) {
            for(let j = 0; j < height; j += 50) {
                ctx.strokeRect(i - this.cameraX * 0.5, j, 50, 50);
            }
        }
        
        // Декорации
        this.decorations.forEach(dec => {
            ctx.save();
            ctx.translate(-this.cameraX * 0.7, 0);
            
            ctx.fillStyle = dec.color;
            if (dec.type === 'circle') {
                ctx.beginPath();
                ctx.arc(dec.x, dec.y, dec.width/2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(dec.x, dec.y, dec.width, dec.height);
            }
            
            ctx.restore();
        });
        
        // Земля
        ctx.fillStyle = '#333';
        ctx.fillRect(-this.cameraX, GROUND_Y, width * 2, height - GROUND_Y);
        
        // Детали земли
        ctx.fillStyle = '#222';
        for(let i = 0; i < width * 2; i += 100) {
            ctx.fillRect(-this.cameraX + i, GROUND_Y, 50, 20);
        }
        
        // Препятствия
        this.obstacles.forEach(obs => {
            ctx.save();
            ctx.translate(-this.cameraX, 0);
            obs.draw(ctx);
            ctx.restore();
        });
        
        // Прогресс-бар
        const progressBarWidth = width - 100;
        const progressX = 50;
        const progressY = height - 30;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(progressX, progressY, progressBarWidth, 10);
        
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(progressX, progressY, (this.progress / 100) * progressBarWidth, 10);
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(progressX, progressY, progressBarWidth, 10);
    }
    
    checkCollisions(player) {
        for (const obstacle of this.obstacles) {
            if (obstacle.isDeadly && obstacle.collides(player)) {
                return true;
            }
        }
        return false;
    }
}

// ============== КЛАСС РЕНДЕРЕРА ==============
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.particles = [];
        this.backgroundParticles = [];
        this.effects = [];
        
        // Создание фоновых частиц
        for(let i = 0; i < 50; i++) {
            this.backgroundParticles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 0.5 + 0.1,
                color: `rgba(${Math.random() * 255}, ${Math.random() * 255}, 255, 0.3)`
            });
        }
    }
    
    update() {
        // Фоновые частицы
        this.backgroundParticles.forEach(p => {
            p.x -= p.speed;
            if (p.x < 0) {
                p.x = this.width;
                p.y = Math.random() * this.height;
            }
        });
        
        // Эффекты
        this.particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            p.alpha -= 0.02;
            
            if (p.life <= 0 || p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        });
        
        // Спецэффекты
        this.effects.forEach((e, i) => {
            e.duration--;
            if (e.duration <= 0) {
                this.effects.splice(i, 1);
            }
        });
    }
    
    render(level, player) {
        // Очистка
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Рендер уровня
        level.draw(this.ctx, this.width, this.height);
        
        // Фоновые частицы
        this.backgroundParticles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        
        // Рендер игрока
        this.ctx.save();
        this.ctx.translate(-level.cameraX, 0);
        player.draw(this.ctx);
        this.ctx.restore();
        
        // Рендер частиц
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.translate(-level.cameraX, 0);
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
            this.ctx.restore();
        });
        
        // Эффекты
        this.effects.forEach(e => {
            if (e.type === 'flash') {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${e.intensity})`;
                this.ctx.fillRect(0, 0, this.width, this.height);
            }
        });
    }
    
    addParticle(x, y, vx, vy, color, size = 3) {
        this.particles.push({
            x, y, vx, vy,
            color,
            size,
            life: 30,
            alpha: 1
        });
    }
    
    addEffect(type, duration, intensity = 0.5) {
        this.effects.push({ type, duration, intensity });
    }
}

// ============== ИГРОВАЯ ЛОГИКА ==============
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.player = new Player();
        this.renderer = new Renderer(this.canvas);
        this.currentLevel = null;
        this.levels = [];
        this.currentLevelIndex = 0;
        this.gameState = 'menu'; // menu, playing, paused, dead, levelSelect
        this.score = 0;
        this.attempts = 0;
        this.lastTime = 0;
        this.fps = 60;
        this.audioEnabled = true;
        
        // Загрузка уровней
        this.loadLevels();
        
        // Настройка канваса
        this.canvas.width = 1000;
        this.canvas.height = 600;
        
        // Инициализация
        this.initEventListeners();
        this.initUI();
        
        // Запуск игрового цикла
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    async loadLevels() {
        // Уровни можно загрузить из JSON файлов
        // Здесь создадим 3 уровня программно
        this.levels = [
            {
                name: "Stereo Madness",
                length: 3000,
                background: "#1a0a2a",
                obstacles: [
                    {type: 'spike', x: 500, y: GROUND_Y - 30, width: 40, height: 30},
                    {type: 'block', x: 800, y: GROUND_Y - 80, width: 100, height: 80},
                    {type: 'spike', x: 1000, y: GROUND_Y - 30, width: 40, height: 30},
                    {type: 'moving', x: 1300, y: GROUND_Y - 60, width: 150, height: 30, options: {speed: 3, moveDistance: 200}},
                    {type: 'portal', x: 2000, y: GROUND_Y - 100, width: 80, height: 80, options: {portalType: 'gravity'}},
                    {type: 'spike', x: 2200, y: GROUND_Y - 30, width: 40, height: 30},
                    {type: 'block', x: 2400, y: GROUND_Y - 120, width: 80, height: 120},
                    {type: 'spike', x: 2600, y: GROUND_Y - 30, width: 40, height: 30}
                ],
                decorations: [
                    {type: 'circle', x: 400, y: 100, width: 50, height: 50, color: '#ff00ff'},
                    {type: 'circle', x: 900, y: 200, width: 30, height: 30, color: '#00ffff'},
                    {type: 'rect', x: 1500, y: 150, width: 100, height: 20, color: '#ffff00'}
                ]
            },
            {
                name: "Back On Track",
                length: 4000,
                background: "#0a2a1a",
                obstacles: [
                    {type: 'spike', x: 400, y: GROUND_Y - 30, width: 40, height: 30},
                    {type: 'block', x: 700, y: GROUND_Y - 100, width: 80, height: 100},
                    {type: 'moving', x: 1000, y: GROUND_Y - 40, width: 200, height: 40, options: {speed: 2, moveDistance: 150}},
                    {type: 'spike', x: 1300, y: GROUND_Y - 30, width: 40, height: 30},
                    {type: 'block', x: 1600, y: GROUND_Y - 150, width: 100, height: 150},
                    {type: 'portal', x: 2000, y: GROUND_Y - 100, width: 80, height: 80},
                    {type: 'moving', x: 2500, y: GROUND_Y - 80, width: 120, height: 80, options: {speed: 4, moveDistance: 300}},
                    {type: 'spike', x: 3000, y: GROUND_Y - 30, width: 40, height: 30},
                    {type: 'block', x: 3300, y: GROUND_Y - 200, width: 150, height: 200}
                ],
                decorations: [
                    {type: 'rect', x: 600, y: 80, width: 80, height: 80, color: '#00ff00'},
                    {type: 'circle', x: 1200, y: 120, width: 40, height: 40, color: '#ff8800'},
                    {type: 'rect', x: 1800, y: 180, width: 60, height: 60, color: '#0088ff'}
                ]
            },
            {
                name: "Polargeist",
                length: 5000,
                background: "#1a1a3a",
                obstacles: [
                    {type: 'block', x: 300, y: GROUND_Y - 200, width: 100, height: 200},
                    {type: 'spike', x: 500, y: GROUND_Y - 30, width: 40, height: 30},
                    {type: 'moving', x: 800, y: GROUND_Y - 60, width: 180, height: 60, options: {speed: 5, moveDistance: 250}},
                    {type: 'portal', x: 1200, y: GROUND_Y - 100, width: 80, height: 80, options: {portalType: 'gravity'}},
                    {type: 'spike', x: 1500, y: GROUND_Y - 30, width: 40, height: 30},
                    {type: 'block', x: 1800, y: GROUND_Y - 250, width: 120, height: 250},
                    {type: 'moving', x: 2200, y: GROUND_Y - 40, width: 250, height: 40, options: {speed: 3, moveDistance: 400}},
                    {type: 'spike', x: 2800, y: GROUND_Y - 30, width: 40, height: 30},
                    {type: 'portal', x: 3200, y: GROUND_Y - 100, width: 80, height: 80},
                    {type: 'block', x: 3800, y: GROUND_Y - 300, width: 150, height: 300},
                    {type: 'spike', x: 4200, y: GROUND_Y - 30, width: 40, height: 30},
                    {type: 'moving', x: 4500, y: GROUND_Y - 100, width: 200, height: 100, options: {speed: 4, moveDistance: 200}}
                ],
                decorations: [
                    {type: 'circle', x: 200, y: 50, width: 70, height: 70, color: '#ff0088'},
                    {type: 'rect', x: 900, y: 90, width: 90, height: 90, color: '#88ff00'},
                    {type: 'circle', x: 1600, y: 160, width: 50, height: 50, color: '#0088ff'},
                    {type: 'rect', x: 2400, y: 120, width: 120, height: 40, color: '#ff8800'}
                ]
            }
        ];
    }
    
    initEventListeners() {
        // Управление
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.player.jump();
                }
            }
            
            if (e.key === 'r' || e.key === 'R') {
                if (this.gameState === 'playing' || this.gameState === 'dead') {
                    this.restartLevel();
                }
            }
            
            if (e.key === 'Escape') {
                if (this.gameState === 'playing') {
                    this.pauseGame();
                } else if (this.gameState === 'paused') {
                    this.resumeGame();
                }
            }
        });
        
        // Клик для прыжка
        this.canvas.addEventListener('click', () => {
            if (this.gameState === 'playing') {
                this.player.jump();
            }
        });
        
        // Сенсорное управление
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameState === 'playing') {
                this.player.jump();
            }
        });
    }
    
    initUI() {
        // Кнопки меню
        document.getElementById('play-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('level-select-btn').addEventListener('click', () => {
            this.showLevelSelect();
        });
        
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettings();
        });
        
        // Пауза
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.resumeGame();
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartLevel();
        });
        
        document.getElementById('exit-btn').addEventListener('click', () => {
            this.showMenu();
        });
        
        // Выбор уровня
        document.querySelectorAll('.level-card').forEach(card => {
            card.addEventListener('click', () => {
                const level = parseInt(card.dataset.level);
                this.selectLevel(level - 1);
            });
        });
        
        document.getElementById('back-btn').addEventListener('click', () => {
            this.showMenu();
        });
        
        // Смерть
        document.getElementById('try-again-btn').addEventListener('click', () => {
            this.restartLevel();
        });
        
        document.getElementById('menu-btn').addEventListener('click', () => {
            this.showMenu();
        });
        
        // Настройки
        document.getElementById('settings-back-btn').addEventListener('click', () => {
            this.showMenu();
        });
        
        // Настройки звука
        document.getElementById('music-volume').addEventListener('input', (e) => {
            const bgMusic = document.getElementById('bg-music');
            bgMusic.volume = e.target.value / 100;
        });
        
        document.getElementById('sfx-volume').addEventListener('input', (e) => {
            // Сохраняем громкость SFX
            localStorage.setItem('sfxVolume', e.target.value);
        });
        
        document.getElementById('show-fps').addEventListener('change', (e) => {
            document.getElementById('fps-counter').classList.toggle('hidden', !e.target.checked);
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        this.currentLevel = new Level(this.levels[this.currentLevelIndex]);
        this.player.reset();
        this.attempts = 1;
        this.updateUI();
        
        document.getElementById('menu').classList.add('hidden');
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('death-screen').classList.add('hidden');
        
        // Запуск музыки
        const bgMusic = document.getElementById('bg-music');
        bgMusic.currentTime = 0;
        bgMusic.play().catch(e => console.log("Автовоспроизведение заблокировано"));
    }
    
    selectLevel(index) {
        this.currentLevelIndex = index;
        this.startGame();
    }
    
    pauseGame() {
        this.gameState = 'paused';
        document.getElementById('pause-menu').classList.remove('hidden');
        
        // Пауза музыки
        document.getElementById('bg-music').pause();
    }
    
    resumeGame() {
        this.gameState = 'playing';
        document.getElementById('pause-menu').classList.add('hidden');
        
        // Возобновление музыки
        document.getElementById('bg-music').play();
    }
    
    restartLevel() {
        this.attempts++;
        this.player.reset();
        this.currentLevel = new Level(this.levels[this.currentLevelIndex]);
        this.gameState = 'playing';
        
        document.getElementById('death-screen').classList.add('hidden');
        document.getElementById('pause-menu').classList.add('hidden');
        
        this.updateUI();
    }
    
    showMenu() {
        this.gameState = 'menu';
        document.getElementById('menu').classList.remove('hidden');
        document.getElementById('level-select').classList.add('hidden');
        document.getElementById('settings').classList.add('hidden');
        document.getElementById('death-screen').classList.add('hidden');
        document.getElementById('pause-menu').classList.add('hidden');
        
        // Остановка музыки
        document.getElementById('bg-music').pause();
    }
    
    showLevelSelect() {
        document.getElementById('menu').classList.add('hidden');
        document.getElementById('level-select').classList.remove('hidden');
        
        // Обновление прогресса уровней
        for(let i = 1; i <= 3; i++) {
            const progress = localStorage.getItem(`level${i}_progress`) || 0;
            document.getElementById(`progress-${i}`).textContent = `${progress}%`;
        }
    }
    
    showSettings() {
        document.getElementById('menu').classList.add('hidden');
        document.getElementById('settings').classList.remove('hidden');
    }
    
    gameOver() {
        this.gameState = 'dead';
        this.player.isAlive = false;
        
        playSound('death');
        this.renderer.addEffect('flash', 10, 0.7);
        
        // Сохранение прогресса
        if (this.currentLevel) {
            const progress = Math.round(this.currentLevel.progress);
            const levelKey = `level${this.currentLevelIndex + 1}_progress`;
            const bestProgress = localStorage.getItem(levelKey) || 0;
            if (progress > bestProgress) {
                localStorage.setItem(levelKey, progress);
            }
        }
        
        // Обновление UI
        document.getElementById('death-progress').textContent = 
            `${Math.round(this.currentLevel?.progress || 0)}%`;
        document.getElementById('death-attempt').textContent = this.attempts;
        document.getElementById('death-screen').classList.remove('hidden');
        
        // Создание частиц смерти
        for(let i = 0; i < 50; i++) {
            createParticles(
                this.player.x + this.player.width/2,
                this.player.y + this.player.height/2,
                20,
                '#ff0000'
            );
        }
    }
    
    updateUI() {
        if (this.currentLevel) {
            document.getElementById('score').textContent = 
                `${Math.round(this.currentLevel.progress)}%`;
            document.getElementById('level-name').textContent = this.currentLevel.name;
            document.getElementById('attempts').textContent = `Attempts: ${this.attempts}`;
        }
        
        // FPS счетчик
        if (!document.getElementById('fps-counter').classList.contains('hidden')) {
            document.getElementById('fps-counter').textContent = `${Math.round(this.fps)} FPS`;
        }
    }
    
    gameLoop(timestamp) {
        // Расчет FPS
        if (this.lastTime) {
            const delta = timestamp - this.lastTime;
            this.fps = 1000 / delta;
        }
        this.lastTime = timestamp;
        
        // Обновление
        if (this.gameState === 'playing' && this.currentLevel) {
            this.player.update();
            this.currentLevel.update(this.player);
            this.renderer.update();
            
            // Проверка столкновений
            if (this.currentLevel.checkCollisions(this.player)) {
                this.gameOver();
            }
            
            // Проверка завершения уровня
            if (this.player.x >= this.currentLevel.length) {
                // Уровень пройден
                this.completeLevel();
            }
            
            this.updateUI();
        }
        
        // Рендер
        if (this.currentLevel) {
            this.renderer.render(this.currentLevel, this.player);
        }
        
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    completeLevel() {
        alert(`Level Complete! Progress: 100%\nAttempts: ${this.attempts}`);
        this.showLevelSelect();
        
        // Сохранение 100% прогресса
        const levelKey = `level${this.currentLevelIndex + 1}_progress`;
        localStorage.setItem(levelKey, '100');
    }
}

// ============== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==============
function playSound(soundId) {
    const sound = document.getElementById(`${soundId}-sound`);
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Звук не может быть воспроизведен"));
    }
}

function createParticles(x, y, count, color) {
    const renderer = window.game?.renderer;
    if (!renderer) return;
    
    for(let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 1;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        renderer.addParticle(x, y, vx, vy, color, Math.random() * 4 + 2);
    }
}

// ============== ЗАПУСК ИГРЫ ==============
window.addEventListener('load', () => {
    // Создание звуков если их нет
    createAudioFiles();
    
    // Инициализация игры
    window.game = new Game();
    console.log('Geometry Dash Clone загружен!');
});

// Создание базовых аудиофайлов (заглушки)
function createAudioFiles() {
    // В реальном проекте здесь должны быть настоящие аудиофайлы
    // Эти функции создают базовые звуки через Web Audio API
    
    try {
        // Создаем простой звук прыжка
        const jumpSound = document.getElementById('jump-sound');
        if (jumpSound.src.includes('#')) {
            // Заглушка - в реальном проекте используйте настоящие файлы
            console.log('Используйте реальные аудиофайлы для лучшего качества');
        }
        
        // То же для других звуков
    } catch (e) {
        console.log('Аудио система недоступна:', e);
    }
}
