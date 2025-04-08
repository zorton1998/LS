/**
 * Route handler for /analyze-post endpoint
 * Accepts a LinkedIn post URL and returns audience personas
 */

const express = require('express');
const router = express.Router();
const mockProfiles = require('../data/mockProfiles');
const { analyzeProfiles } = require('../utils/geminiClient');

/**
 * POST /analyze-post
 * Analyzes a LinkedIn post and returns audience personas
 */
router.post('/', async (req, res) => {
  try {
    // Validate request body
    const { postUrl } = req.body;
    
    if (!postUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: postUrl'
      });
    }
    
    // Validate URL format (basic check)
    if (!postUrl.includes('linkedin.com')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL: Must be a LinkedIn post URL'
      });
    }
    
    // In a real implementation, we would scrape the LinkedIn post here
    // For MVP, we'll use mock data
    console.log(`Analyzing LinkedIn post: ${postUrl}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get mock profiles (in a real implementation, this would be scraped data)
    const profiles = mockProfiles;
    
    // Analyze profiles using Gemini API
    const personaAnalysis = await analyzeProfiles(profiles);
    
    // Return the analysis
    return res.status(200).json({
      success: true,
      postUrl,
      profileCount: profiles.length,
      ...personaAnalysis
    });
    
  } catch (error) {
    console.error('Error analyzing post:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze LinkedIn post',
      message: error.message
    });
  }
});

module.exports = router; 