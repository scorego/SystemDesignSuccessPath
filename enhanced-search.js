/**
 * Enhanced Search Functionality for System Design GitBook
 * Provides faceted search, concept dictionary, and quick reference features
 */

class EnhancedSearch {
  constructor() {
    this.searchIndex = null;
    this.conceptDictionary = null;
    this.crossReferences = null;
    this.searchHistory = [];
    this.maxResults = 20;
    
    this.init();
  }

  async init() {
    await this.loadSearchIndex();
    await this.loadConceptDictionary();
    await this.loadCrossReferences();
    this.setupSearchInterface();
    this.setupKeyboardShortcuts();
  }

  // Load search index (would be generated from content)
  async loadSearchIndex() {
    try {
      // In a real implementation, this would load a pre-built search index
      this.searchIndex = {
        documents: [],
        terms: new Map(),
        concepts: new Map()
      };
      
      // Build index from content (simplified version)
      await this.buildSearchIndex();
    } catch (error) {
      console.warn('Failed to load search index:', error);
    }
  }

  // Load concept dictionary
  async loadConceptDictionary() {
    try {
      const response = await fetch('/cross-references.json');
      const data = await response.json();
      this.conceptDictionary = data.crossReferences.concepts;
      this.crossReferences = data;
    } catch (error) {
      console.warn('Failed to load concept dictionary:', error);
      this.conceptDictionary = {};
    }
  }

  // Load cross-references
  async loadCrossReferences() {
    // Already loaded in loadConceptDictionary
  }

  // Build search index from content
  async buildSearchIndex() {
    // This would crawl all markdown files and build an inverted index
    // For now, we'll use a simplified approach
    
    const documents = [
      {
        id: 'cap-theorem',
        title: 'CAP Theorem',
        path: 'part-i-fundamentals/chapter-03-distributed-systems/cap-theorem.md',
        content: 'CAP theorem consistency availability partition tolerance distributed systems',
        tags: ['distributed-systems', 'theory', 'beginner'],
        difficulty: 'beginner',
        part: 'fundamentals'
      },
      {
        id: 'load-balancing',
        title: 'Load Balancing',
        path: 'part-ii-components/chapter-11-load-balancing/README.md',
        content: 'load balancing algorithms round robin weighted least connections',
        tags: ['scaling', 'performance', 'intermediate'],
        difficulty: 'intermediate',
        part: 'components'
      }
      // More documents would be added here
    ];

    this.searchIndex.documents = documents;
    
    // Build term index
    documents.forEach(doc => {
      const terms = doc.content.toLowerCase().split(/\s+/);
      terms.forEach(term => {
        if (!this.searchIndex.terms.has(term)) {
          this.searchIndex.terms.set(term, []);
        }
        this.searchIndex.terms.get(term).push(doc.id);
      });
    });
  }

  // Setup search interface
  setupSearchInterface() {
    const searchContainer = document.createElement('div');
    searchContainer.className = 'enhanced-search';
    searchContainer.innerHTML = `
      <div class="search-input-container">
        <span class="search-icon">🔍</span>
        <input type="text" 
               class="search-input" 
               placeholder="Search concepts, topics, or problems..."
               id="enhanced-search-input">
      </div>
      <div class="search-facets" id="search-facets"></div>
      <div class="search-results" id="search-results" style="display: none;"></div>
    `;

    // Insert search at the top of the page
    const mainContent = document.querySelector('.book-body') || document.body;
    mainContent.insertBefore(searchContainer, mainContent.firstChild);

    // Setup event listeners
    const searchInput = document.getElementById('enhanced-search-input');
    searchInput.addEventListener('input', this.debounce((e) => {
      this.performSearch(e.target.value);
    }, 300));

    searchInput.addEventListener('focus', () => {
      this.showSearchSuggestions();
    });

    // Setup facets
    this.setupSearchFacets();
  }

  // Setup search facets
  setupSearchFacets() {
    const facetsContainer = document.getElementById('search-facets');
    const facets = [
      { key: 'difficulty', values: ['beginner', 'intermediate', 'advanced'] },
      { key: 'part', values: ['fundamentals', 'components', 'interviews', 'advanced'] },
      { key: 'topic', values: ['scaling', 'databases', 'caching', 'security'] }
    ];

    facets.forEach(facet => {
      facet.values.forEach(value => {
        const facetElement = document.createElement('span');
        facetElement.className = 'search-facet';
        facetElement.textContent = `${facet.key}: ${value}`;
        facetElement.dataset.facetKey = facet.key;
        facetElement.dataset.facetValue = value;
        
        facetElement.addEventListener('click', () => {
          this.toggleFacet(facetElement);
        });
        
        facetsContainer.appendChild(facetElement);
      });
    });
  }

  // Toggle search facet
  toggleFacet(facetElement) {
    facetElement.classList.toggle('active');
    this.performSearch(document.getElementById('enhanced-search-input').value);
  }

  // Get active facets
  getActiveFacets() {
    const activeFacets = {};
    document.querySelectorAll('.search-facet.active').forEach(facet => {
      const key = facet.dataset.facetKey;
      const value = facet.dataset.facetValue;
      
      if (!activeFacets[key]) {
        activeFacets[key] = [];
      }
      activeFacets[key].push(value);
    });
    
    return activeFacets;
  }

  // Perform search
  performSearch(query) {
    if (!query.trim()) {
      this.hideSearchResults();
      return;
    }

    const results = this.searchDocuments(query);
    const filteredResults = this.applyFacetFilters(results);
    this.displaySearchResults(filteredResults, query);
  }

  // Search documents
  searchDocuments(query) {
    const terms = query.toLowerCase().split(/\s+/);
    const results = new Map();

    // Search in document content
    terms.forEach(term => {
      if (this.searchIndex.terms.has(term)) {
        this.searchIndex.terms.get(term).forEach(docId => {
          const doc = this.searchIndex.documents.find(d => d.id === docId);
          if (doc) {
            const score = results.get(docId) || 0;
            results.set(docId, score + 1);
          }
        });
      }
    });

    // Search in concept dictionary
    Object.keys(this.conceptDictionary).forEach(concept => {
      if (concept.toLowerCase().includes(query.toLowerCase())) {
        const conceptData = this.conceptDictionary[concept];
        results.set(`concept-${concept}`, 10); // Higher score for concept matches
      }
    });

    // Convert to array and sort by score
    return Array.from(results.entries())
      .map(([id, score]) => {
        const doc = this.searchIndex.documents.find(d => d.id === id) || 
                   this.getConceptResult(id, query);
        return { ...doc, score };
      })
      .filter(result => result)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.maxResults);
  }

  // Get concept result
  getConceptResult(id, query) {
    if (!id.startsWith('concept-')) return null;
    
    const conceptName = id.replace('concept-', '');
    const concept = this.conceptDictionary[conceptName];
    
    if (!concept) return null;
    
    return {
      id,
      title: conceptName,
      path: concept.mainLocation,
      content: concept.definition,
      type: 'concept',
      relatedTopics: concept.relatedTopics || []
    };
  }

  // Apply facet filters
  applyFacetFilters(results) {
    const activeFacets = this.getActiveFacets();
    
    if (Object.keys(activeFacets).length === 0) {
      return results;
    }

    return results.filter(result => {
      return Object.entries(activeFacets).every(([key, values]) => {
        return values.some(value => {
          if (result[key]) {
            return Array.isArray(result[key]) 
              ? result[key].includes(value)
              : result[key] === value;
          }
          return false;
        });
      });
    });
  }

  // Display search results
  displaySearchResults(results, query) {
    const resultsContainer = document.getElementById('search-results');
    
    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <div class="search-result-item">
          <div class="search-result-title">No results found</div>
          <div class="search-result-snippet">
            Try different keywords or check the concept dictionary
          </div>
        </div>
      `;
    } else {
      resultsContainer.innerHTML = results.map(result => `
        <div class="search-result-item" onclick="window.location.href='${result.path}'">
          <div class="search-result-title">${this.highlightQuery(result.title, query)}</div>
          <div class="search-result-snippet">${this.highlightQuery(result.content, query)}</div>
          <div class="search-result-path">${result.path}</div>
          ${result.type === 'concept' ? '<span class="concept-badge">Concept</span>' : ''}
        </div>
      `).join('');
    }
    
    resultsContainer.style.display = 'block';
    
    // Add to search history
    this.addToSearchHistory(query, results.length);
  }

  // Highlight query terms in text
  highlightQuery(text, query) {
    if (!text || !query) return text;
    
    const terms = query.split(/\s+/);
    let highlightedText = text;
    
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    
    return highlightedText;
  }

  // Hide search results
  hideSearchResults() {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.style.display = 'none';
  }

  // Show search suggestions
  showSearchSuggestions() {
    const suggestions = this.getPopularSearches();
    // Implementation for showing suggestions
  }

  // Get popular searches
  getPopularSearches() {
    return [
      'CAP theorem',
      'Load balancing',
      'Database sharding',
      'Microservices',
      'Caching strategies'
    ];
  }

  // Add to search history
  addToSearchHistory(query, resultCount) {
    this.searchHistory.unshift({
      query,
      resultCount,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 searches
    this.searchHistory = this.searchHistory.slice(0, 50);
    
    // Save to localStorage
    try {
      localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }

  // Setup keyboard shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('enhanced-search-input').focus();
      }
      
      // Escape to hide search results
      if (e.key === 'Escape') {
        this.hideSearchResults();
        document.getElementById('enhanced-search-input').blur();
      }
    });
  }

  // Utility: Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Get concept definition (for hover cards)
  getConceptDefinition(conceptName) {
    return this.conceptDictionary[conceptName]?.definition || null;
  }

  // Get related topics
  getRelatedTopics(conceptName) {
    return this.conceptDictionary[conceptName]?.relatedTopics || [];
  }
}

// Initialize enhanced search when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new EnhancedSearch());
} else {
  new EnhancedSearch();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedSearch;
}