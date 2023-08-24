const express = require('express');
require('dotenv').config();
const session = require('express-session');
const { redis, createClient } = require('redis');
const RedisStore = require('connect-redis').default;
const { authMiddleware } = require('./redisMiddleware');
var bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const port = process.env.PORT || 3000;

const redisClient = createClient({
	socket: {
		legacyMode: true,
		host: 'localhost', // Update with your Redis server's host
		port: 6379 // Update with your Redis server's port
	}
});

redisClient.on('error', (err) => {
	console.log('on error', err);
});

redisClient.on('ready', () => {
	console.log('Redis is ready');
});

redisClient.on('end', () => {
	console.log('Redis connection ended');
});

process.on('SIGINT', () => {
	redisClient.quit();
});

redisClient
	.connect()
	.then(() => {
		console.log('Connected to Redis');
	})
	.catch((err) => {
		console.console.error('error in connect:', err);
	});


app.use(
	session({
		store: new RedisStore({ client: redisClient }),
		secret: 'your_secret_key',
		resave: false,
		saveUninitialized: true,
		cookie: {
			secure: false, // if true only transmit cookie over https
			httpOnly: false, // if true prevent client side JS from reading the cookie
			maxAge: 1000 * 60 * 60 * 60 // session max age in miliseconds
		}
	}) // Continue with session management
);

// Sample user data
const users = [ { username: 'shani', password: 'pass1' }, { username: 'user2', password: 'pass2' } ];

app.get('/', authMiddleware, (req, res) => {
	const session = req.session;
	if (!session.allowAccess && session.username) {
		res.write(`<h1>hi ${session.username} </h1><br>`);
		res.write(`<h3>You are blocked from the system, and need to await 5 minutes</h3>`);
		res.end('<a href=' + '/logout' + '>Click here to log out</a >');
	} else if (session && session.username) {
		res.write(`<h1>Welcome ${session.username} </h1><br>`);
		res.write(`<h3>This is the Home page</h3>`);
		res.end('<a href=' + '/logout' + '>Click here to log out</a >');
		// }
	} else {
		console.info('no seesion in route');
		res.sendFile(__dirname + '/login.html');
	}
});

app.post('/login', (req, res) => {
	try {
		const session = req.session;
		console.log('recieve login request');
		const { username } = req.body;
		const user = users.find((u) => u.username === username);

		if (user) {
			console.info('found user');

			req.session.loggedInTimestemp = new Date().getTime();
			req.session.username = user.username;
			res.send('success');
		} else {
			throw { status: 404, message: 'failed' };
		}
	} catch (error) {
		console.error(error);
		if (error.status !== 404) {
			return res.status(500).send(error.message);
		}
		res.status(200).send(error.message);
	}
	// // Create a JWT token

	// // Store token in the session
	// req.session.token = token;
	// res.json({ message: 'Login successful', token });
});

// Dashboard route (protected)
app.get('/dashboard', (req, res) => {
	if (req.session.user) {
		res.send(`Welcome, ${req.session.user.username}! This is your dashboard.`);
	} else {
		res.redirect('/login');
	}
});

app.get('/logout', (req, res) => {
	console.log(req.session);
	redisClient.del(req.session.username).then(() => {
		req.session.destroy((err) => {
			if (err) {
				return console.log(err);
			}
			res.redirect('/');
		});
	});
});

app.listen(port, () => {
	console.log(`App listening on port ${port}`);
});
