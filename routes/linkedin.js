const express = require('express');
const router = express.Router();
const { requireAuth, rateLimiter } = require('../middleware/auth');
const linkedInService = require('../services/linkedin');

// Apply rate limiting to all LinkedIn routes
router.use(rateLimiter);

// OAuth callback
router.post('/api/linkedin/callback', async (req, res) => {
    try {
        const { code } = req.body;
        const tokenData = await linkedInService.client.getAccessToken(code);
        
        // Store token in session
        req.session.linkedinToken = tokenData.access_token;
        req.session.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);
        
        res.json({ success: true });
    } catch (error) {
        console.error('OAuth error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

// Protected routes
router.post('/api/analyze-post', requireAuth, async (req, res) => {
    try {
        const { postUrl } = req.body;
        
        // Check token expiration
        if (Date.now() >= req.session.tokenExpiry) {
            return res.status(401).json({ error: 'Session expired' });
        }
        
        const result = await linkedInService.analyzePost(postUrl, {
            accessToken: req.session.linkedinToken
        });
        
        res.json(result);
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze post' });
    }
});

module.exports = router; 