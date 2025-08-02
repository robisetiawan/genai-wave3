// script.js

document.addEventListener("DOMContentLoaded", () => {
  const chatForm = document.getElementById("chat-form");
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");

  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    // Add user message to chat box
    addMessage("user", userMessage);
    userInput.value = "";

    // Show "Thinking..." message
    const thinkingMessage = addMessage("bot", "Thinking...");

    try {
      // Send message to backend
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: [{ role: "user", content: userMessage }] }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.result;

      // Replace "Thinking..." message with AI response
      thinkingMessage.textContent = aiResponse || "Sorry, no response received.";
    } catch (error) {
      console.error("Failed to get response from server:", error);
      thinkingMessage.textContent = "Failed to get response from server.";
    }
  });

  // Helper function to add messages to the chat box
  function addMessage(sender, message) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");
    messageElement.classList.add(sender);
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
    scrollToBottom();
    return messageElement;
  }

  // Helper function to scroll to the bottom of the chat box
  function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});