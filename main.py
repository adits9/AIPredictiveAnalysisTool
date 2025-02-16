from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import os
import pytesseract
from PIL import Image
import io

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

# Load and preprocess the CSV data when the app starts
current_dir = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(current_dir, "energy.csv")
data = pd.read_csv(file_path)

# Handle missing values and scale numerical features
data.fillna(method='ffill', inplace=True)
scaler = StandardScaler()
numerical_features = ['housearea', 'ave_monthly_income', 'num_people', 'num_children']
data[numerical_features] = scaler.fit_transform(data[numerical_features])

# Train a model to predict energy-saving actions based on past data
def train_recommendation_model(data):
    features = ['housearea', 'num_people', 'num_ac_units', 'num_appliances', 'season']
    target = 'recommended_action'  # Target variable for actions

    # Ensure target column exists in the dataset
    if target not in data.columns:
        raise ValueError(f"Target column '{target}' missing in data.")

    X = data[features]
    y = data[target]

    model = RandomForestClassifier()
    model.fit(X, y)
    return model

# Initialize recommendation model
try:
    recommendation_model = train_recommendation_model(data)
except ValueError as e:
    print(e)
    recommendation_model = None  # Fallback if target data is missing

# Generate a comprehensive data summary without predefined suggestions
def generate_data_summary(data):
    summary = data.describe().to_string() + "\n"
    return f"Statistical Summary:\n{summary}"

# Generate the initial data summary at startup
documents_str = generate_data_summary(data)

# Define the combined prompt template to guide the model
template_combined = """
You are an AI model with access to both an image containing specific information (such as a recent bill) and historical household energy data. Answer the user's question by combining information from both sources if needed:

1. Use **Image Data** for specific details directly extracted from the image, like recent bills or usage information.
2. Use **Data Summary** for general patterns, trends, and predictions based on historical data.

If the question requires, cross-reference information from both **Image Data** and **Data Summary** to provide a more comprehensive answer.

Image Data (if available):
{image_data}

Data Summary:
{documents}

Conversation History: {context}

User's Question: {question}

Your Answer:
"""

# Load the model and create the prompt template
model = OllamaLLM(model="llama3.2")
combined_prompt = ChatPromptTemplate.from_template(template_combined)

@app.route("/chat", methods=["POST"])
def chat():
    user_question = request.form.get("user_question", "")
    context = request.form.get("context", "")
    image_file = request.files.get("image")

    # Extract text from the image if provided
    image_data = ""
    if image_file:
        image = Image.open(io.BytesIO(image_file.read()))
        extracted_text = pytesseract.image_to_string(image).strip()
        image_data = extracted_text if extracted_text else "No relevant text found in image."

    # Prepare the prompt with both image_data and CSV data summary
    prompt = combined_prompt | model
    response = prompt.invoke({
        "context": context,
        "question": user_question,
        "image_data": image_data,
        "documents": documents_str
    })

    # Update the context with the response
    updated_context = f"{context}\nUser: {user_question}\nAI: {response}"

    return jsonify({"response": response, "context": updated_context})


if __name__ == "__main__":
    app.run(debug=True)
