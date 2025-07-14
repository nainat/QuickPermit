// vertexClient.js
const { VertexAI } = require('@google-cloud/vertexai');

// --- Configuration ---
const projectId = 'event-management-system-465804'; // Your actual Google Cloud Project ID
const location = 'us-central1'; // Recommended region for Gemini Pro
                               // You can try 'us-east4' but 'us-central1'
                               // often has earlier access to new features.

// Initialize Vertex AI with your project ID and location
const vertex_ai = new VertexAI({ project: projectId, location: location });

// Get the generative model instance for Gemini Pro.
// This is the model recommended for text generation tasks like summarization.
const generativeModel = vertex_ai.getGenerativeModel({
  model: 'gemini-2.5-pro', // The model ID for Gemini Pro
  // Optional: Configure generation parameters for summary quality and length
  generation_config: {
    max_output_tokens: 512, // Max length of the summary (adjust as needed)
    temperature: 0.4,       // Lower temperature for more focused/less creative summaries
    top_p: 0.8,
    top_k: 40,
  },
  // Optional: Configure safety settings if you need to filter harmful content
  // safety_settings: [
  //   {
  //     category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
  //     threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  //   },
  //   {
  //     category: 'HARM_CATEGORY_HATE_SPEECH',
  //     threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  //   },
  //   {
  //     category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  //     threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  //   },
  //   {
  //     category: 'HARM_CATEGORY_HARASSMENT',
  //     threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  //   },
  // ],
});

module.exports = {
  generativeModel, // Export the initialized generative model
  projectId,       // Still useful for logging or other purposes
  location,        // Still useful for logging or other purposes
};