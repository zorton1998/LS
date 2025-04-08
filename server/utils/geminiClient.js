/**
 * Gemini API client utility
 * Handles communication with Google's Gemini API for persona analysis
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyzes LinkedIn profiles and generates audience personas
 * @param {Array} profiles - Array of LinkedIn user profiles
 * @returns {Promise<Object>} - Structured persona analysis
 */
async function analyzeProfiles(profiles) {
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Construct the prompt for persona analysis
    const prompt = constructPersonaPrompt(profiles);

    // Generate content using Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response into structured personas
    return parsePersonaResponse(text);
  } catch (error) {
    console.error('Error analyzing profiles with Gemini:', error);
    throw new Error('Failed to analyze profiles with Gemini API');
  }
}

/**
 * Constructs a prompt for the Gemini API to analyze profiles
 * @param {Array} profiles - Array of LinkedIn user profiles
 * @returns {String} - Formatted prompt for Gemini
 */
function constructPersonaPrompt(profiles) {
  return `
    Analyze the following LinkedIn profiles and group them into 2-5 meaningful audience personas. 
    For each persona, return a structured response with the following format:
    
    PERSONA: [Persona Name]
    DESCRIPTION: [Description of this persona]
    JOB_TITLES: [Common job titles, comma separated]
    INDUSTRIES: [Common industries, comma separated]
    MOTIVATION: [Shared motivation or intent]
    CONTENT_TIP: [Suggested content strategy]
    
    ---
    
    PROFILES:
    ${JSON.stringify(profiles, null, 2)}
    
    Please provide a clear, concise analysis that would be helpful for a content creator trying to understand their audience.
  `;
}

/**
 * Parses the raw text response from Gemini into structured persona objects
 * @param {String} text - Raw text response from Gemini
 * @returns {Object} - Structured persona analysis
 */
function parsePersonaResponse(text) {
  try {
    // Split the response by persona sections
    const personaSections = text.split('PERSONA:').filter(Boolean);
    
    const personas = personaSections.map(section => {
      // Extract persona details using regex
      const nameMatch = section.match(/^([^\n]+)/);
      const descriptionMatch = section.match(/DESCRIPTION:([^\n]+)/);
      const jobTitlesMatch = section.match(/JOB_TITLES:([^\n]+)/);
      const industriesMatch = section.match(/INDUSTRIES:([^\n]+)/);
      const motivationMatch = section.match(/MOTIVATION:([^\n]+)/);
      const contentTipMatch = section.match(/CONTENT_TIP:([^\n]+)/);
      
      return {
        name: nameMatch ? nameMatch[1].trim() : 'Unknown Persona',
        description: descriptionMatch ? descriptionMatch[1].trim() : '',
        jobTitles: jobTitlesMatch ? jobTitlesMatch[1].split(',').map(t => t.trim()) : [],
        industries: industriesMatch ? industriesMatch[1].split(',').map(i => i.trim()) : [],
        motivation: motivationMatch ? motivationMatch[1].trim() : '',
        contentTip: contentTipMatch ? contentTipMatch[1].trim() : ''
      };
    });
    
    return { personas };
  } catch (error) {
    console.error('Error parsing Gemini response:', error);
    // Return a fallback response if parsing fails
    return {
      personas: [
        {
          name: "General Audience",
          description: "Unable to parse specific personas from the response",
          jobTitles: [],
          industries: [],
          motivation: "Unknown",
          contentTip: "Focus on general professional content"
        }
      ]
    };
  }
}

module.exports = {
  analyzeProfiles
}; 