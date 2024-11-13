/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/JavaScript.js to edit this template
 */

let slideIndex = 1;
showSlides(slideIndex);

// Function forleft & right controls
function plusSlides(n) {
  showSlides(slideIndex += n);
}

// Function to control navigation to a specific slide, dot selection
function currentSlide(n) {
  showSlides(slideIndex = n);
}

// Function to display slides
function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("dot");
  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex-1].style.display = "block";
  dots[slideIndex-1].className += " active";
}

// Chatbox Logic

// Select chat icon, popup, close button, and input elements
const chatIcon = document.getElementById('chat-icon');
const chatPopup = document.getElementById('chat-popup');
const closeChat = document.getElementById('close-chat');
const sendButton = document.getElementById('send-button');
const userInput = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');

// Open chat window on chat icon click
chatIcon.addEventListener('click', () => {
  chatPopup.style.display = 'flex';
});

// Close chat window on close button click
closeChat.addEventListener('click', () => {
  chatPopup.style.display = 'none';
});

sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// Function to send a message to the API
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  addMessageToChat('User', message);

  try {
    const response = await fetch('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();
    if (data.reply) {
      addMessageToChat('Chatbot', data.reply);
    } else {
      addMessageToChat('Chatbot', 'Sorry, something went wrong.');
    }
  } catch (error) {
    console.error('Error:', error);
    addMessageToChat('Chatbot', 'Chatbot is unavailable at the moment.');
  }

  userInput.value = '';
}

// Function to add messages to chat window, response from the API
function addMessageToChat(sender, message) {
  const messageElement = document.createElement('div');
  messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}


