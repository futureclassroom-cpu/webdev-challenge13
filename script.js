// ======================================
// API KEY FOR GOOGLE GEMINI
// Get your own from: https://aistudio.google.com/app/apikey
// ======================================
const GEMINI_API_KEY = "";

// ======================================
// SAMPLE TOPICS
// ======================================
const TOPICS = {
  study:    "I usually study late at night, often past midnight. I struggle to stay focused and feel exhausted the next morning.",
  sleep:    "I only sleep 5–6 hours on weekdays. I scroll my phone for at least an hour before bed every night.",
  screen:   "I spend 8 hours on a computer for work, then another 3–4 hours at night on my phone watching videos and browsing.",
  exercise: "I barely exercise — maybe once or twice a month. I sit at my desk all day and take the elevator instead of the stairs."
};

// Rate limiting variables
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 5000; // Wait 5 seconds between requests


// ======================================
// FILL TOPIC - When user clicks a sample topic button
// ======================================
function fillTopic(clickedButton, topicKey) {
  // Get the text input field
  const inputField = document.getElementById('habitInput');
  
  // Put the sample text into the input
  inputField.value = TOPICS[topicKey];
  
  // Update the character counter
  onType(inputField);
  
  // Remove active style from all topic buttons
  const allButtons = document.querySelectorAll('.chip');
  for (let i = 0; i < allButtons.length; i = i + 1) {
    allButtons[i].classList.remove('active');
  }
  
  // Add active style to the clicked button
  clickedButton.classList.add('active');
}


// ======================================
// ON TYPE - Update character counter when typing
// ======================================
function onType(inputElement) {
  // Get the hint text element
  const hintElement = document.getElementById('charHint');
  
  // Get the clear button
  const clearButton = document.getElementById('clearBtn');
  
  // Count the characters typed
  const textLength = inputElement.value.trim().length;
  
  // Update the hint text
  if (textLength === 0) {
    hintElement.textContent = 'Start typing…';
  } else {
    hintElement.textContent = inputElement.value.length + ' characters';
  }
  
  // Show/hide the hint
  if (textLength > 0) {
    hintElement.classList.add('active');
  } else {
    hintElement.classList.remove('active');
  }
  
  // Show/hide the clear button
  if (textLength > 0) {
    clearButton.style.display = 'inline';
  } else {
    clearButton.style.display = 'none';
  }
}


// ======================================
// CLEAR INPUT - Empty the text field
// ======================================
function clearInput() {
  // Get the input field
  const inputField = document.getElementById('habitInput');
  
  // Clear the text
  inputField.value = '';
  
  // Update the counter
  onType(inputField);
  
  // Remove active style from all topic buttons
  const allButtons = document.querySelectorAll('.chip');
  for (let i = 0; i < allButtons.length; i = i + 1) {
    allButtons[i].classList.remove('active');
  }
  
  // Focus on the input field
  inputField.focus();
}



// ======================================
// GENERATE REFLECTION - Main function
// ======================================
function generateReflection() {
  // Get the text from input
  const userText = document.getElementById('habitInput').value.trim();
  
  // Check if input is empty
  if (userText === '') {
    shakeForm();
    return;
  }
  
  // Check if we should wait before making another request
  const currentTime = Date.now();
  const timePassed = currentTime - lastRequestTime;
  
  if (timePassed < MIN_REQUEST_INTERVAL) {
    const waitSeconds = Math.ceil((MIN_REQUEST_INTERVAL - timePassed) / 1000);
    alert('Please wait ' + waitSeconds + ' seconds before trying again.');
    return;
  }
  
  // Save the time of this request
  lastRequestTime = currentTime;
  
  // Show loading state
  setBtnLoading(true);
  showLoading();
  
  // Create the message to send to Gemini
  const message = 'You are a helpful lifestyle coach. The user says: ' + userText + 
                  ' Give one reflection question and one improvement suggestion in simple JSON format.';
  
  // Send request to Gemini API
  sendToGemini(message);
}


// ======================================
// SEND TO GEMINI - Make API request
// ======================================
function sendToGemini(message) {
  // Prepare the request data
  const requestData = {
    contents: [
      {
        parts: [
          {
            text: message
          }
        ]
      }
    ]
  };
  
  // Make the API request
  fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    }
  )
  .then(function(response) {
    // Check if response is OK
    if (response.ok) {
      return response.json();
    } else {
      throw new Error('API returned status ' + response.status);
    }
  })
  .then(function(data) {
    // Get the text response from Gemini
    const textResponse = data.candidates[0].content.parts[0].text;
    
    // Try to parse the JSON
    const result = JSON.parse(textResponse);
    
    // Show the results
    showResult(result.question, result.suggestion);
  })
  .catch(function(error) {
    // Show error message
    showError('Error: ' + error.message);
  })
  .finally(function() {
    // Reset button
    setBtnLoading(false);
  });
}




// ======================================
// SET BUTTON LOADING - Show/hide loading state on button
// ======================================
function setBtnLoading(isLoading) {
  const button = document.getElementById('generateBtn');
  
  if (isLoading) {
    button.disabled = true;
    button.innerHTML = '<span>Thinking…</span>';
  } else {
    button.disabled = false;
    button.innerHTML = '<i class="bi bi-stars me-2"></i>Generate Reflection';
  }
}


// ======================================
// SHOW LOADING - Display loading animation
// ======================================
function showLoading() {
  const resultArea = document.getElementById('result-area');
  
  resultArea.style.display = 'block';
  resultArea.innerHTML = '<div class="loading-state"><div class="loader-track"><div class="loader-fill"></div></div><p>Gemini is reflecting on your lifestyle…</p></div>';
  
  // Scroll to show the loading message
  resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}


// ======================================
// SHOW RESULT - Display the AI response
// ======================================
function showResult(question, suggestion) {
  const resultArea = document.getElementById('result-area');
  
  // Create the HTML to show
  const html = '<div class="result-header"><div class="result-header-line"></div><span class="result-header-label">Your reflection</span><div class="result-header-line"></div></div>' +
               '<div class="result-row"><div class="rr-type q"><span class="rr-icon"><i class="bi bi-question-lg"></i></span>Reflection Question</div><p class="rr-text">' + question + '</p></div>' +
               '<div class="result-row"><div class="rr-type s"><span class="rr-icon"><i class="bi bi-lightbulb-fill"></i></span>Suggestion for Improvement</div><p class="rr-text">' + suggestion + '</p></div>' +
               '<div class="try-again-row"><button class="btn-try-again" onclick="resetAll()"><i class="bi bi-arrow-counterclockwise"></i> Try another habit</button></div>';
  
  resultArea.style.display = 'block';
  resultArea.innerHTML = html;
  
  // Scroll to show the result
  resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}


// ======================================
// SHOW ERROR - Display error message
// ======================================
function showError(errorMessage) {
  const resultArea = document.getElementById('result-area');
  
  const html = '<div class="error-state"><i class="bi bi-exclamation-triangle-fill"></i><span>' + errorMessage + '</span></div>';
  
  resultArea.style.display = 'block';
  resultArea.innerHTML = html;
}


// ======================================
// RESET ALL - Clear everything and start fresh
// ======================================
function resetAll() {
  // Clear input field
  clearInput();
  
  // Hide results
  const resultArea = document.getElementById('result-area');
  resultArea.style.display = 'none';
  resultArea.innerHTML = '';
  
  // Scroll back to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


// ======================================
// SHAKE FORM - Animated shake when input is empty
// ======================================
function shakeForm() {
  // Get the form element
  const form = document.querySelector('.form-surface');
  
  // Reset animation
  form.style.animation = 'none';
  form.style.transform = 'translateX(0)';
  
  // Variables for shake animation
  let shakeCount = 0;
  let shakeDirection = 1;
  
  // Create shake effect
  const shakeInterval = setInterval(function() {
    form.style.transform = 'translateX(' + (shakeDirection * 5) + 'px)';
    shakeDirection = shakeDirection * -1;
    shakeCount = shakeCount + 1;
    
    // Stop after 8 shakes
    if (shakeCount > 7) {
      clearInterval(shakeInterval);
      form.style.transform = 'none';
    }
  }, 55);
  
  // Get the input field
  const inputField = document.getElementById('habitInput');
  
  // Turn the border red
  inputField.style.borderBottomColor = '#ff6464';
  
  // Turn it back to normal after 1.2 seconds
  setTimeout(function() {
    inputField.style.borderBottomColor = '';
  }, 1200);
  
  // Focus on the input
  inputField.focus();
}
