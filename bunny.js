document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let startTime;
    let animationFrame;

    const setGlow = (elapsed = 0, moveLights = true) => {
        const phase = (elapsed / 14000) * Math.PI * 2;
        const colorProgress = (1 - Math.cos((elapsed / 12000) * Math.PI * 2)) / 2;
        const channel = (pink, white = 255) => Math.round(pink + (white - pink) * colorProgress);
        const red = channel(232);
        const green = channel(93);
        const blue = channel(158);
        const primaryX = moveLights ? 35 + Math.sin(phase) * 23 : 35;
        const primaryY = moveLights ? 35 + Math.cos(phase * 0.7) * 22 : 35;
        const secondaryX = moveLights ? 65 + Math.sin(phase + Math.PI) * 22 : 65;
        const secondaryY = moveLights ? 65 + Math.cos(phase * 0.7 + Math.PI) * 20 : 65;

        body.style.setProperty('--vault-glow', `rgba(${red}, ${green}, ${blue}, 0.62)`);
        body.style.setProperty('--vault-glow-secondary', `rgba(${red}, ${green}, ${blue}, 0.48)`);
        body.style.setProperty('--vault-glow-x', `${primaryX}%`);
        body.style.setProperty('--vault-glow-y', `${primaryY}%`);
        body.style.setProperty('--vault-glow-secondary-x', `${secondaryX}%`);
        body.style.setProperty('--vault-glow-secondary-y', `${secondaryY}%`);
    };

    const animateGlow = (time) => {
        if (startTime === undefined) {
            startTime = time;
        }

        const elapsed = time - startTime;
        setGlow(elapsed, !reduceMotion.matches);
        animationFrame = requestAnimationFrame(animateGlow);
    };

    const startAnimation = () => {
        if (!animationFrame) {
            startTime = undefined;
            animationFrame = requestAnimationFrame(animateGlow);
        }
    };

    startAnimation();
});
