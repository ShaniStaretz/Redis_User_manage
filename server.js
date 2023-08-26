const express = require('express');
require('dotenv').config();
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { authMiddleware, handleDelete, client } = require('./redisMiddleware');
var bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const port = process.env.PORT || 3000;

app.use(
	session({
		store: new RedisStore({ client: client }),
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

app.get('/', authMiddleware, handleDashboard);
app.post('/login', handleLogin);
app.get('/logout', handleLogout);

async function handleDashboard(req, res) {
	const session = req.session;
	if (!session.allowAccess && session.username) {
		res.write(`<h1>hi ${session.username} </h1><br>`);
		res.write(`<h3>You are blocked from the system, and need to await 5 minutes</h3>`);
	} else if (session && session.username) {
		res.write(`<h1>Welcome ${session.username} </h1><br>`);
		res.write(`<h3>This is the Home page</h3>`);
		res.end('<a href=' + '/logout' + '>Click here to log out</a >');
		// }
	} else {
		console.info('no seesion in route');
		res.sendFile(__dirname + '/login.html');
	}
}

async function handleLogin(req, res) {
	try {
		console.log('recieve login request');
		const { username } = req.body;
		if(!username){
			throw {status:400, message:"messing username"}
		}
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
}


async function handleLogout(req, res) {
	try {
		if (req.session && req.session.username);
		await handleDelete(req);
		
		res.sendFile(__dirname + '/login.html');
	} catch (error) {
		console.error(error);
	}
}

app.listen(port, () => {
	console.log(`App listening on port ${port}`);
});
