import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [context, setContext] = useState("");
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const chatWindowRef = useRef(null);

  useEffect(() => {
    // Scroll to the bottom of the chat window whenever messages change
    chatWindowRef.current?.scrollTo({
      top: chatWindowRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSendMessage = async () => {
    if (input.trim() === "" && !image) {
      console.log("No input or image to send, returning");
      return;
    }
  
    setIsLoading(true);
  
    // Display the user's message or image preview
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: input || "Image sent", sender: "user" },
    ]);
  
    try {
      const formData = new FormData();
      formData.append("user_question", input);
      formData.append("context", context);
  
      if (image) {
        formData.append("image", image);  // Attach image if present
      }
  
      // Send to the /chat endpoint, regardless of whether image or text only
      const response = await axios.post("http://localhost:5000/chat", formData);
      const aiResponse = response.data.response;
      const updatedContext = response.data.context;
  
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: aiResponse, sender: "ai" },
      ]);
  
      setContext(updatedContext);
      setImage(null); // Clear the image after sending
    } catch (error) {
      console.error("Error sending message:", error);
    }
  
    setIsLoading(false);
    setInput("");
  };
  

  const handleImageUpload = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>AI Chatbot</h1>
      <div ref={chatWindowRef} style={styles.chatWindow}>
        {messages.map((message, index) => (
          <div
            key={index}
            style={
              message.sender === "user"
                ? styles.userMessageContainer
                : styles.aiMessageContainer
            }
          >
            <div
              style={
                message.sender === "user"
                  ? styles.userMessage
                  : styles.aiMessage
              }
              dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }}
            ></div>
          </div>
        ))}
        {isLoading && (
          <div style={styles.loadingMessage}>AI is typing...</div>
        )}
      </div>
      <div style={styles.inputContainer}>
        <input
          type="text"
          style={styles.inputBox}
          placeholder="Send a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <label style={styles.imageLabel}>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={styles.fileInput}
          />
          {image ? "Image Selected" : "Upload Image"}
        </label>
        <button style={styles.sendButton} onClick={handleSendMessage}>
          Send
        </button>
      </div>
      {image && (
        <div style={styles.imagePreviewContainer}>
          <img
            src={URL.createObjectURL(image)}
            alt="Selected preview"
            style={styles.imagePreview}
          />
        </div>
      )}
    </div>
  );
};

const formatMessage = (messageText) => {
  return messageText.replace(/\n/g, "<br>").replace(/(\*\*([^*]+)\*\*)/g, "<strong>$2</strong>");
};

const styles = {
  container: {
    width: "800px",
    height: "750px",
    margin: "0 auto",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 0 20px rgba(0, 0, 0, 0.3)",
    backgroundColor: "#1e1e1e",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
  },
  title: {
    textAlign: "center",
    marginBottom: "15px",
    fontSize: "24px",
    fontWeight: "600",
  },
  chatWindow: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    backgroundColor: "#2a2a2a",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  userMessageContainer: {
    display: "flex",
    justifyContent: "flex-end",
  },
  aiMessageContainer: {
    display: "flex",
    justifyContent: "flex-start",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  userMessage: {
    backgroundColor: "#3b82f6",
    color: "#fff",
    padding: "12px 18px",
    borderRadius: "18px 18px 0 18px",
    maxWidth: "75%",
    fontSize: "16px",
    wordBreak: "break-word",
  },
  aiMessage: {
    backgroundColor: "#333",
    color: "#fff",
    padding: "12px 18px",
    borderRadius: "18px 18px 18px 0",
    maxWidth: "75%",
    fontSize: "16px",
    wordBreak: "break-word",
  },
  loadingMessage: {
    color: "#bbb",
    fontStyle: "italic",
    alignSelf: "flex-start",
    marginLeft: "10px",
  },
  inputContainer: {
    display: "flex",
    paddingTop: "10px",
    alignItems: "center",
  },
  inputBox: {
    flex: 1,
    padding: "15px",
    borderRadius: "25px",
    border: "1px solid #555",
    backgroundColor: "#333",
    color: "#fff",
    outline: "none",
    marginRight: "10px",
    fontSize: "16px",
  },
  imageLabel: {
    padding: "10px 15px",
    backgroundColor: "#4a4a4a",
    color: "#fff",
    borderRadius: "20px",
    cursor: "pointer",
    marginRight: "10px",
  },
  fileInput: {
    display: "none",
  },
  sendButton: {
    padding: "12px 20px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "25px",
    cursor: "pointer",
    fontSize: "16px",
    outline: "none",
    transition: "background-color 0.3s",
  },
  imagePreviewContainer: {
    marginTop: "10px",
    display: "flex",
    justifyContent: "center",
  },
  imagePreview: {
    maxWidth: "100%",
    maxHeight: "200px",
    borderRadius: "10px",
  },
};

export default Chatbot;
