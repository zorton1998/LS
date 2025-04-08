const express = require('express');
const { sessionMiddleware } = require('./middleware/auth');
const linkedInRoutes = require('./routes/linkedin');

const app = express();

// Middleware
app.use(express.json());
app.use(sessionMiddleware);

// Routes
app.use(linkedInRoutes);

// Error handling
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 