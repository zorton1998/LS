# LinkedIn Post Audience Analyzer - Backend

A Node.js backend service that analyzes LinkedIn posts to generate audience personas using the Gemini API.

## Features

- Accepts LinkedIn post URLs for analysis
- Simulates extracting user profiles from post engagement
- Uses Google's Gemini API to analyze profiles and generate audience personas
- Returns structured persona data with insights and content recommendations

## Project Structure

```
/server
├── routes/
│   └── analyzePost.js         # Handles /analyze-post route
├── utils/
│   └── geminiClient.js        # Gemini API integration
├── data/
│   └── mockProfiles.js        # Mock LinkedIn profile data
├── app.js                     # Express setup
├── .env                       # Environment variables
└── package.json
```

## API Endpoints

### POST /api/analyze-post

Analyzes a LinkedIn post and returns audience personas.

**Request Body:**
```json
{
  "postUrl": "https://www.linkedin.com/posts/xyz123"
}
```

**Response:**
```json
{
  "success": true,
  "postUrl": "https://www.linkedin.com/posts/xyz123",
  "profileCount": 8,
  "personas": [
    {
      "name": "SaaS Founders",
      "description": "Startup founders in early-stage SaaS companies...",
      "jobTitles": ["Founder", "CEO", "Product Manager"],
      "industries": ["Software", "Technology", "SaaS"],
      "motivation": "Looking to scale their product and gain market traction",
      "contentTip": "Post tactical content on scaling teams and growth hacks"
    },
    // Additional personas...
  ]
}
```

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
4. Start the server:
   ```
   npm start
   ```

## Development

This is an MVP implementation that uses mock data. In a production environment, you would:

1. Implement actual LinkedIn scraping (with proper authentication and rate limiting)
2. Add database storage for caching results
3. Implement authentication for API access
4. Add more robust error handling and validation
5. Set up monitoring and logging

## License

MIT 