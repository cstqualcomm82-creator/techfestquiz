const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/'))); // Serve static files


// Route to get leaderboard data
app.get('/api/leaderboard', (req, res) => {
  try {
    const leaderboardData = JSON.parse(fs.readFileSync('leaderboard.json', 'utf8'));

    // Sort scores by percentage, then by time
    leaderboardData.scores.sort((a, b) => {
      if (b.percentage !== a.percentage) {
        return b.percentage - a.percentage;
      }
      // Convert time (MM:SS) to seconds for comparison
      const timeA = a.timeTaken.split(':').reduce((acc, time) => (60 * acc) + +time);
      const timeB = b.timeTaken.split(':').reduce((acc, time) => (60 * acc) + +time);
      return timeA - timeB;
    });

    res.json(leaderboardData);
  } catch (error) {
    console.error('Error reading leaderboard:', error);
    res.status(500).json({ error: 'Failed to read leaderboard data' });
  }
});

// Route to check if user exists
app.get('/api/user/:employeeId', (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const leaderboardData = JSON.parse(fs.readFileSync('leaderboard.json', 'utf8'));
    
    const userExists = leaderboardData.scores.some(score => score.employeeId === employeeId);
    res.json({ exists: userExists });
  } catch (error) {
    console.error('Error checking user:', error);
    res.status(500).json({ error: 'Failed to check user' });
  }
});

// Route to submit a new score
app.post('/api/scores', (req, res) => {
  try {
    const newScore = req.body;
    
    // Add timestamp
    newScore.date = new Date().toISOString();
    
    // Read current leaderboard
    const leaderboardData = JSON.parse(fs.readFileSync('leaderboard.json', 'utf8'));
    
    // Check if user already exists
    const existingUserIndex = leaderboardData.scores.findIndex(
      score => score.employeeId === newScore.employeeId
    );
    
    if (existingUserIndex !== -1) {
      return res.status(400).json({ error: 'User has already submitted a score' });
    }
    
    // Add new score
    leaderboardData.scores.push(newScore);
    
    // Write updated leaderboard back to file
    fs.writeFileSync('leaderboard.json', JSON.stringify(leaderboardData, null, 2));
    
    res.status(201).json({ message: 'Score submitted successfully' });
  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});