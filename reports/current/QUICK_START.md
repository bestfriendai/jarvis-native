# Quick Start Guide

Get Jarvis Mobile running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- npm installed
- claude-dash backend running on `localhost:800`

## Step 1: Install Dependencies

```bash
cd /mnt/d/claude\ dash/jarvis-native
npm install
```

## Step 2: Configure Backend URL

For Android Emulator, update `/src/constants/config.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__ ? 'http://10.0.2.2:800' : 'https://your-backend.com',
  // ...
};
```

For iOS Simulator or physical device on same network:

```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__ ? 'http://localhost:800' : 'https://your-backend.com',
  // Or use your computer's local IP: 'http://192.168.1.XXX:800'
  // ...
};
```

## Step 3: Start Expo

```bash
npm start
```

This opens the Expo DevTools in your browser.

## Step 4: Run on Device/Emulator

Choose one:

### Option A: iOS Simulator (Mac only)

Press `i` in the terminal or click "Run on iOS simulator" in Expo DevTools.

### Option B: Android Emulator

1. Start Android emulator first
2. Press `a` in the terminal or click "Run on Android emulator"

### Option C: Physical Device

1. Install "Expo Go" app from App Store or Google Play
2. Scan QR code shown in terminal or Expo DevTools
3. App will load on your device

## Step 5: Test the App

### Without Backend (UI Only)

If the backend isn't ready yet, you can still test the UI:

1. Try navigating between screens
2. Fill out the login form (it will fail without backend)
3. Explore the placeholder screens

### With Backend Running

1. Make sure claude-dash is running: `cd /mnt/d/claude\ dash/claude-dash && npm run dev`
2. Follow the [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md) guide to add JWT auth
3. Register a new account in the app
4. Log in
5. Try the AI Chat screen

## Common Issues

### Can't connect to backend

**Error:** Network request failed

**Solution:**
- Verify backend is running on port 800
- For Android emulator, use `http://10.0.2.2:800`
- For iOS/physical device, use your computer's local IP
- Check firewall settings

### Build errors

**Error:** Module not found

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npm start -- --clear
```

### Expo Go crashes

**Error:** App crashes on launch

**Solution:**
- Check Expo Go app is updated
- Try running on emulator/simulator instead
- Check terminal for error messages

## Development Workflow

### Making Changes

1. Edit files in `src/`
2. App hot-reloads automatically
3. Check terminal for errors
4. Test on device/emulator

### Adding a New Screen

1. Create screen in `src/screens/`
2. Add to navigation in `src/navigation/MainNavigator.tsx`
3. Create API service if needed in `src/services/`

### Testing API Integration

1. Check Network tab in Expo DevTools
2. Use `console.log()` statements
3. Check terminal output

## Next Steps

- [README.md](./README.md) - Full documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md) - Backend setup guide

## Keyboard Shortcuts

When Expo is running:

- `r` - Reload app
- `m` - Toggle menu
- `d` - Open developer menu
- `i` - Run on iOS simulator
- `a` - Run on Android emulator
- `w` - Run on web

## Support

For issues or questions, check:
1. Terminal output for errors
2. Expo documentation: https://docs.expo.dev
3. React Navigation docs: https://reactnavigation.org

---

**You're all set!** The app should now be running on your device or emulator.
