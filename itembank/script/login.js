// Firebase imports and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

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

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', (event) => {
  event.preventDefault(); // Prevent form from submitting

  const username = document.getElementById('username').value.trim();
  const password = sha256(document.getElementById('password').value.trim()); // Hash the password using SHA256

  // Fetch credentials from Firebase
  const dataRef = ref(database, '/');
  onValue(dataRef, (snapshot) => {
    const data = snapshot.val();
    const instructors = data?.instructor || [];
    const learners = data?.learner || [];

    // Check if the user is an instructor (using hashed password)
    const instructor = instructors.find(user => user.username === username && user.password === password);

    if (instructor) {
      sessionStorage.setItem('loggedIn', true);
      sessionStorage.setItem('role', 'instructor');
      window.location.href = 'instructor.html'; // Redirect to the instructor system
      return;
    }

    // Check if the user is a learner (now using hashed password for comparison)
    const learner = learners.find(user => user.username === username && user.password === password);

    if (learner) {
      sessionStorage.setItem('loggedIn', true);
      sessionStorage.setItem('role', 'learner');
      window.location.href = 'under-construction.html'; // Redirect to under-construction page for learners
      return;
    }

    // If no match found, show error message
    document.getElementById('error-message').style.display = 'block';
  });
});
