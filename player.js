'use strict';

class SaintLinksPlayer {
  constructor() {
    this.links = [];
    this.favoriteLinks = [];
    this.currentIndex = 0;
    this.isLoaded = false;
    this.showingFavorites = false;
    this.displayedLinks = []; // This will hold either all links or just favorites
    
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
    
    // Add new buttons for favorites features
    this.showFavoritesButton = document.getElementById('show-favorites-btn');
    this.downloadAllFavoritesButton = document.getElementById('download-all-favorites-btn');
    
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
    this.showFavoritesButton.addEventListener('click', () => this.toggleFavoritesView());
    this.downloadAllFavoritesButton.addEventListener('click', () => this.downloadAllFavorites());
    
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
        case 'v':
        case 'V':
          this.toggleFavoritesView();
          break;
      }
    });
  }
  
  async loadLinks() {
    // Get links from Chrome storage
    try {
      const result = await this.getFromStorage(['saintLinks']);
      this.links = result.saintLinks || [];
      
      // Initialize displayed links to all links
      this.displayedLinks = [...this.links];
      
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
      this.updateFavoritesButtonState();
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
    if (!this.isLoaded || this.displayedLinks.length === 0) return;
    
    // Ensure index is within bounds
    this.currentIndex = this.normalizeIndex(index);
    
    // Clear current content
    this.playerContainer.innerHTML = '';
    
    // Create iframe for the current link
    const iframe = document.createElement('iframe');
    iframe.src = this.displayedLinks[this.currentIndex];
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('autoplay', 'true');
    
    // Add iframe to container
    this.playerContainer.appendChild(iframe);
    
    // Update UI
    this.updateProgressBar();
    this.updateFavoriteButtonState();
    
    // Click the middle of the screen after 2 seconds to start playback
    setTimeout(() => {
      this.clickMiddleOfScreen();
    }, 2000);
  }
  
  clickMiddleOfScreen() {
    console.log('Starting clickMiddleOfScreen method');
    
    try {
      const iframe = this.playerContainer.querySelector('iframe');
      if (!iframe) {
        console.error('No iframe found');
        return;
      }
      
      console.log('Found iframe, getting dimensions');
      
      // Calculate middle point
      const iframeRect = iframe.getBoundingClientRect();
      const centerX = Math.floor(iframe.clientWidth / 2);
      const centerY = Math.floor(iframe.clientHeight / 2);
      
      console.log('Calculated center point:', centerX, centerY);
      
      // Send message to iframe content
      console.log('Sending postMessage to iframe');
      iframe.contentWindow.postMessage({
        type: 'simulateClick',
        x: centerX,
        y: centerY
      }, '*');
      
    } catch (error) {
      console.error('Error in clickMiddleOfScreen:', error);
    }
  }
  
  nextVideo() {
    this.loadVideo(this.currentIndex + 1);
  }
  
  prevVideo() {
    this.loadVideo(this.currentIndex - 1);
  }
  
  randomVideo() {
    if (!this.isLoaded || this.displayedLinks.length === 0) return;
    
    // Generate a random index different from the current one
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * this.displayedLinks.length);
    } while (randomIndex === this.currentIndex && this.displayedLinks.length > 1);
    
    this.loadVideo(randomIndex);
  }
  
  toggleFavorite() {
    if (!this.isLoaded || this.displayedLinks.length === 0) return;
    
    const currentLink = this.displayedLinks[this.currentIndex];
    const isFavorite = this.favoriteLinks.includes(currentLink);
    
    if (isFavorite) {
      // Remove from favorites
      this.favoriteLinks = this.favoriteLinks.filter(link => link !== currentLink);
      this.showStatusMessage('Removed from favorites');
      
      // If showing only favorites, we might need to remove this item from display
      if (this.showingFavorites) {
        this.displayedLinks = [...this.favoriteLinks];
        if (this.displayedLinks.length === 0) {
          this.showNoFavoritesMessage();
          return;
        } else {
          // Adjust current index if necessary
          if (this.currentIndex >= this.displayedLinks.length) {
            this.currentIndex = this.displayedLinks.length - 1;
          }
          this.loadVideo(this.currentIndex);
        }
      }
    } else {
      // Add to favorites
      this.favoriteLinks.push(currentLink);
      this.showStatusMessage('Added to favorites');
    }
    
    // Save to storage
    chrome.storage.local.set({ favoriteLinks: this.favoriteLinks });
    
    // Update button states
    this.updateFavoriteButtonState();
    this.updateFavoritesButtonState();
  }
  
  updateFavoriteButtonState() {
    if (!this.isLoaded || this.displayedLinks.length === 0) return;
    
    const currentLink = this.displayedLinks[this.currentIndex];
    const isFavorite = this.favoriteLinks.includes(currentLink);
    
    // Update button UI based on favorite status
    if (isFavorite) {
      this.favoriteButton.style.backgroundColor = 'rgba(255, 193, 7, 0.3)';
      this.favoriteButton.style.borderColor = 'rgba(255, 193, 7, 0.6)';
    } else {
      this.favoriteButton.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
      this.favoriteButton.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    }
  }
  
  toggleFavoritesView() {
    if (!this.isLoaded) return;
    
    this.showingFavorites = !this.showingFavorites;
    
    if (this.showingFavorites) {
      // Show only favorites
      this.displayedLinks = [...this.favoriteLinks];
      this.showFavoritesButton.textContent = 'Show All';
      this.showFavoritesButton.style.backgroundColor = 'rgba(233, 30, 99, 0.3)';
      this.showFavoritesButton.style.borderColor = 'rgba(233, 30, 99, 0.6)';
      
      this.showStatusMessage('Showing favorites only');
      
      if (this.displayedLinks.length === 0) {
        this.showNoFavoritesMessage();
        return;
      }
    } else {
      // Show all links
      this.displayedLinks = [...this.links];
      this.showFavoritesButton.textContent = 'Show Favorites';
      this.showFavoritesButton.style.backgroundColor = 'rgba(63, 81, 181, 0.2)';
      this.showFavoritesButton.style.borderColor = 'rgba(63, 81, 181, 0.4)';
      
      this.showStatusMessage('Showing all videos');
    }
    
    // Reset to first video in the current view
    this.loadVideo(0);
  }
  
  updateFavoritesButtonState() {
    // Enable/disable download all favorites button based on if any favorites exist
    if (this.favoriteLinks.length > 0) {
      this.downloadAllFavoritesButton.disabled = false;
      this.downloadAllFavoritesButton.style.opacity = '1';
    } else {
      this.downloadAllFavoritesButton.disabled = true;
      this.downloadAllFavoritesButton.style.opacity = '0.5';
    }
  }
  
  async downloadVideo() {
    if (!this.isLoaded || this.displayedLinks.length === 0) return;
    
    const currentLink = this.displayedLinks[this.currentIndex];
    
    try {
      // Create a tab to open the saint embed
      const tab = await chrome.tabs.create({ url: currentLink, active: false });
      
      // Show loading message
      this.showStatusMessage('Opening download tab...');
      
      // Wait for the page to load
      setTimeout(async () => {
        try {
          // Execute a content script in the new tab to extract and download the video
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: extractAndDownloadVideo
          });
          
          // Check if download was successful
          const success = results && results[0] && results[0].result && results[0].result.success;
          
          if (success) {
            this.showStatusMessage('Download started. Tab will close shortly...');
            
            // Wait a bit to allow the download to start, then close the tab
            setTimeout(async () => {
              try {
                await chrome.tabs.remove(tab.id);
              } catch (error) {
                console.error('Error closing tab:', error);
              }
            }, 3000);
          } else {
            this.showStatusMessage('Download failed. Check console for details.');
          }
        } catch (error) {
          console.error('Error executing download script:', error);
          this.showStatusMessage('Error downloading: ' + error.message);
        }
      }, 2000);
    } catch (error) {
      console.error('Error creating download tab:', error);
      this.showStatusMessage('Error downloading: ' + error.message);
    }
  }
  
  async downloadAllFavorites() {
    if (this.favoriteLinks.length === 0) {
      this.showStatusMessage('No favorites to download');
      return;
    }
    
    this.showStatusMessage(`Starting download of ${this.favoriteLinks.length} favorites...`);
    
    // Create a counter for successful downloads
    let successCount = 0;
    
    // Process each favorite link one by one
    for (let i = 0; i < this.favoriteLinks.length; i++) {
      try {
        // Create a tab to open the saint embed
        const tab = await chrome.tabs.create({ 
          url: this.favoriteLinks[i], 
          active: false 
        });
        
        // Show progress
        this.showStatusMessage(`Processing ${i+1}/${this.favoriteLinks.length} favorites...`);
        
        // Wait for page to load before running the script
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Execute script to download the video
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: extractAndDownloadVideo
        });
        
        // Check if download was successful
        const success = results && results[0] && results[0].result && results[0].result.success;
        
        if (success) {
          successCount++;
          // Wait for download to start
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Close the tab after attempting download
        try {
          await chrome.tabs.remove(tab.id);
        } catch (error) {
          console.error('Error closing tab:', error);
        }
        
        // Add a delay between downloads to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (error) {
        console.error(`Error downloading favorite ${i+1}:`, error);
      }
    }
    
    // Show final status
    this.showStatusMessage(`Completed download of ${successCount}/${this.favoriteLinks.length} favorites`);
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
      return this.displayedLinks.length - 1;
    } else if (index >= this.displayedLinks.length) {
      return 0;
    }
    return index;
  }
  
  updateProgressBar() {
    // Update counter
    this.currentCountElement.textContent = `${this.currentIndex + 1}/${this.displayedLinks.length}`;
    
    // Update progress bar
    const progressPercentage = ((this.currentIndex + 1) / this.displayedLinks.length) * 100;
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
  
  showNoFavoritesMessage() {
    this.playerContainer.innerHTML = `
      <div class="no-content">
        <h2>No Favorites Found</h2>
        <p>You haven't added any videos to your favorites yet. Browse videos and click the ☆ Favorite button to add videos to your favorites.</p>
      </div>
    `;
    
    // Disable only some controls
    this.nextButton.disabled = true;
    this.prevButton.disabled = true;
    this.randomButton.disabled = true;
    this.favoriteButton.disabled = true;
    this.downloadButton.disabled = true;
    this.fullscreenButton.disabled = true;
    
    // But keep favorites toggle enabled
    this.showFavoritesButton.disabled = false;
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
    this.showFavoritesButton.disabled = true;
    this.downloadAllFavoritesButton.disabled = true;
  }
}

// This function will be injected as a content script in the saint page
function extractAndDownloadVideo() {
  try {
    // Make sure the page is fully loaded
    if (document.readyState !== 'complete') {
      return { success: false, message: 'Page not fully loaded yet' };
    }
    
    // Find the video element
    const videoElement = document.querySelector('#main-video');
    if (!videoElement) {
      return { success: false, message: 'Video element not found on page' };
    }
    
    // Find the video source
    const sourceElement = videoElement.querySelector('source');
    if (!sourceElement) {
      return { success: false, message: 'Video source element not found' };
    }
    
    // Get the video URL
    const videoSrc = sourceElement.src;
    if (!videoSrc) {
      return { success: false, message: 'Video source URL not found' };
    }
    
    // Create a friendly filename from the URL
    let filename = videoSrc.split('/').pop() || 'saint-video.mp4';
    
    // Create a link and click it to download
    const a = document.createElement('a');
    a.href = videoSrc;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
    }, 100);
    
    return { success: true, message: 'Video download started' };
  } catch (error) {
    console.error('Error in extractAndDownloadVideo:', error);
    return { success: false, message: `Download error: ${error.message}` };
  }
}

// Initialize the player when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new SaintLinksPlayer();
});