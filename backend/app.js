const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();

const port = process.env.PORT || 6500;
const host = process.env.HOST || "localhost";
const authRoutes = require('./routes/authRoutes');
const registryRoutes = require('./routes/registryRoutes');
const userRoutes = require('./routes/userRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const authenticateToken = require('./middleware/auth');

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
})
app.use('/api/auth', authRoutes);
app.use('/api/registry', registryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);

const initDb = require('./scripts/initDb');
const cronScripts = require('./scripts/cron');

app.listen(port, host, async () => {
    try {
        await initDb();
        cronScripts.initCron();
        console.log(`Server is running on port http://${host}:${port}`);
    } catch (err) {
        console.error('Failed to start server:', err);
    }
});