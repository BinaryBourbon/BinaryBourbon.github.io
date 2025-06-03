// ML Cost Calculator V2 - Enhanced with advanced features

// Extended model pricing data (per 1M tokens)
const models = {
    'gpt-4-turbo': {
        name: 'GPT-4 Turbo',
        provider: 'OpenAI',
        input: 10.00,
        output: 30.00,
        cachedInput: 5.00,
        speed: 'Medium',
        quality: 'Excellent',
        latency: 2000,
        rateLimit: 10000,
        contextWindow: 128000
    },
    'gpt-4o': {
        name: 'GPT-4o',
        provider: 'OpenAI',
        input: 5.00,
        output: 15.00,
        cachedInput: 2.50,
        speed: 'Fast',
        quality: 'Excellent',
        latency: 1500,
        rateLimit: 20000,
        contextWindow: 128000
    },
    'gpt-3.5-turbo': {
        name: 'GPT-3.5 Turbo',
        provider: 'OpenAI',
        input: 0.50,
        output: 1.50,
        cachedInput: 0.25,
        speed: 'Very Fast',
        quality: 'Good',
        latency: 800,
        rateLimit: 50000,
        contextWindow: 16385
    },
    'claude-3-opus': {
        name: 'Claude 3 Opus',
        provider: 'Anthropic',
        input: 15.00,
        output: 75.00,
        cachedInput: 7.50,
        speed: 'Slow',
        quality: 'Excellent',
        latency: 3000,
        rateLimit: 5000,
        contextWindow: 200000
    },
    'claude-3-sonnet': {
        name: 'Claude 3 Sonnet',
        provider: 'Anthropic',
        input: 3.00,
        output: 15.00,
        cachedInput: 1.50,
        speed: 'Fast',
        quality: 'Very Good',
        latency: 1200,
        rateLimit: 20000,
        contextWindow: 200000
    },
    'claude-3.5-sonnet': {
        name: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        input: 3.00,
        output: 15.00,
        cachedInput: 1.50,
        speed: 'Fast',
        quality: 'Excellent',
        latency: 1000,
        rateLimit: 25000,
        contextWindow: 200000
    },
    'gemini-pro': {
        name: 'Gemini Pro',
        provider: 'Google',
        input: 0.50,
        output: 1.50,
        cachedInput: 0.25,
        speed: 'Fast',
        quality: 'Very Good',
        latency: 1000,
        rateLimit: 30000,
        contextWindow: 32768
    },
    'mixtral-8x7b': {
        name: 'Mixtral 8x7B',
        provider: 'Mistral',
        input: 0.70,
        output: 0.70,
        cachedInput: 0.35,
        speed: 'Fast',
        quality: 'Good',
        latency: 900,
        rateLimit: 40000,
        contextWindow: 32768
    },
    'llama-3-70b': {
        name: 'Llama 3 70B',
        provider: 'Self-hosted',
        input: 0.20,
        output: 0.20,
        cachedInput: 0.10,
        speed: 'Very Fast',
        quality: 'Good',
        latency: 500,
        rateLimit: 100000,
        contextWindow: 8192,
        selfHosted: true,
        setupCost: 5000,
        monthlyCost: 2000
    }
};

// State management
let state = {
    selectedModels: ['gpt-3.5-turbo', 'claude-3.5-sonnet'],
    comparisonMode: true,
    advancedMode: false,
    routingEnabled: false,
    chartInstances: {}
};

// Cache strategy configurations
const cacheStrategies = {
    none: { name: 'No Cache', hitRate: 0, description: 'No caching implemented' },
    basic: { name: 'Basic Cache', hitRate: 20, description: 'Simple key-based caching' },
    semantic: { name: 'Semantic Cache', hitRate: 45, description: 'Embedding-based semantic similarity' },
    hybrid: { name: 'Hybrid Cache', hitRate: 65, description: 'Combines exact match + semantic similarity' },
    enterprise: { name: 'Enterprise Cache', hitRate: 85, description: 'Multi-layer caching with predictive preloading' }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadStateFromURL();
    renderModelCards();
    updateCalculations();
    initializeCharts();
});

function setupEventListeners() {
    // Basic input listeners
    document.getElementById('requests').addEventListener('input', updateCalculations);
    document.getElementById('inputTokens').addEventListener('input', updateCalculations);
    document.getElementById('outputTokens').addEventListener('input', updateCalculations);
    document.getElementById('processingMode').addEventListener('change', updateCalculations);
    document.getElementById('usagePattern').addEventListener('change', updateCalculations);
    
    // Cache strategy selector
    document.getElementById('cacheStrategy').addEventListener('change', (e) => {
        const strategy = cacheStrategies[e.target.value];
        document.getElementById('cacheRate').value = strategy.hitRate;
        document.getElementById('cacheRateValue').textContent = strategy.hitRate + '%';
        updateCalculations();
    });
    
    // Advanced mode toggle
    document.getElementById('advancedToggle').addEventListener('change', (e) => {
        state.advancedMode = e.target.checked;
        document.querySelectorAll('.advanced-section').forEach(section => {
            section.style.display = state.advancedMode ? 'block' : 'none';
        });
        updateCalculations();
    });
    
    // Comparison mode toggle
    document.getElementById('comparisonToggle').addEventListener('change', (e) => {
        state.comparisonMode = e.target.checked;
        renderModelCards();
        updateCalculations();
    });
    
    // Routing toggle
    document.getElementById('routingToggle').addEventListener('change', (e) => {
        state.routingEnabled = e.target.checked;
        const routingSection = document.getElementById('routingAnalysis');
        if (routingSection) {
            routingSection.style.display = state.routingEnabled ? 'block' : 'none';
        }
        updateCalculations();
    });
    
    // Export buttons
    document.getElementById('shareResults').addEventListener('click', shareResults);
    document.getElementById('exportCSV').addEventListener('click', exportToCSV);
    document.getElementById('exportPDF').addEventListener('click', exportToPDF);
    
    // Cache rate slider
    const cacheSlider = document.getElementById('cacheRate');
    const cacheValue = document.getElementById('cacheRateValue');
    cacheSlider.addEventListener('input', (e) => {
        cacheValue.textContent = e.target.value + '%';
        document.getElementById('cacheStrategy').value = 'custom';
        updateCalculations();
    });
}

function renderModelCards() {
    const container = document.getElementById('modelCards');
    container.innerHTML = '';
    
    if (state.comparisonMode) {
        // Multi-select mode
        container.innerHTML = '<div class="model-selection-hint">Select up to 4 models to compare</div>';
        
        Object.entries(models).forEach(([key, model]) => {
            const card = createModelCard(key, model, true);
            container.appendChild(card);
        });
    } else {
        // Single select mode
        Object.entries(models).forEach(([key, model]) => {
            const card = createModelCard(key, model, false);
            container.appendChild(card);
        });
    }
}

function createModelCard(key, model, multiSelect) {
    const card = document.createElement('div');
    const isSelected = multiSelect ? 
        state.selectedModels.includes(key) : 
        state.selectedModels[0] === key;
    
    card.className = `model-card ${isSelected ? 'selected' : ''} ${model.provider.toLowerCase()}`;
    card.onclick = () => selectModel(key, multiSelect);
    
    const monthlyBase = calculateModelCost(key, getInputValues());
    
    card.innerHTML = `
        <div class="model-header">
            <div class="model-name">${model.name}</div>
            <div class="model-provider">${model.provider}</div>
        </div>
        <div class="model-cost">$${monthlyBase.toFixed(2)}</div>
        <div class="model-cost-per">per month</div>
        <div class="model-details">
            <div class="detail-item">
                <span class="detail-label">Speed:</span>
                <span class="detail-value">${model.speed}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Quality:</span>
                <span class="detail-value">${model.quality}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Context:</span>
                <span class="detail-value">${(model.contextWindow / 1000).toFixed(0)}K</span>
            </div>
            ${model.selfHosted ? '<div class="self-hosted-badge">Self-hosted</div>' : ''}
        </div>
        ${multiSelect ? '<div class="selection-indicator"></div>' : ''}
    `;
    
    return card;
}

function selectModel(modelKey, multiSelect) {
    if (multiSelect) {
        const index = state.selectedModels.indexOf(modelKey);
        if (index > -1) {
            state.selectedModels.splice(index, 1);
        } else if (state.selectedModels.length < 4) {
            state.selectedModels.push(modelKey);
        } else {
            showNotification('Maximum 4 models can be compared at once');
            return;
        }
    } else {
        state.selectedModels = [modelKey];
    }
    
    renderModelCards();
    updateCalculations();
}

function getInputValues() {
    return {
        requests: parseInt(document.getElementById('requests').value) || 0,
        inputTokens: parseInt(document.getElementById('inputTokens').value) || 0,
        outputTokens: parseInt(document.getElementById('outputTokens').value) || 0,
        cacheRate: parseInt(document.getElementById('cacheRate').value) || 0,
        batchMode: document.getElementById('processingMode').value === 'batch',
        usagePattern: document.getElementById('usagePattern').value,
        peakHours: parseInt(document.getElementById('peakHours')?.value) || 8,
        burstMultiplier: parseFloat(document.getElementById('burstMultiplier')?.value) || 1.5
    };
}

function calculateModelCost(modelKey, inputs, includeSetup = false) {
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
    
    // Add self-hosting costs if applicable
    if (model.selfHosted && includeSetup) {
        totalCost += model.monthlyCost || 0;
    }
    
    return totalCost;
}

function updateCalculations() {
    const inputs = getInputValues();
    
    // Update model cards
    renderModelCards();
    
    // Update comparison chart
    if (state.comparisonMode && state.selectedModels.length > 1) {
        updateComparisonChart();
    }
    
    // Update cost projection chart
    updateProjectionChart();
    
    // Calculate savings and recommendations
    updateSavingsAnalysis(inputs);
    updateRecommendations(inputs);
    
    // Update routing analysis if enabled
    if (state.routingEnabled) {
        updateRoutingAnalysis(inputs);
    }
    
    // Update break-even analysis
    updateBreakEvenAnalysis(inputs);
}

function updateComparisonChart() {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    const inputs = getInputValues();
    
    // Destroy existing chart
    if (state.chartInstances.comparison) {
        state.chartInstances.comparison.destroy();
    }
    
    const datasets = [];
    const cacheRates = [0, 20, 40, 60, 80];
    
    state.selectedModels.forEach((modelKey, index) => {
        const model = models[modelKey];
        const costs = cacheRates.map(rate => 
            calculateModelCost(modelKey, { ...inputs, cacheRate: rate })
        );
        
        datasets.push({
            label: model.name,
            data: costs,
            borderColor: getModelColor(index),
            backgroundColor: getModelColor(index, 0.1),
            tension: 0.3
        });
    });
    
    state.chartInstances.comparison = new Chart(ctx, {
        type: 'line',
        data: {
            labels: cacheRates.map(r => r + '%'),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Cost vs Cache Rate Comparison',
                    color: getComputedStyle(document.documentElement).getPropertyValue('--text-light')
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-light')
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Monthly Cost ($)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-light')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-light'),
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Cache Hit Rate',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-light')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-light')
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

function updateProjectionChart() {
    const ctx = document.getElementById('projectionChart').getContext('2d');
    const inputs = getInputValues();
    
    // Destroy existing chart
    if (state.chartInstances.projection) {
        state.chartInstances.projection.destroy();
    }
    
    const months = Array.from({length: 12}, (_, i) => i + 1);
    const primaryModel = state.selectedModels[0];
    
    // Calculate projections with different growth scenarios
    const scenarios = {
        'Conservative (10% growth)': 1.10,
        'Moderate (25% growth)': 1.25,
        'Aggressive (50% growth)': 1.50
    };
    
    const datasets = Object.entries(scenarios).map(([name, growthRate], index) => {
        const costs = months.map(month => {
            const growthFactor = Math.pow(growthRate, (month - 1) / 12);
            const adjustedInputs = {
                ...inputs,
                requests: inputs.requests * growthFactor
            };
            return calculateModelCost(primaryModel, adjustedInputs);
        });
        
        return {
            label: name,
            data: costs,
            borderColor: getScenarioColor(index),
            backgroundColor: getScenarioColor(index, 0.1),
            tension: 0.3
        };
    });
    
    state.chartInstances.projection = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months.map(m => `Month ${m}`),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '12-Month Cost Projection',
                    color: getComputedStyle(document.documentElement).getPropertyValue('--text-light')
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-light')
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Monthly Cost ($)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-light')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-light'),
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-light')
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

function updateRoutingAnalysis(inputs) {
    const container = document.getElementById('routingAnalysis');
    if (!container) return;
    
    // Define task complexity thresholds
    const taskTypes = {
        simple: { percentage: 40, models: ['gpt-3.5-turbo', 'gemini-pro', 'mixtral-8x7b'] },
        moderate: { percentage: 35, models: ['gpt-4o', 'claude-3.5-sonnet'] },
        complex: { percentage: 20, models: ['gpt-4-turbo', 'claude-3-opus'] },
        specialized: { percentage: 5, models: ['claude-3-opus'] }
    };
    
    let routingCost = 0;
    let routingBreakdown = [];
    
    Object.entries(taskTypes).forEach(([type, config]) => {
        const taskRequests = (inputs.requests * config.percentage / 100) * 30;
        const optimalModel = config.models.find(m => models[m]) || config.models[0];
        const cost = calculateModelCost(optimalModel, {
            ...inputs,
            requests: taskRequests / 30
        });
        
        routingCost += cost;
        routingBreakdown.push({
            type,
            percentage: config.percentage,
            model: models[optimalModel].name,
            cost
        });
    });
    
    const singleModelCost = calculateModelCost(state.selectedModels[0], inputs);
    const savings = singleModelCost - routingCost;
    const savingsPercent = (savings / singleModelCost * 100).toFixed(1);
    
    container.innerHTML = `
        <h4>Intelligent Routing Analysis</h4>
        <div class="routing-summary">
            <p>By routing requests based on complexity, you could save <strong>$${savings.toFixed(2)}/month (${savingsPercent}%)</strong></p>
        </div>
        <div class="routing-breakdown">
            ${routingBreakdown.map(item => `
                <div class="routing-item">
                    <div class="routing-type">${item.type.charAt(0).toUpperCase() + item.type.slice(1)} tasks (${item.percentage}%)</div>
                    <div class="routing-model">→ ${item.model}</div>
                    <div class="routing-cost">$${item.cost.toFixed(2)}</div>
                </div>
            `).join('')}
        </div>
        <div class="routing-total">
            <strong>Total with routing: $${routingCost.toFixed(2)}/month</strong>
        </div>
    `;
}

function updateBreakEvenAnalysis(inputs) {
    const container = document.getElementById('breakEvenAnalysis');
    if (!container) return;
    
    const selfHostedModel = models['llama-3-70b'];
    const cloudModels = state.selectedModels.filter(m => !models[m].selfHosted);
    
    if (cloudModels.length === 0) return;
    
    const analyses = cloudModels.map(modelKey => {
        const cloudModel = models[modelKey];
        const cloudMonthlyCost = calculateModelCost(modelKey, inputs);
        const selfHostedMonthlyCost = selfHostedModel.monthlyCost;
        const selfHostedSetupCost = selfHostedModel.setupCost;
        
        // Calculate break-even point
        const monthlySavings = cloudMonthlyCost - selfHostedMonthlyCost;
        const breakEvenMonths = monthlySavings > 0 ? 
            Math.ceil(selfHostedSetupCost / monthlySavings) : Infinity;
        
        // Calculate 3-year TCO
        const cloudTCO = cloudMonthlyCost * 36;
        const selfHostedTCO = selfHostedSetupCost + (selfHostedMonthlyCost * 36);
        const tcoSavings = cloudTCO - selfHostedTCO;
        
        return {
            model: cloudModel.name,
            cloudMonthlyCost,
            breakEvenMonths,
            cloudTCO,
            selfHostedTCO,
            tcoSavings
        };
    });
    
    container.innerHTML = `
        <h4>Self-Hosting Break-Even Analysis</h4>
        <div class="break-even-cards">
            ${analyses.map(analysis => `
                <div class="break-even-card">
                    <h5>${analysis.model} vs Self-Hosted Llama 3 70B</h5>
                    <div class="break-even-metrics">
                        <div class="metric">
                            <span class="metric-label">Break-even point:</span>
                            <span class="metric-value">${
                                analysis.breakEvenMonths === Infinity ? 
                                'Never' : 
                                `${analysis.breakEvenMonths} months`
                            }</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">3-year savings:</span>
                            <span class="metric-value ${analysis.tcoSavings > 0 ? 'positive' : 'negative'}">
                                ${analysis.tcoSavings > 0 ? '+' : ''}$${Math.abs(analysis.tcoSavings).toFixed(0)}
                            </span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Monthly cloud cost:</span>
                            <span class="metric-value">$${analysis.cloudMonthlyCost.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="break-even-note">
            <small>* Self-hosting costs include $${selfHostedModel.setupCost} setup + $${selfHostedModel.monthlyCost}/month infrastructure</small>
        </div>
    `;
}

function updateSavingsAnalysis(inputs) {
    const container = document.getElementById('savingsBreakdown');
    const primaryModel = state.selectedModels[0];
    
    const baseCost = calculateModelCost(primaryModel, { ...inputs, cacheRate: 0, batchMode: false });
    const optimizedCost = calculateModelCost(primaryModel, inputs);
    
    const cacheSavings = calculateModelCost(primaryModel, { ...inputs, batchMode: false }) - 
                        calculateModelCost(primaryModel, { ...inputs, cacheRate: 0, batchMode: false });
    
    const batchSavings = inputs.batchMode ? baseCost * 0.5 : 0;
    const totalSavings = baseCost - optimizedCost;
    const savingsPercent = (totalSavings / baseCost * 100).toFixed(1);
    
    // Annual projection
    const annualBase = baseCost * 12;
    const annualOptimized = optimizedCost * 12;
    const annualSavings = annualBase - annualOptimized;
    
    container.innerHTML = `
        <div class="savings-item">
            <span class="savings-label">Base monthly cost</span>
            <span class="savings-value">$${baseCost.toFixed(2)}</span>
        </div>
        <div class="savings-item">
            <span class="savings-label">Cache savings (${inputs.cacheRate}%)</span>
            <span class="savings-value negative">-$${Math.abs(cacheSavings).toFixed(2)}</span>
        </div>
        ${inputs.batchMode ? `
        <div class="savings-item">
            <span class="savings-label">Batch processing discount</span>
            <span class="savings-value negative">-$${batchSavings.toFixed(2)}</span>
        </div>
        ` : ''}
        <div class="savings-item total">
            <span class="savings-label"><strong>Optimized monthly cost</strong></span>
            <span class="savings-value"><strong>$${optimizedCost.toFixed(2)}</strong></span>
        </div>
        <div class="savings-item highlight">
            <span class="savings-label">Monthly savings</span>
            <span class="savings-value positive">$${totalSavings.toFixed(2)} (${savingsPercent}%)</span>
        </div>
        <div class="savings-item highlight">
            <span class="savings-label">Annual savings</span>
            <span class="savings-value positive">$${annualSavings.toFixed(0)}</span>
        </div>
    `;
}

function updateRecommendations(inputs) {
    const container = document.getElementById('recommendations');
    const recommendations = [];
    const primaryModel = state.selectedModels[0];
    const currentCost = calculateModelCost(primaryModel, inputs);
    const currentModel = models[primaryModel];
    
    // Enhanced recommendations based on usage patterns
    if (inputs.cacheRate < 30) {
        const potentialSavings = calculateModelCost(primaryModel, { ...inputs, cacheRate: 45 }) - currentCost;
        recommendations.push({
            title: 'Implement Semantic Caching',
            text: `Your cache rate is ${inputs.cacheRate}%. Implementing semantic caching could increase it to 45% and save $${Math.abs(potentialSavings).toFixed(2)}/month.`,
            priority: 'high',
            savings: Math.abs(potentialSavings)
        });
    }
    
    // Model optimization based on quality requirements
    if (currentCost > 1000 && currentModel.quality === 'Excellent' && !inputs.routingEnabled) {
        recommendations.push({
            title: 'Enable Complexity-Based Routing',
            text: 'Route simple queries to cheaper models while keeping complex ones on premium models. This could save 30-40% without impacting quality.',
            priority: 'high',
            savings: currentCost * 0.35
        });
    }
    
    // Batch processing recommendation
    if (!inputs.batchMode && inputs.requests > 5000 && inputs.usagePattern !== 'realtime') {
        const batchSavings = currentCost * 0.5;
        recommendations.push({
            title: 'Enable Batch Processing',
            text: `Your usage pattern allows for batch processing. This would save $${batchSavings.toFixed(2)}/month (50% discount).`,
            priority: 'medium',
            savings: batchSavings
        });
    }
    
    // Self-hosting recommendation
    if (currentCost > 5000 && !currentModel.selfHosted) {
        const selfHostedCost = calculateModelCost('llama-3-70b', inputs, true);
        const savings = currentCost - selfHostedCost;
        recommendations.push({
            title: 'Consider Self-Hosting',
            text: `At your scale, self-hosting Llama 3 70B could save $${savings.toFixed(0)}/month after initial setup.`,
            priority: 'medium',
            savings: savings
        });
    }
    
    // Rate limit optimization
    if (inputs.requests > currentModel.rateLimit * 0.8) {
        recommendations.push({
            title: 'Approaching Rate Limits',
            text: `You're at ${((inputs.requests / currentModel.rateLimit) * 100).toFixed(0)}% of rate limits. Consider load balancing across multiple providers.`,
            priority: 'high',
            savings: 0
        });
    }
    
    // Sort by potential savings
    recommendations.sort((a, b) => b.savings - a.savings);
    
    container.innerHTML = recommendations.map(rec => `
        <div class="recommendation-card ${rec.priority}">
            <div class="recommendation-header">
                <h4>${rec.title}</h4>
                ${rec.savings > 0 ? `<span class="potential-savings">Save $${rec.savings.toFixed(0)}/mo</span>` : ''}
            </div>
            <p>${rec.text}</p>
        </div>
    `).join('');
}

// Utility functions
function getModelColor(index, opacity = 1) {
    const colors = [
        `rgba(0, 255, 65, ${opacity})`,    // Primary green
        `rgba(255, 193, 7, ${opacity})`,    // Yellow
        `rgba(220, 53, 69, ${opacity})`,    // Red
        `rgba(13, 110, 253, ${opacity})`    // Blue
    ];
    return colors[index % colors.length];
}

function getScenarioColor(index, opacity = 1) {
    const colors = [
        `rgba(40, 167, 69, ${opacity})`,    // Success green
        `rgba(255, 193, 7, ${opacity})`,    // Warning yellow
        `rgba(220, 53, 69, ${opacity})`     // Danger red
    ];
    return colors[index % colors.length];
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function shareResults() {
    const inputs = getInputValues();
    const shareData = {
        models: state.selectedModels,
        inputs: inputs,
        timestamp: new Date().toISOString()
    };
    
    const url = new URL(window.location);
    url.searchParams.set('data', btoa(JSON.stringify(shareData)));
    
    navigator.clipboard.writeText(url.toString()).then(() => {
        showNotification('Share link copied to clipboard!');
    });
}

function loadStateFromURL() {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');
    
    if (data) {
        try {
            const shareData = JSON.parse(atob(data));
            
            // Restore state
            if (shareData.models) {
                state.selectedModels = shareData.models;
            }
            
            // Restore inputs
            if (shareData.inputs) {
                Object.entries(shareData.inputs).forEach(([key, value]) => {
                    const element = document.getElementById(key);
                    if (element) {
                        element.value = value;
                        if (element.type === 'range') {
                            const valueDisplay = document.getElementById(key + 'Value');
                            if (valueDisplay) {
                                valueDisplay.textContent = value + '%';
                            }
                        }
                    }
                });
            }
        } catch (e) {
            console.error('Failed to load shared data:', e);
        }
    }
}

function exportToCSV() {
    const inputs = getInputValues();
    const rows = [
        ['ML Cost Analysis Report', new Date().toLocaleDateString()],
        [],
        ['Configuration'],
        ['Requests per day', inputs.requests],
        ['Average input tokens', inputs.inputTokens],
        ['Average output tokens', inputs.outputTokens],
        ['Cache hit rate', inputs.cacheRate + '%'],
        ['Processing mode', inputs.batchMode ? 'Batch' : 'Real-time'],
        [],
        ['Model Comparison'],
        ['Model', 'Provider', 'Monthly Cost', 'Cost per 1K requests', 'Annual Cost']
    ];
    
    state.selectedModels.forEach(modelKey => {
        const model = models[modelKey];
        const cost = calculateModelCost(modelKey, inputs);
        const costPer1k = cost / (inputs.requests * 30 / 1000);
        
        rows.push([
            model.name,
            model.provider,
            '$' + cost.toFixed(2),
            '$' + costPer1k.toFixed(2),
            '$' + (cost * 12).toFixed(0)
        ]);
    });
    
    // Add recommendations
    rows.push([], ['Recommendations']);
    const recommendationsEl = document.querySelectorAll('.recommendation-card');
    recommendationsEl.forEach(rec => {
        const title = rec.querySelector('h4').textContent;
        const text = rec.querySelector('p').textContent;
        rows.push([title, text]);
    });
    
    const csv = rows.map(row => row.map(cell => 
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
    ).join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `ml-cost-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    URL.revokeObjectURL(url);
}

function exportToPDF() {
    // This would require a PDF library like jsPDF
    // For now, we'll use the browser's print functionality
    window.print();
    showNotification('Use browser print dialog to save as PDF');
}

function initializeCharts() {
    // Set default Chart.js options
    Chart.defaults.font.family = "'Space Mono', monospace";
    Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--text-light');
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        models,
        calculateModelCost,
        cacheStrategies
    };
}