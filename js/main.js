import { initAudio, playBackgroundMusic, playTone } from './audio.js';

// --- NEW: Audio State ---
let isAudioInitialized = false;

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
    isPaused: true, // Start paused until user clicks
    isAccessibilityMode: localStorage.getItem('rgbaAccessibility') === 'true'
};

// --- Game Logic ---

/**
 * FIX 4: Refactored card effect generation for better game balance.
 * Each card has an effect "budget" between -2 and +2. Abstraction costs -5.
 * The function tries to create a set of effects that roughly match the budget.
 */
function generateCardEffect() {
    let budget = (Math.random() * 4) - 2; // Random budget from -2 to +2
    const effects = [];
    const effectCosts = {
        abstraction: -5,
        coeff: 1, // Per percent change
        min: 2,   // Per unit change
        max: 2    // Per unit change
    };

    // 20% chance to generate an abstraction card
    if (Math.random() < 0.20) {
        effects.push({ type: 'abstraction', change: 1, display: `+1 Abstraction` });
        budget -= effectCosts.abstraction;
    }

    // Spend the remaining budget on other effects
    while (budget > 1 || budget < -1) {
        if (effects.length >= 2) break; // Max 2 effects for simplicity

        const effectType = budget > 0 ? ['coeff', 'min', 'max'] : ['coeff'];
        const chosenType = effectType[Math.floor(Math.random() * effectType.length)];
        const variable = ['r', 'g', 'b'][Math.floor(Math.random() * 3)];
        
        let change, display, cost;
        const sign = budget > 0 ? 1 : -1;

        switch (chosenType) {
            case 'coeff':
                change = sign * (Math.random() * 0.04 + 0.01); // 1-5% change
                cost = change * 100 * effectCosts.coeff;
                display = `${change > 0 ? '+' : ''}${Math.round(change*100)}% ${variable.toUpperCase()} Coeff`;
                effects.push({ type: 'coeff', variable, change, display });
                break;
            case 'min':
            case 'max':
                change = sign * (Math.random() * 1.5 + 0.5); // 0.5-2.0 change
                cost = change * effectCosts[chosenType];
                display = `${change > 0 ? '+' : ''}${change.toFixed(1)} ${variable.toUpperCase()} ${chosenType.charAt(0).toUpperCase() + chosenType.slice(1)}`;
                effects.push({ type: chosenType, variable, change, display });
                break;
        }
        budget -= cost;
    }
    return effects;
}


function generateEquationForAnswer(answer, abstraction) {
    if (answer === 1) {
        const a = Math.floor(Math.random() * 8) + 2;
        return abstraction < 2 ? `${a} - ${a - 1}` : `${a} ÷ ${a}`;
    }
    if (abstraction < 2) {
        return Math.random()>0.5 ? `${Math.floor(Math.random()*(answer-1))+1} + ${answer-(Math.floor(Math.random()*(answer-1))+1)}` : `${answer+Math.floor(Math.random()*5)+1} - ${answer+Math.floor(Math.random()*5)+1-answer}`;
    }
    if (abstraction < 4) {
        const factors=[];for(let i=2;i<=Math.sqrt(answer);i++){if(answer%i===0)factors.push(i);}
        return factors.length>0?`${answer/factors[Math.floor(Math.random()*factors.length)]} × ${factors[Math.floor(Math.random()*factors.length)]}`:generateEquationForAnswer(answer,1);
    }
    if (abstraction < 6) {
        return Math.random()>0.5?`${answer*(Math.floor(Math.random()*4)+2)} ÷ ${Math.floor(Math.random()*4)+2}`:generateEquationForAnswer(answer,3);
    }
    const a=Math.floor(Math.random()*(answer-2))+1;
    return`(${generateEquationForAnswer(a,abstraction-3).replace(/×/g,'*').replace(/÷/g,'/')}) + ${answer-a}`;
}

function generateCards() {
    let answers=[1,2,3,4,5,6,7,8,9];
    for(let i=answers.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[answers[i],answers[j]]=[answers[j],answers[i]];}
    gameState.cards=[];
    for(let i=0;i<3;i++){const answer=answers.pop();gameState.cards.push({equation:generateEquationForAnswer(answer,gameState.abstraction),answer,effects:generateCardEffect()});}
    updateCardsDisplay();
}

function applyCardEffects(cardIndex){const card=gameState.cards[cardIndex];card.effects.forEach(effect=>{switch(effect.type){case'coeff':gameState.coefficients[effect.variable]=Math.max(0,Math.min(1,gameState.coefficients[effect.variable]+effect.change));break;case'min':gameState.constraints[effect.variable+'Min']=Math.max(0,gameState.constraints[effect.variable+'Min']+effect.change);break;case'max':gameState.constraints[effect.variable+'Max']=Math.min(255,gameState.constraints[effect.variable+'Max']+effect.change);break;case'abstraction':gameState.abstraction+=effect.change;break;}});}
function generateRGB(){const r=Math.random()*(gameState.constraints.rMax-gameState.constraints.rMin)+gameState.constraints.rMin,g=Math.random()*(gameState.constraints.gMax-gameState.constraints.gMin)+gameState.constraints.gMin,b=Math.random()*(gameState.constraints.bMax-gameState.constraints.bMin)+gameState.constraints.bMin;return{r:Math.round(r*10)/10,g:Math.round(g*10)/10,b:Math.round(b*10)/10};}
function calculateValue(rgb=gameState.currentRGB){return gameState.coefficients.r*rgb.r+gameState.coefficients.g*rgb.g+gameState.coefficients.b*rgb.b;}

// --- UI & Display ---
function updateDisplays(){document.getElementById('score').textContent=Math.round(gameState.score);const elapsed=Date.now()-gameState.startTime,minutes=Math.floor(elapsed/60000),seconds=Math.floor(elapsed%60000/1000);document.getElementById('time').textContent=`${minutes}:${seconds.toString().padStart(2,'0')}`;let rank='APPRENTICE';if(gameState.score>=10000)rank='GRANDMASTER';else if(gameState.score>=5000)rank='EXPERT';else if(gameState.score>=2000)rank='JOURNEYMAN';else if(gameState.score>=500)rank='ADEPT';document.getElementById('rank').textContent=rank;document.getElementById('rCoeff').textContent=gameState.coefficients.r.toFixed(2);document.getElementById('gCoeff').textContent=gameState.coefficients.g.toFixed(2);document.getElementById('bCoeff').textContent=gameState.coefficients.b.toFixed(2);document.getElementById('rMin').textContent=gameState.constraints.rMin.toFixed(1);document.getElementById('rMax').textContent=gameState.constraints.rMax.toFixed(1);document.getElementById('gMin').textContent=gameState.constraints.gMin.toFixed(1);document.getElementById('gMax').textContent=gameState.constraints.gMax.toFixed(1);document.getElementById('bMin').textContent=gameState.constraints.bMin.toFixed(1);document.getElementById('bMax').textContent=gameState.constraints.bMax.toFixed(1);document.getElementById('aVal').textContent=gameState.abstraction;document.getElementById('currentR').textContent=gameState.currentRGB.r;document.getElementById('currentG').textContent=gameState.currentRGB.g;document.getElementById('currentB').textContent=gameState.currentRGB.b;document.getElementById('currentValue').textContent=calculateValue().toFixed(2);const rgb=gameState.currentRGB,borderColor=`rgb(${Math.round(rgb.r*12)}, ${Math.round(rgb.g*12)}, ${Math.round(rgb.b*12)})`;document.querySelectorAll('.numpad-btn').forEach(btn=>btn.style.borderColor=borderColor);}
function updateCardsDisplay(){gameState.cards.forEach((card,i)=>{document.getElementById(`equation${i}`).textContent=card.equation.replace(/\*/g,'×').replace(/\//g,'÷');document.getElementById(`effects${i}`).innerHTML=card.effects.map(e=>e.display).join('<br>');});}

function handleNumberInput(number) {
    if (gameState.isPaused || isNaN(number)) return;
    playTone(440 + number * 20, 0.1, 'triangle'); // Numpad feedback tone
    const correctCardIndex = gameState.cards.findIndex(card => card.answer === number);
    const currentValue = calculateValue();
    if (correctCardIndex !== -1) {
        playTone(1200, 0.2, 'sine'); // Correct answer sound
        gameState.score += currentValue;
        gameState.problemsSolved++;
        applyCardEffects(correctCardIndex);
        generateCards();
    } else {
        playTone(150, 0.3, 'sawtooth'); // Incorrect answer sound
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
    document.getElementById('menuBtn').addEventListener('click',()=>{gameState.isPaused=true;document.getElementById('settingsOverlay').style.display='flex';document.getElementById('statProblems').textContent=gameState.problemsSolved;const elapsed=Date.now()-gameState.startTime,minutes=Math.floor(elapsed/60000),seconds=Math.floor(elapsed%60000/1000);document.getElementById('statTime').textContent=`${minutes}:${seconds.toString().padStart(2,'0')}`;document.getElementById('statBest').textContent=Math.round(gameState.bestScore);document.getElementById('statRank').textContent=document.getElementById('rank').textContent;});
    document.getElementById('closeSettings').addEventListener('click',()=>{gameState.isPaused=false;document.getElementById('settingsOverlay').style.display='none';});
    document.querySelectorAll('.numpad-btn').forEach(btn=>{btn.addEventListener('click',()=>handleNumberInput(parseInt(btn.dataset.num)));});
    window.addEventListener('keydown',e=>{if([' ','ArrowUp','ArrowDown'].includes(e.key))e.preventDefault();if(gameState.isPaused){if(e.key==='Escape')document.getElementById('closeSettings').click();return}if(e.key>='1'&&e.key<='9'){const number=parseInt(e.key);handleNumberInput(number);const btn=document.querySelector(`[data-num="${number}"]`);if(btn){btn.style.transform='scale(0.92)';setTimeout(()=>btn.style.transform='scale(1)',100);}}else if(['Escape','m','M'].includes(e.key)){document.getElementById('menuBtn').click();}});
    document.getElementById('accessibilityCheckbox').addEventListener('change',(e)=>setAccessibilityMode(e.target.checked));
    
    // Audio Initialization Listener
    document.getElementById('startOverlay').addEventListener('click', () => {
        if (isAudioInitialized) return;
        initAudio();
        playBackgroundMusic();
        isAudioInitialized = true;
        document.getElementById('startOverlay').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('startOverlay').style.display = 'none';
            gameState.isPaused = false; // Unpause the game
        }, 500);
    }, { once: true });
}

function setAccessibilityMode(isEnabled){gameState.isAccessibilityMode=isEnabled;localStorage.setItem('rgbaAccessibility',isEnabled);document.body.classList.toggle('accessibility-mode',isEnabled);document.getElementById('accessibilityCheckbox').checked=isEnabled;}
function resizeCanvas(){const container=document.getElementById('gameContainer'),rect=container.getBoundingClientRect();if(rect.width>0&&rect.height>0){canvas.width=rect.width;canvas.height=rect.height;if(gl)gl.viewport(0,0,gl.canvas.width,gl.canvas.height);}}

function init(){setupEventListeners();window.addEventListener('resize',resizeCanvas);resizeCanvas();setAccessibilityMode(gameState.isAccessibilityMode);gameState.currentRGB=generateRGB();generateCards();updateDisplays();requestAnimationFrame(render);}

// --- Render Loop ---
let shaderTime=0,lastTime=0;
function render(time){if(!gameState.isPaused){const deltaTime=lastTime>0?(time-lastTime)*.001:0;shaderTime+=deltaTime;}lastTime=time;if(gl&&program&&!gameState.isAccessibilityMode){if(gl.canvas.width>0&&gl.canvas.height>0){gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);gl.uniform2f(resolutionUniformLocation,gl.canvas.width,gl.canvas.height);gl.uniform1f(timeUniformLocation,shaderTime);gl.drawArrays(gl.TRIANGLES,0,6);}}requestAnimationFrame(render);}

// Start the game
init();
