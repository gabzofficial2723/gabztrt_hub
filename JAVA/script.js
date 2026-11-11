document.addEventListener('DOMContentLoaded', () => {
    const fontPicker = document.querySelector('.font-picker');
    const fontPickerToggle = document.querySelector('.font-picker-toggle');
    const fontPickerMenu = document.querySelector('.font-picker-menu');
    const fontPickerStatus = document.querySelector('.font-picker-status');
    const fontOptions = new Map([
        ['pixel', '"Press Start 2P", "Courier New", monospace'],
        ['system', 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'],
        ['arial', 'Arial, Helvetica, sans-serif'],
        ['georgia', 'Georgia, "Times New Roman", serif'],
        ['trebuchet', '"Trebuchet MS", Arial, sans-serif'],
        ['clash', '"Lilita One", sans-serif']
    ]);
    const fontStorageKey = 'gabztrt-site-font';

    const setFont = (fontName, persist = false) => {
        const fontFamily = fontOptions.get(fontName);
        if (!fontFamily) {
            return;
        }

        document.documentElement.dataset.siteFont = fontName;
        document.documentElement.style.setProperty('--site-font-family', fontFamily);
        fontPickerMenu.querySelectorAll('[data-font]').forEach((option) => {
            const isSelected = option.dataset.font === fontName;
            option.setAttribute('aria-checked', String(isSelected));
            const currentLabel = option.querySelector('span');
            if (isSelected && !currentLabel) {
                const marker = document.createElement('span');
                marker.textContent = 'Current';
                option.append(marker);
            } else if (!isSelected && currentLabel) {
                currentLabel.remove();
            }
        });

        if (persist) {
            try {
                localStorage.setItem(fontStorageKey, fontName);
                fontPickerStatus.textContent = '';
            } catch (error) {
                fontPickerStatus.textContent = 'Font changed, but could not be saved for next time.';
                console.error('The selected font could not be saved.', error);
            }
        }
    };

    const closeFontMenu = (restoreFocus = false) => {
        fontPickerMenu.hidden = true;
        fontPickerToggle.setAttribute('aria-expanded', 'false');
        if (restoreFocus) {
            fontPickerToggle.focus();
        }
    };

    try {
        const savedFont = localStorage.getItem(fontStorageKey);
        if (savedFont && fontOptions.has(savedFont)) {
            setFont(savedFont);
        } else {
            setFont('pixel');
        }
    } catch (error) {
        setFont('pixel');
        fontPickerStatus.textContent = 'Font preference storage is unavailable.';
        console.error('The saved font preference could not be read.', error);
    }

    fontPickerToggle.addEventListener('click', () => {
        const isOpen = fontPickerToggle.getAttribute('aria-expanded') === 'true';
        fontPickerMenu.hidden = isOpen;
        fontPickerToggle.setAttribute('aria-expanded', String(!isOpen));
        if (!isOpen) {
            fontPickerMenu.querySelector('[aria-checked="true"]')?.focus();
        }
    });

    fontPickerMenu.addEventListener('click', (event) => {
        const option = event.target.closest('[data-font]');
        if (!option) {
            return;
        }
        setFont(option.dataset.font, true);
        closeFontMenu(true);
    });

    fontPickerMenu.addEventListener('keydown', (event) => {
        const options = [...fontPickerMenu.querySelectorAll('[data-font]')];
        const index = options.indexOf(document.activeElement);
        let nextIndex;
        if (event.key === 'ArrowDown') {
            nextIndex = (index + 1) % options.length;
        } else if (event.key === 'ArrowUp') {
            nextIndex = (index - 1 + options.length) % options.length;
        } else if (event.key === 'Home') {
            nextIndex = 0;
        } else if (event.key === 'End') {
            nextIndex = options.length - 1;
        } else if (event.key === 'Escape') {
            event.preventDefault();
            closeFontMenu(true);
        }

        if (nextIndex !== undefined) {
            event.preventDefault();
            options[nextIndex].focus();
        }
    });

    document.addEventListener('click', (event) => {
        if (!fontPicker.contains(event.target)) {
            closeFontMenu();
        }
    });

    const projectGrid = document.querySelector('.project-grid');
    const projectCardAnimations = new WeakMap();
    let pointerProjectCard;
    let focusProjectCard;

    const animateProjectCardProperty = (card, property, target, duration, pseudoElement = null) => {
        let animations = projectCardAnimations.get(card);
        if (!animations) {
            animations = new Map();
            projectCardAnimations.set(card, animations);
        }

        const current = getComputedStyle(card, pseudoElement)[property];
        animations.get(property)?.cancel();
        const animation = card.animate(
            [{ [property]: current }, { [property]: target }],
            {
                duration,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                fill: 'forwards',
                ...(pseudoElement ? { pseudoElement } : {})
            }
        );
        animations.set(property, animation);
    };

    const setProjectCardHover = (card, isHovered) => {
        if (card.classList.contains('is-hovered') === isHovered) {
            return;
        }

        const duration = prefersReducedMotion ? 360 : 720;
        const scale = isHovered
            ? (prefersReducedMotion ? 'scale(1.015)' : 'scale(1.035)')
            : 'scale(1)';
        animateProjectCardProperty(card, 'transform', scale, duration, '::before');
        animateProjectCardProperty(card, 'boxShadow', isHovered
            ? 'inset 2px 2px 8px rgba(255, 255, 255, 0.82), inset -2px -2px 8px rgba(44, 67, 38, 0.1), 10px 16px 28px rgba(16, 54, 35, 0.3)'
            : 'inset 2px 2px 8px rgba(255, 255, 255, 0.72), inset -2px -2px 8px rgba(44, 67, 38, 0.1), 8px 10px 20px rgba(16, 54, 35, 0.24)',
        duration, '::before');
        card.classList.toggle('is-hovered', isHovered);
    };

    const updateProjectCardHover = () => {
        if (pointerProjectCard && pointerProjectCard !== focusProjectCard) {
            setProjectCardHover(pointerProjectCard, true);
        } else if (focusProjectCard) {
            setProjectCardHover(focusProjectCard, true);
        }

        projectGrid.querySelectorAll('.project-card.is-hovered').forEach((card) => {
            if (card !== pointerProjectCard && card !== focusProjectCard) {
                setProjectCardHover(card, false);
            }
        });
    };

    projectGrid.addEventListener('pointerover', (event) => {
        const card = event.target.closest('.project-card');
        if (card && !card.contains(event.relatedTarget)) {
            pointerProjectCard = card;
            updateProjectCardHover();
        }
    });

    projectGrid.addEventListener('pointerout', (event) => {
        const card = event.target.closest('.project-card');
        if (card && !card.contains(event.relatedTarget)) {
            pointerProjectCard = null;
            updateProjectCardHover();
        }
    });

    projectGrid.addEventListener('focusin', (event) => {
        focusProjectCard = event.target.closest('.project-card');
        updateProjectCardHover();
    });

    projectGrid.addEventListener('focusout', (event) => {
        const nextCard = event.relatedTarget?.closest('.project-card');
        focusProjectCard = nextCard && projectGrid.contains(nextCard) ? nextCard : null;
        updateProjectCardHover();
    });

    // --- 1. Smooth Scrolling with Fixed Header Offset ---
    const navLinks = document.querySelectorAll('.nav-links a');
    const headerHeight = document.querySelector('header').offsetHeight;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let pendingSectionId = null;
    let scrollEndTimer;
    let scrollAnimationFrame;
    let wheelAnimationFrame;
    let wheelTarget = window.scrollY;

    const stopScrollAnimation = () => {
        if (scrollAnimationFrame) {
            cancelAnimationFrame(scrollAnimationFrame);
            scrollAnimationFrame = null;
        }
    };

    const stopWheelAnimation = () => {
        if (wheelAnimationFrame) {
            cancelAnimationFrame(wheelAnimationFrame);
            wheelAnimationFrame = null;
        }
        wheelTarget = window.scrollY;
    };

    const animateScrollTo = (targetTop) => {
        stopScrollAnimation();
        const startTop = window.scrollY;
        const distance = targetTop - startTop;
        const duration = Math.min(1400, Math.max(700, Math.abs(distance) * 0.5));
        let startTime;

        const animate = (time) => {
            if (startTime === undefined) {
                startTime = time;
            }

            const progress = Math.min((time - startTime) / duration, 1);
            const easedProgress = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            window.scrollTo(0, startTop + distance * easedProgress);

            if (progress < 1) {
                scrollAnimationFrame = requestAnimationFrame(animate);
            } else {
                scrollAnimationFrame = null;
                finishProgrammaticScroll();
            }
        };

        scrollAnimationFrame = requestAnimationFrame(animate);
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                stopScrollAnimation();
                stopWheelAnimation();
                clearTimeout(scrollEndTimer);
                pendingSectionId = targetSection.id;
                navLinks.forEach(navLink => navLink.classList.toggle('active-nav', navLink === link));
                const targetTop = targetSection.getBoundingClientRect().top + window.scrollY - headerHeight;
                animateScrollTo(targetTop);
            }
        });
    });

    window.addEventListener('wheel', (event) => {
        stopScrollAnimation();
        pendingSectionId = null;
        clearTimeout(scrollEndTimer);
        highlightNav();

        if (prefersReducedMotion || event.ctrlKey) {
            stopWheelAnimation();
            return;
        }

        const deltaMultiplier = event.deltaMode === WheelEvent.DOM_DELTA_LINE
            ? 16
            : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
                ? window.innerHeight
                : 1;
        const delta = event.deltaY * deltaMultiplier;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const currentTarget = wheelAnimationFrame ? wheelTarget : window.scrollY;
        const nextTarget = Math.max(0, Math.min(maxScroll, currentTarget + delta));

        if (nextTarget === currentTarget) {
            stopWheelAnimation();
            return;
        }

        event.preventDefault();
        wheelTarget = nextTarget;

        const animateWheelScroll = () => {
            const remaining = wheelTarget - window.scrollY;
            if (Math.abs(remaining) < 1) {
                window.scrollTo(0, wheelTarget);
                wheelAnimationFrame = null;
                return;
            }

            window.scrollTo(0, window.scrollY + remaining * 0.18);
            wheelAnimationFrame = requestAnimationFrame(animateWheelScroll);
        };

        if (!wheelAnimationFrame) {
            wheelAnimationFrame = requestAnimationFrame(animateWheelScroll);
        }
    }, { passive: false });

    window.addEventListener('touchstart', () => {
        stopScrollAnimation();
        stopWheelAnimation();
        pendingSectionId = null;
        clearTimeout(scrollEndTimer);
        highlightNav();
    }, { passive: true });
    window.addEventListener('keydown', (event) => {
        if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) {
            stopScrollAnimation();
            stopWheelAnimation();
            pendingSectionId = null;
            clearTimeout(scrollEndTimer);
            highlightNav();
        }
    });

    // --- 2. Highlight Active Nav Link on Scroll ---
    const sections = document.querySelectorAll('section[id]');

    const finishProgrammaticScroll = () => {
        if (scrollAnimationFrame) {
            return;
        }

        pendingSectionId = null;
        highlightNav();
    };

    const highlightNav = () => {
        if (pendingSectionId) {
            navLinks.forEach(link => {
                link.classList.toggle('active-nav', link.getAttribute('href') === `#${pendingSectionId}`);
            });
            return;
        }

        const activationLine = headerHeight + 20;
        const atPageBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1;
        const activeSection = atPageBottom
            ? sections[sections.length - 1]
            : [...sections].reduce((active, section) =>
                section.getBoundingClientRect().top <= activationLine ? section : active,
            sections[0]);

        navLinks.forEach(link => {
            link.classList.toggle('active-nav', link.getAttribute('href') === `#${activeSection.id}`);
        });
    };

    window.addEventListener('scroll', () => {
        highlightNav();
        clearTimeout(scrollEndTimer);
        scrollEndTimer = setTimeout(finishProgrammaticScroll, 150);
    });
    window.addEventListener('scrollend', finishProgrammaticScroll);
    highlightNav();

    // --- 3. Reveal Elements on Scroll (Intersection Observer) ---
    const observerOptions = {
        root: null,
        threshold: 0.1, // Triggers when 10% of the element is visible
        rootMargin: "0px 0px -50px 0px" // Slight offset before triggering
    };

    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-visible');
                observer.unobserve(entry.target); // Stop watching once animated
            }
        });
    };

    if (!prefersReducedMotion) {
        const revealObserver = new IntersectionObserver(revealCallback, observerOptions);
        const elementsToReveal = document.querySelectorAll(
            '.hero h1, .hero p, .section-title, .about-content p, .project-card, #contact > p, .contact-links, footer p'
        );
        elementsToReveal.forEach(el => {
            el.classList.add('reveal-hidden');
            revealObserver.observe(el);
        });
    }
});
