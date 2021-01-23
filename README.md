# My Meeting Rooms

<img align="right" width="64" height="64" src="./client/images/logo.png">

My Meeting Rooms is a simple meeting room reservation system built in Deno.  
Please visit [this site](http://mmrdocs.shinjl.com) for live demo.

## Build & Run

Make sure Deno and MongoDB are installed.

### Initialize DB collections

From mongo shell execute the following command

```
-- Switch DB
use <dbname>;

-- Create Collections
db.createCollection("areas");
db.createCollection("rooms");
db.createCollection("reservations");
db.createCollection("news");
db.createCollection("users");
db.createCollection("user_history");
db.createCollection("reservation_history");
db.createCollection("cancellation_history");
db.createCollection("usage_rate");


-- Create Index
db.areas.createIndex({areaId: 1}, {unique: true});
db.rooms.createIndex({roomId: 1}, {unique: true});
db.reservations.createIndex({user: 1}, {unique: false});
db.reservations.createIndex({roomId: 1, from: 1, to: 1}, {unique: false});
db.users.createIndex({userId: 1}, {unique: true});
db.reservation_history.createIndex({roomId: 1}, {unique: true});
db.cancellation_history.createIndex({roomId: 1}, {unique: true});
db.usage_rate.createIndex({date: 1}, {unique: true});
```

### Prepare .env

```
# Copy .env.example and specify DB connection
cp .env.example .env
```

### Start the server

```
deno run --allow-env --allow-read=. --allow-write=. --allow-net --allow-plugin --unstable server/server.ts

# If you have installed denon, use the following command
denon start
```
