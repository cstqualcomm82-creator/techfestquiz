# CST (Connectivity System Testing) Quiz Application

A quiz application focused on Connectivity System Testing (CST) knowledge with a leaderboard that tracks user scores.

## Features

- 30 CST-related questions with 10 random questions per quiz
- User authentication with employee ID
- Leaderboard showing top 3 performers
- One attempt per user (based on employee ID)
- Server-side data storage with queue system for concurrent access

## Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```

## Running the Application

### Standard Server (Original)
```
npm start
```

### Queue-Based Server (Recommended for Multiple Users)
```
node server-queue.js
```

## How the Queue System Works

The queue-based server uses a sequential processing approach to handle file operations:

1. All file operations (read/write) are added to a queue
2. Operations are processed one at a time in the order they were received
3. Each operation completes fully before the next begins
4. This prevents race conditions and data corruption when multiple users access the application

## Benefits of the Queue System

- **Data Integrity**: Prevents race conditions and file corruption
- **Reliable Processing**: Each operation is completed before the next begins
- **Error Handling**: Better error recovery and reporting
- **Graceful Shutdown**: Ensures all operations complete before server shutdown

## Stopping the Server

To stop the server:
1. Press `Ctrl + C` in the terminal where the server is running
2. The server will attempt to complete any pending operations before shutting down

## File Structure

- `index.html` - The main quiz application
- `server.js` - Original server implementation
- `server-queue.js` - Queue-based server implementation
- `leaderboard.json` - Data file storing all quiz results
- `cst-questions.json` - Contains all 30 CST-related questions

## Notes

- The leaderboard data is stored in `leaderboard.json`
- Each user can only take the quiz once (enforced by employee ID)
- The leaderboard shows only the top 3 scores