// Firebase imports and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// Your Firebase configuration (Replace with your own config)
const firebaseConfig = {
  apiKey: "AIzaSyCoXyCWebIypq2FO8QSt5IDdzfFNZsobFo",
  authDomain: "itembank-3b85f.firebaseapp.com",
  databaseURL: "https://itembank-3b85f-default-rtdb.firebaseio.com",
  projectId: "itembank-3b85f",
  storageBucket: "itembank-3b85f.appspot.com",
  messagingSenderId: "137360435017",
  appId: "1:137360435017:web:b6b501ef9b984780635c98",
  measurementId: "G-7G0SRY2JE9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let questions = [];
let learners = [];
let showAnswers = true;
let currentQuestions = []; // Keep track of current displayed questions in push mode
let currentLearners = []; // Keep track of current displayed learners in selection panel
let currentEditingQuestionId = null; // Track the ID of the question being edited
let selectedQuestionIds = []; // Array to keep track of selected question IDs in push mode
let selectedLearnerIds = []; // Array to keep track of selected learner IDs
let previousSelectedLearnerIds = []; // To restore on restore action
let previousSelectedLearnerIdInput = ''; // To restore the input box content on restore

// Fetch data from Firebase Realtime Database
const dataRef = ref(database, '/'); // Assuming all data is stored at root

onValue(dataRef, (snapshot) => {
  const data = snapshot.val();

  if (data) {
    // Fetch questions
    if (data.question && Array.isArray(data.question)) {
      questions = data.question;
      populateQuestionList(questions, 'push-mode'); // Populate the sidebar with questions for push mode
      populateQuestionList(questions, 'manage-mode'); // Populate the sidebar with questions for manage mode
      displayQuestions(questions, 'push-mode');
      displayQuestions(questions, 'manage-mode');
    } else {
      console.error('No questions found or data is not in the expected format');
    }

    // Fetch learners
    if (data.learner && Array.isArray(data.learner)) {
      learners = data.learner;
      // Initialize the learner selection panel with all learners
      currentLearners = [...learners];
      populateLearnerList(currentLearners);
    } else {
      console.error('No learners found or data is not in the expected format');
    }
  } else {
    console.error('No data found or data is not in the expected format');
  }
}, (error) => {
  console.error('Error fetching data from Firebase:', error);
});

// Populate the list of questions in the sidebar for both push and manage modes, sorting by ID
function populateQuestionList(questions, mode) {
  const questionList = document.getElementById(mode === 'push-mode' ? 'question-list' : 'manage-question-list');
  questionList.innerHTML = ''; // Clear previous list

  // Sort questions by ID before displaying
  questions.sort((a, b) => a.id - b.id).forEach((question) => {
    const listItem = document.createElement('li');
    listItem.textContent = `${question.id}: ${question.question}`;
    listItem.addEventListener('click', () => {
      displayQuestions([question], mode);
      // Reset selection methods
      if (mode === 'push-mode') {
        resetSelectionMethods();
      } else {
        resetManageSelectionMethods();
      }
    });
    questionList.appendChild(listItem);
  });
}

// Display questions in the specified container (either push-mode or manage-mode)
function displayQuestions(questionsToDisplay, containerId) {
  const questionContainer = document.querySelector(`#${containerId} #question-container`);
  questionContainer.innerHTML = ''; // Clear previous content

  if (containerId === 'push-mode') {
    currentQuestions = [...questionsToDisplay]; // Update currentQuestions for push mode
  }

  questionsToDisplay.forEach((question) => {
    const questionCard = document.createElement('div');
    questionCard.classList.add('question-card');

    if (containerId === 'manage-mode') {
      // Add edit and delete buttons for manage mode
      const editButton = document.createElement('i');
      editButton.classList.add('fa-solid', 'fa-pen-to-square', 'edit-button');
      editButton.addEventListener('click', () => openModifyPanel(question));
      questionCard.appendChild(editButton);

      const deleteButton = document.createElement('i');
      deleteButton.classList.add('fa-solid', 'fa-trash-can', 'delete-button');
      deleteButton.addEventListener('click', () => confirmDelete(question.id));
      questionCard.appendChild(deleteButton);
    }

    if (containerId === 'push-mode') {
      // Add checkbox for selection in push mode
      const selectCheckbox = document.createElement('i');
      selectCheckbox.classList.add('select-checkbox');
      selectCheckbox.classList.add('fa-regular'); // Regular style
      // Set checkbox status based on selection
      if (selectedQuestionIds.includes(question.id)) {
        selectCheckbox.classList.add('fa-square-check'); // Checked
      } else {
        selectCheckbox.classList.add('fa-square'); // Unchecked
      }
      selectCheckbox.addEventListener('click', () => toggleSelection(question.id));
      questionCard.appendChild(selectCheckbox);
    }

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

    // Display the answer in manage mode and selection panel
    if (containerId === 'manage-mode' || containerId === 'push-mode') {
      const answerElement = document.createElement('p');
      answerElement.innerHTML = `<strong>Answer:</strong> ${question.answer}`;
      questionCard.appendChild(answerElement);
    }

    questionContainer.appendChild(questionCard);
  });

  // Update the selection statuses if in push mode
  if (containerId === 'push-mode') {
    updateSelectionCheckboxes();
  }
}

// Function to toggle selection of a question
function toggleSelection(questionId) {
  if (selectedQuestionIds.includes(questionId)) {
    // Remove from selected
    selectedQuestionIds = selectedQuestionIds.filter(id => id !== questionId);
  } else {
    // Add to selected
    selectedQuestionIds.push(questionId);
  }

  // Update the ID list input
  document.getElementById('selected-id-list').value = selectedQuestionIds.join(', ');

  // Update the selection checkboxes
  updateSelectionCheckboxes();

  // Update the preview panel
  updatePreviewPanel();
}

// Function to update the selection checkboxes based on selectedQuestionIds
function updateSelectionCheckboxes() {
  const checkboxes = document.querySelectorAll('#push-mode .select-checkbox');

  checkboxes.forEach(checkbox => {
    const questionId = parseInt(checkbox.parentElement.querySelector('p strong').nextSibling.textContent.trim());
    if (selectedQuestionIds.includes(questionId)) {
      checkbox.classList.remove('fa-square');
      checkbox.classList.add('fa-square-check');
    } else {
      checkbox.classList.remove('fa-square-check');
      checkbox.classList.add('fa-square');
    }
  });
}

// Function to update the preview panel based on selectedQuestionIds
function updatePreviewPanel() {
  const previewContainer = document.querySelector('#push-mode #preview-container');
  previewContainer.innerHTML = ''; // Clear previous content

  // Get the selected questions in the order of selectedQuestionIds
  const selectedQuestions = selectedQuestionIds.map(id => questions.find(q => q.id === id)).filter(q => q !== undefined);

  selectedQuestions.forEach((question) => {
    const questionCard = document.createElement('div');
    questionCard.classList.add('question-card');

    // Display the ID if showAnswers is true
    if (showAnswers) {
      const questionIdElement = document.createElement('p');
      questionIdElement.innerHTML = `<strong>Question ID:</strong> ${question.id}`;
      questionCard.appendChild(questionIdElement);
    }

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

    // Display the answer if showAnswers is true
    if (showAnswers) {
      const answerElement = document.createElement('p');
      answerElement.innerHTML = `<strong>Answer:</strong> ${question.answer}`;
      questionCard.appendChild(answerElement);
    }

    previewContainer.appendChild(questionCard);
  });
}

// Handle Add/Modify Panel toggle and make it draggable
document.getElementById('toggle-modify-panel').addEventListener('click', () => {
  openModifyPanel(); // Open panel for adding a new question
});

// Function to open modify panel with prefilled data for editing, or blank for adding
function openModifyPanel(question = null) {
  const addPanel = document.getElementById('modify-panel');
  addPanel.style.display = 'block'; // Display the modify panel

  if (question) {
    // Prefill data for editing
    document.getElementById('new-question-id').value = question.id;
    document.getElementById('new-question-text').value = question.question;
    document.getElementById('new-question-answer').value = question.answer;

    // Fill options, including blank ones, by iterating over all possible option keys
    resetAdditionalOptions(); // Reset the options first
    if (question.options) {
      // Find the highest option number to account for missing or blank options
      const maxOptionKey = Math.max(...Object.keys(question.options).map(Number));

      for (let i = 1; i <= maxOptionKey; i++) {
        if (i === 1) {
          // Fill first option
          document.querySelector('.option-input').value = question.options[i] || '';
        } else {
          // Add other options, including blank ones
          addOptionInput();
          document.querySelectorAll('.option-input')[i - 1].value = question.options[i] || ''; // Maintain index
        }
      }
    }

    currentEditingQuestionId = question.id; // Store the ID of the question being edited
  } else {
    // Clear inputs for adding a new question
    document.getElementById('new-question-id').value = '';
    document.getElementById('new-question-text').value = '';
    document.getElementById('new-question-answer').value = '';
    resetAdditionalOptions();
    currentEditingQuestionId = null; // No question being edited
  }

  makeMovable(addPanel); // Make the panel movable
}

// Close the Add Panel when the red cross is clicked
document.getElementById('close-modify-panel').addEventListener('click', () => {
  const addPanel = document.getElementById('modify-panel');
  addPanel.style.display = 'none'; // Hide the pop-up box
});

// Confirm delete function
function confirmDelete(questionId) {
  showNotification('Are you sure you want to delete this question?', 'Delete', 'Cancel', () => {
    removeQuestion(Number(questionId)); // Ensure ID is treated as a number
  });
}

// Remove question from Firebase
function removeQuestion(questionId) {
  const questionIndex = questions.findIndex(q => q.id === questionId);
  if (questionIndex > -1) {
    questions.splice(questionIndex, 1);

    // Only update the 'question' part of the database
    set(ref(database, '/question'), questions) // Notice the path is now '/question'
      .then(() => {
        console.log('Question removed successfully');
        // After removing, refresh the question lists and displays
        populateQuestionList(questions, 'push-mode');
        populateQuestionList(questions, 'manage-mode');
        displayQuestions(questions, 'push-mode');
        displayQuestions(questions, 'manage-mode');
      })
      .catch((error) => console.error('Error updating Firebase:', error));
  }
}

// Handle Save Question functionality (both Add and Modify)
document.getElementById('save-question-button').addEventListener('click', () => {
  const newId = Number(document.getElementById('new-question-id').value.trim()); // Ensure ID is a number
  const newText = document.getElementById('new-question-text').value.trim();
  const newAnswer = document.getElementById('new-question-answer').value.trim();

  // Check if any required fields are empty
  if (!newId || !newText || !newAnswer) {
    showNotification('Please fill in all the required fields.', 'OK');
    return;
  }

  const existingQuestion = questions.find(question => Number(question.id) === newId); // Check if the new ID already exists

  if (currentEditingQuestionId !== null) {
    // Editing an existing question

    if (existingQuestion && newId !== currentEditingQuestionId) {
      // A question with this ID already exists and the ID is changing
      // Prompt user to confirm replacement
      showNotification(
        'A question with this ID already exists. Do you want to replace it?',
        'Replace',
        'Cancel',
        () => {
          // Remove both the current editing question and the conflicting existing one
          removeQuestion(currentEditingQuestionId); // Remove the original question being edited
          removeQuestion(newId); // Remove the existing question with the conflicting ID
          addNewQuestion(newId, newText, newAnswer); // Create the new question with input details

          // Close the modify panel after editing
          closeModifyPanel();
        }
      );
    } else {
      // No ID conflict, just delete the original and create a new one
      removeQuestion(currentEditingQuestionId); // Remove the original question
      addNewQuestion(newId, newText, newAnswer); // Create the new question with input details

      // Close the modify panel after editing
      closeModifyPanel();
    }

    return;
  }

  // If adding a new question (not editing), check for ID conflict
  if (existingQuestion) {
    // Ask the user to confirm replacement
    showNotification(
      'A question with this ID already exists. Do you want to replace it?',
      'Replace',
      'Cancel',
      () => {
        removeQuestion(newId); // Delete the existing question with the conflicting ID
        addNewQuestion(newId, newText, newAnswer); // Add the new question
      }
    );
    return;
  }

  // If no conflict, just add the new question
  addNewQuestion(newId, newText, newAnswer);

  // Leave the panel open for add action (no closing here)
});

// Helper function to close the modify panel
function closeModifyPanel() {
  const addPanel = document.getElementById('modify-panel');
  addPanel.style.display = 'none';
}

// Add new question to Firebase
function addNewQuestion(newId, newText, newAnswer) {
  const newQuestion = {
    id: newId,
    question: newText,
    options: {},
    answer: newAnswer
  };

  // Get options from the inputs
  document.querySelectorAll('.option-input').forEach((input, index) => {
    if (input.value.trim()) {
      newQuestion.options[index + 1] = input.value.trim();
    }
  });

  // Add the new question
  questions.push(newQuestion);

  // Update only the 'question' section in Firebase
  set(ref(database, '/question'), questions) // Only updating the '/question' path
    .then(() => {
      console.log('Question added successfully');
      // After adding, refresh the question lists and displays
      populateQuestionList(questions, 'push-mode');
      populateQuestionList(questions, 'manage-mode');
      displayQuestions(questions, 'push-mode');
      displayQuestions(questions, 'manage-mode');
    })
    .catch((error) => console.error('Error updating Firebase:', error));

  // Clear input fields after adding
  document.getElementById('new-question-id').value = '';
  document.getElementById('new-question-text').value = '';
  document.getElementById('new-question-answer').value = '';
  resetAdditionalOptions();
}

// Function to reset additional options and clear the first option input
function resetAdditionalOptions() {
  const optionContainer = document.getElementById('new-options-container');
  optionContainer.innerHTML = ''; // Clear all options first

  // Add the first option with its delete button
  const firstOptionWrapper = document.createElement('div');
  firstOptionWrapper.classList.add('option-wrapper');

  const firstOptionInput = document.createElement('input');
  firstOptionInput.type = 'text';
  firstOptionInput.classList.add('modern-input', 'option-input');
  firstOptionInput.placeholder = 'Enter option 1';
  firstOptionWrapper.appendChild(firstOptionInput);

  const firstDeleteButton = document.createElement('button');
  firstDeleteButton.classList.add('modern-button', 'delete-option-button', 'red-button');
  firstDeleteButton.innerHTML = '<i class="fa-solid fa-trash-can"></i>'; // FontAwesome trash icon
  firstDeleteButton.addEventListener('click', () => {
    firstOptionWrapper.remove();
    renumberOptions();
  });
  firstOptionWrapper.appendChild(firstDeleteButton);

  optionContainer.appendChild(firstOptionWrapper);

  // Add button for adding more options, aligned directly below delete button
  const addButtonWrapper = document.createElement('div');
  addButtonWrapper.classList.add('add-button-wrapper');

  const addButton = document.createElement('button');
  addButton.id = 'add-option-button';
  addButton.classList.add('modern-button', 'add-option-button');
  addButton.innerHTML = '<i class="fa-solid fa-plus"></i>'; // FontAwesome plus icon
  addButton.addEventListener('click', addOptionInput); // Reuse the addOptionInput function
  addButtonWrapper.appendChild(addButton);

  optionContainer.appendChild(addButtonWrapper);
}

// Function to add option input box with delete button
function addOptionInput() {
  const optionContainer = document.getElementById('new-options-container');
  const addButtonWrapper = document.querySelector('.add-button-wrapper');

  // Create a new option input
  const optionWrapper = document.createElement('div');
  optionWrapper.classList.add('option-wrapper');

  const newOptionInput = document.createElement('input');
  newOptionInput.type = 'text';
  newOptionInput.classList.add('modern-input', 'option-input');
  newOptionInput.placeholder = `Enter option ${optionContainer.querySelectorAll('.option-input').length + 1}`;
  optionWrapper.appendChild(newOptionInput);

  // Add delete button for the new option input
  const deleteButton = document.createElement('button');
  deleteButton.classList.add('modern-button', 'delete-option-button', 'red-button');
  deleteButton.innerHTML = '<i class="fa-solid fa-trash-can"></i>'; // FontAwesome trash icon
  deleteButton.addEventListener('click', () => {
    optionWrapper.remove(); // Remove the option
    renumberOptions(); // Renumber remaining options
  });
  optionWrapper.appendChild(deleteButton);

  // Insert the new option before the add button
  optionContainer.insertBefore(optionWrapper, addButtonWrapper);
}

// Function to renumber options after deletion
function renumberOptions() {
  const optionInputs = document.querySelectorAll('.option-input');
  optionInputs.forEach((input, index) => {
    input.placeholder = `Enter option ${index + 1}`; // Renumber the placeholders
  });
}

// Custom notification box for errors, warnings, and confirmation
function showNotification(message, confirmText, cancelText = null, confirmCallback = null) {
  const notificationBox = document.createElement('div');
  notificationBox.classList.add('confirm-box');
  notificationBox.innerHTML = `
    <p>${message}</p>
    <div class="button-container">
      <button class="confirm-button ${confirmText.toLowerCase() === 'delete' || confirmText.toLowerCase() === 'replace' || confirmText.toLowerCase() === 'overwrite' ? 'red-button' : 'grey-button'}">${confirmText}</button>
      ${cancelText ? `<button class="confirm-button grey-button">${cancelText}</button>` : ''}
    </div>
  `;
  document.body.appendChild(notificationBox);

  // Handle confirm action
  notificationBox.querySelector('.confirm-button').addEventListener('click', () => {
    document.body.removeChild(notificationBox);
    if (confirmCallback) {
      confirmCallback();
    }
  });

  // Handle cancel action if provided
  if (cancelText) {
    notificationBox.querySelector('.grey-button').addEventListener('click', () => {
      document.body.removeChild(notificationBox);
    });
  }
}

// Handle mutual exclusivity of selection methods in push mode
const searchBarPush = document.getElementById('search-bar');
const idListPush = document.getElementById('id-list-view');
const randomQuestionButtonPush = document.getElementById('random-question-button');
const questionCountPush = document.getElementById('question-count');

// By default, search bar is active, others are inactive
idListPush.classList.add('inactive-input');
questionCountPush.classList.add('inactive-input');
randomQuestionButtonPush.classList.add('inactive-button');

// Function to reset selection methods in push mode
function resetSelectionMethods() {
  // Activate all methods
  searchBarPush.classList.add('inactive-input');
  idListPush.classList.add('inactive-input');
  questionCountPush.classList.add('inactive-input');
  randomQuestionButtonPush.classList.add('inactive-button');
}

// When search bar is focused, make it active and others inactive
searchBarPush.addEventListener('click', () => {
  console.log("clicked");
  searchBarPush.classList.remove('inactive-input');
  idListPush.classList.add('inactive-input');
  questionCountPush.classList.add('inactive-input');
  randomQuestionButtonPush.classList.add('inactive-button');
  updatePushModeQuestions(); // Update immediately
});

// When ID list is focused, make it active and others inactive
idListPush.addEventListener('focus', () => {
  idListPush.classList.remove('inactive-input');
  searchBarPush.classList.add('inactive-input');
  questionCountPush.classList.add('inactive-input');
  randomQuestionButtonPush.classList.add('inactive-button');
  updatePushModeQuestions(); // Update immediately
});

// When question count is focused, make it active and others inactive
questionCountPush.addEventListener('focus', () => {
  questionCountPush.classList.remove('inactive-input');
  randomQuestionButtonPush.classList.remove('inactive-button');
  searchBarPush.classList.add('inactive-input');
  idListPush.classList.add('inactive-input');
});

// Handle search bar input in push mode
searchBarPush.addEventListener('input', updatePushModeQuestions);

// Handle ID list input in push mode
idListPush.addEventListener('input', updatePushModeQuestions);

// Function to update questions in push mode based on search and ID input
function updatePushModeQuestions() {
  let filteredQuestions = questions;

  if (!searchBarPush.classList.contains('inactive-input')) {
    const query = searchBarPush.value.toLowerCase();
    if (query) {
      filteredQuestions = questions.filter(question => {
        const questionMatches = question.question.toLowerCase().includes(query);
        let optionMatches = false;
        if (question.options) {
          optionMatches = Object.values(question.options).some(option =>
            option.toLowerCase().includes(query)
          );
        }
        return questionMatches || optionMatches || question.id.toString().includes(query);
      });
    }
  } else if (!idListPush.classList.contains('inactive-input')) {
    const idListInput = idListPush.value.trim();
    if (idListInput) {
      const idList = idListInput.split(',').map(id => Number(id.trim()));
      filteredQuestions = idList
        .map(id => questions.find(q => Number(q.id) === id))
        .filter(q => q !== undefined);
    }
  }

  displayQuestions(filteredQuestions, 'push-mode');
}

// Handle mutual exclusivity of selection methods in manage mode
const searchBarManage = document.getElementById('manage-search-bar');
const idListManage = document.getElementById('id-list-manage');
const randomQuestionButtonManage = document.getElementById('manage-random-question-button');
const questionCountManage = document.getElementById('manage-question-count');

// By default, search bar is active, others are inactive
idListManage.classList.add('inactive-input');
questionCountManage.classList.add('inactive-input');
randomQuestionButtonManage.classList.add('inactive-button');

// Function to reset selection methods in manage mode
function resetManageSelectionMethods() {
  // Deactivate all methods
  searchBarManage.classList.add('inactive-input');
  idListManage.classList.add('inactive-input');
  questionCountManage.classList.add('inactive-input');
  randomQuestionButtonManage.classList.add('inactive-button');
}

// When search bar is focused, make it active and others inactive
searchBarManage.addEventListener('focus', () => {
  searchBarManage.classList.remove('inactive-input');
  idListManage.classList.add('inactive-input');
  questionCountManage.classList.add('inactive-input');
  randomQuestionButtonManage.classList.add('inactive-button');
  updateManageModeQuestions(); // Update immediately
});

// When ID list is focused, make it active and others inactive
idListManage.addEventListener('focus', () => {
  idListManage.classList.remove('inactive-input');
  searchBarManage.classList.add('inactive-input');
  questionCountManage.classList.add('inactive-input');
  randomQuestionButtonManage.classList.add('inactive-button');
  updateManageModeQuestions(); // Update immediately
});

// When question count is focused, make it active and others inactive
questionCountManage.addEventListener('focus', () => {
  questionCountManage.classList.remove('inactive-input');
  randomQuestionButtonManage.classList.remove('inactive-button');
  searchBarManage.classList.add('inactive-input');
  idListManage.classList.add('inactive-input');
});

// Handle search bar input in manage mode
searchBarManage.addEventListener('input', updateManageModeQuestions);

// Handle ID list input in manage mode
idListManage.addEventListener('input', updateManageModeQuestions);

// Function to update questions in manage mode based on search and ID input
function updateManageModeQuestions() {
  let filteredQuestions = questions;

  if (!searchBarManage.classList.contains('inactive-input')) {
    const query = searchBarManage.value.toLowerCase();
    if (query) {
      filteredQuestions = questions.filter(question => {
        const questionMatches = question.question.toLowerCase().includes(query);
        let optionMatches = false;
        if (question.options) {
          optionMatches = Object.values(question.options).some(option =>
            option.toLowerCase().includes(query)
          );
        }
        return questionMatches || optionMatches || question.id.toString().includes(query);
      });
    }
  } else if (!idListManage.classList.contains('inactive-input')) {
    const idListInput = idListManage.value.trim();
    if (idListInput) {
      const idList = idListInput.split(',').map(id => Number(id.trim()));
      filteredQuestions = idList
        .map(id => questions.find(q => Number(q.id) === id))
        .filter(q => q !== undefined);
    }
  }

  displayQuestions(filteredQuestions, 'manage-mode');
}

// Handle picking random questions in Push mode
document.getElementById('random-question-button').addEventListener('click', () => {
  const questionCount = parseInt(document.getElementById('question-count').value, 10) || 1;
  const randomQuestions = getRandomQuestions(questions, questionCount);
  displayQuestions(randomQuestions, 'push-mode');
  // Deactivate other methods
  searchBarPush.classList.add('inactive-input');
  idListPush.classList.add('inactive-input');
  questionCountPush.classList.remove('inactive-input');
});

// Handle picking random questions in Manage mode
document.getElementById('manage-random-question-button').addEventListener('click', () => {
  const questionCount = parseInt(document.getElementById('manage-question-count').value, 10) || 1;
  const randomQuestions = getRandomQuestions(questions, questionCount);
  displayQuestions(randomQuestions, 'manage-mode');
  // Deactivate other methods
  searchBarManage.classList.add('inactive-input');
  idListManage.classList.add('inactive-input');
});

// Function to select a random set of questions
function getRandomQuestions(questionArray, num) {
  const shuffled = [...questionArray].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
}

// Toggle showing/hiding answers in Preview panel only
document.getElementById('toggle-answers').addEventListener('change', () => {
  showAnswers = document.getElementById('toggle-answers').checked;

  // Update the preview panel only
  updatePreviewPanel();
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

    // For push mode, display all questions initially
    if (mode === 'push') {
      displayQuestions(questions, 'push-mode');
    } else {
      displayQuestions(questions, 'manage-mode');
    }
  });
});

// Add functionality to make the add panel draggable
function makeMovable(element) {
  let isDragging = false;
  let offsetX, offsetY;

  element.addEventListener('mousedown', (e) => {
    if (e.target !== element) return; // Only move when clicking on the panel background
    isDragging = true;
    offsetX = e.clientX - element.offsetLeft;
    offsetY = e.clientY - element.offsetTop;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  function onMouseMove(e) {
    if (isDragging) {
      element.style.left = `${e.clientX - offsetX}px`;
      element.style.top = `${e.clientY - offsetY}px`;
    }
  }

  function onMouseUp() {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }
}

// Add event listener for the Export button
document.getElementById('export-button').addEventListener('click', () => {
  exportQuestionsAsJSON();
});

// Function to export questions as a JSON file in the specified format
function exportQuestionsAsJSON() {
  // Wrap the questions array inside an object with a "question" key
  const formattedData = {
    question: questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options || {},
      answer: q.answer
    }))
  };

  // Create a blob with the formatted data as a JSON string
  const jsonData = JSON.stringify(formattedData, null, 2); // Convert the formatted data to JSON
  const blob = new Blob([jsonData], { type: 'application/json' });

  // Create a temporary download link element
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = 'questions.json'; // File name for the exported file

  // Trigger the download by clicking the link programmatically
  document.body.appendChild(downloadLink);
  downloadLink.click();

  // Clean up the URL and remove the temporary link element
  URL.revokeObjectURL(url);
  document.body.removeChild(downloadLink);
}

// Show the import panel when the import button is clicked
document.getElementById('import-button').addEventListener('click', () => {
  document.getElementById('import-panel').style.display = 'block';
});

// Close the import panel when the close button is clicked
document.getElementById('close-import-panel').addEventListener('click', () => {
  document.getElementById('import-panel').style.display = 'none';
});

// Handle file upload via click or drag/drop
document.getElementById('file-drop-area').addEventListener('click', () => {
  // Create a hidden input element of type 'file' for the click functionality
  const tempFileInput = document.createElement('input');
  tempFileInput.type = 'file';
  tempFileInput.accept = '.json'; // Accept only JSON files
  tempFileInput.style.display = 'none'; // Hide it from the view

  // Append it to the body so it can be triggered
  document.body.appendChild(tempFileInput);

  // Trigger the file browser
  tempFileInput.click();

  // Handle the file selection
  tempFileInput.addEventListener('change', (event) => {
    handleFileUpload({ target: event.target });
    document.body.removeChild(tempFileInput); // Clean up the temporary input element
  });
});

// Handle file upload via drag/drop
document.getElementById('file-drop-area').addEventListener('drop', (event) => {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  handleFileUpload({ target: { files: [file] } }); // Trigger upload function
});

// Ensure proper dragging over the drop area
document.getElementById('file-drop-area').addEventListener('dragover', (event) => {
  event.preventDefault();
});

// Function to handle file upload
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result); // Parse JSON file
        if (jsonData && jsonData.question && Array.isArray(jsonData.question)) {
          // Process JSON data and check for conflicts
          checkForConflicts(jsonData.question);
        } else {
          showNotification('Invalid JSON format. Please provide a valid question set.', 'OK');
        }
      } catch (error) {
        showNotification('Failed to parse JSON. Please check the file format.', 'OK');
      }
    };
    reader.readAsText(file);
  }
}

// Check if there are any existing questions with the same ID
function checkForConflicts(newQuestions) {
  const conflictingQuestions = newQuestions.filter(newQ => questions.some(existing => existing.id === newQ.id));

  if (conflictingQuestions.length > 0) {
    showOverwriteNotification(conflictingQuestions, newQuestions);
  } else {
    addQuestions(newQuestions); // Proceed if no conflicts
  }
}

// Function to show overwrite notification for conflicting questions
function showOverwriteNotification(conflictingQuestions, newQuestions) {
  const conflictIds = conflictingQuestions.map(q => q.id).join(', ');
  showNotification(
    `Some questions with IDs (${conflictIds}) already exist. Do you want to overwrite them?`,
    'Overwrite',
    'Cancel',
    () => {
      overwriteQuestions(conflictingQuestions, newQuestions); // Proceed with overwrite
    }
  );
}

// Overwrite the conflicting questions
function overwriteQuestions(conflictingQuestions, newQuestions) {
  // Remove the conflicting questions and add the new ones
  conflictingQuestions.forEach(conflict => removeQuestion(conflict.id));
  addQuestions(newQuestions);
}

// Add new questions to Firebase and update the local list
function addQuestions(newQuestions) {
  newQuestions.forEach(newQ => {
    const formattedQuestion = {
      id: newQ.id,
      question: newQ.question,
      options: newQ.options || {}, // Ensure options exist
      answer: newQ.answer
    };
    questions.push(formattedQuestion); // Add to local array
  });

  // Update only the 'question' section in Firebase
  set(ref(database, '/question'), questions)
    .then(() => {
      console.log('Questions imported successfully');
      populateQuestionList(questions, 'push-mode'); // Update the push-mode list
      populateQuestionList(questions, 'manage-mode'); // Update the manage-mode list
      displayQuestions(questions, 'push-mode'); // Display questions in push mode
      displayQuestions(questions, 'manage-mode'); // Display questions in manage mode
    })
    .catch((error) => console.error('Error updating Firebase:', error));

  // Close the import panel after success
  document.getElementById('import-panel').style.display = 'none';
}

// Handle Select All and Unselect All buttons in push mode
document.getElementById('select-all-button').addEventListener('click', () => {
  // Add all currently displayed questions to selectedQuestionIds
  currentQuestions.forEach(question => {
    if (!selectedQuestionIds.includes(question.id)) {
      selectedQuestionIds.push(question.id);
    }
  });
  // Update the ID list input
  document.getElementById('selected-id-list').value = selectedQuestionIds.join(', ');
  // Update checkboxes and preview panel
  updateSelectionCheckboxes();
  updatePreviewPanel();
});

document.getElementById('unselect-all-button').addEventListener('click', () => {
  // Remove all currently displayed questions from selectedQuestionIds
  currentQuestions.forEach(question => {
    selectedQuestionIds = selectedQuestionIds.filter(id => id !== question.id);
  });
  // Update the ID list input
  document.getElementById('selected-id-list').value = selectedQuestionIds.join(', ');
  // Update checkboxes and preview panel
  updateSelectionCheckboxes();
  updatePreviewPanel();
});

// Handle changes in the selected ID list input
document.getElementById('selected-id-list').addEventListener('input', () => {
  const idListInput = document.getElementById('selected-id-list').value.trim();
  if (idListInput) {
    const idList = idListInput.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id));
    selectedQuestionIds = idList;
  } else {
    selectedQuestionIds = [];
  }
  // Update checkboxes and preview panel
  updateSelectionCheckboxes();
  updatePreviewPanel();
});

/* -------------------------------------- */
/* Learner Selection Functionality Starts */
/* -------------------------------------- */

// Open the learner selection panel when the circle button is clicked
document.getElementById('learner-selection-button').addEventListener('click', () => {
  const learnerPanel = document.getElementById('learner-selection-panel');
  learnerPanel.style.display = 'flex';
  previousSelectedLearnerIds = [...selectedLearnerIds]; // Store previous selection in case of restore
  previousSelectedLearnerIdInput = document.getElementById('selected-learner-id-list').value; // Store previous input box content

  // Initialize inputs and displays
  resetLearnerSelectionMethods();
  updateLearnerDisplay();
  updateSelectedLearnerDisplay();
});

// Remove close button functionality since it's no longer present

// Handle learner selection methods (ID+Name group or Group input)
const learnerIdInput = document.getElementById('learner-id-input');
const learnerNameInput = document.getElementById('learner-name-input');
const learnerGroupInput = document.getElementById('learner-group-input');

// Rows for ID+Name and Group
const idNameRow = document.getElementById('id-name-row');
const groupRow = document.getElementById('group-row');

// By default, ID+Name group is active
groupRow.classList.add('inactive-row');
learnerGroupInput.classList.add('inactive-input');

// Function to reset learner selection methods
function resetLearnerSelectionMethods() {
  idNameRow.classList.remove('inactive-row');
  groupRow.classList.add('inactive-row');
  learnerGroupInput.classList.add('inactive-input');

  learnerIdInput.value = '';
  learnerNameInput.value = '';
  learnerGroupInput.value = '';
}

// When ID+Name row is clicked, activate it and deactivate Group row
idNameRow.addEventListener('click', () => {
  if (idNameRow.classList.contains('inactive-row')) {
    idNameRow.classList.remove('inactive-row');
    learnerIdInput.classList.remove('inactive-input');
    learnerNameInput.classList.remove('inactive-input');

    groupRow.classList.add('inactive-row');
    learnerGroupInput.classList.add('inactive-input');

    updateLearnerDisplay();
  }
});

// When Group row is clicked, activate it and deactivate ID+Name row
groupRow.addEventListener('click', () => {
  if (groupRow.classList.contains('inactive-row')) {
    groupRow.classList.remove('inactive-row');
    learnerGroupInput.classList.remove('inactive-input');

    idNameRow.classList.add('inactive-row');
    learnerIdInput.classList.add('inactive-input');
    learnerNameInput.classList.add('inactive-input');

    updateLearnerDisplay();
  }
});

// Handle input events
learnerIdInput.addEventListener('input', updateLearnerDisplay);
learnerNameInput.addEventListener('input', updateLearnerDisplay);
learnerGroupInput.addEventListener('input', updateLearnerDisplay);

// Synchronize ID and Name inputs
learnerIdInput.addEventListener('input', () => {
  const idValue = learnerIdInput.value.trim();
  if (idValue) {
    const learner = learners.find(l => l.id.toString() === idValue);
    if (learner) {
      learnerNameInput.value = learner.username;
    } else {
      learnerNameInput.value = '';
    }
  } else {
    learnerNameInput.value = '';
  }
  updateLearnerDisplay();
});

learnerNameInput.addEventListener('input', () => {
  const nameValue = learnerNameInput.value.trim().toLowerCase();
  if (nameValue) {
    const learner = learners.find(l => l.username.toLowerCase() === nameValue);
    if (learner) {
      learnerIdInput.value = learner.id;
    } else {
      learnerIdInput.value = '';
    }
  } else {
    learnerIdInput.value = '';
  }
  updateLearnerDisplay();
});

// Function to update learner display based on inputs
function updateLearnerDisplay() {
  let filteredLearners = learners;

  if (!groupRow.classList.contains('inactive-row')) {
    // Group row is active
    const groupValue = learnerGroupInput.value.trim().toLowerCase();
    if (groupValue) {
      filteredLearners = learners.filter(learner => learner.group.toLowerCase().includes(groupValue));
    }
  } else {
    // ID+Name row is active
    const idValue = learnerIdInput.value.trim();
    const nameValue = learnerNameInput.value.trim().toLowerCase();

    if (idValue || nameValue) {
      filteredLearners = learners.filter(learner => {
        const idMatches = idValue ? learner.id.toString() === idValue : true;
        const nameMatches = nameValue ? learner.username.toLowerCase().includes(nameValue) : true;
        return idMatches && nameMatches;
      });
    }
  }

  currentLearners = filteredLearners;
  populateLearnerList(currentLearners);
}

// Function to populate learner list in the selection panel
function populateLearnerList(learnerArray) {
  const learnerList = document.getElementById('learner-list');
  learnerList.innerHTML = '';

  learnerArray.forEach(learner => {
    const card = document.createElement('div');
    card.classList.add('learner-card');

    const idNameElement = document.createElement('p');
    idNameElement.textContent = `ID: ${learner.id}, Name: ${learner.username}`;
    card.appendChild(idNameElement);

    const groupElement = document.createElement('p');
    groupElement.textContent = `Group: ${learner.group}`;
    card.appendChild(groupElement);

    // Checkbox
    const selectCheckbox = document.createElement('i');
    selectCheckbox.classList.add('select-checkbox');
    selectCheckbox.classList.add('fa-regular'); // Regular style
    // Set checkbox status based on selection
    if (selectedLearnerIds.includes(learner.id)) {
      selectCheckbox.classList.add('fa-square-check'); // Checked
    } else {
      selectCheckbox.classList.add('fa-square'); // Unchecked
    }
    selectCheckbox.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent card click event
      toggleLearnerSelection(learner.id);
    });
    card.appendChild(selectCheckbox);

    // Handle card click to toggle selection
    card.addEventListener('click', () => {
      toggleLearnerSelection(learner.id);
    });

    learnerList.appendChild(card);
  });
}

// Function to toggle selection of a learner
function toggleLearnerSelection(learnerId) {
  if (selectedLearnerIds.includes(learnerId)) {
    // Remove from selected
    selectedLearnerIds = selectedLearnerIds.filter(id => id !== learnerId);
  } else {
    // Add to selected
    selectedLearnerIds.push(learnerId);
  }

  // Update the ID list input
  document.getElementById('selected-learner-id-list').value = selectedLearnerIds.join(', ');

  // Update the learner list checkboxes
  updateLearnerSelectionCheckboxes();

  // Update the selected learner display
  updateSelectedLearnerDisplay();
}

// Function to update learner selection checkboxes
function updateLearnerSelectionCheckboxes() {
  const checkboxes = document.querySelectorAll('#learner-list .select-checkbox');

  checkboxes.forEach(checkbox => {
    const idNameText = checkbox.parentElement.querySelector('p').textContent;
    const learnerId = parseInt(idNameText.match(/ID: (\d+)/)[1]);
    if (selectedLearnerIds.includes(learnerId)) {
      checkbox.classList.remove('fa-square');
      checkbox.classList.add('fa-square-check');
    } else {
      checkbox.classList.remove('fa-square-check');
      checkbox.classList.add('fa-square');
    }
  });
}

// Function to update selected learner display
function updateSelectedLearnerDisplay() {
  const selectedLearnerList = document.getElementById('selected-learner-list');
  selectedLearnerList.innerHTML = '';

  const selectedLearners = selectedLearnerIds.map(id => learners.find(l => l.id === id)).filter(l => l !== undefined);

  selectedLearners.forEach(learner => {
    const card = document.createElement('div');
    card.classList.add('learner-card');

    const idNameElement = document.createElement('p');
    idNameElement.textContent = `ID: ${learner.id}, Name: ${learner.username}`;
    card.appendChild(idNameElement);

    const groupElement = document.createElement('p');
    groupElement.textContent = `Group: ${learner.group}`;
    card.appendChild(groupElement);

    selectedLearnerList.appendChild(card);
  });
}

// Handle Select All and Unselect All buttons in learner selection panel
document.getElementById('learner-select-all-button').addEventListener('click', () => {
  // Add all currently displayed learners to selectedLearnerIds
  currentLearners.forEach(learner => {
    if (!selectedLearnerIds.includes(learner.id)) {
      selectedLearnerIds.push(learner.id);
    }
  });
  // Update the ID list input
  document.getElementById('selected-learner-id-list').value = selectedLearnerIds.join(', ');
  // Update checkboxes and selected learner display
  updateLearnerSelectionCheckboxes();
  updateSelectedLearnerDisplay();
});

document.getElementById('learner-unselect-all-button').addEventListener('click', () => {
  // Remove all currently displayed learners from selectedLearnerIds
  currentLearners.forEach(learner => {
    selectedLearnerIds = selectedLearnerIds.filter(id => id !== learner.id);
  });
  // Update the ID list input
  document.getElementById('selected-learner-id-list').value = selectedLearnerIds.join(', ');
  // Update checkboxes and selected learner display
  updateLearnerSelectionCheckboxes();
  updateSelectedLearnerDisplay();
});

// Handle changes in the selected learner ID list input
document.getElementById('selected-learner-id-list').addEventListener('input', () => {
  const idListInput = document.getElementById('selected-learner-id-list').value.trim();
  if (idListInput) {
    const idList = idListInput.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id));
    selectedLearnerIds = idList;
  } else {
    selectedLearnerIds = [];
  }
  // Update checkboxes and selected learner display
  updateLearnerSelectionCheckboxes();
  updateSelectedLearnerDisplay();
});

// Handle Save and Restore buttons
document.getElementById('learner-save-button').addEventListener('click', () => {
  // Close the panel and save the selection
  const learnerPanel = document.getElementById('learner-selection-panel');
  learnerPanel.style.display = 'none';
});

document.getElementById('learner-restore-button').addEventListener('click', () => {
  // Restore previous selection and input box content, but keep the panel open
  selectedLearnerIds = [...previousSelectedLearnerIds];
  document.getElementById('selected-learner-id-list').value = previousSelectedLearnerIdInput;

  // Update checkboxes and displays
  updateLearnerSelectionCheckboxes();
  updateSelectedLearnerDisplay();
});

/* ------------------------------------ */
/* Learner Selection Functionality Ends */
/* ------------------------------------ */