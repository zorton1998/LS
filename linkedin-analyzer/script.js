// Theme toggling functionality
const themeToggle = document.querySelector('.theme-toggle');
const html = document.documentElement;
const sunIcon = document.querySelector('.sun-icon');
const moonIcon = document.querySelector('.moon-icon');

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', savedTheme);
updateThemeIcons(savedTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcons(newTheme);
});

function updateThemeIcons(theme) {
    if (theme === 'dark') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    }
}

// Enhanced scroll animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Add a slight delay between animations
            const delay = entry.target.dataset.delay || 0;
            entry.target.style.animationDelay = `${delay}s`;
        }
    });
}, observerOptions);

// Observe elements with animation
document.addEventListener('DOMContentLoaded', () => {
    // Add data-delay attributes to elements
    document.querySelectorAll('.step, .card, .benefit').forEach((element, index) => {
        element.dataset.delay = index * 0.2;
    });

    // Start observing
    const animatedElements = document.querySelectorAll('.step, .card, .benefit');
    animatedElements.forEach(element => {
        observer.observe(element);
    });

    // Set up form submission handler
    setupFormSubmission();
});

// Form submission and post analysis
function setupFormSubmission() {
    const form = document.getElementById('analyzeForm');
    const urlInput = document.getElementById('postUrl');
    const resultsSection = document.getElementById('resultsSection');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorMessage = document.getElementById('errorMessage');
    const personasContainer = document.getElementById('personasContainer');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const postUrl = urlInput.value.trim();
        
        if (!postUrl) {
            showError('Please enter a LinkedIn post URL');
            return;
        }
        
        if (!postUrl.includes('linkedin.com')) {
            showError('Please enter a valid LinkedIn post URL');
            return;
        }
        
        // Show loading state
        resultsSection.style.display = 'block';
        loadingSpinner.style.display = 'flex';
        errorMessage.style.display = 'none';
        personasContainer.innerHTML = '';
        
        try {
            // Call the backend API to analyze the post
            const response = await fetch('http://localhost:3000/api/analyze-post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ postUrl })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to analyze post');
            }
            
            displayResults(data);
            
        } catch (error) {
            console.error('Error:', error);
            showError(error.message || 'An error occurred while analyzing the post');
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });
}

function displayResults(data) {
    const resultsSection = document.getElementById('resultsSection');
    const personasContainer = document.getElementById('personasContainer');
    
    // Clear previous results
    personasContainer.innerHTML = '';
    
    // Display post data
    const postCard = document.createElement('div');
    postCard.className = 'post-card';
    postCard.innerHTML = `
        <h3>Post Analysis</h3>
        <div class="post-details">
            <p><strong>Author:</strong> ${data.post.author}</p>
            <p><strong>Tagline:</strong> ${data.post.tagline}</p>
            <p><strong>Content:</strong> ${data.post.postContent}</p>
            <p><strong>Reactions:</strong> ${data.post.reactions}</p>
            <p><strong>Comments:</strong> ${data.post.comments}</p>
            <p><strong>Reposts:</strong> ${data.post.reposts}</p>
            ${data.post.hashtags.length ? `
                <p><strong>Hashtags:</strong> ${data.post.hashtags.join(', ')}</p>
            ` : ''}
        </div>
    `;
    personasContainer.appendChild(postCard);

    // Display interactors
    if (data.interactors.length) {
        const interactorsCard = document.createElement('div');
        interactorsCard.className = 'interactors-card';
        interactorsCard.innerHTML = `
            <h3>Post Interactions</h3>
            <div class="interactors-list">
                ${data.interactors.map(person => `
                    <div class="interactor">
                        <p><strong>${person.name}</strong></p>
                        <p>${person.headline}</p>
                        <a href="${person.profile}" target="_blank">View Profile</a>
                    </div>
                `).join('')}
            </div>
        `;
        personasContainer.appendChild(interactorsCard);
    }
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function showError(message) {
    const resultsSection = document.getElementById('resultsSection');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const personasContainer = document.getElementById('personasContainer');
    
    // Clear previous results
    personasContainer.innerHTML = '';
    
    // Show error message
    errorText.textContent = message;
    errorMessage.style.display = 'block';
    
    // Scroll to error
    resultsSection.scrollIntoView({ behavior: 'smooth' });
} 