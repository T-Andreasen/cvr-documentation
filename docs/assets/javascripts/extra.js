// Custom JavaScript for CVR API Documentation

document.addEventListener('DOMContentLoaded', function() {
    // Add copy buttons to code blocks
    addCopyButtons();
    
    // Initialize tooltips for status badges
    initializeStatusBadges();
    
    // Add credential warnings
    addCredentialWarnings();
});

function addCopyButtons() {
    // This is handled by Material theme's built-in copy feature
    // We can add custom behavior here if needed
    
    const codeBlocks = document.querySelectorAll('pre code');
    codeBlocks.forEach(function(block) {
        // Add click handler for easy selection
        block.addEventListener('click', function() {
            selectText(this);
        });
    });
}

function selectText(element) {
    if (window.getSelection && document.createRange) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

function initializeStatusBadges() {
    const statusElements = document.querySelectorAll('[data-status]');
    statusElements.forEach(function(element) {
        const status = element.getAttribute('data-status');
        element.classList.add('status-badge', status);
        
        // Add tooltip with more info
        switch(status) {
            case 'normal':
                element.title = 'Active company - Currently operating';
                break;
            case 'warning':
                element.title = 'Company under liquidation or reconstruction';
                break;
            case 'error':
                element.title = 'Company dissolved or under bankruptcy';
                break;
        }
    });
}

function addCredentialWarnings() {
    // Find code blocks that might contain credentials
    const codeBlocks = document.querySelectorAll('pre code');
    codeBlocks.forEach(function(block) {
        const text = block.textContent;
        
        // Check for potential credential patterns
        if (text.includes('YOUR_USERNAME') || text.includes('YOUR_PASSWORD')) {
            // This is good - using placeholders
            return;
        }
        
        // Warn about potential real credentials (basic check)
        const suspiciousPatterns = [
            /[a-zA-Z0-9_]{20,}/g,  // Long strings that might be passwords
            /EXAMPLE_USERNAME/g,   // Known test username pattern
        ];
        
        let hasSuspiciousContent = false;
        suspiciousPatterns.forEach(function(pattern) {
            if (pattern.test(text)) {
                hasSuspiciousContent = true;
            }
        });
        
        if (hasSuspiciousContent && !block.classList.contains('credential-warning-added')) {
            addWarningBanner(block);
            block.classList.add('credential-warning-added');
        }
    });
}

function addWarningBanner(codeBlock) {
    const warning = document.createElement('div');
    warning.className = 'admonition warning credential-warning';
    warning.innerHTML = `
        <p class="admonition-title">Credential Warning</p>
        <p>Make sure to replace any example credentials with your own before using this code.</p>
    `;
    
    codeBlock.parentNode.insertBefore(warning, codeBlock);
}

// Add utility functions for API status checking
window.CVRDocs = {
    // Check if CVR API is accessible (basic connectivity test)
    checkAPIStatus: function() {
        // Note: This would require CORS to be enabled on the CVR API
        // For now, just provide instructions
        console.log('To test API connectivity, run this in your terminal:');
        console.log('curl -u "$CVR_USERNAME:$CVR_PASSWORD" -X POST "http://distribution.virk.dk/cvr-permanent/virksomhed/_search" -d \'{"size":1}\'');
    },
    
    // Format CVR numbers with proper spacing
    formatCVR: function(cvr) {
        if (typeof cvr === 'number') {
            cvr = cvr.toString();
        }
        
        if (cvr.length === 8) {
            return cvr.substring(0, 2) + ' ' + 
                   cvr.substring(2, 4) + ' ' + 
                   cvr.substring(4, 6) + ' ' + 
                   cvr.substring(6, 8);
        }
        
        return cvr;
    },
    
    // Validate CVR number format
    validateCVR: function(cvr) {
        if (typeof cvr === 'number') {
            cvr = cvr.toString();
        }
        
        // CVR numbers are 8 digits
        return /^\d{8}$/.test(cvr);
    }
};

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+K (or Cmd+K on Mac) to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('[data-md-component="search-query"]');
        if (searchInput) {
            searchInput.focus();
        }
    }
});

// Google Analytics event tracking (if analytics is configured)
function trackEvent(category, action, label) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            event_category: category,
            event_label: label
        });
    }
}

// Track documentation usage
document.addEventListener('click', function(e) {
    // Track external links
    if (e.target.matches('a[href^="http"]') && !e.target.href.includes(window.location.hostname)) {
        trackEvent('External Link', 'Click', e.target.href);
    }
    
    // Track copy button usage
    if (e.target.matches('.md-clipboard')) {
        trackEvent('Code', 'Copy', 'Code block copied');
    }
});

console.log('CVR API Documentation JavaScript loaded successfully!');