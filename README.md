# My Meeting Rooms

<img align="right" width="64" height="64" src="./client/images/logo.png">

My Meeting Rooms is a simple meeting room reservation system built in Deno.  
Please visit [this site](http://mmrdocs.shinjl.com) for live demo.

## Build & Run

Make sure Deno and MongoDB are installed.

```
# Prepare .env and specify DB connection
cp .env.example .env

# Start the server
deno run --allow-env --allow-read=. --allow-write=. --allow-net --allow-plugin --unstable server/server.ts

# If you have installed denon, use the following command
denon start
```
