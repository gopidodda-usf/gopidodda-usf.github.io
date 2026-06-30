document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. Custom Liquid Cursor
       ========================================================================== */
    const cursorDot = document.getElementById('cursor-dot');
    const cursorRing = document.getElementById('cursor-ring');
    
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;
    let isMoving = false;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        isMoving = true;
    });

    document.addEventListener('mouseleave', () => {
        isMoving = false;
    });

    // Lerp trail animation
    function animateCursor() {
        if (isMoving) {
            // Smooth cursor ring movement using linear interpolation (lerp)
            ringX += (mouseX - ringX) * 0.32;
            ringY += (mouseY - ringY) * 0.32;
            
            cursorDot.style.left = `${mouseX}px`;
            cursorDot.style.top = `${mouseY}px`;
            
            cursorRing.style.left = `${ringX}px`;
            cursorRing.style.top = `${ringY}px`;
        }
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Hover states for cursor (using event delegation for robust handling of child elements and SVGs)
    document.addEventListener('mouseover', (e) => {
        const target = e.target;
        if (!target) return;

        const el = target.closest('a, button, input, textarea, select, .glass-interactive, .project-card, .budget-option');
        
        if (el) {
            cursorRing.classList.add('cursor-hover');

            // If it's a contact or orange accent element, change cursor color
            if (el.classList.contains('orange-text') || el.closest('#contact') || (el.classList.contains('budget-option') && el.dataset.value === '>10k')) {
                cursorRing.classList.add('cursor-orange');
                cursorDot.classList.add('cursor-orange');
            } else {
                cursorRing.classList.remove('cursor-orange');
                cursorDot.classList.remove('cursor-orange');
            }

            // If it's a stat card or social button (opposite color hover), invert cursor to dark
            if (el.classList.contains('stat-item') || el.closest('.stat-item') || el.classList.contains('social-btn') || el.closest('.social-btn')) {
                cursorRing.classList.add('cursor-dark');
                cursorDot.classList.add('cursor-dark');
            } else {
                cursorRing.classList.remove('cursor-dark');
                cursorDot.classList.remove('cursor-dark');
            }
        }
    });

    document.addEventListener('mouseout', (e) => {
        const relatedTarget = e.relatedTarget;
        // Check if the cursor left all interactive bounds entirely
        if (!relatedTarget || !relatedTarget.closest('a, button, input, textarea, select, .glass-interactive, .project-card, .budget-option')) {
            cursorRing.classList.remove('cursor-hover', 'cursor-orange', 'cursor-dark');
            cursorDot.classList.remove('cursor-orange', 'cursor-dark');
        }
    });

    // Click effect
    document.addEventListener('mousedown', () => {
        cursorRing.classList.add('cursor-click');
    });
    document.addEventListener('mouseup', () => {
        cursorRing.classList.remove('cursor-click');
    });


    /* ==========================================================================
       1.5 Interactive Background Canvas (Warp Grid & Paper Airplane)
       ========================================================================== */
    const bgCanvas = document.getElementById('bg-canvas');
    if (bgCanvas) {
        const ctx = bgCanvas.getContext('2d');
        
        // High-DPI support
        let dpr = window.devicePixelRatio || 1;
        let width = window.innerWidth;
        let height = window.innerHeight;
        
        function resizeCanvas() {
            dpr = window.devicePixelRatio || 1;
            width = window.innerWidth;
            height = window.innerHeight;
            bgCanvas.width = width * dpr;
            bgCanvas.height = height * dpr;
            ctx.scale(dpr, dpr);
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Grid configuration
        const gridSpacing = 36;
        const dotRadius = 1.2;
        const warpRadius = 130;
        const maxWarp = 16;
        

        
        // Render loop
        function drawBackground() {
            ctx.clearRect(0, 0, width, height);
            
            // 1. Draw Grid (Static base opacity, warps and brightens on hover)
            const baseOpacity = 0.07;
            
            // Loop through grid coordinates
            // Start offset to center the grid nicely
            const startX = (width % gridSpacing) / 2;
            const startY = (height % gridSpacing) / 2;
            
            for (let x = startX; x < width; x += gridSpacing) {
                for (let y = startY; y < height; y += gridSpacing) {
                    let drawX = x;
                    let drawY = y;
                    let dotAlpha = baseOpacity;
                    
                    // Mouse warp and brighten calculation
                    if (isMoving) {
                        const dx = x - mouseX;
                        const dy = y - mouseY;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist < warpRadius) {
                            const force = (warpRadius - dist) / warpRadius;
                            const angle = Math.atan2(dy, dx);
                            const warp = force * maxWarp;
                            
                            // Push dot away from mouse
                            drawX = x + Math.cos(angle) * warp;
                            drawY = y + Math.sin(angle) * warp;
                            
                            // Increase opacity near cursor to form a glowing aura
                            dotAlpha = baseOpacity + force * (0.45 - baseOpacity);
                        }
                    }
                    
                    ctx.beginPath();
                    ctx.arc(drawX, drawY, dotRadius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(197, 255, 65, ${dotAlpha})`;
                    ctx.fill();
                }
            }
            

            
            requestAnimationFrame(drawBackground);
        }
        drawBackground();
    }


    /* ==========================================================================
       2. Scroll Reveal & Navbar Highlighting
       ========================================================================== */
    const revealElements = document.querySelectorAll('.section-reveal');
    const pageSections = document.querySelectorAll('.page-section');
    const navLinks = document.querySelectorAll('.nav-item, .nav-logo');

    // Reveal elements on scroll
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });

    // Highlight navbar menu item matching current section
    let isClickScrolling = false;
    let clickScrollTimeout;

    const activeSectionObserver = new IntersectionObserver((entries) => {
        if (isClickScrolling) return;
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('href') === `#${id}`) {
                        item.classList.add('active');
                    }
                });
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '-20% 0px -45% 0px'
    });

    pageSections.forEach(section => {
        activeSectionObserver.observe(section);
    });

    // Manual click highlights with scrollspy lock
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(item => item.classList.remove('active'));
            link.classList.add('active');
            isClickScrolling = true;
            clearTimeout(clickScrollTimeout);
            clickScrollTimeout = setTimeout(() => {
                isClickScrolling = false;
            }, 800);
        });
    });

    // Navbar scrolled background shift
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            navbar.classList.add('nav-scrolled');
        } else {
            navbar.classList.remove('nav-scrolled');
        }
    });


    /* ==========================================================================
       3. 3D Card Tilt Effect
       ========================================================================== */
    const tiltCards = document.querySelectorAll('.tilt-card');
    
    tiltCards.forEach(card => {
        const isProject = card.classList.contains('project-card');
        const activeTransform = isProject ? ' translateY(-4px) scale(1.03)' : ' translateY(-4px)';
        
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Limit tilt angles (max 8 degrees)
            const rotateX = ((centerY - y) / centerY) * 8;
            const rotateY = ((x - centerX) / centerX) * 8;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)${activeTransform}`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)';
        });
    });


    /* ==========================================================================
       4. Case Study Drawers
       ========================================================================== */
    const projectCards = document.querySelectorAll('.project-card, .hobby-card');
    const closeButtons = document.querySelectorAll('[data-close]');
    const drawerOverlays = document.querySelectorAll('.drawer-overlay');

    // Open Drawer
    projectCards.forEach(card => {
        card.addEventListener('click', () => {
            const drawerId = card.getAttribute('data-drawer');
            const drawer = document.getElementById(drawerId);
            if (drawer) {
                drawer.classList.add('active');
                document.body.style.overflow = 'hidden'; // Lock background scrolling
                window.location.hash = drawerId;
            }
        });
    });

    // Close Drawer
    function closeAllDrawers() {
        drawerOverlays.forEach(drawer => {
            drawer.classList.remove('active');
        });
        document.body.style.overflow = ''; // Release scroll lock
        
        // Clear hash from address bar without page jump
        history.replaceState(null, null, ' ');
    }

    closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDrawers();
        });
    });

    drawerOverlays.forEach(drawer => {
        drawer.addEventListener('click', (e) => {
            if (e.target === drawer) {
                closeAllDrawers();
            }
        });
    });

    // Check hash on page load to open specific project case study directly
    if (window.location.hash) {
        const activeHash = window.location.hash.substring(1);
        const matchedDrawer = document.getElementById(activeHash);
        if (matchedDrawer && matchedDrawer.classList.contains('drawer-overlay')) {
            matchedDrawer.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }


    /* ==========================================================================
       4.5 Projects Carousel Controls
       ========================================================================== */
    const track = document.querySelector('.projects-carousel-track');
    const prevBtn = document.querySelector('.prev-arrow');
    const nextBtn = document.querySelector('.next-arrow');

    if (track && prevBtn && nextBtn) {
        const card = track.querySelector('.project-card');

        const updateArrowStates = () => {
            const scrollLeft = track.scrollLeft;
            const maxScroll = track.scrollWidth - track.clientWidth;

            // prev button disabled at left end
            if (scrollLeft <= 5) {
                prevBtn.classList.add('disabled');
            } else {
                prevBtn.classList.remove('disabled');
            }

            // next button disabled at right end
            if (scrollLeft >= maxScroll - 5) {
                nextBtn.classList.add('disabled');
            } else {
                nextBtn.classList.remove('disabled');
            }
        };

        nextBtn.addEventListener('click', () => {
            if (card) {
                const cardWidth = card.offsetWidth;
                const gap = parseInt(getComputedStyle(track).gap) || 24;
                track.scrollBy({ left: cardWidth + gap, behavior: 'smooth' });
            }
        });

        prevBtn.addEventListener('click', () => {
            if (card) {
                const cardWidth = card.offsetWidth;
                const gap = parseInt(getComputedStyle(track).gap) || 24;
                track.scrollBy({ left: -(cardWidth + gap), behavior: 'smooth' });
            }
        });

        track.addEventListener('scroll', updateArrowStates);

        // Center on Load (Projects 3, 4, 5 visible; 1, 2 peeking/hidden to left; 6, 7 to right)
        window.addEventListener('load', () => {
            const cards = track.querySelectorAll('.project-card');
            if (cards[3]) {
                const targetCard = cards[3];
                const cardLeft = targetCard.offsetLeft;
                const cardWidth = targetCard.offsetWidth;
                const trackWidth = track.clientWidth;
                track.scrollLeft = cardLeft + (cardWidth / 2) - (trackWidth / 2);
            }
            // Add a slight delay to compute correct states after centering
            setTimeout(updateArrowStates, 100);
        });
    }


    /* ==========================================================================
       5. Vibecoding Spaces - Canvas Particle Mesh
       ========================================================================== */
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    const viewport = document.getElementById('particle-viewport');
    const resetBtn = document.getElementById('btn-reset-particles');
    const countSlider = document.getElementById('particle-count-slider');

    let particles = [];
    let particleCount = parseInt(countSlider.value);
    let viewWidth = canvas.width = viewport.clientWidth;
    let viewHeight = canvas.height = viewport.clientHeight;
    
    let pointer = { x: null, y: null, active: false };

    // Resize canvas dynamically
    window.addEventListener('resize', () => {
        if (viewport) {
            viewWidth = canvas.width = viewport.clientWidth;
            viewHeight = canvas.height = viewport.clientHeight;
            initializeParticles();
        }
    });

    viewport.addEventListener('mousemove', (e) => {
        const rect = viewport.getBoundingClientRect();
        pointer.x = e.clientX - rect.left;
        pointer.y = e.clientY - rect.top;
        pointer.active = true;
    });

    viewport.addEventListener('mouseleave', () => {
        pointer.active = false;
    });

    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * viewWidth;
            this.y = Math.random() * viewHeight;
            this.vx = (Math.random() - 0.5) * 0.8;
            this.vy = (Math.random() - 0.5) * 0.8;
            this.radius = Math.random() * 2 + 1;
            this.color = Math.random() > 0.8 ? '#c5ff41' : '#ffffff';
        }
        update() {
            // Apply slight gravity draw to cursor
            if (pointer.active) {
                const dx = pointer.x - this.x;
                const dy = pointer.y - this.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 120) {
                    const force = (120 - dist) / 120;
                    this.vx += (dx / dist) * force * 0.05;
                    this.vy += (dy / dist) * force * 0.05;
                }
            }

            this.x += this.vx;
            this.y += this.vy;

            // Damp speed limit
            this.vx *= 0.98;
            this.vy *= 0.98;

            // Boundaries bounce
            if (this.x < 0 || this.x > viewWidth) this.vx *= -1;
            if (this.y < 0 || this.y > viewHeight) this.vy *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = this.color === '#c5ff41' ? 4 : 0;
            ctx.shadowColor = '#c5ff41';
            ctx.fill();
            ctx.shadowBlur = 0; // reset
        }
    }

    function initializeParticles() {
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, viewWidth, viewHeight);

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if (dist < 80) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    // Fade lines out based on distance
                    const alpha = (80 - dist) / 80 * 0.15;
                    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animateParticles);
    }

    initializeParticles();
    animateParticles();

    resetBtn.addEventListener('click', initializeParticles);
    countSlider.addEventListener('input', () => {
        particleCount = parseInt(countSlider.value);
        initializeParticles();
    });


    /* ==========================================================================
       6. Vibecoding Spaces - Retro Cyber Game
       ========================================================================== */
    const gameIntro = document.getElementById('game-intro-screen');
    const gamePlay = document.getElementById('game-play-screen');
    const gameOver = document.getElementById('game-over-screen');
    const startBtn = document.getElementById('btn-start-game');
    const restartBtn = document.getElementById('btn-restart-game');
    
    const scoreVal = document.getElementById('game-score');
    const timerVal = document.getElementById('game-timer');
    const targetChar = document.getElementById('target-char');
    const finalScore = document.getElementById('final-score');
    const keyGrid = document.getElementById('cyber-keyboard-grid');
    const gameResultTitle = document.getElementById('game-result-title');

    let gameActive = false;
    let score = 0;
    let timeLeft = 10.0;
    let targetBypassKey = '';
    let gameTimerInterval;

    const cyberHexKeys = ['A3', 'C7', 'F0', 'E8', 'BD', '4A', 'D2', '9E', '6B', '1C', '5F', '0B'];

    function startCyberBypass() {
        gameActive = true;
        score = 0;
        timeLeft = 10.0;
        
        gameIntro.classList.add('hidden');
        gameOver.classList.add('hidden');
        gamePlay.classList.remove('hidden');

        scoreVal.innerText = score;
        timerVal.innerText = timeLeft.toFixed(1) + 's';

        generateKeypad();
        chooseNextTarget();

        // Game Loop Timer
        clearInterval(gameTimerInterval);
        gameTimerInterval = setInterval(() => {
            timeLeft -= 0.1;
            if (timeLeft <= 0) {
                timeLeft = 0;
                endCyberBypass(false); // Fail
            }
            timerVal.innerText = timeLeft.toFixed(1) + 's';
            // Warning color
            if (timeLeft < 3.0) {
                timerVal.className = 'orange-text';
            } else {
                timerVal.className = 'accent-text';
            }
        }, 100);
    }

    function generateKeypad() {
        keyGrid.innerHTML = '';
        cyberHexKeys.forEach(k => {
            const btn = document.createElement('button');
            btn.className = 'key-btn glass-interactive';
            btn.innerText = k;
            btn.type = 'button';
            btn.addEventListener('click', () => {
                handleKeyInput(k);
            });
            keyGrid.appendChild(btn);
        });
    }

    function chooseNextTarget() {
        // Random pick
        const randKey = cyberHexKeys[Math.floor(Math.random() * cyberHexKeys.length)];
        targetBypassKey = randKey;
        targetChar.innerText = targetBypassKey;

        // Visual blinking cue on grid
        const buttons = keyGrid.querySelectorAll('.key-btn');
        buttons.forEach(btn => {
            btn.classList.remove('target-blink');
            if (btn.innerText === targetBypassKey) {
                // Stagger blinking slightly
                setTimeout(() => {
                    if (gameActive) btn.classList.add('target-blink');
                }, 100);
            }
        });
    }

    function handleKeyInput(key) {
        if (!gameActive) return;
        if (key === targetBypassKey) {
            score++;
            scoreVal.innerText = score;
            timeLeft += 1.5; // Award time bonus
            if (timeLeft > 15.0) timeLeft = 15.0; // cap time
            chooseNextTarget();
        } else {
            timeLeft -= 1.0; // Deduct time for penalty
            if (timeLeft < 0) timeLeft = 0;
        }
    }

    function endCyberBypass(victory = false) {
        gameActive = false;
        clearInterval(gameTimerInterval);
        gamePlay.classList.add('hidden');
        gameOver.classList.remove('hidden');

        finalScore.innerText = score;
        if (score >= 15) {
            gameResultTitle.innerText = "WALL BYPASSED";
            gameResultTitle.className = "game-result-title accent-text";
        } else {
            gameResultTitle.innerText = "SYSTEM LOCKDOWN";
            gameResultTitle.className = "game-result-title orange-text";
        }
    }

    startBtn.addEventListener('click', startCyberBypass);
    restartBtn.addEventListener('click', startCyberBypass);


    /* ==========================================================================
       7. Contact Form Submission
       ========================================================================== */
    const contactForm = document.getElementById('portfolio-contact-form');
    const submitBtn = contactForm.querySelector('.submit-form-btn');
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');
    const btnSuccess = document.getElementById('btn-success');

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Loading state
        submitBtn.disabled = true;
        btnText.innerText = "Sending...";
        btnSpinner.classList.remove('hidden');

        try {
            // Check if Access Key is still the placeholder
            const accessKeyInput = contactForm.querySelector('input[name="access_key"]');
            if (!accessKeyInput || accessKeyInput.value === "YOUR_ACCESS_KEY_HERE") {
                throw new Error("Please configure your Web3Forms Access Key.");
            }

            const formData = new FormData(contactForm);
            
            // Customize subject and meta details for the email
            formData.append("subject", "New Portfolio Inquiry");
            formData.append("from_name", formData.get("name"));

            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Success State
                btnSpinner.classList.add('hidden');
                btnSuccess.classList.remove('hidden');
                btnText.innerText = "Mail Sent";
                submitBtn.classList.add('success');

                // Reset fields
                contactForm.reset();
            } else {
                throw new Error(result.message || "Failed to submit form.");
            }
        } catch (error) {
            console.error("Web3Forms submission failed:", error);
            btnSpinner.classList.add('hidden');
            btnText.innerText = "Error: Try Again";
            submitBtn.classList.add('error');
            
            // Show alert for the developer if key is not configured
            if (error.message.includes("Access Key")) {
                alert("Form Error: Web3Forms Access Key is not configured in index.html. Please replace 'YOUR_ACCESS_KEY_HERE' with your real key.");
            }
        } finally {
            // Restore form button after 3 seconds
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.classList.remove('success', 'error');
                btnSuccess.classList.add('hidden');
                btnText.innerText = "Send Mail";
            }, 3000);
        }
    });

});
