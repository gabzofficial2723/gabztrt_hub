document.addEventListener('DOMContentLoaded', () => {
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
    }, { passive: true });
    window.addEventListener('keydown', (event) => {
        if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) {
            stopScrollAnimation();
            stopWheelAnimation();
        }
    });

    // --- 2. Highlight Active Nav Link on Scroll ---
    const sections = document.querySelectorAll('section[id]');

    const finishProgrammaticScroll = () => {
        pendingSectionId = null;
        highlightNav();
    };

    const highlightNav = () => {
        const activationLine = headerHeight + 20;
        const pendingSection = pendingSectionId && document.getElementById(pendingSectionId);
        if (pendingSection && pendingSection.getBoundingClientRect().top > activationLine) {
            return;
        }

        pendingSectionId = null;
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
