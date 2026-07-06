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

        const el = target.closest('a, button, input, textarea, select, .glass-interactive, .project-card, .budget-option, .tilt-card');
        
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
        if (!relatedTarget || !relatedTarget.closest('a, button, input, textarea, select, .glass-interactive, .project-card, .budget-option, .tilt-card')) {
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
    const navLinks = document.querySelectorAll('.nav-item, .nav-logo, .mobile-nav-item');

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

    // Mobile Hamburger Menu Toggle
    const navToggle = document.querySelector('.nav-toggle');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-item');

    if (navToggle) {
        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navbar.classList.toggle('mobile-menu-active');
        });
    }

    // Close menu on link click
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            navbar.classList.remove('mobile-menu-active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (navbar.classList.contains('mobile-menu-active')) {
            if (!e.target.closest('.navbar')) {
                navbar.classList.remove('mobile-menu-active');
            }
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
       4.6 Certifications Carousel Controls
       ========================================================================== */
    const certsTrack = document.querySelector('.certs-carousel-track');
    const certsPrevBtn = document.querySelector('.certs-prev-arrow');
    const certsNextBtn = document.querySelector('.certs-next-arrow');

    if (certsTrack && certsPrevBtn && certsNextBtn) {
        const certCard = certsTrack.querySelector('.cert-card');

        const updateCertArrowStates = () => {
            const scrollLeft = certsTrack.scrollLeft;
            const maxScroll = certsTrack.scrollWidth - certsTrack.clientWidth;

            // prev button disabled at left end
            if (scrollLeft <= 5) {
                certsPrevBtn.classList.add('disabled');
            } else {
                certsPrevBtn.classList.remove('disabled');
            }

            // next button disabled at right end
            if (scrollLeft >= maxScroll - 5) {
                certsNextBtn.classList.add('disabled');
            } else {
                certsNextBtn.classList.remove('disabled');
            }
        };

        certsNextBtn.addEventListener('click', () => {
            if (certCard) {
                const cardWidth = certCard.offsetWidth;
                const gap = parseInt(getComputedStyle(certsTrack).gap) || 24;
                certsTrack.scrollBy({ left: cardWidth + gap, behavior: 'smooth' });
            }
        });

        certsPrevBtn.addEventListener('click', () => {
            if (certCard) {
                const cardWidth = certCard.offsetWidth;
                const gap = parseInt(getComputedStyle(certsTrack).gap) || 24;
                certsTrack.scrollBy({ left: -(cardWidth + gap), behavior: 'smooth' });
            }
        });

        certsTrack.addEventListener('scroll', updateCertArrowStates);
        
        // Initial check after load
        window.addEventListener('load', () => {
            setTimeout(updateCertArrowStates, 100);
        });
    }


    /* ==========================================================================
       5. Skills & Capabilities Section - Search & Category Filters
       ========================================================================== */
    const skillsSearchInput = document.getElementById('skills-search-input');
    const skillCards = document.querySelectorAll('.skills-category-card');
    
    // Fuzzy search filter
    if (skillsSearchInput) {
        skillsSearchInput.addEventListener('input', () => {
            const query = skillsSearchInput.value.toLowerCase().trim();
            
            skillCards.forEach(card => {
                const tags = card.querySelectorAll('.skill-tag');
                let hasMatch = false;
                
                tags.forEach(tag => {
                    const skillName = tag.innerText.toLowerCase();
                    if (query.length === 0) {
                        tag.classList.remove('highlight-match', 'dimmed-match');
                        hasMatch = true;
                    } else if (skillName.includes(query)) {
                        tag.classList.add('highlight-match');
                        tag.classList.remove('dimmed-match');
                        hasMatch = true;
                    } else {
                        tag.classList.remove('highlight-match');
                        tag.classList.add('dimmed-match');
                    }
                });
                
                if (hasMatch) {
                    card.classList.remove('dimmed');
                } else {
                    card.classList.add('dimmed');
                }
            });
        });
    }


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

    // Timeline Card Toggles for Professional Experience
    const timelineCards = document.querySelectorAll('.timeline-card');
    timelineCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Avoid toggling if clicking on links or buttons
            if (e.target.closest('a, button')) return;
            
            card.classList.toggle('is-expanded');
        });
    });

});
