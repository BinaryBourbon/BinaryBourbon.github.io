# Workshop Exercises: Hands-On Labs

## Exercise 1: Transform a Notebook to Production API

**Time:** 20 minutes

### Starting Code
```python
# notebook_classifier.py
import openai

def classify_sentiment(text):
    response = openai.Completion.create(
        model="text-davinci-003",
        prompt=f"Classify the sentiment: {text}\n\nSentiment:",
        max_tokens=10
    )
    return response.choices[0].text.strip()

# Example usage
result = classify_sentiment("This product is amazing!")
print(result)  # "Positive"
```

### Your Task
Transform this into a production API with:
1. Proper error handling
2. Input validation
3. Timeout protection
4. Basic caching
5. Response model

### Starter Template
```python
# app.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, validator
import asyncio
from typing import Optional
import hashlib

app = FastAPI()

class SentimentRequest(BaseModel):
    text: str
    user_id: Optional[str] = None
    
    @validator('text')
    def text_not_empty(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Text cannot be empty')
        if len(v) > 1000:
            raise ValueError('Text too long (max 1000 chars)')
        return v

class SentimentResponse(BaseModel):
    sentiment: str
    confidence: float
    cached: bool
    model_used: str

# Simple in-memory cache (use Redis in production)
cache = {}

@app.post("/classify", response_model=SentimentResponse)
async def classify_sentiment(request: SentimentRequest):
    # TODO: Implement the following
    # 1. Check cache using hash of text
    # 2. Call OpenAI with timeout
    # 3. Handle errors gracefully
    # 4. Store in cache
    # 5. Return structured response
    pass
```

### Solution Discussion Points
- Why validate input length?
- Cache key strategies
- Timeout considerations
- Error response standards

---

## Exercise 2: Implement Semantic Caching

**Time:** 20 minutes

### Challenge
Implement a semantic cache that can match similar queries even if they're not identical.

### Starting Code
```python
# semantic_cache.py
import numpy as np
from typing import Optional, List, Tuple
import json

class SemanticCache:
    def __init__(self, similarity_threshold=0.85):
        self.cache = []  # List of (embedding, response) tuples
        self.threshold = similarity_threshold
    
    def get_embedding(self, text: str) -> List[float]:
        """Mock embedding function - replace with real embeddings"""
        # In production, use OpenAI embeddings or sentence-transformers
        return [hash(word) % 100 / 100.0 for word in text.split()][:10]
    
    def cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        # TODO: Implement cosine similarity
        pass
    
    def find_similar(self, query: str) -> Optional[str]:
        """Find cached response for similar query"""
        # TODO: Implement similarity search
        # 1. Get embedding for query
        # 2. Compare with all cached embeddings
        # 3. Return best match if above threshold
        pass
    
    def add(self, query: str, response: str):
        """Add query-response pair to cache"""
        # TODO: Add to cache with embedding
        pass
```

### Test Cases
```python
# test_semantic_cache.py
cache = SemanticCache(threshold=0.85)

# Add some responses
cache.add("What's the weather today?", "Sunny, 72°F")
cache.add("How's the weather?", "Sunny, 72°F")
cache.add("Tell me about Python", "Python is a programming language")

# Test similarity matching
assert cache.find_similar("What is the weather?") == "Sunny, 72°F"
assert cache.find_similar("Weather today?") == "Sunny, 72°F"
assert cache.find_similar("Tell me about Java") is None  # Too different
```

### Bonus Challenge
- Implement cache eviction (LRU)
- Add TTL support
- Optimize for large cache sizes

---

## Exercise 3: Build Error Boundaries

**Time:** 20 minutes

### Scenario
Build an error boundary system that handles common LLM failures gracefully.

### Starting Framework
```python
# error_boundary.py
from abc import ABC, abstractmethod
from typing import Any, Optional
import time

class Fallback(ABC):
    @abstractmethod
    def can_handle(self, error: Exception) -> bool:
        pass
    
    @abstractmethod
    def execute(self, request: Any) -> Any:
        pass

class ErrorBoundary:
    def __init__(self):
        self.fallbacks = []
        self.metrics = {
            'total_requests': 0,
            'errors': 0,
            'fallback_success': 0
        }
    
    def add_fallback(self, fallback: Fallback):
        self.fallbacks.append(fallback)
    
    async def execute(self, primary_func, request):
        """Execute function with fallback chain"""
        # TODO: Implement error boundary logic
        # 1. Try primary function
        # 2. On error, try each fallback
        # 3. Track metrics
        # 4. Return result or final error
        pass

# Implement these fallbacks
class RateLimitFallback(Fallback):
    def can_handle(self, error: Exception) -> bool:
        # TODO: Check if error is rate limit
        pass
    
    def execute(self, request: Any) -> Any:
        # TODO: Wait and retry or return cached
        pass

class TimeoutFallback(Fallback):
    def can_handle(self, error: Exception) -> bool:
        # TODO: Check if error is timeout
        pass
    
    def execute(self, request: Any) -> Any:
        # TODO: Try with shorter timeout and simpler model
        pass

class TemplateFallback(Fallback):
    def __init__(self):
        self.templates = {
            "greeting": "Hello! How can I help you today?",
            "error": "I'm having trouble with that request. Please try again.",
            "unclear": "Could you please rephrase your question?"
        }
    
    def can_handle(self, error: Exception) -> bool:
        return True  # Can always fall back to template
    
    def execute(self, request: Any) -> Any:
        # TODO: Match request to template
        pass
```

### Test Scenario
```python
# Simulate various failures
async def flaky_llm_call(request):
    import random
    rand = random.random()
    
    if rand < 0.3:
        raise Exception("Rate limit exceeded")
    elif rand < 0.5:
        raise TimeoutError("Request timeout")
    elif rand < 0.7:
        raise ValueError("Invalid response format")
    else:
        return f"Response for: {request}"

# Test the error boundary
boundary = ErrorBoundary()
boundary.add_fallback(RateLimitFallback())
boundary.add_fallback(TimeoutFallback())
boundary.add_fallback(TemplateFallback())

# Should handle various failures gracefully
for i in range(10):
    result = await boundary.execute(flaky_llm_call, f"Request {i}")
    print(f"Request {i}: {result}")
```

---

## Exercise 4: Cost Optimization Challenge

**Time:** 15 minutes

### The Challenge
You have a chatbot handling 100,000 queries/day. Currently using GPT-4 for everything at $40,000/month. Optimize to < $2,000/month without significantly impacting quality.

### Current Metrics
```python
current_state = {
    "daily_queries": 100_000,
    "avg_input_tokens": 150,
    "avg_output_tokens": 200,
    "model": "gpt-4",
    "cache_hit_rate": 0.0,
    "monthly_cost": 40_000
}
```

### Your Tools
```python
# pricing.py
PRICING = {
    "gpt-4": {"input": 0.03, "output": 0.06},        # per 1K tokens
    "gpt-3.5-turbo": {"input": 0.001, "output": 0.002},
    "claude-instant": {"input": 0.0008, "output": 0.0024},
    "cached": {"input": 0, "output": 0}
}

def calculate_monthly_cost(
    queries_per_day: int,
    avg_input_tokens: int,
    avg_output_tokens: int,
    model_distribution: dict,  # e.g., {"gpt-4": 0.2, "gpt-3.5-turbo": 0.8}
    cache_hit_rate: float
) -> float:
    # TODO: Calculate the monthly cost
    pass

# Implement your optimization strategy
class CostOptimizer:
    def __init__(self):
        self.rules = []
    
    def add_rule(self, condition, action):
        """Add optimization rule"""
        self.rules.append((condition, action))
    
    def optimize_request(self, request):
        """Return optimal model and caching strategy"""
        # TODO: Implement optimization logic
        pass
```

### Optimization Strategies to Consider
1. Query classification (simple vs complex)
2. Caching similar queries
3. Model routing based on query type
4. Batch processing where possible
5. Response length optimization

### Success Metrics
- Monthly cost < $2,000
- User satisfaction > 95%
- Latency < 2 seconds p95

---

## Exercise 5: Build a Monitoring Dashboard

**Time:** 15 minutes

### Task
Create a simple monitoring system that tracks the metrics that matter.

### Starter Code
```python
# monitor.py
from datetime import datetime
from collections import defaultdict, deque
import json

class MLMonitor:
    def __init__(self, window_size=1000):
        self.window_size = window_size
        self.metrics = defaultdict(lambda: deque(maxlen=window_size))
        self.alerts = []
    
    def record(self, metric_name: str, value: float, tags: dict = None):
        """Record a metric value"""
        self.metrics[metric_name].append({
            'value': value,
            'timestamp': datetime.now().isoformat(),
            'tags': tags or {}
        })
        
        # Check alerts
        self.check_alerts(metric_name, value)
    
    def add_alert(self, metric_name: str, condition, message: str):
        """Add alert rule"""
        # TODO: Implement alert system
        pass
    
    def check_alerts(self, metric_name: str, value: float):
        """Check if any alerts should fire"""
        # TODO: Check conditions and fire alerts
        pass
    
    def get_summary(self, metric_name: str) -> dict:
        """Get summary statistics for a metric"""
        # TODO: Calculate mean, p50, p95, p99
        pass
    
    def export_dashboard(self) -> dict:
        """Export dashboard data"""
        # TODO: Create dashboard-ready data
        pass

# Usage example
monitor = MLMonitor()

# Set up alerts
monitor.add_alert('latency_ms', lambda x: x > 2000, "High latency detected")
monitor.add_alert('error_rate', lambda x: x > 0.05, "Error rate above 5%")
monitor.add_alert('cost_per_request', lambda x: x > 0.10, "Cost per request too high")

# Simulate monitoring
for i in range(100):
    monitor.record('latency_ms', random.randint(100, 3000))
    monitor.record('error_rate', random.random() * 0.1)
    monitor.record('cost_per_request', random.random() * 0.2)
    monitor.record('cache_hit_rate', random.random())

# Generate dashboard
dashboard = monitor.export_dashboard()
```

### Dashboard Requirements
1. Real-time metrics display
2. Alert history
3. Cost tracking
4. Performance trends
5. Recommendations based on data

---

## Bonus Exercise: Chaos Engineering

**Time:** 10 minutes (if time permits)

### Challenge
Build a chaos testing framework for your ML system.

```python
# chaos.py
import random
import asyncio

class ChaosMonkey:
    def __init__(self, failure_rate=0.1):
        self.failure_rate = failure_rate
        self.failure_modes = [
            self.inject_timeout,
            self.inject_rate_limit,
            self.inject_malformed_response,
            self.inject_partial_response
        ]
    
    async def inject_timeout(self, func, *args):
        await asyncio.sleep(30)  # Force timeout
        raise TimeoutError("Chaos: Injected timeout")
    
    async def inject_rate_limit(self, func, *args):
        raise Exception("Rate limit exceeded (chaos)")
    
    async def inject_malformed_response(self, func, *args):
        result = await func(*args)
        return result[:len(result)//2] + "�����CORRUPT�����"
    
    async def inject_partial_response(self, func, *args):
        result = await func(*args)
        return result[:len(result)//2]  # Cut off mid-response
    
    async def maybe_fail(self, func, *args):
        if random.random() < self.failure_rate:
            failure = random.choice(self.failure_modes)
            return await failure(func, *args)
        return await func(*args)

# Test your system's resilience
chaos = ChaosMonkey(failure_rate=0.3)

async def test_with_chaos():
    for i in range(20):
        try:
            result = await chaos.maybe_fail(your_ml_function, f"Query {i}")
            print(f"Success: {result}")
        except Exception as e:
            print(f"Handled failure: {e}")
```

### Discussion Points
- What failures does your system handle well?
- What failures cause cascading issues?
- How can you improve resilience?

---

## Post-Workshop Challenge

Build a complete production ML service that:
1. Costs < $0.01 per 1000 requests
2. Has < 500ms p95 latency
3. Handles 1000 requests/second
4. Gracefully handles all failure modes
5. Provides real-time monitoring

Share your solution in the workshop repository for feedback!