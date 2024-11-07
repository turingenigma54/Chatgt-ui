# Chat Application 

## Introduction
This is a chat application built using FastAPI for the backend and React (chat.tsx) for the frontend. It allows users to register, log in, and communicate through conversations with an assistant model. The project aims to provide an interactive and user-friendly environment for chatting, powered by a custom conversational model.

## Features
- User registration and authentication
- Secure token-based login using OAuth2
- Password validation with various requirements (e.g., length, uppercase, symbols)
- Start new conversations or continue existing ones
- Integrated response generation using a custom model
- Database integration with MongoDB to persist users, conversations, and messages
- RESTful API for conversation management (create, read, delete)

## Project Structure

- **main.py**: Contains the backend server logic using FastAPI. It defines routes for registering users, logging in, creating conversations, chatting, and managing conversations. Utilizes various dependencies like JWT for authentication and CORS middleware for allowing frontend requests.
- **chat.tsx**: Represents the chat interface on the frontend built with React, where users can interact with the chat application. It allows users to send prompts and displays model responses in an interactive UI.
- **Models and Schemas**: These contain the data structures for users, conversations, and messages, ensuring data consistency across the application.
- **Auth and Database**: Handle user authentication, password hashing, JWT token generation, and MongoDB interactions for persisting application data.

## Installation
To get the application running locally, follow these steps:

### Prerequisites
- Python 3.9+
- Node.js and npm (for running the frontend)
- MongoDB (for the backend database)

### Backend Setup
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate   # On Windows use `venv\Scripts\activate`
   ```
3. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables by creating a `.env` file. The file should include:
   ```env
   SECRET_KEY="your_secret_key_here"
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   MONGO_DB_URL="mongodb://localhost:27017/your_db_name"
   OLLAMA_API_URL=http://localhost:11434
   ```
5. Run the FastAPI server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

### Running the Application
- Once both the backend and frontend are running, visit `http://localhost:3000` in your browser to interact with the chat interface.

## API Endpoints
- **POST /register**: Register a new user
- **POST /token**: Login and obtain access token
- **POST /chat**: Start or continue a conversation
- **GET /conversations**: Get all conversations of the logged-in user
- **GET /conversations/{conversation_id}**: Get messages from a specific conversation
- **DELETE /conversations/{conversation_id}**: Delete a specific conversation

## Usage
1. Register for an account using `/register`.
2. Obtain a token by logging in using `/token`. The token is used for authenticating requests.
3. Use the `/chat` endpoint to initiate a conversation. You can provide prompts and receive model-generated responses.
4. Manage conversations (list, view messages, delete) using the provided endpoints.

## Password Requirements
- Minimum length: 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one symbol (e.g., !@#$%^&*)

## Technologies Used
- **Backend**: FastAPI, MongoDB, JWT for authentication, CORS Middleware
- **Frontend**: React (with TypeScript), Axios for API calls
- **Deployment**: Can be deployed using platforms like Heroku, DigitalOcean, or AWS.

## License
This project is licensed under the MIT License. Feel free to use and modify it as you see fit.

## Contact
For questions or issues, reach out to the maintainer or open an issue in the repository.

