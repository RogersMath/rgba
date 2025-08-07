// js/modules/ui.js

export function getUIElements() {
    const ids = ['score', 'time', 'rank', 'rCoeff', 'gCoeff', 'bCoeff', 'rMin', 'rMax', 'gMin', 'gMax', 'bMin', 'bMax', 'aVal', 'currentR', 'currentG', 'currentB', 'currentValue', 'statProblems', 'statTime', 'statBest', 'statRank', 'menuBtn', 'settingsOverlay', 'closeSettings', 'accessibilityCheckbox', 'startOverlay', 'tutorialOverlay', 'tutorialContent', 'tutorialTitle', 'tutorialText', 'tutorialNav', 'tutorialPrev', 'tutorialNext', 'tutorialBtn'];
    const elements = {};
    ids.forEach(id => elements[id] = document.getElementById(id));
    elements.numpadBtns = document.querySelectorAll('.numpad-btn');
    elements.cards = document.querySelectorAll('.card');
    return elements;
}

const ui = getUIElements();

export function updateDisplays(state) {
    ui.score.textContent = Math.round(state.score);
    const elapsed = Date.now() - state.startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    ui.time.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    let rank = 'APPRENTICE';
    if (state.score >= 10000) rank = 'GRANDMASTER';
    else if (state.score >= 5000) rank = 'EXPERT';
    else if (state.score >= 2000) rank = 'JOURNEYMAN';
    else if (state.score >= 500) rank = 'ADEPT';
    ui.rank.textContent = rank;
    ui.rCoeff.textContent = state.coefficients.r.toFixed(2);
    ui.gCoeff.textContent = state.coefficients.g.toFixed(2);
    ui.bCoeff.textContent = state.coefficients.b.toFixed(2);
    ui.rMin.textContent = state.constraints.rMin.toFixed(1);
    ui.rMax.textContent = state.constraints.rMax.toFixed(1);
    ui.gMin.textContent = state.constraints.gMin.toFixed(1);
    ui.gMax.textContent = state.constraints.gMax.toFixed(1);
    ui.bMin.textContent = state.constraints.bMin.toFixed(1);
    ui.bMax.textContent = state.constraints.bMax.toFixed(1);
    ui.aVal.textContent = state.abstraction;
    ui.currentR.textContent = state.currentRGB.r;
    ui.currentG.textContent = state.currentRGB.g;
    ui.currentB.textContent = state.currentRGB.b;
    ui.currentValue.textContent = (state.coefficients.r * state.currentRGB.r + state.coefficients.g * state.currentRGB.g + state.coefficients.b * state.currentRGB.b).toFixed(2);
    const borderColor = `rgb(${Math.round(state.currentRGB.r * 12)}, ${Math.round(state.currentRGB.g * 12)}, ${Math.round(state.currentRGB.b * 12)})`;
    ui.numpadBtns.forEach(btn => btn.style.borderColor = borderColor);
}

export function updateCardsDisplay(cards) {
    cards.forEach((card, i) => {
        document.getElementById(`equation${i}`).textContent = card.equation.replace(/\*/g, '×').replace(/\//g, '÷');
        document.getElementById(`effects${i}`).innerHTML = card.effects.map(e => e.display).join('<br>');
    });
}

export function updateStats(state) {
    ui.statProblems.textContent = state.problemsSolved;
    const elapsed = Date.now() - state.startTime;
    ui.statTime.textContent = `${Math.floor(elapsed / 60000)}:${Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0')}`;
    ui.statBest.textContent = Math.round(state.bestScore);
    ui.statRank.textContent = ui.rank.textContent;
}
