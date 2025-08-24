# Indexing Strategies & Performance

## Introduction

Indexing is the process of organizing and structuring data to enable fast search and retrieval. A well-designed index can make the difference between millisecond and second response times, especially when dealing with large datasets. This section covers the fundamental indexing strategies used in search systems and techniques for optimizing search performance.

## Core Indexing Concepts

### Inverted Index

The inverted index is the fundamental data structure used by most search engines. It maps each unique term to a list of documents containing that term.

**Structure**:
```
Term → Posting List
"search" → [doc1:3, doc5:1, doc12:2, doc23:1]
"engine" → [doc1:2, doc8:1, doc15:3, doc23:2]
"algorithm" → [doc5:1, doc12:4, doc15:1]

Where doc1:3 means document 1 contains the term 3 times
```

**Implementation Example**:
```python
from collections import defaultdict, Counter
import json

class InvertedIndex:
    def __init__(self):
        self.index = defaultdict(list)  # term -> [(doc_id, frequency, positions)]
        self.documents = {}  # doc_id -> document content
        self.doc_lengths = {}  # doc_id -> document length
        self.total_docs = 0
    
    def add_document(self, doc_id, content):
        """Add a document to the index"""
        self.documents[doc_id] = content
        words = self.tokenize(content)
        self.doc_lengths[doc_id] = len(words)
        self.total_docs += 1
        
        # Count term frequencies and positions
        term_positions = defaultdict(list)
        for position, word in enumerate(words):
            term_positions[word].append(position)
        
        # Update inverted index
        for term, positions in term_positions.items():
            frequency = len(positions)
            self.index[term].append({
                'doc_id': doc_id,
                'frequency': frequency,
                'positions': positions
            })
    
    def tokenize(self, text):
        """Simple tokenization (in practice, use more sophisticated methods)"""
        import re
        # Convert to lowercase and split on non-alphanumeric characters
        words = re.findall(r'\b\w+\b', text.lower())
        return words
    
    def search(self, query):
        """Search for documents containing query terms"""
        query_terms = self.tokenize(query)
        
        if not query_terms:
            return []
        
        # Get posting lists for all query terms
        posting_lists = []
        for term in query_terms:
            if term in self.index:
                posting_lists.append(self.index[term])
            else:
                return []  # If any term is not found, no results
        
        # Find intersection of posting lists (documents containing all terms)
        if len(posting_lists) == 1:
            return posting_lists[0]
        
        # Intersect posting lists
        result_docs = set(entry['doc_id'] for entry in posting_lists[0])
        
        for posting_list in posting_lists[1:]:
            current_docs = set(entry['doc_id'] for entry in posting_list)
            result_docs = result_docs.intersection(current_docs)
        
        # Return detailed results for matching documents
        results = []
        for posting_list in posting_lists:
            for entry in posting_list:
                if entry['doc_id'] in result_docs:
                    results.append(entry)
        
        return results
    
    def phrase_search(self, phrase):
        """Search for exact phrase matches"""
        phrase_terms = self.tokenize(phrase)
        
        if len(phrase_terms) < 2:
            return self.search(phrase)
        
        # Get posting lists for all terms
        posting_lists = {}
        for term in phrase_terms:
            if term not in self.index:
                return []
            posting_lists[term] = {entry['doc_id']: entry for entry in self.index[term]}
        
        # Find documents containing all terms
        common_docs = set(posting_lists[phrase_terms[0]].keys())
        for term in phrase_terms[1:]:
            common_docs = common_docs.intersection(set(posting_lists[term].keys()))
        
        # Check for phrase matches in common documents
        phrase_matches = []
        
        for doc_id in common_docs:
            # Get positions for each term in this document
            term_positions = {}
            for term in phrase_terms:
                term_positions[term] = posting_lists[term][doc_id]['positions']
            
            # Check if terms appear consecutively
            first_term_positions = term_positions[phrase_terms[0]]
            
            for start_pos in first_term_positions:
                is_phrase_match = True
                
                for i, term in enumerate(phrase_terms[1:], 1):
                    expected_pos = start_pos + i
                    if expected_pos not in term_positions[term]:
                        is_phrase_match = False
                        break
                
                if is_phrase_match:
                    phrase_matches.append({
                        'doc_id': doc_id,
                        'phrase_position': start_pos,
                        'content': self.documents[doc_id]
                    })
                    break  # Found phrase in this document
        
        return phrase_matches
    
    def get_statistics(self):
        """Get index statistics"""
        total_terms = len(self.index)
        total_postings = sum(len(posting_list) for posting_list in self.index.values())
        
        return {
            'total_documents': self.total_docs,
            'total_unique_terms': total_terms,
            'total_postings': total_postings,
            'average_doc_length': sum(self.doc_lengths.values()) / len(self.doc_lengths) if self.doc_lengths else 0
        }

# Example usage
index = InvertedIndex()

# Add documents
documents = [
    (1, "Machine learning algorithms are powerful tools for data analysis"),
    (2, "Deep learning is a subset of machine learning using neural networks"),
    (3, "Data analysis requires understanding of statistical methods"),
    (4, "Neural networks are inspired by biological neural systems"),
    (5, "Machine learning and data analysis go hand in hand")
]

for doc_id, content in documents:
    index.add_document(doc_id, content)

# Search examples
print("Search results for 'machine learning':")
results = index.search("machine learning")
for result in results:
    print(f"Doc {result['doc_id']}: {index.documents[result['doc_id']]}")

print("\nPhrase search for 'machine learning':")
phrase_results = index.phrase_search("machine learning")
for result in phrase_results:
    print(f"Doc {result['doc_id']}: {result['content']}")

print(f"\nIndex statistics: {index.get_statistics()}")
```

### Index Compression

Large indexes consume significant storage and memory. Compression techniques reduce space requirements while maintaining search performance.

**Delta Compression for Posting Lists**:
```python
class CompressedIndex:
    def __init__(self):
        self.index = {}
    
    def compress_posting_list(self, doc_ids):
        """Compress posting list using delta encoding"""
        if not doc_ids:
            return []
        
        sorted_ids = sorted(doc_ids)
        compressed = [sorted_ids[0]]  # First ID as-is
        
        # Store differences (deltas) instead of absolute values
        for i in range(1, len(sorted_ids)):
            delta = sorted_ids[i] - sorted_ids[i-1]
            compressed.append(delta)
        
        return compressed
    
    def decompress_posting_list(self, compressed_list):
        """Decompress delta-encoded posting list"""
        if not compressed_list:
            return []
        
        decompressed = [compressed_list[0]]
        
        for i in range(1, len(compressed_list)):
            next_id = decompressed[-1] + compressed_list[i]
            decompressed.append(next_id)
        
        return decompressed
    
    def variable_byte_encode(self, numbers):
        """Variable-byte encoding for integers"""
        encoded = bytearray()
        
        for num in numbers:
            bytes_for_num = []
            
            while num >= 128:
                bytes_for_num.append((num % 128) | 128)  # Set continuation bit
                num //= 128
            
            bytes_for_num.append(num)  # Last byte without continuation bit
            encoded.extend(bytes_for_num)
        
        return bytes(encoded)
    
    def variable_byte_decode(self, encoded_bytes):
        """Decode variable-byte encoded integers"""
        decoded = []
        current_num = 0
        shift = 0
        
        for byte in encoded_bytes:
            current_num += (byte & 127) << shift
            
            if byte < 128:  # No continuation bit
                decoded.append(current_num)
                current_num = 0
                shift = 0
            else:
                shift += 7
        
        return decoded

# Example usage
compressor = CompressedIndex()

# Example posting list
doc_ids = [1, 3, 7, 8, 12, 15, 20, 25, 30]
print(f"Original: {doc_ids}")

# Delta compression
compressed = compressor.compress_posting_list(doc_ids)
print(f"Delta compressed: {compressed}")

decompressed = compressor.decompress_posting_list(compressed)
print(f"Decompressed: {decompressed}")

# Variable-byte encoding
vb_encoded = compressor.variable_byte_encode(compressed)
print(f"Variable-byte encoded: {list(vb_encoded)}")

vb_decoded = compressor.variable_byte_decode(vb_encoded)
print(f"Variable-byte decoded: {vb_decoded}")
```

## Distributed Indexing

### Sharding Strategies

**Document-based Sharding**:
```python
import hashlib

class ShardedIndex:
    def __init__(self, num_shards=4):
        self.num_shards = num_shards
        self.shards = [InvertedIndex() for _ in range(num_shards)]
    
    def get_shard(self, doc_id):
        """Determine which shard a document belongs to"""
        # Use hash-based sharding for even distribution
        hash_value = int(hashlib.md5(str(doc_id).encode()).hexdigest(), 16)
        return hash_value % self.num_shards
    
    def add_document(self, doc_id, content):
        """Add document to appropriate shard"""
        shard_index = self.get_shard(doc_id)
        self.shards[shard_index].add_document(doc_id, content)
    
    def search(self, query):
        """Search across all shards and merge results"""
        all_results = []
        
        # Query each shard
        for shard in self.shards:
            shard_results = shard.search(query)
            all_results.extend(shard_results)
        
        # Sort by relevance (would use actual scoring in practice)
        all_results.sort(key=lambda x: x['frequency'], reverse=True)
        
        return all_results
    
    def get_shard_statistics(self):
        """Get statistics for each shard"""
        stats = []
        for i, shard in enumerate(self.shards):
            shard_stats = shard.get_statistics()
            shard_stats['shard_id'] = i
            stats.append(shard_stats)
        
        return stats

# Example usage
sharded_index = ShardedIndex(num_shards=3)

# Add documents (they'll be distributed across shards)
for doc_id, content in documents:
    sharded_index.add_document(doc_id, content)

# Search across all shards
results = sharded_index.search("machine learning")
print(f"Found {len(results)} results across shards")

# Check shard distribution
for stats in sharded_index.get_shard_statistics():
    print(f"Shard {stats['shard_id']}: {stats['total_documents']} documents")
```

**Term-based Sharding**:
```python
class TermShardedIndex:
    def __init__(self, num_shards=4):
        self.num_shards = num_shards
        self.term_shards = [defaultdict(list) for _ in range(num_shards)]
        self.documents = {}
    
    def get_term_shard(self, term):
        """Determine which shard a term belongs to"""
        hash_value = int(hashlib.md5(term.encode()).hexdigest(), 16)
        return hash_value % self.num_shards
    
    def add_document(self, doc_id, content):
        """Add document to term-based shards"""
        self.documents[doc_id] = content
        words = content.lower().split()
        
        # Group terms by shard
        shard_terms = defaultdict(list)
        for word in words:
            shard_id = self.get_term_shard(word)
            shard_terms[shard_id].append(word)
        
        # Add to appropriate shards
        for shard_id, terms in shard_terms.items():
            term_counts = Counter(terms)
            for term, count in term_counts.items():
                self.term_shards[shard_id][term].append({
                    'doc_id': doc_id,
                    'frequency': count
                })
    
    def search(self, query):
        """Search across term shards"""
        query_terms = query.lower().split()
        
        # Group query terms by shard
        shard_queries = defaultdict(list)
        for term in query_terms:
            shard_id = self.get_term_shard(term)
            shard_queries[shard_id].append(term)
        
        # Query relevant shards
        all_results = []
        for shard_id, terms in shard_queries.items():
            for term in terms:
                if term in self.term_shards[shard_id]:
                    all_results.extend(self.term_shards[shard_id][term])
        
        return all_results
```

## Performance Optimization Techniques

### Index Warming and Caching

```python
import time
from threading import Thread, Lock

class CachedIndex:
    def __init__(self, base_index):
        self.base_index = base_index
        self.query_cache = {}
        self.cache_lock = Lock()
        self.cache_stats = {'hits': 0, 'misses': 0}
        
        # Warm up cache with common queries
        self.warm_up_queries = []
        self.is_warming = False
    
    def add_warm_up_query(self, query):
        """Add query to warm-up list"""
        self.warm_up_queries.append(query)
    
    def warm_up_cache(self):
        """Pre-populate cache with common queries"""
        self.is_warming = True
        
        def warm_up_worker():
            for query in self.warm_up_queries:
                if query not in self.query_cache:
                    results = self.base_index.search(query)
                    with self.cache_lock:
                        self.query_cache[query] = {
                            'results': results,
                            'timestamp': time.time()
                        }
            self.is_warming = False
        
        # Run warm-up in background
        warm_up_thread = Thread(target=warm_up_worker)
        warm_up_thread.daemon = True
        warm_up_thread.start()
    
    def search(self, query, use_cache=True):
        """Search with caching"""
        if use_cache:
            with self.cache_lock:
                if query in self.query_cache:
                    self.cache_stats['hits'] += 1
                    return self.query_cache[query]['results']
                else:
                    self.cache_stats['misses'] += 1
        
        # Cache miss - perform actual search
        results = self.base_index.search(query)
        
        # Cache the results
        if use_cache:
            with self.cache_lock:
                self.query_cache[query] = {
                    'results': results,
                    'timestamp': time.time()
                }
        
        return results
    
    def get_cache_stats(self):
        """Get cache performance statistics"""
        total_queries = self.cache_stats['hits'] + self.cache_stats['misses']
        hit_rate = self.cache_stats['hits'] / total_queries if total_queries > 0 else 0
        
        return {
            'hit_rate': hit_rate,
            'total_queries': total_queries,
            'cache_size': len(self.query_cache),
            'is_warming': self.is_warming
        }
    
    def clear_cache(self):
        """Clear the query cache"""
        with self.cache_lock:
            self.query_cache.clear()
            self.cache_stats = {'hits': 0, 'misses': 0}
```

### Incremental Indexing

```python
import threading
from queue import Queue
import time

class IncrementalIndex:
    def __init__(self, base_index):
        self.base_index = base_index
        self.update_queue = Queue()
        self.is_processing = False
        self.batch_size = 100
        self.batch_timeout = 5  # seconds
        
        # Start background processing
        self.start_background_processing()
    
    def add_document_async(self, doc_id, content):
        """Add document to update queue for background processing"""
        self.update_queue.put(('add', doc_id, content))
    
    def update_document_async(self, doc_id, content):
        """Update document asynchronously"""
        self.update_queue.put(('update', doc_id, content))
    
    def delete_document_async(self, doc_id):
        """Delete document asynchronously"""
        self.update_queue.put(('delete', doc_id, None))
    
    def start_background_processing(self):
        """Start background thread for processing updates"""
        def process_updates():
            self.is_processing = True
            batch = []
            last_batch_time = time.time()
            
            while self.is_processing:
                try:
                    # Get update from queue (with timeout)
                    update = self.update_queue.get(timeout=1)
                    batch.append(update)
                    
                    # Process batch if it's full or timeout reached
                    current_time = time.time()
                    if (len(batch) >= self.batch_size or 
                        current_time - last_batch_time >= self.batch_timeout):
                        
                        self.process_batch(batch)
                        batch = []
                        last_batch_time = current_time
                
                except:
                    # Timeout or other exception - process any pending batch
                    if batch:
                        self.process_batch(batch)
                        batch = []
                        last_batch_time = time.time()
        
        processing_thread = threading.Thread(target=process_updates)
        processing_thread.daemon = True
        processing_thread.start()
    
    def process_batch(self, batch):
        """Process a batch of updates"""
        for operation, doc_id, content in batch:
            if operation == 'add':
                self.base_index.add_document(doc_id, content)
            elif operation == 'update':
                # Remove old version and add new (simplified)
                self.base_index.add_document(doc_id, content)
            elif operation == 'delete':
                # Would implement document deletion
                pass
    
    def search(self, query):
        """Search the index (delegates to base index)"""
        return self.base_index.search(query)
    
    def flush_updates(self):
        """Force processing of all pending updates"""
        while not self.update_queue.empty():
            time.sleep(0.1)  # Wait for queue to be processed
    
    def stop_processing(self):
        """Stop background processing"""
        self.is_processing = False
        self.flush_updates()
```

## Index Maintenance and Optimization

### Index Merging and Compaction

```python
class IndexMaintenance:
    def __init__(self, index):
        self.index = index
        self.merge_threshold = 1000  # Merge when posting list exceeds this size
    
    def optimize_index(self):
        """Optimize index by merging and compacting"""
        optimizations = {
            'merged_terms': 0,
            'removed_duplicates': 0,
            'compressed_postings': 0
        }
        
        for term, posting_list in self.index.index.items():
            if len(posting_list) > self.merge_threshold:
                # Merge duplicate entries for same document
                merged_postings = self.merge_duplicate_postings(posting_list)
                
                if len(merged_postings) < len(posting_list):
                    self.index.index[term] = merged_postings
                    optimizations['merged_terms'] += 1
                    optimizations['removed_duplicates'] += len(posting_list) - len(merged_postings)
        
        return optimizations
    
    def merge_duplicate_postings(self, posting_list):
        """Merge multiple entries for the same document"""
        doc_entries = {}
        
        for entry in posting_list:
            doc_id = entry['doc_id']
            
            if doc_id in doc_entries:
                # Merge frequencies and positions
                doc_entries[doc_id]['frequency'] += entry['frequency']
                doc_entries[doc_id]['positions'].extend(entry['positions'])
                doc_entries[doc_id]['positions'].sort()
            else:
                doc_entries[doc_id] = entry.copy()
        
        return list(doc_entries.values())
    
    def analyze_index_health(self):
        """Analyze index for potential issues"""
        analysis = {
            'total_terms': len(self.index.index),
            'large_posting_lists': 0,
            'empty_posting_lists': 0,
            'duplicate_entries': 0,
            'memory_usage_mb': 0
        }
        
        for term, posting_list in self.index.index.items():
            if not posting_list:
                analysis['empty_posting_lists'] += 1
            elif len(posting_list) > self.merge_threshold:
                analysis['large_posting_lists'] += 1
            
            # Check for duplicates
            doc_ids = [entry['doc_id'] for entry in posting_list]
            if len(doc_ids) != len(set(doc_ids)):
                analysis['duplicate_entries'] += 1
        
        # Estimate memory usage (simplified)
        import sys
        analysis['memory_usage_mb'] = sys.getsizeof(self.index.index) / (1024 * 1024)
        
        return analysis
```

## Best Practices

### 1. Index Design Principles

**Choose Appropriate Granularity**:
- **Document-level**: Fast for simple queries
- **Field-level**: Better for structured data
- **Position-level**: Required for phrase queries

**Optimize for Query Patterns**:
```python
class QueryPatternOptimizer:
    def __init__(self):
        self.query_stats = defaultdict(int)
        self.field_usage = defaultdict(int)
    
    def log_query(self, query, fields_searched):
        """Log query patterns for optimization"""
        self.query_stats[query] += 1
        
        for field in fields_searched:
            self.field_usage[field] += 1
    
    def get_optimization_recommendations(self):
        """Suggest index optimizations based on usage patterns"""
        recommendations = []
        
        # Recommend caching for frequent queries
        frequent_queries = [(q, count) for q, count in self.query_stats.items() 
                          if count > 100]
        
        if frequent_queries:
            recommendations.append({
                'type': 'caching',
                'description': f'Cache {len(frequent_queries)} frequent queries',
                'queries': frequent_queries[:10]  # Top 10
            })
        
        # Recommend field-specific optimizations
        popular_fields = [(field, count) for field, count in self.field_usage.items() 
                         if count > 50]
        
        if popular_fields:
            recommendations.append({
                'type': 'field_optimization',
                'description': 'Optimize indexes for popular fields',
                'fields': popular_fields
            })
        
        return recommendations
```

### 2. Performance Monitoring

**Key Metrics to Track**:
```python
class IndexPerformanceMonitor:
    def __init__(self):
        self.metrics = {
            'query_latency': [],
            'index_size': 0,
            'memory_usage': 0,
            'cache_hit_rate': 0,
            'queries_per_second': 0
        }
        self.start_time = time.time()
        self.query_count = 0
    
    def record_query(self, query_time):
        """Record query execution time"""
        self.metrics['query_latency'].append(query_time)
        self.query_count += 1
    
    def get_performance_summary(self):
        """Get performance summary"""
        if not self.metrics['query_latency']:
            return {'status': 'No queries recorded'}
        
        latencies = self.metrics['query_latency']
        elapsed_time = time.time() - self.start_time
        
        return {
            'avg_latency_ms': sum(latencies) / len(latencies) * 1000,
            'p95_latency_ms': sorted(latencies)[int(len(latencies) * 0.95)] * 1000,
            'queries_per_second': self.query_count / elapsed_time if elapsed_time > 0 else 0,
            'total_queries': self.query_count,
            'index_size_mb': self.metrics['index_size'] / (1024 * 1024)
        }
```

### 3. Scaling Strategies

**Horizontal Scaling**:
- Shard by document ID for balanced load
- Shard by term for specialized queries
- Use consistent hashing for dynamic scaling

**Vertical Scaling**:
- Optimize memory usage with compression
- Use SSD storage for better I/O performance
- Implement proper caching layers

## Summary

Effective indexing is crucial for search system performance. Key takeaways:

- **Inverted indexes** are the foundation of most search systems
- **Compression techniques** significantly reduce storage requirements
- **Sharding strategies** enable horizontal scaling across multiple machines
- **Caching and warming** improve query response times
- **Incremental indexing** allows real-time updates without full rebuilds
- **Regular maintenance** keeps indexes optimized and healthy
- **Monitor performance** continuously to identify optimization opportunities

The choice of indexing strategy depends on your specific requirements: query patterns, data size, update frequency, and performance requirements. Start with simple approaches and optimize based on actual usage patterns.
