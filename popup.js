// popup.js
document.addEventListener('DOMContentLoaded', function() {
    // Load and display stats from storage
    updateStatsFromStorage();
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