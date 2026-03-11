class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.bgm = new Audio('01.开始背景音乐_爱给网_aigei_com.MP3');
        this.bgm.loop = true;
        this.bgmVolume = 0.5;
        this.sfxVolume = 0.3;
        this.bgm.volume = this.bgmVolume;
    }
    init() { if (!this.audioContext) this.audioContext = new (window.AudioContext || window.webkitAudioContext)(); }
    playBGM() { this.bgm.play().catch(() => {}); }
    pauseBGM() { this.bgm.pause(); }
    setBGMVolume(vol) { this.bgmVolume = vol; this.bgm.volume = vol; }
    setSFXVolume(vol) { this.sfxVolume = vol; }
    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.enabled || !this.audioContext) return;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        gainNode.gain.setValueAtTime(volume * this.sfxVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    plantSound() { this.playTone(440, 0.1, 'sine', 0.2); setTimeout(() => this.playTone(550, 0.1, 'sine', 0.2), 50); }
    shootSound() { this.playTone(800, 0.05, 'square', 0.1); }
    hitSound() { this.playTone(200, 0.1, 'sawtooth', 0.15); }
    sunCollectSound() { this.playTone(880, 0.1, 'sine', 0.2); setTimeout(() => this.playTone(1100, 0.15, 'sine', 0.2), 80); }
    coinCollectSound() { this.playTone(1200, 0.1, 'sine', 0.25); setTimeout(() => this.playTone(1500, 0.15, 'sine', 0.25), 80); }
    seedDropSound() { this.playTone(600, 0.2, 'triangle', 0.3); setTimeout(() => this.playTone(800, 0.2, 'triangle', 0.3), 100); }
    zombieDeathSound() { this.playTone(150, 0.2, 'sawtooth', 0.2); setTimeout(() => this.playTone(100, 0.3, 'sawtooth', 0.15), 100); }
    explosionSound() { for (let i = 0; i < 5; i++) setTimeout(() => this.playTone(100 + Math.random() * 100, 0.1, 'sawtooth', 0.3), i * 30); }
    gameOverSound() { this.playTone(300, 0.3, 'sine', 0.3); setTimeout(() => this.playTone(250, 0.3, 'sine', 0.3), 200); setTimeout(() => this.playTone(200, 0.5, 'sine', 0.3), 400); }
    winSound() { const notes = [523, 659, 784, 1047]; notes.forEach((note, i) => setTimeout(() => this.playTone(note, 0.2, 'sine', 0.25), i * 150)); }
    waveSound() { this.playTone(600, 0.15, 'triangle', 0.2); setTimeout(() => this.playTone(800, 0.2, 'triangle', 0.25), 100); }
    newPlantSound() { const notes = [523, 659, 784, 880, 1047]; notes.forEach((note, i) => setTimeout(() => this.playTone(note, 0.15, 'sine', 0.3), i * 100)); }
}

const sound = new SoundManager();

const CONFIG = {
    CANVAS_WIDTH: 900, CANVAS_HEIGHT: 600,
    GRID_COLS: 9, GRID_ROWS: 5,
    CELL_WIDTH: 80, CELL_HEIGHT: 100,
    GRID_OFFSET_X: 60, TOP_BAR_HEIGHT: 80,
    SUN_VALUE: 25, SUN_INTERVAL: 10000,
    ZOMBIE_SPAWN_DELAY: 20000,
    GARDEN_GROWTH_TIME: 3600000
};

const ALL_PLANTS = {
    sunflower: { name: '向日葵', cost: 50, cooldown: 7500, health: 100, sunInterval: 8000, desc: '生产阳光的基础植物' },
    peashooter: { name: '豌豆射手', cost: 100, cooldown: 7500, health: 100, damage: 25, fireRate: 1500, desc: '发射豌豆攻击僵尸' },
    wallnut: { name: '坚果墙', cost: 50, cooldown: 30000, health: 4000, desc: '高血量防御植物，阻挡僵尸' },
    snowpea: { name: '寒冰射手', cost: 175, cooldown: 7500, health: 100, damage: 20, fireRate: 1500, slowEffect: 0.5, desc: '发射冰豌豆，减速僵尸' },
    cherrybomb: { name: '樱桃炸弹', cost: 150, cooldown: 50000, health: 100, damage: 1800, desc: '爆炸消灭周围所有僵尸' },
    repeater: { name: '双发射手', cost: 200, cooldown: 7500, health: 100, damage: 20, fireRate: 1500, desc: '一次发射两颗豌豆' },
    chomper: { name: '大嘴花', cost: 150, cooldown: 30000, health: 100, damage: 3000, desc: '一口吞掉一个僵尸' },
    potatoMine: { name: '土豆雷', cost: 25, cooldown: 20000, health: 100, damage: 1800, desc: '埋在地下，僵尸踩到爆炸' },
    squash: { name: '窝瓜', cost: 50, cooldown: 30000, health: 100, damage: 1800, desc: '压扁附近的僵尸' }
};

const ALL_ZOMBIES = {
    normal: { name: '普通僵尸', health: 200, speed: 0.015, damage: 100, desc: '最基础的僵尸类型' },
    cone: { name: '路障僵尸', health: 560, speed: 0.015, damage: 100, desc: '头戴路障，比普通僵尸更耐打' },
    bucket: { name: '铁桶僵尸', health: 1300, speed: 0.015, damage: 100, desc: '头戴铁桶，防御力很强' },
    flag: { name: '旗帜僵尸', health: 200, speed: 0.025, damage: 100, desc: '大波僵尸的先头部队' },
    polevault: { name: '撑杆跳僵尸', health: 170, speed: 0.025, damage: 100, canJump: true, desc: '可以跳过第一个植物' },
    newspaper: { name: '读报僵尸', health: 300, speed: 0.015, damage: 100, desc: '报纸被打掉后会加速' },
    screenDoor: { name: '铁栅门僵尸', health: 850, speed: 0.015, damage: 100, desc: '手持铁栅门，挡住正面攻击' }
};

const LEVELS = [
    { waves: 2, zombies: ['normal'], plants: ['sunflower', 'peashooter'], unlockPlant: 'wallnut', sun: 150 },
    { waves: 3, zombies: ['normal'], plants: ['sunflower', 'peashooter', 'wallnut'], unlockPlant: 'snowpea', sun: 100 },
    { waves: 3, zombies: ['normal', 'cone'], plants: ['sunflower', 'peashooter', 'wallnut', 'snowpea'], unlockPlant: 'cherrybomb', sun: 75 },
    { waves: 4, zombies: ['normal', 'cone'], plants: ['sunflower', 'peashooter', 'wallnut', 'snowpea', 'cherrybomb'], unlockPlant: 'repeater', sun: 75 },
    { waves: 4, zombies: ['normal', 'cone', 'bucket'], plants: ['sunflower', 'peashooter', 'wallnut', 'snowpea', 'cherrybomb', 'repeater'], unlockPlant: 'chomper', sun: 100 },
    { waves: 5, zombies: ['normal', 'cone', 'bucket', 'polevault'], plants: ['sunflower', 'peashooter', 'wallnut', 'snowpea', 'cherrybomb', 'repeater', 'chomper'], unlockPlant: 'potatoMine', sun: 100 },
    { waves: 5, zombies: ['normal', 'cone', 'bucket', 'polevault', 'newspaper'], plants: ['sunflower', 'peashooter', 'wallnut', 'snowpea', 'cherrybomb', 'repeater', 'chomper', 'potatoMine'], unlockPlant: 'squash', sun: 100 },
    { waves: 6, zombies: ['normal', 'cone', 'bucket', 'polevault', 'newspaper', 'screenDoor'], plants: ['sunflower', 'peashooter', 'wallnut', 'snowpea', 'cherrybomb', 'repeater', 'chomper', 'potatoMine', 'squash'], unlockPlant: null, sun: 100 },
    { waves: 7, zombies: ['normal', 'cone', 'bucket', 'polevault', 'newspaper', 'screenDoor', 'flag'], plants: Object.keys(ALL_PLANTS), unlockPlant: null, sun: 100 },
    { waves: 10, zombies: Object.keys(ALL_ZOMBIES), plants: Object.keys(ALL_PLANTS), unlockPlant: null, sun: 150 }
];

const SHOP_ITEMS = [
    { id: 'golden_peashooter', name: '金色豌豆射手', price: 500, type: 'skin', plant: 'peashooter', desc: '闪亮的金色外观' },
    { id: 'ice_wallnut', name: '冰霜坚果', price: 300, type: 'skin', plant: 'wallnut', desc: '冰蓝色皮肤' },
    { id: 'fire_sunflower', name: '火焰向日葵', price: 400, type: 'skin', plant: 'sunflower', desc: '燃烧的火焰外观' },
    { id: 'diamond_repeater', name: '钻石双发射手', price: 600, type: 'skin', plant: 'repeater', desc: '璀璨钻石造型' },
    { id: 'shadow_snowpea', name: '暗影寒冰射手', price: 450, type: 'skin', plant: 'snowpea', desc: '神秘的暗影外观' },
    { id: 'garden_slot', name: '花园槽位', price: 200, type: 'slot', desc: '扩展花园容量' }
];

const RARITY_PRICES = { common: 50, rare: 150, epic: 500 };
const RARITY_COLORS = { common: '#90EE90', rare: '#4FC3F7', epic: '#CE93D8' };

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;
        
        this.sunCount = 50;
        this.coins = 0;
        this.seeds = 0;
        this.currentLevel = 1;
        this.selectedPlant = null;
        this.shovelSelected = false;
        this.grid = [];
        this.plants = [];
        this.zombies = [];
        this.projectiles = [];
        this.suns = [];
        this.coins_game = [];
        this.seeds_game = [];
        this.particles = [];
        this.lawnMowers = [];
        
        this.wave = 0;
        this.totalWaves = 10;
        this.zombiesInWave = 0;
        this.zombiesKilled = 0;
        this.waveInProgress = false;
        
        this.zombieSpawnDelay = CONFIG.ZOMBIE_SPAWN_DELAY;
        this.gameStartTime = 0;
        this.countdownActive = false;
        
        this.selectedBattlePlants = [];
        this.pendingLevel = 0;
        
        this.lastSunDrop = 0;
        this.lastZombieSpawn = 0;
        this.gameRunning = false;
        this.gameOver = false;
        this.gameWon = false;
        this.paused = false;
        this.gameSpeed = 1;
        this.cooldowns = {};
        
        this.unlockedPlants = ['sunflower', 'peashooter'];
        this.unlockedZombies = ['normal'];
        this.completedLevels = [];
        this.levelStars = {};
        
        this.ownedSkins = [];
        this.activeSkins = {};
        this.gardenPlants = [];
        this.gardenSlots = 10;
        
        this.loadProgress();
        this.initGrid();
        this.initUI();
        this.setupEventListeners();
        this.showMainMenu();
    }

    loadProgress() {
        this.coins = parseInt(localStorage.getItem('pvz_coins') || '0');
        this.seeds = parseInt(localStorage.getItem('pvz_seeds') || '0');
        this.unlockedPlants = JSON.parse(localStorage.getItem('pvz_plants') || '["sunflower","peashooter"]');
        this.unlockedZombies = JSON.parse(localStorage.getItem('pvz_zombies') || '["normal"]');
        this.completedLevels = JSON.parse(localStorage.getItem('pvz_levels') || '[]');
        this.levelStars = JSON.parse(localStorage.getItem('pvz_stars') || '{}');
        this.ownedSkins = JSON.parse(localStorage.getItem('pvz_skins') || '[]');
        this.activeSkins = JSON.parse(localStorage.getItem('pvz_activeSkins') || '{}');
        this.gardenPlants = JSON.parse(localStorage.getItem('pvz_garden') || '[]');
        this.gardenSlots = parseInt(localStorage.getItem('pvz_slots') || '10');
    }

    saveProgress() {
        localStorage.setItem('pvz_coins', this.coins);
        localStorage.setItem('pvz_seeds', this.seeds);
        localStorage.setItem('pvz_plants', JSON.stringify(this.unlockedPlants));
        localStorage.setItem('pvz_zombies', JSON.stringify(this.unlockedZombies));
        localStorage.setItem('pvz_levels', JSON.stringify(this.completedLevels));
        localStorage.setItem('pvz_stars', JSON.stringify(this.levelStars));
        localStorage.setItem('pvz_skins', JSON.stringify(this.ownedSkins));
        localStorage.setItem('pvz_activeSkins', JSON.stringify(this.activeSkins));
        localStorage.setItem('pvz_garden', JSON.stringify(this.gardenPlants));
        localStorage.setItem('pvz_slots', this.gardenSlots);
    }

    initGrid() {
        for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
            this.grid[row] = [];
            for (let col = 0; col < CONFIG.GRID_COLS; col++) {
                this.grid[row][col] = null;
            }
        }
    }

    initLawnMowers() {
        this.lawnMowers = [];
        for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
            this.lawnMowers.push({
                row: row, x: 15,
                y: CONFIG.TOP_BAR_HEIGHT + row * CONFIG.CELL_HEIGHT + CONFIG.CELL_HEIGHT / 2,
                active: false, triggered: false, speed: 0.4
            });
        }
    }

    initUI() {
        this.updatePlantCards();
        document.getElementById('shovelBtn').addEventListener('click', () => this.toggleShovel());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('speedBtn').addEventListener('click', () => this.toggleSpeed());
    }

    updatePlantCards() {
        const plantCards = document.getElementById('plantCards');
        plantCards.innerHTML = '';
        const availablePlants = this.selectedBattlePlants.length > 0 ? this.selectedBattlePlants : this.unlockedPlants.slice(0, 7);
        
        for (const key of availablePlants) {
            const plant = ALL_PLANTS[key];
            if (!plant) continue;
            const card = document.createElement('div');
            card.className = 'plantCard';
            card.dataset.plant = key;
            const iconCanvas = document.createElement('canvas');
            iconCanvas.width = 48; iconCanvas.height = 48;
            iconCanvas.className = 'icon';
            this.drawPlantIcon(iconCanvas, key);
            card.innerHTML = `<div class="cooldownOverlay"></div><div class="cooldownText"></div><div class="cost">${plant.cost}</div>`;
            card.insertBefore(iconCanvas, card.querySelector('.cost'));
            card.title = `${plant.name} - ${plant.cost}阳光`;
            card.addEventListener('click', () => this.selectPlant(key));
            plantCards.appendChild(card);
        }
    }

    drawPlantIcon(canvas, type) {
        const ctx = canvas.getContext('2d');
        ctx.save(); ctx.translate(24, 28); ctx.scale(0.6, 0.6);
        const tempCtx = this.ctx; this.ctx = ctx;
        const skin = this.activeSkins[type];
        if (type === 'sunflower') this.drawSunflower(0, skin);
        else if (type === 'peashooter') this.drawPeashooter(0, false, skin);
        else if (type === 'wallnut') this.drawWallnut({health: 4000, maxHealth: 4000}, skin);
        else if (type === 'snowpea') this.drawPeashooter(0, true, skin);
        else if (type === 'cherrybomb') this.drawCherryBomb(0);
        else if (type === 'repeater') this.drawRepeater(0, skin);
        else if (type === 'chomper') this.drawChomper(0);
        else if (type === 'potatoMine') this.drawPotatoMine(0);
        else if (type === 'squash') this.drawSquash(0);
        this.ctx = tempCtx; ctx.restore();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        document.addEventListener('click', () => sound.init(), { once: true });
    }

    showMainMenu() {
        document.getElementById('mainMenu').style.display = 'flex';
        document.getElementById('gameMenu').style.display = 'none';
        document.getElementById('settingsPanel').style.display = 'none';
        document.getElementById('pauseMenu').style.display = 'none';
        document.getElementById('gardenPanel').style.display = 'none';
        document.getElementById('shopPanel').style.display = 'none';
        document.getElementById('almanacPanel').style.display = 'none';
        document.getElementById('levelSelectPanel').style.display = 'none';
        document.getElementById('victoryPanel').style.display = 'none';
        document.getElementById('plantSelectPanel').style.display = 'none';
        document.getElementById('countdownDisplay').style.display = 'none';
    }

    hideMainMenu() { document.getElementById('mainMenu').style.display = 'none'; }

    showLevelSelect() {
        this.hideMainMenu();
        document.getElementById('levelSelectPanel').style.display = 'block';
        this.renderLevelGrid();
    }

    renderLevelGrid() {
        const grid = document.getElementById('levelGrid');
        grid.innerHTML = '';
        for (let i = 1; i <= LEVELS.length; i++) {
            const btn = document.createElement('div');
            const completed = this.completedLevels.includes(i);
            const locked = i > 1 && !this.completedLevels.includes(i - 1);
            btn.className = 'levelBtn' + (locked ? ' locked' : '') + (completed ? ' completed' : '');
            const stars = this.levelStars[i] || 0;
            btn.innerHTML = `<div>${i}</div><div class="stars">${'⭐'.repeat(stars)}</div>`;
            if (!locked) {
                btn.addEventListener('click', () => this.selectLevel(i));
            }
            grid.appendChild(btn);
        }
    }

    selectLevel(level) {
        this.currentLevel = level;
        this.pendingLevel = level;
        const levelConfig = LEVELS[level - 1];
        const availablePlants = levelConfig.plants.filter(p => this.unlockedPlants.includes(p));
        
        if (availablePlants.length > 7) {
            document.getElementById('levelSelectPanel').style.display = 'none';
            this.selectedBattlePlants = [];
            this.showPlantSelection(availablePlants);
        } else {
            this.selectedBattlePlants = availablePlants;
            document.getElementById('levelSelectPanel').style.display = 'none';
            document.getElementById('gameMenu').style.display = 'block';
            document.getElementById('gameMenu').querySelector('p').textContent = 
                `关卡 ${level} - ${levelConfig.waves}波僵尸`;
        }
    }

    showPlantSelection(availablePlants) {
        const grid = document.getElementById('plantSelectGrid');
        grid.innerHTML = '';
        document.getElementById('selectedCount').textContent = '0';
        
        for (const plantKey of availablePlants) {
            const plant = ALL_PLANTS[plantKey];
            const div = document.createElement('div');
            div.className = 'shopItem';
            div.dataset.plant = plantKey;
            
            const iconCanvas = document.createElement('canvas');
            iconCanvas.width = 48; iconCanvas.height = 48;
            this.drawPlantIcon(iconCanvas, plantKey);
            
            div.innerHTML = `<div style="font-weight:bold;margin-bottom:5px">${plant.name}</div><div style="font-size:12px;color:#aaa">${plant.cost}阳光</div>`;
            div.insertBefore(iconCanvas, div.querySelector('div'));
            
            div.addEventListener('click', () => this.togglePlantSelection(plantKey, div));
            grid.appendChild(div);
        }
        
        document.getElementById('plantSelectPanel').style.display = 'block';
    }

    togglePlantSelection(plantKey, element) {
        const idx = this.selectedBattlePlants.indexOf(plantKey);
        if (idx >= 0) {
            this.selectedBattlePlants.splice(idx, 1);
            element.classList.remove('owned');
        } else if (this.selectedBattlePlants.length < 7) {
            this.selectedBattlePlants.push(plantKey);
            element.classList.add('owned');
        }
        document.getElementById('selectedCount').textContent = this.selectedBattlePlants.length;
    }

    confirmPlantSelection() {
        if (this.selectedBattlePlants.length === 0) {
            alert('请至少选择一个植物！');
            return;
        }
        document.getElementById('plantSelectPanel').style.display = 'none';
        document.getElementById('gameMenu').style.display = 'block';
        const levelConfig = LEVELS[this.pendingLevel - 1];
        document.getElementById('gameMenu').querySelector('p').textContent = 
            `关卡 ${this.pendingLevel} - ${levelConfig.waves}波僵尸`;
    }

    closeLevelSelect() {
        document.getElementById('levelSelectPanel').style.display = 'none';
        this.showMainMenu();
    }

    showSettings() { document.getElementById('settingsPanel').style.display = 'block'; }
    closeSettings() { document.getElementById('settingsPanel').style.display = 'none'; }

    showGarden() {
        this.hideMainMenu();
        document.getElementById('gardenPanel').style.display = 'block';
        document.getElementById('seedCount').textContent = this.seeds;
        this.renderGarden();
    }

    closeGarden() { document.getElementById('gardenPanel').style.display = 'none'; this.showMainMenu(); }

    renderGarden() {
        const grid = document.getElementById('gardenGrid');
        grid.innerHTML = '';
        for (let i = 0; i < this.gardenSlots; i++) {
            const slot = document.createElement('div');
            slot.className = 'gardenSlot' + (this.gardenPlants[i] ? ' hasPlant' : '');
            if (this.gardenPlants[i]) {
                const plant = this.gardenPlants[i];
                slot.innerHTML = `<canvas width="60" height="60"></canvas>`;
                const ctx = slot.querySelector('canvas').getContext('2d');
                ctx.save(); ctx.translate(30, 35); ctx.scale(0.5, 0.5);
                const tempCtx = this.ctx; this.ctx = ctx;
                if (ALL_PLANTS[plant.type]) {
                    const drawMethod = 'draw' + plant.type.charAt(0).toUpperCase() + plant.type.slice(1);
                    if (this[drawMethod]) this[drawMethod](Date.now()/1000);
                }
                this.ctx = tempCtx; ctx.restore();
                
                const growthPercent = Math.floor(plant.growth || 0);
                const rarity = plant.rarity || 'common';
                const rarityDiv = document.createElement('div');
                rarityDiv.className = `rarity ${rarity}`;
                rarityDiv.textContent = growthPercent >= 100 ? (rarity === 'common' ? '普通' : rarity === 'rare' ? '稀有' : '史诗') : `${growthPercent}%`;
                slot.appendChild(rarityDiv);
                
                slot.title = `${plant.name} - ${growthPercent}%`;
            } else {
                slot.innerHTML = '<span style="color:#8B4513;font-size:24px">+</span>';
                slot.title = '点击种植';
            }
            slot.addEventListener('click', () => this.plantInGarden(i));
            grid.appendChild(slot);
        }
    }

    plantInGarden(slotIndex) {
        if (this.gardenPlants[slotIndex]) {
            const plant = this.gardenPlants[slotIndex];
            if ((plant.growth || 0) >= 100) {
                const rarity = plant.rarity || 'common';
                const price = RARITY_PRICES[rarity] || 50;
                this.coins += price;
                this.gardenPlants[slotIndex] = null;
                this.saveProgress();
                this.renderGarden();
                sound.coinCollectSound();
            }
            return;
        }
        if (this.seeds > 0) {
            this.seeds--;
            const types = this.unlockedPlants;
            const randomType = types[Math.floor(Math.random() * types.length)];
            this.gardenPlants[slotIndex] = { type: randomType, name: ALL_PLANTS[randomType].name, growth: 0, planted: Date.now() };
            this.saveProgress();
            document.getElementById('seedCount').textContent = this.seeds;
            this.renderGarden();
            sound.plantSound();
        }
    }

    updateGarden() {
        const now = Date.now();
        for (let i = 0; i < this.gardenPlants.length; i++) {
            const plant = this.gardenPlants[i];
            if (plant && (plant.growth || 0) < 100) {
                const elapsed = now - plant.planted;
                plant.growth = Math.min(100, elapsed / CONFIG.GARDEN_GROWTH_TIME * 100);
                if (plant.growth >= 100 && !plant.rarity) {
                    const rand = Math.random();
                    plant.rarity = rand > 0.9 ? 'epic' : rand > 0.6 ? 'rare' : 'common';
                }
            }
        }
    }

    showShop() {
        this.hideMainMenu();
        document.getElementById('shopPanel').style.display = 'block';
        document.getElementById('shopCoins').textContent = this.coins;
        this.renderShop();
    }

    closeShop() { document.getElementById('shopPanel').style.display = 'none'; this.showMainMenu(); }

    renderShop() {
        const grid = document.getElementById('shopGrid');
        grid.innerHTML = '';
        for (const item of SHOP_ITEMS) {
            const div = document.createElement('div');
            const owned = this.ownedSkins.includes(item.id);
            const active = this.activeSkins[item.plant] === item.id;
            div.className = 'shopItem' + (owned ? ' owned' : '') + (active ? ' active' : '');
            div.innerHTML = `
                <div style="font-weight:bold;margin-bottom:5px">${item.name}</div>
                <div style="font-size:12px;color:#aaa">${item.desc}</div>
                <div class="price">${owned ? (item.type === 'skin' ? (active ? '使用中' : '点击装备') : '已拥有') : '🪙 ' + item.price}</div>
            `;
            if (owned && item.type === 'skin') {
                div.addEventListener('click', () => this.toggleSkin(item));
            } else if (!owned) {
                div.addEventListener('click', () => this.buyItem(item));
            }
            grid.appendChild(div);
        }
    }

    toggleSkin(item) {
        if (this.activeSkins[item.plant] === item.id) {
            delete this.activeSkins[item.plant];
        } else {
            this.activeSkins[item.plant] = item.id;
        }
        this.saveProgress();
        this.renderShop();
        sound.coinCollectSound();
    }

    buyItem(item) {
        if (this.coins >= item.price) {
            this.coins -= item.price;
            if (item.type === 'skin') {
                this.ownedSkins.push(item.id);
                this.activeSkins[item.plant] = item.id;
            }
            else if (item.type === 'slot') this.gardenSlots += 5;
            this.saveProgress();
            document.getElementById('shopCoins').textContent = this.coins;
            this.renderShop();
            sound.coinCollectSound();
        }
    }

    showAlmanac() {
        this.hideMainMenu();
        document.getElementById('almanacPanel').style.display = 'block';
        this.switchAlmanacTab('plants');
    }

    closeAlmanac() { document.getElementById('almanacPanel').style.display = 'none'; this.showMainMenu(); }

    switchAlmanacTab(tab) {
        document.querySelectorAll('.almanacTab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');
        this.renderAlmanac(tab);
    }

    renderAlmanac(type) {
        const grid = document.getElementById('almanacGrid');
        const detail = document.getElementById('almanacDetail');
        grid.innerHTML = '';
        detail.style.display = 'none';
        
        const items = type === 'plants' ? ALL_PLANTS : ALL_ZOMBIES;
        const unlocked = type === 'plants' ? this.unlockedPlants : this.unlockedZombies;
        
        for (const [key, item] of Object.entries(items)) {
            const div = document.createElement('div');
            const isUnlocked = unlocked.includes(key);
            div.className = 'almanacItem' + (isUnlocked ? '' : ' locked');
            
            const iconCanvas = document.createElement('canvas');
            iconCanvas.width = 48; iconCanvas.height = 48;
            iconCanvas.className = 'itemIcon';
            if (isUnlocked) {
                this.drawAlmanacIcon(iconCanvas, key, type);
            }
            
            div.innerHTML = `<div class="itemName">${isUnlocked ? item.name : '???'}</div>`;
            div.insertBefore(iconCanvas, div.querySelector('.itemName'));
            
            if (isUnlocked) {
                div.addEventListener('click', () => this.showAlmanacDetail(key, type, item));
            }
            grid.appendChild(div);
        }
    }

    drawAlmanacIcon(canvas, key, type) {
        const ctx = canvas.getContext('2d');
        ctx.save(); ctx.translate(24, 28); ctx.scale(0.6, 0.6);
        const tempCtx = this.ctx; this.ctx = ctx;
        if (type === 'plants') {
            if (key === 'sunflower') this.drawSunflower(0);
            else if (key === 'peashooter') this.drawPeashooter(0, false);
            else if (key === 'wallnut') this.drawWallnut({health: 4000, maxHealth: 4000});
            else if (key === 'snowpea') this.drawPeashooter(0, true);
            else if (key === 'cherrybomb') this.drawCherryBomb(0);
            else if (key === 'repeater') this.drawRepeater(0);
            else if (key === 'chomper') this.drawChomper(0);
            else if (key === 'potatoMine') this.drawPotatoMine(0);
            else if (key === 'squash') this.drawSquash(0);
        } else {
            if (key === 'normal') this.drawNormalZombie();
            else if (key === 'cone') this.drawConeZombie();
            else if (key === 'bucket') this.drawBucketZombie();
            else if (key === 'flag') this.drawFlagZombie();
            else if (key === 'polevault') this.drawPolevaultZombie({hasJumped: false});
            else if (key === 'newspaper') this.drawNewspaperZombie({});
            else if (key === 'screenDoor') this.drawScreenDoorZombie();
        }
        this.ctx = tempCtx; ctx.restore();
    }

    showAlmanacDetail(key, type, item) {
        const detail = document.getElementById('almanacDetail');
        detail.style.display = 'block';
        
        const iconCanvas = document.createElement('canvas');
        iconCanvas.width = 80; iconCanvas.height = 80;
        this.drawAlmanacIcon(iconCanvas, key, type);
        
        detail.innerHTML = '';
        const iconDiv = document.createElement('div');
        iconDiv.className = 'detailIcon';
        iconDiv.appendChild(iconCanvas);
        detail.appendChild(iconDiv);
        
        detail.innerHTML += `
            <div class="detailName">${item.name}</div>
            <div class="detailDesc">
                ${item.desc}<br><br>
                ${type === 'plants' ? `阳光消耗: ${item.cost || '-'}<br>冷却时间: ${(item.cooldown || 0) / 1000}秒` : `生命值: ${item.health}<br>移动速度: ${item.speed}`}
            </div>
        `;
    }

    setBGMVolume(value) { sound.setBGMVolume(value / 100); }
    setSFXVolume(value) { sound.setSFXVolume(value / 100); }

    togglePause() {
        if (!this.gameRunning) return;
        this.paused = !this.paused;
        document.getElementById('pauseMenu').style.display = this.paused ? 'block' : 'none';
        if (this.paused) sound.pauseBGM(); else sound.playBGM();
    }

    resume() { this.paused = false; document.getElementById('pauseMenu').style.display = 'none'; sound.playBGM(); }
    
    toggleSpeed() {
        this.gameSpeed = this.gameSpeed === 1 ? 2 : 1;
        document.getElementById('speedBtn').textContent = this.gameSpeed + 'x';
        document.getElementById('speedBtn').classList.toggle('active', this.gameSpeed === 2);
    }
    
    restart() { this.hideMenu(); this.startLevel(); }
    backToMenu() { this.gameRunning = false; sound.pauseBGM(); this.showMainMenu(); }

    selectPlant(plantType) {
        const cooldownEnd = this.cooldowns[plantType] || 0;
        if (cooldownEnd > Date.now()) return;
        if (this.sunCount < ALL_PLANTS[plantType].cost) return;
        this.shovelSelected = false;
        document.getElementById('shovelBtn').classList.remove('selected');
        if (this.selectedPlant === plantType) {
            this.selectedPlant = null;
            document.querySelectorAll('.plantCard').forEach(c => c.classList.remove('selected'));
        } else {
            this.selectedPlant = plantType;
            document.querySelectorAll('.plantCard').forEach(c => c.classList.toggle('selected', c.dataset.plant === plantType));
        }
    }

    toggleShovel() {
        this.selectedPlant = null;
        document.querySelectorAll('.plantCard').forEach(c => c.classList.remove('selected'));
        this.shovelSelected = !this.shovelSelected;
        document.getElementById('shovelBtn').classList.toggle('selected', this.shovelSelected);
    }

    handleClick(e) {
        if (!this.gameRunning || this.gameOver || this.gameWon || this.paused) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        for (let i = this.suns.length - 1; i >= 0; i--) {
            const sun = this.suns[i];
            if (Math.sqrt((x - sun.x) ** 2 + (y - sun.y) ** 2) < 30) {
                this.sunCount += CONFIG.SUN_VALUE;
                this.updateSunCounter();
                this.suns.splice(i, 1);
                sound.sunCollectSound();
                return;
            }
        }
        
        for (let i = this.coins_game.length - 1; i >= 0; i--) {
            const coin = this.coins_game[i];
            if (Math.sqrt((x - coin.x) ** 2 + (y - coin.y) ** 2) < 20) {
                this.coins += coin.value;
                this.updateCoinCounter();
                this.coins_game.splice(i, 1);
                this.saveProgress();
                sound.coinCollectSound();
                return;
            }
        }
        
        for (let i = this.seeds_game.length - 1; i >= 0; i--) {
            const seed = this.seeds_game[i];
            if (Math.sqrt((x - seed.x) ** 2 + (y - seed.y) ** 2) < 20) {
                this.seeds++;
                this.seeds_game.splice(i, 1);
                this.saveProgress();
                sound.seedDropSound();
                return;
            }
        }
        
        const col = Math.floor((x - CONFIG.GRID_OFFSET_X) / CONFIG.CELL_WIDTH);
        const row = Math.floor((y - CONFIG.TOP_BAR_HEIGHT) / CONFIG.CELL_HEIGHT);
        if (row < 0 || row >= CONFIG.GRID_ROWS || col < 0 || col >= CONFIG.GRID_COLS) return;
        
        if (this.shovelSelected) {
            if (this.grid[row][col]) {
                const plant = this.grid[row][col];
                this.plants = this.plants.filter(p => p !== plant);
                this.grid[row][col] = null;
                this.shovelSelected = false;
                document.getElementById('shovelBtn').classList.remove('selected');
                sound.plantSound();
            }
            return;
        }
        
        if (this.selectedPlant && !this.grid[row][col]) {
            const plantData = ALL_PLANTS[this.selectedPlant];
            if (this.sunCount >= plantData.cost) this.plantAt(row, col, this.selectedPlant);
        }
    }

    plantAt(row, col, type) {
        const plantData = ALL_PLANTS[type];
        this.sunCount -= plantData.cost;
        this.updateSunCounter();
        const plant = {
            type, row, col,
            x: CONFIG.GRID_OFFSET_X + col * CONFIG.CELL_WIDTH + CONFIG.CELL_WIDTH / 2,
            y: CONFIG.TOP_BAR_HEIGHT + row * CONFIG.CELL_HEIGHT + CONFIG.CELL_HEIGHT / 2,
            health: plantData.health, maxHealth: plantData.health,
            lastFire: 0, lastSun: Date.now(), frame: 0, animTimer: 0, planted: true
        };
        this.plants.push(plant);
        this.grid[row][col] = plant;
        this.cooldowns[type] = Date.now() + plantData.cooldown / this.gameSpeed;
        this.selectedPlant = null;
        document.querySelectorAll('.plantCard').forEach(c => c.classList.remove('selected'));
        sound.plantSound();
        if (type === 'cherrybomb') setTimeout(() => this.explodeCherryBomb(plant), 500);
        if (type === 'potatoMine') setTimeout(() => { plant.armed = true; }, 14000);
    }

    explodeCherryBomb(plant) {
        const radius = CONFIG.CELL_WIDTH * 1.5;
        this.zombies = this.zombies.filter(z => {
            const dist = Math.sqrt((z.x - plant.x) ** 2 + (z.y - plant.y) ** 2);
            if (dist < radius) { this.addParticles(z.x, z.y, '#ff0000', 10); return false; }
            return true;
        });
        this.addParticles(plant.x, plant.y, '#ff6600', 20);
        sound.explosionSound();
        this.grid[plant.row][plant.col] = null;
        this.plants = this.plants.filter(p => p !== plant);
    }

    updateSunCounter() { document.getElementById('sunCounter').textContent = '☀️ ' + this.sunCount; }
    updateCoinCounter() { document.getElementById('coinCounter').textContent = '🪙 ' + this.coins; }

    updateCooldowns() {
        const now = Date.now();
        document.querySelectorAll('.plantCard').forEach(card => {
            const plantType = card.dataset.plant;
            const plantData = ALL_PLANTS[plantType];
            if (!plantData) return;
            const cooldownEnd = this.cooldowns[plantType] || 0;
            const onCooldown = cooldownEnd > now;
            const canAfford = this.sunCount >= plantData.cost;
            const overlay = card.querySelector('.cooldownOverlay');
            const textEl = card.querySelector('.cooldownText');
            if (onCooldown) {
                const remaining = (cooldownEnd - now) / 1000;
                overlay.style.height = `${((cooldownEnd - now) / (plantData.cooldown / this.gameSpeed)) * 100}%`;
                textEl.textContent = Math.ceil(remaining) + 's';
                textEl.style.display = 'block';
            } else if (!canAfford) {
                overlay.style.height = '100%'; textEl.style.display = 'none';
            } else {
                overlay.style.height = '0%'; textEl.style.display = 'none';
            }
        });
    }

    spawnZombie() {
        const levelConfig = LEVELS[this.currentLevel - 1];
        const availableZombies = levelConfig.zombies || ['normal'];
        const row = Math.floor(Math.random() * CONFIG.GRID_ROWS);
        const type = availableZombies[Math.floor(Math.random() * availableZombies.length)];
        const zombieData = ALL_ZOMBIES[type];
        
        if (!this.unlockedZombies.includes(type)) {
            this.unlockedZombies.push(type);
            this.saveProgress();
        }
        
        this.zombies.push({
            type, row,
            x: CONFIG.CANVAS_WIDTH + 20,
            y: CONFIG.TOP_BAR_HEIGHT + row * CONFIG.CELL_HEIGHT + CONFIG.CELL_HEIGHT / 2,
            health: zombieData.health, maxHealth: zombieData.health,
            speed: zombieData.speed, damage: zombieData.damage,
            attacking: false, slowed: false, slowTimer: 0, frame: 0, animTimer: 0,
            canJump: zombieData.canJump || false, hasJumped: false, jumping: false, jumpProgress: 0
        });
        this.zombiesInWave++;
    }

    spawnSun(fromPlant = null) {
        const sun = fromPlant ? {
            x: fromPlant.x + (Math.random() - 0.5) * 40,
            y: fromPlant.y - 20, targetY: fromPlant.y + 20,
            falling: true, lifetime: 8000, created: Date.now()
        } : {
            x: Math.random() * (CONFIG.CANVAS_WIDTH - 100) + 50,
            y: -20, targetY: Math.random() * (CONFIG.CANVAS_HEIGHT - 200) + CONFIG.TOP_BAR_HEIGHT + 50,
            falling: true, lifetime: 10000, created: Date.now()
        };
        this.suns.push(sun);
    }

    spawnCoin(x, y) {
        const isGold = Math.random() > 0.3;
        this.coins_game.push({ x, y, value: isGold ? 10 : 5, isGold, targetY: y + 30, falling: true, lifetime: 15000, created: Date.now() });
    }

    spawnSeed(x, y) {
        this.seeds_game.push({ x, y, targetY: y + 30, falling: true, lifetime: 20000, created: Date.now() });
    }

    shoot(plant) {
        const plantData = ALL_PLANTS[plant.type];
        const projectile = {
            x: plant.x + 30, y: plant.y, row: plant.row,
            speed: 5, damage: plantData.damage,
            type: plant.type === 'snowpea' ? 'frozen' : 'pea',
            slowEffect: plantData.slowEffect || 0
        };
        this.projectiles.push(projectile);
        sound.shootSound();
        if (plant.type === 'repeater') {
            setTimeout(() => {
                if (this.plants.includes(plant)) {
                    this.projectiles.push({...projectile, x: plant.x + 30});
                    sound.shootSound();
                }
            }, 150);
        }
    }

    addParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({ x, y, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8 - 2, color, life: 1, size: Math.random() * 6 + 2 });
        }
    }

    update(deltaTime) {
        if (!this.gameRunning || this.gameOver || this.gameWon || this.paused) return;
        deltaTime *= this.gameSpeed;
        const now = Date.now();
        
        this.updateCooldowns();
        this.updateGarden();
        
        if (this.countdownActive) {
            const elapsed = now - this.gameStartTime;
            const remaining = Math.max(0, Math.ceil((this.zombieSpawnDelay - elapsed) / 1000));
            document.getElementById('countdownTimer').textContent = remaining;
            
            if (elapsed >= this.zombieSpawnDelay) {
                this.countdownActive = false;
                document.getElementById('countdownDisplay').style.display = 'none';
                this.waveInProgress = true;
                this.nextWave();
            }
            return;
        }
        
        if (now - this.lastSunDrop > CONFIG.SUN_INTERVAL) { this.spawnSun(); this.lastSunDrop = now; }
        if (this.waveInProgress && now - this.lastZombieSpawn > 3000 / this.gameSpeed) {
            if (this.zombiesInWave < this.getZombiesForWave()) { this.spawnZombie(); this.lastZombieSpawn = now; }
        }
        if (this.waveInProgress && this.zombies.length === 0 && this.zombiesInWave >= this.getZombiesForWave()) {
            if (this.wave >= this.totalWaves) {
                this.gameWon = true; this.gameRunning = false;
                sound.winSound();
                this.levelComplete();
                return;
            }
            this.nextWave();
        }
        
        for (let i = this.suns.length - 1; i >= 0; i--) {
            const sun = this.suns[i];
            if (sun.falling && sun.y < sun.targetY) sun.y += 1;
            if (now - sun.created > sun.lifetime) this.suns.splice(i, 1);
        }
        for (let i = this.coins_game.length - 1; i >= 0; i--) {
            const coin = this.coins_game[i];
            if (coin.falling && coin.y < coin.targetY) coin.y += 1;
            if (now - coin.created > coin.lifetime) this.coins_game.splice(i, 1);
        }
        for (let i = this.seeds_game.length - 1; i >= 0; i--) {
            const seed = this.seeds_game[i];
            if (seed.falling && seed.y < seed.targetY) seed.y += 1;
            if (now - seed.created > seed.lifetime) this.seeds_game.splice(i, 1);
        }
        
        for (const plant of this.plants) {
            const plantData = ALL_PLANTS[plant.type];
            if (plant.type === 'sunflower') {
                if (now - plant.lastSun > plantData.sunInterval) { this.spawnSun(plant); plant.lastSun = now; }
            } else if (['peashooter', 'snowpea', 'repeater'].includes(plant.type)) {
                const hasZombieInRow = this.zombies.some(z => z.row === plant.row && z.x < CONFIG.CANVAS_WIDTH && z.x > plant.x);
                if (hasZombieInRow && now - plant.lastFire > plantData.fireRate / this.gameSpeed) { this.shoot(plant); plant.lastFire = now; }
            } else if (plant.type === 'squash' && !plant.triggered) {
                const nearZombie = this.zombies.find(z => z.row === plant.row && Math.abs(z.x - plant.x) < 60);
                if (nearZombie) {
                    plant.triggered = true;
                    setTimeout(() => {
                        this.zombies = this.zombies.filter(z => {
                            if (z.row === plant.row && Math.abs(z.x - plant.x) < 80) {
                                this.addParticles(z.x, z.y, '#666666', 10);
                                return false;
                            }
                            return true;
                        });
                        this.grid[plant.row][plant.col] = null;
                        this.plants = this.plants.filter(p => p !== plant);
                        sound.explosionSound();
                    }, 500);
                }
            } else if (plant.type === 'potatoMine' && plant.armed && !plant.triggered) {
                const nearZombie = this.zombies.find(z => z.row === plant.row && Math.abs(z.x - plant.x) < 30);
                if (nearZombie) {
                    plant.triggered = true;
                    this.zombies = this.zombies.filter(z => {
                        if (z.row === plant.row && Math.abs(z.x - plant.x) < 60) {
                            this.addParticles(z.x, z.y, '#ff6600', 15);
                            return false;
                        }
                        return true;
                    });
                    this.grid[plant.row][plant.col] = null;
                    this.plants = this.plants.filter(p => p !== plant);
                    sound.explosionSound();
                }
            } else if (plant.type === 'chomper' && !plant.eating && !plant.digesting) {
                const nearZombie = this.zombies.find(z => z.row === plant.row && Math.abs(z.x - plant.x) < 50);
                if (nearZombie) {
                    plant.eating = true;
                    this.zombies = this.zombies.filter(z => z !== nearZombie);
                    this.addParticles(nearZombie.x, nearZombie.y, '#666666', 8);
                    sound.zombieDeathSound();
                    setTimeout(() => {
                        plant.eating = false;
                        plant.digesting = true;
                        setTimeout(() => { plant.digesting = false; }, 30000);
                    }, 1000);
                }
            }
            plant.animTimer += deltaTime;
            if (plant.animTimer > 200) { plant.frame = (plant.frame + 1) % 2; plant.animTimer = 0; }
        }
        
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.x += proj.speed * this.gameSpeed;
            if (proj.x > CONFIG.CANVAS_WIDTH) { this.projectiles.splice(i, 1); continue; }
            for (const zombie of this.zombies) {
                if (zombie.row === proj.row && Math.abs(zombie.x - proj.x) < 25) {
                    zombie.health -= proj.damage;
                    if (proj.slowEffect) { zombie.slowed = true; zombie.slowTimer = now + 5000; }
                    this.addParticles(proj.x, proj.y, proj.type === 'frozen' ? '#87CEEB' : '#90EE90', 3);
                    this.projectiles.splice(i, 1);
                    sound.hitSound();
                    break;
                }
            }
        }
        
        for (let i = this.zombies.length - 1; i >= 0; i--) {
            const zombie = this.zombies[i];
            if (zombie.health <= 0) {
                this.addParticles(zombie.x, zombie.y, '#666666', 10);
                this.zombies.splice(i, 1);
                this.zombiesKilled++;
                sound.zombieDeathSound();
                if (Math.random() < 0.15) this.spawnCoin(zombie.x, zombie.y);
                if (Math.random() < 0.01) this.spawnSeed(zombie.x, zombie.y);
                continue;
            }
            if (zombie.slowed && now > zombie.slowTimer) zombie.slowed = false;
            const speed = zombie.slowed ? zombie.speed * 0.5 : zombie.speed;
            let blocked = false;
            
            if (zombie.jumping) {
                zombie.jumpProgress += deltaTime / 500;
                if (zombie.jumpProgress >= 1) { zombie.jumping = false; zombie.hasJumped = true; zombie.speed = 0.015; zombie.x -= CONFIG.CELL_WIDTH * 1.5; }
            } else if (zombie.canJump && !zombie.hasJumped) {
                const plantAhead = this.plants.find(p => p.row === zombie.row && p.x < zombie.x && zombie.x - p.x < 80);
                if (plantAhead) { zombie.jumping = true; zombie.jumpProgress = 0; }
                else zombie.x -= speed * deltaTime;
            } else {
                for (const plant of this.plants) {
                    if (plant.row === zombie.row && Math.abs(plant.x - zombie.x) < 40) {
                        blocked = true; zombie.attacking = true;
                        plant.health -= zombie.damage * deltaTime / 1000;
                        if (plant.health <= 0) {
                            this.addParticles(plant.x, plant.y, '#90EE90', 8);
                            this.grid[plant.row][plant.col] = null;
                            this.plants = this.plants.filter(p => p !== plant);
                        }
                        break;
                    }
                }
                if (!blocked) { zombie.attacking = false; zombie.x -= speed * deltaTime; }
            }
            
            const mower = this.lawnMowers[zombie.row];
            if (mower && !mower.triggered && zombie.x < CONFIG.GRID_OFFSET_X) { 
                mower.triggered = true; 
                mower.active = true;
                this.zombies = this.zombies.filter(z => {
                    if (z.row === mower.row && z.x < CONFIG.GRID_OFFSET_X) {
                        this.addParticles(z.x, z.y, '#666666', 8);
                        sound.zombieDeathSound();
                        if (Math.random() < 0.2) this.spawnCoin(z.x, z.y);
                        return false;
                    }
                    return true;
                });
            }
            if (zombie.x < -20) {
                const hasMower = this.lawnMowers.find(m => m.row === zombie.row && !m.triggered);
                if (!hasMower) {
                    this.gameOver = true; this.gameRunning = false;
                    sound.gameOverSound();
                    this.showMenu('游戏结束', '僵尸吃掉了你的脑子！');
                    return;
                }
            }
            zombie.animTimer += deltaTime;
            if (zombie.animTimer > 150) { zombie.frame = (zombie.frame + 1) % 2; zombie.animTimer = 0; }
        }
        
        for (let i = this.lawnMowers.length - 1; i >= 0; i--) {
            const mower = this.lawnMowers[i];
            if (mower.active) {
                mower.x += mower.speed * deltaTime;
                this.zombies = this.zombies.filter(zombie => {
                    if (zombie.row === mower.row && Math.abs(zombie.x - mower.x) < 40) {
                        this.addParticles(zombie.x, zombie.y, '#666666', 8);
                        sound.zombieDeathSound();
                        if (Math.random() < 0.2) this.spawnCoin(zombie.x, zombie.y);
                        return false;
                    }
                    return true;
                });
                if (mower.x > CONFIG.CANVAS_WIDTH + 50) this.lawnMowers.splice(i, 1);
            }
        }
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= 0.02;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    getZombiesForWave() {
        const levelConfig = LEVELS[this.currentLevel - 1];
        const base = Math.ceil((this.wave / levelConfig.waves) * (5 + this.currentLevel));
        return Math.min(base, 8 + this.currentLevel);
    }

    nextWave() {
        this.wave++;
        this.zombiesInWave = 0;
        this.waveInProgress = true;
        this.lastZombieSpawn = Date.now();
        document.getElementById('waveInfo').textContent = `波次: ${this.wave}/${this.totalWaves}`;
        sound.waveSound();
        for (let i = 0; i < (this.wave === 1 ? 1 : 2); i++) this.spawnZombie();
    }

    levelComplete() {
        if (!this.completedLevels.includes(this.currentLevel)) {
            this.completedLevels.push(this.currentLevel);
        }
        const stars = Math.min(3, Math.floor(this.zombiesKilled / 5) + 1);
        this.levelStars[this.currentLevel] = Math.max(this.levelStars[this.currentLevel] || 0, stars);
        
        const levelConfig = LEVELS[this.currentLevel - 1];
        if (levelConfig.unlockPlant && !this.unlockedPlants.includes(levelConfig.unlockPlant)) {
            this.unlockedPlants.push(levelConfig.unlockPlant);
            this.saveProgress();
            this.showPlantReward(levelConfig.unlockPlant);
        } else {
            this.saveProgress();
            this.showVictoryPanel(stars);
        }
    }

    showVictoryPanel(stars) {
        document.getElementById('victoryStars').textContent = '⭐'.repeat(stars);
        document.getElementById('victoryMessage').textContent = `获得 ${stars} 星评价！`;
        const nextBtn = document.getElementById('nextLevelBtn');
        if (this.currentLevel >= LEVELS.length) {
            nextBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'block';
        }
        document.getElementById('victoryPanel').style.display = 'block';
    }

    nextLevel() {
        document.getElementById('victoryPanel').style.display = 'none';
        if (this.currentLevel < LEVELS.length) {
            this.selectLevel(this.currentLevel + 1);
        }
    }

    returnToMenu() {
        document.getElementById('victoryPanel').style.display = 'none';
        this.showMainMenu();
    }

    showPlantReward(plantType) {
        const plant = ALL_PLANTS[plantType];
        document.getElementById('rewardName').textContent = plant.name;
        document.getElementById('newPlantReward').style.display = 'block';
        sound.newPlantSound();
    }

    closeReward() {
        document.getElementById('newPlantReward').style.display = 'none';
        const stars = this.levelStars[this.currentLevel] || 1;
        this.showVictoryPanel(stars);
    }

    render() {
        this.ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        this.drawLawn();
        for (const mower of this.lawnMowers) this.drawLawnMower(mower);
        for (const plant of this.plants) this.drawPlant(plant);
        for (const projectile of this.projectiles) this.drawProjectile(projectile);
        for (const zombie of this.zombies) this.drawZombie(zombie);
        for (const sun of this.suns) this.drawSun(sun);
        for (const coin of this.coins_game) this.drawCoin(coin);
        for (const seed of this.seeds_game) this.drawSeed(seed);
        for (const p of this.particles) {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
        if (this.selectedPlant) {
            this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
                for (let col = 0; col < CONFIG.GRID_COLS; col++) {
                    if (!this.grid[row][col]) this.ctx.strokeRect(CONFIG.GRID_OFFSET_X + col * CONFIG.CELL_WIDTH + 2, CONFIG.TOP_BAR_HEIGHT + row * CONFIG.CELL_HEIGHT + 2, CONFIG.CELL_WIDTH - 4, CONFIG.CELL_HEIGHT - 4);
                }
            }
            this.ctx.setLineDash([]);
        }
    }

    drawLawn() {
        for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
            for (let col = 0; col < CONFIG.GRID_COLS; col++) {
                const x = CONFIG.GRID_OFFSET_X + col * CONFIG.CELL_WIDTH;
                const y = CONFIG.TOP_BAR_HEIGHT + row * CONFIG.CELL_HEIGHT;
                this.ctx.fillStyle = (row + col) % 2 === 0 ? '#5d8a3e' : '#4a7c23';
                this.ctx.fillRect(x, y, CONFIG.CELL_WIDTH, CONFIG.CELL_HEIGHT);
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                this.ctx.strokeRect(x, y, CONFIG.CELL_WIDTH, CONFIG.CELL_HEIGHT);
            }
        }
    }

    drawPlant(plant) {
        const x = plant.x;
        const y = plant.y + Math.sin(Date.now() / 300 + plant.col) * 3;
        const time = Date.now() / 1000;
        const skin = this.activeSkins[plant.type];
        this.ctx.save();
        this.ctx.translate(x, y);
        if (skin) {
            this.ctx.shadowColor = skin === 'golden_peashooter' ? '#FFD700' : 
                                   skin === 'ice_wallnut' ? '#00BCD4' :
                                   skin === 'fire_sunflower' ? '#FF4500' :
                                   skin === 'diamond_repeater' ? '#00CED1' :
                                   skin === 'shadow_snowpea' ? '#9400D3' : '#fff';
            this.ctx.shadowBlur = 15;
        }
        if (plant.type === 'sunflower') this.drawSunflower(time, skin);
        else if (plant.type === 'peashooter') this.drawPeashooter(time, false, skin);
        else if (plant.type === 'wallnut') this.drawWallnut(plant, skin);
        else if (plant.type === 'snowpea') this.drawPeashooter(time, true, skin);
        else if (plant.type === 'cherrybomb') this.drawCherryBomb(time);
        else if (plant.type === 'repeater') this.drawRepeater(time, skin);
        else if (plant.type === 'chomper') this.drawChomper(time, plant);
        else if (plant.type === 'potatoMine') this.drawPotatoMine(time, plant);
        else if (plant.type === 'squash') this.drawSquash(time, plant);
        this.ctx.restore();
        if (plant.health < plant.maxHealth) {
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(x - 25, y + 30, 50, 6);
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.fillRect(x - 25, y + 30, 50 * (plant.health / plant.maxHealth), 6);
        }
    }

    drawSunflower(time, skin) {
        const petalColor = skin === 'fire_sunflower' ? '#FF4500' : '#FFD700';
        this.ctx.fillStyle = '#228B22'; this.ctx.fillRect(-3, 5, 6, 25);
        this.ctx.fillStyle = '#32CD32';
        this.ctx.beginPath(); this.ctx.ellipse(-15, 20, 8, 15, -0.3, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.beginPath(); this.ctx.ellipse(15, 20, 8, 15, 0.3, 0, Math.PI * 2); this.ctx.fill();
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + Math.sin(time * 2) * 0.1;
            this.ctx.fillStyle = petalColor;
            this.ctx.beginPath();
            this.ctx.ellipse(Math.cos(angle) * 18, Math.sin(angle) * 18 - 5, 8, 12, angle, 0, Math.PI * 2);
            this.ctx.fill();
        }
        if (skin === 'fire_sunflower') {
            for (let i = 0; i < 5; i++) {
                this.ctx.fillStyle = `rgba(255, ${100 + i * 30}, 0, ${0.8 - i * 0.15})`;
                this.ctx.beginPath();
                this.ctx.ellipse(Math.cos(i * 1.2) * 12, Math.sin(i * 1.2) * 12 - 8, 4, 6, i, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        this.ctx.fillStyle = '#8B4513'; this.ctx.beginPath(); this.ctx.arc(0, -5, 12, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = '#000'; this.ctx.beginPath(); this.ctx.arc(-4, -7, 2, 0, Math.PI * 2); this.ctx.arc(4, -7, 2, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = '#8B0000'; this.ctx.beginPath(); this.ctx.arc(0, -3, 3, 0, Math.PI); this.ctx.fill();
    }

    drawPeashooter(time, isSnow, skin) {
        let color, darkColor;
        if (skin === 'golden_peashooter') { color = '#FFD700'; darkColor = '#DAA520'; }
        else if (skin === 'shadow_snowpea' && isSnow) { color = '#9400D3'; darkColor = '#6A0DAD'; }
        else if (isSnow) { color = '#00BCD4'; darkColor = '#00838F'; }
        else { color = '#4CAF50'; darkColor = '#2E7D32'; }
        this.ctx.fillStyle = darkColor;
        this.ctx.beginPath(); this.ctx.moveTo(-10, 10); this.ctx.lineTo(-5, 30); this.ctx.lineTo(5, 30); this.ctx.lineTo(10, 10); this.ctx.closePath(); this.ctx.fill();
        this.ctx.fillStyle = color; this.ctx.beginPath(); this.ctx.arc(0, 5, 18, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = darkColor; this.ctx.beginPath(); this.ctx.ellipse(15, 0, 12, 8, 0, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = '#1a1a1a'; this.ctx.beginPath(); this.ctx.arc(20, 0, 6, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = '#000'; this.ctx.beginPath(); this.ctx.arc(-5, 0, 3, 0, Math.PI * 2); this.ctx.arc(5, 0, 3, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = '#FF69B4'; this.ctx.beginPath(); this.ctx.arc(0, 8, 4, 0, Math.PI); this.ctx.fill();
        if (skin === 'golden_peashooter') {
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            this.ctx.beginPath(); this.ctx.arc(0, 5, 22, 0, Math.PI * 2); this.ctx.fill();
        }
    }

    drawWallnut(plant, skin) {
        const ratio = plant.health / plant.maxHealth;
        const color = skin === 'ice_wallnut' ? '#00BCD4' : '#D2691E';
        const darkColor = skin === 'ice_wallnut' ? '#00838F' : '#8B4513';
        this.ctx.fillStyle = color; this.ctx.beginPath(); this.ctx.arc(0, 5, 25, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = darkColor; this.ctx.beginPath(); this.ctx.arc(-5, 8, 8, 0, Math.PI * 2); this.ctx.arc(8, 0, 5, 0, Math.PI * 2); this.ctx.fill();
        if (skin === 'ice_wallnut') {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            for (let i = 0; i < 5; i++) {
                this.ctx.beginPath(); this.ctx.moveTo(-20 + i * 10, -15); this.ctx.lineTo(-15 + i * 10, 15); this.ctx.stroke();
            }
        }
        this.ctx.fillStyle = '#000';
        if (ratio > 0.66) { this.ctx.beginPath(); this.ctx.arc(-8, -5, 4, 0, Math.PI * 2); this.ctx.arc(8, -5, 4, 0, Math.PI * 2); this.ctx.fill(); }
        else if (ratio > 0.33) { this.ctx.beginPath(); this.ctx.arc(-8, -5, 4, 0, Math.PI * 2); this.ctx.arc(8, -5, 4, 0, Math.PI * 2); this.ctx.fill(); }
        else { this.ctx.beginPath(); this.ctx.arc(-8, -5, 3, 0, Math.PI * 2); this.ctx.arc(8, -5, 3, 0, Math.PI * 2); this.ctx.fill(); }
    }

    drawCherryBomb(time) {
        const bounce = Math.abs(Math.sin(time * 10)) * 3;
        this.ctx.fillStyle = '#DC143C'; this.ctx.beginPath(); this.ctx.arc(-10, 5 - bounce, 18, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = '#B22222'; this.ctx.beginPath(); this.ctx.arc(12, 8 - bounce, 15, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.strokeStyle = '#228B22'; this.ctx.lineWidth = 3;
        this.ctx.beginPath(); this.ctx.moveTo(-10, -13 - bounce); this.ctx.quadraticCurveTo(0, -25 - bounce, 5, -20 - bounce); this.ctx.stroke();
        this.ctx.fillStyle = '#000'; this.ctx.beginPath(); this.ctx.arc(-15, 0 - bounce, 3, 0, Math.PI * 2); this.ctx.arc(-5, 0 - bounce, 3, 0, Math.PI * 2); this.ctx.fill();
    }

    drawRepeater(time, skin) {
        const color = skin === 'diamond_repeater' ? '#00CED1' : '#4CAF50';
        const darkColor = skin === 'diamond_repeater' ? '#008B8B' : '#2E7D32';
        this.ctx.fillStyle = darkColor; this.ctx.beginPath(); this.ctx.moveTo(-10, 10); this.ctx.lineTo(-5, 30); this.ctx.lineTo(5, 30); this.ctx.lineTo(10, 10); this.ctx.closePath(); this.ctx.fill();
        this.ctx.fillStyle = color; this.ctx.beginPath(); this.ctx.arc(0, 5, 18, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = darkColor;
        this.ctx.beginPath(); this.ctx.ellipse(12, 0, 10, 7, 0, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.beginPath(); this.ctx.ellipse(22, 0, 8, 6, 0, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = '#1a1a1a'; this.ctx.beginPath(); this.ctx.arc(27, 0, 5, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = darkColor; this.ctx.beginPath(); this.ctx.ellipse(0, -18, 10, 6, 0, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = color; this.ctx.beginPath(); this.ctx.ellipse(0, -20, 8, 4, 0, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = '#000'; this.ctx.beginPath(); this.ctx.arc(-5, 0, 3, 0, Math.PI * 2); this.ctx.arc(5, 0, 3, 0, Math.PI * 2); this.ctx.fill();
        if (skin === 'diamond_repeater') {
            this.ctx.fillStyle = 'rgba(0, 206, 209, 0.3)';
            this.ctx.beginPath(); this.ctx.arc(0, 5, 22, 0, Math.PI * 2); this.ctx.fill();
        }
    }

    drawChomper(time, plant) {
        const openMouth = plant && !plant.eating && !plant.digesting;
        const mouthAngle = openMouth ? 0.8 : 0.3;
        this.ctx.fillStyle = '#9932CC'; this.ctx.beginPath(); this.ctx.arc(0, 0, 20, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = '#4B0082'; this.ctx.fillRect(-4, 15, 8, 20);
        this.ctx.fillStyle = '#228B22';
        this.ctx.beginPath(); this.ctx.ellipse(-20, 10, 15, 8, -0.5, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.beginPath(); this.ctx.ellipse(20, 10, 15, 8, 0.5, 0, Math.PI * 2); this.ctx.fill();
        if (plant && plant.eating) {
            this.ctx.fillStyle = '#FF69B4';
            this.ctx.beginPath(); this.ctx.arc(0, 5, 15, 0, Math.PI * 2); this.ctx.fill();
        } else {
            this.ctx.fillStyle = '#660066';
            this.ctx.beginPath(); this.ctx.arc(0, -10, 18, 0.3, Math.PI - 0.3); this.ctx.arc(0, 5, 15, Math.PI + mouthAngle, -mouthAngle); this.ctx.closePath(); this.ctx.fill();
            this.ctx.fillStyle = '#FF1493';
            this.ctx.beginPath(); this.ctx.arc(0, 0, 5, 0, Math.PI * 2); this.ctx.fill();
        }
        this.ctx.fillStyle = '#FFF'; for (let i = 0; i < 5; i++) { this.ctx.beginPath(); this.ctx.moveTo(-10 + i * 5, -5); this.ctx.lineTo(-8 + i * 5, 5); this.ctx.lineTo(-12 + i * 5, 5); this.ctx.closePath(); this.ctx.fill(); }
    }

    drawPotatoMine(time, plant) {
        const armed = plant && plant.armed;
        this.ctx.fillStyle = armed ? '#8B4513' : '#6B4423';
        this.ctx.beginPath(); this.ctx.ellipse(0, 10, 20, 15, 0, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = '#654321'; this.ctx.beginPath(); this.ctx.ellipse(-8, 5, 5, 3, 0, 0, Math.PI * 2); this.ctx.ellipse(10, 8, 4, 2, 0, 0, Math.PI * 2); this.ctx.fill();
        if (armed) {
            this.ctx.fillStyle = '#FF0000';
            this.ctx.beginPath(); this.ctx.arc(-8, -5, 3, 0, Math.PI * 2); this.ctx.arc(8, -5, 3, 0, Math.PI * 2); this.ctx.fill();
        } else {
            this.ctx.fillStyle = '#FFF';
            this.ctx.beginPath(); this.ctx.arc(-8, -5, 2, 0, Math.PI * 2); this.ctx.arc(8, -5, 2, 0, Math.PI * 2); this.ctx.fill();
        }
    }

    drawSquash(time, plant) {
        const triggered = plant && plant.triggered;
        const squash = triggered ? 0.7 : 1;
        this.ctx.save();
        this.ctx.scale(1, squash);
        this.ctx.fillStyle = '#FFA500';
        this.ctx.beginPath(); this.ctx.ellipse(0, 0, 25, 20, 0, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = '#FF8C00';
        this.ctx.beginPath(); this.ctx.ellipse(-10, 5, 8, 5, 0, 0, Math.PI * 2); this.ctx.ellipse(12, 3, 6, 4, 0, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath(); this.ctx.arc(-8, -5, 4, 0, Math.PI * 2); this.ctx.arc(8, -5, 4, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath(); this.ctx.arc(-9, -6, 2, 0, Math.PI * 2); this.ctx.arc(7, -6, 2, 0, Math.PI * 2); this.ctx.fill();
        if (!triggered) {
            this.ctx.strokeStyle = '#228B22'; this.ctx.lineWidth = 3;
            this.ctx.beginPath(); this.ctx.moveTo(0, -20); this.ctx.lineTo(0, -30); this.ctx.stroke();
            this.ctx.fillStyle = '#32CD32'; this.ctx.beginPath(); this.ctx.ellipse(0, -30, 5, 3, 0, 0, Math.PI * 2); this.ctx.fill();
        }
        this.ctx.restore();
    }

    drawZombie(zombie) {
        const x = zombie.x, y = zombie.y;
        let yOffset = 0;
        if (zombie.jumping) yOffset = -Math.sin(zombie.jumpProgress * Math.PI) * 50;
        const wobble = zombie.attacking ? Math.sin(Date.now() / 100) * 3 : Math.sin(Date.now() / 300) * 2;
        this.ctx.save();
        this.ctx.translate(x, y + wobble + yOffset);
        if (zombie.slowed) {
            this.ctx.fillStyle = 'rgba(135, 206, 235, 0.5)';
            this.ctx.beginPath(); this.ctx.arc(0, 0, 35, 0, Math.PI * 2); this.ctx.fill();
        }
        if (zombie.type === 'normal') this.drawNormalZombie();
        else if (zombie.type === 'cone') this.drawConeZombie();
        else if (zombie.type === 'bucket') this.drawBucketZombie();
        else if (zombie.type === 'flag') this.drawFlagZombie();
        else if (zombie.type === 'polevault') this.drawPolevaultZombie(zombie);
        else if (zombie.type === 'newspaper') this.drawNewspaperZombie(zombie);
        else if (zombie.type === 'screenDoor') this.drawScreenDoorZombie();
        else this.drawNormalZombie();
        this.ctx.restore();
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x - 20, y - 45 + yOffset, 40, 5);
        this.ctx.fillStyle = zombie.slowed ? '#87CEEB' : '#e74c3c';
        this.ctx.fillRect(x - 20, y - 45 + yOffset, 40 * (zombie.health / zombie.maxHealth), 5);
    }

    drawNormalZombie() {
        this.ctx.strokeStyle = '#2d3436'; this.ctx.lineWidth = 2;
        this.ctx.fillStyle = '#4a5568'; this.ctx.beginPath(); this.ctx.ellipse(0, 28, 14, 20, 0, 0, Math.PI * 2); this.ctx.fill(); this.ctx.stroke();
        this.ctx.fillStyle = '#2d3748'; this.ctx.fillRect(-12, 35, 8, 15); this.ctx.fillRect(4, 35, 8, 15);
        this.ctx.fillStyle = '#718096'; this.ctx.fillRect(-28, 18, 10, 6); this.ctx.fillRect(18, 18, 10, 6);
        this.ctx.fillStyle = '#7B8B6F'; this.ctx.beginPath(); this.ctx.ellipse(0, 0, 18, 20, 0, 0, Math.PI * 2); this.ctx.fill(); this.ctx.stroke();
        this.ctx.fillStyle = '#6B7B5F';
        this.ctx.beginPath(); this.ctx.ellipse(-8, -18, 8, 10, -0.2, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.beginPath(); this.ctx.ellipse(6, -16, 7, 8, 0.3, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = '#FEDC56';
        this.ctx.beginPath(); this.ctx.ellipse(-8, -2, 7, 8, 0, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.beginPath(); this.ctx.ellipse(8, -2, 7, 8, 0, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = '#E53E3E';
        this.ctx.beginPath(); this.ctx.arc(-8, -1, 3, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.beginPath(); this.ctx.arc(8, -1, 3, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath(); this.ctx.arc(-8, -1, 1.5, 0, Math.PI * 2); this.ctx.arc(8, -1, 1.5, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = '#2d3436'; this.ctx.beginPath(); this.ctx.arc(0, 10, 8, 0, Math.PI); this.ctx.fill();
    }

    drawConeZombie() {
        this.drawNormalZombie();
        this.ctx.fillStyle = '#F97316'; this.ctx.strokeStyle = '#C2410C'; this.ctx.lineWidth = 2;
        this.ctx.beginPath(); this.ctx.moveTo(0, -35); this.ctx.lineTo(-18, -5); this.ctx.lineTo(18, -5); this.ctx.closePath(); this.ctx.fill(); this.ctx.stroke();
        this.ctx.fillStyle = '#FFF'; this.ctx.fillRect(-12, -12, 24, 4); this.ctx.fillRect(-8, -20, 16, 4);
    }

    drawBucketZombie() {
        this.drawNormalZombie();
        this.ctx.fillStyle = '#9CA3AF'; this.ctx.strokeStyle = '#4B5563'; this.ctx.lineWidth = 2;
        this.ctx.beginPath(); this.ctx.moveTo(-16, -8); this.ctx.lineTo(-14, -30); this.ctx.quadraticCurveTo(0, -35, 14, -30); this.ctx.lineTo(16, -8); this.ctx.closePath(); this.ctx.fill(); this.ctx.stroke();
        this.ctx.fillStyle = '#6B7280'; this.ctx.fillRect(-16, -8, 32, 5);
    }

    drawFlagZombie() {
        this.drawNormalZombie();
        this.ctx.fillStyle = '#8B4513'; this.ctx.fillRect(10, -30, 3, 50);
        this.ctx.fillStyle = '#ff0000';
        this.ctx.beginPath(); this.ctx.moveTo(13, -30); this.ctx.lineTo(35, -20); this.ctx.lineTo(13, -10); this.ctx.closePath(); this.ctx.fill();
    }

    drawPolevaultZombie(zombie) {
        this.ctx.strokeStyle = '#2d3436'; this.ctx.lineWidth = 2;
        this.ctx.fillStyle = '#4a5568'; this.ctx.beginPath(); this.ctx.ellipse(0, 28, 14, 20, 0, 0, Math.PI * 2); this.ctx.fill(); this.ctx.stroke();
        this.ctx.fillStyle = '#2d3748'; this.ctx.fillRect(-12, 35, 8, 15); this.ctx.fillRect(4, 35, 8, 15);
        this.ctx.fillStyle = '#7B8B6F'; this.ctx.beginPath(); this.ctx.ellipse(0, 0, 18, 20, 0, 0, Math.PI * 2); this.ctx.fill(); this.ctx.stroke();
        this.ctx.fillStyle = '#6B7B5F';
        this.ctx.beginPath(); this.ctx.ellipse(-8, -18, 8, 10, -0.2, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.beginPath(); this.ctx.ellipse(6, -16, 7, 8, 0.3, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = '#FEDC56';
        this.ctx.beginPath(); this.ctx.ellipse(-8, -2, 7, 8, 0, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.beginPath(); this.ctx.ellipse(8, -2, 7, 8, 0, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = '#E53E3E';
        this.ctx.beginPath(); this.ctx.arc(-8, -1, 3, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.beginPath(); this.ctx.arc(8, -1, 3, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath(); this.ctx.arc(-8, -1, 1.5, 0, Math.PI * 2); this.ctx.arc(8, -1, 1.5, 0, Math.PI * 2); this.ctx.fill();
        if (!zombie.hasJumped) {
            this.ctx.strokeStyle = '#8B4513'; this.ctx.lineWidth = 5;
            this.ctx.beginPath(); this.ctx.moveTo(-20, 10); this.ctx.lineTo(-60, 10); this.ctx.stroke();
            this.ctx.strokeStyle = '#654321'; this.ctx.lineWidth = 3;
            this.ctx.beginPath(); this.ctx.arc(-60, 10, 4, 0, Math.PI * 2); this.ctx.stroke();
        }
    }

    drawNewspaperZombie(zombie) {
        this.drawNormalZombie();
        if (!zombie.newspaperBroken) {
            this.ctx.fillStyle = '#F5F5DC';
            this.ctx.fillRect(-25, -15, 25, 35);
            this.ctx.fillStyle = '#000';
            this.ctx.font = '8px Arial';
            this.ctx.fillText('NEWS', -22, 5);
        }
    }

    drawScreenDoorZombie() {
        this.drawNormalZombie();
        this.ctx.strokeStyle = '#808080'; this.ctx.lineWidth = 3;
        this.ctx.beginPath(); this.ctx.rect(-35, -20, 15, 50); this.ctx.stroke();
        for (let i = 0; i < 5; i++) {
            this.ctx.beginPath(); this.ctx.moveTo(-35, -15 + i * 10); this.ctx.lineTo(-20, -15 + i * 10); this.ctx.stroke();
        }
    }

    drawProjectile(projectile) {
        this.ctx.beginPath(); this.ctx.arc(projectile.x, projectile.y, 10, 0, Math.PI * 2);
        this.ctx.fillStyle = projectile.type === 'frozen' ? '#87CEEB' : '#90EE90'; this.ctx.fill();
        this.ctx.strokeStyle = projectile.type === 'frozen' ? '#4169E1' : '#228B22'; this.ctx.lineWidth = 2; this.ctx.stroke();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.beginPath(); this.ctx.arc(projectile.x - 3, projectile.y - 3, 3, 0, Math.PI * 2); this.ctx.fill();
    }

    drawSun(sun) {
        const pulse = Math.sin(Date.now() / 200) * 0.1 + 1;
        const size = 25 * pulse;
        this.ctx.beginPath(); this.ctx.arc(sun.x, sun.y, size, 0, Math.PI * 2);
        const gradient = this.ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, size);
        gradient.addColorStop(0, '#FFFF00'); gradient.addColorStop(0.7, '#FFD700'); gradient.addColorStop(1, '#FFA500');
        this.ctx.fillStyle = gradient; this.ctx.fill();
    }

    drawCoin(coin) {
        const pulse = Math.sin(Date.now() / 150) * 0.1 + 1;
        const size = 12 * pulse;
        this.ctx.beginPath(); this.ctx.arc(coin.x, coin.y, size, 0, Math.PI * 2);
        const gradient = this.ctx.createRadialGradient(coin.x, coin.y, 0, coin.x, coin.y, size);
        gradient.addColorStop(0, coin.isGold ? '#FFD700' : '#C0C0C0');
        gradient.addColorStop(1, coin.isGold ? '#DAA520' : '#A0A0A0');
        this.ctx.fillStyle = gradient; this.ctx.fill();
        this.ctx.fillStyle = '#8B4513'; this.ctx.font = 'bold 10px Arial'; this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'middle';
        this.ctx.fillText(coin.value, coin.x, coin.y);
    }

    drawSeed(seed) {
        const pulse = Math.sin(Date.now() / 200) * 0.1 + 1;
        const size = 10 * pulse;
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath(); this.ctx.ellipse(seed.x, seed.y, size, size * 1.3, 0, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = '#90EE90';
        this.ctx.beginPath(); this.ctx.ellipse(seed.x, seed.y - 5, 3, 5, 0, 0, Math.PI * 2); this.ctx.fill();
    }

    drawLawnMower(mower) {
        this.ctx.save(); this.ctx.translate(mower.x, mower.y);
        this.ctx.fillStyle = '#DC2626'; this.ctx.strokeStyle = '#991B1B'; this.ctx.lineWidth = 2;
        this.ctx.beginPath(); this.ctx.roundRect(-20, -15, 40, 25, 3); this.ctx.fill(); this.ctx.stroke();
        this.ctx.fillStyle = '#1F2937'; this.ctx.fillRect(18, -18, 8, 30);
        this.ctx.fillStyle = '#374151';
        this.ctx.beginPath(); this.ctx.moveTo(-20, -15); this.ctx.lineTo(-25, -20); this.ctx.lineTo(-25, -5); this.ctx.lineTo(-20, 0); this.ctx.closePath(); this.ctx.fill(); this.ctx.stroke();
        this.ctx.fillStyle = '#EF4444';
        this.ctx.beginPath(); this.ctx.moveTo(-8, -15); this.ctx.lineTo(-12, -22); this.ctx.lineTo(8, -22); this.ctx.lineTo(4, -15); this.ctx.closePath(); this.ctx.fill(); this.ctx.stroke();
        this.ctx.fillStyle = '#1F2937'; this.ctx.strokeStyle = '#111827';
        this.ctx.beginPath(); this.ctx.arc(-12, 15, 8, 0, Math.PI * 2); this.ctx.fill(); this.ctx.stroke();
        this.ctx.beginPath(); this.ctx.arc(12, 15, 8, 0, Math.PI * 2); this.ctx.fill(); this.ctx.stroke();
        this.ctx.fillStyle = '#6B7280';
        this.ctx.beginPath(); this.ctx.arc(-12, 15, 4, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.beginPath(); this.ctx.arc(12, 15, 4, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.restore();
    }

    showMenu(title, message) {
        const menu = document.getElementById('gameMenu');
        menu.querySelector('h1').textContent = title;
        menu.querySelector('p').textContent = message;
        menu.style.display = 'block';
    }

    hideMenu() {
        document.getElementById('gameMenu').style.display = 'none';
        document.getElementById('pauseMenu').style.display = 'none';
    }

    startLevel() {
        this.hideMenu();
        const levelConfig = LEVELS[this.currentLevel - 1];
        this.totalWaves = levelConfig.waves;
        this.sunCount = levelConfig.sun;
        this.wave = 0;
        this.zombiesInWave = 0;
        this.zombiesKilled = 0;
        this.plants = [];
        this.zombies = [];
        this.projectiles = [];
        this.suns = [];
        this.coins_game = [];
        this.seeds_game = [];
        this.particles = [];
        this.cooldowns = {};
        this.paused = false;
        this.gameSpeed = 1;
        document.getElementById('speedBtn').textContent = '1x';
        document.getElementById('speedBtn').classList.remove('active');
        this.initGrid();
        this.initLawnMowers();
        this.updatePlantCards();
        this.gameOver = false;
        this.gameWon = false;
        this.gameRunning = true;
        this.lastSunDrop = Date.now();
        this.lastZombieSpawn = Date.now();
        this.gameStartTime = Date.now();
        this.countdownActive = true;
        this.waveInProgress = false;
        this.updateSunCounter();
        this.updateCoinCounter();
        document.getElementById('waveInfo').textContent = `波次: 0/${this.totalWaves}`;
        document.getElementById('levelInfo').textContent = `关卡: ${this.currentLevel}`;
        document.getElementById('countdownDisplay').style.display = 'block';
        sound.playBGM();
    }

    start() { this.startLevel(); }

    gameLoop(timestamp) {
        const deltaTime = timestamp - (this.lastFrame || timestamp);
        this.lastFrame = timestamp;
        this.update(deltaTime);
        this.render();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    run() { requestAnimationFrame((t) => this.gameLoop(t)); }
}

const game = new Game();
game.run();