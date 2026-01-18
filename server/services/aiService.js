const axios = require('axios');

// Configuration
const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

/**
 * Query Ollama LLM with a prompt
 * @param {string} prompt - The prompt to send
 * @param {Object} options - Optional parameters (model, temperature, etc.)
 * @returns {Promise<string|null>} Response text or null if unavailable
 */
async function queryOllama(prompt, options = {}) {
  try {
    const response = await axios.post(
      `${OLLAMA_BASE}/api/generate`,
      {
        model: options.model || DEFAULT_MODEL,
        prompt,
        temperature: options.temperature || 0.1,
        stream: false,
        ...options
      },
      {
        timeout: options.timeout || 30000
      }
    );

    return response.data.response || null;
  } catch (error) {
    console.error('Ollama query failed:', error.message);
    return null;
  }
}

/**
 * Check if Ollama service is available
 * @returns {Promise<boolean>} True if available
 */
async function isOllamaAvailable() {
  try {
    const response = await axios.get(`${OLLAMA_BASE}/api/tags`, {
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    console.error('Ollama not available:', error.message);
    return false;
  }
}

/**
 * Use AI to map CSV columns to athlete fields
 * @param {string[]} headers - CSV column headers
 * @param {string[]} sampleRow - Sample data row
 * @returns {Promise<Object|null>} Mapping object or null
 */
async function parseCSVColumns(headers, sampleRow) {
  const prompt = `You are a data mapping assistant for a rowing team management system.

Given these CSV columns and a sample row, map them to the following fields:
- name (athlete's full name)
- weight (in kg or lbs)
- side (port/starboard/both/sculler)
- experience (novice/varsity/elite or years)
- gender (male/female/other)
- erg_score (2k erg time in format MM:SS.S or seconds)

CSV Headers: ${headers.join(', ')}
Sample Row: ${sampleRow.join(', ')}

Return ONLY a JSON object mapping CSV column names to field names. Use null for unmapped fields.
Example: {"Full Name": "name", "Weight (kg)": "weight", "Side Pref": "side"}

Do not include any explanation, only the JSON object.`;

  const response = await queryOllama(prompt, { temperature: 0.1 });

  if (!response) {
    return null;
  }

  try {
    // Extract JSON from response (handle cases where LLM adds explanation)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in AI response');
      return null;
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse AI column mapping:', error.message);
    return null;
  }
}

/**
 * Fuzzy match an input name to a list of athletes
 * @param {string} inputName - Name to match
 * @param {Array<Object>} athleteList - Array of athlete objects with id and name
 * @returns {Promise<number|null>} Matched athlete ID or null
 */
async function matchAthleteName(inputName, athleteList) {
  if (!inputName || !athleteList || athleteList.length === 0) {
    return null;
  }

  const athleteNames = athleteList.map(a => `${a.id}: ${a.name}`).join('\n');

  const prompt = `You are a name matching assistant for a rowing team management system.

Match this input name to one of the athletes in the list:
Input Name: "${inputName}"

Athletes:
${athleteNames}

Return ONLY the athlete ID number that best matches the input name. Consider:
- Partial matches (e.g., "John Smith" matches "Smith, John")
- Nicknames (e.g., "Mike" matches "Michael")
- Misspellings and typos
- Different name orders

If no good match exists (confidence < 70%), return "null".
Return ONLY the ID number or the word "null", nothing else.`;

  const response = await queryOllama(prompt, { temperature: 0.1 });

  if (!response) {
    return null;
  }

  const trimmed = response.trim();
  if (trimmed === 'null' || trimmed === '') {
    return null;
  }

  const athleteId = parseInt(trimmed, 10);
  if (isNaN(athleteId) || !athleteList.find(a => a.id === athleteId)) {
    return null;
  }

  return athleteId;
}

/**
 * Get AI-powered lineup suggestion
 * @param {Array<Object>} athletes - Available athletes with stats
 * @param {string} boatClass - Boat class (e.g., "8+", "4-")
 * @param {Object} constraints - Optional constraints (gender, weight class, etc.)
 * @returns {Promise<Object|null>} Suggested lineup or null
 */
async function suggestLineup(athletes, boatClass, constraints = {}) {
  if (!athletes || athletes.length === 0) {
    return null;
  }

  const athleteInfo = athletes.map(a =>
    `ID ${a.id}: ${a.name} - ${a.side || 'any'} side, ` +
    `${a.weight ? a.weight + 'kg' : 'unknown weight'}, ` +
    `${a.erg_score || 'no erg'}, ` +
    `${a.experience || 'unknown exp'}`
  ).join('\n');

  const constraintText = Object.entries(constraints)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  const prompt = `You are a rowing lineup optimizer.

Create an optimal lineup for a ${boatClass} boat with these athletes:
${athleteInfo}

${constraintText ? `Constraints: ${constraintText}` : 'No constraints.'}

Consider:
- Port/starboard balance for sweep boats
- Weight distribution (heavier in middle seats)
- Experience level (experienced in stroke/bow)
- Erg scores (faster in middle seats)
- Proper rigging for boat class

Return a JSON object with this structure:
{
  "lineup": [
    {"seat": 1, "athleteId": 5, "side": "port"},
    {"seat": 2, "athleteId": 3, "side": "starboard"},
    ...
  ],
  "coxswain": 12,
  "reasoning": "Brief explanation of key decisions"
}

For sculling boats, omit "side". For coxless boats, omit "coxswain".
Return ONLY the JSON object, no other text.`;

  const response = await queryOllama(prompt, { temperature: 0.3 });

  if (!response) {
    return null;
  }

  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in AI response');
      return null;
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse AI lineup suggestion:', error.message);
    return null;
  }
}

module.exports = {
  queryOllama,
  isOllamaAvailable,
  parseCSVColumns,
  matchAthleteName,
  suggestLineup
};
