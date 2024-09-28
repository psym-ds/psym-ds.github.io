// Firebase imports and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// Your Firebase configuration
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
let showAnswers = true;
let currentQuestions = []; // Keep track of current displayed questions in test mode
let currentEditingQuestionId = null; // Track the ID of the question being edited

// Fetch questions from Firebase Realtime Database
const dataRef = ref(database, '/'); // Assuming all data is stored at root

onValue(dataRef, (snapshot) => {
  const data = snapshot.val();

  if (data && data.question && Array.isArray(data.question)) {
    questions = data.question; // Fetch only the 'question' type data
    populateQuestionList(questions, 'view-mode'); // Populate the sidebar with questions for view mode
    populateQuestionList(questions, 'manage-mode'); // Populate the sidebar with questions for manage mode
    displayQuestions(questions, 'view-mode'); // Display all questions initially in view mode
    displayQuestions(questions, 'manage-mode'); // Display all questions initially in manage mode
  } else {
    console.error('No questions found or data is not in the expected format');
  }
}, (error) => {
  console.error('Error fetching questions from Firebase:', error);
});

// Populate the list of questions in the sidebar for both view and manage modes, sorting by ID
function populateQuestionList(questions, mode) {
  const questionList = document.getElementById(mode === 'view-mode' ? 'question-list' : 'manage-question-list');
  questionList.innerHTML = ''; // Clear previous list

  // Sort questions by ID before displaying
  questions.sort((a, b) => a.id - b.id).forEach((question) => {
    const listItem = document.createElement('li');
    listItem.textContent = `${question.id}: ${question.question.substring(0, 30)}...`;
    listItem.addEventListener('click', () => displayQuestions([question], mode));
    questionList.appendChild(listItem);
  });
}

// Display a question and its answer in the specified container (either view-mode or manage-mode)
function displayQuestions(questions, containerId) {
  const questionContainer = document.querySelector(`#${containerId} #question-container`);
  questionContainer.innerHTML = ''; // Clear previous content

  if (containerId === 'test-mode') {
    currentQuestions = [...questions]; // Update currentQuestions for test mode to store the current displayed questions

    // Update the "Displayed Question IDs" field with the IDs of the currently displayed questions
    const displayedIds = questions.length > 0 ? questions.map(q => q.id).join(', ') : 'None';
    document.getElementById('displayed-ids').textContent = displayedIds;
  }

  questions.forEach((question) => {
    const questionCard = document.createElement('div');
    questionCard.classList.add('question-card');

    if (containerId === 'manage-mode') {
      // Add edit button for each question in manage mode
      const editButton = document.createElement('i');
      editButton.classList.add('fa-solid', 'fa-pen-to-square', 'edit-button');
      editButton.addEventListener('click', () => openModifyPanel(question));
      questionCard.appendChild(editButton);

      // Add remove (delete) button with FontAwesome icon for each question in manage mode
      const deleteButton = document.createElement('i');
      deleteButton.classList.add('fa-solid', 'fa-trash-can', 'delete-button'); // Using FontAwesome xmark icon
      deleteButton.addEventListener('click', () => confirmDelete(question.id));
      questionCard.appendChild(deleteButton);
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

    // Display the answer if allowed
    if (showAnswers) {
      const answerElement = document.createElement('p');
      answerElement.innerHTML = `<strong>Answer:</strong> ${question.answer}`;
      questionCard.appendChild(answerElement);
    }

    questionContainer.appendChild(questionCard);
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

    // Fill options
    resetAdditionalOptions(); // Reset the options first
    if (question.options) {
      Object.keys(question.options).forEach((key, index) => {
        if (index === 0) {
          // Fill first option
          document.querySelector('.option-input').value = question.options[key];
        } else {
          // Add other options
          addOptionInput();
          document.querySelectorAll('.option-input')[index].value = question.options[key];
        }
      });
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
    removeQuestion(Number(questionId));  // Ensure ID is treated as a number
  });
}

// Remove question from Firebase
function removeQuestion(questionId) {
  const questionIndex = questions.findIndex(q => q.id === questionId);
  if (questionIndex > -1) {
    questions.splice(questionIndex, 1);
    
    // Only update the 'question' part of the database
    set(ref(database, '/question'), questions) // Notice the path is now '/question'
      .then(() => console.log('Question removed successfully'))
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

  const existingQuestion = questions.find(question => Number(question.id) === newId);  // Check if the new ID already exists

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
    .then(() => console.log('Question added successfully'))
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

// Handle adding new options
document.getElementById('add-option-button').addEventListener('click', () => {
  addOptionInput(); // Add an empty option input box
});

// Custom notification box for errors, warnings, and confirmation
function showNotification(message, confirmText, cancelText = null, confirmCallback = null) {
  const notificationBox = document.createElement('div');
  notificationBox.classList.add('confirm-box');
  notificationBox.innerHTML = `
    <p>${message}</p>
    <div class="button-container">
      <button class="confirm-button ${confirmText.toLowerCase() === 'delete' || confirmText.toLowerCase() === 'replace' ? 'red-button' : 'grey-button'}">${confirmText}</button>
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

// Handle search bar input in manage mode
document.getElementById('manage-search-bar').addEventListener('input', (event) => {
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

  displayQuestions(filteredQuestions, 'manage-mode');
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
  const idList = document.getElementById('fixed-id-list').value.split(',').map(id => Number(id.trim())); // Ensure IDs are treated as numbers
  const orderedQuestions = idList
    .map(id => questions.find(q => Number(q.id) === id))  // Compare IDs as numbers
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

// Add functionality to make the add panel draggable
function makeMovable(element) {
  let isDragging = false;
  let offsetX, offsetY;

  element.addEventListener('mousedown', (e) => {
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
  // Wrap the questions array inside an object with a "question" key and set the type of each question
  const formattedData = {
    question: questions.map(q => ({
      id: q.id,
      question: q.question,
      options: Object.keys(q.options).reduce((acc, key) => {
        acc[key] = q.options[key]; // Copy options as key-value pairs
        return acc;
      }, {}),
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
      overwriteQuestions(conflictingQuestions, newQuestions);  // Proceed with overwrite
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
      populateQuestionList(questions, 'view-mode');  // Update the view-mode list
      populateQuestionList(questions, 'manage-mode'); // Update the manage-mode list
      displayQuestions(questions, 'view-mode');  // Display questions in view mode
      displayQuestions(questions, 'manage-mode'); // Display questions in manage mode
    })
    .catch((error) => console.error('Error updating Firebase:', error));

  // Close the import panel after success
  document.getElementById('import-panel').style.display = 'none';
}