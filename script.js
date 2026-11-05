document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Smooth Scrolling with Fixed Header Offset ---
    const navLinks = document.querySelectorAll('.nav-links a');
    const headerHeight = document.querySelector('header').offsetHeight;

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- 2. Highlight Active Nav Link on Scroll ---
    const sections = document.querySelectorAll('section[id]');
    
    const highlightNav = () => {
        let scrollY = window.pageYOffset;
        
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - headerHeight - 20; // 20px buffer
            const sectionId = current.getAttribute('id');
            
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                document.querySelector(`.nav-links a[href*=${sectionId}]`)?.classList.add('active-nav');
            } else {
                document.querySelector(`.nav-links a[href*=${sectionId}]`)?.classList.remove('active-nav');
            }
        });
    };
    
    window.addEventListener('scroll', highlightNav);

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

    const revealObserver = new IntersectionObserver(revealCallback, observerOptions);
    
    // Target project cards and section titles for the subtle animation
    const elementsToReveal = document.querySelectorAll('.project-card, .section-title');
    elementsToReveal.forEach(el => {
        el.classList.add('reveal-hidden'); // Add initial hidden state
        revealObserver.observe(el);
    });
});
