document.addEventListener('DOMContentLoaded', () => {
    const featuresList = document.getElementById('features-list');
    const addFeatureForm = document.getElementById('add-feature-form');
    const featureTitleInput = document.getElementById('feature-title-input');
    const featureDescInput = document.getElementById('feature-desc-input');

    // Get voted features from localStorage to persist user's choices
    let votedFeatures = JSON.parse(localStorage.getItem('votedFeatures')) || [];

    const sortSelect = document.getElementById('sort-select');

    // Fetch and render features
    async function loadFeatures() {
        try {
            const currentSort = sortSelect ? sortSelect.value : 'most_voted';
            const response = await fetch(`/api/features?sort=${currentSort}`);
            const features = await response.json();
            renderFeatures(features);
        } catch (error) {
            console.error('Error loading features:', error);
            featuresList.innerHTML = '<div class="loading">Failed to load features. Please try again later.</div>';
        }
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            featuresList.innerHTML = '<div class="text-center p-8 text-outline">Loading features...</div>';
            loadFeatures();
        });
    }

    // Render features to the DOM
    function renderFeatures(features) {
        featuresList.innerHTML = ''; // Clear loading state
        
        if (features.length === 0) {
            featuresList.innerHTML = '<div class="loading">No features requested yet. Be the first!</div>';
            return;
        }

        features.forEach((feature, index) => {
            const isVoted = votedFeatures.includes(feature.id);
            
            const featureEl = document.createElement('div');
            featureEl.className = `bg-surface-container-lowest p-6 rounded-lg shadow-[0_20px_40px_-12px_rgba(25,28,30,0.06)] flex gap-6 items-start transition-transform hover:-translate-y-1 duration-300 feature-item ${isVoted ? 'voted' : ''}`;
            
            featureEl.innerHTML = `
                <div class="vote-btn flex flex-col items-center gap-1 bg-surface-container-low vote-btn-inner p-3 rounded-lg min-w-[64px] border border-transparent hover:border-primary/20 transition-colors group cursor-pointer" data-id="${feature.id}" ${isVoted ? 'title="You have already voted for this" style="cursor: default;"' : 'title="Upvote this feature"'}>
                    <span class="vote-icon material-symbols-outlined text-outline group-hover:-translate-y-1 transition-transform">expand_less</span>
                    <span class="text-xl font-extrabold text-on-surface vote-count">${feature.votes}</span>
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
            
            featuresList.appendChild(featureEl);
        });

        // Add event listeners to vote buttons
        document.querySelectorAll('.vote-btn').forEach(btn => {
            btn.addEventListener('click', handleVote);
        });
    }

    // Handle upvoting
    async function handleVote(e) {
        const btn = e.currentTarget;
        const featureId = parseInt(btn.getAttribute('data-id'));
        
        if (votedFeatures.includes(featureId)) return; // Prevent double voting locally
        
        // Optimistic UI update
        btn.disabled = true;
        const voteCountSpan = btn.querySelector('.vote-count');
        const currentVotes = parseInt(voteCountSpan.textContent);
        voteCountSpan.textContent = currentVotes + 1;
        btn.closest('.feature-item').classList.add('voted');
        
        // Save to local storage
        votedFeatures.push(featureId);
        localStorage.setItem('votedFeatures', JSON.stringify(votedFeatures));
        
        try {
            await fetch(`/api/features/${featureId}/vote`, {
                method: 'POST'
            });
            // Re-fetch to sort properly
            loadFeatures();
        } catch (error) {
            console.error('Error voting:', error);
            // Revert on failure
            btn.disabled = false;
            voteCountSpan.textContent = currentVotes;
            btn.closest('.feature-item').classList.remove('voted');
            votedFeatures = votedFeatures.filter(id => id !== featureId);
            localStorage.setItem('votedFeatures', JSON.stringify(votedFeatures));
        }
    }

    // Handle new feature submission
    addFeatureForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = featureTitleInput.value.trim();
        const description = featureDescInput.value.trim();
        if (!title) return;
        
        const submitBtn = addFeatureForm.querySelector('button[type="submit"]');
        const originalBtnHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Adding...</span>';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/features', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, description })
            });
            
            if (response.ok) {
                const newFeature = await response.json();
                
                // Automatically vote for your own feature
                votedFeatures.push(newFeature.id);
                localStorage.setItem('votedFeatures', JSON.stringify(votedFeatures));
                
                featureTitleInput.value = '';
                featureDescInput.value = '';
                loadFeatures();
            }
        } catch (error) {
            console.error('Error adding feature:', error);
            alert('Failed to add feature. Please try again.');
        } finally {
            submitBtn.innerHTML = originalBtnHTML;
            submitBtn.disabled = false;
        }
    });

    // Helper function to prevent XSS
    function escapeHTML(str) {
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

    // Initial load
    loadFeatures();
    
    // Optional: Auto-refresh every 10 seconds to keep it "real-time" synced with backend
    setInterval(loadFeatures, 10000);
});
