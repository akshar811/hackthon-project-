// Test script for URL Checker functionality
const axios = require('axios');

const testUrls = [
  { url: 'https://google.com', expected: 'safe' },
  { url: 'https://malware-test.com', expected: 'malicious' },
  { url: 'https://phishing-test.com', expected: 'phishing' },
  { url: 'https://suspicious-site.com', expected: 'suspicious' }
];

async function testUrlChecker() {
  console.log('Testing URL Checker API...\n');
  
  for (const test of testUrls) {
    try {
      console.log(`Testing: ${test.url}`);
      
      const response = await axios.post('http://localhost:5000/api/scan/url', {
        url: test.url
      });
      
      const result = response.data;
      console.log(`✅ Result: ${result.results.riskLevel} (Expected: ${test.expected})`);
      console.log(`   Score: ${result.results.score}%`);
      console.log(`   Target: ${result.target}\n`);
      
    } catch (error) {
      console.log(`❌ Error testing ${test.url}:`, error.message);
    }
  }
}

// Run test if server is running
testUrlChecker().catch(console.error);