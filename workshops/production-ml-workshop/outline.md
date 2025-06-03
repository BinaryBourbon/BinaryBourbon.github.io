# Production ML Workshop: Detailed Outline

## Part 1: The Reality Check (30 minutes)

### 1.1 Opening (5 min)
- Introductions and expectations
- The $50K/month wake-up call story
- Workshop objectives and outcomes

### 1.2 Why ML Projects Fail in Production (10 min)
```
Common Failure Modes:
1. The Notebook Trap - "It works on my machine"
2. Cost Explosion - Linear growth → exponential costs
3. Latency Creep - 200ms → 2s → timeout
4. Error Cascade - One bad response → system failure
5. Monitoring Blindness - "We'll add logging later"
```

### 1.3 Case Study Analysis (10 min)
Real client scenario:
- E-commerce recommendation system
- Started: $2K/month (prototype)
- Month 3: $15K/month
- Month 6: $52K/month
- After optimization: $1.8K/month

### 1.4 The Production ML Mindset (5 min)
- Prototype vs Production thinking
- Cost awareness from day 1
- Building for failure
- Monitoring as a feature

## Part 2: Building Production-Ready Services (45 minutes)

### 2.1 Architecture Overview (10 min)
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  API Layer  │────▶│   Model     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                     │
                           ▼                     ▼
                    ┌─────────────┐     ┌─────────────┐
                    │    Cache    │     │  Fallback   │
                    └─────────────┘     └─────────────┘
```

### 2.2 Hands-On: From Notebook to API (20 min)

Starting notebook:
```python
# typical_notebook.ipynb
import openai

def get_recommendation(user_query):
    response = openai.Completion.create(
        model="gpt-4",
        prompt=f"Recommend products for: {user_query}",
        max_tokens=200
    )
    return response.choices[0].text
```

Transform to production service:
```python
# app.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import asyncio
from typing import Optional

app = FastAPI()

class QueryRequest(BaseModel):
    user_id: str
    query: str
    max_response_length: Optional[int] = 200

class QueryResponse(BaseModel):
    recommendation: str
    cached: bool
    latency_ms: float
    model_used: str

@app.post("/recommend", response_model=QueryResponse)
async def recommend(request: QueryRequest):
    start_time = time.time()
    
    # Check cache first
    cached_result = await cache.get(request.user_id, request.query)
    if cached_result:
        return QueryResponse(
            recommendation=cached_result,
            cached=True,
            latency_ms=(time.time() - start_time) * 1000,
            model_used="cache"
        )
    
    # Execute with timeout
    try:
        result = await asyncio.wait_for(
            get_recommendation(request.query),
            timeout=5.0
        )
    except asyncio.TimeoutError:
        # Fallback to simpler model
        result = await get_simple_recommendation(request.query)
        model_used = "gpt-3.5-turbo"
    else:
        model_used = "gpt-4"
    
    # Store in cache
    await cache.set(request.user_id, request.query, result)
    
    return QueryResponse(
        recommendation=result,
        cached=False,
        latency_ms=(time.time() - start_time) * 1000,
        model_used=model_used
    )
```

### 2.3 Configuration Management (10 min)
```python
# config.py
from pydantic import BaseSettings

class Settings(BaseSettings):
    openai_api_key: str
    redis_url: str = "redis://localhost:6379"
    max_tokens: int = 200
    timeout_seconds: float = 5.0
    cache_ttl: int = 3600
    
    # Cost controls
    daily_budget: float = 50.0
    request_cost_limit: float = 0.50
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### 2.4 Testing Strategy (5 min)
- Unit tests for business logic
- Integration tests with mocked LLM
- Load tests for capacity planning
- Chaos tests for failure scenarios

## Part 3: Cost Optimization Strategies (45 minutes)

### 3.1 Understanding Costs (10 min)
```python
# Cost breakdown analyzer
def analyze_request_cost(request, response):
    input_tokens = count_tokens(request.prompt)
    output_tokens = count_tokens(response.text)
    
    costs = {
        'gpt-4': {
            'input': input_tokens * 0.00003,
            'output': output_tokens * 0.00006
        },
        'gpt-3.5-turbo': {
            'input': input_tokens * 0.0000015,
            'output': output_tokens * 0.000002
        }
    }
    
    return costs
```

### 3.2 Hands-On: Implementing Smart Caching (20 min)

Basic cache:
```python
class BasicCache:
    def __init__(self, redis_client):
        self.redis = redis_client
        
    async def get(self, key):
        return await self.redis.get(key)
        
    async def set(self, key, value, ttl=3600):
        await self.redis.setex(key, ttl, value)
```

Semantic cache:
```python
class SemanticCache:
    def __init__(self, redis_client, embedder):
        self.redis = redis_client
        self.embedder = embedder
        self.threshold = 0.93
        
    async def get(self, query):
        # Get embedding for query
        query_embedding = await self.embedder.embed(query)
        
        # Search for similar queries
        similar = await self.search_similar(query_embedding)
        
        if similar and similar.score > self.threshold:
            return similar.cached_response
            
        return None
        
    async def search_similar(self, embedding):
        # Implement vector similarity search
        # Using Redis Search or separate vector DB
        pass
```

### 3.3 Model Routing Logic (10 min)
```python
class ModelRouter:
    def __init__(self):
        self.rules = [
            (self.is_simple_factual, "gpt-3.5-turbo"),
            (self.needs_reasoning, "gpt-4"),
            (self.is_creative, "claude-2"),
            (self.is_code_related, "code-davinci-002")
        ]
    
    def select_model(self, query, context):
        for rule, model in self.rules:
            if rule(query, context):
                return model
        return "gpt-3.5-turbo"  # default
    
    def is_simple_factual(self, query, context):
        keywords = ['what is', 'define', 'when was', 'who is']
        return any(kw in query.lower() for kw in keywords)
```

### 3.4 Cost Monitoring Dashboard (5 min)
- Real-time cost tracking
- Budget alerts
- Cost per user/feature
- ROI calculations

## Part 4: Error Handling & Resilience (45 minutes)

### 4.1 Common Failure Modes (10 min)
- Token limit exceeded
- Rate limiting
- Timeout errors
- Hallucinations
- Format violations

### 4.2 Hands-On: Building Error Boundaries (20 min)
```python
class AIErrorBoundary:
    def __init__(self):
        self.fallback_chain = [
            CacheFallback(),
            SimplifierFallback(),
            TemplateFallback(),
            StaticFallback()
        ]
    
    async def execute(self, operation):
        try:
            # Pre-validation
            self.validate_input(operation.input)
            
            # Execute with monitoring
            result = await self.execute_with_timeout(operation)
            
            # Post-validation
            self.validate_output(result)
            
            return result
            
        except Exception as e:
            return await self.handle_failure(e, operation)
    
    async def handle_failure(self, error, operation):
        for fallback in self.fallback_chain:
            if fallback.can_handle(error):
                try:
                    return await fallback.execute(operation)
                except:
                    continue
        
        # Ultimate fallback
        return {
            "error": True,
            "message": "Unable to process request",
            "request_id": operation.request_id
        }
```

### 4.3 Implementing Graceful Degradation (10 min)
```python
class GracefulDegradation:
    def __init__(self):
        self.strategies = {
            'timeout': self.handle_timeout,
            'rate_limit': self.handle_rate_limit,
            'hallucination': self.handle_hallucination
        }
    
    async def handle_timeout(self, request):
        # Try with smaller context
        reduced = self.reduce_context(request)
        return await self.quick_model.process(reduced)
    
    async def handle_rate_limit(self, request):
        # Queue for later or use cached response
        similar = await self.cache.find_similar(request)
        if similar:
            return self.adapt_response(similar, request)
        return await self.queue.add(request)
```

### 4.4 Testing Failure Scenarios (5 min)
- Chaos engineering principles
- Failure injection
- Recovery verification

## Part 5: Monitoring & Scaling (30 minutes)

### 5.1 Metrics That Matter (10 min)
```python
class ProductionMetrics:
    def __init__(self):
        self.metrics = {
            # Performance
            'latency_p50': Histogram('request_latency_p50'),
            'latency_p99': Histogram('request_latency_p99'),
            
            # Cost
            'cost_per_request': Gauge('cost_per_request_dollars'),
            'daily_spend': Counter('daily_spend_dollars'),
            
            # Quality
            'cache_hit_rate': Gauge('cache_hit_rate'),
            'fallback_rate': Gauge('fallback_rate'),
            'error_rate': Gauge('error_rate'),
            
            # Business
            'requests_per_user': Histogram('requests_per_user'),
            'revenue_per_request': Gauge('revenue_per_request')
        }
```

### 5.2 Setting Up Alerts (10 min)
```yaml
# alerts.yaml
alerts:
  - name: HighCostPerRequest
    condition: cost_per_request > 0.10
    severity: warning
    action: notify_slack
    
  - name: LowCacheHitRate
    condition: cache_hit_rate < 0.60
    severity: warning
    action: investigate_queries
    
  - name: HighErrorRate
    condition: error_rate > 0.05
    severity: critical
    action: page_oncall
```

### 5.3 Capacity Planning (5 min)
- Load testing strategies
- Scaling triggers
- Cost projections

### 5.4 Next Steps & Resources (5 min)
- GitHub repo with all code
- Recommended reading
- Community resources
- Follow-up office hours

## 🎁 Bonus Materials

### Production Checklist
- [ ] Error boundaries implemented
- [ ] Caching layer active
- [ ] Monitoring dashboard live
- [ ] Cost alerts configured
- [ ] Load tests passing
- [ ] Fallback strategies tested
- [ ] Documentation complete

### Cost Optimization Cheatsheet
```
1. Cache Everything Cacheable
   - Exact match: 100% savings
   - Semantic match: 95% savings
   - Template match: 90% savings

2. Route by Complexity
   - Simple factual → GPT-3.5
   - Complex reasoning → GPT-4
   - Creative tasks → Claude

3. Batch When Possible
   - 50% discount on most providers
   - Trade latency for cost

4. Monitor Religiously
   - Cost per feature
   - Cache effectiveness
   - Error patterns
```

### Emergency Runbook
```
High Cost Alert:
1. Check cache hit rate
2. Review recent queries
3. Look for infinite loops
4. Verify model routing
5. Enable stricter limits

High Error Rate:
1. Check provider status
2. Review error types
3. Activate fallbacks
4. Notify users if needed
5. Post-mortem required
```