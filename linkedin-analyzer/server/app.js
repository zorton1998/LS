/**
 * LinkedIn Post Audience Analyzer - Express Server
 * Main application file
 */

// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Import routes
const analyzePostRouter = require('./routes/analyzePost');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/analyze-post', analyzePostRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'LinkedIn Post Audience Analyzer API is running'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!',
    message: err.message
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Analyze post endpoint: http://localhost:${PORT}/api/analyze-post`);
});

module.exports = app; 