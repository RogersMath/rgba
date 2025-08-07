// --- Game State ---
let gameState = {
    score: 0,
    startTime: Date.now(),
    coefficients: { r: 0.33, g: 0.33, b: 0.33 },
    constraints: { rMin: 3.5, rMax: 20.5, gMin: 3.5, gMax: 20.5, bMin: 3.5, bMax: 20.5 },
    abstraction: 0,
    currentRGB: { r: 12, g: 15, b: 8 },
    cards: [],
    problemsSolved: 0,
    bestScore: parseInt(localStorage.getItem('rgbaBestScore') || '0'),
    isPaused: false,
    isAccessibilityMode: localStorage.getItem('rgbaAccessibility') === 'true'
};

// --- Game Logic Functions ---

/**
 * Generates a math equation for a given answer, with complexity based on the abstraction level.
 * FIX: This function has been rewritten to be more robust and prevent infinite recursion.
 * @param {number} answer The target answer (1-9).
 * @param {number} abstraction The current difficulty level.
 * @returns {string} A string representation of the math problem.
 */
function generateEquationForAnswer(answer, abstraction) {
    // Base case: Handle answer = 1 uniquely, as it's tricky for some operations.
    if (answer === 1) {
        if (abstraction < 2) {
            const a = Math.floor(Math.random() * 8) + 2; // e.g., 2-9
            return `${a} - ${a - 1}`; // e.g., "5 - 4"
        }
        // For higher abstractions, a division is a good option.
        const a = Math.floor(Math.random() * 8) + 2; // e.g., 2-9
        return `${a} ÷ ${a}`;
    }

    // Level 0-1: Simple Addition/Subtraction
    if (abstraction < 2) {
        if (Math.random() > 0.5) { // Addition
            const a = Math.floor(Math.random() * (answer - 1)) + 1;
            return `${a} + ${answer - a}`;
        } else { // Subtraction
            const a = answer + Math.floor(Math.random() * 5) + 1;
            return `${a} - ${a - answer}`;
        }
    }

    // Level 2-3: Add Multiplication if the number is not prime
    if (abstraction < 4) {
        const factors = [];
        for (let i = 2; i <= Math.sqrt(answer); i++) {
            if (answer % i === 0) factors.push(i);
        }
        if (factors.length > 0) {
            const factor = factors[Math.floor(Math.random() * factors.length)];
            return `${answer / factor} × ${factor}`;
        }
        // Fallback to a simpler level if no factors are found
        return generateEquationForAnswer(answer, 1);
    }

    // Level 4-5: Add Division
    if (abstraction < 6) {
        if (Math.random() > 0.5) { // Division
            const multiplier = Math.floor(Math.random() * 4) + 2; // 2, 3, 4, 5
            return `${answer * multiplier} ÷ ${multiplier}`;
        }
        // Fallback
        return generateEquationForAnswer(answer, 3);
    }

    // Level 6+: Multi-step problems with parentheses
    const a = Math.floor(Math.random() * (answer - 2)) + 1; // a is between 1 and answer-2
    const b = answer - a;
    const subEq = generateEquationForAnswer(a, abstraction - 3).replace(/×/g, '*').replace(/÷/g, '/');
    return `(${subEq}) + ${b}`;
}


function generateCards() {
    gameState.cards = [];
    let answers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    // Fisher-Yates shuffle to get unique answers
    for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
    }

    for (let i = 0; i < 3; i++) {
        const answer = answers.pop();
        const equation = generateEquationForAnswer(answer, gameState.abstraction);
        const effects = generateCardEffect();
        gameState.cards.push({ equation, answer, effects });
    }
    updateCardsDisplay();
}

function generateCardEffect() {
    const effects = [];
    if (Math.random() < 0.25) { // 25% chance to be an Abstraction card
         effects.push({ type: 'abstraction', change: 1, display: `+1 Abstraction`});
         return effects;
    }
    
    const variables = ['r', 'g', 'b'];
    const variable = variables[Math.floor(Math.random() * variables.length)];
    const effectType = Math.floor(Math.random() * 3);
    const sign = Math.random() > 0.5 ? 1 : -1;

    if (effectType === 0) { // Coeff
        const change = sign * (Math.random() * 0.05 + 0.02);
        effects.push({ type: 'coeff', variable, change, display: `${change > 0 ? '+' : ''}${Math.round(change*100)}% ${variable.toUpperCase()} Coeff` });
    } else if (effectType === 1) { // Min
        const change = sign * (Math.random() * 2 + 0.5);
        effects.push({ type: 'min', variable, change, display: `${change > 0 ? '+' : ''}${change.toFixed(1)} ${variable.toUpperCase()} Min` });
    } else { // Max
        const change = sign * (Math.random() * 2 + 0.5);
        effects.push({ type: 'max', variable, change, display: `${change > 0 ? '+' : ''}${change.toFixed(1)} ${variable.toUpperCase()} Max` });
    }
    return effects;
}

function applyCardEffects(cardIndex) {
    const card = gameState.cards[cardIndex];
    card.effects.forEach(effect => {
        switch (effect.type) {
            case 'coeff':
                gameState.coefficients[effect.variable] = Math.max(0, Math.min(1, gameState.coefficients[effect.variable] + effect.change));
                break;
            case 'min':
                gameState.constraints[effect.variable + 'Min'] = Math.max(0, gameState.constraints[effect.variable + 'Min'] + effect.change);
                break;
            case 'max':
                gameState.constraints[effect.variable + 'Max'] = Math.min(255, gameState.constraints[effect.variable + 'Max'] + effect.change);
                break;
            case 'abstraction':
                gameState.abstraction += effect.change;
                break;
        }
    });
}

function generateRGB() {
    const r = Math.random() * (gameState.constraints.rMax - gameState.constraints.rMin) + gameState.constraints.rMin;
    const g = Math.random() * (gameState.constraints.gMax - gameState.constraints.gMin) + gameState.constraints.gMin;
    const b = Math.random() * (gameState.constraints.bMax - gameState.constraints.bMin) + gameState.constraints.bMin;
    return { r: Math.round(r * 10) / 10, g: Math.round(g * 10) / 10, b: Math.round(b * 10) / 10 };
}

function calculateValue(rgb = gameState.currentRGB) {
    return gameState.coefficients.r * rgb.r + gameState.coefficients.g * rgb.g + gameState.coefficients.b * rgb.b;
}

// --- UI Update and Event Handling ---
function updateDisplays() {
    document.getElementById('score').textContent = Math.round(gameState.score);
    const elapsed = Date.now() - gameState.startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    document.getElementById('time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    let rank = 'APPRENTICE';
    if (gameState.score >= 10000) rank = 'GRANDMASTER';
    else if (gameState.score >= 5000) rank = 'EXPERT';
    else if (gameState.score >= 2000) rank = 'JOURNEYMAN';
    else if (gameState.score >= 500) rank = 'ADEPT';
    document.getElementById('rank').textContent = rank;
    document.getElementById('rCoeff').textContent=gameState.coefficients.r.toFixed(2);
    document.getElementById('gCoeff').textContent=gameState.coefficients.g.toFixed(2);
    document.getElementById('bCoeff').textContent=gameState.coefficients.b.toFixed(2);
    document.getElementById('rMin').textContent = gameState.constraints.rMin.toFixed(1);
    document.getElementById('rMax').textContent = gameState.constraints.rMax.toFixed(1);
    document.getElementById('gMin').textContent = gameState.constraints.gMin.toFixed(1);
    document.getElementById('gMax').textContent = gameState.constraints.gMax.toFixed(1);
    document.getElementById('bMin').textContent = gameState.constraints.bMin.toFixed(1);
    document.getElementById('bMax').textContent = gameState.constraints.bMax.toFixed(1);
    document.getElementById('aVal').textContent = gameState.abstraction;
    document.getElementById('currentR').textContent = gameState.currentRGB.r;
    document.getElementById('currentG').textContent = gameState.currentRGB.g;
    document.getElementById('currentB').textContent = gameState.currentRGB.b;
    document.getElementById('currentValue').textContent = calculateValue().toFixed(2);
    const rgb = gameState.currentRGB;
    const borderColor = `rgb(${Math.round(rgb.r * 12)}, ${Math.round(rgb.g * 12)}, ${Math.round(rgb.b * 12)})`;
    document.querySelectorAll('.numpad-btn').forEach(btn => btn.style.borderColor = borderColor);
}

function updateCardsDisplay() {
    gameState.cards.forEach((card, i) => {
        document.getElementById(`equation${i}`).textContent = card.equation.replace(/\*/g, '×').replace(/\//g, '÷');
        document.getElementById(`effects${i}`).innerHTML = card.effects.map(e => e.display).join('<br>');
    });
}

function handleNumberInput(number) {
    if (gameState.isPaused || isNaN(number)) return;
    const correctCardIndex = gameState.cards.findIndex(card => card.answer === number);
    const currentValue = calculateValue();
    if (correctCardIndex !== -1) {
        gameState.score += currentValue;
        gameState.problemsSolved++;
        applyCardEffects(correctCardIndex);
        generateCards();
    } else {
        gameState.score -= currentValue / 2;
        if (gameState.score < 0) gameState.score = 0;
    }
    gameState.currentRGB = generateRGB();
    if (gameState.score > gameState.bestScore) {
        gameState.bestScore = gameState.score;
        localStorage.setItem('rgbaBestScore', gameState.bestScore.toString());
    }
    updateDisplays();
    if (gameState.score >= 10000) alert('Victory! You reached 10,000 points!');
}

// --- Event Listeners & Initialization ---
function setupEventListeners() {
    document.getElementById('menuBtn').addEventListener('click', () => {
        gameState.isPaused = true;
        document.getElementById('settingsOverlay').style.display = 'flex';
        document.getElementById('statProblems').textContent = gameState.problemsSolved;
        const elapsed = Date.now() - gameState.startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        document.getElementById('statTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('statBest').textContent = Math.round(gameState.bestScore);
        document.getElementById('statRank').textContent = document.getElementById('rank').textContent;
    });

    document.getElementById('closeSettings').addEventListener('click', () => {
        gameState.isPaused = false;
        document.getElementById('settingsOverlay').style.display = 'none';
    });

    document.querySelectorAll('.numpad-btn').forEach(btn => {
        btn.addEventListener('click', () => handleNumberInput(parseInt(btn.dataset.num)));
    });

    document.querySelectorAll('.card').forEach((card, i) => {
        card.addEventListener('click', () => {
            if (gameState.isPaused) return;
            handleNumberInput(gameState.cards[i].answer);
        });
    });

    window.addEventListener('keydown', e => {
        if ([' ', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
        if (gameState.isPaused) {
            if (e.key === 'Escape') document.getElementById('closeSettings').click();
            return;
        }
        if (e.key >= '1' && e.key <= '9') {
            const number = parseInt(e.key);
            handleNumberInput(number);
            const btn = document.querySelector(`[data-num="${number}"]`);
            if (btn) {
                btn.style.transform = 'scale(0.92)';
                setTimeout(() => btn.style.transform = 'scale(1)', 100);
            }
        } else if (['Escape', 'm', 'M'].includes(e.key)) {
            document.getElementById('menuBtn').click();
        }
    });

    const accessibilityCheckbox = document.getElementById('accessibilityCheckbox');
    accessibilityCheckbox.addEventListener('change', (e) => setAccessibilityMode(e.target.checked));
}

function setAccessibilityMode(isEnabled) {
    gameState.isAccessibilityMode = isEnabled;
    localStorage.setItem('rgbaAccessibility', isEnabled);
    document.body.classList.toggle('accessibility-mode', isEnabled);
    document.getElementById('accessibilityCheckbox').checked = isEnabled;
}

function init() {
    setupEventListeners();
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    setAccessibilityMode(gameState.isAccessibilityMode);
    gameState.currentRGB = generateRGB();
    generateCards();
    updateDisplays();
    requestAnimationFrame(render);
}

// --- Render Loop ---
let shaderTime = 0, lastTime = 0;
function render(time) {
    if (!gameState.isPaused) {
        const deltaTime = lastTime > 0 ? (time - lastTime) * 0.001 : 0;
        shaderTime += deltaTime;
    }
    lastTime = time;

    // These variables are defined globally in index.html's inline script
    if (typeof gl !== 'undefined' && gl && program && !gameState.isAccessibilityMode) {
        if (gl.canvas.width > 0 && gl.canvas.height > 0) {
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(program);
            gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
            gl.uniform1f(timeUniformLocation, shaderTime);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    }
    requestAnimationFrame(render);
}

function resizeCanvas(){
    const container = document.getElementById('gameContainer');
    const rect = container.getBoundingClientRect();
    if(rect.width > 0 && rect.height > 0){
        // These variables are defined in index.html
        if (typeof canvas !== 'undefined' && canvas) {
            canvas.width = rect.width;
            canvas.height = rect.height;
        }
        if(typeof gl !== 'undefined' && gl) {
            gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
        }
    }
}

// Start the game
init();
