# matrix-privacy-policy-bot

[![TravisCI badge](https://travis-ci.org/turt2live/matrix-privacy-policy-bot.svg?branch=master)](https://travis-ci.org/turt2live/matrix-privacy-policy-bot)
[![#privacypolicybot:t2bot.io](https://img.shields.io/badge/matrix-%23privacypolicybot:t2bot.io-brightgreen.svg)](https://matrix.to/#/#privacypolicybot:t2bot.io)

A matrix bot to notify rooms about changes to a privacy policy that is hosted on Github. Purpose-built for t2bot.io's privacy policy: https://github.com/t2bot/privacy-policy

# Usage

1. Invite `@privacypolicy:t2bot.io` to a room
2. Wait for an update to the privacy policy
3. The bot should send a message to notify you of the changes

# Building your own

Assumptions:
* You're running Synapse
* Your privacy policy is on Github
* Some prior knowledge on how application services are installed

Instructions:
1. Create a new file named `appservice-privacy-policy.yaml` next to where you start synapse (usually near your homeserver configuration)
2. Put the following contents in that file. Be sure to use spaces, not tabs, for the file.
    ```yaml
    as_token: "SOME_RANDOM_STRING_YOU_MAKE"  # This is the asToken in the bot config
    hs_token: "ANOTHER_RANDOM_STRING_YOU_GENERATE"
    id: "privacy_policy"  
    url: null
    rate_limit: false   # This is intentional
    sender_localpart: "privacypolicy_bot" # Set this to something you can forget about
    namespaces:
      users:
        - exclusive: true
          regex: '@privacypolicy:t2bot.io' # This is the userId in the bot config
      rooms: []
      aliases: []
    ```
3. Add this configuration to your synapse configuration like so:
    ```yaml
    app_service_config_files: ["appservice-privacy-policy.yaml"]
    ```
4. Restart Synapse
5. Clone this repository
6. `npm install`
7. `npm run build`
8. Copy `config/default.yaml` to `config/production.yaml`
9. Edit `config/production.yaml`, being sure to populate the `asToken` and `userId`
10. Run the bot with `NODE_ENV=production node lib/index.js`

# Setting up the Github webhook

1. In your repository settings, go to the 'Add Webhook' page
2. For the `Payload URL` enter the public URL for your bot instance (eg: `https://mybot.domain.com/github`). The path (`/github` in the example) should match the `path` in the bot's configuration.
3. The `Content type` **must** be `application/json`
4. The `Secret` is something that you specify. The same value should be provided in the bot's configuration.
6. For the events to trigger, just the `push` event is fine. The bot will ignore everything else.
7. Make sure the webhook is active
8. Click `Add webhook`
