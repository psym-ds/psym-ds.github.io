let questions = [];
let showAnswers = true;
let currentQuestions = []; // Keep track of current displayed questions in test mode

// Fetch questions from the JSON file
fetch('questions.json')
  .then(response => response.json())
  .then(data => {
    questions = data;
    populateQuestionList(questions); // Populate the sidebar with questions for view mode
    displayQuestions(questions, 'view-mode'); // Display all questions initially in view mode
  })
  .catch(error => console.error('Error loading questions:', error));

// Populate the list of questions in the sidebar (first tab)
function populateQuestionList(questions) {
  const questionList = document.getElementById('question-list');
  questionList.innerHTML = ''; // Clear previous list

  questions.forEach((question) => {
    const listItem = document.createElement('li');
    listItem.textContent = `${question.id}: ${question.question.substring(0, 30)}...`;
    listItem.addEventListener('click', () => displayQuestions([question], 'view-mode'));
    questionList.appendChild(listItem);
  });
}

// Display a question and its answer in the specified container (either view-mode or test-mode)
function displayQuestions(questions, containerId) {
  const questionContainer = document.querySelector(`#${containerId} #question-container`);
  questionContainer.innerHTML = ''; // Clear previous content

  if (containerId === 'test-mode') {
    currentQuestions = questions; // Track currently displayed questions in test mode
    const displayedIds = questions.map(q => q.id).join(', ');
    document.getElementById('displayed-ids').textContent = displayedIds || 'None';
  }

  questions.forEach((question) => {
    const questionCard = document.createElement('div');
    questionCard.classList.add('question-card');

    const questionIdElement = document.createElement('p');
    questionIdElement.innerHTML = `<strong>Question ID:</strong> ${question.id}`;
    questionCard.appendChild(questionIdElement);

    const questionTextElement = document.createElement('p');
    questionTextElement.innerHTML = question.question;
    questionCard.appendChild(questionTextElement);

    // If options exist, display them
    if (question.options) {
      const ul = document.createElement('ul');
      for (let key in question.options) {
        const li = document.createElement('li');
        li.textContent = `${key}. ${question.options[key]}`;
        ul.appendChild(li);
      }
      questionCard.appendChild(ul);
    }

    // Display the answer if allowed
    if (showAnswers) {
      const answerElement = document.createElement('p');
      answerElement.innerHTML = `<strong>Answer:</strong> ${question.answer}`;
      questionCard.appendChild(answerElement);
    }

    questionContainer.appendChild(questionCard);
  });
}

// Handle search bar input in view mode
document.getElementById('search-bar').addEventListener('input', (event) => {
  const query = event.target.value.toLowerCase();

  const filteredQuestions = questions.filter(question => {
    const questionMatches = question.question.toLowerCase().includes(query);
    let optionMatches = false;
    if (question.options) {
      optionMatches = Object.values(question.options).some(option =>
        option.toLowerCase().includes(query)
      );
    }
    return questionMatches || optionMatches || question.id.toString().includes(query);
  });

  displayQuestions(filteredQuestions, 'view-mode');
});

// Handle mode change in Test Mode
document.getElementById('mode-select').addEventListener('change', () => {
  const mode = document.getElementById('mode-select').value;

  if (mode === 'random') {
    document.getElementById('fixed-id-list').style.display = 'none';
    document.getElementById('question-count').style.display = 'inline';
    document.getElementById('random-question-button').style.display = 'inline';
  } else if (mode === 'fixed') {
    document.getElementById('fixed-id-list').style.display = 'inline';
    document.getElementById('question-count').style.display = 'none';
    document.getElementById('random-question-button').style.display = 'none';
  } else if (mode === 'custom') {
    document.getElementById('fixed-id-list').style.display = 'none';
    document.getElementById('question-count').style.display = 'none';
    document.getElementById('random-question-button').style.display = 'none';
  }
});

// Handle fixed ID input for Fixed mode and display in specified order
document.getElementById('fixed-id-list').addEventListener('input', () => {
  const idList = document.getElementById('fixed-id-list').value.split(',').map(id => id.trim());
  const orderedQuestions = idList
    .map(id => questions.find(q => q.id.toString() === id))
    .filter(q => q !== undefined); // Filter out invalid IDs
  displayQuestions(orderedQuestions, 'test-mode');
});

// Handle picking random questions in Random mode
document.getElementById('random-question-button').addEventListener('click', () => {
  const questionCount = parseInt(document.getElementById('question-count').value, 10) || 1;
  const randomQuestions = getRandomQuestions(questions, questionCount);
  displayQuestions(randomQuestions, 'test-mode');
});

// Function to select a random set of questions
function getRandomQuestions(questionArray, num) {
  const shuffled = [...questionArray].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
}

// Toggle showing/hiding answers without regenerating questions
document.getElementById('toggle-answers-button').addEventListener('click', () => {
  showAnswers = !showAnswers;
  const buttonText = showAnswers ? 'Hide Answers' : 'Show Answers';
  document.getElementById('toggle-answers-button').textContent = buttonText;

  // Redisplay the current set of questions without regenerating them
  displayQuestions(currentQuestions, 'test-mode');
});

// Tab switching functionality
document.querySelectorAll('.tab-link').forEach(button => {
  button.addEventListener('click', () => {
    // Remove active class from all tabs
    document.querySelectorAll('.tab-link').forEach(btn => btn.classList.remove('active'));

    // Add active class to clicked tab
    button.classList.add('active');

    // Hide all containers
    document.querySelectorAll('.container').forEach(container => {
      container.style.display = 'none';
    });

    // Show the selected container based on the data-mode attribute
    const mode = button.getAttribute('data-mode');
    document.getElementById(`${mode}-mode`).style.display = 'flex';

    // For test mode, start with no questions displayed
    if (mode === 'test') {
      displayQuestions([], 'test-mode');
    }
  });
});