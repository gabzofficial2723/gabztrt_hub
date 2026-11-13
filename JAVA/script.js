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
        ['supercell', '"Supercell Magic", sans-serif'],
        ['minecraft', '"Minecraft", sans-serif'],
        ['minecrafter', '"Minecrafter", sans-serif'],
        ['minecrafter-alt', '"Minecrafter Alt", sans-serif'],
        ['tf2', '"TF2 Build", sans-serif'],
        ['overseer', '"Overseer", sans-serif'],
        ['adventure', '"Adventure Time Logo", sans-serif'],
        ['ps-bold', '"PS Bold", sans-serif'],
        ['ps-old', '"PS Old", sans-serif'],
        ['zrnic', '"Zrnic", sans-serif'],
        ['zrnic-rg', '"Zrnic Rg", sans-serif'],
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
            setFont('zrnic-rg');
        }
    } catch (error) {
        setFont('zrnic-rg');
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
    const projectPreview = document.querySelector('.project-preview');
    const projectPreviewClose = document.querySelector('.project-preview-close');
    const projectPreviewCreators = document.querySelector('.project-creators');
    const gameplaySlider = projectPreviewCreators.querySelector('.gameplay-slider');
    const gameplayThumbnail = projectPreviewCreators.querySelector('.gameplay-thumbnail');
    const gameplayCreator = projectPreviewCreators.querySelector('.gameplay-creator');
    const gameplaySourceLink = projectPreviewCreators.querySelector('.gameplay-source');
    const gameplayIndicators = projectPreviewCreators.querySelector('.gameplay-indicators');
    const gameplayToggle = projectPreviewCreators.querySelector('.gameplay-toggle');
    const gameplayPauseIcon = projectPreviewCreators.querySelector('.gameplay-pause-icon');
    const gameplayResumeIcon = projectPreviewCreators.querySelector('.gameplay-resume-icon');
    const gameplayClips = [
        {
            creator: 'DanTDM',
            alt: 'DanTDM playing Minecraft',
            gifUrl: 'https://media.tenor.com/mAlNB99pLacAAAAM/dantdm-dan-tdm.gif',
            sourceUrl: 'https://tenor.com/view/dantdm-dan-tdm-dan-tdm-shock-gif-10955372264763764135',
            accent: '#2879a9'
        },
        {
            creator: 'Markiplier',
            alt: "Markiplier playing Five Nights at Freddy's",
            gifUrl: 'https://media.tenor.com/wnua8kI-818AAAAM/mark-playing-freddy-game-fnaf-markiplier.gif',
            sourceUrl: 'https://tenor.com/view/mark-playing-freddy-game-fnaf-markiplier-jumpscare-fnaf-gif-14013965030777615199',
            accent: '#a9363e'
        },
        {
            creator: 'Jacksepticeye',
            alt: 'Jacksepticeye reacting to a game',
            gifUrl: 'https://media.tenor.com/J0a63OF2UMoAAAAM/jacksepticeye-scream.gif',
            sourceUrl: 'https://tenor.com/view/jacksepticeye-scream-screeches-eye-roll-gif-5852266',
            accent: '#347b45'
        },
        {
            creator: 'PewDiePie',
            alt: 'PewDiePie playing Minecraft',
            gifUrl: 'https://media.tenor.com/k_NZIu0sk2QAAAAM/epic-pewdiepie.gif',
            sourceUrl: 'https://tenor.com/view/epic-pewdiepie-minecraft-water-sheep-funny-gif-19261424',
            accent: '#b74235'
        },
        {
            creator: 'Sinvicta',
            alt: 'The Binding of Isaac gameplay',
            gifUrl: 'https://media.tenor.com/xdd3ZJzFYygAAAAM/isaac-giga-chad.gif',
            sourceUrl: 'https://tenor.com/view/isaac-giga-chad-isaac-moment-2ez-gif-27629341',
            accent: '#6d4b99'
        },
        {
            creator: 'ZackScottGames',
            alt: 'Plants vs. Zombies gameplay',
            gifUrl: 'https://media.tenor.com/FYT6y9h17H8AAAAM/zombie-pvz.gif',
            sourceUrl: 'https://tenor.com/view/zombie-pvz-games-gif-1550639925139205247',
            accent: '#337c6e'
        }
    ];
    const reducedMotionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let activeGameplayClipIndex = 0;
    let gameplayTimer = null;
    let isGameplayAutoplayPaused = reducedMotionPreference.matches;
    let isGameplayPointerInside = false;
    let isGameplayFocused = false;
    const stopGameplayAutoplay = () => {
        window.clearInterval(gameplayTimer);
        gameplayTimer = null;
    };
    const updateGameplayToggle = () => {
        gameplayToggle.setAttribute('aria-pressed', String(isGameplayAutoplayPaused));
        gameplayToggle.setAttribute(
            'aria-label',
            `${isGameplayAutoplayPaused ? 'Resume' : 'Pause'} automatic slide rotation`
        );
        if (isGameplayAutoplayPaused) {
            gameplayPauseIcon.setAttribute('hidden', '');
            gameplayResumeIcon.removeAttribute('hidden');
        } else {
            gameplayPauseIcon.removeAttribute('hidden');
            gameplayResumeIcon.setAttribute('hidden', '');
        }
    };
    const startGameplayAutoplay = () => {
        stopGameplayAutoplay();
        if (
            isGameplayAutoplayPaused
            || isGameplayPointerInside
            || isGameplayFocused
            || document.hidden
            || !projectPreview.open
            || projectPreviewCreators.hidden
        ) {
            return;
        }

        gameplayTimer = window.setInterval(() => {
            showGameplayClip(activeGameplayClipIndex + 1);
        }, 5000);
    };
    const showGameplayClip = (index) => {
        activeGameplayClipIndex = (index + gameplayClips.length) % gameplayClips.length;
        const clip = gameplayClips[activeGameplayClipIndex];
        gameplayThumbnail.classList.remove('is-transitioning');
        gameplayThumbnail.src = clip.gifUrl;
        gameplayThumbnail.alt = clip.alt;
        gameplayCreator.textContent = clip.creator;
        gameplaySourceLink.href = clip.sourceUrl;
        gameplaySourceLink.setAttribute('aria-label', `View ${clip.creator} GIF source on Tenor`);
        gameplaySlider.style.setProperty('--creator-accent', clip.accent);
        gameplayIndicators.querySelectorAll('.gameplay-indicator').forEach((indicator, indicatorIndex) => {
            indicator.setAttribute('aria-current', String(indicatorIndex === activeGameplayClipIndex));
        });
        requestAnimationFrame(() => gameplayThumbnail.classList.add('is-transitioning'));
    };
    gameplayClips.forEach((clip, index) => {
        const indicator = document.createElement('button');
        indicator.className = 'gameplay-indicator';
        indicator.type = 'button';
        indicator.setAttribute('aria-label', `Show ${clip.creator} gameplay GIF`);
        indicator.setAttribute('aria-current', 'false');
        indicator.addEventListener('click', () => {
            showGameplayClip(index);
            startGameplayAutoplay();
        });
        gameplayIndicators.append(indicator);
    });
    gameplayThumbnail.addEventListener('error', () => {
        console.error(`Unable to load gameplay GIF for ${gameplayClips[activeGameplayClipIndex].creator}.`);
    });
    gameplayToggle.addEventListener('click', () => {
        isGameplayAutoplayPaused = !isGameplayAutoplayPaused;
        updateGameplayToggle();
        startGameplayAutoplay();
    });
    gameplaySlider.addEventListener('pointerenter', () => {
        isGameplayPointerInside = true;
        startGameplayAutoplay();
    });
    gameplaySlider.addEventListener('pointerleave', () => {
        isGameplayPointerInside = false;
        startGameplayAutoplay();
    });
    gameplaySlider.addEventListener('focusin', () => {
        isGameplayFocused = true;
        startGameplayAutoplay();
    });
    gameplaySlider.addEventListener('focusout', (event) => {
        if (!gameplaySlider.contains(event.relatedTarget)) {
            isGameplayFocused = false;
            startGameplayAutoplay();
        }
    });
    document.addEventListener('visibilitychange', startGameplayAutoplay);
    updateGameplayToggle();
    showGameplayClip(activeGameplayClipIndex);
    const projectPreviewTemplates = {
        'Catering Services': {
            eyebrow: 'Catering & events',
            description: 'A preview template for a catering services project. Replace these prompts with your menus, event details, and booking information.',
            screenTitle: 'Catering experience',
            screenCopy: 'Add a featured menu, event photo, or a short introduction to your catering services.',
            sections: [
                ['Menu & services', 'Add menu options, packages, and service details.'],
                ['Event planning', 'Add event types, planning steps, and availability.'],
                ['Bookings', 'Add inquiry details or a booking call to action.']
            ]
        },
        'Game Enthusiast': {
            eyebrow: 'Gaming & community',
            description: 'A preview template for a gaming project. Use these sections for the games, features, and community details you want to share.',
            screenTitle: 'Gaming hub',
            screenCopy: 'Add a featured game, gameplay image, or an introduction to your gaming interests.',
            sections: [
                ['Games & genres', 'Add favorite games, genres, and highlights.'],
                ['Features', 'Add guides, reviews, streams, or other project features.'],
                ['Community', 'Add multiplayer, events, or community information.']
            ]
        },
        'Frontend Developer': {
            eyebrow: 'Frontend development',
            description: 'A preview template for a frontend development project. Replace these prompts with your work, tools, and approach.',
            screenTitle: 'Frontend portfolio',
            screenCopy: 'Add a product screenshot, live preview, or a short project introduction.',
            sections: [
                ['Featured work', 'Add project summaries, images, and links.'],
                ['Tools & skills', 'Add the technologies and skills used.'],
                ['Process', 'Add your role, design decisions, and outcomes.']
            ]
        },
        'Troll Expert': {
            eyebrow: 'Playful concepts',
            description: 'A preview template for lighthearted pranks and playful ideas. Keep every prank kind, consensual, and harmless.',
            screenTitle: 'Harmless fun',
            screenCopy: 'Add a playful concept, funny story, or visual from the project.',
            sections: [
                ['Prank ideas', 'Add harmless, good-natured concepts.'],
                ['Funny moments', 'Add stories, reactions, or favorite moments.'],
                ['Ground rules', 'Add how you keep the fun respectful and safe.']
            ]
        }
    };
    let projectPreviewOpener;
    let projectPreviewAnimation;
    let isProjectPreviewClosing = false;
    const projectCardAnimations = new WeakMap();
    let pointerProjectCard;
    let focusProjectCard;

    const closeProjectPreview = () => {
        if (!projectPreview.open || isProjectPreviewClosing) {
            return;
        }

        isProjectPreviewClosing = true;
        stopGameplayAutoplay();
        if (!projectPreviewAnimation) {
            projectPreview.close();
            return;
        }

        projectPreviewAnimation.onfinish = () => {
            const finishedAnimation = projectPreviewAnimation;
            projectPreviewAnimation = null;
            finishedAnimation.cancel();
            projectPreview.close();
        };
        projectPreviewAnimation.reverse();
    };

    projectGrid.addEventListener('click', (event) => {
        const previewButton = event.target.closest('.quickview-link');
        if (!previewButton) {
            return;
        }

        const card = previewButton.closest('.project-card');
        const title = card.querySelector('h3').textContent.trim();
        const template = projectPreviewTemplates[title];
        if (!template) {
            console.error(`No project preview template is configured for "${title}".`);
            return;
        }

        projectPreview.querySelector('#project-preview-eyebrow').textContent = template.eyebrow;
        projectPreview.querySelector('#project-preview-title').textContent = title;
        projectPreview.querySelector('#project-preview-description').textContent = template.description;
        projectPreview.querySelector('#project-preview-screen-title').textContent = template.screenTitle;
        projectPreview.querySelector('#project-preview-screen-copy').textContent = template.screenCopy;
        template.sections.forEach(([sectionTitle, sectionCopy], index) => {
            const sectionNumber = ['one', 'two', 'three'][index];
            projectPreview.querySelector(`#project-preview-section-${sectionNumber}-title`).textContent = sectionTitle;
            projectPreview.querySelector(`#project-preview-section-${sectionNumber}-copy`).textContent = sectionCopy;
        });

        projectPreviewCreators.hidden = title !== 'Game Enthusiast';
        stopGameplayAutoplay();
        projectPreviewOpener = previewButton;
        isProjectPreviewClosing = false;
        projectPreview.showModal();
        if (!projectPreviewCreators.hidden) {
            showGameplayClip(0);
            startGameplayAutoplay();
        }
        const triggerBounds = previewButton.getBoundingClientRect();
        const dialogBounds = projectPreview.getBoundingClientRect();
        projectPreview.style.transformOrigin = `${triggerBounds.left + triggerBounds.width / 2 - dialogBounds.left}px ${triggerBounds.top + triggerBounds.height / 2 - dialogBounds.top}px`;

        projectPreviewAnimation = projectPreview.animate(
            [
                { opacity: 0, transform: 'scale(0.08)', filter: 'blur(8px)' },
                { opacity: 1, transform: 'scale(1.035)', filter: 'blur(0)', offset: 0.78 },
                { opacity: 1, transform: 'scale(1)', filter: 'blur(0)' }
            ],
            {
                duration: 680,
                easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                fill: 'both'
            }
        );
    });

    projectPreviewClose.addEventListener('click', closeProjectPreview);
    projectPreview.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeProjectPreview();
        }
    });
    projectPreview.addEventListener('cancel', (event) => {
        event.preventDefault();
        closeProjectPreview();
    });
    projectPreview.addEventListener('click', (event) => {
        if (event.target === projectPreview) {
            closeProjectPreview();
        }
    });
    projectPreview.addEventListener('close', () => {
        if (projectPreviewOpener?.isConnected) {
            projectPreviewOpener.focus();
        }
        projectPreviewOpener = null;
    });

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
    const homeLink = document.querySelector('.logo-link');
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

    homeLink.addEventListener('click', (event) => {
        event.preventDefault();
        stopScrollAnimation();
        stopWheelAnimation();
        clearTimeout(scrollEndTimer);
        pendingSectionId = null;
        animateScrollTo(0);
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
