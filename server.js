const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// In-memory session store (replace with DB for production)
const sessions = {};

// Create a new session
app.post('/api/session', (req, res) => {
    const sessionId = uuidv4();
    sessions[sessionId] = req.body || {};
    res.json({ sessionId });
});

// Get session data
app.get('/api/session/:id', (req, res) => {
    const session = sessions[req.params.id];
    if (session) {
        res.json(session);
    } else {
        res.status(404).json({ error: 'Session not found' });
    }
});

// Update session data
app.put('/api/session/:id', (req, res) => {
    if (sessions[req.params.id]) {
        sessions[req.params.id] = req.body;
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Session not found' });
    }
});

// Delete session
app.delete('/api/session/:id', (req, res) => {
    if (sessions[req.params.id]) {
        delete sessions[req.params.id];
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Session not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Scrum Poker backend running on port ${PORT}`);
});
