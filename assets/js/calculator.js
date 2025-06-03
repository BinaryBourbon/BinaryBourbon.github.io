// ML Cost Calculator Logic

// Model pricing data (per 1M tokens)
const models = {
    'gpt-4-turbo': {
        name: 'GPT-4 Turbo',
        input: 10.00,
        output: 30.00,
        cachedInput: 5.00,
        speed: 'Medium',
        quality: 'Excellent'
    },
    'gpt-3.5-turbo': {
        name: 'GPT-3.5 Turbo',
        input: 0.50,
        output: 1.50,
        cachedInput: 0.25,
        speed: 'Fast',
        quality: 'Good'
    },
    'claude-3-opus': {
        name: 'Claude 3 Opus',
        input: 15.00,
        output: 75.00,
        cachedInput: 7.50,
        speed: 'Slow',
        quality: 'Excellent'
    },
    'claude-3-sonnet': {
        name: 'Claude 3 Sonnet',
        input: 3.00,
        output: 15.00,
        cachedInput: 1.50,
        speed: 'Fast',
        quality: 'Very Good'
    },
    'llama-3-70b': {
        name: 'Llama 3 70B',
        input: 0.20,
        output: 0.20,
        cachedInput: 0.10,
        speed: 'Very Fast',
        quality: 'Good',
        selfHosted: true
    }
};

// State
let selectedModel = 'gpt-3.5-turbo';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    renderModelCards();
    updateCalculations();
});

function setupEventListeners() {
    // Input listeners
    document.getElementById('requests').addEventListener('input', updateCalculations);
    document.getElementById('inputTokens').addEventListener('input', updateCalculations);
    document.getElementById('outputTokens').addEventListener('input', updateCalculations);
    document.getElementById('processingMode').addEventListener('change', updateCalculations);
    
    // Cache rate slider
    const cacheSlider = document.getElementById('cacheRate');
    const cacheValue = document.getElementById('cacheRateValue');
    cacheSlider.addEventListener('input', (e) => {
        cacheValue.textContent = e.target.value + '%';
        updateCalculations();
    });
    
    // Export buttons
    document.getElementById('shareResults').addEventListener('click', shareResults);
    document.getElementById('exportCSV').addEventListener('click', exportToCSV);
}

function renderModelCards() {
    const container = document.getElementById('modelCards');
    container.innerHTML = '';
    
    Object.entries(models).forEach(([key, model]) => {
        const card = document.createElement('div');
        card.className = `model-card ${key === selectedModel ? 'selected' : ''}`;
        card.onclick = () => selectModel(key);
        
        const monthlyBase = calculateModelCost(key, getInputValues());
        
        card.innerHTML = `
            <div class="model-name">${model.name}</div>
            <div class="model-cost">$${monthlyBase.toFixed(2)}</div>
            <div class="model-details">
                Speed: ${model.speed}<br>
                Quality: ${model.quality}
                ${model.selfHosted ? '<br>Self-hosted' : ''}
            </div>
        `;
        
        container.appendChild(card);
    });
}

function selectModel(modelKey) {
    selectedModel = modelKey;
    renderModelCards();
    updateCalculations();
}

function getInputValues() {
    return {
        requests: parseInt(document.getElementById('requests').value) || 0,
        inputTokens: parseInt(document.getElementById('inputTokens').value) || 0,
        outputTokens: parseInt(document.getElementById('outputTokens').value) || 0,
        cacheRate: parseInt(document.getElementById('cacheRate').value) || 0,
        batchMode: document.getElementById('processingMode').value === 'batch'
    };
}

function calculateModelCost(modelKey, inputs) {
    const model = models[modelKey];
    const { requests, inputTokens, outputTokens, cacheRate, batchMode } = inputs;
    
    const dailyRequests = requests;
    const monthlyRequests = dailyRequests * 30;
    
    // Calculate token usage
    const totalInputTokens = monthlyRequests * inputTokens;
    const totalOutputTokens = monthlyRequests * outputTokens;
    
    // Apply cache rate
    const cachedInputTokens = totalInputTokens * (cacheRate / 100);
    const uncachedInputTokens = totalInputTokens * (1 - cacheRate / 100);
    
    // Calculate costs (convert from per million to actual)
    const inputCost = (uncachedInputTokens * model.input) / 1000000;
    const cachedCost = (cachedInputTokens * model.cachedInput) / 1000000;
    const outputCost = (totalOutputTokens * model.output) / 1000000;
    
    let totalCost = inputCost + cachedCost + outputCost;
    
    // Apply batch discount
    if (batchMode && !model.selfHosted) {
        totalCost *= 0.5;
    }
    
    return totalCost;
}

function updateCalculations() {
    const inputs = getInputValues();
    
    // Update all model cards
    renderModelCards();
    
    // Calculate savings
    updateSavingsAnalysis(inputs);
    
    // Generate recommendations
    updateRecommendations(inputs);
    
    // Update chart
    updateCostChart(inputs);
}

function updateSavingsAnalysis(inputs) {
    const container = document.getElementById('savingsBreakdown');
    const baseCost = calculateModelCost(selectedModel, { ...inputs, cacheRate: 0, batchMode: false });
    const optimizedCost = calculateModelCost(selectedModel, inputs);
    
    const cacheSavings = calculateModelCost(selectedModel, { ...inputs, batchMode: false }) - 
                        calculateModelCost(selectedModel, { ...inputs, cacheRate: 0, batchMode: false });
    
    const batchSavings = inputs.batchMode ? baseCost * 0.5 : 0;
    const totalSavings = baseCost - optimizedCost;
    const savingsPercent = (totalSavings / baseCost * 100).toFixed(1);
    
    container.innerHTML = `
        <div class="savings-item">
            <span class="savings-label">Base monthly cost</span>
            <span class="savings-value">$${baseCost.toFixed(2)}</span>
        </div>
        <div class="savings-item">
            <span class="savings-label">Cache savings (${inputs.cacheRate}%)</span>
            <span class="savings-value">-$${Math.abs(cacheSavings).toFixed(2)}</span>
        </div>
        ${inputs.batchMode ? `
        <div class="savings-item">
            <span class="savings-label">Batch processing discount</span>
            <span class="savings-value">-$${batchSavings.toFixed(2)}</span>
        </div>
        ` : ''}
        <div class="savings-item" style="border-top: 1px solid var(--primary); margin-top: 0.5rem; padding-top: 1rem;">
            <span class="savings-label"><strong>Optimized cost</strong></span>
            <span class="savings-value"><strong>$${optimizedCost.toFixed(2)} (${savingsPercent}% saved)</strong></span>
        </div>
    `;
}

function updateRecommendations(inputs) {
    const container = document.getElementById('recommendations');
    const recommendations = [];
    
    const currentCost = calculateModelCost(selectedModel, inputs);
    const currentModel = models[selectedModel];
    
    // Cache recommendation
    if (inputs.cacheRate < 30) {
        recommendations.push({
            title: 'Increase Cache Usage',
            text: 'Your cache rate is low. Common queries often have 40-60% overlap. Consider implementing semantic caching to reduce costs.'
        });
    }
    
    // Model recommendation
    if (currentCost > 1000 && !selectedModel.includes('3.5') && !selectedModel.includes('llama')) {
        const cheaperCost = calculateModelCost('gpt-3.5-turbo', inputs);
        const savings = ((currentCost - cheaperCost) / currentCost * 100).toFixed(0);
        recommendations.push({
            title: 'Consider Cheaper Models',
            text: `Switching to GPT-3.5 Turbo for non-critical tasks could save ${savings}% while maintaining good quality for most use cases.`
        });
    }
    
    // Batch processing
    if (!inputs.batchMode && inputs.requests > 5000) {
        recommendations.push({
            title: 'Enable Batch Processing',
            text: 'With your volume, batch processing could cut costs by 50%. Perfect for non-real-time workflows like analytics or content generation.'
        });
    }
    
    // Self-hosting
    if (currentCost > 5000 && !currentModel.selfHosted) {
        recommendations.push({
            title: 'Evaluate Self-Hosting',
            text: 'At your scale, self-hosting Llama 3 70B could provide significant savings with comparable quality for many tasks.'
        });
    }
    
    container.innerHTML = recommendations.map(rec => `
        <div class="recommendation-card">
            <h4>${rec.title}</h4>
            <p>${rec.text}</p>
        </div>
    `).join('');
}

function updateCostChart(inputs) {
    const canvas = document.getElementById('costChart');
    const ctx = canvas.getContext('2d');
    
    // Calculate costs for different cache rates
    const cacheRates = [0, 20, 40, 60, 80];
    const costs = cacheRates.map(rate => 
        calculateModelCost(selectedModel, { ...inputs, cacheRate: rate })
    );
    
    // Simple line chart
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary');
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-light');
    ctx.font = '12px Space Mono';
    
    // Draw axes
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Draw data
    const maxCost = Math.max(...costs);
    const xStep = (width - 2 * padding) / (cacheRates.length - 1);
    const yScale = (height - 2 * padding) / maxCost;
    
    ctx.beginPath();
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--secondary');
    ctx.lineWidth = 2;
    
    cacheRates.forEach((rate, i) => {
        const x = padding + i * xStep;
        const y = height - padding - costs[i] * yScale;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        
        // Draw points
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--secondary');
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Labels
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-light');
        ctx.fillText(rate + '%', x - 10, height - padding + 20);
        
        // Cost labels
        if (i === 0 || i === cacheRates.length - 1) {
            ctx.fillText('$' + costs[i].toFixed(0), x - 20, y - 10);
        }
    });
    
    ctx.stroke();
    
    // Title
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary');
    ctx.font = '14px Space Mono';
    ctx.fillText('Monthly Cost vs Cache Rate', width / 2 - 80, 20);
}

function shareResults() {
    const inputs = getInputValues();
    const cost = calculateModelCost(selectedModel, inputs);
    const model = models[selectedModel];
    
    const shareData = {
        model: model.name,
        monthlyRequests: inputs.requests * 30,
        monthlyCost: cost.toFixed(2),
        cacheRate: inputs.cacheRate,
        batchMode: inputs.batchMode
    };
    
    const url = new URL(window.location);
    url.searchParams.set('data', btoa(JSON.stringify(shareData)));
    
    navigator.clipboard.writeText(url.toString()).then(() => {
        alert('Share link copied to clipboard!');
    });
}

function exportToCSV() {
    const inputs = getInputValues();
    const rows = [
        ['Model', 'Monthly Cost', 'Requests/Month', 'Cache Rate', 'Batch Mode']
    ];
    
    Object.entries(models).forEach(([key, model]) => {
        const cost = calculateModelCost(key, inputs);
        rows.push([
            model.name,
            '$' + cost.toFixed(2),
            inputs.requests * 30,
            inputs.cacheRate + '%',
            inputs.batchMode ? 'Yes' : 'No'
        ]);
    });
    
    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ml-cost-analysis.csv';
    a.click();
    
    URL.revokeObjectURL(url);
}