const express = require('express');
const session = require('express-session');
const redis = require('redis');
const connectRedis = require('connect-redis');
const bodyParser = require('body-parser');  // Required to parse POST requests

const RedisStore = connectRedis(session);

const HOST = process.env.REDIS_HOST || 'node-cluster.gcds8v.ng.0001.euw1.cache.amazonaws.com';
const PORT = process.env.REDIS_PORT || 6379;
const SECRET = process.env.SESSION_SECRET || 'default-secret';

const app = express();
const redisClient = redis.createClient({ host: HOST, port: PORT });

redisClient.on('error', (error) => {
  console.error(`Redis error: ${error}`);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis.');
});

redisClient.on('reconnecting', () => {
  console.log('Reconnecting to Redis...');
});

redisClient.on('end', () => {
  console.log('Redis connection closed.');
});

const sessionMiddleware = session({
  store: new RedisStore({ client: redisClient }),
  secret: SECRET,
  resave: false,
  saveUninitialized: false,
});

app.use(sessionMiddleware);
app.use(bodyParser.urlencoded({ extended: false }));

// Root route with form to get value
app.get('/', (req, res) => {
  res.send(`
    <form action="/store" method="post">
      <input type="text" name="value" placeholder="Enter a value" />
      <button type="submit">Save</button>
    </form>
    <br />
    <div>
      Stored value in Redis: ${req.session.value || 'No value stored yet.'}
    </div>
    <br />
    <a href="/clear-session">Clear Session</a>
  `);
});

// POST route to store value in Redis session
app.post('/store', (req, res) => {
  req.session.value = req.body.value;  // Store the value in Redis session
  res.redirect('/');  // Redirect back to root route
});

// Endpoint to clear the session
app.get('/clear-session', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Failed to clear session:", err);
      res.status(500).send('Failed to clear session');
      return;
    }
    res.redirect('/');
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const SERVER_PORT = 3000;
app.listen(SERVER_PORT, () => {
  console.log(`Server is running on port ${SERVER_PORT}`);
});
