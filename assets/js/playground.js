// AI Agent Playground JavaScript
class AIAgentPlayground {
    constructor() {
        this.currentAgent = 'code-review';
        this.cache = new Map();
        this.initializeEventListeners();
        this.loadExamples();
    }

    initializeEventListeners() {
        // Tab switching
        document.querySelectorAll('.agent-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchAgent(e.target.closest('.agent-tab')));
        });

        // Agent-specific handlers
        document.getElementById('analyze-code')?.addEventListener('click', () => this.analyzeCode());
        document.getElementById('debug-error')?.addEventListener('click', () => this.debugError());
        document.getElementById('get-architecture')?.addEventListener('click', () => this.getArchitecture());
        document.getElementById('optimize-code')?.addEventListener('click', () => this.optimizeCode());

        // Example buttons
        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.loadExample(e.target.dataset.example));
        });
    }

    switchAgent(tab) {
        if (!tab) return;
        
        // Update active tab
        document.querySelectorAll('.agent-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Update active panel
        const agentType = tab.dataset.agent;
        document.querySelectorAll('.agent-panel').forEach(panel => panel.classList.remove('active'));
        document.getElementById(`${agentType}-panel`)?.classList.add('active');

        this.currentAgent = agentType;
    }

    async simulateAPICall(prompt, options = {}) {
        // Check cache first
        const cacheKey = `${this.currentAgent}:${prompt}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Math.random() > 0.3) { // 70% cache hit rate
            return {
                ...cached,
                cached: true,
                latency: Math.floor(Math.random() * 50) + 10, // 10-60ms for cache
                model: 'cache'
            };
        }

        // Simulate network latency
        const baseLatency = Math.floor(Math.random() * 500) + 200; // 200-700ms
        await this.delay(baseLatency);

        // Simulate different models based on complexity
        const isComplex = prompt.length > 500 || prompt.includes('architecture') || prompt.includes('security');
        const model = isComplex ? 'gpt-4' : 'gpt-3.5-turbo';

        // Simulate occasional errors
        if (Math.random() < 0.1) { // 10% error rate for demo
            throw new Error('Rate limit exceeded');
        }

        const response = await this.generateResponse(prompt, options);
        
        // Cache the response
        this.cache.set(cacheKey, response);

        return {
            ...response,
            cached: false,
            latency: baseLatency,
            model: model
        };
    }

    async generateResponse(prompt, options) {
        switch (this.currentAgent) {
            case 'code-review':
                return this.generateCodeReview(prompt, options);
            case 'debug-assistant':
                return this.generateDebugAssistance(prompt, options);
            case 'architecture-advisor':
                return this.generateArchitectureAdvice(prompt, options);
            case 'perf-optimizer':
                return this.generatePerfOptimization(prompt, options);
            default:
                return { response: 'Unknown agent type' };
        }
    }

    generateCodeReview(code, options) {
        const issues = [];
        
        // Check for common issues
        if (code.includes('eval(')) {
            issues.push({
                severity: 'high',
                type: 'Security',
                title: 'Dangerous eval() usage',
                description: 'Using eval() can execute arbitrary code and poses a security risk.',
                line: this.findLineNumber(code, 'eval('),
                suggestion: 'Consider using JSON.parse() for JSON data or alternative parsing methods.'
            });
        }

        if (code.includes('SELECT *') && code.includes('FROM')) {
            issues.push({
                severity: 'medium',
                type: 'Performance',
                title: 'SELECT * query detected',
                description: 'Selecting all columns can impact performance and transfer unnecessary data.',
                suggestion: 'Specify only the columns you need.'
            });
        }

        if (code.includes('console.log')) {
            issues.push({
                severity: 'low',
                type: 'Code Quality',
                title: 'Console.log statements found',
                description: 'Debug statements should be removed before production.',
                suggestion: 'Remove or use a proper logging library.'
            });
        }

        if (code.includes('password') && !code.includes('bcrypt') && !code.includes('hash')) {
            issues.push({
                severity: 'high',
                type: 'Security',
                title: 'Potential plain text password',
                description: 'Passwords should always be hashed before storage.',
                suggestion: 'Use bcrypt or similar hashing library.'
            });
        }

        if (code.includes('for') && code.includes('length') && code.includes('<=')) {
            issues.push({
                severity: 'high',
                type: 'Bug',
                title: 'Potential off-by-one error',
                description: 'Loop condition uses <= with array length, which may cause index out of bounds.',
                suggestion: 'Use < instead of <= when comparing with array length.'
            });
        }

        return { issues };
    }

    generateDebugAssistance(errorMsg, context) {
        const solutions = [];

        if (errorMsg.includes('Cannot read property') && errorMsg.includes('undefined')) {
            solutions.push({
                title: 'Null/Undefined Reference Error',
                explanation: 'You\'re trying to access a property on an undefined or null value.',
                steps: [
                    'Check if the object exists before accessing its properties',
                    'Use optional chaining: object?.property',
                    'Add null checks: if (object && object.property)',
                    'Verify the data source returns expected values'
                ],
                code: `// Safe property access
const value = object?.property || defaultValue;

// Or with explicit check
if (object && object.property) {
    // Safe to use object.property
}`
            });
        }

        if (errorMsg.includes('is not a function')) {
            solutions.push({
                title: 'Type Error: Not a Function',
                explanation: 'You\'re trying to call something that isn\'t a function.',
                steps: [
                    'Verify the variable is actually a function',
                    'Check if you\'re accessing the correct property',
                    'Ensure the function is imported correctly',
                    'Check for typos in function name'
                ],
                code: `// Debug the type
console.log(typeof myFunction); // Should output 'function'

// Ensure proper import
import { myFunction } from './module';`
            });
        }

        return { solutions };
    }

    generateArchitectureAdvice(requirements, constraints) {
        const recommendations = {
            stack: [],
            architecture: [],
            considerations: []
        };

        if (requirements.includes('real-time')) {
            recommendations.stack.push({
                component: 'WebSocket Server',
                suggestion: 'Socket.io or native WebSockets',
                reason: 'Essential for real-time bidirectional communication'
            });
            recommendations.architecture.push({
                pattern: 'Pub/Sub Architecture',
                description: 'Use Redis Pub/Sub or similar for scalable real-time messaging'
            });
        }

        if (requirements.includes('10k concurrent')) {
            recommendations.stack.push({
                component: 'Load Balancer',
                suggestion: 'Nginx or HAProxy',
                reason: 'Distribute load across multiple server instances'
            });
            recommendations.considerations.push({
                type: 'Scaling Strategy',
                advice: 'Implement horizontal scaling with auto-scaling groups'
            });
        }

        if (constraints.budget) {
            recommendations.considerations.push({
                type: 'Cost Optimization',
                advice: 'Consider serverless for variable load, use spot instances for non-critical workloads'
            });
        }

        return recommendations;
    }

    generatePerfOptimization(code, level) {
        const optimizations = [];

        if (code.includes('for') && code.includes('for')) {
            optimizations.push({
                issue: 'Nested loops detected (O(n²) complexity)',
                original: this.extractCodeBlock(code, 'for'),
                optimized: `// Use a Map for O(n) lookup
const map = new Map();
arr1.forEach(item => map.set(item.id, item));
const results = arr2.filter(item => map.has(item.id));`,
                improvement: 'Reduces time complexity from O(n²) to O(n)'
            });
        }

        if (code.includes('includes') && code.includes('push')) {
            optimizations.push({
                issue: 'Inefficient duplicate checking',
                suggestion: 'Use a Set for O(1) lookups instead of Array.includes()',
                optimized: `// Use Set for efficient deduplication
const seen = new Set();
const results = [];
for (const item of array) {
    if (!seen.has(item)) {
        seen.add(item);
        results.push(item);
    }
}`,
                improvement: 'Improves lookup from O(n) to O(1)'
            });
        }

        return { optimizations };
    }

    async analyzeCode() {
        const codeInput = document.getElementById('code-input').value;
        if (!codeInput.trim()) {
            this.showError('Please enter some code to analyze');
            return;
        }

        const button = document.getElementById('analyze-code');
        const options = {
            security: document.getElementById('security-check').checked,
            performance: document.getElementById('perf-check').checked,
            style: document.getElementById('style-check').checked
        };

        try {
            this.setLoading(button, true);
            const result = await this.simulateAPICall(codeInput, options);
            this.displayCodeReviewResults(result);
            this.updateMetadata(result);
        } catch (error) {
            this.handleError(error);
        } finally {
            this.setLoading(button, false);
        }
    }

    displayCodeReviewResults(result) {
        const container = document.getElementById('review-results');
        
        if (!result.issues || result.issues.length === 0) {
            container.innerHTML = `
                <div class="review-item">
                    <span class="review-severity severity-low">✓ Clean</span>
                    <h5>No issues found!</h5>
                    <p>The code looks good. No major issues detected.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = result.issues.map(issue => `
            <div class="review-item response-message">
                <span class="review-severity severity-${issue.severity}">${issue.severity.toUpperCase()}</span>
                <h5>${issue.type}: ${issue.title}</h5>
                <p>${issue.description}</p>
                ${issue.line ? `<p class="code-snippet">Line ${issue.line}</p>` : ''}
                ${issue.suggestion ? `<p><strong>Suggestion:</strong> ${issue.suggestion}</p>` : ''}
            </div>
        `).join('');
    }

    async debugError() {
        const errorInput = document.getElementById('error-input').value;
        const contextInput = document.getElementById('context-input').value;

        if (!errorInput.trim()) {
            this.showError('Please enter an error message');
            return;
        }

        const button = document.getElementById('debug-error');

        try {
            this.setLoading(button, true);
            const result = await this.simulateAPICall(errorInput + '\n' + contextInput);
            this.displayDebugResults(result);
        } catch (error) {
            this.handleError(error);
        } finally {
            this.setLoading(button, false);
        }
    }

    displayDebugResults(result) {
        const container = document.getElementById('debug-results');
        
        if (!result.solutions || result.solutions.length === 0) {
            container.innerHTML = '<p>Unable to determine the issue. Please provide more context.</p>';
            return;
        }

        container.innerHTML = result.solutions.map(solution => `
            <div class="debug-solution response-message">
                <h4>${solution.title}</h4>
                <p>${solution.explanation}</p>
                <h5>Steps to fix:</h5>
                <ol>
                    ${solution.steps.map(step => `<li>${step}</li>`).join('')}
                </ol>
                ${solution.code ? `
                    <h5>Example code:</h5>
                    <pre class="code-snippet"><code>${solution.code}</code></pre>
                ` : ''}
            </div>
        `).join('');
    }

    loadExample(exampleType) {
        const examples = {
            'sql-injection': `function getUser(userId) {
    const query = "SELECT * FROM users WHERE id = " + userId;
    return db.execute(query);
}`,
            'memory-leak': `let cache = {};
function processData(id, data) {
    cache[id] = data; // Never cleaned up
    return cache[id].process();
}`,
            'race-condition': `let counter = 0;
async function incrementCounter() {
    const current = counter;
    await someAsyncOperation();
    counter = current + 1;
}`,
            'n-plus-one': `async function getPostsWithAuthors() {
    const posts = await db.query('SELECT * FROM posts');
    for (let post of posts) {
        post.author = await db.query('SELECT * FROM users WHERE id = ?', [post.authorId]);
    }
    return posts;
}`
        };

        const codeInput = document.getElementById('code-input');
        if (codeInput && examples[exampleType]) {
            codeInput.value = examples[exampleType];
            // Auto-analyze
            this.analyzeCode();
        }
    }

    updateMetadata(result) {
        document.getElementById('review-meta').style.display = 'flex';
        document.getElementById('model-used').textContent = result.model || 'gpt-3.5-turbo';
        document.getElementById('latency').textContent = result.latency || '0';
        document.getElementById('cached').textContent = result.cached ? 'Yes' : 'No';
    }

    handleError(error) {
        // Demonstrate error boundaries in action
        const fallbackResponse = {
            issues: [{
                severity: 'medium',
                type: 'Fallback Response',
                title: 'Using cached analysis',
                description: `Error: ${error.message}. Showing cached similar analysis.`,
                suggestion: 'The AI service is temporarily unavailable. This is a fallback response.'
            }],
            cached: true,
            latency: 15,
            model: 'fallback'
        };

        this.displayCodeReviewResults(fallbackResponse);
        this.updateMetadata(fallbackResponse);
    }

    setLoading(button, loading) {
        const btnText = button.querySelector('.btn-text');
        const btnLoader = button.querySelector('.btn-loader');
        
        if (loading) {
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline';
            button.disabled = true;
        } else {
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
            button.disabled = false;
        }
    }

    showError(message) {
        // Simple error display
        alert(message);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    findLineNumber(code, search) {
        const lines = code.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(search)) {
                return i + 1;
            }
        }
        return null;
    }

    extractCodeBlock(code, keyword) {
        const lines = code.split('\n');
        const startIdx = lines.findIndex(line => line.includes(keyword));
        if (startIdx === -1) return '';
        
        // Extract a few lines around the keyword
        return lines.slice(Math.max(0, startIdx - 1), startIdx + 4).join('\n');
    }

    loadExamples() {
        // Pre-populate with an interesting example
        const defaultExample = `function processData(data) {
    for (let i = 0; i <= data.length; i++) {
        console.log(data[i].name);
    }
}`;
        
        const codeInput = document.getElementById('code-input');
        if (codeInput && !codeInput.value) {
            codeInput.value = defaultExample;
        }
    }
}

// Initialize playground when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AIAgentPlayground();
});