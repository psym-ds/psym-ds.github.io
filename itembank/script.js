// Load JSON file and manage questions
let questions = [];
let currentIndex = 0;

// Fetch questions from the JSON file
fetch('questions.json')
  .then(response => response.json())
  .then(data => {
    questions = data;
    displayQuestion();  // Display the first question and answer
  })
  .catch(error => console.error('Error loading questions:', error));

// Display a question and its answer
function displayQuestion() {
  const questionContainer = document.getElementById('question-container');
  const answerContainer = document.getElementById('answer-container');

  // Clear previous content
  questionContainer.innerHTML = '';
  answerContainer.innerHTML = '';

  // Check if there are more questions
  if (currentIndex < questions.length) {
    const question = questions[currentIndex];

    // Create the question element
    const questionElement = document.createElement('div');

    // Display question ID above the question
    const questionIdElement = document.createElement('p');
    questionIdElement.innerHTML = `<strong>Question ID:</strong> ${question.id}`;
    questionElement.appendChild(questionIdElement);

    // Display the question
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

  } else {
    questionContainer.innerHTML = '<p>No more questions available.</p>';
    answerContainer.innerHTML = '';
  }
}

// Handle "Next Question" button click
document.getElementById('next-question').addEventListener('click', () => {
  currentIndex++;
  displayQuestion();
});