// Load JSON file and manage questions
let questions = [];
let currentIndex = 0;

// Fetch questions from the JSON file
fetch('questions.json')
  .then(response => response.json())
  .then(data => {
    questions = data;
    console.log(questions); // Debugging: log the questions array to verify
    displayQuestion();  // Display the first question and answer
  })
  .catch(error => console.error('Error loading questions:', error));

// Display a question and its answer
function displayQuestion() {
  const questionContainer = document.getElementById('question-container');

  // Clear previous content
  questionContainer.innerHTML = '';

  // Check if there are more questions
  if (currentIndex < questions.length) {
    const question = questions[currentIndex];

    // Debugging: log the current question object to verify
    console.log("Displaying question:", question);

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

    // Display the answer directly below the question
    const answerElement = document.createElement('p');
    answerElement.innerHTML = `<strong>Answer:</strong> ${question.answer}`;
    
    // Debugging: check if the answer is populated
    console.log("Answer:", question.answer);

    questionElement.appendChild(answerElement);

    // Append the question and answer to the container
    questionContainer.appendChild(questionElement);
  } else {
    questionContainer.innerHTML = '<p>No more questions available.</p>';
  }
}

// Handle "Next Question" button click
document.getElementById('next-question').addEventListener('click', () => {
  currentIndex++;
  displayQuestion();
});