// Gestione UI e Navigazione Schermate

const UI = {
    init: function() {
        // Selezione mappa
        const mapOptions = document.querySelectorAll('.map-option');
        mapOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                mapOptions.forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                window.selectedMapKey = opt.dataset.map;
            });
        });

        // Default map
        window.selectedMapKey = 'desert';

        // Tasti
        document.getElementById('start-btn').addEventListener('click', () => {
            const difficulty = document.getElementById('ai-difficulty').value;
            GameEngine.startDeployment(window.selectedMapKey, difficulty);
        });

        document.getElementById('start-battle-btn').addEventListener('click', () => {
            GameEngine.startBattle();
        });

        // --- Sistema Squadre ---
        document.getElementById('squad-create-btn').addEventListener('click', () => {
            GameState.squadMode = 'adding_members';
            // Deseleziona tutto prima di iniziare
            GameState.player.entities.forEach(ent => ent.element.classList.remove('selected'));
            GameState.selectedEntities = [];
            
            document.getElementById('squad-create-btn').style.display = 'none';
            document.getElementById('squad-mode-indicator').style.display = 'block';
        });

        document.getElementById('squad-save-btn').addEventListener('click', () => {
            GameState.squadMode = null;
            if(GameState.selectedEntities.length > 1) {
                const squadId = GameState.squadCounter++;
                GameState.selectedEntities.forEach(ent => {
                    ent.squadId = squadId;
                    // Effetto visivo temporaneo
                    ent.element.style.boxShadow = '0 0 10px 5px #eab308';
                    setTimeout(() => ent.element.style.boxShadow = '', 500);
                });
                alert(`Squadra #${squadId} creata con ${GameState.selectedEntities.length} membri! Clicca su uno di loro per muoverli assieme.`);
            } else {
                alert("Devi selezionare almeno 2 unità per creare una squadra.");
            }
            // Reset UI
            document.getElementById('squad-mode-indicator').style.display = 'none';
            document.getElementById('squad-create-btn').style.display = 'block';
            
            GameState.player.entities.forEach(ent => ent.element.classList.remove('selected'));
            GameState.selectedEntities = [];
        });

        document.getElementById('menu-btn').addEventListener('click', () => {
            document.getElementById('pause-menu').classList.remove('hidden');
            GameState.isRunning = false; // Pausa
        });

        document.getElementById('resume-btn').addEventListener('click', () => {
            document.getElementById('pause-menu').classList.add('hidden');
            GameState.isRunning = true;
        });

        document.getElementById('quit-btn').addEventListener('click', () => {
            document.getElementById('pause-menu').classList.add('hidden');
            UI.showScreen('home-screen');
            // Qui andrebbe resettato lo stato del gioco
        });

        // Tabs del deck
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                UI.renderCards(tab.dataset.tab);
            });
        });
    },

    showScreen: function(screenId) {
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.add('hidden');
            s.classList.remove('active');
        });
        const target = document.getElementById(screenId);
        target.classList.remove('hidden');
        // Breve timeout per l'animazione css
        setTimeout(() => target.classList.add('active'), 50);
    },

    updateHUD: function() {
        document.getElementById('coin-count').innerText = Math.floor(GameState.player.coins);
        document.getElementById('food-count').innerText = Math.floor(GameState.player.food);
        document.getElementById('meds-count').innerText = GameState.player.meds;
        document.getElementById('troop-count').innerText = `${GameState.player.troopsCount}/${GameState.player.troopsMax}`;
        
        if(GameState.phase === 'playing') {
            document.getElementById('deployment-controls').style.display = 'none';
            document.getElementById('game-info-timer').style.display = 'block';
        } else {
            document.getElementById('deployment-controls').style.display = 'flex';
            document.getElementById('game-info-timer').style.display = 'none';
        }
    },

    renderCards: function(category) {
        const container = document.getElementById('cards-container');
        container.innerHTML = '';
        const cards = CARDS_DB[category];

        cards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = `card ${GameState.player.coins < card.cost ? 'disabled' : ''}`;
            
            let statsHtml = '';
            if(card.type === 'strutture') {
                statsHtml = `
                    <span class="stat stat-hp" title="Salute">❤️ ${card.hp}</span>
                    <span class="stat" title="Effetto">⚡ +${card.effect}</span>
                `;
            } else {
                statsHtml = `
                    <span class="stat stat-atk" title="Attacco">⚔️ ${card.atk}</span>
                    <span class="stat stat-def" title="Difesa">🛡️ ${card.def}</span>
                    <span class="stat stat-hp" title="Salute">❤️ ${card.hp}</span>
                `;
            }

            cardEl.innerHTML = `
                <div class="card-cost">${card.cost} 💰</div>
                <div class="card-icon">${card.icon}</div>
                <div class="card-name">${card.name}</div>
                <div class="card-stats">
                    ${statsHtml}
                </div>
            `;

            if (GameState.player.coins >= card.cost) {
                // Rendi draggabile
                const isStructure = card.type === 'strutture';

                if(isStructure) {
                    cardEl.draggable = true;
                    cardEl.addEventListener('dragstart', (e) => {
                        GameState.draggedCard = card;
                        cardEl.style.opacity = '0.5';
                    });
                    cardEl.addEventListener('dragend', () => {
                        GameState.draggedCard = null;
                        cardEl.style.opacity = '1';
                    });
                    
                    // Opzione click mantenuta
                    cardEl.addEventListener('dblclick', () => {
                        alert("Trascina la carta Struttura sulla mappa per schierarla!");
                    });
                } else {
                    cardEl.draggable = false; // Solo le strutture si trascinano
                    cardEl.addEventListener('click', () => {
                        if(GameState.phase === 'playing' || GameState.phase === 'deployment') {
                            GameEngine.buyAndDeployFixed(card, 'player');
                        }
                    });
                }
            }

            container.appendChild(cardEl);
        });
    }
};
