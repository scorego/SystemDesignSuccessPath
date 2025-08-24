/**
 * Progress Tracking Configuration for System Design GitBook
 * This file configures reading progress, bookmarks, and personalization features
 */

const ProgressTracker = {
  // Configuration
  config: {
    storageKey: 'systemDesignProgress',
    trackingEnabled: true,
    persistToLocalStorage: true,
    showProgressBar: true,
    estimateReadingTime: true,
    wordsPerMinute: 200 // Average reading speed
  },

  // Initialize progress tracking
  init() {
    if (!this.config.trackingEnabled) return;
    
    this.loadProgress();
    this.setupEventListeners();
    this.updateProgressDisplay();
  },

  // Load saved progress from localStorage
  loadProgress() {
    try {
      const saved = localStorage.getItem(this.config.storageKey);
      this.progress = saved ? JSON.parse(saved) : this.getDefaultProgress();
    } catch (error) {
      console.warn('Failed to load progress:', error);
      this.progress = this.getDefaultProgress();
    }
  },

  // Get default progress structure
  getDefaultProgress() {
    return {
      chaptersRead: [],
      sectionsRead: [],
      bookmarks: [],
      readingTime: 0,
      lastVisited: null,
      completionPercentage: 0,
      learningPath: null,
      preferences: {
        theme: 'light',
        fontSize: 'medium',
        showEstimates: true
      }
    };
  },

  // Save progress to localStorage
  saveProgress() {
    if (!this.config.persistToLocalStorage) return;
    
    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify(this.progress));
    } catch (error) {
      console.warn('Failed to save progress:', error);
    }
  },

  // Mark chapter as read
  markChapterRead(chapterPath) {
    if (!this.progress.chaptersRead.includes(chapterPath)) {
      this.progress.chaptersRead.push(chapterPath);
      this.updateCompletionPercentage();
      this.saveProgress();
    }
  },

  // Mark section as read
  markSectionRead(sectionPath) {
    if (!this.progress.sectionsRead.includes(sectionPath)) {
      this.progress.sectionsRead.push(sectionPath);
      this.saveProgress();
    }
  },

  // Add bookmark
  addBookmark(path, title, note = '') {
    const bookmark = {
      path,
      title,
      note,
      timestamp: new Date().toISOString()
    };
    
    this.progress.bookmarks.push(bookmark);
    this.saveProgress();
  },

  // Remove bookmark
  removeBookmark(path) {
    this.progress.bookmarks = this.progress.bookmarks.filter(b => b.path !== path);
    this.saveProgress();
  },

  // Update completion percentage
  updateCompletionPercentage() {
    const totalChapters = this.getTotalChapters();
    const readChapters = this.progress.chaptersRead.length;
    this.progress.completionPercentage = Math.round((readChapters / totalChapters) * 100);
  },

  // Get total number of chapters
  getTotalChapters() {
    // This would be dynamically calculated based on SUMMARY.md
    return 29; // Total chapters in the book
  },

  // Estimate reading time for content
  estimateReadingTime(wordCount) {
    return Math.ceil(wordCount / this.config.wordsPerMinute);
  },

  // Setup event listeners for tracking
  setupEventListeners() {
    // Track page visits
    window.addEventListener('load', () => {
      this.trackPageVisit();
    });

    // Track reading time
    let startTime = Date.now();
    window.addEventListener('beforeunload', () => {
      const sessionTime = Date.now() - startTime;
      this.progress.readingTime += sessionTime;
      this.saveProgress();
    });

    // Track scroll progress
    window.addEventListener('scroll', this.throttle(() => {
      this.trackScrollProgress();
    }, 1000));
  },

  // Track page visit
  trackPageVisit() {
    const currentPath = window.location.pathname;
    this.progress.lastVisited = {
      path: currentPath,
      timestamp: new Date().toISOString()
    };
    
    // Auto-mark as read if user spends enough time
    setTimeout(() => {
      if (this.isChapterPage(currentPath)) {
        this.markChapterRead(currentPath);
      } else if (this.isSectionPage(currentPath)) {
        this.markSectionRead(currentPath);
      }
    }, 30000); // 30 seconds
  },

  // Track scroll progress
  trackScrollProgress() {
    const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    
    // Mark as read if user scrolled through most of the content
    if (scrollPercent > 80) {
      const currentPath = window.location.pathname;
      if (this.isChapterPage(currentPath)) {
        this.markChapterRead(currentPath);
      } else if (this.isSectionPage(currentPath)) {
        this.markSectionRead(currentPath);
      }
    }
  },

  // Check if current page is a chapter
  isChapterPage(path) {
    return path.includes('/chapter-') && path.endsWith('/README.md');
  },

  // Check if current page is a section
  isSectionPage(path) {
    return path.includes('/chapter-') && !path.endsWith('/README.md');
  },

  // Update progress display
  updateProgressDisplay() {
    if (!this.config.showProgressBar) return;
    
    // Create or update progress bar
    let progressBar = document.getElementById('reading-progress');
    if (!progressBar) {
      progressBar = this.createProgressBar();
    }
    
    progressBar.style.width = `${this.progress.completionPercentage}%`;
    progressBar.setAttribute('aria-valuenow', this.progress.completionPercentage);
  },

  // Create progress bar element
  createProgressBar() {
    const container = document.createElement('div');
    container.className = 'progress-container';
    container.innerHTML = `
      <div class="progress-bar-wrapper">
        <div class="progress-bar" id="reading-progress" 
             role="progressbar" 
             aria-valuemin="0" 
             aria-valuemax="100" 
             aria-valuenow="0">
        </div>
        <span class="progress-text">${this.progress.completionPercentage}% Complete</span>
      </div>
    `;
    
    document.body.insertBefore(container, document.body.firstChild);
    return container.querySelector('.progress-bar');
  },

  // Utility: Throttle function
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Get reading recommendations
  getRecommendations() {
    const currentPath = window.location.pathname;
    const recommendations = [];
    
    // Logic to suggest next chapters based on current progress
    // This would integrate with cross-references.json
    
    return recommendations;
  },

  // Export progress data
  exportProgress() {
    return {
      ...this.progress,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  },

  // Import progress data
  importProgress(data) {
    if (data && data.version === '1.0') {
      this.progress = { ...this.getDefaultProgress(), ...data };
      this.saveProgress();
      this.updateProgressDisplay();
    }
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ProgressTracker.init());
} else {
  ProgressTracker.init();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProgressTracker;
}