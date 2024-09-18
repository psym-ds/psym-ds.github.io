let questions = [];

// Fetch questions from the JSON file
fetch('questions.json')
  .then(response => response.json())
  .then(data => {
    questions = data;
    populateQuestionList(questions);  // Populate the sidebar with questions
    displayQuestions(questions);  // Display all questions initially
  })
  .catch(error => console.error('Error loading questions:', error));

// Populate the list of questions in the sidebar
function populateQuestionList(questions) {
  const questionList = document.getElementById('question-list');
  questionList.innerHTML = '';  // Clear previous list

  questions.forEach((question, index) => {
    const listItem = document.createElement('li');
    listItem.textContent = `${question.id}: ${question.question.substring(0, 30)}...`;
    listItem.addEventListener('click', () => displayQuestions([question]));  // Show clicked question
    questionList.appendChild(listItem);
  });
}

// Display a question and its answer in card format
function displayQuestions(questions) {
  const questionContainer = document.getElementById('question-container');
  questionContainer.innerHTML = '';  // Clear previous content

  questions.forEach((question) => {
    // Create a card for each question
    const questionCard = document.createElement('div');
    questionCard.classList.add('question-card');

    // Display question ID and text
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

    // Display the answer
    const answerElement = document.createElement('p');
    answerElement.innerHTML = `<strong>Answer:</strong> ${question.answer}`;
    questionCard.appendChild(answerElement);

    // Append the card to the question container
    questionContainer.appendChild(questionCard);
  });
}

// Handle search bar input for real-time filtering
document.getElementById('search-bar').addEventListener('input', (event) => {
  const query = event.target.value.toLowerCase();
  const filteredQuestions = questions.filter(question =>
    question.question.toLowerCase().includes(query) || question.id.toString().includes(query)
  );
  populateQuestionList(filteredQuestions);  // Update the sidebar with filtered questions
  displayQuestions(filteredQuestions);  // Show the filtered questions
});