// js/modules/card_generator.js
import { generateEquationForAnswer } from './problem_generator.js';

function generateCardEffect() {
    let budget = (Math.random() * 4) - 2;
    const effects = [];
    const effectCosts = { abstraction: -5, coeff: 1, min: 2, max: 2 };

    if (Math.random() < 0.20) {
        effects.push({ type: 'abstraction', change: 1, display: `+1 Abstraction` });
        budget -= effectCosts.abstraction;
    }

    while (Math.abs(budget) > 1 && effects.length < 2) {
        const effectPool = budget > 0 ? ['coeff', 'min', 'max'] : ['coeff'];
        const type = effectPool[Math.floor(Math.random() * effectPool.length)];
        const variable = ['r', 'g', 'b'][Math.floor(Math.random() * 3)];
        const sign = budget > 0 ? 1 : -1;
        let change, cost, display;

        if (type === 'coeff') {
            change = sign * (Math.random() * 0.04 + 0.01);
            cost = change * 100 * effectCosts.coeff;
            display = `${change > 0 ? '+' : ''}${Math.round(change * 100)}% ${variable.toUpperCase()} Coeff`;
        } else {
            change = sign * (Math.random() * 1.5 + 0.5);
            cost = change * effectCosts[type];
            display = `${change > 0 ? '+' : ''}${change.toFixed(1)} ${variable.toUpperCase()} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        }
        effects.push({ type, variable, change, display });
        budget -= cost;
    }
    return effects;
}

export function generateCards(abstraction) {
    let answers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
    }
    const cards = [];
    for (let i = 0; i < 3; i++) {
        const answer = answers.pop();
        cards.push({
            equation: generateEquationForAnswer(answer, abstraction),
            answer: answer,
            effects: generateCardEffect()
        });
    }
    return cards;
}
