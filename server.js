const express = require('express');
const cors = require('cors');
const linkedInAutomation = require('./services/linkedin-automation');
const app = express();

console.log('Starting server initialization...');

// Enable CORS for your frontend
app.use(cors());
app.use(express.json());

// Serve static files (your HTML, CSS, JS)
app.use(express.static('public'));
console.log('Static file serving enabled');

// API endpoint for post analysis
app.post('/api/analyze-post', async (req, res) => {
    console.log('Received post analysis request');
    console.log('Request body:', req.body);

    try {
        const { postUrl } = req.body;
        
        if (!postUrl) {
            console.error('No post URL provided');
            return res.status(400).json({ error: 'Post URL is required' });
        }

        console.log('Starting LinkedIn post analysis for URL:', postUrl);
        const result = await linkedInAutomation.analyzePost(postUrl);
        console.log('Analysis completed successfully');
        console.log('Result:', result);
        
        res.json(result);

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: error.message || 'Failed to analyze post' });
    }
});

// Cleanup on server shutdown
process.on('SIGINT', async () => {
    console.log('Server shutdown initiated');
    await linkedInAutomation.cleanup();
    process.exit();
});

// Add this before the app.listen call
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 