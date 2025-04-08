const express = require('express');
const cors = require('cors');
const linkedInAutomation = require('./services/linkedin-automation');
const app = express();

// Enable CORS for your frontend
app.use(cors());
app.use(express.json());

// Serve static files (your HTML, CSS, JS)
app.use(express.static('public'));

// API endpoint for post analysis
app.post('/api/analyze-post', async (req, res) => {
    try {
        const { postUrl } = req.body;
        
        if (!postUrl) {
            return res.status(400).json({ error: 'Post URL is required' });
        }

        const result = await linkedInAutomation.analyzePost(postUrl);
        res.json(result);

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: error.message || 'Failed to analyze post' });
    }
});

// Cleanup on server shutdown
process.on('SIGINT', async () => {
    await linkedInAutomation.cleanup();
    process.exit();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 