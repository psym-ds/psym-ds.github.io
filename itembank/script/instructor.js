// instructor.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, set, onValue, push } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Firebase configuration
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

// Global variables
let questions = [];
let learners = [];
let currentQuestions = [];
let currentLearners = [];
let selectedQuestionIds = [];
let selectedLearnerIds = [];
let previousSelectedLearnerIds = [];
let previousSelectedLearnerIdInput = '';

let showAnswers = true; // For toggling answers in preview
let currentEditingQuestionId = null; // For tracking editing question

// Load data from Firebase
function loadData() {
  const questionsRef = ref(database, '/question');
  onValue(questionsRef, (snapshot) => {
    if (snapshot.exists()) {
      questions = snapshot.val() || [];
      populateQuestionList(questions, 'push-mode');
      populateQuestionList(questions, 'manage-mode');
      displayQuestions(questions, 'push-mode');
      displayQuestions(questions, 'manage-mode');
    }
  });

  const learnersRef = ref(database, '/learner');
  onValue(learnersRef, (snapshot) => {
    if (snapshot.exists()) {
      learners = snapshot.val() || [];
    }
  });
}

// Initial load
loadData();

// Function to populate question list in the sidebar
function populateQuestionList(questionArray, mode) {
  const listElement = mode === 'push-mode' ? document.getElementById('question-list') : document.getElementById('manage-question-list');
  listElement.innerHTML = '';
  questionArray.forEach(question => {
    const li = document.createElement('li');
    li.textContent = `${question.id} - ${question.question}`;
    li.addEventListener('click', () => {
      // Scroll to the question card in the main content area
      const questionCard = document.getElementById(`question-${question.id}-${mode}`);
      if (questionCard) {
        questionCard.scrollIntoView({ behavior: 'smooth' });
      }
    });
    listElement.appendChild(li);
  });
}

// Function to display questions in the main content area
function displayQuestions(questionArray, mode) {
  const container = mode === 'push-mode' ? document.getElementById('question-container') : document.getElementById('manage-question-container');
  container.innerHTML = '';
  if (mode === 'push-mode') {
    currentQuestions = questionArray; // Update current questions
  }

  questionArray.forEach(question => {
    const card = document.createElement('div');
    card.classList.add('question-card');
    card.id = `question-${question.id}-${mode}`;

    const questionText = document.createElement('p');
    questionText.textContent = `ID: ${question.id} - ${question.question}`;
    card.appendChild(questionText);

    if (question.options) {
      const optionsList = document.createElement('ul');
      Object.entries(question.options).forEach(([key, value]) => {
        const optionItem = document.createElement('li');
        optionItem.textContent = `${key}: ${value}`;
        optionsList.appendChild(optionItem);
      });
      card.appendChild(optionsList);
    }

    const answerText = document.createElement('p');
    answerText.textContent = `Answer: ${question.answer}`;
    card.appendChild(answerText);

    if (mode === 'push-mode') {
      // Selection checkbox
      const selectCheckbox = document.createElement('i');
      selectCheckbox.classList.add('select-checkbox');
      selectCheckbox.classList.add('fa-regular'); // Regular style
      if (selectedQuestionIds.includes(question.id)) {
        selectCheckbox.classList.add('fa-square-check'); // Checked
      } else {
        selectCheckbox.classList.add('fa-square'); // Unchecked
      }
      selectCheckbox.addEventListener('click', () => {
        toggleQuestionSelection(question.id);
      });
      card.appendChild(selectCheckbox);
    } else if (mode === 'manage-mode') {
      // Edit and Delete buttons
      const editButton = document.createElement('i');
      editButton.classList.add('edit-button', 'fa-solid', 'fa-pen-to-square');
      editButton.addEventListener('click', () => {
        openModifyPanel(question.id);
      });
      card.appendChild(editButton);

      const deleteButton = document.createElement('i');
      deleteButton.classList.add('delete-button', 'fa-solid', 'fa-trash-can');
      deleteButton.addEventListener('click', () => {
        showNotification(
          `Are you sure you want to delete question ID: ${question.id}?`,
          'Delete',
          'Cancel',
          () => {
            removeQuestion(question.id);
          }
        );
      });
      card.appendChild(deleteButton);
    }

    container.appendChild(card);
  });
}

// Function to toggle question selection
function toggleQuestionSelection(questionId) {
  if (selectedQuestionIds.includes(questionId)) {
    // Remove from selected
    selectedQuestionIds = selectedQuestionIds.filter(id => id !== questionId);
  } else {
    // Add to selected
    selectedQuestionIds.push(questionId);
  }
  // Update the ID list input
  document.getElementById('selected-id-list').value = selectedQuestionIds.join(', ');
  // Update the checkboxes
  updateSelectionCheckboxes();
  // Update preview panel
  updatePreviewPanel();
}

// Function to update selection checkboxes
function updateSelectionCheckboxes() {
  const checkboxes = document.querySelectorAll('.select-checkbox');
  checkboxes.forEach(checkbox => {
    const questionId = parseInt(checkbox.parentElement.id.split('-')[1]);
    if (selectedQuestionIds.includes(questionId)) {
      checkbox.classList.remove('fa-square');
      checkbox.classList.add('fa-square-check');
    } else {
      checkbox.classList.remove('fa-square-check');
      checkbox.classList.add('fa-square');
    }
  });
}

// Function to update the preview panel
function updatePreviewPanel() {
  const container = document.getElementById('preview-container');
  container.innerHTML = '';
  const previewQuestions = questions.filter(q => selectedQuestionIds.includes(q.id));

  previewQuestions.forEach(question => {
    const card = document.createElement('div');
    card.classList.add('question-card');

    const questionText = document.createElement('p');
    questionText.textContent = `ID: ${question.id} - ${question.question}`;
    card.appendChild(questionText);

    if (question.options) {
      const optionsList = document.createElement('ul');
      Object.entries(question.options).forEach(([key, value]) => {
        const optionItem = document.createElement('li');
        optionItem.textContent = `${key}: ${value}`;
        optionsList.appendChild(optionItem);
      });
      card.appendChild(optionsList);
    }

    if (showAnswers && question.answer) {
      const answerText = document.createElement('p');
      answerText.textContent = `Answer: ${question.answer}`;
      card.appendChild(answerText);
    }

    container.appendChild(card);
  });
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

// Handle mutual exclusivity of selection methods in push mode
const searchBarPush = document.getElementById('search-bar');
const idListPush = document.getElementById('id-list-view');
const randomQuestionButtonPush = document.getElementById('random-question-button');
const questionCountPush = document.getElementById('question-count');

// By default, search bar is active, others are inactive
idListPush.classList.add('inactive-input');
questionCountPush.classList.add('inactive-input');
randomQuestionButtonPush.classList.add('inactive-button');

// When search bar is focused, make it active and others inactive
searchBarPush.addEventListener('focus', () => {
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

// Learner Selection Functionality Starts

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

// Handle Dispatch Button Click
document.getElementById('dispatch-button').addEventListener('click', () => {
  // Show notification box with input for assignment name
  showAssignmentNamePrompt();
});

// Function to show assignment name prompt
function showAssignmentNamePrompt() {
  const notificationBox = document.createElement('div');
  notificationBox.classList.add('confirm-box');
  notificationBox.innerHTML = `
    <p>Please enter the assignment name:</p>
    <input type="text" id="assignment-name-input" class="modern-input full-width-input" placeholder="Assignment Name" />
    <div class="button-container">
      <button class="confirm-button grey-button">Cancel</button>
      <button class="confirm-button blue-button">Confirm</button>
    </div>
  `;
  document.body.appendChild(notificationBox);

  // Handle Confirm action
  notificationBox.querySelector('.blue-button').addEventListener('click', () => {
    const assignmentName = document.getElementById('assignment-name-input').value.trim();
    // Check if assignment name, question list, student list are not empty
    if (!assignmentName) {
      document.body.removeChild(notificationBox);
      showNotification('Assignment name cannot be empty.', 'OK');
      return;
    }
    if (selectedQuestionIds.length === 0) {
      document.body.removeChild(notificationBox);
      showNotification('Question list cannot be empty.', 'OK');
      return;
    }
    if (selectedLearnerIds.length === 0) {
      document.body.removeChild(notificationBox);
      showNotification('Learner list cannot be empty.', 'OK');
      return;
    }

    // All checks passed, proceed to dispatch assignment
    document.body.removeChild(notificationBox);
    dispatchAssignment(assignmentName);
  });

  // Handle Cancel action
  notificationBox.querySelector('.grey-button').addEventListener('click', () => {
    document.body.removeChild(notificationBox);
  });
}

// Function to dispatch assignment
function dispatchAssignment(assignmentName) {
  const timestamp = Date.now().toString();

  // Prepare assignment data
  const assignmentData = {
    name: assignmentName,
    status: false, // false means not completed
    questionList: selectedQuestionIds,
    answerList: [] // Initially empty
  };

  // For each selected learner, add assignment to their assignments
  selectedLearnerIds.forEach(learnerId => {
    // Find learner in the learners array
    const learnerIndex = learners.findIndex(l => l.id === learnerId);
    if (learnerIndex !== -1) {
      const learner = learners[learnerIndex];
      if (!learner.assignments) {
        learner.assignments = {};
      }
      learner.assignments[timestamp] = assignmentData;
    }
  });

  // Update the 'learner' section in Firebase
  set(ref(database, '/learner'), learners)
    .then(() => {
      console.log('Assignments dispatched successfully');
      showNotification('Assignments dispatched successfully.', 'OK');
      // Close the learner selection panel
      document.getElementById('learner-selection-panel').style.display = 'none';
    })
    .catch((error) => {
      console.error('Error updating Firebase:', error);
      showNotification('Failed to dispatch assignments. Please try again.', 'OK');
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

// Manage Mode Functionality Starts

// Handle mutual exclusivity of selection methods in manage mode
const searchBarManage = document.getElementById('manage-search-bar');
const idListManage = document.getElementById('id-list-manage');
const randomQuestionButtonManage = document.getElementById('manage-random-question-button');
const questionCountManage = document.getElementById('manage-question-count');

// By default, search bar is active, others are inactive
idListManage.classList.add('inactive-input');
questionCountManage.classList.add('inactive-input');
randomQuestionButtonManage.classList.add('inactive-button');

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

// Handle picking random questions in Manage mode
document.getElementById('manage-random-question-button').addEventListener('click', () => {
  const questionCount = parseInt(document.getElementById('manage-question-count').value, 10) || 1;
  const randomQuestions = getRandomQuestions(questions, questionCount);
  displayQuestions(randomQuestions, 'manage-mode');
  // Deactivate other methods
  searchBarManage.classList.add('inactive-input');
  idListManage.classList.add('inactive-input');
  questionCountManage.classList.remove('inactive-input');
});

// Handle Add Question button
document.getElementById('toggle-modify-panel').addEventListener('click', () => {
  openModifyPanel();
});

// Function to open modify panel for adding or editing
function openModifyPanel(questionId = null) {
  const modifyPanel = document.getElementById('modify-panel');
  modifyPanel.style.display = 'block';

  // If questionId is provided, we're editing an existing question
  if (questionId !== null) {
    currentEditingQuestionId = questionId;
    const question = questions.find(q => q.id === questionId);
    if (question) {
      document.getElementById('new-question-id').value = question.id;
      document.getElementById('new-question-text').value = question.question;
      document.getElementById('new-question-answer').value = question.answer;

      // Clear existing options
      const optionsContainer = document.getElementById('new-options-container');
      optionsContainer.innerHTML = '';

      // Populate options
      Object.entries(question.options).forEach(([key, value], index) => {
        const optionWrapper = document.createElement('div');
        optionWrapper.classList.add('option-wrapper');

        const optionInput = document.createElement('input');
        optionInput.type = 'text';
        optionInput.classList.add('modern-input', 'option-input');
        optionInput.placeholder = `Option ${key}`;
        optionInput.value = value;
        optionWrapper.appendChild(optionInput);

        const optionButton = document.createElement('button');

        if (index === 0) {
          // First option, add 'Add' button
          optionButton.classList.add('modern-button');
          optionButton.textContent = 'Add';
          optionButton.addEventListener('click', () => {
            addOption();
          });
        } else {
          // Subsequent options, add 'Del' button
          optionButton.classList.add('red-button');
          optionButton.textContent = 'Del';
          optionButton.addEventListener('click', () => {
            optionsContainer.removeChild(optionWrapper);
          });
        }

        optionWrapper.appendChild(optionButton);
        optionsContainer.appendChild(optionWrapper);
      });
    }
  } else {
    // Adding a new question
    currentEditingQuestionId = null;
    document.getElementById('new-question-id').value = '';
    document.getElementById('new-question-text').value = '';
    document.getElementById('new-question-answer').value = '';
    document.getElementById('new-options-container').innerHTML = '';

    // Add an initial option
    addOption();
  }
}

// Close modify panel
document.getElementById('close-modify-panel').addEventListener('click', () => {
  document.getElementById('modify-panel').style.display = 'none';
});

// Add option button handler
document.getElementById('add-option-button').addEventListener('click', () => {
  addOption();
});

// Function to add a new option input
function addOption() {
  const optionsContainer = document.getElementById('new-options-container');
  const optionCount = optionsContainer.children.length;

  const optionWrapper = document.createElement('div');
  optionWrapper.classList.add('option-wrapper');

  const optionInput = document.createElement('input');
  optionInput.type = 'text';
  optionInput.classList.add('modern-input', 'option-input');
  optionInput.placeholder = `Option ${optionCount + 1}`;
  optionWrapper.appendChild(optionInput);

  const optionButton = document.createElement('button');
  optionButton.classList.add('modern-button');

  if (optionCount === 0) {
    // First option, add 'Add' button
    optionButton.textContent = 'Add';
    optionButton.addEventListener('click', () => {
      addOption();
    });
  } else {
    // Subsequent options, add 'Del' button
    optionButton.classList.add('red-button');
    optionButton.textContent = 'Del';
    optionButton.addEventListener('click', () => {
      optionsContainer.removeChild(optionWrapper);
    });
  }

  optionWrapper.appendChild(optionButton);
  optionsContainer.appendChild(optionWrapper);
}

// Save question button handler
document.getElementById('save-question-button').addEventListener('click', () => {
  const id = parseInt(document.getElementById('new-question-id').value.trim(), 10);
  const questionText = document.getElementById('new-question-text').value.trim();
  const answer = document.getElementById('new-question-answer').value.trim();
  const optionInputs = document.querySelectorAll('.option-input');
  const options = {};

  optionInputs.forEach((input, index) => {
    const optionKey = (index + 1).toString();
    options[optionKey] = input.value.trim();
  });

  if (isNaN(id) || !questionText || !answer || Object.keys(options).length === 0) {
    showNotification('Please fill in all fields correctly.', 'OK');
    return;
  }

  // Check if ID already exists when adding a new question
  if (currentEditingQuestionId === null && questions.some(q => q.id === id)) {
    showNotification(`Question ID ${id} already exists.`, 'OK');
    return;
  }

  const newQuestion = {
    id,
    question: questionText,
    options,
    answer
  };

  if (currentEditingQuestionId !== null) {
    // Editing existing question
    const questionIndex = questions.findIndex(q => q.id === currentEditingQuestionId);
    if (questionIndex !== -1) {
      questions[questionIndex] = newQuestion;
    }
  } else {
    // Adding new question
    questions.push(newQuestion);
  }

  // Update Firebase
  set(ref(database, '/question'), questions)
    .then(() => {
      showNotification('Question saved successfully.', 'OK');
      document.getElementById('modify-panel').style.display = 'none';
    })
    .catch((error) => {
      console.error('Error updating Firebase:', error);
      showNotification('Failed to save question. Please try again.', 'OK');
    });
});

// Remove question function
function removeQuestion(questionId) {
  questions = questions.filter(q => q.id !== questionId);

  // Update Firebase
  set(ref(database, '/question'), questions)
    .then(() => {
      showNotification('Question deleted successfully.', 'OK');
    })
    .catch((error) => {
      console.error('Error updating Firebase:', error);
      showNotification('Failed to delete question. Please try again.', 'OK');
    });
}

// Import and Export Functionality

// Handle Import button click
document.getElementById('import-button').addEventListener('click', () => {
  document.getElementById('import-panel').style.display = 'flex';
});

// Close import panel
document.getElementById('close-import-panel').addEventListener('click', () => {
  document.getElementById('import-panel').style.display = 'none';
});

// Handle file drop area
const fileDropArea = document.getElementById('file-drop-area');
fileDropArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  fileDropArea.classList.add('dragover');
});

fileDropArea.addEventListener('dragleave', () => {
  fileDropArea.classList.remove('dragover');
});

fileDropArea.addEventListener('drop', (e) => {
  e.preventDefault();
  fileDropArea.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  handleFileUpload(file);
});

fileDropArea.addEventListener('click', () => {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    handleFileUpload(file);
  });
  fileInput.click();
});

function handleFileUpload(file) {
  if (file && file.type === 'application/json') {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (importedData.question && Array.isArray(importedData.question)) {
          showNotification(
            'Importing questions will overwrite existing questions. Proceed?',
            'Overwrite',
            'Cancel',
            () => {
              questions = importedData.question;
              // Update Firebase
              set(ref(database, '/question'), questions)
                .then(() => {
                  showNotification('Questions imported successfully.', 'OK');
                  document.getElementById('import-panel').style.display = 'none';
                })
                .catch((error) => {
                  console.error('Error updating Firebase:', error);
                  showNotification('Failed to import questions. Please try again.', 'OK');
                });
            }
          );
        } else {
          showNotification('Invalid JSON structure.', 'OK');
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
        showNotification('Error parsing JSON file.', 'OK');
      }
    };
    reader.readAsText(file);
  } else {
    showNotification('Please upload a valid JSON file.', 'OK');
  }
}

// Handle Export button click
document.getElementById('export-button').addEventListener('click', () => {
  const dataStr = JSON.stringify({ question: questions }, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'questions_export.json';
  a.click();

  URL.revokeObjectURL(url);
});

