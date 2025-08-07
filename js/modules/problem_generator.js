// js/modules/problem_generator.js

export function generateEquationForAnswer(answer, abstraction) {
    if (answer === 1) {
        const a = Math.floor(Math.random() * 8) + 2;
        return abstraction < 2 ? `${a} - ${a - 1}` : `${a} ÷ ${a}`;
    }
    if (abstraction < 2) {
        const a = Math.floor(Math.random() * (answer - 1)) + 1;
        return Math.random() > 0.5 ? `${a} + ${answer - a}` : `${answer + a} - ${a}`;
    }
    if (abstraction < 4) {
        const factors = [];
        for (let i = 2; i <= Math.sqrt(answer); i++) {
            if (answer % i === 0) factors.push(i);
        }
        if (factors.length > 0) {
            const factor = factors[Math.floor(Math.random() * factors.length)];
            return `${answer / factor} × ${factor}`;
        }
        return generateEquationForAnswer(answer, 1);
    }
    if (abstraction < 6) {
        const multiplier = Math.floor(Math.random() * 4) + 2;
        return Math.random() > 0.5 ? `${answer * multiplier} ÷ ${multiplier}` : generateEquationForAnswer(answer, 3);
    }
    const a = Math.floor(Math.random() * (answer - 2)) + 1;
    const b = answer - a;
    const subEq = generateEquationForAnswer(a, abstraction - 3).replace(/×/g, '*').replace(/÷/g, '/');
    return `(${subEq}) + ${b}`;
}
