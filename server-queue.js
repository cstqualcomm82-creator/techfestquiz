const express = require('express');
const fs = require('fs');
const path = require('path');
const Queue = require('better-queue');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// Create a queue for file operations
// This ensures all file operations happen one at a time
const fileQueue = new Queue(async (task, callback) => {
  try {
    const { operation, data, res } = task;
    
    // Make sure the leaderboard file exists
    if (!fs.existsSync('leaderboard.json')) {
      fs.writeFileSync('leaderboard.json', JSON.stringify({ scores: [] }, null, 2));
    }
    
    // Read current leaderboard data
    const leaderboardData = JSON.parse(fs.readFileSync('leaderboard.json', 'utf8'));
    
    // Process the operation
    switch (operation) {
      case 'getLeaderboard':
        res.json(leaderboardData);
        break;
        
      case 'checkUser':
        const { employeeId } = data;
        const userExists = leaderboardData.scores.some(score => score.employeeId === employeeId);
        res.json({ exists: userExists });
        break;
        
      case 'addScore':
        const newScore = data;
        
        // Check if user already exists
        const existingUserIndex = leaderboardData.scores.findIndex(
          score => score.employeeId === newScore.employeeId
        );
        
        if (existingUserIndex !== -1) {
          res.status(400).json({ error: 'User has already submitted a score' });
        } else {
          // Add new score
          leaderboardData.scores.push(newScore);
          
          // Write updated leaderboard back to file
          fs.writeFileSync('leaderboard.json', JSON.stringify(leaderboardData, null, 2));
          
          res.status(201).json({ message: 'Score submitted successfully' });
        }
        break;
        
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
    
    // Operation completed successfully
    callback(null);
  } catch (error) {
    console.error(`Error in queue operation: ${error.message}`);
    // If we haven't sent a response yet, send an error response
    if (!task.res.headersSent) {
      task.res.status(500).json({ error: 'Server error processing request' });
    }
    callback(error);
  }
});

// Route to get leaderboard data
app.get('/api/leaderboard', (req, res) => {
  // Add this request to the queue
  fileQueue.push({
    operation: 'getLeaderboard',
    res: res
  });
});

// Route to check if user exists
app.get('/api/user/:employeeId', (req, res) => {
  // Add this request to the queue
  fileQueue.push({
    operation: 'checkUser',
    data: { employeeId: req.params.employeeId },
    res: res
  });
});

// Route to submit a new score
app.post('/api/scores', (req, res) => {
  const newScore = req.body;
  
  // Add timestamp
  newScore.date = new Date().toISOString();
  
  // Add this request to the queue
  fileQueue.push({
    operation: 'addScore',
    data: newScore,
    res: res
  });
});

// Queue error handling
fileQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

// Start server
app.listen(PORT, () => {
  console.log(`CST Quiz Server running on port ${PORT}`);
  console.log(`Using Queue System for file operations`);
  console.log(`Visit http://localhost:${PORT} to take the CST Quiz!`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  // Wait for queue to finish processing
  fileQueue.destroy(() => {
    console.log('Queue has been properly shut down');
    process.exit(0);
  });
  
  // Force exit after 3 seconds if queue doesn't shut down properly
  setTimeout(() => {
    console.log('Forced shutdown after timeout');
    process.exit(1);
  }, 3000);
});