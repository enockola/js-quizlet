# JavaScript Quiz App

A full-stack web application that helps beginner and intermediate JavaScript students test their knowledge through user-created quizzes.

Users can browse quizzes, create their own quiz sets, answer questions, view their results, and retake either the full quiz or only the questions they missed.

## Core Features

- Create, read, update, and delete quizzes
- Browse and search public quizzes
- Create multiple-choice and true-or-false questions
- Choose immediate feedback or end-of-quiz feedback
- View quiz scores and correct answers
- Retake the full quiz
- Retake only incorrectly answered questions
- Register and log in
- Manage quizzes created by the logged-in user
- Use the application on desktop and mobile devices

## Optional Features

These features will only be added after the required application is complete:

- Matching questions
- AI-assisted checking for short-answer questions
- JavaScript code-answer evaluation
- Saved quiz scores and progress tracking

## Technologies

### Frontend

- HTML
- CSS
- Vanilla JavaScript
- Fetch API

### Backend

- Node.js
- Express
- MongoDB
- Mongoose

### Project Tools

- Git and GitHub
- Trello
- MongoDB Atlas
- Netlify

## API Endpoints

### Quiz Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/quizzes` | Get all public quizzes |
| `GET` | `/api/quizzes?search=term` | Search for quizzes |
| `GET` | `/api/quizzes/:id` | Get one quiz |
| `POST` | `/api/quizzes` | Create a quiz |
| `PUT` | `/api/quizzes/:id` | Update an owned quiz |
| `DELETE` | `/api/quizzes/:id` | Delete an owned quiz |

### Authentication Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Log in |
| `POST` | `/api/auth/logout` | Log out |

## Initial Quiz Model

```js
{
  title: String,
  description: String,
  topic: String,
  difficulty: String,
  ownerId: ObjectId,
  isPublic: Boolean,
  questions: [
    {
      questionText: String,
      questionType: String,
      answerChoices: [String],
      correctAnswer: String
    }
  ]
}
```

## Team Workflow

The team uses Trello to organize tasks through the following workflow:

```text
Backlog → Current Sprint → In Progress → Code Review → Testing → Done
```

### Sprint 1: Database and API

- Set up the project
- Connect Express to MongoDB
- Create Mongoose models
- Create and test REST API endpoints
- Add search, validation, and error handling

### Sprint 2: Frontend and Full-Stack Features

- Build the quiz library
- Build the quiz creator
- Build the quiz-taking experience
- Add scoring and results
- Add authentication
- Connect the frontend to the API

### Sprint 3: Testing and Deployment

- Test all CRUD operations
- Improve responsive design and accessibility
- Fix integration issues
- Deploy the application
- Complete documentation
- Prepare the final presentation


## Future Improvements

- AI-assisted answer checking
- JavaScript code evaluation
- Matching questions
- Saved quiz scores
- Progress tracking
- Question explanations
- Quiz sharing

## Live Application

Add the deployed application link here:

`YOUR_LIVE_APPLICATION_URL`
