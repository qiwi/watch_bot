# watch_bot
Telegram bot that can eventually fetch data from user endpoint and send info about fetched data.

## Bot commands

### /auth <token>
Gives access to non-public commands (such as ``/start``).

### /start <endpoint>
Starts eventually sending GET requests to <endponint>, processing response and printing info to subscribed user.
Requests will include Authorization header (see config structure for credentials).

Response structure should be like:

```
{
  "result": {
    "message": "Your message",
    "entities": [
      {
        "meta": {
          "key": "value",
          "anotherKey": 123
        }
      },
      ...
    ]
}
```
 
### /stop
Stops sending requests.

## Usage

1. Clone this repo.
```
git clone git@github.com:qiwi/watch_bot.git
```
2. Make your own config in ``config/default.json`` or ``config/default.js``

```
{
  "general": {
    "defaultInterval": 10000,  // polling interval (ms)
    "botTGToken": "*", // bot telegram token - talk to @BotFather at telegram to get it
    "numVerboseErrors": 20 // bot will stop printing error message after numVerboseErrors errors in fetching data
  },
  "auth": {
    "method": "JWT", // Authorization header value: <method> <token>
    "token": "*" // Authorization header value: <method> <token>
  },
  "logger": {
    "logLevel": "debug"
  },
  "botAuth": {
    "token": "SomeTest" // see /auth command
  }
}
```

3. ``npm install``

4. ``npm run build``

5. ``node app``

## Docker
TODO
