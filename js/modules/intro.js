// js/modules/intro.js
import { getUIElements } from './ui.js';

const tutorialSteps = [
    {
        title: "The Goal",
        text: "Your goal is to maximize your score. The current value of R, G, and B, calculated by the function at the top, is added to your score when you correctly solve a problem."
    },
    {
        title: "The Cards",
        text: "Each of the three cards has a math problem. The solution to each problem is always a single digit from 1 to 9."
    },
    {
        title: "Solving Problems",
        text: "Use the number keys on your keyboard (1-9) or click the on-screen numpad to submit an answer. You can't click the cards directly."
    },
    {
        title: "Card Effects",
        text: "Solving a card applies its effects. These can change the coefficients in the scoring function or the constraints for R, G, and B. 'A' stands for Abstraction, which makes problems harder."
    },
    {
        title: "Settings & Pausing",
        text: "Press 'M' or the menu icon to pause, change settings like volume, or review this tutorial. Good luck!"
    }
];

let currentStep = 0;
const ui = getUIElements();

function updateTutorialContent() {
    const step = tutorialSteps[currentStep];
    ui.tutorialTitle.textContent = step.title;
    ui.tutorialText.textContent = step.text;
    ui.tutorialPrev.style.visibility = currentStep === 0 ? 'hidden' : 'visible';
    ui.tutorialNext.textContent = currentStep === tutorialSteps.length - 1 ? "Finish" : "Next";
}

function closeTutorial() {
    ui.tutorialOverlay.style.display = 'none';
}

function next() {
    if (currentStep < tutorialSteps.length - 1) {
        currentStep++;
        updateTutorialContent();
    } else {
        closeTutorial();
    }
}

function prev() {
    if (currentStep > 0) {
        currentStep--;
        updateTutorialContent();
    }
}

export function showTutorial() {
    currentStep = 0;
    updateTutorialContent();
    ui.tutorialOverlay.style.display = 'flex';
}

export function initTutorial() {
    ui.tutorialNext.addEventListener('click', next);
    ui.tutorialPrev.addEventListener('click', prev);
    ui.tutorialBtn.addEventListener('click', () => {
        // Hide settings to show tutorial
        ui.settingsOverlay.style.display = 'none';
        showTutorial();
    });
}
