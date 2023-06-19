const express = require('express');
const session = require('express-session');
const redis = require('redis');
const connectRedis = require('connect-redis');
var bodyParser = require('body-parser');
var ip = require("ip");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

app.set('trust proxy', 1);
const RedisStore = connectRedis(session)

const primary_endpoint = process.env.PRIMARY_ENDPOINT;

//Configure redis client
const redisClient = redis.createClient({
  host: primary_endpoint,
  port: 6379
})

redisClient.on('error', function (err) {
  console.log('Could not establish a connection with redis. ' + err);
});
redisClient.on('connect', function (err) {
  console.log('Connected to redis successfully');
});

//Configure session middleware
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: 'secret_educative_string',
  resave: false,
  saveUninitialized: false,
  cookie: {
      secure: false,
      httpOnly: false,
      maxAge: 1000 * 60 * 10
  }
}))

const PORT = process.env.PORT || 3000;

app.get('/',(req, res) => {
  let form = `
  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #F3F3F3; font-family: Arial, sans-serif;">
    <form action="/set_custom_session" method="POST" style="margin-bottom: 20px;">
      <label for="customSession" style="color: #3498DB; font-size: 1.2em;">Enter custom session value:</label><br>
      <input type="text" id="customSession" name="customSession" style="margin-top: 10px; padding: 5px;"><br>
      <input type="submit" value="Submit" style="margin-top: 10px; padding: 5px; background-color: #2ECC71; border: none; color: white; cursor: pointer;">
    </form>
    <div style="color: #7F8C8D; margin-bottom: 20px;">
      Host IP: ${ip.address()}<br>
      Current custom session value: ${req.session.customSession}
    </div>
    <a href="/clear_custom_session" style="color: #E74C3C; text-decoration: none;">Clear Session</a>
  </div>`;
  
  res.send(form);
});

app.post('/set_custom_session',(req, res) => {
  const sessionObj = req.session;
  const { customSession } = req.body;
  sessionObj.customSession = customSession;

  res.send(`<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #F3F3F3; font-family: Arial, sans-serif;">
  <div style="color: #7F8C8D; margin-bottom: 20px;">
    Host IP: ${ip.address()}<br>
    Custom session has been saved successfully with value: ${sessionObj.customSession}
  </div>
  <a href="/" style="color: #3498DB; text-decoration: none;">Back</a>
  </div>`);
});

app.get('/clear_custom_session',(req, res) => {
  req.session.destroy();

  res.send(`<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #F3F3F3; font-family: Arial, sans-serif;">
  <div style="color: #7F8C8D; margin-bottom: 20px;">
    Host IP: ${ip.address()}<br>
    Custom session has been cleared successfully
  </div>
  <a href="/" style="color: #3498DB; text-decoration: none;">Back</a>
  </div>`);
});

app.listen(PORT, () => console.log('Server listening at port 3000'));
