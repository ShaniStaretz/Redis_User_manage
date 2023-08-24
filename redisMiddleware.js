
const { redis, createClient } = require('redis');
const client = createClient({
	socket: {
		legacyMode: true,
		host: 'localhost', // Update with your Redis server's host
		port: 6379 // Update with your Redis server's port
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
//  // Create a Redis client
const oneHourThreshold = 1 * 60 * 1000;
const fiveMinutesThreshold = 1 *  1000;
// Sample user data
// const users = [ { username: 'shani', password: 'pass1' }, { username: 'user2', password: 'pass2' } ];


async function authMiddleware(req, res, next) {
	const session = req.session;
	console.log(session);
	if (!session || (session && !session.username)) {
		return next(); // Redirect to login page if not authenticated
	} else {
		console.log('session in authMiddleware:', session);
		const username = session.username;
		try {
			console.log('search user key');
			// let allowKey = `allow:${username}`;
			let user = await client.get(username);
			user=JSON.parse(user)
// user=JSON.parse()
			console.log('existUser:', user);
			// console.log('parsed:', parsed);
			// console.log('Object.keys(user):', Object.keys(user));

			if (!user) {
				let newUserSession={
					loginTime:session.loggedInTimestemp,
					allowAccessTime:oneHourThreshold,
					allowAccess:true
					
				}
				await client.set(username, JSON.stringify(newUserSession));
			} else {
				if(user.allowAccess){
					let now = new Date().getTime();
					let loggedInTime = user.loginTime;
					const timeDifference = now -loggedInTime;
					
					if (timeDifference > user.allowAccessTime) {
						console.log('need to block');
						user.allowAccess=false
						let blockKey = `block:${username}`;
						await client.setEx(blockKey, fiveMinutesThreshold, 'block');
						await client.set(username,JSON.stringify(user) );
					}
				}
				else{
					let blockKey = `block:${username}`;
					let isBlocked=	await client.get(blockKey);
					if(isBlocked){
						console.log("still blocked for:",fiveMinutesThreshold);
						req.session.allowAccess=false;
					}
					else{
						user.allowAccess=true
						await client.set(username,JSON.stringify(user) );
						req.session.allowAccess=true
					}
					
				}
				
			}
		} catch (error) {
			console.error(error);
		}
	}
	next();
}

module.exports = {  authMiddleware };

