const express = require('express');
const axios = require('axios');
const router = express.Router();

// Rate limiting for API calls
const lastApiCall = { timestamp: 0 };
const API_COOLDOWN = 1000; // 1 second between calls

// Cybersecurity chatbot endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if API key exists
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.log('No valid API key found');
      return res.json({
        response: getFallbackResponse(message),
        timestamp: new Date().toISOString(),
        fallback: true,
        reason: 'no_api_key'
      });
    }

    const now = Date.now();
    // Only apply rate limiting if requests are very frequent (less than 500ms)
    if (now - lastApiCall.timestamp < 500) {
      console.log('Rate limiting applied - too frequent requests');
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const systemPrompt = `You are a helpful Cybersecurity Assistant chatbot.
Your role is to guide users about cybersecurity concepts, threats, and best practices.
Always explain in simple, easy-to-understand language with short examples.

Rules for your response:
1. If the user asks about a cybersecurity concept (e.g., phishing, ransomware, firewalls),
   - Give a short definition,
   - Provide a real-world example,
   - Suggest 1–2 prevention tips.

2. If the user asks a multiple-choice style question,
   - Return the correct answer clearly with a short explanation.

3. If the user asks for practical advice (like creating strong passwords, safe browsing, avoiding scams),
   - Provide step-by-step security tips.

4. Always keep answers polite, professional, and trustworthy.
5. Never share malicious code or hacking methods.
6. If the question is unrelated to cybersecurity, politely say:
   - "⚠️ I am a Cybersecurity Assistant. Please ask me questions related to online safety, threats, or digital security."

Your output format must always follow this structure:
- **Answer:** [main explanation here]
- **Example:** [real-world example]
- **Tips:** [bullet points with 1–3 prevention or safety tips]`;

    console.log(`Making Gemini API call for: "${message.substring(0, 50)}..."`);  
    lastApiCall.timestamp = Date.now();

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ 
            text: `${systemPrompt}\n\nUser Question: ${message}\n\nProvide a helpful cybersecurity response following the format above.`
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000
        }
      },
      {
        timeout: 20000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data.candidates || !response.data.candidates[0] || !response.data.candidates[0].content) {
      console.log('Invalid Gemini API response structure');
      throw new Error('Invalid response from Gemini API');
    }

    let botResponse = response.data.candidates[0].content.parts[0].text;
    console.log('✅ Gemini API response received successfully');
    
    // Clean and format the response
    botResponse = formatResponse(botResponse);

    res.json({
      response: botResponse,
      timestamp: new Date().toISOString(),
      source: 'gemini',
      success: true
    });

  } catch (error) {
    console.error('❌ Chatbot API error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    let errorReason = 'api_error';
    if (error.response?.status === 429) {
      errorReason = 'rate_limit';
      console.log('Rate limit hit, using fallback');
    } else if (error.response?.status === 403) {
      errorReason = 'quota_exceeded';
      console.log('Quota exceeded, using fallback');
    } else if (error.response?.status === 400) {
      errorReason = 'bad_request';
      console.log('Bad request to Gemini API');
    }

    res.json({
      response: getFallbackResponse(req.body.message),
      timestamp: new Date().toISOString(),
      fallback: true,
      reason: errorReason,
      error: error.message
    });
  }
});

// Fallback responses for common cybersecurity questions
function getFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('phishing')) {
    return `Answer: Phishing is a cyberattack where criminals impersonate legitimate organizations to steal your personal information like passwords, credit card numbers, or social security numbers.

Example: You receive an email that looks like it's from your bank asking you to "verify your account" by clicking a link and entering your login details. The link actually goes to a fake website that steals your information.

Tips:
• Always verify sender authenticity before clicking links
• Check URLs carefully - look for misspellings or suspicious domains
• Never enter sensitive information via email links`;
  }
  
  if (lowerMessage.includes('ransomware')) {
    return `Answer: Ransomware is malicious software that encrypts your files and demands payment (ransom) to decrypt them. It's one of the most dangerous cyber threats today.

Example: Your computer gets infected, all your photos and documents become encrypted, and you see a message demanding $500 in Bitcoin to get your files back.

Tips:
• Keep regular backups of important files offline
• Keep your operating system and software updated
• Never pay the ransom - there's no guarantee you'll get your files back`;
  }
  
  if (lowerMessage.includes('two-factor') || lowerMessage.includes('2fa')) {
    return `Answer: Two-factor authentication (2FA) adds an extra layer of security by requiring two different verification methods to access your accounts.

Example: After entering your password, you also need to enter a code sent to your phone or generated by an authenticator app.

Tips:
• Enable 2FA on all important accounts (email, banking, social media)
• Use authenticator apps instead of SMS when possible
• Keep backup codes in a safe place`;
  }
  
  if (lowerMessage.includes('password')) {
    return `Answer: Strong passwords are your first line of defense against hackers. They should be long, complex, and unique for each account.

Example: Instead of "password123", use something like "MyDog$Loves2Run!" - it's long, has mixed characters, and is memorable to you.

Tips:
• Use at least 12 characters with mixed case, numbers, and symbols
• Use a different password for each important account
• Consider using a password manager to generate and store strong passwords`;
  }
  
  if (lowerMessage.includes('malware') || lowerMessage.includes('virus')) {
    return `Answer: Malware is malicious software designed to damage, disrupt, or gain unauthorized access to your computer or data. This includes viruses, ransomware, spyware, and trojans.

Example: You download what appears to be a free game, but it secretly installs software that steals your files or monitors your keystrokes.

Tips:
• Keep your antivirus software updated and running
• Only download software from trusted sources
• Be cautious with email attachments and USB drives from unknown sources`;
  }
  
  if (lowerMessage.includes('firewall')) {
    return `Answer: A firewall is a security system that monitors and controls network traffic between your computer and the internet, blocking potentially harmful connections.

Example: When a hacker tries to access your computer remotely, a firewall blocks the unauthorized connection attempt, like a security guard at a building entrance.

Tips:
• Enable your computer's built-in firewall
• Keep firewall software updated
• Configure it to block unnecessary incoming connections`;
  }
  
  // Default response
  return `Answer: I'm your cybersecurity assistant! I can help explain security concepts, threats, and best practices to keep you safe online.

Example: Try asking: "What is phishing?", "How to create strong passwords?", "What is ransomware?", or "What is two-factor authentication?"

Tips:
• Ask about specific security threats or protection methods
• I can explain malware, phishing, passwords, firewalls, and more
• Get practical advice for staying safe online`;
}

// Format response to ensure consistent clean formatting
function formatResponse(text) {
  // Remove markdown formatting and clean up
  let cleaned = text
    // Remove ** bold markers
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Clean up bullet points - convert various formats to •
    .replace(/^\s*[-\*]\s+/gm, '• ')
    .replace(/^\s*\*\s+/gm, '• ')
    // Clean up section headers
    .replace(/^\s*-\s*\*\*(Answer|Example|Tips):\*\*/gm, '$1:')
    .replace(/^\s*-\s*(Answer|Example|Tips):/gm, '$1:')
    .replace(/^\s*\*\*(Answer|Example|Tips):\*\*/gm, '$1:')
    // Ensure proper spacing
    .replace(/\n\s*\n/g, '\n\n')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleaned;
}

module.exports = router;