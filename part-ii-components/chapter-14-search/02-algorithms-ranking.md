# Search Algorithms & Ranking

## Introduction

Search algorithms determine how relevant documents are identified and ranked in response to user queries. The quality of search results depends heavily on the ranking algorithm's ability to understand user intent and match it with the most relevant content.

This section covers the fundamental algorithms used in modern search engines, from classical information retrieval methods to machine learning-based approaches.

## Core Ranking Algorithms

### TF-IDF (Term Frequency-Inverse Document Frequency)

**Concept**: Measures the importance of a term in a document relative to a collection of documents.

**Formula**:
```
TF-IDF(t,d,D) = TF(t,d) × IDF(t,D)

Where:
- TF(t,d) = (Number of times term t appears in document d) / (Total number of terms in document d)
- IDF(t,D) = log(Total number of documents / Number of documents containing term t)
```

**Implementation Example**:
```python
import math
from collections import Counter

class TFIDFCalculator:
    def __init__(self, documents):
        self.documents = documents
        self.doc_count = len(documents)
        self.idf_cache = {}
    
    def tf(self, term, document):
        """Calculate Term Frequency"""
        words = document.lower().split()
        word_count = len(words)
        term_count = words.count(term.lower())
        return term_count / word_count if word_count > 0 else 0
    
    def idf(self, term):
        """Calculate Inverse Document Frequency"""
        if term in self.idf_cache:
            return self.idf_cache[term]
        
        docs_containing_term = sum(1 for doc in self.documents 
                                 if term.lower() in doc.lower())
        
        if docs_containing_term == 0:
            idf_value = 0
        else:
            idf_value = math.log(self.doc_count / docs_containing_term)
        
        self.idf_cache[term] = idf_value
        return idf_value
    
    def tfidf(self, term, document):
        """Calculate TF-IDF score"""
        return self.tf(term, document) * self.idf(term)
    
    def score_document(self, query, document):
        """Score a document against a query"""
        query_terms = query.lower().split()
        score = sum(self.tfidf(term, document) for term in query_terms)
        return score

# Example usage
documents = [
    "The quick brown fox jumps over the lazy dog",
    "A quick brown dog outran a quick fox",
    "The dog was lazy but the fox was quick"
]

calculator = TFIDFCalculator(documents)
query = "quick fox"

for i, doc in enumerate(documents):
    score = calculator.score_document(query, doc)
    print(f"Document {i+1}: {score:.4f}")
```

### BM25 (Best Matching 25)

**Concept**: An improved version of TF-IDF that addresses some of its limitations, particularly term frequency saturation.

**Formula**:
```
BM25(q,d) = Σ IDF(qi) × (f(qi,d) × (k1 + 1)) / (f(qi,d) + k1 × (1 - b + b × |d|/avgdl))

Where:
- f(qi,d) = frequency of term qi in document d
- |d| = length of document d
- avgdl = average document length
- k1 = controls term frequency saturation (typically 1.2-2.0)
- b = controls field length normalization (typically 0.75)
```

**Implementation Example**:
```python
import math
from collections import Counter

class BM25:
    def __init__(self, documents, k1=1.5, b=0.75):
        self.documents = documents
        self.k1 = k1
        self.b = b
        self.doc_count = len(documents)
        
        # Precompute document statistics
        self.doc_lengths = [len(doc.split()) for doc in documents]
        self.avg_doc_length = sum(self.doc_lengths) / len(self.doc_lengths)
        
        # Build vocabulary and document frequency
        self.vocab = set()
        self.doc_freq = Counter()
        
        for doc in documents:
            words = set(doc.lower().split())
            self.vocab.update(words)
            for word in words:
                self.doc_freq[word] += 1
    
    def idf(self, term):
        """Calculate IDF for BM25"""
        df = self.doc_freq.get(term.lower(), 0)
        return math.log((self.doc_count - df + 0.5) / (df + 0.5))
    
    def score(self, query, doc_index):
        """Calculate BM25 score for a document"""
        document = self.documents[doc_index]
        doc_length = self.doc_lengths[doc_index]
        
        # Count term frequencies in document
        doc_terms = Counter(document.lower().split())
        
        score = 0
        for term in query.lower().split():
            if term in doc_terms:
                tf = doc_terms[term]
                idf = self.idf(term)
                
                # BM25 formula
                numerator = tf * (self.k1 + 1)
                denominator = tf + self.k1 * (1 - self.b + self.b * doc_length / self.avg_doc_length)
                
                score += idf * (numerator / denominator)
        
        return score
    
    def search(self, query, top_k=10):
        """Search and return top-k documents"""
        scores = [(i, self.score(query, i)) for i in range(self.doc_count)]
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:top_k]

# Example usage
documents = [
    "Machine learning algorithms for data analysis",
    "Deep learning neural networks and artificial intelligence",
    "Data science and machine learning applications",
    "Natural language processing with machine learning",
    "Computer vision and image recognition algorithms"
]

bm25 = BM25(documents)
results = bm25.search("machine learning algorithms")

for doc_id, score in results:
    print(f"Doc {doc_id}: {score:.4f} - {documents[doc_id]}")
```

### PageRank Algorithm

**Concept**: Originally developed for web search, PageRank measures the importance of pages based on the link structure.

**Formula**:
```
PR(A) = (1-d)/N + d × Σ(PR(Ti)/C(Ti))

Where:
- PR(A) = PageRank of page A
- d = damping factor (typically 0.85)
- N = total number of pages
- Ti = pages that link to page A
- C(Ti) = number of outbound links from page Ti
```

**Implementation Example**:
```python
import numpy as np

class PageRank:
    def __init__(self, links, damping_factor=0.85, max_iterations=100, tolerance=1e-6):
        self.links = links  # Dictionary: page -> [list of pages it links to]
        self.damping_factor = damping_factor
        self.max_iterations = max_iterations
        self.tolerance = tolerance
        
        # Build page index
        self.pages = list(set(links.keys()) | set(sum(links.values(), [])))
        self.page_to_index = {page: i for i, page in enumerate(self.pages)}
        self.num_pages = len(self.pages)
        
        # Build transition matrix
        self.transition_matrix = self._build_transition_matrix()
    
    def _build_transition_matrix(self):
        """Build the transition matrix for PageRank calculation"""
        matrix = np.zeros((self.num_pages, self.num_pages))
        
        for page, outlinks in self.links.items():
            page_idx = self.page_to_index[page]
            
            if outlinks:
                # Distribute PageRank equally among outlinks
                for outlink in outlinks:
                    outlink_idx = self.page_to_index[outlink]
                    matrix[outlink_idx][page_idx] = 1.0 / len(outlinks)
            else:
                # Handle dangling nodes (pages with no outlinks)
                for i in range(self.num_pages):
                    matrix[i][page_idx] = 1.0 / self.num_pages
        
        return matrix
    
    def calculate(self):
        """Calculate PageRank values"""
        # Initialize PageRank values
        pagerank = np.ones(self.num_pages) / self.num_pages
        
        for iteration in range(self.max_iterations):
            prev_pagerank = pagerank.copy()
            
            # PageRank formula: PR = (1-d)/N + d * M * PR
            pagerank = ((1 - self.damping_factor) / self.num_pages + 
                       self.damping_factor * self.transition_matrix.dot(pagerank))
            
            # Check for convergence
            if np.sum(np.abs(pagerank - prev_pagerank)) < self.tolerance:
                print(f"Converged after {iteration + 1} iterations")
                break
        
        # Return results as dictionary
        return {self.pages[i]: pagerank[i] for i in range(self.num_pages)}

# Example usage
links = {
    'A': ['B', 'C'],
    'B': ['C'],
    'C': ['A'],
    'D': ['B', 'C']
}

pagerank = PageRank(links)
results = pagerank.calculate()

print("PageRank Results:")
for page, score in sorted(results.items(), key=lambda x: x[1], reverse=True):
    print(f"Page {page}: {score:.4f}")
```

## Modern Ranking Approaches

### Learning to Rank (LTR)

**Concept**: Machine learning approach that learns ranking functions from training data.

**Types**:
1. **Pointwise**: Treats ranking as regression/classification problem
2. **Pairwise**: Learns from pairs of documents (which is better)
3. **Listwise**: Optimizes entire ranking list

**Example Features for LTR**:
```python
class RankingFeatures:
    def __init__(self):
        self.features = {}
    
    def extract_features(self, query, document, corpus_stats):
        """Extract features for learning to rank"""
        features = {}
        
        # Text matching features
        features['exact_match'] = 1 if query.lower() in document.lower() else 0
        features['query_length'] = len(query.split())
        features['doc_length'] = len(document.split())
        
        # TF-IDF based features
        features['tfidf_score'] = self.calculate_tfidf(query, document, corpus_stats)
        features['bm25_score'] = self.calculate_bm25(query, document, corpus_stats)
        
        # Position features
        features['title_match'] = self.title_match_score(query, document)
        features['first_paragraph_match'] = self.first_paragraph_match(query, document)
        
        # Popularity features
        features['click_through_rate'] = corpus_stats.get('ctr', 0)
        features['page_views'] = corpus_stats.get('views', 0)
        
        # Freshness features
        features['days_since_published'] = corpus_stats.get('days_old', 0)
        
        return features
    
    def calculate_tfidf(self, query, document, corpus_stats):
        # Implementation would use TF-IDF calculator
        pass
    
    def calculate_bm25(self, query, document, corpus_stats):
        # Implementation would use BM25 calculator
        pass
    
    def title_match_score(self, query, document):
        # Check if query terms appear in document title
        pass
    
    def first_paragraph_match(self, query, document):
        # Check if query terms appear in first paragraph
        pass
```

### Neural Ranking Models

**BERT for Search**: Using transformer models for semantic understanding

```python
from transformers import AutoTokenizer, AutoModel
import torch
import torch.nn.functional as F

class BERTRanker:
    def __init__(self, model_name='bert-base-uncased'):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name)
        self.model.eval()
    
    def encode_text(self, text):
        """Encode text using BERT"""
        inputs = self.tokenizer(text, return_tensors='pt', 
                              truncation=True, padding=True, max_length=512)
        
        with torch.no_grad():
            outputs = self.model(**inputs)
            # Use [CLS] token embedding
            embeddings = outputs.last_hidden_state[:, 0, :]
        
        return embeddings
    
    def semantic_similarity(self, query, document):
        """Calculate semantic similarity between query and document"""
        query_embedding = self.encode_text(query)
        doc_embedding = self.encode_text(document)
        
        # Cosine similarity
        similarity = F.cosine_similarity(query_embedding, doc_embedding)
        return similarity.item()
    
    def rank_documents(self, query, documents):
        """Rank documents by semantic similarity to query"""
        scores = []
        
        for i, doc in enumerate(documents):
            score = self.semantic_similarity(query, doc)
            scores.append((i, score))
        
        # Sort by score (descending)
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores

# Example usage (requires transformers library)
# ranker = BERTRanker()
# documents = ["AI and machine learning", "Cooking recipes", "Sports news"]
# results = ranker.rank_documents("artificial intelligence", documents)
```

## Ranking Factors and Signals

### Content Quality Signals

**1. Relevance Signals**
- Keyword matching (exact, partial, semantic)
- Topic modeling scores
- Entity recognition and matching
- Query-document semantic similarity

**2. Authority Signals**
- Domain authority and trust metrics
- Author expertise and credentials
- Citation count and quality
- Social media engagement

**3. User Experience Signals**
- Click-through rates (CTR)
- Dwell time and bounce rate
- User engagement metrics
- Mobile-friendliness

### Implementation Example: Multi-Signal Ranking

```python
class MultiSignalRanker:
    def __init__(self, weights=None):
        self.weights = weights or {
            'relevance': 0.4,
            'authority': 0.3,
            'freshness': 0.2,
            'user_engagement': 0.1
        }
    
    def calculate_relevance_score(self, query, document):
        """Calculate content relevance score"""
        # Combine multiple relevance signals
        tfidf_score = self.tfidf_score(query, document)
        semantic_score = self.semantic_similarity(query, document)
        exact_match_bonus = 1.2 if query.lower() in document.lower() else 1.0
        
        return (tfidf_score * 0.6 + semantic_score * 0.4) * exact_match_bonus
    
    def calculate_authority_score(self, document_metadata):
        """Calculate authority/trust score"""
        domain_authority = document_metadata.get('domain_authority', 0) / 100
        backlink_count = min(document_metadata.get('backlinks', 0) / 1000, 1.0)
        author_score = document_metadata.get('author_authority', 0) / 100
        
        return (domain_authority * 0.5 + backlink_count * 0.3 + author_score * 0.2)
    
    def calculate_freshness_score(self, document_metadata):
        """Calculate content freshness score"""
        days_old = document_metadata.get('days_since_published', 0)
        
        # Exponential decay for freshness
        import math
        freshness = math.exp(-days_old / 365)  # Decay over a year
        
        # Boost for recently updated content
        days_since_update = document_metadata.get('days_since_updated', days_old)
        update_boost = math.exp(-days_since_update / 30)  # Decay over a month
        
        return max(freshness, update_boost * 0.8)
    
    def calculate_engagement_score(self, document_metadata):
        """Calculate user engagement score"""
        ctr = document_metadata.get('click_through_rate', 0)
        dwell_time = min(document_metadata.get('avg_dwell_time', 0) / 300, 1.0)  # Normalize to 5 minutes
        bounce_rate = 1 - document_metadata.get('bounce_rate', 0.5)
        
        return (ctr * 0.4 + dwell_time * 0.4 + bounce_rate * 0.2)
    
    def rank_document(self, query, document, document_metadata):
        """Calculate final ranking score"""
        relevance = self.calculate_relevance_score(query, document)
        authority = self.calculate_authority_score(document_metadata)
        freshness = self.calculate_freshness_score(document_metadata)
        engagement = self.calculate_engagement_score(document_metadata)
        
        final_score = (
            relevance * self.weights['relevance'] +
            authority * self.weights['authority'] +
            freshness * self.weights['freshness'] +
            engagement * self.weights['user_engagement']
        )
        
        return final_score, {
            'relevance': relevance,
            'authority': authority,
            'freshness': freshness,
            'engagement': engagement
        }
```

## Query Understanding and Processing

### Query Analysis Pipeline

```python
import re
from collections import defaultdict

class QueryProcessor:
    def __init__(self):
        self.stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        self.synonyms = {
            'car': ['automobile', 'vehicle'],
            'fast': ['quick', 'rapid', 'speedy'],
            'big': ['large', 'huge', 'enormous']
        }
    
    def analyze_query(self, query):
        """Comprehensive query analysis"""
        analysis = {
            'original': query,
            'cleaned': self.clean_query(query),
            'tokens': [],
            'entities': [],
            'intent': self.detect_intent(query),
            'query_type': self.classify_query_type(query),
            'expanded_terms': []
        }
        
        # Tokenize and clean
        analysis['tokens'] = self.tokenize(analysis['cleaned'])
        
        # Remove stop words
        analysis['tokens'] = [token for token in analysis['tokens'] 
                            if token.lower() not in self.stop_words]
        
        # Expand with synonyms
        analysis['expanded_terms'] = self.expand_synonyms(analysis['tokens'])
        
        # Extract entities (simplified)
        analysis['entities'] = self.extract_entities(query)
        
        return analysis
    
    def clean_query(self, query):
        """Clean and normalize query"""
        # Remove special characters, normalize whitespace
        cleaned = re.sub(r'[^\w\s]', ' ', query)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        return cleaned.lower()
    
    def tokenize(self, query):
        """Tokenize query into terms"""
        return query.split()
    
    def detect_intent(self, query):
        """Detect user intent from query"""
        query_lower = query.lower()
        
        if any(word in query_lower for word in ['how', 'what', 'why', 'when', 'where']):
            return 'informational'
        elif any(word in query_lower for word in ['buy', 'purchase', 'price', 'cost']):
            return 'transactional'
        elif any(word in query_lower for word in ['best', 'top', 'compare', 'vs']):
            return 'commercial'
        else:
            return 'navigational'
    
    def classify_query_type(self, query):
        """Classify query by structure"""
        if '"' in query:
            return 'phrase'
        elif len(query.split()) == 1:
            return 'single_term'
        elif any(op in query.lower() for op in ['and', 'or', 'not']):
            return 'boolean'
        else:
            return 'multi_term'
    
    def expand_synonyms(self, tokens):
        """Expand query with synonyms"""
        expanded = list(tokens)
        
        for token in tokens:
            if token.lower() in self.synonyms:
                expanded.extend(self.synonyms[token.lower()])
        
        return list(set(expanded))  # Remove duplicates
    
    def extract_entities(self, query):
        """Extract named entities (simplified implementation)"""
        # This would typically use NLP libraries like spaCy or NLTK
        entities = []
        
        # Simple pattern matching for demonstration
        patterns = {
            'date': r'\b\d{4}\b|\b\d{1,2}/\d{1,2}/\d{4}\b',
            'price': r'\$\d+(?:\.\d{2})?',
            'location': r'\b[A-Z][a-z]+ [A-Z][a-z]+\b'  # Simple city/state pattern
        }
        
        for entity_type, pattern in patterns.items():
            matches = re.findall(pattern, query)
            for match in matches:
                entities.append({'type': entity_type, 'value': match})
        
        return entities
```

## Performance Optimization

### Caching Strategies

```python
from functools import lru_cache
import hashlib
import time

class SearchCache:
    def __init__(self, max_size=10000, ttl=3600):
        self.cache = {}
        self.access_times = {}
        self.max_size = max_size
        self.ttl = ttl  # Time to live in seconds
    
    def _generate_key(self, query, filters=None):
        """Generate cache key for query and filters"""
        cache_data = {'query': query, 'filters': filters or {}}
        cache_string = str(sorted(cache_data.items()))
        return hashlib.md5(cache_string.encode()).hexdigest()
    
    def get(self, query, filters=None):
        """Get cached results"""
        key = self._generate_key(query, filters)
        current_time = time.time()
        
        if key in self.cache:
            cached_time = self.access_times[key]
            
            # Check if cache entry is still valid
            if current_time - cached_time < self.ttl:
                return self.cache[key]
            else:
                # Remove expired entry
                del self.cache[key]
                del self.access_times[key]
        
        return None
    
    def set(self, query, results, filters=None):
        """Cache search results"""
        key = self._generate_key(query, filters)
        current_time = time.time()
        
        # Remove oldest entries if cache is full
        if len(self.cache) >= self.max_size:
            oldest_key = min(self.access_times.keys(), 
                           key=lambda k: self.access_times[k])
            del self.cache[oldest_key]
            del self.access_times[oldest_key]
        
        self.cache[key] = results
        self.access_times[key] = current_time
    
    def invalidate_pattern(self, pattern):
        """Invalidate cache entries matching pattern"""
        keys_to_remove = [key for key in self.cache.keys() 
                         if pattern in key]
        
        for key in keys_to_remove:
            del self.cache[key]
            del self.access_times[key]
```

## Best Practices

### 1. Algorithm Selection

**Choose Based on Use Case**:
- **TF-IDF**: Good baseline for keyword-based search
- **BM25**: Better for varied document lengths
- **Neural Models**: Best for semantic understanding
- **Hybrid Approaches**: Combine multiple algorithms

### 2. Relevance Tuning

**A/B Testing Framework**:
```python
class RelevanceTester:
    def __init__(self):
        self.test_queries = []
        self.ground_truth = {}
    
    def add_test_case(self, query, relevant_docs, irrelevant_docs):
        """Add test case for evaluation"""
        self.test_queries.append(query)
        self.ground_truth[query] = {
            'relevant': set(relevant_docs),
            'irrelevant': set(irrelevant_docs)
        }
    
    def evaluate_ranking(self, ranking_function, k=10):
        """Evaluate ranking function using standard metrics"""
        total_precision = 0
        total_recall = 0
        total_ndcg = 0
        
        for query in self.test_queries:
            results = ranking_function(query, k)
            relevant_docs = self.ground_truth[query]['relevant']
            
            # Calculate precision@k
            retrieved_relevant = sum(1 for doc_id, _ in results 
                                   if doc_id in relevant_docs)
            precision = retrieved_relevant / len(results) if results else 0
            
            # Calculate recall@k
            recall = retrieved_relevant / len(relevant_docs) if relevant_docs else 0
            
            # Calculate NDCG@k (simplified)
            ndcg = self.calculate_ndcg(results, relevant_docs, k)
            
            total_precision += precision
            total_recall += recall
            total_ndcg += ndcg
        
        num_queries = len(self.test_queries)
        return {
            'precision@k': total_precision / num_queries,
            'recall@k': total_recall / num_queries,
            'ndcg@k': total_ndcg / num_queries
        }
    
    def calculate_ndcg(self, results, relevant_docs, k):
        """Calculate Normalized Discounted Cumulative Gain"""
        dcg = 0
        for i, (doc_id, score) in enumerate(results[:k]):
            if doc_id in relevant_docs:
                dcg += 1 / math.log2(i + 2)  # +2 because log2(1) = 0
        
        # Calculate ideal DCG
        idcg = sum(1 / math.log2(i + 2) for i in range(min(len(relevant_docs), k)))
        
        return dcg / idcg if idcg > 0 else 0
```

### 3. Performance Monitoring

**Key Metrics to Track**:
- Query latency (p50, p95, p99)
- Result relevance scores
- Click-through rates
- User engagement metrics
- Cache hit rates

## Summary

Search algorithms and ranking are fundamental to providing relevant results to users. Key takeaways:

- **Start with proven algorithms** like TF-IDF and BM25 for baseline performance
- **Consider multiple signals** beyond text matching (authority, freshness, engagement)
- **Implement proper query processing** to understand user intent
- **Use machine learning** for advanced relevance tuning
- **Monitor and optimize** continuously based on user behavior
- **Cache aggressively** to improve performance
- **A/B test** different ranking approaches to measure impact

The evolution from keyword-based to semantic search represents a significant advancement in information retrieval, enabling more intuitive and effective search experiences.
