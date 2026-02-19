# Demo

Start the Trackr app on the iOS simulator with zero setup. Handles everything automatically.

## Steps

1. Check if port 8081 is in use. If so, kill the process occupying it (`lsof -ti:8081 | xargs kill -9`)
2. Check if `node_modules/` exists. If missing, run `npm install` first
3. Run `npm run ios` in the background to start Metro bundler + build the app + launch iOS simulator
4. Inform the user the app is starting and they can continue working

Do NOT ask for confirmation. Just do it.
