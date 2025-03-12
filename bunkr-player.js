// Player state
const state = {
    links: {
        saintLinks: [],
        fileLinks: [],
        redgifsLinks: []
    },
    currentType: 'saintLinks',
    currentIndex: 0,
    isPlaying: false
};

// DOM elements
const mediaPlayer = document.getElementById('media-player');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const playPauseBtn = document.getElementById('play-pause-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const currentTypeEl = document.getElementById('current-type');
const currentPositionEl = document.getElementById('current-position');
const totalLinksEl = document.getElementById('total-links');
const currentUrlEl = document.getElementById('current-url');
const statusMessageEl = document.getElementById('status-message');
const statsEl = document.getElementById('stats');
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const linkTypeButtons = document.querySelectorAll('.link-type-btn');

// Helper functions
function showStatusMessage(message, isError = false) {
    statusMessageEl.textContent = message;
    statusMessageEl.classList.add('visible');
    
    if (isError) {
        statusMessageEl.classList.add('error');
    } else {
        statusMessageEl.classList.remove('error');
    }
    
    setTimeout(() => {
        statusMessageEl.classList.remove('visible');
    }, 3000);
}

function updateStats() {
    const totalStats = Object.keys(state.links).reduce((total, type) => {
        return total + state.links[type].length;
    }, 0);
    
    statsEl.textContent = `Total Links: ${totalStats} (Saint: ${state.links.saintLinks.length}, Files: ${state.links.fileLinks.length}, RedGifs: ${state.links.redgifsLinks.length})`;
}

function updateLinkTypeButtons() {
    linkTypeButtons.forEach(btn => {
        const type = btn.dataset.type;
        if (type === state.currentType) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function updateControls() {
    currentTypeEl.textContent = state.currentType.replace('Links', '');
    currentPositionEl.textContent = state.links[state.currentType].length > 0 ? state.currentIndex + 1 : 0;
    totalLinksEl.textContent = state.links[state.currentType].length;
    
    const currentUrl = state.links[state.currentType][state.currentIndex] || 'No link loaded';
    currentUrlEl.textContent = currentUrl;
}

function loadMedia() {
    const links = state.links[state.currentType];
    
    if (links.length === 0) {
        mediaPlayer.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100%; flex-direction: column;">
                <p>No media available for this type</p>
                <p style="font-size: 14px; opacity: 0.7;">Try selecting a different link type or uploading a new file</p>
            </div>
        `;
        return;
    }
    
    const url = links[state.currentIndex];
    
    if (!url) {
        showStatusMessage('Invalid link', true);
        return;
    }
    
    mediaPlayer.innerHTML = `
        <div class="loading-indicator">
            <div class="spinner"></div>
            <p>Loading media...</p>
        </div>
    `;
    
    try {
        // Handle different media types
        if (state.currentType === 'saintLinks') {
            // Assuming saint links are iframe embeds
            const iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.allowFullscreen = true;
            mediaPlayer.innerHTML = '';
            mediaPlayer.appendChild(iframe);
        } else if (state.currentType === 'redgifsLinks') {
            // For RedGifs, we'll embed the watch URL
            const iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.allowFullscreen = true;
            mediaPlayer.innerHTML = '';
            mediaPlayer.appendChild(iframe);
        } else {
            // For file links, we'll try to use HTML5 video player
            if (url.match(/\.(mp4|webm|ogg)$/i)) {
                const video = document.createElement('video');
                video.src = url;
                video.controls = true;
                video.autoplay = true;
                mediaPlayer.innerHTML = '';
                mediaPlayer.appendChild(video);
            } else if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                // Handle images
                const img = document.createElement('img');
                img.src = url;
                img.style.maxWidth = '100%';
                img.style.maxHeight = '100%';
                img.style.margin = 'auto';
                img.style.display = 'block';
                mediaPlayer.innerHTML = '';
                mediaPlayer.appendChild(img);
            } else {
                // Default to iframe for other file types
                const iframe = document.createElement('iframe');
                iframe.src = url;
                iframe.allowFullscreen = true;
                mediaPlayer.innerHTML = '';
                mediaPlayer.appendChild(iframe);
            }
        }
        
        updateControls();
        
    } catch (error) {
        console.error('Error loading media:', error);
        showStatusMessage('Error loading media', true);
    }
}

function prevMedia() {
    const links = state.links[state.currentType];
    if (links.length === 0) return;
    
    state.currentIndex = (state.currentIndex - 1 + links.length) % links.length;
    loadMedia();
}

function nextMedia() {
    const links = state.links[state.currentType];
    if (links.length === 0) return;
    
    state.currentIndex = (state.currentIndex + 1) % links.length;
    loadMedia();
}

function togglePlayPause() {
    const videoElement = mediaPlayer.querySelector('video');
    if (videoElement) {
        if (videoElement.paused) {
            videoElement.play();
            state.isPlaying = true;
        } else {
            videoElement.pause();
            state.isPlaying = false;
        }
    }
}

function toggleFullscreen() {
    const currentMedia = mediaPlayer.querySelector('iframe') || mediaPlayer.querySelector('video');
    
    if (!document.fullscreenElement) {
        if (currentMedia) {
            currentMedia.requestFullscreen().catch(err => {
                showStatusMessage('Error attempting to enable fullscreen: ' + err.message, true);
            });
        } else {
            mediaPlayer.requestFullscreen().catch(err => {
                showStatusMessage('Error attempting to enable fullscreen: ' + err.message, true);
            });
        }
    } else {
        document.exitFullscreen();
    }
}

function loadLinksFromFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Check if the file has the expected format
            if (data.mediaLinks || data.fileLinks || data.redgifsLinks) {
                state.links.saintLinks = data.mediaLinks || [];
                state.links.fileLinks = data.fileLinks || [];
                state.links.redgifsLinks = data.redgifsLinks || [];
                
                state.currentIndex = 0;
                updateStats();
                updateControls();
                loadMedia();
                
                showStatusMessage(`Loaded ${state.links.saintLinks.length + state.links.fileLinks.length + state.links.redgifsLinks.length} links`);
            } else {
                showStatusMessage('Invalid JSON format', true);
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
            showStatusMessage('Error parsing JSON file', true);
        }
    };
    
    reader.readAsText(file);
}

function loadFromStorage() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['saintLinks', 'fileLinks', 'redgifsLinks'], (result) => {
            state.links.saintLinks = result.saintLinks || [];
            state.links.fileLinks = result.fileLinks || [];
            state.links.redgifsLinks = result.redgifsLinks || [];
            resolve();
        });
    });
}

// Event listeners
prevBtn.addEventListener('click', prevMedia);
nextBtn.addEventListener('click', nextMedia);
playPauseBtn.addEventListener('click', togglePlayPause);
fullscreenBtn.addEventListener('click', toggleFullscreen);

uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        loadLinksFromFile(e.target.files[0]);
    }
});

linkTypeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        state.currentType = type;
        state.currentIndex = 0;
        
        updateLinkTypeButtons();
        updateControls();
        loadMedia();
    });
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        prevMedia();
    } else if (e.key === 'ArrowRight') {
        nextMedia();
    } else if (e.key === ' ') {
        togglePlayPause();
        e.preventDefault(); // Prevent space from scrolling
    } else if (e.key === 'f') {
        toggleFullscreen();
    }
});

// Initialize
async function initialize() {
    try {
        await loadFromStorage();
        updateStats();
        updateControls();
        updateLinkTypeButtons();
        
        // If we have links, load the first one
        if (state.links[state.currentType].length > 0) {
            loadMedia();
        } else {
            mediaPlayer.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; height: 100%; flex-direction: column;">
                    <p>No links available</p>
                    <p style="font-size: 14px; opacity: 0.7;">Try collecting some links first</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error initializing player:', error);
        showStatusMessage('Error loading links', true);
    }
}

initialize();