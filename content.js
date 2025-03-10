// content.js
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

async function init(){
    await loadSavedLinks();
    chrome.storage.local.get('delay', (result) => {
        if (result.delay) config.delay = parseInt(result.delay);
    });

    chrome.storage.local.get('autoNavigationActive', (result) => {
        if (result.autoNavigationActive) {
            setTimeout(() => {
                collectMediaLinks();
                setTimeout(continueNavigation, 1000);
            }, 1000);
        }
    });

    isInitialized = true;
    chrome.runtime.sendMessage({ action: 'contentScriptReady' });
}

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
    }
    return true;
});

init();