const { createClient } = require('redis');
require('dotenv').config();
const client = createClient({
	socket: {
		legacyMode: true,
		host: process.env.REDIS_HOST,
		port: process.env.REDIS_PORT
	}
});
client
	.connect()
	.then(() => {
		console.log('Connected to Redis');
	})
	.catch((err) => {
		console.error('error in connect:', err);
	});

const seconds_in_minutes=60;	
const oneHourThreshold = process.env.ALLOWED_TIME_IN_MINUES * seconds_in_minutes * 1000;
const fiveMinutesThreshold = process.env.BLOCK_TIME_IN_MINUES * 1000;
// Sample user data
// const users = [ { username: 'shani', password: 'pass1' }, { username: 'user2', password: 'pass2' } ];

async function authMiddleware(req, res, next) {
	const session = req.session;
	if (!session || (session && !session.username)) {
		return next(); // Redirect to login page if not authenticated
	} else {
		
		const username = session.username;
		try {
			let user=await searchUserByUsername(username)
			
			if (!user) {
				await createNewUSer(session.loggedInTime,username);
			} else {
				if (user.allowAccess) {
					await handleBlockRequire(user)
				} else {
					let blockKey = `block:${username}`;
					let isBlocked = await client.get(blockKey);
					if (isBlocked) {
						console.log('still blocked for:', fiveMinutesThreshold);
						req.session.allowAccess = false;
					} else {
						user.allowAccess = true;
						await client.set(username, JSON.stringify(user));
						req.session.allowAccess = true;
					}
				}
			}
		} catch (error) {
			console.error(error);
		}
	}
	next();
}

async function handleDelete(req) {
	try {
		console.log(req.session);
		const deleteResult = await client.del(req.session.username);
		console.log(req.session);
	} catch (error) {
		throw error;
	}
}

async function searchUserByUsername(username){
	let user = await client.get(username);
	user = JSON.parse(user);
	console.log('found user:', user);
	return user;
}

async function createNewUSer(loggedInTimestemp,username){
	let newUserSession = {
		userName:username,
		loginTime: loggedInTimestemp,
		allowAccessTime: oneHourThreshold,
		allowAccess: true
	};
	await client.set(username, JSON.stringify(newUserSession));
}

async function handleBlockRequire(user){
	let now = new Date().getTime();
	let loggedInTime = user.loginTime;
	const timeDifference = now - loggedInTime;

	if (timeDifference > user.allowAccessTime) {
		console.log('need to block');
		user.allowAccess = false;
		let blockKey = `block:${user.username}`;
		await client.setEx(blockKey, fiveMinutesThreshold, 'block');
		await client.set(username, JSON.stringify(user));
	}
}

module.exports = { client, handleDelete, authMiddleware };
