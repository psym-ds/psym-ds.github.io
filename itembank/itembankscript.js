// Load JSON file and manage questions
let questions = [];
let currentIndex = 0;

// Fetch questions from the JSON file
fetch('questions.json')
  .then(response => response.json())
  .then(data => {
    questions = data;
    displayQuestion();
  })
  .catch(error => console.error('Error loading questions:', error));

// Display a question
function displayQuestion() {
  const questionContainer = document.getElementById('question-container');
  const answerContainer = document.getElementById('answer-container');
  const answerText = document.getElementById('answer');

  // Clear previous content
  questionContainer.innerHTML = '';
  answerContainer.style.display = 'none';

  // Check if there are more questions
  if (currentIndex < questions.length) {
    const question = questions[currentIndex];

    // Create the question element
    const questionElement = document.createElement('div');
    questionElement.innerHTML = `<p>${question.question}</p>`;

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

    // Append the question to the container
    questionContainer.appendChild(questionElement);

    // Set answer
    answerText.textContent = question.answer;
  } else {
    questionContainer.innerHTML = '<p>No more questions available.</p>';
  }
}

// Handle "Next Question" button click
document.getElementById('next-question').addEventListener('click', () => {
  currentIndex++;
  displayQuestion();
  document.getElementById('answer-container').style.display = 'block';
});
