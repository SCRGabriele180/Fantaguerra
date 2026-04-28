// Motore di Gioco Principale (Tempo Reale, Fluid Movement, Deployment)

const GameEngine = {
    loopInterval: null,
    lastTime: 0,
    
    startDeployment: function(mapKey, difficulty) {
        // Init State
        GameState.phase = 'deployment';
        GameState.currentMap = MAPS[mapKey];
        GameState.difficulty = difficulty;
        GameState.time = 0;
        GameState.isRunning = true;
        GameState.player.coins = 500; // Bilanciamento iniziale
        GameState.player.food = 100;
        GameState.player.meds = 5;
        GameState.player.troopsCount = 0;
        GameState.player.entities = [];
        
        // Setup base nemica (nell'angolo in basso a destra)
        GameState.enemy.baseX = GameState.currentMap.width - 8;
        GameState.enemy.baseY = GameState.currentMap.height - 8;
        GameState.enemy.coins = 500; // Bilanciamento iniziale
        GameState.enemy.food = 100;
        GameState.enemy.meds = 5;
        GameState.enemy.troopsCount = 0;
        GameState.enemy.entities = [];
        
        GameState.strutture = [];
        GameState.selectedEntity = null;

        // Init UI
        UI.showScreen('game-screen');
        document.getElementById('current-map-name').innerText = GameState.currentMap.name;
        UI.updateHUD();
        UI.renderCards('soldati');

        // Init Mappa
        MapEngine.init(GameState.currentMap);

        // Spawn Base Player
        MapEngine.spawnEntity('player', CARDS_DB.strutture[0], 4, 4);
        
        // Centra la telecamera sulla base
        const container = document.getElementById('game-map-container');
        container.scrollLeft = (4 * 50) - (container.clientWidth / 2) + 100;
        container.scrollTop = (4 * 50) - (container.clientHeight / 2) + 100;

        // Spawn Base Nemica
        MapEngine.spawnEntity('enemy', CARDS_DB.strutture[0], GameState.enemy.baseX, GameState.enemy.baseY);

        // Start Loop Animazione
        if(GameState.animationFrameId) cancelAnimationFrame(GameState.animationFrameId);
        this.lastTime = performance.now();
        GameState.animationFrameId = requestAnimationFrame((t) => this.renderLoop(t));
    },

    startBattle: function() {
        if(GameState.player.entities.length === 0) {
            alert("Devi schierare almeno un soldato prima di iniziare!");
            return;
        }
        GameState.phase = 'playing';
        UI.updateHUD();
        
        // Rimuove gli hint della zona di schieramento e mostra UI squadre
        document.querySelectorAll('.deployment-zone').forEach(el => el.classList.remove('deployment-zone'));
        document.getElementById('squad-create-btn').style.display = 'block';

        // Start Logica Temporale
        if(this.loopInterval) clearInterval(this.loopInterval);
        this.loopInterval = setInterval(() => this.logicLoop(), 1000); // 1 tick al secondo per logica macro
    },

    buyAndDeploy: function(cardData, x, y) {
        if(GameState.player.coins >= cardData.cost) {
            // Se è una struttura, gestisci la costruzione
            if(cardData.type === 'strutture') {
                GameState.player.coins -= cardData.cost;
                GameState.strutture.push({x, y, owner: 'player', data: cardData});
                MapEngine.grid[y][x].biome = cardData.id;
                MapEngine.grid[y][x].element.className = `tile biome-${cardData.id}`;
                UI.updateHUD();
                return;
            }

            if(GameState.player.troopsCount < GameState.player.troopsMax) {
                GameState.player.coins -= cardData.cost;
                GameState.player.troopsCount++;
                
                const entity = MapEngine.spawnEntity('player', cardData, x, y);
                
                if(cardData.type === 'leader') { entity.isLeader = true; entity.element.classList.add('is-leader'); }
                if(cardData.type === 'mezzi') { entity.hasVehicle = true; entity.element.classList.add('has-vehicle'); }
                
                UI.updateHUD();
            } else {
                alert("Limite truppe raggiunto!");
            }
        } else {
            alert("Monete insufficienti!");
        }
    },

    upgradeEntity: function(entity, cardData) {
        if(GameState.player.coins >= cardData.cost) {
            if(cardData.type === 'mezzi' && !entity.hasVehicle) {
                GameState.player.coins -= cardData.cost;
                entity.hasVehicle = true;
                entity.element.classList.add('has-vehicle');
                entity.data.hp += cardData.hp;
                entity.data.maxHp += cardData.maxHp;
                entity.data.atk += cardData.atk;
                entity.data.def += cardData.def;
                MapEngine.updateHealthBar(entity);
                UI.updateHUD();
            } else if(cardData.type === 'leader' && !entity.isLeader) {
                GameState.player.coins -= cardData.cost;
                entity.isLeader = true;
                entity.element.classList.add('is-leader');
                entity.data.hp += cardData.hp;
                entity.data.maxHp += cardData.maxHp;
                entity.data.atk += cardData.atk;
                entity.data.def += cardData.def;
                MapEngine.updateHealthBar(entity);
                UI.updateHUD();
            } else {
                alert("Questa unità ha già questo potenziamento o carta non valida!");
            }
        }
    },

    buildFactory: function(x, y) {
        GameState.player.coins -= 200;
        GameState.factories.push({x, y, owner: 'player'});
        MapEngine.grid[y][x].biome = 'factory';
        MapEngine.grid[y][x].element.className = `tile biome-factory`;
        UI.updateHUD();
    },

    // Controllo se un tile è occupato da entità fisiche
    isTileOccupied: function(tx, ty, ignoreEntity) {
        const all = [...GameState.player.entities, ...GameState.enemy.entities];
        for (let i = 0; i < all.length; i++) {
            const e = all[i];
            if (e === ignoreEntity) continue;
            
            // Check base 4x4
            if (e.data.id === 'hq') {
                if (tx >= e.x && tx < e.x + 4 && ty >= e.y && ty < e.y + 4) {
                    return true;
                }
            } else {
                // Se c'è un'unità ferma o che si sta muovendo su quella casella esatta
                if (Math.round(e.x) === tx && Math.round(e.y) === ty) {
                    return true;
                }
            }
        }
        return false;
    },

    getEntityDistance: function(e1, e2) {
        let w1 = e1.data && e1.data.id === 'hq' ? 4 : 1;
        let h1 = w1;
        let w2 = e2.data && e2.data.id === 'hq' ? 4 : 1;
        let h2 = w2;

        let dx = Math.max(0, Math.max(e1.x - (e2.x + w2 - 1), e2.x - (e1.x + w1 - 1)));
        let dy = Math.max(0, Math.max(e1.y - (e2.y + h2 - 1), e2.y - (e1.y + h1 - 1)));
        return dx + dy;
    },

    findSpawnPointAroundBase: function(baseEntity) {
        // Il perimetro attorno al 4x4:
        // x da baseX-1 a baseX+4
        // y da baseY-1 a baseY+4
        const bx = baseEntity.x;
        const by = baseEntity.y;
        
        // Cerchiamo sui bordi
        const edges = [];
        for(let x = bx - 1; x <= bx + 4; x++) {
            edges.push({x: x, y: by - 1});
            edges.push({x: x, y: by + 4});
        }
        for(let y = by; y <= by + 3; y++) {
            edges.push({x: bx - 1, y: y});
            edges.push({x: bx + 4, y: y});
        }

        // Randomizziamo per non spawnare sempre nello stesso angolo
        edges.sort(() => Math.random() - 0.5);

        for (let pt of edges) {
            // Controlla limiti mappa
            if (pt.x >= 0 && pt.x < GameState.currentMap.width && pt.y >= 0 && pt.y < GameState.currentMap.height) {
                // Controlla che non sia occupato da montangne o entità
                const tile = MapEngine.grid[pt.y][pt.x];
                if (tile.biome !== 'mountain' && !this.isTileOccupied(pt.x, pt.y)) {
                    return pt;
                }
            }
        }
        return null;
    },

    buyAndDeployFixed: function(cardData, ownerKey) {
        const state = GameState[ownerKey];
        if(state.coins >= cardData.cost) {
            if(state.troopsCount < state.troopsMax) {
                // Trova la base
                const base = state.entities.find(e => e.data.id === 'hq');
                if(!base) return;

                const spawnPt = this.findSpawnPointAroundBase(base);
                if(spawnPt) {
                    state.coins -= cardData.cost;
                    state.troopsCount++;
                    
                    const entity = MapEngine.spawnEntity(ownerKey, cardData, spawnPt.x, spawnPt.y);
                    if(cardData.type === 'leader') { entity.isLeader = true; entity.element.classList.add('is-leader'); }
                    if(cardData.type === 'mezzi') { entity.hasVehicle = true; entity.element.classList.add('has-vehicle'); }
                    
                    if(ownerKey === 'player') UI.updateHUD();
                } else {
                    if(ownerKey === 'player') alert("Base piena! Muovi le truppe attorno alla base per fare spazio.");
                }
            } else {
                if(ownerKey === 'player') alert("Limite truppe raggiunto!");
            }
        } else {
            if(ownerKey === 'player') alert("Monete insufficienti!");
        }
    },

    setEntityTarget: function(entity, x, y) {
        // Se la casella è occupata, cerchiamo una casella adiacente libera
        if (this.isTileOccupied(x, y, entity)) {
            const neighbors = [
                {nx: x+1, ny: y}, {nx: x-1, ny: y}, 
                {nx: x, ny: y+1}, {nx: x, ny: y-1}
            ];
            let found = false;
            for(let n of neighbors) {
                if(!this.isTileOccupied(n.nx, n.ny, entity)) {
                    x = n.nx; y = n.ny;
                    found = true;
                    break;
                }
            }
            if(!found) return; // Non ci si può muovere lì vicino
        }

        entity.targetX = x;
        entity.targetY = y;
        entity.state = 'moving';
    },

    forceAttack: function(attacker, target) {
        attacker.forcedTargetId = target.id;
        attacker.state = 'fighting';
        attacker.targetX = target.x;
        attacker.targetY = target.y;
    },

    // --- LOOP LOGICO MACRO (1 sec) ---
    // Il movimento e il combattimento ora sono discreti (gestiti 1 volta al secondo)
    logicLoop: function() {
        if (!GameState.isRunning) return;

        GameState.time++;
        this.updateTimeDisplay();
        
        this.handleMovement();
        this.handleEconomy();
        this.handleAI();
        this.resolveBattles();
        this.checkStructuresCapture();
    },

    handleMovement: function() {
        const moveEntity = (entity) => {
            if(entity.state !== 'moving') return;

            // Se adiacente, fermati
            if(Math.abs(entity.targetX - entity.x) + Math.abs(entity.targetY - entity.y) <= 0.1) {
                entity.x = entity.targetX;
                entity.y = entity.targetY;
                entity.state = 'idle';
                MapEngine.updateEntityPosition(entity);
                return;
            }

            // Movimento a griglia: un passo alla volta
            const steps = entity.hasVehicle ? 2 : 1;
            
            for(let i=0; i<steps; i++) {
                if(entity.x === entity.targetX && entity.y === entity.targetY) break;
                
                let dx = Math.sign(entity.targetX - entity.x);
                let dy = Math.sign(entity.targetY - entity.y);

                // Preferisci muoversi prima in X o Y a caso per variare
                if(dx !== 0 && dy !== 0) {
                    if(Math.random() > 0.5) dy = 0; else dx = 0;
                }

                // Controllo Anti-Stacking in movimento
                if (!this.isTileOccupied(entity.x + dx, entity.y + dy, entity)) {
                    entity.x += dx;
                    entity.y += dy;
                } else {
                    // Cerca un percorso alternativo o fermati
                    entity.state = 'idle';
                    entity.targetX = entity.x;
                    entity.targetY = entity.y;
                    break;
                }
            }

            MapEngine.updateEntityPosition(entity);
            
            // Aggiorna Fog of War per il player
            if(entity.owner === 'player') {
                MapEngine.clearFog(Math.round(entity.x), Math.round(entity.y), entity.isLeader ? 4 : 2);
            }
        };

        GameState.player.entities.forEach(moveEntity);
        GameState.enemy.entities.forEach(moveEntity);
    },

    updateTimeDisplay: function() {
        const m = Math.floor(GameState.time / 60).toString().padStart(2, '0');
        const s = (GameState.time % 60).toString().padStart(2, '0');
        document.getElementById('game-time').innerText = `${m}:${s}`;
    },

    handleEconomy: function() {
        const processEconomy = (ownerKey) => {
            const playerState = GameState[ownerKey];
            // Consumo cibo
            if (GameState.time % 5 === 0 && playerState.troopsCount > 0) {
                playerState.food -= playerState.troopsCount * 2;
                if (playerState.food < 0) playerState.food = 0;
            }

            // Reddito passivo minimo per l'IA per non bloccarla
            if (ownerKey === 'enemy' && GameState.time % 2 === 0) {
                playerState.coins += 5;
            }

            // Strutture
            GameState.strutture.forEach(s => {
                if(s.owner === ownerKey) {
                    if(s.data.effect === 'coins') playerState.coins += 5;
                    if(s.data.effect === 'food') playerState.food += 5;
                    if(s.data.effect === 'meds' && GameState.time % 5 === 0) playerState.meds += 1;
                }
            });

            // Villaggi nativi
            playerState.entities.forEach(ent => {
                if(ent.state === 'idle') {
                    const rx = Math.round(ent.x);
                    const ry = Math.round(ent.y);
                    if (MapEngine.grid[ry] && MapEngine.grid[ry][rx] && MapEngine.grid[ry][rx].biome === 'village') {
                        playerState.coins += 2;
                    }
                }
            });
        };

        processEconomy('player');
        processEconomy('enemy');
        UI.updateHUD();
    },

    checkStructuresCapture: function() {
        GameState.strutture.forEach(s => {
            // Check nemici
            GameState.enemy.entities.forEach(e => {
                if(Math.round(e.x) === s.x && Math.round(e.y) === s.y) {
                    if(s.owner !== 'enemy') {
                        s.owner = 'enemy';
                        MapEngine.grid[s.y][s.x].element.style.borderColor = 'red';
                        MapEngine.grid[s.y][s.x].element.style.boxShadow = 'inset 0 0 10px red';
                    }
                }
            });
            // Check player
            GameState.player.entities.forEach(p => {
                if(Math.round(p.x) === s.x && Math.round(p.y) === s.y) {
                    if(s.owner !== 'player') {
                        s.owner = 'player';
                        MapEngine.grid[s.y][s.x].element.style.borderColor = '#fbbf24';
                        MapEngine.grid[s.y][s.x].element.style.boxShadow = 'inset 0 0 10px #fbbf24';
                    }
                }
            });
        });
    },

    handleAI: function() {
        const ai = GameState.enemy;
        
        // Spawn AI (ha soldi, li spende per truppe leggere, leader e strutture)
        if(GameState.time % 10 === 0) {
            // IA costruisce strutture vicino alla sua base (Priorità alta se non ha tante fabbriche)
            if(ai.coins >= 200 && Math.random() > 0.4) {
                ai.coins -= 200;
                let sx = ai.baseX + Math.floor(Math.random()*5 - 2);
                let sy = ai.baseY + Math.floor(Math.random()*5 - 2);
                
                if (MapEngine.grid[sy] && MapEngine.grid[sy][sx] && MapEngine.grid[sy][sx].biome !== 'mountain' && !MapEngine.grid[sy][sx].element.className.includes('biome-b')) {
                    GameState.strutture.push({x: sx, y: sy, owner: 'enemy', data: CARDS_DB.strutture[0]});
                    MapEngine.grid[sy][sx].biome = 'b1';
                    MapEngine.grid[sy][sx].element.className = 'tile biome-b1';
                    MapEngine.grid[sy][sx].element.style.borderColor = 'red';
                } else {
                    ai.coins += 200; // Rimborso
                }
            }

            // Spawn truppe dal perimetro
            if(ai.coins >= 50 && ai.troopsCount < ai.troopsMax) {
                this.buyAndDeployFixed(CARDS_DB.soldati[0], 'enemy');
            }
            if(ai.coins >= 300 && Math.random() > 0.8) {
                this.buyAndDeployFixed(CARDS_DB.leader[0], 'enemy');
            }
        }

        // Movimento AI
        if (GameState.time % 2 === 0) {
            ai.entities.forEach(enemy => {
                if(enemy.data.id === 'hq') return; // Impedisce alla base nemica di muoversi
                if(enemy.state === 'fighting') return;

                // Trova target più vicino
                let bestTarget = null;
                let minDist = Infinity;

                // Cerca player units
                GameState.player.entities.forEach(p => {
                    const d = this.getEntityDistance(p, enemy);
                    if(d < minDist) { minDist = d; bestTarget = {x: p.x, y: p.y}; }
                });

                // Cerca strutture player
                GameState.strutture.forEach(s => {
                    if(s.owner === 'player') {
                        // Le strutture piccole sono 1x1
                        let fakeEntity = {x: s.x, y: s.y, data: {id: s.data.id}};
                        const d = this.getEntityDistance(fakeEntity, enemy);
                        if(d < minDist) { minDist = d; bestTarget = {x: s.x, y: s.y}; }
                    }
                });

                if(bestTarget) {
                    this.setEntityTarget(enemy, bestTarget.x, bestTarget.y);
                }
            });
        }
    },

    resolveBattles: function() {
        // Controlla prima le adiacenze per ingaggiare
        GameState.player.entities.forEach(p => {
            GameState.enemy.entities.forEach(e => {
                // Se sono a 1 casella di distanza (Adiacenti in X o Y considerando dimensioni)
                const dist = this.getEntityDistance(p, e);
                if(dist <= 1.0) {
                    // Tregua: Se entrambi sono sotto il 30% HP, fermano il combattimento (a meno di force target)
                    const pLow = p.data.hp < p.data.maxHp * 0.3;
                    const eLow = e.data.hp < e.data.maxHp * 0.3;
                    
                    if(pLow && eLow && p.forcedTargetId !== e.id && e.forcedTargetId !== p.id) {
                        p.state = 'idle';
                        e.state = 'idle';
                    } else {
                        // Combattimento!
                        p.state = 'fighting';
                        e.state = 'fighting';
                        p.targetX = p.x; p.targetY = p.y;
                        e.targetX = e.x; e.targetY = e.y;
                    }
                }
            });
        });

        // Risoluzione danni per chi sta combattendo
        GameState.player.entities.forEach(p => {
            if(p.state !== 'fighting') return;
            
            // Trova nemico adiacente
            let targetEnemy = GameState.enemy.entities.find(e => this.getEntityDistance(p, e) <= 1.0);

            if(targetEnemy) {
                // Calcola danno (con fallback a 0 per le strutture)
                let pAtk = p.data.atk || 0;
                let eAtk = targetEnemy.data.atk || 0;
                let pDef = p.data.def || 0;
                let eDef = targetEnemy.data.def || 0;

                let playerDmg = pAtk * (Math.random() * 0.5 + 0.75);
                let enemyDmg = eAtk * (Math.random() * 0.5 + 0.75);

                // Malus fame (solo se non è una struttura)
                if(p.data.type !== 'strutture' && GameState.player.food <= 0) playerDmg *= 0.5;
                if(targetEnemy.data.type !== 'strutture' && GameState.enemy.food <= 0) enemyDmg *= 0.5;

                // Applica danno
                if(pAtk > 0) targetEnemy.data.hp -= Math.max(1, (playerDmg - (eDef * 0.1)));
                if(eAtk > 0) p.data.hp -= Math.max(1, (enemyDmg - (pDef * 0.1)));

                MapEngine.updateHealthBar(targetEnemy);
                MapEngine.updateHealthBar(p);

                // Auto-Cure player
                if(p.data.hp < p.data.maxHp * 0.3 && GameState.player.meds > 0) {
                    p.data.hp = Math.min(p.data.maxHp, p.data.hp + 100);
                    GameState.player.meds--;
                    UI.updateHUD();
                    p.element.style.boxShadow = '0 0 10px 5px green';
                    setTimeout(() => p.element.style.boxShadow = '', 500);
                }
                
                // Auto-Cure enemy
                if(targetEnemy.data.hp < targetEnemy.data.maxHp * 0.3 && GameState.enemy.meds > 0) {
                    targetEnemy.data.hp = Math.min(targetEnemy.data.maxHp, targetEnemy.data.hp + 100);
                    GameState.enemy.meds--;
                }

                if(targetEnemy.data.hp <= 0) {
                    this.destroyEntity(targetEnemy);
                    p.state = 'idle';
                    p.forcedTargetId = null;
                }
                if(p.data.hp <= 0) {
                    this.destroyEntity(p);
                    targetEnemy.state = 'idle';
                    targetEnemy.forcedTargetId = null;
                }
            } else {
                p.state = 'idle';
            }
        });
    },

    destroyEntity: function(entity) {
        entity.element.remove();
        
        // Controllo Win/Loss condition
        if(entity.data.id === 'hq') {
            GameState.isRunning = false;
            if(entity.owner === 'player') {
                alert("La tua Base è stata distrutta! HAI PERSO!");
            } else {
                alert("Hai distrutto la Base nemica! HAI VINTO!");
            }
            location.reload();
            return;
        }

        if (entity.owner === 'player') {
            GameState.player.entities = GameState.player.entities.filter(e => e.id !== entity.id);
            if(entity.data.type === 'soldati') GameState.player.troopsCount--;
            UI.updateHUD();
            GameState.selectedEntities = GameState.selectedEntities.filter(e => e.id !== entity.id);
        } else {
            GameState.enemy.entities = GameState.enemy.entities.filter(e => e.id !== entity.id);
            if(entity.data.type === 'soldati') GameState.enemy.troopsCount--;
            GameState.player.coins += 20;
            UI.updateHUD();
        }
    }
};
