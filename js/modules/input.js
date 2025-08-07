// js/modules/input.js
import { getUIElements } from './ui.js';
import { showTutorial } from './intro.js';

export function setupEventListeners(handlers) {
    const ui = getUIElements();

    ui.menuBtn.addEventListener('click', handlers.onMenuClick);
    ui.closeSettings.addEventListener('click', handlers.onCloseSettingsClick);
    ui.numpadBtns.forEach(btn => btn.addEventListener('click', () => handlers.onNumberInput(parseInt(btn.dataset.num))));
    ui.accessibilityCheckbox.addEventListener('change', (e) => handlers.onAccessibilityToggle(e.target.checked));
    
    ui.startOverlay.addEventListener('click', handlers.onStartClick, { once: true });

    window.addEventListener('keydown', e => {
        if ([' ', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
        
        if (handlers.isPaused()) {
            if (e.key === 'Escape') handlers.onCloseSettingsClick();
            return;
        }

        if (e.key >= '1' && e.key <= '9') {
            const number = parseInt(e.key);
            handlers.onNumberInput(number);
            const btn = document.querySelector(`[data-num="${number}"]`);
            if (btn) {
                btn.style.transform = 'scale(0.92)';
                setTimeout(() => btn.style.transform = 'scale(1)', 100);
            }
        } else if (['Escape', 'm', 'M'].includes(e.key)) {
            handlers.onMenuClick();
        }
    });
}
