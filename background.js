// background.js
'use strict';

// Initialize the extension when installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    saintLinks: [],
    fileLinks: [],
    redgifsLinks: [],
    autoNavigationActive: false,
    delay: 3000
  });
  console.log("Extension installed and initialized");
  
  // Create player.html page in the extension
  chrome.scripting.registerContentScripts([{
    id: "saint-player-script",
    matches: ["chrome-extension://*/player.html"],
    js: ["player.js"],
    runAt: "document_end"
  }]);
});

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateStats') {
    // Update the badge with total links count
    const totalLinks = 
      (request.stats.saintLinks || 0) + 
      (request.stats.fileLinks || 0) + 
      (request.stats.redgifsLinks || 0);
      
    chrome.action.setBadgeText({ 
      text: totalLinks.toString(),
      tabId: sender.tab.id
    });
    
    chrome.action.setBadgeBackgroundColor({ 
      color: '#4285F4',
      tabId: sender.tab.id 
    });
    
    sendResponse({success: true});
    return true;
  }
  
  if (request.action === 'downloadLinks') {
    chrome.downloads.download({
      url: request.data.url,
      filename: request.data.filename,
      saveAs: true
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error("Download error:", chrome.runtime.lastError);
      }
    });
    
    sendResponse({success: true});
    return true;
  }
  
  if (request.action === 'openPlayer') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('player.html')
    });
    sendResponse({success: true});
    return true;
  }
  
  if (request.action === 'contentScriptReady') {
    console.log("Content script ready in tab:", sender.tab.id);
    sendResponse({acknowledged: true});
    return true;
  }
});

// Handle errors for all message passing
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  // Handle messages from external sources if needed
  sendResponse({error: "External messaging not supported"});
  return true;
});

// Background script for the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openBunkrPlayer') {
      // Create and open the player in a new tab
      chrome.tabs.create({ url: 'bunkr-player.html' }, (tab) => {
          console.log('Opened player in new tab:', tab.id);
      });
      return true;
  } else if (request.action === 'downloadLinks') {
      // Handle download request
      chrome.downloads.download({
          url: request.data.url,
          filename: request.data.filename,
          saveAs: false
      });
      return true;
  } else if (request.action === 'updateStats') {
      // Update badge with total links
      const total = request.stats.saintLinks + request.stats.fileLinks + request.stats.redgifsLinks;
      chrome.action.setBadgeText({ text: total.toString() });
      return true;
  }
});

// Handle installation or update
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed or updated');
  
  // Set default badge background
  chrome.action.setBadgeBackgroundColor({ color: '#4e4376' });
});