'use strict';

class SaintLinksPlayer {
  constructor() {
    this.links = [];
    this.currentIndex = 0;
    this.isLoaded = false;
    
    // DOM elements
    this.playerContainer = document.getElementById('player-container');
    this.nextButton = document.getElementById('next-btn');
    this.prevButton = document.getElementById('prev-btn');
    this.randomButton = document.getElementById('random-btn');
    this.fullscreenButton = document.getElementById('fullscreen-btn');
    this.currentCountElement = document.getElementById('current-count');
    this.progressBar = document.getElementById('progress-bar');
    
    // Initialize
    this.setupEventListeners();
    this.loadLinks();
  }
  
  setupEventListeners() {
    this.nextButton.addEventListener('click', () => this.nextVideo());
    this.prevButton.addEventListener('click', () => this.prevVideo());
    this.randomButton.addEventListener('click', () => this.randomVideo());
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
    this.fullscreenButton.disabled = true;
  }
}

// Initialize the player when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new SaintLinksPlayer();
});