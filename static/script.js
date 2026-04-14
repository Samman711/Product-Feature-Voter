document.addEventListener('DOMContentLoaded', () => {
    
    // --- APP STATE & LOCALSTORAGE INIT ---
    let users = JSON.parse(localStorage.getItem('users')) || {};
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    let votedFeatures = JSON.parse(localStorage.getItem('votedFeatures')) || [];
    
    let defaultFeatures = [
        {"id": 1, "title": "Dark Mode Support", "description": "Enable eye-friendly dark themes across our iOS and Android applications.", "votes": 120},
        {"id": 2, "title": "Mobile App version", "description": "Release a native mobile application for better user experience.", "votes": 95},
        {"id": 3, "title": "API Documentation", "description": "Publish extensive technical API documentation with standard endpoints.", "votes": 84},
        {"id": 4, "title": "Custom Dashboards", "description": "Let users drag and drop charts to create their own custom views.", "votes": 42},
        {"id": 5, "title": "Integration with Slack", "description": "Get real-time notifications in your preferred Slack channels.", "votes": 30}
    ];

    let features = JSON.parse(localStorage.getItem('features')) || defaultFeatures;
    if (!localStorage.getItem('features')) {
        localStorage.setItem('features', JSON.stringify(features));
    }

    // --- DOM ELEMENTS ---
    const navAuthContainer = document.getElementById('nav-auth-container');
    const featuresList = document.getElementById('features-list');
    const addFeatureForm = document.getElementById('add-feature-form');
    const sortSelect = document.getElementById('sort-select');

    // Splash
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen && !localStorage.getItem('seen_intro')) {
        splashScreen.classList.remove('hidden');
        setTimeout(() => {
            splashScreen.style.opacity = '0';
            setTimeout(() => {
                splashScreen.classList.add('hidden');
                localStorage.setItem('seen_intro', 'true');
            }, 500); 
        }, 3000); 
    }

    // --- SPA ROUTER ---
    function handleRouting() {
        const hash = window.location.hash || '#home';
        const targetViewId = hash.substring(1) + '-view';

        // Protected Routes
        if (hash === '#profile' && !currentUser) {
            window.location.hash = '#login';
            return;
        }

        // Hide all views
        document.querySelectorAll('.page-view').forEach(view => {
            view.classList.remove('active');
        });

        // Show target view
        const targetView = document.getElementById(targetViewId);
        if (targetView) {
            targetView.classList.add('active');
            
            // Execute view-specific logic
            if (hash === '#home') renderFeatures();
            if (hash === '#changelog') renderChangelog();
            if (hash === '#profile') renderProfile();
        } else {
            // Fallback to home
            document.getElementById('home-view').classList.add('active');
            window.location.hash = '#home';
        }

        updateNavAuth();
    }

    window.addEventListener('hashchange', handleRouting);
    
    // --- AUTHENTICATION UI ---
    function updateNavAuth() {
        if (currentUser) {
            navAuthContainer.innerHTML = `
                <a href="#profile" class="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-sky-600 transition-colors">Welcome, <b>${escapeHTML(currentUser.name)}</b></a>
                <a href="#" id="nav-logout-btn" class="text-slate-600 dark:text-slate-400 hover:text-red-600 transition-colors font-medium text-sm">Sign Out</a>
            `;
            document.getElementById('nav-logout-btn').addEventListener('click', (e) => {
                e.preventDefault();
                currentUser = null;
                localStorage.removeItem('currentUser');
                if (window.location.hash === '#profile') {
                    window.location.hash = '#login';
                }
                updateNavAuth();
            });
        } else {
            navAuthContainer.innerHTML = `
                <a href="#login" class="text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors font-medium text-sm">Sign In</a>
            `;
        }
    }

    // --- AUTHENTICATION LOGIC ---
    // Toggle UI
    document.getElementById('btn-toggle-signup')?.addEventListener('click', () => {
        document.getElementById('login-form-container').classList.add('hidden-auth');
        document.getElementById('register-form-container').classList.remove('hidden-auth');
        document.getElementById('auth-error-block').classList.add('hidden');
    });

    document.getElementById('btn-toggle-signin')?.addEventListener('click', () => {
        document.getElementById('register-form-container').classList.add('hidden-auth');
        document.getElementById('login-form-container').classList.remove('hidden-auth');
        document.getElementById('auth-error-block').classList.add('hidden');
    });

    function showAuthError(msg) {
        const box = document.getElementById('auth-error-block');
        const text = document.getElementById('auth-error-msg');
        text.innerText = msg;
        box.classList.remove('hidden');
    }

    // Sign In Handle
    document.getElementById('sign-in-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const userStr = document.getElementById('login-username').value.trim();
        const passStr = document.getElementById('login-password').value;

        if (users[userStr] && users[userStr].password === passStr) {
            currentUser = { username: userStr, ...users[userStr] };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            document.getElementById('sign-in-form').reset();
            window.location.hash = '#home';
        } else {
            showAuthError('Invalid username or password.');
        }
    });

    // Register Handle
    document.getElementById('sign-up-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const userStr = document.getElementById('reg-username').value.trim();
        const nameStr = document.getElementById('reg-name').value.trim();
        const emailStr = document.getElementById('reg-email').value.trim();
        const passStr = document.getElementById('reg-password').value;

        if (users[userStr]) {
            showAuthError('Username already exists.');
            return;
        }

        users[userStr] = { name: nameStr, email: emailStr, password: passStr };
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = { username: userStr, ...users[userStr] };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        document.getElementById('sign-up-form').reset();
        window.location.hash = '#home';
    });

    // --- PROFILE VIEW ---
    function renderProfile() {
        if (!currentUser) return;
        document.getElementById('profile-avatar').innerText = currentUser.name.charAt(0).toUpperCase();
        document.getElementById('profile-name').innerText = currentUser.name;
        document.getElementById('profile-username').innerText = '@' + currentUser.username;
        document.getElementById('profile-email').innerText = currentUser.email;
    }

    // --- FEATURES VIEW ---
    function renderFeatures() {
        const currentSort = sortSelect ? sortSelect.value : 'most_voted';
        let sortedFeatures = [...features];
        
        if (currentSort === 'newest_first') {
            sortedFeatures.sort((a, b) => b.id - a.id);
        } else if (currentSort === 'in_review') {
            sortedFeatures.sort((a, b) => a.votes - b.votes);
        } else {
            // Default "most_voted"
            sortedFeatures.sort((a, b) => b.votes - a.votes);
        }

        if (!featuresList) return;
        featuresList.innerHTML = ''; 

        if (sortedFeatures.length === 0) {
            featuresList.innerHTML = '<div class="text-center p-8 text-outline">No feature requests yet.</div>';
            return;
        }

        sortedFeatures.forEach(feature => {
            const hasVoted = votedFeatures.includes(feature.id);
            const featureElement = document.createElement('div');
            featureElement.className = `bg-surface-container-lowest p-5 rounded-2xl flex flex-col md:flex-row gap-5 border border-outline-variant/30 hover:border-outline-variant hover:shadow-md transition-all group relative overflow-hidden`;
            if (hasVoted) {
                featureElement.classList.add('border-primary/30', 'bg-primary/5');
            }

            featureElement.innerHTML = `
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary/0 group-hover:bg-primary/10 transition-colors ${hasVoted ? '!bg-primary/20' : ''}"></div>
                <div class="flex-shrink-0">
                    <button class="flex flex-col items-center justify-center p-3 rounded-xl border border-outline-variant/30 transition-all min-w-[70px] ${hasVoted ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' : 'bg-surface hover:bg-surface-container hover:border-primary/30'} vote-btn" data-id="${feature.id}">
                        <span class="material-symbols-outlined text-[20px] mb-1 ${hasVoted ? "font-bold" : ""}">expand_less</span>
                        <span class="font-bold text-lg leading-none">${feature.votes}</span>
                    </button>
                </div>
                <div class="flex-grow space-y-3">
                    <div class="flex items-center gap-3 flex-wrap">
                        <h3 class="text-lg font-bold text-on-surface feature-title">${escapeHTML(feature.title)}</h3>
                    </div>
                    <p class="text-on-surface-variant text-[15px] leading-relaxed">
                        ${escapeHTML(feature.description || 'No description provided.')}
                    </p>
                </div>
            `;
            featuresList.appendChild(featureElement);
        });

        // Add vote listeners
        document.querySelectorAll('.vote-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                handleVote(id);
            });
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', renderFeatures);
    }

    function handleVote(id) {
        if (!currentUser) {
            alert("Please log in to vote!");
            window.location.hash = '#login';
            return;
        }

        if (votedFeatures.includes(id)) {
            alert("You have already voted for this feature.");
            return;
        }

        votedFeatures.push(id);
        localStorage.setItem('votedFeatures', JSON.stringify(votedFeatures));

        const target = features.find(f => f.id === id);
        if (target) {
            target.votes += 1;
            localStorage.setItem('features', JSON.stringify(features));
            renderFeatures();
        }
    }

    // Add Feature
    addFeatureForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = document.getElementById('feature-title-input').value.trim();
        const description = document.getElementById('feature-desc-input').value.trim();
        if (!title) return;
        
        const submitBtn = addFeatureForm.querySelector('button[type="submit"]');
        const originalBtnHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Adding...</span>';
        submitBtn.disabled = true;

        setTimeout(() => {
            const nextId = features.length > 0 ? Math.max(...features.map(f => f.id)) + 1 : 1;
            const newF = { id: nextId, title, description, votes: 1 };
            
            features.push(newF);
            localStorage.setItem('features', JSON.stringify(features));
            
            // Auto vote
            votedFeatures.push(nextId);
            localStorage.setItem('votedFeatures', JSON.stringify(votedFeatures));

            document.getElementById('feature-title-input').value = '';
            document.getElementById('feature-desc-input').value = '';
            
            submitBtn.innerHTML = originalBtnHTML;
            submitBtn.disabled = false;
            
            renderFeatures();
        }, 300); // simulate network lag slightly for UX
    });


    // --- CHANGELOG VIEW ---
    function renderChangelog() {
        const totalIdeas = features.length;
        const totalVotes = features.reduce((acc, f) => acc + f.votes, 0);
        const topIdea = totalIdeas > 0 ? [...features].sort((a,b) => b.votes - a.votes)[0] : null;
        const avgVotes = totalIdeas > 0 ? (totalVotes / totalIdeas).toFixed(1) : 0;

        document.getElementById('stat-total-ideas').innerText = totalIdeas;
        document.getElementById('stat-total-votes').innerText = totalVotes;
        document.getElementById('stat-avg-votes').innerText = avgVotes;
        
        if (topIdea) {
            document.getElementById('stat-top-idea').innerText = escapeHTML(topIdea.title);
            document.getElementById('stat-top-votes').innerText = topIdea.votes + " votes";
        }

        const recentFeed = document.getElementById('changelog-recent-feed');
        if (recentFeed) {
            recentFeed.innerHTML = '';
            const recent = [...features].sort((a,b) => b.id - a.id).slice(0, 5);
            
            if (recent.length === 0) {
                recentFeed.innerHTML = '<div class="text-on-surface-variant">There are no feature requests yet.</div>';
            } else {
                recent.forEach(idea => {
                    const el = document.createElement('div');
                    el.className = "relative";
                    el.innerHTML = `
                        <div class="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-primary ring-4 ring-surface-container-lowest"></div>
                        <div class="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/20 shadow-sm">
                            <div class="flex flex-wrap items-center gap-3 mb-2">
                                <span class="bg-surface-container-high text-on-surface-variant px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">New Input</span>
                                <h4 class="font-bold text-lg text-on-surface">${escapeHTML(idea.title)}</h4>
                                <div class="ml-auto flex items-center gap-1 text-sm font-semibold text-on-surface-variant bg-surface-container p-1.5 rounded-lg px-3">
                                    <span class="material-symbols-outlined text-sm">thumb_up</span>
                                    ${idea.votes}
                                </div>
                            </div>
                            <p class="text-on-surface-variant text-sm leading-relaxed">
                                ${escapeHTML(idea.description || 'A newly suggested feature logging interest in our roadmap.')}
                            </p>
                        </div>
                    `;
                    recentFeed.appendChild(el);
                });
            }
        }
    }


    // --- UTILS ---
    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    // INITIALIZE APP
    handleRouting();
});
