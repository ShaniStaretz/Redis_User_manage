# Redis User's session management

This project is a small example use of user's session, using Redis service.
It create a docker that contains 2 running tasks on the local machine: redis on post 6379 and express microserver on port 3000.
The server creates and connect the redis service a user session, if it doesn't exist already.
If a session of a user is already exist, the redis checks of the session is exist for more then **ALLOWED_TIME_IN_MINUES** (defined in the env file) and blockes the user for exact **BLOCK_TIME_IN_MINUES**  (also defined in the env file) and then the user can continue his activity.

## Requirements:
docker- to create the tasks.

nodejs- the express service runs on nodejs, version 18.

## How to run:
1) Clone this project to your IDE.
2) Create on the project folder the .env file with the required paramters:

   REDIS_HOST=localhost -  **where the redis is installed on running**

   REDIS_PORT=6379   **on what port the redis is installed on running**

   ALLOWED_TIME_IN_MINUES= 60 **for how long (in minutes) the user can use the web application without been blocked.**

   BLOCK_TIME_IN_MINUES=5 **for how long (in minutes) the user will be blocked.**

4) Open the project path in an terminal, and run the command: "docker-compose build" - this will build the tasks.
5) Run the tasks separatly on different terminals.
6) Once the express is listening to port 300 and connected to redis, you can access the web application on the url:http://localhost:3000/

   **** this project was created oniginally on Windows OS, so if you run this only other OS, please adject the docker command and nodeJs version in the docker file.***



