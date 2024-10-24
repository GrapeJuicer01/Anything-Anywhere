/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/JavaScript.js to edit this template
 */

let slideIndex = 1;
showSlides(slideIndex);

// Left and Right Slides Control
function plusSlides(n) {
  showSlides(slideIndex += n);
}

// Thumbnail image controls
function currentSlide(n) {
  showSlides(slideIndex = n);
}

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

// Send message when user clicks the send button
sendButton.addEventListener('click', sendMessage);

// Send message when user presses 'Enter'
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// Function to send a message
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

// Function to add messages to chat window
function addMessageToChat(sender, message) {
  const messageElement = document.createElement('div');
  messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}


