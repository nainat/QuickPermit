const express = require('express');
const router = express.Router();
const { generativeModel } = require('./vertexClient'); 
const pdf = require('pdf-parse');

router.post('/summarize', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text is required." });
  }

  try {
    const prompt = `Summarize the following text in a concise manner, focusing on key information and main points. Aim for 3-5 sentences.\n\nText: "${text}"`;

    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const response = await result.response;
    const summary = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summary || summary.trim() === '') {
      console.warn('Vertex AI returned an empty or unreadable summary.');
      return res.status(500).json({ error: 'Failed to generate summary: AI response was empty.' });
    }

    res.json({ summary });
  } catch (error) {
    console.error('Vertex AI Text Summarization Error:', error);
    res.status(500).json({ error: 'Failed to summarize text using Vertex AI.' });
  }
});


router.post('/summarize-pdf', async (req, res) => {
  const { fileBase64 } = req.body;

  if (!fileBase64) {
    return res.status(400).json({ error: "PDF Base64 content is required." });
  }

  try {
    const base64Pdf = fileBase64.split(';base64,').pop(); // Remove data URI prefix
    if (!base64Pdf) {
      throw new Error("Invalid base64 PDF format. Missing ';base64,' separator or invalid content.");
    }
    const pdfBuffer = Buffer.from(base64Pdf, 'base64');
    const data = await pdf(pdfBuffer);
    const extractedText = data.text;

    if (!extractedText || extractedText.trim() === '') {
      console.warn(`No readable text extracted from PDF.`);
      return res.status(400).json({ error: 'No readable text found in the PDF for summarization.' });
    }

    console.log(`Extracted text from PDF. Length: ${extractedText.length} characters.`);

    const prompt = `Summarize the following document in exactly 4-5 concise lines. Focus on the main purpose, key details (who, what, when, where), and any required actions. Avoid greetings and closings.
    \n\nDocument:\n${extractedText}`;

 
    const result = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const response = await result.response;
    const summary = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summary || summary.trim() === '') {
      console.warn(`Vertex AI returned an empty summary for PDF content.`);
      return res.status(500).json({ error: 'Failed to generate summary: AI response was empty.' });
    }

    res.json({ summary });
  } catch (error) {
    console.error('Vertex AI PDF Summarization Error:', error);
    // Be more specific with errors if possible
    let errorMessage = 'Failed to summarize PDF using Vertex AI.';
    if (error.message.includes('Resource has been exhausted')) {
        errorMessage = 'AI service quota exceeded. Please try again later.';
    } else if (error.message.includes('context window')) {
        errorMessage = 'Document is too long for summarization. Please use a shorter document.';
    }
    res.status(500).json({ error: errorMessage });
  }
});

module.exports = router;
