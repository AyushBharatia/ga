'use strict';

class SaintLinksPlayer {
  constructor() {
    this.links = [];
    this.favoriteLinks = [];
    this.currentIndex = 0;
    this.isLoaded = false;
    
    // DOM elements
    this.playerContainer = document.getElementById('player-container');
    this.nextButton = document.getElementById('next-btn');
    this.prevButton = document.getElementById('prev-btn');
    this.randomButton = document.getElementById('random-btn');
    this.favoriteButton = document.getElementById('favorite-btn');
    this.downloadButton = document.getElementById('download-btn');
    this.fullscreenButton = document.getElementById('fullscreen-btn');
    this.currentCountElement = document.getElementById('current-count');
    this.progressBar = document.getElementById('progress-bar');
    
    // Initialize
    this.setupEventListeners();
    this.loadLinks();
    this.loadFavorites();
  }
  
  setupEventListeners() {
    this.nextButton.addEventListener('click', () => this.nextVideo());
    this.prevButton.addEventListener('click', () => this.prevVideo());
    this.randomButton.addEventListener('click', () => this.randomVideo());
    this.favoriteButton.addEventListener('click', () => this.toggleFavorite());
    this.downloadButton.addEventListener('click', () => this.downloadVideo());
    this.fullscreenButton.addEventListener('click', () => this.toggleFullscreen());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'ArrowRight':
          this.nextVideo();
          break;
        case 'ArrowLeft':
          this.prevVideo();
          break;
        case 'r':
        case 'R':
          this.randomVideo();
          break;
        case 'f':
        case 'F':
          this.toggleFullscreen();
          break;
        case 'd':
        case 'D':
          this.downloadVideo();
          break;
        case 's':
        case 'S':
          this.toggleFavorite();
          break;
      }
    });
  }
  
  async loadLinks() {
    // Get links from Chrome storage
    try {
      const result = await this.getFromStorage(['saintLinks']);
      this.links = result.saintLinks || [];
      
      // Update UI based on links
      if (this.links.length > 0) {
        this.isLoaded = true;
        this.updateProgressBar();
        this.loadVideo(0);
      } else {
        this.showNoLinksMessage();
      }
    } catch (error) {
      console.error('Error loading links:', error);
      this.showErrorMessage(error);
    }
  }
  
  async loadFavorites() {
    // Get favorite links from Chrome storage
    try {
      const result = await this.getFromStorage(['favoriteLinks']);
      this.favoriteLinks = result.favoriteLinks || [];
      this.updateFavoriteButtonState();
    } catch (error) {
      console.error('Error loading favorites:', error);
      this.favoriteLinks = [];
    }
  }
  
  getFromStorage(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (result) => {
        resolve(result);
      });
    });
  }
  
  loadVideo(index) {
    if (!this.isLoaded || this.links.length === 0) return;
    
    // Ensure index is within bounds
    this.currentIndex = this.normalizeIndex(index);
    
    // Clear current content
    this.playerContainer.innerHTML = '';
    
    // Create iframe for the current link
    const iframe = document.createElement('iframe');
    iframe.src = this.links[this.currentIndex];
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('frameborder', '0');
    
    // Add iframe to container
    this.playerContainer.appendChild(iframe);
    
    // Update UI
    this.updateProgressBar();
    this.updateFavoriteButtonState();
  }
  
  nextVideo() {
    this.loadVideo(this.currentIndex + 1);
  }
  
  prevVideo() {
    this.loadVideo(this.currentIndex - 1);
  }
  
  randomVideo() {
    if (!this.isLoaded || this.links.length === 0) return;
    
    // Generate a random index different from the current one
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * this.links.length);
    } while (randomIndex === this.currentIndex && this.links.length > 1);
    
    this.loadVideo(randomIndex);
  }
  
  toggleFavorite() {
    if (!this.isLoaded || this.links.length === 0) return;
    
    const currentLink = this.links[this.currentIndex];
    const isFavorite = this.favoriteLinks.includes(currentLink);
    
    if (isFavorite) {
      // Remove from favorites
      this.favoriteLinks = this.favoriteLinks.filter(link => link !== currentLink);
      this.showStatusMessage('Removed from favorites');
    } else {
      // Add to favorites
      this.favoriteLinks.push(currentLink);
      this.showStatusMessage('Added to favorites');
    }
    
    // Save to storage
    chrome.storage.local.set({ favoriteLinks: this.favoriteLinks });
    
    // Update button state
    this.updateFavoriteButtonState();
  }
  
  updateFavoriteButtonState() {
    if (!this.isLoaded || this.links.length === 0) return;
    
    const currentLink = this.links[this.currentIndex];
    const isFavorite = this.favoriteLinks.includes(currentLink);
    
    // Update button UI based on favorite status
    if (isFavorite) {
      this.favoriteButton.textContent = '★ Favorite';
      this.favoriteButton.style.backgroundColor = 'rgba(255, 193, 7, 0.3)';
      this.favoriteButton.style.borderColor = 'rgba(255, 193, 7, 0.6)';
    } else {
      this.favoriteButton.textContent = '☆ Favorite';
      this.favoriteButton.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
      this.favoriteButton.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    }
  }
  
  async downloadVideo() {
    if (!this.isLoaded || this.links.length === 0) return;
    
    const currentLink = this.links[this.currentIndex];
    
    try {
      // Create a tab to open the saint embed
      const tab = await chrome.tabs.create({ url: currentLink, active: false });
      
      // Wait a bit for the page to load
      setTimeout(async () => {
        // Execute a content script in the new tab to extract the video source
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: extractAndDownloadVideo
        });
      }, 2000);
      
      this.showStatusMessage('Opening download tab...');
    } catch (error) {
      console.error('Error downloading video:', error);
      this.showStatusMessage('Error downloading: ' + error.message);
    }
  }
  
  showStatusMessage(message) {
    // Create status message element if it doesn't exist
    let statusElement = document.getElementById('status-message');
    if (!statusElement) {
      statusElement = document.createElement('div');
      statusElement.id = 'status-message';
      statusElement.style.position = 'absolute';
      statusElement.style.bottom = '70px';
      statusElement.style.left = '20px';
      statusElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      statusElement.style.color = 'white';
      statusElement.style.padding = '10px 15px';
      statusElement.style.borderRadius = '5px';
      statusElement.style.zIndex = '1000';
      statusElement.style.transition = 'opacity 0.3s';
      document.body.appendChild(statusElement);
    }
    
    // Display message
    statusElement.textContent = message;
    statusElement.style.opacity = '1';
    
    // Hide message after 3 seconds
    setTimeout(() => {
      statusElement.style.opacity = '0';
    }, 3000);
  }
  
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      // If not in fullscreen, request fullscreen
      if (this.playerContainer.requestFullscreen) {
        this.playerContainer.requestFullscreen();
      } else if (this.playerContainer.webkitRequestFullscreen) {
        this.playerContainer.webkitRequestFullscreen();
      } else if (this.playerContainer.msRequestFullscreen) {
        this.playerContainer.msRequestFullscreen();
      }
    } else {
      // If in fullscreen, exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }
  
  normalizeIndex(index) {
    if (index < 0) {
      return this.links.length - 1;
    } else if (index >= this.links.length) {
      return 0;
    }
    return index;
  }
  
  updateProgressBar() {
    // Update counter
    this.currentCountElement.textContent = `${this.currentIndex + 1}/${this.links.length}`;
    
    // Update progress bar
    const progressPercentage = ((this.currentIndex + 1) / this.links.length) * 100;
    this.progressBar.style.width = `${progressPercentage}%`;
  }
  
  showNoLinksMessage() {
    this.playerContainer.innerHTML = `
      <div class="no-content">
        <h2>No Media Links Found</h2>
        <p>No saint links have been collected yet. Visit simpcity.su and use the Link Collector toolbar to collect media links first.</p>
      </div>
    `;
    this.disableControls();
  }
  
  showErrorMessage(error) {
    this.playerContainer.innerHTML = `
      <div class="no-content">
        <h2>Error Loading Links</h2>
        <p>An error occurred while loading the media links: ${error.message}</p>
      </div>
    `;
    this.disableControls();
  }
  
  disableControls() {
    this.nextButton.disabled = true;
    this.prevButton.disabled = true;
    this.randomButton.disabled = true;
    this.favoriteButton.disabled = true;
    this.downloadButton.disabled = true;
    this.fullscreenButton.disabled = true;
  }
}

// This function will be injected as a content script in the saint page
function extractAndDownloadVideo() {
  const videoElement = document.querySelector('#main-video');
  if (videoElement && videoElement.querySelector('source')) {
    const videoSrc = videoElement.querySelector('source').src;
    if (videoSrc) {
      // Create a link and click it to download
      const a = document.createElement('a');
      a.href = videoSrc;
      a.download = videoSrc.split('/').pop() || 'saint-video.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return { success: true, message: 'Video download started' };
    }
  }
  return { success: false, message: 'Could not find video source' };
}

// Initialize the player when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new SaintLinksPlayer();
});