// Motore della Mappa

const MapEngine = {
    grid: [],
    width: 0,
    height: 0,
    tileSize: 50,
    container: null,
    
    init: function(mapData) {
        this.container = document.getElementById('game-map');
        this.width = mapData.width;
        this.height = mapData.height;
        this.grid = [];
        
        this.container.style.gridTemplateColumns = `repeat(${this.width}, ${this.tileSize}px)`;
        this.container.style.gridTemplateRows = `repeat(${this.height}, ${this.tileSize}px)`;
        this.container.style.width = `${this.width * this.tileSize}px`;
        this.container.style.height = `${this.height * this.tileSize}px`;
        this.container.innerHTML = '';

        // Genera griglia base
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                // Procedurale basico mescolato con dati fissi
                let biome = mapData.defaultBiome;
                
                // Variabilità random per rendere la mappa più interessante
                if (Math.random() < 0.1) {
                    biome = biome === 'desert' ? 'mountain' : (biome === 'forest' ? 'mountain' : 'island');
                }

                const tile = {
                    x, y,
                    biome: biome,
                    element: document.createElement('div'),
                    isFog: true
                };
                
                tile.element.className = `tile biome-${tile.biome} fog`;
                tile.element.dataset.x = x;
                tile.element.dataset.y = y;
                
                // --- Eventi Drag & Drop ---
                tile.element.addEventListener('dragover', (e) => {
                    e.preventDefault(); // Necessario per consentire il drop
                    if(!tile.isFog && GameState.draggedCard) {
                        e.dataTransfer.dropEffect = 'copy';
                        tile.element.classList.add('drag-over');
                    }
                });
                
                tile.element.addEventListener('dragleave', () => {
                    tile.element.classList.remove('drag-over');
                });
                
                tile.element.addEventListener('drop', (e) => {
                    e.preventDefault();
                    tile.element.classList.remove('drag-over');
                    
                    if(GameState.draggedCard) {
                        if(!tile.isFog) {
                            // Check se c'è già una truppa (Anti-sovrapposizione per i drop)
                            if (GameState.draggedCard.type !== 'strutture' && GameState.draggedCard.type !== 'mezzi') {
                                const isOccupied = [...GameState.player.entities, ...GameState.enemy.entities]
                                    .some(ent => Math.round(ent.x) === x && Math.round(ent.y) === y);
                                if (isOccupied) {
                                    alert("C'è già un'unità qui! Non puoi sovrapporre i soldati.");
                                    return;
                                }
                            }
                            
                            GameEngine.buyAndDeploy(GameState.draggedCard, x, y);
                        } else {
                            alert("Puoi schierare solo in zone esplorate (non nella nebbia)!");
                        }
                    }
                });

                // --- Click Destro per Movimento / Combattimento ---
                tile.element.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    if(GameState.phase === 'playing' && GameState.selectedEntities.length > 0) {
                        // Trova se c'è un'entità nemica qui
                        const enemy = GameState.enemy.entities.find(en => Math.round(en.x) === x && Math.round(en.y) === y);
                        
                        if (enemy) {
                            // Attacco forzato per tutti i selezionati
                            GameState.selectedEntities.forEach(ent => {
                                GameEngine.forceAttack(ent, enemy);
                            });
                        } else {
                            // Muovi la squadra (formazione a croce/quadrato per evitare stacking)
                            const offsets = [
                                {dx: 0, dy: 0}, {dx: 1, dy: 0}, {dx: -1, dy: 0}, 
                                {dx: 0, dy: 1}, {dx: 0, dy: -1}, {dx: 1, dy: 1}, 
                                {dx: -1, dy: -1}, {dx: 1, dy: -1}, {dx: -1, dy: 1}
                            ];
                            
                            for(let i = 0; i < GameState.selectedEntities.length; i++) {
                                const ent = GameState.selectedEntities[i];
                                const offset = offsets[i % offsets.length];
                                GameEngine.setEntityTarget(ent, x + offset.dx, y + offset.dy);
                            }
                        }
                        MapEngine.showMoveIndicator(e.clientX, e.clientY);
                    }
                });

                this.container.appendChild(tile.element);
                row.push(tile);
            }
            this.grid.push(row);
        }

        // Applica features specifiche
        mapData.features.forEach(f => {
            if (this.grid[f.y] && this.grid[f.y][f.x]) {
                this.grid[f.y][f.x].biome = f.type;
                this.grid[f.y][f.x].element.className = `tile biome-${f.type} fog`;
            }
        });

        // Imposta base player (scopre un'area iniziale)
        this.clearFog(5, 5, 14); 

        // AI Base (scopre una piccola area per evitare spawn in nebbia assoluta per logica interna, 
        // ma per il player resta nebbia finché non ci arriva. Noi gestiamo l'AI indipendentemente dalla visuale player)
        
        // Imposta drag per fare panning della mappa
        this.setupPanning();
    },

    clearFog: function(centerX, centerY, radius) {
        for (let y = Math.max(0, centerY - radius); y <= Math.min(this.height - 1, centerY + radius); y++) {
            for (let x = Math.max(0, centerX - radius); x <= Math.min(this.width - 1, centerX + radius); x++) {
                this.grid[y][x].isFog = false;
                this.grid[y][x].element.classList.remove('fog');
            }
        }
    },

    setupPanning: function() {
        let isDragging = false;
        let startX, startY, scrollLeft, scrollTop;
        const wrapper = document.getElementById('game-map-container');

        wrapper.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.pageX - wrapper.offsetLeft;
            startY = e.pageY - wrapper.offsetTop;
            scrollLeft = wrapper.scrollLeft;
            scrollTop = wrapper.scrollTop;
        });

        wrapper.addEventListener('mouseleave', () => isDragging = false);
        wrapper.addEventListener('mouseup', () => isDragging = false);

        wrapper.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - wrapper.offsetLeft;
            const y = e.pageY - wrapper.offsetTop;
            const walkX = (x - startX) * 1.5;
            const walkY = (y - startY) * 1.5;
            wrapper.scrollLeft = scrollLeft - walkX;
            wrapper.scrollTop = scrollTop - walkY;
        });
    },

    spawnEntity: function(owner, cardData, startX, startY) {
        const entity = {
            id: Date.now() + Math.random(),
            owner: owner,
            x: startX,
            y: startY,
            targetX: startX,
            targetY: startY,
            data: { ...cardData }, // Clona i dati base
            hasVehicle: false,
            isLeader: false,
            element: document.createElement('div'),
            healthBar: document.createElement('div'),
            healthFill: document.createElement('div')
        };

        entity.element.className = `entity ${owner}`;
        if(cardData.id === 'hq') {
            entity.element.classList.add('hq');
            entity.isStatic = true;
            
            // Le basi non hanno le stesse health bar standard
            entity.healthBar.className = 'health-bar';
            entity.healthFill.className = 'health-fill';
            entity.healthBar.style.width = '180px';
            entity.healthBar.style.left = '10px';
            entity.healthBar.style.top = '-15px';
            entity.healthBar.appendChild(entity.healthFill);
            entity.element.appendChild(entity.healthBar);
        } else {
            // Setup Health Bar standard
            entity.healthBar.className = 'health-bar';
            entity.healthFill.className = 'health-fill';
            entity.healthBar.appendChild(entity.healthFill);
            entity.element.appendChild(entity.healthBar);
        }
        
        // Posizionamento assoluto calcolato
        this.updateEntityPosition(entity);

        // Click per selezionare
        entity.element.addEventListener('click', (e) => {
            e.stopPropagation();
            if (owner === 'player' && !entity.isStatic) {
                if(GameState.squadMode === 'adding_members') {
                    // Aggiungi/Rimuovi dalla selezione per creare la squadra
                    if(!GameState.selectedEntities.includes(entity)) {
                        GameState.selectedEntities.push(entity);
                        entity.element.classList.add('selected');
                    } else {
                        GameState.selectedEntities = GameState.selectedEntities.filter(ent => ent !== entity);
                        entity.element.classList.remove('selected');
                    }
                    return;
                }

                // Deseleziona tutto prima
                GameState.player.entities.forEach(ent => ent.element.classList.remove('selected'));
                GameState.selectedEntities = [];

                if(entity.squadId) {
                    // Se fa parte di una squadra, seleziona tutti i membri
                    GameState.player.entities.forEach(ent => {
                        if(ent.squadId === entity.squadId) {
                            ent.element.classList.add('selected');
                            GameState.selectedEntities.push(ent);
                        }
                    });
                } else {
                    // Seleziona singolo
                    entity.element.classList.add('selected');
                    GameState.selectedEntities.push(entity);
                }
            }
        });

        // Drop su entità per potenziarla (Solo Mezzi)
        entity.element.addEventListener('dragover', (e) => e.preventDefault());
        entity.element.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if(GameState.draggedCard && owner === 'player' && GameState.draggedCard.type === 'mezzi') {
                GameEngine.upgradeEntity(entity, GameState.draggedCard);
            }
        });

        this.container.appendChild(entity.element);
        GameState[owner].entities.push(entity);
        return entity;
    },

    updateEntityPosition: function(entity) {
        if(entity.data.id === 'hq') {
            // HQ (200x200) centrato sui suoi 4x4 tiles (0 offset rispetto all'angolo)
            entity.element.style.left = `${entity.x * this.tileSize}px`;
            entity.element.style.top = `${entity.y * this.tileSize}px`;
        } else {
            entity.element.style.left = `${entity.x * this.tileSize + (this.tileSize/2 - 20)}px`;
            entity.element.style.top = `${entity.y * this.tileSize + (this.tileSize/2 - 20)}px`;
        }
    },

    updateHealthBar: function(entity) {
        const pct = Math.max(0, (entity.data.hp / entity.data.maxHp) * 100);
        entity.healthFill.style.width = `${pct}%`;
    },

    showMoveIndicator: function(clientX, clientY) {
        const wrapper = document.getElementById('game-map-container');
        const map = document.getElementById('game-map');
        
        const rect = map.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        const indicator = document.createElement('div');
        indicator.className = 'move-indicator';
        indicator.style.left = `${x}px`;
        indicator.style.top = `${y}px`;
        map.appendChild(indicator);

        setTimeout(() => indicator.remove(), 1000);
    }
};
