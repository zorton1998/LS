function setupFormSubmission() {
    const form = document.getElementById('analyzeForm');
    const urlInput = document.getElementById('postUrl');
    const resultsSection = document.getElementById('resultsSection');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorMessage = document.getElementById('errorMessage');
    const personasContainer = document.getElementById('personasContainer');
    
    console.log('Form submission handler initialized');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted');
        
        const postUrl = urlInput.value.trim();
        console.log('Post URL:', postUrl);
        
        if (!postUrl) {
            console.error('Empty URL provided');
            showError('Please enter a LinkedIn post URL');
            return;
        }
        
        if (!postUrl.includes('linkedin.com')) {
            console.error('Invalid LinkedIn URL');
            showError('Please enter a valid LinkedIn post URL');
            return;
        }
        
        // Show loading state
        console.log('Showing loading state');
        resultsSection.style.display = 'block';
        loadingSpinner.style.display = 'flex';
        errorMessage.style.display = 'none';
        personasContainer.innerHTML = '';
        
        try {
            console.log('Sending request to backend...');
            const response = await fetch('http://localhost:3000/api/analyze-post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ postUrl })
            });
            
            console.log('Response received:', response.status);
            const data = await response.json();
            console.log('Response data:', data);
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to analyze post');
            }
            
            console.log('Displaying results');
            displayResults(data);
            
        } catch (error) {
            console.error('Error in form submission:', error);
            showError(error.message || 'An error occurred while analyzing the post');
        } finally {
            console.log('Hiding loading spinner');
            loadingSpinner.style.display = 'none';
        }
    });
} 