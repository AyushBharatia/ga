// popup.js
document.addEventListener('DOMContentLoaded', function() {
    const targetSiteControls = document.getElementById('targetSiteControls');
    const otherSiteMessage = document.getElementById('otherSiteMessage');
    
    // Check if the current site is the target site
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentUrl = tabs[0].url;
      const isTargetSite = currentUrl.includes('simpcity.su'); // Replace with your target website
      
      if (isTargetSite) {
        targetSiteControls.classList.remove('hidden');
        otherSiteMessage.classList.add('hidden');
        
        // Check if content script is ready before updating stats
        checkContentScriptReady(tabs[0].id, function(ready) {
          if (ready) {
            updateStats();
          } else {
            console.log("Content script not ready");
            document.getElementById('statusMessage').textContent = "Extension not fully loaded on this page. Try refreshing.";
          }
        });
      } else {
        targetSiteControls.classList.add('hidden');
        otherSiteMessage.classList.remove('hidden');
      }
    });
    
    // Event listeners for buttons
    document.getElementById('collectLinks').addEventListener('click', collectLinks);
    document.getElementById('startNavigation').addEventListener('click', startNavigation);
    document.getElementById('stopNavigation').addEventListener('click', stopNavigation);
    document.getElementById('clearLinks').addEventListener('click', clearLinks);
    document.getElementById('downloadLinks').addEventListener('click', downloadLinks);
  });
  
  // Check if content script is ready
  function checkContentScriptReady(tabId, callback) {
    try {
      chrome.tabs.sendMessage(tabId, {action: 'ping'}, function(response) {
        if (chrome.runtime.lastError) {
          callback(false);
          return;
        }
        callback(response && response.pong);
      });
    } catch (e) {
      callback(false);
    }
  }
  
  function collectLinks() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'collectLinks'}, function(response) {
        if (chrome.runtime.lastError) {
          console.log("Error:", chrome.runtime.lastError);
          return;
        }
        if (response && response.success) {
          updateStats();
        }
      });
    });
  }
  
  function startNavigation() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'startNavigation'}, function(response) {
        if (chrome.runtime.lastError) {
          console.log("Error:", chrome.runtime.lastError);
          return;
        }
        if (response && response.success) {
          updateStats();
        }
      });
    });
  }
  
  function stopNavigation() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'stopNavigation'}, function(response) {
        if (chrome.runtime.lastError) {
          console.log("Error:", chrome.runtime.lastError);
          return;
        }
        if (response && response.success) {
          updateStats();
        }
      });
    });
  }
  
  function clearLinks() {
    if (confirm('Are you sure you want to clear all collected links?')) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'clearLinks'}, function(response) {
          if (chrome.runtime.lastError) {
            console.log("Error:", chrome.runtime.lastError);
            return;
          }
          if (response && response.success) {
            updateStats();
          }
        });
      });
    }
  }
  
  function downloadLinks() {
    chrome.storage.local.get(['saintLinks', 'fileLinks', 'redgifsLinks'], function(result) {
      const links = {
        mediaLinks: result.saintLinks || [],
        fileLinks: result.fileLinks || [],
        redgifsLinks: result.redgifsLinks || []
      };
      
      const blob = new Blob([JSON.stringify(links, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      
      // Send message to background script to handle download
      chrome.runtime.sendMessage({
        action: 'downloadLinks',
        data: {
          url: url,
          filename: 'collected_links.json'
        }
      });
    });
  }
  
  function updateStats() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      try {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'getStats'}, function(response) {
          if (chrome.runtime.lastError) {
            console.log("Error updating stats:", chrome.runtime.lastError);
            return;
          }
          if (response) {
            document.getElementById('mediaLinks').textContent = response.saintLinks || 0;
            document.getElementById('fileLinks').textContent = response.fileLinks || 0;
            document.getElementById('redgifsLinks').textContent = response.redgifsLinks || 0;
            document.getElementById('totalLinks').textContent = response.totalLinks || 0;
          }
        });
      } catch (e) {
        console.error("Exception in updateStats:", e);
      }
    });
  }