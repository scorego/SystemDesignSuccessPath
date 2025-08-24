# Recommendation Systems Basics

## Introduction

Recommendation systems are algorithms designed to suggest relevant items to users based on various data points such as past behavior, preferences, and similarities with other users. They power the "you might also like" features in e-commerce, content streaming platforms, social media, and many other applications.

Understanding recommendation systems is crucial for modern applications as they significantly impact user engagement, satisfaction, and business metrics. This section covers the fundamental approaches and algorithms used to build effective recommendation systems.

## Types of Recommendation Systems

### 1. Collaborative Filtering

**Concept**: Recommends items based on the preferences of similar users or items.

**User-Based Collaborative Filtering**:
```python
import numpy as np
from scipy.spatial.distance import cosine
from collections import defaultdict

class UserBasedCollaborativeFiltering:
    def __init__(self):
        self.user_item_matrix = {}  # user_id -> {item_id: rating}
        self.users = set()
        self.items = set()
    
    def add_rating(self, user_id, item_id, rating):
        """Add a user rating for an item"""
        if user_id not in self.user_item_matrix:
            self.user_item_matrix[user_id] = {}
        
        self.user_item_matrix[user_id][item_id] = rating
        self.users.add(user_id)
        self.items.add(item_id)
    
    def get_user_similarity(self, user1, user2):
        """Calculate similarity between two users using cosine similarity"""
        user1_ratings = self.user_item_matrix.get(user1, {})
        user2_ratings = self.user_item_matrix.get(user2, {})
        
        # Find common items
        common_items = set(user1_ratings.keys()) & set(user2_ratings.keys())
        
        if len(common_items) < 2:
            return 0  # Not enough common items
        
        # Create vectors for common items
        vector1 = [user1_ratings[item] for item in common_items]
        vector2 = [user2_ratings[item] for item in common_items]
        
        # Calculate cosine similarity
        return 1 - cosine(vector1, vector2)
    
    def find_similar_users(self, target_user, k=5):
        """Find k most similar users to target user"""
        similarities = []
        
        for user in self.users:
            if user != target_user:
                similarity = self.get_user_similarity(target_user, user)
                similarities.append((user, similarity))
        
        # Sort by similarity (descending) and return top k
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:k]
    
    def predict_rating(self, user_id, item_id):
        """Predict rating for user-item pair"""
        if user_id not in self.user_item_matrix:
            return 0
        
        # If user already rated this item, return existing rating
        if item_id in self.user_item_matrix[user_id]:
            return self.user_item_matrix[user_id][item_id]
        
        # Find similar users who rated this item
        similar_users = self.find_similar_users(user_id)
        
        weighted_sum = 0
        similarity_sum = 0
        
        for similar_user, similarity in similar_users:
            if item_id in self.user_item_matrix[similar_user]:
                rating = self.user_item_matrix[similar_user][item_id]
                weighted_sum += similarity * rating
                similarity_sum += abs(similarity)
        
        if similarity_sum == 0:
            return 0
        
        return weighted_sum / similarity_sum
    
    def recommend_items(self, user_id, k=10):
        """Recommend k items for a user"""
        if user_id not in self.user_item_matrix:
            return []
        
        user_rated_items = set(self.user_item_matrix[user_id].keys())
        unrated_items = self.items - user_rated_items
        
        # Predict ratings for unrated items
        predictions = []
        for item in unrated_items:
            predicted_rating = self.predict_rating(user_id, item)
            if predicted_rating > 0:
                predictions.append((item, predicted_rating))
        
        # Sort by predicted rating and return top k
        predictions.sort(key=lambda x: x[1], reverse=True)
        return predictions[:k]

# Example usage
cf = UserBasedCollaborativeFiltering()

# Add sample ratings (user_id, item_id, rating)
ratings = [
    (1, 'movie_a', 5), (1, 'movie_b', 3), (1, 'movie_c', 4),
    (2, 'movie_a', 4), (2, 'movie_b', 2), (2, 'movie_d', 5),
    (3, 'movie_a', 5), (3, 'movie_c', 4), (3, 'movie_d', 4),
    (4, 'movie_b', 1), (4, 'movie_c', 3), (4, 'movie_d', 5),
]

for user, item, rating in ratings:
    cf.add_rating(user, item, rating)

# Get recommendations for user 1
recommendations = cf.recommend_items(1, k=5)
print(f"Recommendations for user 1: {recommendations}")
```

**Item-Based Collaborative Filtering**:
```python
class ItemBasedCollaborativeFiltering:
    def __init__(self):
        self.user_item_matrix = defaultdict(dict)
        self.item_similarity_cache = {}
    
    def add_rating(self, user_id, item_id, rating):
        """Add a user rating for an item"""
        self.user_item_matrix[user_id][item_id] = rating
    
    def get_item_similarity(self, item1, item2):
        """Calculate similarity between two items"""
        # Check cache first
        cache_key = tuple(sorted([item1, item2]))
        if cache_key in self.item_similarity_cache:
            return self.item_similarity_cache[cache_key]
        
        # Find users who rated both items
        item1_users = set()
        item2_users = set()
        
        for user, ratings in self.user_item_matrix.items():
            if item1 in ratings:
                item1_users.add(user)
            if item2 in ratings:
                item2_users.add(user)
        
        common_users = item1_users & item2_users
        
        if len(common_users) < 2:
            similarity = 0
        else:
            # Create rating vectors for common users
            ratings1 = [self.user_item_matrix[user][item1] for user in common_users]
            ratings2 = [self.user_item_matrix[user][item2] for user in common_users]
            
            # Calculate cosine similarity
            similarity = 1 - cosine(ratings1, ratings2)
        
        # Cache the result
        self.item_similarity_cache[cache_key] = similarity
        return similarity
    
    def find_similar_items(self, target_item, k=5):
        """Find k most similar items to target item"""
        similarities = []
        
        # Get all items
        all_items = set()
        for ratings in self.user_item_matrix.values():
            all_items.update(ratings.keys())
        
        for item in all_items:
            if item != target_item:
                similarity = self.get_item_similarity(target_item, item)
                similarities.append((item, similarity))
        
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:k]
    
    def recommend_items(self, user_id, k=10):
        """Recommend items based on item similarity"""
        if user_id not in self.user_item_matrix:
            return []
        
        user_ratings = self.user_item_matrix[user_id]
        recommendations = defaultdict(float)
        
        # For each item the user has rated
        for rated_item, rating in user_ratings.items():
            # Find similar items
            similar_items = self.find_similar_items(rated_item)
            
            # Add weighted scores for similar items
            for similar_item, similarity in similar_items:
                if similar_item not in user_ratings:  # Only recommend unrated items
                    recommendations[similar_item] += similarity * rating
        
        # Sort recommendations by score
        sorted_recommendations = sorted(recommendations.items(), 
                                      key=lambda x: x[1], reverse=True)
        
        return sorted_recommendations[:k]
```

### 2. Content-Based Filtering

**Concept**: Recommends items similar to those the user has liked based on item features.

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd

class ContentBasedRecommender:
    def __init__(self):
        self.items = {}  # item_id -> features
        self.user_profiles = {}  # user_id -> preference profile
        self.tfidf_vectorizer = TfidfVectorizer(stop_words='english')
        self.item_features_matrix = None
        self.item_ids = []
    
    def add_item(self, item_id, features):
        """Add an item with its features"""
        self.items[item_id] = features
    
    def build_item_profiles(self):
        """Build TF-IDF matrix for item features"""
        if not self.items:
            return
        
        self.item_ids = list(self.items.keys())
        
        # Combine all text features for each item
        item_descriptions = []
        for item_id in self.item_ids:
            features = self.items[item_id]
            # Combine text features (assuming features is a dict with text values)
            description = ' '.join(str(v) for v in features.values() if isinstance(v, str))
            item_descriptions.append(description)
        
        # Create TF-IDF matrix
        self.item_features_matrix = self.tfidf_vectorizer.fit_transform(item_descriptions)
    
    def build_user_profile(self, user_id, rated_items):
        """Build user profile based on rated items"""
        if self.item_features_matrix is None:
            self.build_item_profiles()
        
        user_profile = np.zeros(self.item_features_matrix.shape[1])
        total_weight = 0
        
        for item_id, rating in rated_items.items():
            if item_id in self.item_ids:
                item_index = self.item_ids.index(item_id)
                item_features = self.item_features_matrix[item_index].toarray()[0]
                
                # Weight by rating (assuming ratings are 1-5)
                weight = rating / 5.0
                user_profile += weight * item_features
                total_weight += weight
        
        if total_weight > 0:
            user_profile /= total_weight
        
        self.user_profiles[user_id] = user_profile
        return user_profile
    
    def recommend_items(self, user_id, rated_items, k=10):
        """Recommend items based on user profile"""
        if self.item_features_matrix is None:
            self.build_item_profiles()
        
        # Build or get user profile
        if user_id not in self.user_profiles:
            self.build_user_profile(user_id, rated_items)
        
        user_profile = self.user_profiles[user_id]
        
        # Calculate similarity between user profile and all items
        similarities = cosine_similarity([user_profile], self.item_features_matrix)[0]
        
        # Create recommendations (exclude already rated items)
        recommendations = []
        for i, similarity in enumerate(similarities):
            item_id = self.item_ids[i]
            if item_id not in rated_items:
                recommendations.append((item_id, similarity))
        
        # Sort by similarity and return top k
        recommendations.sort(key=lambda x: x[1], reverse=True)
        return recommendations[:k]

# Example usage
cb_recommender = ContentBasedRecommender()

# Add items with features
items = {
    'movie_1': {'genre': 'action sci-fi', 'director': 'Christopher Nolan', 'year': '2010'},
    'movie_2': {'genre': 'romantic comedy', 'director': 'Nancy Meyers', 'year': '2003'},
    'movie_3': {'genre': 'action thriller', 'director': 'Michael Bay', 'year': '2019'},
    'movie_4': {'genre': 'sci-fi drama', 'director': 'Denis Villeneuve', 'year': '2016'},
}

for item_id, features in items.items():
    cb_recommender.add_item(item_id, features)

# User ratings
user_ratings = {'movie_1': 5, 'movie_4': 4}

# Get recommendations
recommendations = cb_recommender.recommend_items('user_1', user_ratings, k=5)
print(f"Content-based recommendations: {recommendations}")
```

### 3. Hybrid Approaches

**Concept**: Combines multiple recommendation techniques for better performance.

```python
class HybridRecommender:
    def __init__(self, collaborative_weight=0.6, content_weight=0.4):
        self.collaborative_recommender = UserBasedCollaborativeFiltering()
        self.content_recommender = ContentBasedRecommender()
        self.collaborative_weight = collaborative_weight
        self.content_weight = content_weight
    
    def add_rating(self, user_id, item_id, rating):
        """Add rating to collaborative filtering system"""
        self.collaborative_recommender.add_rating(user_id, item_id, rating)
    
    def add_item(self, item_id, features):
        """Add item to content-based system"""
        self.content_recommender.add_item(item_id, features)
    
    def recommend_items(self, user_id, user_ratings, k=10):
        """Generate hybrid recommendations"""
        # Get recommendations from both systems
        cf_recommendations = self.collaborative_recommender.recommend_items(user_id, k*2)
        cb_recommendations = self.content_recommender.recommend_items(user_id, user_ratings, k*2)
        
        # Combine recommendations with weights
        combined_scores = defaultdict(float)
        
        # Add collaborative filtering scores
        for item, score in cf_recommendations:
            combined_scores[item] += self.collaborative_weight * score
        
        # Add content-based scores
        for item, score in cb_recommendations:
            combined_scores[item] += self.content_weight * score
        
        # Sort by combined score
        final_recommendations = sorted(combined_scores.items(), 
                                     key=lambda x: x[1], reverse=True)
        
        return final_recommendations[:k]
```

## Advanced Recommendation Algorithms

### Matrix Factorization

**Concept**: Decomposes the user-item rating matrix into lower-dimensional matrices to discover latent factors.

```python
import numpy as np

class MatrixFactorization:
    def __init__(self, n_factors=50, learning_rate=0.01, regularization=0.01, n_iterations=100):
        self.n_factors = n_factors
        self.learning_rate = learning_rate
        self.regularization = regularization
        self.n_iterations = n_iterations
        
        self.user_factors = None
        self.item_factors = None
        self.user_biases = None
        self.item_biases = None
        self.global_bias = 0
    
    def fit(self, ratings_matrix, user_ids, item_ids):
        """Train the matrix factorization model"""
        n_users = len(user_ids)
        n_items = len(item_ids)
        
        # Initialize factors and biases
        self.user_factors = np.random.normal(0, 0.1, (n_users, self.n_factors))
        self.item_factors = np.random.normal(0, 0.1, (n_items, self.n_factors))
        self.user_biases = np.zeros(n_users)
        self.item_biases = np.zeros(n_items)
        
        # Calculate global bias (mean of all ratings)
        non_zero_ratings = ratings_matrix[ratings_matrix > 0]
        self.global_bias = np.mean(non_zero_ratings) if len(non_zero_ratings) > 0 else 0
        
        # Create mappings
        self.user_id_to_index = {user_id: i for i, user_id in enumerate(user_ids)}
        self.item_id_to_index = {item_id: i for i, item_id in enumerate(item_ids)}
        
        # Training loop
        for iteration in range(self.n_iterations):
            for user_idx in range(n_users):
                for item_idx in range(n_items):
                    rating = ratings_matrix[user_idx, item_idx]
                    
                    if rating > 0:  # Only train on observed ratings
                        # Predict rating
                        prediction = self.predict_rating_by_index(user_idx, item_idx)
                        error = rating - prediction
                        
                        # Update factors using gradient descent
                        user_factor = self.user_factors[user_idx].copy()
                        item_factor = self.item_factors[item_idx].copy()
                        
                        # Update user factors
                        self.user_factors[user_idx] += self.learning_rate * (
                            error * item_factor - self.regularization * user_factor
                        )
                        
                        # Update item factors
                        self.item_factors[item_idx] += self.learning_rate * (
                            error * user_factor - self.regularization * item_factor
                        )
                        
                        # Update biases
                        self.user_biases[user_idx] += self.learning_rate * (
                            error - self.regularization * self.user_biases[user_idx]
                        )
                        
                        self.item_biases[item_idx] += self.learning_rate * (
                            error - self.regularization * self.item_biases[item_idx]
                        )
    
    def predict_rating_by_index(self, user_idx, item_idx):
        """Predict rating using matrix indices"""
        prediction = (self.global_bias + 
                     self.user_biases[user_idx] + 
                     self.item_biases[item_idx] + 
                     np.dot(self.user_factors[user_idx], self.item_factors[item_idx]))
        
        return prediction
    
    def predict_rating(self, user_id, item_id):
        """Predict rating for user-item pair"""
        if user_id not in self.user_id_to_index or item_id not in self.item_id_to_index:
            return self.global_bias
        
        user_idx = self.user_id_to_index[user_id]
        item_idx = self.item_id_to_index[item_id]
        
        return self.predict_rating_by_index(user_idx, item_idx)
    
    def recommend_items(self, user_id, rated_items, k=10):
        """Recommend items for a user"""
        if user_id not in self.user_id_to_index:
            return []
        
        user_idx = self.user_id_to_index[user_id]
        recommendations = []
        
        for item_id, item_idx in self.item_id_to_index.items():
            if item_id not in rated_items:
                predicted_rating = self.predict_rating_by_index(user_idx, item_idx)
                recommendations.append((item_id, predicted_rating))
        
        recommendations.sort(key=lambda x: x[1], reverse=True)
        return recommendations[:k]

# Example usage
mf = MatrixFactorization(n_factors=10, n_iterations=50)

# Create sample ratings matrix
users = ['user_1', 'user_2', 'user_3', 'user_4']
items = ['item_a', 'item_b', 'item_c', 'item_d', 'item_e']

# Sample ratings (0 means no rating)
ratings_matrix = np.array([
    [5, 3, 0, 1, 0],
    [4, 0, 0, 1, 2],
    [1, 1, 0, 5, 0],
    [1, 0, 0, 4, 0]
])

mf.fit(ratings_matrix, users, items)

# Get recommendations
user_rated_items = {'item_a': 5, 'item_b': 3}
recommendations = mf.recommend_items('user_1', user_rated_items, k=3)
print(f"Matrix factorization recommendations: {recommendations}")
```

### Deep Learning Approaches

**Neural Collaborative Filtering**:
```python
import torch
import torch.nn as nn
import torch.optim as optim

class NeuralCollaborativeFiltering(nn.Module):
    def __init__(self, n_users, n_items, embedding_dim=50, hidden_dims=[100, 50]):
        super().__init__()
        
        self.n_users = n_users
        self.n_items = n_items
        self.embedding_dim = embedding_dim
        
        # Embeddings
        self.user_embedding = nn.Embedding(n_users, embedding_dim)
        self.item_embedding = nn.Embedding(n_items, embedding_dim)
        
        # Neural network layers
        input_dim = embedding_dim * 2
        layers = []
        
        for hidden_dim in hidden_dims:
            layers.append(nn.Linear(input_dim, hidden_dim))
            layers.append(nn.ReLU())
            layers.append(nn.Dropout(0.2))
            input_dim = hidden_dim
        
        layers.append(nn.Linear(input_dim, 1))
        layers.append(nn.Sigmoid())
        
        self.neural_network = nn.Sequential(*layers)
        
        # Initialize embeddings
        nn.init.normal_(self.user_embedding.weight, std=0.01)
        nn.init.normal_(self.item_embedding.weight, std=0.01)
    
    def forward(self, user_ids, item_ids):
        """Forward pass"""
        user_embeds = self.user_embedding(user_ids)
        item_embeds = self.item_embedding(item_ids)
        
        # Concatenate embeddings
        x = torch.cat([user_embeds, item_embeds], dim=1)
        
        # Pass through neural network
        output = self.neural_network(x)
        
        return output.squeeze()
    
    def predict(self, user_id, item_id):
        """Predict rating for single user-item pair"""
        self.eval()
        with torch.no_grad():
            user_tensor = torch.tensor([user_id], dtype=torch.long)
            item_tensor = torch.tensor([item_id], dtype=torch.long)
            prediction = self.forward(user_tensor, item_tensor)
            return prediction.item()

class NCFTrainer:
    def __init__(self, model, learning_rate=0.001):
        self.model = model
        self.optimizer = optim.Adam(model.parameters(), lr=learning_rate)
        self.criterion = nn.MSELoss()
    
    def train_epoch(self, train_data):
        """Train for one epoch"""
        self.model.train()
        total_loss = 0
        
        for batch in train_data:
            user_ids, item_ids, ratings = batch
            
            # Forward pass
            predictions = self.model(user_ids, item_ids)
            loss = self.criterion(predictions, ratings.float())
            
            # Backward pass
            self.optimizer.zero_grad()
            loss.backward()
            self.optimizer.step()
            
            total_loss += loss.item()
        
        return total_loss / len(train_data)
    
    def train(self, train_data, n_epochs=100):
        """Train the model"""
        for epoch in range(n_epochs):
            loss = self.train_epoch(train_data)
            if epoch % 10 == 0:
                print(f"Epoch {epoch}, Loss: {loss:.4f}")

# Example usage would require proper data loading and preprocessing
```

## Evaluation Metrics

### Accuracy Metrics

```python
import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error

class RecommenderEvaluator:
    def __init__(self):
        pass
    
    def rmse(self, true_ratings, predicted_ratings):
        """Root Mean Square Error"""
        return np.sqrt(mean_squared_error(true_ratings, predicted_ratings))
    
    def mae(self, true_ratings, predicted_ratings):
        """Mean Absolute Error"""
        return mean_absolute_error(true_ratings, predicted_ratings)
    
    def precision_at_k(self, recommended_items, relevant_items, k):
        """Precision at K"""
        recommended_k = recommended_items[:k]
        relevant_recommended = len(set(recommended_k) & set(relevant_items))
        return relevant_recommended / k if k > 0 else 0
    
    def recall_at_k(self, recommended_items, relevant_items, k):
        """Recall at K"""
        recommended_k = recommended_items[:k]
        relevant_recommended = len(set(recommended_k) & set(relevant_items))
        return relevant_recommended / len(relevant_items) if len(relevant_items) > 0 else 0
    
    def f1_at_k(self, recommended_items, relevant_items, k):
        """F1 Score at K"""
        precision = self.precision_at_k(recommended_items, relevant_items, k)
        recall = self.recall_at_k(recommended_items, relevant_items, k)
        
        if precision + recall == 0:
            return 0
        
        return 2 * (precision * recall) / (precision + recall)
    
    def ndcg_at_k(self, recommended_items, relevant_items, k):
        """Normalized Discounted Cumulative Gain at K"""
        recommended_k = recommended_items[:k]
        
        # Calculate DCG
        dcg = 0
        for i, item in enumerate(recommended_k):
            if item in relevant_items:
                dcg += 1 / np.log2(i + 2)  # +2 because log2(1) = 0
        
        # Calculate IDCG (ideal DCG)
        idcg = sum(1 / np.log2(i + 2) for i in range(min(len(relevant_items), k)))
        
        return dcg / idcg if idcg > 0 else 0
    
    def coverage(self, all_recommendations, total_items):
        """Catalog coverage - fraction of items that can be recommended"""
        recommended_items = set()
        for recommendations in all_recommendations:
            recommended_items.update(item for item, _ in recommendations)
        
        return len(recommended_items) / total_items if total_items > 0 else 0
    
    def diversity(self, recommendations, item_features):
        """Average pairwise diversity of recommendations"""
        if len(recommendations) < 2:
            return 0
        
        total_distance = 0
        pairs = 0
        
        for i in range(len(recommendations)):
            for j in range(i + 1, len(recommendations)):
                item1, item2 = recommendations[i][0], recommendations[j][0]
                
                # Calculate feature-based distance (simplified)
                if item1 in item_features and item2 in item_features:
                    # This would use actual feature similarity calculation
                    distance = 1  # Placeholder
                    total_distance += distance
                    pairs += 1
        
        return total_distance / pairs if pairs > 0 else 0

# Example evaluation
evaluator = RecommenderEvaluator()

# Sample data
true_ratings = [4, 5, 3, 2, 4]
predicted_ratings = [3.8, 4.9, 3.2, 2.1, 3.9]

recommended_items = ['item_1', 'item_2', 'item_3', 'item_4', 'item_5']
relevant_items = ['item_1', 'item_3', 'item_5']

print(f"RMSE: {evaluator.rmse(true_ratings, predicted_ratings):.3f}")
print(f"Precision@3: {evaluator.precision_at_k(recommended_items, relevant_items, 3):.3f}")
print(f"Recall@3: {evaluator.recall_at_k(recommended_items, relevant_items, 3):.3f}")
print(f"NDCG@3: {evaluator.ndcg_at_k(recommended_items, relevant_items, 3):.3f}")
```

## Real-World Implementation Considerations

### Cold Start Problem

```python
class ColdStartHandler:
    def __init__(self):
        self.popular_items = []
        self.item_features = {}
        self.demographic_profiles = {}
    
    def handle_new_user(self, user_demographics=None):
        """Handle recommendations for new users"""
        recommendations = []
        
        # Strategy 1: Popular items
        recommendations.extend(self.get_popular_items(k=5))
        
        # Strategy 2: Demographic-based recommendations
        if user_demographics:
            demographic_recs = self.get_demographic_recommendations(user_demographics)
            recommendations.extend(demographic_recs)
        
        # Strategy 3: Diverse category sampling
        category_recs = self.get_diverse_category_recommendations()
        recommendations.extend(category_recs)
        
        return recommendations[:10]
    
    def handle_new_item(self, item_id, item_features):
        """Handle new items with no ratings"""
        # Use content-based similarity to existing items
        similar_items = self.find_content_similar_items(item_features)
        
        # Recommend to users who liked similar items
        target_users = []
        for similar_item, similarity in similar_items:
            # Find users who rated similar items highly
            pass  # Implementation would query user ratings
        
        return target_users
    
    def get_popular_items(self, k=10):
        """Get most popular items"""
        return self.popular_items[:k]
    
    def get_demographic_recommendations(self, demographics):
        """Get recommendations based on user demographics"""
        # This would use demographic-based collaborative filtering
        return []
    
    def get_diverse_category_recommendations(self):
        """Get diverse recommendations across categories"""
        # Ensure recommendations span different categories
        return []
    
    def find_content_similar_items(self, item_features):
        """Find items similar to new item based on content"""
        # Use content-based similarity
        return []
```

### Scalability and Performance

```python
import redis
import json
from concurrent.futures import ThreadPoolExecutor

class ScalableRecommender:
    def __init__(self, redis_host='localhost', redis_port=6379):
        self.redis_client = redis.Redis(host=redis_host, port=redis_port, decode_responses=True)
        self.cache_ttl = 3600  # 1 hour
        self.batch_size = 1000
    
    def cache_recommendations(self, user_id, recommendations):
        """Cache recommendations in Redis"""
        cache_key = f"recommendations:{user_id}"
        self.redis_client.setex(
            cache_key, 
            self.cache_ttl, 
            json.dumps(recommendations)
        )
    
    def get_cached_recommendations(self, user_id):
        """Get cached recommendations"""
        cache_key = f"recommendations:{user_id}"
        cached = self.redis_client.get(cache_key)
        
        if cached:
            return json.loads(cached)
        return None
    
    def batch_recommend(self, user_ids):
        """Generate recommendations for multiple users in parallel"""
        def recommend_for_user(user_id):
            # Check cache first
            cached = self.get_cached_recommendations(user_id)
            if cached:
                return user_id, cached
            
            # Generate new recommendations
            recommendations = self.generate_recommendations(user_id)
            
            # Cache results
            self.cache_recommendations(user_id, recommendations)
            
            return user_id, recommendations
        
        # Use thread pool for parallel processing
        with ThreadPoolExecutor(max_workers=10) as executor:
            results = list(executor.map(recommend_for_user, user_ids))
        
        return dict(results)
    
    def generate_recommendations(self, user_id):
        """Generate recommendations for a single user"""
        # This would call your actual recommendation algorithm
        return []
    
    def precompute_recommendations(self, user_ids):
        """Precompute recommendations for active users"""
        for i in range(0, len(user_ids), self.batch_size):
            batch = user_ids[i:i + self.batch_size]
            self.batch_recommend(batch)
```

## Best Practices

### 1. Algorithm Selection

**Choose Based on Data Availability**:
- **Rich user behavior data**: Collaborative filtering
- **Rich item metadata**: Content-based filtering
- **Both available**: Hybrid approaches
- **Limited data**: Popular items + content-based

### 2. Handling Bias and Fairness

```python
class FairnessAwareRecommender:
    def __init__(self, base_recommender):
        self.base_recommender = base_recommender
        self.fairness_constraints = {}
    
    def add_fairness_constraint(self, attribute, target_distribution):
        """Add fairness constraint for item attribute"""
        self.fairness_constraints[attribute] = target_distribution
    
    def rerank_for_fairness(self, recommendations, item_metadata):
        """Rerank recommendations to satisfy fairness constraints"""
        reranked = []
        attribute_counts = defaultdict(int)
        
        for item, score in recommendations:
            # Check if adding this item violates fairness constraints
            can_add = True
            
            for attribute, target_dist in self.fairness_constraints.items():
                if attribute in item_metadata.get(item, {}):
                    attr_value = item_metadata[item][attribute]
                    current_ratio = attribute_counts[attr_value] / max(len(reranked), 1)
                    
                    if current_ratio >= target_dist.get(attr_value, 0):
                        can_add = False
                        break
            
            if can_add:
                reranked.append((item, score))
                for attribute in self.fairness_constraints:
                    if attribute in item_metadata.get(item, {}):
                        attr_value = item_metadata[item][attribute]
                        attribute_counts[attr_value] += 1
        
        return reranked
```

### 3. A/B Testing Framework

```python
class RecommenderABTest:
    def __init__(self):
        self.experiments = {}
        self.user_assignments = {}
    
    def create_experiment(self, experiment_id, algorithms, traffic_split):
        """Create A/B test experiment"""
        self.experiments[experiment_id] = {
            'algorithms': algorithms,
            'traffic_split': traffic_split,
            'metrics': defaultdict(list)
        }
    
    def assign_user_to_variant(self, user_id, experiment_id):
        """Assign user to experiment variant"""
        if experiment_id not in self.experiments:
            return None
        
        # Use hash-based assignment for consistency
        hash_value = hash(f"{user_id}_{experiment_id}") % 100
        
        cumulative = 0
        for variant, percentage in self.experiments[experiment_id]['traffic_split'].items():
            cumulative += percentage
            if hash_value < cumulative:
                self.user_assignments[f"{user_id}_{experiment_id}"] = variant
                return variant
        
        return list(self.experiments[experiment_id]['algorithms'].keys())[0]
    
    def get_recommendations(self, user_id, experiment_id):
        """Get recommendations based on experiment assignment"""
        variant = self.assign_user_to_variant(user_id, experiment_id)
        
        if variant and variant in self.experiments[experiment_id]['algorithms']:
            algorithm = self.experiments[experiment_id]['algorithms'][variant]
            return algorithm.recommend_items(user_id)
        
        return []
    
    def record_metric(self, experiment_id, variant, metric_name, value):
        """Record experiment metric"""
        if experiment_id in self.experiments:
            key = f"{variant}_{metric_name}"
            self.experiments[experiment_id]['metrics'][key].append(value)
    
    def get_experiment_results(self, experiment_id):
        """Get experiment results summary"""
        if experiment_id not in self.experiments:
            return {}
        
        results = {}
        metrics = self.experiments[experiment_id]['metrics']
        
        for key, values in metrics.items():
            variant, metric = key.rsplit('_', 1)
            
            if variant not in results:
                results[variant] = {}
            
            results[variant][metric] = {
                'mean': np.mean(values),
                'std': np.std(values),
                'count': len(values)
            }
        
        return results
```

## Summary

Recommendation systems are essential for modern applications to help users discover relevant content. Key takeaways:

- **Start with simple approaches** like collaborative filtering or content-based filtering
- **Use hybrid methods** to combine strengths of different algorithms
- **Consider matrix factorization** for better scalability and accuracy
- **Implement proper evaluation** using multiple metrics (accuracy, diversity, coverage)
- **Handle cold start problems** with popular items and content-based approaches
- **Design for scale** with caching, precomputation, and distributed processing
- **Address bias and fairness** in recommendations
- **A/B test different algorithms** to measure real-world performance

The choice of recommendation algorithm depends on your data, scale, and business requirements. Start with proven approaches and iterate based on user feedback and performance metrics.
