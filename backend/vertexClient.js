const { VertexAI } = require('@google-cloud/vertexai');

const projectId = 'event-management-system-465804'; 
const location = 'us-central1'; 

const vertex_ai = new VertexAI({ project: projectId, location: location });

const generativeModel = vertex_ai.getGenerativeModel({
  model: 'gemini-2.5-pro', // The model ID for Gemini Pro
  generation_config: {
    max_output_tokens: 512, 
    temperature: 0.4,       /
    top_p: 0.8,
    top_k: 40,
  },

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
  generativeModel, 
  projectId,
  location,        
};
