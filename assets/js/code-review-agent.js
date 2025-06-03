// Code Review Agent Demo
const examples = {
    'memory-leak': {
        javascript: `function EventManager() {
    this.listeners = [];
}

EventManager.prototype.addListener = function(element, event, handler) {
    element.addEventListener(event, handler);
    this.listeners.push({ element, event, handler });
};

// Never removes listeners - memory leak!
EventManager.prototype.destroy = function() {
    this.listeners = [];
};`,
        python: `class DataProcessor:
    def __init__(self):
        self.cache = {}
    
    def process_file(self, filename):
        with open(filename, 'r') as f:
            data = f.read()
        
        # Cache grows infinitely - memory leak!
        self.cache[filename] = data
        return self.analyze(data)
    
    def analyze(self, data):
        return len(data)`
    },
    'sql-injection': {
        javascript: `app.get('/user/:id', async (req, res) => {
    const userId = req.params.id;
    
    // SQL Injection vulnerability!
    const query = \`SELECT * FROM users WHERE id = \${userId}\`;
    
    const result = await db.query(query);
    res.json(result);
});`,
        python: `def get_user(user_id):
    # SQL Injection vulnerability!
    query = f"SELECT * FROM users WHERE id = {user_id}"
    
    cursor.execute(query)
    return cursor.fetchone()`
    },
    'race-condition': {
        javascript: `let balance = 1000;

async function withdraw(amount) {
    if (balance >= amount) {
        // Race condition - balance check and update not atomic!
        await processPayment(amount);
        balance -= amount;
        return true;
    }
    return false;
}`,
        python: `balance = 1000

async def withdraw(amount):
    global balance
    
    if balance >= amount:
        # Race condition - check and update not atomic!
        await process_payment(amount)
        balance -= amount
        return True
    return False`
    },
    'performance': {
        javascript: `function findDuplicates(arr) {
    const duplicates = [];
    
    // O(n²) complexity - inefficient for large arrays!
    for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[i] === arr[j] && !duplicates.includes(arr[i])) {
                duplicates.push(arr[i]);
            }
        }
    }
    
    return duplicates;
}`,
        python: `def find_duplicates(arr):
    duplicates = []
    
    # O(n²) complexity - inefficient!
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] == arr[j] and arr[i] not in duplicates:
                duplicates.append(arr[i])
    
    return duplicates`
    }
};

// Mock review responses
const mockReviews = {
    'memory-leak': [
        {
            type: 'Memory Leak',
            severity: 'critical',
            message: 'Event listeners are never removed, causing memory leaks when elements are destroyed.',
            suggestion: 'Add a removeListener method that calls removeEventListener and update destroy() to properly clean up all listeners.',
            confidence: 95
        },
        {
            type: 'Best Practice',
            severity: 'warning',
            message: 'Using prototype for methods is outdated. Consider using ES6 classes.',
            suggestion: 'Refactor to use modern class syntax for better readability and tooling support.',
            confidence: 80
        }
    ],
    'sql-injection': [
        {
            type: 'Security Vulnerability',
            severity: 'critical',
            message: 'Direct string interpolation in SQL queries allows SQL injection attacks.',
            suggestion: 'Use parameterized queries or prepared statements to safely handle user input.',
            confidence: 99
        },
        {
            type: 'Input Validation',
            severity: 'warning',
            message: 'No validation on user_id parameter.',
            suggestion: 'Validate that user_id is a valid integer before using in query.',
            confidence: 85
        }
    ],
    'race-condition': [
        {
            type: 'Race Condition',
            severity: 'critical',
            message: 'Balance check and update are not atomic. Multiple concurrent calls could overdraw the account.',
            suggestion: 'Use a mutex/lock or database transaction to ensure atomic read-modify-write operation.',
            confidence: 97
        },
        {
            type: 'Error Handling',
            severity: 'info',
            message: 'No error handling for payment processing failure.',
            suggestion: 'Add try-catch to handle payment failures and ensure balance consistency.',
            confidence: 75
        }
    ],
    'performance': [
        {
            type: 'Performance Issue',
            severity: 'warning',
            message: 'O(n²) time complexity will cause performance issues with large arrays.',
            suggestion: 'Use a Set or Map to track seen elements for O(n) complexity.',
            confidence: 95
        },
        {
            type: 'Inefficiency',
            severity: 'info',
            message: 'Calling includes() in the inner loop adds additional O(n) complexity.',
            suggestion: 'Use a Set for duplicates to get O(1) lookup time.',
            confidence: 90
        }
    ],
    'default': [
        {
            type: 'Async Pattern',
            severity: 'warning',
            message: 'Initiating async operations in a loop without waiting will flood the API.',
            suggestion: 'Use Promise.all() or process requests sequentially with proper error handling.',
            confidence: 88
        },
        {
            type: 'Logic Error',
            severity: 'critical',
            message: 'Returning results array immediately after starting async operations - array will be empty.',
            suggestion: 'Wait for all promises to resolve before returning results.',
            confidence: 95
        }
    ]
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updateCodeStats();
});

function setupEventListeners() {
    // Code input
    const codeInput = document.getElementById('codeInput');
    codeInput.addEventListener('input', updateCodeStats);
    
    // Example selector
    const exampleSelect = document.getElementById('exampleSelect');
    const languageSelect = document.getElementById('languageSelect');
    
    exampleSelect.addEventListener('change', (e) => {
        if (e.target.value && examples[e.target.value]) {
            const language = languageSelect.value;
            const example = examples[e.target.value][language] || examples[e.target.value]['javascript'];
            codeInput.value = example;
            updateCodeStats();
        }
    });
    
    languageSelect.addEventListener('change', () => {
        if (exampleSelect.value && examples[exampleSelect.value]) {
            const example = examples[exampleSelect.value][languageSelect.value] || examples[exampleSelect.value]['javascript'];
            codeInput.value = example;
            updateCodeStats();
        }
    });
    
    // Review button
    const reviewButton = document.getElementById('reviewButton');
    reviewButton.addEventListener('click', performReview);
}

function updateCodeStats() {
    const code = document.getElementById('codeInput').value;
    const lines = code.split('\n').length;
    const tokens = Math.floor(code.length / 4); // Rough approximation
    
    document.getElementById('lineCount').textContent = `${lines} lines`;
    document.getElementById('tokenCount').textContent = `~${tokens} tokens`;
}

async function performReview() {
    const button = document.getElementById('reviewButton');
    const buttonText = button.querySelector('.button-text');
    const buttonLoader = button.querySelector('.button-loader');
    const resultsContainer = document.getElementById('reviewResults');
    
    // Get code
    const code = document.getElementById('codeInput').value.trim();
    if (!code) {
        resultsContainer.innerHTML = '<div class="placeholder"><p>⚠️ Please enter some code to review</p></div>';
        return;
    }
    
    // Start loading
    button.classList.add('loading');
    button.disabled = true;
    buttonText.style.display = 'none';
    buttonLoader.style.display = 'inline-block';
    
    // Clear previous results
    resultsContainer.innerHTML = '<div class="placeholder"><p>🔍 Analyzing your code...</p></div>';
    
    // Record start time
    const startTime = Date.now();
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    // Get appropriate review based on example or use default
    const exampleType = document.getElementById('exampleSelect').value || 'default';
    const reviews = mockReviews[exampleType] || mockReviews['default'];
    
    // Calculate metrics
    const endTime = Date.now();
    const responseTime = ((endTime - startTime) / 1000).toFixed(2);
    const tokensUsed = Math.floor(code.length / 4) + 150; // Input + output approximation
    const cost = (tokensUsed * 0.001 / 1000).toFixed(4); // GPT-3.5 pricing
    
    // Update metrics
    document.getElementById('responseTime').textContent = `${responseTime}s`;
    document.getElementById('tokensUsed').textContent = tokensUsed;
    document.getElementById('estimatedCost').textContent = `$${cost}`;
    
    // Display results
    displayReviewResults(reviews);
    
    // Reset button
    button.classList.remove('loading');
    button.disabled = false;
    buttonText.style.display = 'inline-block';
    buttonLoader.style.display = 'none';
}

function displayReviewResults(reviews) {
    const resultsContainer = document.getElementById('reviewResults');
    
    if (reviews.length === 0) {
        resultsContainer.innerHTML = '<div class="placeholder"><p>✅ No issues found! Your code looks good.</p></div>';
        return;
    }
    
    const html = reviews.map(review => `
        <div class="review-item">
            <div class="review-header">
                <span class="review-type">${review.type}</span>
                <span class="severity ${review.severity}">${review.severity}</span>
            </div>
            <div class="review-message">${review.message}</div>
            ${review.suggestion ? `
                <div class="review-suggestion">
                    💡 <strong>Suggestion:</strong> ${review.suggestion}
                </div>
            ` : ''}
            <span class="confidence">Confidence: ${review.confidence}%</span>
        </div>
    `).join('');
    
    resultsContainer.innerHTML = html;
}

// Add keyboard shortcut
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        document.getElementById('reviewButton').click();
    }
});