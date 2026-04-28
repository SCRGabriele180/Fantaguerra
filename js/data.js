// Database delle carte (con HP e attributi base)
const CARDS_DB = {
    soldati: [
        { id: 's1', name: 'Fanteria Leggera', cost: 50, atk: 10, def: 5, hp: 100, maxHp: 100, icon: '🪖', type: 'soldati' },
        { id: 's2', name: 'Tiratore Scelto', cost: 100, atk: 25, def: 2, hp: 80, maxHp: 80, icon: '🎯', type: 'soldati' },
        { id: 's3', name: 'Fanteria Pesante', cost: 150, atk: 15, def: 30, hp: 150, maxHp: 150, icon: '🛡️', type: 'soldati' }
    ],
    mezzi: [
        { id: 'm1', name: 'Fuoristrada', cost: 200, atk: 20, def: 15, hp: 200, maxHp: 200, icon: '🚙', type: 'mezzi' },
        { id: 'm2', name: 'Carro Armato', cost: 400, atk: 50, def: 60, hp: 500, maxHp: 500, icon: '🚜', type: 'mezzi' },
        { id: 'm3', name: 'Elicottero', cost: 350, atk: 40, def: 20, hp: 150, maxHp: 150, icon: '🚁', type: 'mezzi' }
    ],
    leader: [
        { id: 'l1', name: 'Generale Alpha', cost: 300, atk: 30, def: 30, hp: 300, maxHp: 300, icon: '⭐', type: 'leader' },
        { id: 'l2', name: 'Stratega', cost: 300, atk: 10, def: 40, hp: 250, maxHp: 250, icon: '🧠', type: 'leader' }
    ],
    strutture: [
        { id: 'hq', name: 'Quartier Generale', cost: 0, hp: 5000, maxHp: 5000, icon: '🏛️', type: 'strutture', effect: 'base' },
        { id: 'b1', name: 'Fabbrica', cost: 200, hp: 1000, maxHp: 1000, icon: '🏭', type: 'strutture', effect: 'coins' },
        { id: 'b2', name: 'Fattoria', cost: 150, hp: 500, maxHp: 500, icon: '🌾', type: 'strutture', effect: 'food' },
        { id: 'b3', name: 'Ospedale', cost: 250, hp: 500, maxHp: 500, icon: '🏥', type: 'strutture', effect: 'meds' }
    ]
};

// Mappe predefinite
const MAPS = {
    desert: {
        name: 'Oasi di Sabbia (Grande)',
        width: 60,
        height: 40,
        defaultBiome: 'desert',
        features: [
            { x: 10, y: 10, type: 'village' },
            { x: 50, y: 30, type: 'village' },
            { x: 30, y: 20, type: 'factory' }
        ]
    },
    forest: {
        name: 'Foresta Oscura (Grande)',
        width: 60,
        height: 40,
        defaultBiome: 'forest',
        features: [
            { x: 15, y: 15, type: 'village' },
            { x: 45, y: 25, type: 'factory' }
        ]
    },
    island: {
        name: 'Arcipelago (Grande)',
        width: 60,
        height: 40,
        defaultBiome: 'sea',
        features: [
            { x: 30, y: 20, type: 'village' },
            { x: 10, y: 30, type: 'factory' }
        ]
    }
};

// Stato globale del gioco
const GameState = {
    phase: 'setup', // 'setup', 'deployment', 'playing'
    draggedCard: null, // Carta attualmente trascinata
    player: {
        coins: 10000,
        food: 100,
        meds: 5,
        troopsCount: 0,
        troopsMax: 20,
        entities: []
    },
    enemy: {
        baseX: 0,
        baseY: 0,
        coins: 1000,
        food: 100,
        meds: 5,
        troopsCount: 0,
        troopsMax: 20,
        entities: []
    },
    strutture: [], // Strutture piazzate sulla mappa
    currentMap: null,
    difficulty: 'medium',
    time: 0,
    isRunning: false,
    selectedEntities: [],
    animationFrameId: null,
    squadCounter: 1, // Per generare ID squadra
    squadMode: null // 'adding_members'
};
