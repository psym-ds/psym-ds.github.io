// Load JSON file and manage questions
let questions = [];
let currentIndex = 0;

// Fetch questions from the JSON file
fetch('questions.json')
  .then(response => response.json())
  .then(data => {
    questions = data;
    populateQuestionList();  // Populate the sidebar with questions
    displayQuestion(0);  // Display the first question and answer
  })
  .catch(error => console.error('Error loading questions:', error));

// Populate the list of questions in the sidebar
function populateQuestionList() {
  const questionList = document.getElementById('question-list');
  questions.forEach((question, index) => {
    // Create a list item with question id and first few characters of the question text
    const listItem = document.createElement('li');
    listItem.textContent = `${question.id}: ${question.question.substring(0, 30)}...`;
    listItem.addEventListener('click', () => displayQuestion(index));
    questionList.appendChild(listItem);
  });
}

// Display a question and its answer
function displayQuestion(index) {
  currentIndex = index;  // Update the current question index
  const questionContainer = document.getElementById('question-container');
  const answerContainer = document.getElementById('answer-container');

  // Clear previous content
  questionContainer.innerHTML = '';
  answerContainer.innerHTML = '';

  // Get the selected question
  const question = questions[currentIndex];

  // Display question ID and text
  const questionElement = document.createElement('div');
  const questionIdElement = document.createElement('p');
  questionIdElement.innerHTML = `<strong>Question ID:</strong> ${question.id}`;
  questionElement.appendChild(questionIdElement);

  const questionTextElement = document.createElement('p');
  questionTextElement.innerHTML = question.question;
  questionElement.appendChild(questionTextElement);

  // If options exist, display them
  if (question.options) {
    const ul = document.createElement('ul');
    for (let key in question.options) {
      const li = document.createElement('li');
      li.textContent = `${key}. ${question.options[key]}`;
      ul.appendChild(li);
    }
    questionElement.appendChild(ul);
  }

  // Append the question to the question container
  questionContainer.appendChild(questionElement);

  // Display the answer in the answer container
  const answerElement = document.createElement('p');
  answerElement.innerHTML = `<strong>Answer:</strong> ${question.answer}`;
  answerContainer.appendChild(answerElement);
}