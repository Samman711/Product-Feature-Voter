const defaultFeatures = [
    { id: 1, title: 'Dark Mode Support', desc: 'Add a beautiful dark theme for late-night users.', details: 'Includes pure black AMOLED modes, customizable accent colors, and automatic switching based on system preference.', votes: 42, colorIndex: 0 },
    { id: 2, title: 'Offline Mode', desc: 'Allow users to access core features without internet.', details: 'Provides intelligent caching of data via Service Workers so you can browse existing content, create drafts, and auto-sync when back online.', votes: 35, colorIndex: 1 },
    { id: 3, title: 'Analytics Dashboard', desc: 'Detailed insights and usage statistics.', details: 'A comprehensive chart view providing weekly usage stats, real-time activity views, and exportable CSV reports.', votes: 28, colorIndex: 2 },
    { id: 4, title: 'Third-Party Integrations', desc: 'Connect with Slack, Trello, and more.', details: 'Seamlessly push notifications to Slack channels, sync tasks with Trello boards, and link Jira issues with one click.', votes: 15, colorIndex: 3 },
    { id: 5, title: 'Custom Themes', desc: 'Let users craft their own UI themes.', details: 'Create your own color palettes, typography pairs, and UI border radius options to ensure the app matches your brand.', votes: 10, colorIndex: 4 }
];

let features = [];
let userVotes = [];
try {
    const saved = localStorage.getItem('features');
    if (saved) {
        features = JSON.parse(saved);
    }
    const savedVotes = localStorage.getItem('userVotes');
    if (savedVotes) {
        userVotes = JSON.parse(savedVotes);
    }
} catch (e) {
    console.error("Local storage error:", e);
}

if (!features || features.length === 0) {
    features = defaultFeatures;
}

const container = document.getElementById('features-container');
const bgOverlay = document.getElementById('bg-overlay');
let sectionObserver;

function createFeatureElement(feature) {
    const section = document.createElement('section');
    section.className = 'feature-section';
    section.dataset.id = feature.id;
    section.dataset.colorIndex = feature.colorIndex !== undefined ? feature.colorIndex : (feature.id % 5);
    
    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V6M5 12l7-7 7 7"/></svg>`;
    const chevronIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    
    const detailsText = feature.details ? feature.details : 'No additional information provided.';
    const hasVoted = userVotes.includes(feature.id);
    const voteBtnClass = hasVoted ? 'vote-btn voted' : 'vote-btn';

    section.innerHTML = `
        <div class="feature-card">
            <div class="feature-info">
                <h2>${feature.title}</h2>
                <p>${feature.desc}</p>
                <button class="expand-btn" onclick="toggleDetails(this)">
                    <span>Show More Info</span>
                    ${chevronIcon}
                </button>
                <div class="feature-details-wrapper">
                    <div class="feature-details-content">${detailsText}</div>
                </div>
            </div>
            <div class="vote-container">
                <button class="${voteBtnClass}" onclick="handleVote(${feature.id}, this)">
                    ${svgIcon}
                </button>
                <div class="vote-count">${feature.votes}</div>
            </div>
        </div>
    `;
    return section;
}

function initRender() {
    container.innerHTML = '';
    // Sort highest votes first
    features.sort((a, b) => b.votes - a.votes);
    
    features.forEach(feature => {
        container.appendChild(createFeatureElement(feature));
    });

    setupObserver();
}

function handleVote(id, btnElement) {
    const feature = features.find(f => f.id === id);
    if (!feature) return;

    const hasVoted = userVotes.includes(id);

    if (hasVoted) {
        // Unvote
        feature.votes -= 1;
        userVotes = userVotes.filter(vId => vId !== id);
        btnElement.classList.remove('voted');
    } else {
        // Vote
        feature.votes += 1;
        userVotes.push(id);
        btnElement.classList.add('voted');
        
        // Add visual ripple briefly
        btnElement.style.transform = 'scale(0.9)';
        setTimeout(() => btnElement.style.transform = '', 150);
    }

    localStorage.setItem('features', JSON.stringify(features));
    localStorage.setItem('userVotes', JSON.stringify(userVotes));

    // Perform FLIP Animation for real-time reordering
    const sections = Array.from(container.children);
    const firstPositions = {};
    
    sections.forEach(sec => {
        firstPositions[sec.dataset.id] = sec.getBoundingClientRect().top;
    });

    // Re-sort data
    features.sort((a, b) => b.votes - a.votes);
    
    // Reorder DOM Nodes
    features.forEach(f => {
        const sec = document.querySelector(`.feature-section[data-id='${f.id}']`);
        if (sec) {
            container.appendChild(sec);
            // Update the text for vote count
            sec.querySelector('.vote-count').textContent = f.votes;
        }
    });

    // Calculate new positions and animate
    sections.forEach(sec => {
        const newPos = sec.getBoundingClientRect().top;
        const oldPos = firstPositions[sec.dataset.id];
        const delta = oldPos - newPos;

        if (delta !== 0) {
            // Invert
            sec.style.transform = `translateY(${delta}px)`;
            sec.style.transition = 'none';
            
            // Play
            requestAnimationFrame(() => {
                sec.style.transform = '';
                sec.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            });
        }
    });
}

function setupObserver() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5 // trigger when 50% visible
    };

    sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Animate card up
                const card = entry.target.querySelector('.feature-card');
                if (card) {
                    card.classList.add('visible');
                }
                
                // Smooth Background Transition based on active element
                const colorIndex = entry.target.dataset.colorIndex % 5;
                bgOverlay.className = `bg-overlay bg-color-${colorIndex}`;
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-section').forEach(section => {
        sectionObserver.observe(section);
    });
}

// Handle Add Feature Form
document.getElementById('add-feature-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const titleInput = document.getElementById('feature-title');
    const descInput = document.getElementById('feature-desc');
    const detailsInput = document.getElementById('feature-details');

    const newFeature = {
        id: Date.now(),
        title: titleInput.value.trim(),
        desc: descInput.value.trim(),
        details: detailsInput ? detailsInput.value.trim() : '',
        votes: 0,
        colorIndex: features.length % 5
    };

    if (!newFeature.title || !newFeature.desc) return;

    features.push(newFeature);
    // Sort array (will effectively put 0 votes at bottom)
    features.sort((a, b) => b.votes - a.votes);
    
    // Save state
    localStorage.setItem('features', JSON.stringify(features));

    // Create element
    const newEl = createFeatureElement(newFeature);
    container.appendChild(newEl);
    
    // Observe new element
    sectionObserver.observe(newEl);

    // Clear form
    titleInput.value = '';
    descInput.value = '';
    if (detailsInput) detailsInput.value = '';
    
    // Scroll to new feature natively
    newEl.scrollIntoView({ behavior: 'smooth' });
});

// Initialize
initRender();

// --- Scroll Sequence Animation ---
const canvas = document.getElementById('scroll-canvas');
const context = canvas.getContext('2d');
const frameCount = 168;
const images = [];

const currentFrame = index => (
  `ezgif-151182912e6a8577-jpg/ezgif-frame-${index.toString().padStart(3, '0')}.jpg`
);

// Preload all images
for (let i = 1; i <= frameCount; i++) {
  const img = new Image();
  img.src = currentFrame(i);
  images.push(img);
}

// Initial draw once first image loads
images[0].onload = () => {
  canvas.width = images[0].width || 1920;
  canvas.height = images[0].height || 1080;
  context.drawImage(images[0], 0, 0);
};

// Handle Scroll with requestAnimationFrame
let ticking = false;

window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      updateSequenceImage(window.scrollY);
      ticking = false;
    });
    ticking = true;
  }
});

function updateSequenceImage(scrollY) {
  // Define how many scroll pixels roughly map to a single frame
  const pixelsPerFrame = 15;
  
  // Calculate raw theoretical frame index based on absolute scroll
  let rawFrameIndex = Math.floor(scrollY / pixelsPerFrame);
  
  // Handle negative values cleanly if there is rubber-banding (e.g. on macOS)
  if (rawFrameIndex < 0) {
      rawFrameIndex = 0;
  }
  
  // Apply ping-pong loop effect
  const cycleLength = (frameCount - 1) * 2;
  const modIndex = rawFrameIndex % cycleLength;
  
  const safeFrameIndex = modIndex < frameCount ? modIndex : cycleLength - modIndex;
  
  if (images[safeFrameIndex] && images[safeFrameIndex].complete) {
    // If the image is loaded, draw it
    if (canvas.width !== images[0].width && images[0].width > 0) {
        canvas.width = images[0].width;
        canvas.height = images[0].height;
    }
    context.drawImage(images[safeFrameIndex], 0, 0, canvas.width, canvas.height);
  }
}

// Toggle Details Function
window.toggleDetails = function(btn) {
    const wrapper = btn.nextElementSibling;
    const isExpanded = wrapper.classList.contains('expanded');
    
    if (isExpanded) {
        wrapper.classList.remove('expanded');
        btn.classList.remove('expanded');
        btn.querySelector('span').textContent = 'Show More Info';
    } else {
        wrapper.classList.add('expanded');
        btn.classList.add('expanded');
        btn.querySelector('span').textContent = 'Show Less Info';
    }
};

