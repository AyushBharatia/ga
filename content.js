// Integrated content script
'use strict';

let isInitialized = false;

// Configuration
const config = {
    delay: 3000,
    nextLinkSelectors: [
        { type: 'head', selector: 'link[rel="next"]', attribute: 'href' },
        { type: 'visible', selector: 'a.pageNav-jump.pageNav-jump--next', attribute: 'href' }
    ],

    mediaSelectors: {
        saintIframes: 'iframe.saint-iframe',
        fileLinks: 'a.link[href*="gofile.io"], a.link[href*="pixeldrain"], a.link[href*="bunkr"]',
        redgifsEmbeds: 'div[onclick*="loadMedia"][onclick*="redgifs.com/ifr"]'
    }
};

let collectedLinks = {
    saintLinks: [],
    fileLinks: [],
    redgifsLinks: []
};

// Create and inject toolbar
function injectToolbar() {
    // Check if toolbar already exists
    if (document.getElementById('link-collector-toolbar')) {
        return;
    }

    const toolbar = document.createElement('div');
    toolbar.id = 'link-collector-toolbar';
    toolbar.innerHTML = `
        <style>
            #link-collector-toolbar {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                background: linear-gradient(135deg, #2b5876 0%, #4e4376 100%);
                color: white;
                padding: 10px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                z-index: 9999;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                backdrop-filter: blur(5px);
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            #link-collector-toolbar .toolbar-title {
                font-weight: 600;
                font-size: 15px;
                margin-right: 20px;
                display: flex;
                align-items: center;
            }
            #link-collector-toolbar .toolbar-title::before {
                content: "";
                display: inline-block;
                width: 16px;
                height: 16px;
                background-color: #64B5F6;
                margin-right: 8px;
                border-radius: 50%;
                box-shadow: 0 0 10px rgba(100, 181, 246, 0.8);
            }
            #link-collector-toolbar .toolbar-controls {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
            #link-collector-toolbar button {
                padding: 7px 12px;
                background-color: rgba(255, 255, 255, 0.15);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 5px;
                cursor: pointer;
                font-weight: 500;
                font-size: 13px;
                transition: all 0.2s ease-in-out;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            #link-collector-toolbar button:hover {
                background-color: rgba(255, 255, 255, 0.25);
                transform: translateY(-2px);
                box-shadow: 0 3px 6px rgba(0,0,0,0.1);
            }
            #link-collector-toolbar button:active {
                transform: translateY(0);
            }
            #link-collector-toolbar #collect-links-btn {
                background-color: rgba(76, 175, 80, 0.2);
                border-color: rgba(76, 175, 80, 0.4);
            }
            #link-collector-toolbar #collect-links-btn:hover {
                background-color: rgba(76, 175, 80, 0.3);
            }
            #link-collector-toolbar #start-navigation-btn {
                background-color: rgba(33, 150, 243, 0.2);
                border-color: rgba(33, 150, 243, 0.4);
            }
            #link-collector-toolbar #start-navigation-btn:hover {
                background-color: rgba(33, 150, 243, 0.3);
            }
            #link-collector-toolbar #stop-navigation-btn {
                background-color: rgba(244, 67, 54, 0.2);
                border-color: rgba(244, 67, 54, 0.4);
            }
            #link-collector-toolbar #stop-navigation-btn:hover {
                background-color: rgba(244, 67, 54, 0.3);
            }
            #link-collector-toolbar #download-links-btn {
                background-color: rgba(156, 39, 176, 0.2);
                border-color: rgba(156, 39, 176, 0.4);
            }
            #link-collector-toolbar #download-links-btn:hover {
                background-color: rgba(156, 39, 176, 0.3);
            }
            #link-collector-toolbar .toolbar-stats {
                display: flex;
                gap: 15px;
                font-size: 13px;
                background: rgba(0, 0, 0, 0.2);
                padding: 7px 15px;
                border-radius: 5px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            #link-collector-toolbar .toolbar-stats span {
                display: flex;
                align-items: center;
            }
            #link-collector-toolbar .status-message {
                margin-left: 15px;
                font-style: italic;
                font-size: 13px;
                background-color: rgba(0, 0, 0, 0.15);
                padding: 5px 10px;
                border-radius: 4px;
                opacity: 0;
                transition: opacity 0.3s ease;
                max-width: 250px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            #link-collector-toolbar .status-message.visible {
                opacity: 1;
            }
            #link-collector-toolbar .count {
                font-weight: 600;
                margin-left: 5px;
                background: rgba(255, 255, 255, 0.2);
                padding: 0 6px;
                border-radius: 10px;
                min-width: 20px;
                text-align: center;
            }
            #link-collector-toolbar .main-section {
                display: flex;
                align-items: center;
            }
            #link-collector-toolbar .toggle-button {
                position: absolute;
                right: 10px;
                bottom: -28px;
                background: linear-gradient(135deg, #2b5876 0%, #4e4376 100%);
                color: white;
                border: none;
                border-bottom-left-radius: 5px;
                border-bottom-right-radius: 5px;
                padding: 5px 10px;
                font-size: 11px;
                cursor: pointer;
                opacity: 0.8;
                transition: opacity 0.2s;
                box-shadow: 0 3px 5px rgba(0,0,0,0.2);
            }
            #link-collector-toolbar .toggle-button:hover {
                opacity: 1;
            }
            body {
                margin-top: 60px !important;
            }
            #link-collector-toolbar.collapsed {
                transform: translateY(-100%);
                transition: transform 0.3s ease;
            }
            #link-collector-toolbar {
                transform: translateY(0);
                transition: transform 0.3s ease;
            }
            #link-collector-toolbar #open-player-btn {
                background-color: rgba(255, 152, 0, 0.2);
                border-color: rgba(255, 152, 0, 0.4);
            }
            #link-collector-toolbar #open-player-btn:hover {
                background-color: rgba(255, 152, 0, 0.3);
            }
            #link-collector-toolbar #autoplay-videos-btn {
                background-color: rgba(0, 188, 212, 0.2);
                border-color: rgba(0, 188, 212, 0.4);
            }
            #link-collector-toolbar #autoplay-videos-btn:hover {
                background-color: rgba(0, 188, 212, 0.3);
            }
        </style>
        <div class="main-section">
            <div class="toolbar-title">Link Collector</div>
            <div class="toolbar-controls">
                <button id="collect-links-btn">Collect Links</button>
                <button id="start-navigation-btn">Start Auto-Nav</button>
                <button id="stop-navigation-btn">Stop Nav</button>
                <button id="clear-links-btn">Clear All</button>
                <button id="download-links-btn">Download</button>
                <button id="open-player-btn">Open Player</button>
                 <button id="open-bunkr-player-btn">Bunkr Player</button>
                <button id="autoplay-videos-btn">Autoplay Videos</button>
                <span class="status-message" id="status-message"></span>
            </div>
        </div>
        <div class="toolbar-stats">
            <span>Media: <span id="media-links-count" class="count">0</span></span>
            <span>Files: <span id="file-links-count" class="count">0</span></span>
            <span>RedGifs: <span id="redgifs-links-count" class="count">0</span></span>
            <span>Total: <span id="total-links-count" class="count">0</span></span>
        </div>
        <button class="toggle-button" id="toggle-toolbar">Hide Toolbar</button>
    `;

    document.body.insertBefore(toolbar, document.body.firstChild);
    
    // Add event listeners to toolbar buttons
    document.getElementById('collect-links-btn').addEventListener('click', () => {
        const result = collectMediaLinks();
        showStatusMessage(`Collected ${result.newItemsCount} new links`);
    });

    document.getElementById('start-navigation-btn').addEventListener('click', () => {
        startAutoNavigation();
        showStatusMessage('Navigation started');
    });

    document.getElementById('stop-navigation-btn').addEventListener('click', () => {
        stopAutoNavigation();
        showStatusMessage('Navigation stopped');
    });

    document.getElementById('clear-links-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all collected links?')) {
            collectedLinks = { saintLinks: [], fileLinks: [], redgifsLinks: [] };
            saveLinks();
            updateToolbarStats();
            showStatusMessage('All links cleared');
        }
    });

    document.getElementById('download-links-btn').addEventListener('click', () => {
        downloadLinks();
        showStatusMessage('Downloading links...');
    });

    document.getElementById('open-player-btn').addEventListener('click', () => {
        chrome.runtime.sendMessage({
            action: 'openPlayer'
        });
        showStatusMessage('Opening media player...');
    });
    
    document.getElementById('autoplay-videos-btn').addEventListener('click', () => {
        tryPlayAllVideos();
        showStatusMessage('Attempting to play all videos...');
    });
    
    document.getElementById('toggle-toolbar').addEventListener('click', () => {
        const toolbar = document.getElementById('link-collector-toolbar');
        const toggleBtn = document.getElementById('toggle-toolbar');
        
        if (toolbar.classList.contains('collapsed')) {
            toolbar.classList.remove('collapsed');
            toggleBtn.textContent = 'Hide Toolbar';
            document.body.style.marginTop = '60px';
        } else {
            toolbar.classList.add('collapsed');
            toggleBtn.textContent = 'Show Toolbar';
            document.body.style.marginTop = '30px';
        }
    });

    document.getElementById('open-bunkr-player-btn').addEventListener('click', () => {
        chrome.runtime.sendMessage({
            action: 'openBunkrPlayer'
        });
        showStatusMessage('Opening media player...');
    });

    // Update stats immediately
    updateToolbarStats();
}

function showStatusMessage(message) {
    const statusEl = document.getElementById('status-message');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.classList.add('visible');
        
        // Clear the message after 3 seconds
        setTimeout(() => {
            statusEl.classList.remove('visible');
        }, 3000);
    }
}

function updateToolbarStats() {
    document.getElementById('media-links-count').textContent = collectedLinks.saintLinks.length;
    document.getElementById('file-links-count').textContent = collectedLinks.fileLinks.length;
    document.getElementById('redgifs-links-count').textContent = collectedLinks.redgifsLinks.length;
    document.getElementById('total-links-count').textContent = 
        collectedLinks.saintLinks.length + 
        collectedLinks.fileLinks.length + 
        collectedLinks.redgifsLinks.length;
}

function downloadLinks() {
    const links = {
        mediaLinks: collectedLinks.saintLinks,
        fileLinks: collectedLinks.fileLinks,
        redgifsLinks: collectedLinks.redgifsLinks
    };
    
    const blob = new Blob([JSON.stringify(links, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    chrome.runtime.sendMessage({
        action: 'downloadLinks',
        data: {
            url: url,
            filename: 'collected_links.json'
        }
    });
}

async function loadSavedLinks() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['saintLinks', 'fileLinks', 'redgifsLinks'], (result) => {
            collectedLinks.saintLinks = result.saintLinks || [];
            collectedLinks.fileLinks = result.fileLinks || [];
            collectedLinks.redgifsLinks = result.redgifsLinks || [];
            resolve();
        });
    });
}

function collectMediaLinks(){
    let newItemsCount = 0;

    document.querySelectorAll(config.mediaSelectors.saintIframes).forEach(iframe => {
        const src = iframe.getAttribute('src');
        if (src && !collectedLinks.saintLinks.includes(src)) {
            collectedLinks.saintLinks.push(src);
            newItemsCount++
        }
    });

    document.querySelectorAll(config.mediaSelectors.fileLinks).forEach(link => {
        const href = link.getAttribute('href');
        if (href && !collectedLinks.fileLinks.includes(href)){
            collectedLinks.fileLinks.push(href);
            newItemsCount++;
        }
    });

    document.querySelectorAll(config.mediaSelectors.redgifsEmbeds).forEach(div => {
        const onclickAttr = div.getAttribute('onclick');
        if (onclickAttr) {
            const match = onclickAttr.match(/loadMedia\(this,\s*'([^']+)'\)/);
            if (match && match[1]) {
                const convertedUrl = convertRedgifsUrl(match[1]);
                if (!collectedLinks.redgifsLinks.includes(convertedUrl)){
                    collectedLinks.redgifsLinks.push(convertedUrl);
                    newItemsCount++;
                }
            }
        }
    });

    saveLinks();
    updateToolbarStats();

    chrome.runtime.sendMessage({
        action: 'updateStats',
        stats: {
            saintLinks: collectedLinks.saintLinks.length,
            fileLinks: collectedLinks.fileLinks.length,
            redgifsLinks: collectedLinks.redgifsLinks.length
        }
    });

    return { newItemsCount };
}

function saveLinks(){
    chrome.storage.local.set({
        saintLinks: collectedLinks.saintLinks,
        fileLinks: collectedLinks.fileLinks,
        redgifsLinks: collectedLinks.redgifsLinks
    });
}

function findNextPageUrl(){
    for (const selectorInfo of config.nextLinkSelectors){
        const element = document.querySelector(selectorInfo.selector);
        if (element) {
            return element.getAttribute(selectorInfo.attribute) || element.href;        
        }
    }
    return null;
}

function startAutoNavigation(){
    chrome.storage.local.set({ autoNavigationActive: true});
    localStorage.setItem('mediaCollectorActive', 'true');
    
    // Collect media links first and wait for completion
    const result = collectMediaLinks();
    
    // Use setTimeout to ensure collection completes before navigation
    setTimeout(() => {
        continueNavigation();
    }, 500);
}

function continueNavigation(){
    const nextPageUrl = findNextPageUrl();
    if (!nextPageUrl) {
        stopAutoNavigation();
        showStatusMessage('Navigation stopped - no next page found');
        return;
    }

    setTimeout(() => {
        window.location.href = nextPageUrl;
    }, config.delay);
}

function stopAutoNavigation() {
    chrome.storage.local.set({ autoNavigationActive: false});
    localStorage.removeItem('mediaCollectorActive');
}

function convertRedgifsUrl(url) {
    const match = url.match(/redgifs\.com\/ifr\/([a-zA-Z0-9]+)/);
    return match && match[1] ? `https://redgifs.com/watch/${match[1]}` : url;
}

// Video autoplay functionality
function tryPlayAllVideos() {
    console.log('Attempting to play all videos on the page');
    
    const videoElements = document.querySelectorAll('video');
    console.log('Video elements found:', videoElements.length);
    
    let playedCount = 0;
    
    videoElements.forEach(video => {
        console.log('Found video:', video);
        if (video.paused) {
            console.log('Attempting to play paused video');
            video.play().then(() => {
                playedCount++;
                console.log('Successfully played video');
            }).catch(e => {
                console.error('Error playing video:', e);
            });
        } else {
            playedCount++;
        }
    });
    
    // Also try clicking on common play button elements
    const playButtons = document.querySelectorAll('.play-button, .ytp-play-button, [aria-label="Play"]');
    console.log('Play buttons found:', playButtons.length);
    
    playButtons.forEach(button => {
        console.log('Clicking play button:', button);
        button.click();
    });
    
    showStatusMessage(`Found ${videoElements.length} videos and ${playButtons.length} play buttons`);
}

function simulateClick(x, y) {
    console.log('Attempting to simulate click at:', x, y);
    
    const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y
    });
    
    const elementAtPoint = document.elementFromPoint(x, y);
    if (elementAtPoint) {
        console.log('Found element at point:', elementAtPoint);
        elementAtPoint.dispatchEvent(clickEvent);
    } else {
        console.log('No element found at the specified coordinates');
    }
}

async function init(){
    console.log('Content script running in frame:', window.location.href);
    
    await loadSavedLinks();
    chrome.storage.local.get('delay', (result) => {
        if (result.delay) config.delay = parseInt(result.delay);
    });

    // Inject toolbar after a short delay to ensure page is loaded
    const currentDomain = window.location.hostname;
    if (currentDomain.includes('simpcity.su')) {
        // Inject toolbar after a short delay to ensure page is loaded
        setTimeout(() => {
            injectToolbar();
        }, 500);
    }

    chrome.storage.local.get('autoNavigationActive', (result) => {
        if (result.autoNavigationActive) {
            setTimeout(() => {
                collectMediaLinks();
                setTimeout(continueNavigation, 1000);
            }, 1000);
        }
    });
    
    // Set up message listener for video autoplay functionality
    window.addEventListener('message', function(event) {
        console.log('Message received in content script:', event.data);
        
        if (event.data && event.data.type === 'simulateClick') {
            simulateClick(event.data.x, event.data.y);
            
            // Also try video autoplay
            tryPlayAllVideos();
        }
    });
    
    // Autoplay videos when the page loads
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM loaded in frame, looking for videos to autoplay');
        tryPlayAllVideos();
    });

    isInitialized = true;
    chrome.runtime.sendMessage({ action: 'contentScriptReady' });
}

// Message handler for extension communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'ping') {
        sendResponse({ pong: true });
        return true;
    }
    if (request.action === 'isInitialized') {
        sendResponse({ initialized: isInitialized });
        return true;
    }
    if (!isInitialized) {
        sendResponse({ error: 'Content script not yet initialized' });
        return true;
    }
    if (request.action === 'collectLinks') {
        const result = collectMediaLinks();
        sendResponse({ success: true, message: `Collected ${result.newItemsCount} new links` });
    } else if (request.action === 'startNavigation') {
        startAutoNavigation();
        sendResponse({ success: true, message: 'Navigation started' });
    } else if (request.action === 'stopNavigation') {
        stopAutoNavigation();
        sendResponse({ success: true, message: 'Navigation stopped' });
    } else if (request.action === 'clearLinks') {
        collectedLinks = { saintLinks: [], fileLinks: [], redgifsLinks: [] };
        saveLinks();
        sendResponse({ success: true, message: 'All links cleared' });
    } else if (request.action === 'getStats') {
        sendResponse({
            saintLinks: collectedLinks.saintLinks.length,
            fileLinks: collectedLinks.fileLinks.length,
            redgifsLinks: collectedLinks.redgifsLinks.length,
            totalLinks: collectedLinks.saintLinks.length + collectedLinks.fileLinks.length + collectedLinks.redgifsLinks.length
        });
    } else if (request.action === 'tryPlayVideos') {
        tryPlayAllVideos();
        sendResponse({ success: true, message: 'Attempting to play videos' });
    } else if (request.action === 'simulateClick' && request.x !== undefined && request.y !== undefined) {
        simulateClick(request.x, request.y);
        sendResponse({ success: true, message: 'Click simulated' });
    }
    return true;
});

init();