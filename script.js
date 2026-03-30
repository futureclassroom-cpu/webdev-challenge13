// ======================================
// API KEY (NOTE: sebaiknya di backend)
// ======================================
const GEMINI_API_KEY = "AIzaSyA_E0Fa4ypm8hmalEEu46QEK7LJcyMMkJw";

// ======================================
// SAMPLE TOPICS
// ======================================
const TOPICS = {
  study: "I usually study late at night, often past midnight. I struggle to stay focused and feel exhausted the next morning.",
  sleep: "I only sleep 5–6 hours on weekdays. I scroll my phone for at least an hour before bed every night.",
  screen: "I spend 8 hours on a computer for work, then another 3–4 hours at night on my phone watching videos and browsing.",
  exercise: "I barely exercise — maybe once or twice a month. I sit at my desk all day and take the elevator instead of the stairs."
};

// ======================================
// RATE LIMIT
// ======================================
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 5000;

// ======================================
// FILL TOPIC
// ======================================
function fillTopic(clickedButton, topicKey) {
  const inputField = document.getElementById('habitInput');
  inputField.value = TOPICS[topicKey];
  onType(inputField);

  document.querySelectorAll('.chip').forEach(btn => btn.classList.remove('active'));
  clickedButton.classList.add('active');
}

// ======================================
// ON TYPE
// ======================================
function onType(inputElement) {
  const hint = document.getElementById('charHint');
  const clearBtn = document.getElementById('clearBtn');

  const len = inputElement.value.trim().length;

  hint.textContent = len === 0 ? 'Start typing…' : len + ' characters';
  hint.classList.toggle('active', len > 0);
  clearBtn.style.display = len > 0 ? 'inline' : 'none';
}

// ======================================
// CLEAR INPUT
// ======================================
function clearInput() {
  const input = document.getElementById('habitInput');
  input.value = '';
  onType(input);

  document.querySelectorAll('.chip').forEach(btn => btn.classList.remove('active'));
  input.focus();
}

// ======================================
// MAIN FUNCTION
// ======================================
function generateReflection() {

  const userText = document.getElementById('habitInput').value.trim();

  if (!userText) {
    shakeForm();
    return;
  }

  const now = Date.now();
  if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
    alert("Please wait a few seconds...");
    return;
  }

  lastRequestTime = now;

  setBtnLoading(true);
  showLoading();

  sendToGemini(userText);
}

// ======================================
// 🔥 GEMINI API (FULL FIX)
// ======================================
function sendToGemini(userText) {

  const message = `
Return ONLY JSON. No explanation.

Format:
{
  "question": "string",
  "suggestion": "string"
}

User:
${userText}
`;

  fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }]
      })
    }
  )
  .then(async res => {
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  })
  .then(data => {

    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error("No response from AI");

    console.log("RAW:", text);

    // ======================================
    // CLEAN RESPONSE (ANTI ERROR)
    // ======================================
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const match = text.match(/\{[\s\S]*\}/);

    if (!match) throw new Error("Invalid JSON format");

    let result;

    try {
      result = JSON.parse(match[0]);
    } catch {
      result = {
        question: "What habit would you like to improve first?",
        suggestion: "Start with small changes step by step."
      };
    }

    if (!result.question || !result.suggestion) {
      throw new Error("Incomplete AI response");
    }

    showResult(result.question, result.suggestion);

  })
  .catch(err => {
    console.error(err);
    showError("Error: " + err.message);
  })
  .finally(() => setBtnLoading(false));
}

// ======================================
// BUTTON LOADING
// ======================================
function setBtnLoading(isLoading) {
  const btn = document.getElementById('generateBtn');

  btn.disabled = isLoading;
  btn.innerHTML = isLoading
    ? "Thinking..."
    : "Generate Reflection";
}

// ======================================
// LOADING UI
// ======================================
function showLoading() {
  const area = document.getElementById('result-area');
  area.style.display = 'block';
  area.innerHTML = "<p>Thinking...</p>";
}

// ======================================
// RESULT
// ======================================
function showResult(q, s) {
  const area = document.getElementById('result-area');

  area.innerHTML = `
    <h3>Reflection Question</h3>
    <p>${q}</p>

    <h3>Suggestion</h3>
    <p>${s}</p>

    <button onclick="resetAll()">Try Again</button>
  `;
}

// ======================================
// ERROR
// ======================================
function showError(msg) {
  const area = document.getElementById('result-area');
  area.innerHTML = `<p style="color:red">${msg}</p>`;
}

// ======================================
// RESET
// ======================================
function resetAll() {
  clearInput();
  document.getElementById('result-area').style.display = 'none';
}

// ======================================
// SHAKE
// ======================================
function shakeForm() {
  const form = document.querySelector('.form-surface');
  form.style.transform = 'translateX(5px)';
  setTimeout(() => form.style.transform = 'none', 200);
}
