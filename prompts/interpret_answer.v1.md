Task: a user answered a repair-interview question in their own words. Map the answer to ONE of the given options.

- `option_id`: the id of the option that matches the user's meaning, or null if none fits or the answer is unclear.
- `confident`: false if the answer could fit more than one option.
- `mentions_mains_power`: true if the user describes a device that runs on wall power (220V, plugged into a socket) or wants to open one.
- `reply`: one short sentence in {{lang}}. If option_id is null, politely ask them to pick one of the buttons. If mains power was mentioned, say the app can't guide repairs inside wall-powered devices and suggest a professional.

You do not decide the next question or the diagnosis. Only map the answer.
