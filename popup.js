// popup.js
document.addEventListener('DOMContentLoaded', function() {
  // Load and display stats from storage
  updateStatsFromStorage();
  
  // Add event listener for the "Open Media Player" button
  const openPlayerBtn = document.getElementById('openPlayerBtn');
  openPlayerBtn.addEventListener('click', openMediaPlayer);
  
  // Check if there are any saint links and disable the button if none
  chrome.storage.local.get(['saintLinks'], function(result) {
    const saintLinks = result.saintLinks || [];
    openPlayerBtn.disabled = saintLinks.length === 0;
    if (saintLinks.length === 0) {
      openPlayerBtn.title = "No media links to play";
    }
  });
});

function updateStatsFromStorage() {
  chrome.storage.local.get(['saintLinks', 'fileLinks', 'redgifsLinks'], function(result) {
    document.getElementById('mediaLinks').textContent = (result.saintLinks || []).length;
    document.getElementById('fileLinks').textContent = (result.fileLinks || []).length;
    document.getElementById('redgifsLinks').textContent = (result.redgifsLinks || []).length;
    
    const totalLinks = 
      (result.saintLinks || []).length + 
      (result.fileLinks || []).length + 
      (result.redgifsLinks || []).length;
    
    document.getElementById('totalLinks').textContent = totalLinks;
  });
}

function openMediaPlayer() {
  chrome.runtime.sendMessage({
    action: 'openPlayer'
  });
  
  // Close the popup after opening the player
  window.close();
}