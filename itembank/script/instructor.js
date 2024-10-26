import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js';

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {
  getDatabase,
  ref,
  set,
  onValue,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

// Initialize Firebase
const firebaseConfig = {
  // Replace with your Firebase configuration
  apiKey: "AIzaSyCoXyCWebIypq2FO8QSt5IDdzfFNZsobFo",
  authDomain: "itembank-3b85f.firebaseapp.com",
  databaseURL: "https://itembank-3b85f-default-rtdb.firebaseio.com",
  projectId: "itembank-3b85f",
  storageBucket: "itembank-3b85f.appspot.com",
  messagingSenderId: "137360435017",
  appId: "1:137360435017:web:b6b501ef9b984780635c98",
  measurementId: "G-7G0SRY2JE9"
};

const appFirebase = initializeApp(firebaseConfig);
const database = getDatabase(appFirebase);

// Create Vue app
const app = createApp({
  data() {
    return {
      // Tabs
      activeTab: 'push',

      // Items and Learners
      items: [],
      learners: [],
      assignments: [],

      // Push Mode
      searchQueryPush: '',
      labelFilterPush: '',
      idListPush: '',
      randomCountPush: 1,
      selectedItemIds: [],
      selectedItemWeights: {}, // For storing weights
      showLimitedPreview: false, // For preview toggle

      // For storing random items
      randomItemsPush: [],

      // Manage Mode
      searchQueryManage: '',
      labelFilterManage: '',
      idListManage: '',
      randomCountManage: 1,

      // For storing random items
      randomItemsManage: [],

      // Selection Modes
      isSearchActivePush: true,
      isIdListActivePush: false,
      isRandomActivePush: false,

      isSearchActiveManage: true,
      isIdListActiveManage: false,
      isRandomActiveManage: false,

      // Learner Selection
      showLearnerPanel: false,
      isIdNameActive: true,
      isGroupActive: false,
      learnerIdInput: '',
      learnerNameInput: '',
      learnerGroupInput: '',
      selectedLearnerIds: [],
      previousSelectedLearnerIds: [],
      previousSelectedLearnerIdInput: '',

      // Modify Panel
      showModifyPanel: false,
      newItem: {
        id: '',
        question: '',
        type: 'MC',
        labelInput: '',
        label: [],
        choices: [''],
        answerInput: '',
        answer: [],
        explanation: '',
        difficulty: 0,
      },
      currentEditingItemId: null,
      originalItemData: null, // To store original item data for comparison

      // Import Panel
      showImportPanel: false,

      // Notification
      notification: {
        show: false,
        message: '',
        confirmText: '',
        cancelText: '',
        callback: null,
        cancelCallback: null,
      },

      // Assignment Prompt
      showAssignmentPrompt: false,
      assignmentDetails: {
        name: '',
        type: 'exercise',
        deadline: '',
      },

      remainingText: '', // Greyed-out part of the suggestion
    };
  },
  computed: {
    // Filtered Items for Push Mode
    filteredItemsPush() {
      let items = [];
      if (this.isSearchActivePush) {
        const query = this.searchQueryPush.toLowerCase();
        if (query) {
          items = this.items.filter((item) => {
            const questionMatches = item.question.toLowerCase().includes(query);
            let choiceMatches = false;
            if (item.choices) {
              choiceMatches = item.choices.some((choice) =>
                choice.toLowerCase().includes(query)
              );
            }
            const labelMatches = item.label.some((label) =>
              label.toLowerCase().includes(query)
            );
            return (
              questionMatches ||
              choiceMatches ||
              labelMatches ||
              item.id.toString().includes(query)
            );
          });
        } else {
          items = this.items.slice();
        }
      } else if (this.isIdListActivePush) {
        const idListInput = this.idListPush.trim();
        if (idListInput) {
          const idList = idListInput
            .split(',')
            .map((id) => Number(id.trim()))
            .filter((id) => !isNaN(id));
          items = idList
            .map((id) => this.items.find((q) => Number(q.id) === id))
            .filter((q) => q !== undefined);
        } else {
          items = this.items.slice();
        }
      } else {
        items = this.items.slice();
      }
      const labelFilter = this.labelFilterPush.trim().toLowerCase();
      if (labelFilter) {
        const labelsToFilter = labelFilter.split(',').map(label => label.trim());
        items = items.filter(item => {
          return labelsToFilter.every(labelToFilter => 
            item.label.some(label => label.toLowerCase() === labelToFilter.toLowerCase())
          );
        });
      }

      return items.sort((a, b) => a.id - b.id);
    },
    // Displayed Items in Push Mode
    displayedItemsPush() {
      if (this.isRandomActivePush) {
        return this.randomItemsPush;
      }
      return this.filteredItemsPush;
    },
    // Filtered Items for Manage Mode
    filteredItemsManage() {
      let items = [];
      if (this.isSearchActiveManage) {
        const query = this.searchQueryManage.toLowerCase();
        if (query) {
          items = this.items.filter((item) => {
            const questionMatches = item.question.toLowerCase().includes(query);
            let choiceMatches = false;
            if (item.choices) {
              choiceMatches = item.choices.some((choice) =>
                choice.toLowerCase().includes(query)
              );
            }
            const labelMatches = item.label.some((label) =>
              label.toLowerCase().includes(query)
            );
            return (
              questionMatches ||
              choiceMatches ||
              labelMatches ||
              item.id.toString().includes(query)
            );
          });
        } else {
          items = this.items.slice();
        }
      } else if (this.isIdListActiveManage) {
        const idListInput = this.idListManage.trim();
        if (idListInput) {
          const idList = idListInput
            .split(',')
            .map((id) => Number(id.trim()))
            .filter((id) => !isNaN(id));
          items = idList
            .map((id) => this.items.find((q) => Number(q.id) === id))
            .filter((q) => q !== undefined);
        } else {
          items = this.items.slice();
        }
      } else {
        items = this.items.slice();
      }
      const labelFilter = this.labelFilterManage.trim().toLowerCase();
      if (labelFilter) {
        const labelsToFilter = labelFilter.split(',').map(label => label.trim());
        items = items.filter(item => {
          return labelsToFilter.every(labelToFilter => 
            item.label.some(label => label.toLowerCase() === labelToFilter.toLowerCase())
          );
        });
      }

      return items.sort((a, b) => a.id - b.id);
    },
    // Displayed Items in Manage Mode
    displayedItemsManage() {
      if (this.isRandomActiveManage) {
        return this.randomItemsManage;
      }
      return this.filteredItemsManage;
    },
    // Selected Item IDs String
    selectedItemIdsString: {
      get() {
        return this.selectedItemIds.join(', ');
      },
      set(value) {
        if (value.trim()) {
          const ids = value
            .split(',')
            .map((id) => Number(id.trim()))
            .filter((id) => !isNaN(id));
          this.selectedItemIds = ids;
        } else {
          this.selectedItemIds = [];
        }
        this.initializeWeights(); // Initialize weights when IDs change
      },
    },
    // Preview Items
    previewItems() {
      return this.items.filter((q) => this.selectedItemIds.includes(q.id));
    },
    // Filtered Learners
    filteredLearners() {
      let filteredLearners = this.learners;
      if (this.isGroupActive) {
        const groupValue = this.learnerGroupInput.trim().toLowerCase();
        if (groupValue) {
          filteredLearners = this.learners.filter((learner) =>
            learner.group.toLowerCase().includes(groupValue)
          );
        }
      } else if (this.isIdNameActive) {
        const idValue = this.learnerIdInput.trim();
        const nameValue = this.learnerNameInput.trim().toLowerCase();

        if (idValue || nameValue) {
          filteredLearners = this.learners.filter((learner) => {
            const idMatches = idValue ? learner.id.toString() === idValue : true;
            const nameMatches = nameValue
              ? learner.username.toLowerCase().includes(nameValue)
              : true;
            return idMatches && nameMatches;
          });
        }
      }
      return filteredLearners;
    },
    // Selected Learner IDs String
    selectedLearnerIdsString: {
      get() {
        return this.selectedLearnerIds.join(', ');
      },
      set(value) {
        if (value.trim()) {
          const ids = value
            .split(',')
            .map((id) => Number(id.trim()))
            .filter((id) => !isNaN(id));
          this.selectedLearnerIds = ids;
        } else {
          this.selectedLearnerIds = [];
        }
      },
    },
    // Selected Learners List
    selectedLearnersList() {
      return this.selectedLearnerIds
        .map((id) => this.learners.find((l) => l.id === id))
        .filter((l) => l !== undefined);
    },
    // Generate suggestions dynamically
    labelSuggestions() {
      const allLabels = new Set();
      this.items.forEach((item) => {
        if (Array.isArray(item.label)) {
          item.label.forEach((label) => allLabels.add(label.trim()));
        }
      });

      const labelsArray = this.newItem.labelInput.split(',').map(label => label.trim());
      const lastLabel = labelsArray[labelsArray.length - 1];

      return lastLabel.length > 0
        ? Array.from(allLabels).filter((label) =>
            label.toLowerCase().startsWith(lastLabel.toLowerCase())
          )
        : [];
    },
    // Dynamic placeholder based on the question type
    answerPlaceholder() {
      switch (this.newItem.type) {
        case 'MC':
          return 'Enter correct choice(s) number (comma-separated)';
        case 'numeric':
          return 'Enter the correct numeric value';
        case 'OC':
          return 'Enter a short answer or response';
        default:
          return 'Enter the answer';
      }
    }
  },
  watch: {
    selectedItemIds(newIds, oldIds) {
      this.initializeWeights();
    },
  },
  methods: {
    initializeWeights() {
      this.items.forEach((item) => {
        if (!(item.id in this.selectedItemWeights)) {
          // Directly assign the default weight
          this.selectedItemWeights[item.id] = 1;
        }
      });
    },

    // Update the remaining part of the suggestion
    updateSuggestion() {
      const labelsArray = this.newItem.labelInput.split(',');
      const lastLabel = labelsArray[labelsArray.length - 1].trim();
      const suggestion = this.labelSuggestions[0] || '';

      // Only show the remaining part if the suggestion matches
      if (suggestion.toLowerCase().startsWith(lastLabel.toLowerCase())) {
        this.remainingText = suggestion.slice(lastLabel.length); // Grey part
      } else {
        this.remainingText = ''; // No valid suggestion
      }
    },

    // Autocomplete label on Tab key press
    autocompleteLabel() {
      if (this.remainingText) {
        this.newItem.labelInput += this.remainingText; // Append only the grey part
        this.remainingText = ''; // Clear suggestion after autocomplete
      }
    },

    // Save Item
    saveItem() {
      const id = parseInt(this.newItem.id.toString().trim(), 10);
      const questionText = this.newItem.question.trim();
      const type = this.newItem.type;
      const labelInput = this.newItem.labelInput.trim();
      const labels = labelInput ? labelInput.split(',').map((l) => l.trim()) : [];
      const answerInput = this.newItem.answerInput.trim();
      const answers = answerInput ? answerInput.split(',').map((a) => a.trim()) : [];
      const explanation = this.newItem.explanation.trim();
      const difficulty = this.newItem.difficulty;

      if (isNaN(id) || !questionText || !type || answers.length === 0) {
        this.showNotification('Please fill in all required fields correctly.', 'OK');
        return;
      }

      const idExists = this.items.some((q) => q.id === id && q.id !== this.currentEditingItemId);

      if (idExists) {
        this.showNotification(`Item ID ${id} already exists.`, 'OK');
        return;
      }

      let choices = [];
      if (type === 'MC') {
        if (this.newItem.choices.length === 0) {
          this.showNotification('Please provide choices for Multiple Choice items.', 'OK');
          return;
        }
        choices = this.newItem.choices.map(choice => choice.trim()).filter(choice => choice);

        // Validate answers are valid choice indices
        if (!answers.every(a => {
          const index = parseInt(a, 10);
          return !isNaN(index) && index >= 1 && index <= choices.length;
        })) {
          this.showNotification('Please provide valid choice numbers as answers.', 'OK');
          return;
        }
      } else if (type === 'numeric') {
        // Validate numeric answer
        if (answers.length !== 1 || isNaN(Number(answers[0]))) {
          this.showNotification('Please provide a valid numeric answer.', 'OK');
          return;
        }
      } else if (type === 'OC') {
        // No additional validation
      }

      const newItem = {
        id,
        question: questionText,
        type,
        label: labels,
        choices: type === 'MC' ? choices : [],
        answer: answers,
        explanation,
        difficulty,
      };

      if (this.currentEditingItemId !== null) {
        const itemIndex = this.items.findIndex(
          (q) => q.id === this.currentEditingItemId
        );
        if (itemIndex !== -1) {
          this.items.splice(itemIndex, 1, newItem);
        }
      } else {
        this.items.push(newItem);
      }

      set(ref(database, '/item'), this.items)
        .then(() => {
          this.showNotification('Item saved successfully.', 'OK');
          this.showModifyPanel = false;
        })
        .catch((error) => {
          console.error('Error updating Firebase:', error);
          this.showNotification('Failed to save item. Please try again.', 'OK');
        });
    },

    // Toggle Item Selection
    toggleItemSelection(itemId) {
      if (this.selectedItemIds.includes(itemId)) {
        this.selectedItemIds = this.selectedItemIds.filter((id) => id !== itemId);
        delete this.selectedItemWeights[itemId]; // Use delete to remove the property
      } else {
        this.selectedItemIds.push(itemId);
        this.selectedItemWeights[itemId] = 1; // Set default weight to 1
      }
    },    

    // Check if Item is Selected
    isSelectedItem(itemId) {
      return this.selectedItemIds.includes(itemId);
    },

    // Select All Items
    selectAllItems() {
      const idsToAdd = this.displayedItemsPush.map((q) => q.id);
      this.selectedItemIds = Array.from(new Set([...this.selectedItemIds, ...idsToAdd]));
      this.initializeWeights(); // Initialize weights after selection
    },
    // Unselect All Items
    unselectAllItems() {
      const idsToRemove = this.displayedItemsPush.map((q) => q.id);
      this.selectedItemIds = this.selectedItemIds.filter(id => !idsToRemove.includes(id));
      this.initializeWeights(); // Initialize weights after unselection
    },

    // Activate Search in Push Mode
    activateSearchPush() {
      this.isSearchActivePush = true;
      this.isIdListActivePush = false;
      this.isRandomActivePush = false;
    },
    // Activate ID List in Push Mode
    activateIdListPush() {
      this.isSearchActivePush = false;
      this.isIdListActivePush = true;
      this.isRandomActivePush = false;
    },
    // Activate Random in Push Mode
    activateRandomPush() {
      this.isSearchActivePush = false;
      this.isIdListActivePush = false;
      this.isRandomActivePush = true;
    },
    // Pick Random Items in Push Mode
    pickRandomItemsPush() {
      this.activateRandomPush();
      this.randomItemsPush = this.getRandomItems(this.items, this.randomCountPush);
    },
    // Scroll to Item
    scrollToItem(itemId, mode) {
      const itemCard = document.getElementById(`item-${itemId}-${mode}`);
      if (itemCard) {
        itemCard.scrollIntoView({ behavior: 'smooth' });
      }
    },

    // Open Learner Selection Panel
    openLearnerSelectionPanel() {
      this.showLearnerPanel = true;
      this.previousSelectedLearnerIds = [...this.selectedLearnerIds];
      this.previousSelectedLearnerIdInput = this.selectedLearnerIdsString;
    },
    // Close Learner Panel
    closeLearnerPanel() {
      if (JSON.stringify(this.selectedLearnerIds) !== JSON.stringify(this.previousSelectedLearnerIds)) {
        this.showNotification(
          'You have unsaved changes. Do you want to save them before closing?',
          'Save',
          'Discard',
          () => {
            this.saveLearnerSelection();
            this.showLearnerPanel = false;
          },
          () => {
            this.restoreLearnerSelection();
            this.showLearnerPanel = false;
          }
        );
      } else {
        this.showLearnerPanel = false;
      }
    },
    // Save Learner Selection
    saveLearnerSelection() {
      this.showLearnerPanel = false;
    },
    // Restore Learner Selection
    restoreLearnerSelection() {
      this.selectedLearnerIds = [...this.previousSelectedLearnerIds];
      this.selectedLearnerIdsString = this.previousSelectedLearnerIdInput;
    },
    // Toggle Learner Selection
    toggleLearnerSelection(learnerId) {
      if (this.selectedLearnerIds.includes(learnerId)) {
        this.selectedLearnerIds = this.selectedLearnerIds.filter((id) => id !== learnerId);
      } else {
        this.selectedLearnerIds.push(learnerId);
      }
    },
    // Check if Learner is Selected
    isSelectedLearner(learnerId) {
      return this.selectedLearnerIds.includes(learnerId);
    },
    // Select All Learners
    selectAllLearners() {
      this.selectedLearnerIds = Array.from(new Set([...this.selectedLearnerIds, ...this.filteredLearners.map((l) => l.id)]));
    },
    // Unselect All Learners
    unselectAllLearners() {
      const idsToRemove = this.filteredLearners.map((l) => l.id);
      this.selectedLearnerIds = this.selectedLearnerIds.filter(id => !idsToRemove.includes(id));
    },
    // Activate ID+Name
    activateIdName() {
      this.isIdNameActive = true;
      this.isGroupActive = false;
    },
    // Activate Group
    activateGroup() {
      this.isIdNameActive = false;
      this.isGroupActive = true;
    },

    // Prompt Assignment Details
    promptAssignmentDetails() {
      this.showAssignmentPrompt = true;
    },
    // Cancel Assignment Prompt
    cancelAssignmentPrompt() {
      this.showAssignmentPrompt = false;
    },
    // Confirm Assignment Details
    confirmAssignmentDetails() {
      if (!this.assignmentDetails.name.trim()) {
        this.showNotification('Assignment name cannot be empty.', 'OK');
        return;
      }
      if (this.selectedItemIds.length === 0) {
        this.showNotification('Item list cannot be empty.', 'OK');
        return;
      }
      if (this.selectedLearnerIds.length === 0) {
        this.showNotification('Learner list cannot be empty.', 'OK');
        return;
      }
      // Collect weights
      const weights = this.selectedItemIds.map(id => this.selectedItemWeights[id]);
      if (weights.some(w => isNaN(w) || w <= 0)) {
        this.showNotification('All weights must be positive numbers.', 'OK');
        return;
      }
      this.assignmentDetails.weights = weights;

      // Ensure deadline is set
      if (!this.assignmentDetails.deadline) {
        this.showNotification('Please specify a deadline.', 'OK');
        return;
      }

      this.dispatchAssignment();
      this.showAssignmentPrompt = false;
    },

    // Dispatch Assignment
    dispatchAssignment() {
      const timestamp = new Date().toISOString();
      const assignmentId = Date.now().toString();

      const assignmentData = {
        id: assignmentId,
        type: this.assignmentDetails.type,
        name: this.assignmentDetails.name,
        instructor_id: 1, // Assuming instructor ID is 1
        learner_ids: this.selectedLearnerIds,
        item_ids: this.selectedItemIds,
        weights: this.assignmentDetails.weights,
        deadline: this.assignmentDetails.deadline,
        timestamp: timestamp,
      };

      // Update assignments
      set(ref(database, `/assignment/${assignmentId}`), assignmentData)
        .then(() => {
          this.showNotification('Assignment dispatched successfully.', 'OK');
          this.showLearnerPanel = false;
        })
        .catch((error) => {
          console.error('Error updating Firebase:', error);
          this.showNotification('Failed to dispatch assignment. Please try again.', 'OK');
        });
    },

    // Show Notification (updated to handle two callbacks)
    showNotification(message, confirmText, cancelText = null, confirmCallback = null, cancelCallback = null) {
      this.notification = {
        show: true,
        message,
        confirmText,
        cancelText,
        callback: confirmCallback,
        cancelCallback: cancelCallback,
      };
    },
    // Handle Notification Confirm
    handleNotificationConfirm() {
      if (this.notification.callback) {
        this.notification.callback();
      }
      this.notification.show = false;
    },
    // Handle Notification Cancel
    handleNotificationCancel() {
      if (this.notification.cancelCallback) {
        this.notification.cancelCallback();
      }
      this.notification.show = false;
    },

    // Open Modify Panel
    openModifyPanel(itemId = null) {
      if (itemId !== null) {
        this.currentEditingItemId = parseInt(itemId, 10);
        const item = this.items.find((q) => q.id === this.currentEditingItemId);
        if (item) {
          this.newItem.id = item.id;
          this.newItem.question = item.question;
          this.newItem.type = item.type;
          this.newItem.label = item.label;
          this.newItem.labelInput = item.label.join(', ');
          this.newItem.explanation = item.explanation;
          this.newItem.difficulty = item.difficulty;
          if (item.type === 'MC') {
            this.newItem.choices = item.choices.slice();
          } else {
            this.newItem.choices = [];
          }
          this.newItem.answer = item.answer;
          this.newItem.answerInput = item.answer.join(', ');

          // Store original item data for comparison
          this.originalItemData = JSON.stringify(this.newItem);
        }
      } else {
        this.currentEditingItemId = null;
        this.newItem = {
          id: '',
          question: '',
          type: 'MC',
          labelInput: '',
          label: [],
          choices: [''],
          answerInput: '',
          answer: [],
          explanation: '',
          difficulty: 0,
        };
        // Store original item data for comparison
        this.originalItemData = JSON.stringify(this.newItem);
      }
      this.showModifyPanel = true;
    },

    // Close Modify Panel
    closeModifyPanel() {
      const currentItemData = JSON.stringify(this.newItem);
      if (currentItemData !== this.originalItemData) {
        // Changes detected, prompt the user
        this.showNotification(
          'You have unsaved changes. Do you want to save them before closing?',
          'Save',
          'Discard',
          () => {
            this.saveItem();
            this.showModifyPanel = false;
          },
          () => {
            this.showModifyPanel = false;
          }
        );
      } else {
        this.showModifyPanel = false;
      }
    },

    // Add Choice
    addChoice() {
      this.newItem.choices.push('');
    },
    // Remove Choice
    removeChoice(index) {
      this.newItem.choices.splice(index, 1);
    },

    // Confirm Delete Item
    confirmDeleteItem(itemId) {
      this.showNotification(
        `Are you sure you want to delete item ID: ${itemId}?`,
        'Delete',
        'Cancel',
        () => {
          this.deleteItem(itemId);
        }
      );
    },
    // Delete Item
    deleteItem(itemId) {
      this.items = this.items.filter((q) => q.id !== itemId);
      set(ref(database, '/item'), this.items)
        .then(() => {
          this.showNotification('Item deleted successfully.', 'OK');
        })
        .catch((error) => {
          console.error('Error updating Firebase:', error);
          this.showNotification('Failed to delete item. Please try again.', 'OK');
        });
    },

    // Activate Search in Manage Mode
    activateSearchManage() {
      this.isSearchActiveManage = true;
      this.isIdListActiveManage = false;
      this.isRandomActiveManage = false;
    },
    // Activate ID List in Manage Mode
    activateIdListManage() {
      this.isSearchActiveManage = false;
      this.isIdListActiveManage = true;
      this.isRandomActiveManage = false;
    },
    // Activate Random in Manage Mode
    activateRandomManage() {
      this.isSearchActiveManage = false;
      this.isIdListActiveManage = false;
      this.isRandomActiveManage = true;
    },
    // Pick Random Items in Manage Mode
    pickRandomItemsManage() {
      this.activateRandomManage();
      this.randomItemsManage = this.getRandomItems(this.items, this.randomCountManage);
    },

    // Get Random Items
    getRandomItems(array, num) {
      const shuffled = array.slice().sort(() => 0.5 - Math.random());
      return shuffled.slice(0, num);
    },

    // Open Import Panel
    openImportPanel() {
      this.showImportPanel = true;
    },
    // Close Import Panel
    closeImportPanel() {
      this.showImportPanel = false;
    },
    // Handle File Upload
    handleFileUpload(event) {
      const file = event.target.files[0];
      this.handleFileUploadInternal(file);
    },
    // Handle File Upload Internal
    handleFileUploadInternal(file) {
      if (file && file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedData = JSON.parse(e.target.result);
            if (importedData.item && Array.isArray(importedData.item)) {
              this.showNotification(
                'Importing items will overwrite existing items. Proceed?',
                'Overwrite',
                'Cancel',
                () => {
                  this.items = importedData.item;
                  set(ref(database, '/item'), this.items)
                    .then(() => {
                      this.showNotification('Items imported successfully.', 'OK');
                      this.showImportPanel = false;
                    })
                    .catch((error) => {
                      console.error('Error updating Firebase:', error);
                      this.showNotification('Failed to import items. Please try again.', 'OK');
                    });
                }
              );
            } else {
              this.showNotification('Invalid JSON structure.', 'OK');
            }
          } catch (error) {
            console.error('Error parsing JSON:', error);
            this.showNotification('Error parsing JSON file.', 'OK');
          }
        };
        reader.readAsText(file);
      } else {
        this.showNotification('Please upload a valid JSON file.', 'OK');
      }
    },

    // Open Import Panel
    openImportPanel() {
      this.showImportPanel = true;
    },
    // Close Import Panel
    closeImportPanel() {
      this.showImportPanel = false;
    },

    // Trigger File Input
    triggerFileInput() {
      this.$refs.fileInput.click();
    },

    // Handle File Drop
    handleFileDrop(event) {
      const file = event.dataTransfer.files[0];
      this.handleFileUploadInternal(file);
    },

    // Handle File Upload
    handleFileUpload(event) {
      const file = event.target.files[0];
      this.handleFileUploadInternal(file);
    },

    // Handle File Upload Internal
    handleFileUploadInternal(file) {
      if (file && file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedData = JSON.parse(e.target.result);
            if (importedData.item && Array.isArray(importedData.item)) {
              this.showNotification(
                'Importing items will overwrite existing items. Proceed?',
                'Overwrite',
                'Cancel',
                () => {
                  this.items = importedData.item;
                  set(ref(database, '/item'), this.items)
                    .then(() => {
                      this.showNotification('Items imported successfully.', 'OK');
                      this.showImportPanel = false;
                    })
                    .catch((error) => {
                      console.error('Error updating Firebase:', error);
                      this.showNotification('Failed to import items. Please try again.', 'OK');
                    });
                }
              );
            } else {
              this.showNotification('Invalid JSON structure.', 'OK');
            }
          } catch (error) {
            console.error('Error parsing JSON:', error);
            this.showNotification('Error parsing JSON file.', 'OK');
          }
        };
        reader.readAsText(file);
      } else {
        this.showNotification('Please upload a valid JSON file.', 'OK');
      }
    },

    // Export Items
    exportItems() {
      const dataStr = JSON.stringify({ item: this.items }, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'items_export.json';
      a.click();

      URL.revokeObjectURL(url);
    },

    // Display Item Type
    displayItemType(type) {
      const typeMap = {
        'MC': 'Multiple Choice',
        'numeric': 'Numerical Response',
        'OC': 'Open-Ended/Constructed Response',
      };
      return typeMap[type] || 'Unknown';
    },
    // Display Difficulty
    displayDifficulty(level) {
      const difficultyMap = {
        0: 'Not Determined',
        1: 'Easy',
        2: 'Medium',
        3: 'Hard',
      };
      return difficultyMap[level] || 'Unknown';
    },
    // Display Answer
    displayAnswer(item) {
      if (item.type === 'MC') {
        return item.answer.join(', ');
      } else if (item.type === 'numeric') {
        return item.answer[0];
      } else if (item.type === 'OC') {
        return item.answer.join(', ');
      } else {
        return '';
      }
    },
  },
  mounted() {
    // Load Data from Firebase
    onValue(ref(database, '/item'), (snapshot) => {
      if (snapshot.exists()) {
        const itemsData = snapshot.val() || [];
        // Ensure that label and answer are arrays, and id is a number
        this.items = itemsData.map((item) => ({
          ...item,
          id: parseInt(item.id, 10),
          label: Array.isArray(item.label) ? item.label : [],
          answer: Array.isArray(item.answer) ? item.answer : [],
          choices: item.choices ? item.choices : [],
        }));
  
        // Initialize weights to 1 for all items
        this.initializeWeights();
      } else {
        this.items = [];
      }
    });
  
    onValue(ref(database, '/learner'), (snapshot) => {
      if (snapshot.exists()) {
        this.learners = snapshot.val() || [];
      }
    });
  },
});

app.mount('#app');
