// js/main.js
import * as audio from './audio.js';
import * as shader from './modules/shader.js';
import * as ui from './modules/ui.js';
import * as input from './modules/input.js';
import * as cardGenerator from './modules/card_generator.js';
import { initTutorial, showTutorial } from './modules/intro.js';

// --- Global State ---
const gl = document.getElementById('glslCanvas').getContext('webgl');
let shaderInfo;
let positionBuffer;

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
    isPaused: true,
    isAccessibilityMode: localStorage.getItem('rgbaAccessibility') === 'true'
};

// --- Game Logic ---
function applyCardEffects(cardIndex) {
    const card = gameState.cards[cardIndex];
    card.effects.forEach(effect => {
        switch (effect.type) {
            case 'coeff': gameState.coefficients[effect.variable] = Math.max(0, Math.min(1, gameState.coefficients[effect.variable] + effect.change)); break;
            case 'min': gameState.constraints[effect.variable + 'Min'] = Math.max(0, gameState.constraints[effect.variable + 'Min'] + effect.change); break;
            case 'max': gameState.constraints[effect.variable + 'Max'] = Math.min(255, gameState.constraints[effect.variable + 'Max'] + effect.change); break;
            case 'abstraction': gameState.abstraction += effect.change; break;
        }
    });
}

function generateNewProblem() {
    gameState.cards = cardGenerator.generateCards(gameState.abstraction);
    gameState.currentRGB = {
        r: Math.random()*(gameState.constraints.rMax-gameState.constraints.rMin)+gameState.constraints.rMin,
        g: Math.random()*(gameState.constraints.gMax-gameState.constraints.gMin)+gameState.constraints.gMin,
        b: Math.random()*(gameState.constraints.bMax-gameState.constraints.bMin)+gameState.constraints.bMin
    };
    Object.keys(gameState.currentRGB).forEach(k => gameState.currentRGB[k] = Math.round(gameState.currentRGB[k] * 10) / 10);
    ui.updateCardsDisplay(gameState.cards);
    ui.updateDisplays(gameState);
}

// --- Input Handlers ---
const handlers = {
    onNumberInput: (number) => {
        if (gameState.isPaused || isNaN(number)) return;
        audio.playTone(440 + number * 20, 0.1, 'triangle');
        const cardIndex = gameState.cards.findIndex(card => card.answer === number);
        const value = ui.getUIElements().currentValue.textContent;

        if (cardIndex !== -1) {
            audio.playTone(1200, 0.2, 'sine');
            gameState.score += parseFloat(value);
            gameState.problemsSolved++;
            applyCardEffects(cardIndex);
            generateNewProblem();
        } else {
            audio.playTone(150, 0.3, 'sawtooth');
            gameState.score -= parseFloat(value) / 2;
            if (gameState.score < 0) gameState.score = 0;
        }
        if (gameState.score > gameState.bestScore) {
            gameState.bestScore = gameState.score;
            localStorage.setItem('rgbaBestScore', gameState.bestScore.toString());
        }
        ui.updateDisplays(gameState);
    },
    onMenuClick: () => {
        gameState.isPaused = true;
        ui.updateStats(gameState);
        ui.getUIElements().settingsOverlay.style.display = 'flex';
    },
    onCloseSettingsClick: () => {
        gameState.isPaused = false;
        ui.getUIElements().settingsOverlay.style.display = 'none';
    },
    onAccessibilityToggle: (isEnabled) => {
        gameState.isAccessibilityMode = isEnabled;
        localStorage.setItem('rgbaAccessibility', isEnabled);
        document.body.classList.toggle('accessibility-mode', isEnabled);
    },
    onStartClick: async () => {
        audio.initAudio();
        audio.playBackgroundMusic();
        const startOverlay = ui.getUIElements().startOverlay;
        startOverlay.style.opacity = '0';
        setTimeout(() => {
            startOverlay.style.display = 'none';
            if (localStorage.getItem('rgbaHasPlayed') !== 'true') {
                showTutorial();
                localStorage.setItem('rgbaHasPlayed', 'true');
            }
            gameState.isPaused = false;
        }, 500);
    },
    isPaused: () => gameState.isPaused
};

// --- Render Loop ---
let lastTime = 0, shaderTime = 0;
function render(time) {
    if (!gameState.isPaused) {
        shaderTime += (time - lastTime) * 0.001;
    }
    lastTime = time;

    if (gl && shaderInfo && !gameState.isAccessibilityMode && gl.canvas.width > 0) {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(shaderInfo.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(shaderInfo.attribLocations.position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderInfo.attribLocations.position);
        gl.uniform2f(shaderInfo.uniformLocations.resolution, gl.canvas.width, gl.canvas.height);
        gl.uniform1f(shaderInfo.uniformLocations.time, shaderTime);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    requestAnimationFrame(render);
}

function resizeCanvas() {
    const canvas = gl.canvas;
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    }
}

// --- Initialization ---
async function init() {
    if (!gl) { console.error("WebGL not supported, cannot initialize."); return; }
    
    const shaderList = await (await fetch('shaderlist.json')).json();
    shaderInfo = await shader.initShaderProgram(gl, shaderList[0].path);
    if (!shaderInfo) return;
    
    positionBuffer = shader.initPositionBuffer(gl);
    
    input.setupEventListeners(handlers);
    initTutorial();
    
    handlers.onAccessibilityToggle(gameState.isAccessibilityMode);
    generateNewProblem();
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    requestAnimationFrame(render);
}

init();
