# 🤖 Auto-Join SUPËR-MD Group - Integration Guide

## Overview
The autojoiner module (`lib/autojoin.js`) handles automatic joining of your SUPËR-MD WhatsApp group when the bot connects.

## How to Integrate

### Step 1: At the top of `index.js`, add the require statement:
```javascript
const autoJoin = require('./lib/autojoin');
```

### Step 2: In the `connection.update` event handler, when connection === 'open', add:
```javascript
// In the connection.update event, when connection === 'open':
if (connection === 'open') {
    // ... existing code ...
    
    // Auto-join SUPËR-MD group
    await autoJoin.initAutoJoin(conn, console);
    
    // ... rest of code ...
}
```

## Configuration

The autojoin reads from your `config.js`:
```javascript
GROUP_LINK: process.env.GROUP_LINK || 'https://chat.whatsapp.com/Dacry0edw3jC7vZCOcOaxE?s=cl&p=a&ilr=0&amv=2'
```

### To set your GROUP_LINK:

**For local setup:**
Edit `config.js`:
```javascript
GROUP_LINK: process.env.GROUP_LINK || 'https://chat.whatsapp.com/YOUR_GROUP_CODE',
```

**For Heroku:**
```bash
heroku config:set GROUP_LINK='https://chat.whatsapp.com/YOUR_GROUP_CODE'
```

**For Koyeb:**
Add to `koyeb.yaml`:
```yaml
env:
  - key: GROUP_LINK
    value: 'https://chat.whatsapp.com/YOUR_GROUP_CODE'
```

## Features

✅ Automatically joins your SUPËR-MD group when bot connects  
✅ Sends welcome message to the group  
✅ Handles various error scenarios gracefully  
✅ Checks if already a member (no errors)  
✅ Provides detailed logging for debugging  

## Available Functions

### 1. `initAutoJoin(conn, logger)`
- **Description:** Initialize auto-join when connection is open
- **Parameters:**
  - `conn`: WhatsApp connection instance
  - `logger`: Logger object (optional, defaults to console)
- **Returns:** Boolean (true if successful)

```javascript
const success = await autoJoin.initAutoJoin(conn);
```

### 2. `isInSUPËR-MDGroup(conn)`
- **Description:** Check if bot is in any group
- **Parameters:** `conn` - WhatsApp connection instance
- **Returns:** Boolean

```javascript
const inGroup = await autoJoin.isInSUPËR-MDGroup(conn);
```

### 3. `forceRejoin(conn)`
- **Description:** Force reconnection to the group
- **Parameters:** `conn` - WhatsApp connection instance
- **Returns:** Boolean

```javascript
await autoJoin.forceRejoin(conn);
```

## Troubleshooting

### "No valid GROUP_LINK found"
- Check your `config.js` or environment variables
- Make sure GROUP_LINK is set correctly

### "Invalid GROUP_LINK format"
- GROUP_LINK must be: `https://chat.whatsapp.com/Dacry0edw3jC7vZCOcOaxE?s=cl&p=a&ilr=0&amv=2`
- Don't include extra parameters

### "Already a member"
- Bot successfully joined but was already a member
- This is normal behavior (not an error)

### "Group has been suspended"
- Contact WhatsApp support to unsuspend the group
- Update GROUP_LINK to a different active group

### "Invalid or expired invite link"
- Generate a new invite link from your group settings
- Update GROUP_LINK configuration

## Commands

You can also manually join groups:

```
.join <group_link>     - Join a group from invite link
.joingroup <link>      - Join any WhatsApp group (owner only)
.autojoin test         - Test autojoin with current GROUP_LINK
```

## Logs

Check console for autojoin status:
- ✅ `Successfully joined NYX group from GROUP_LINK`
- ℹ️ `Already a member of the NYX group`
- ⚠️ `Invalid GROUP_LINK format`
- ❌ `Failed to join` (with reason)

---

**Need help?** Check that:
1. GROUP_LINK is correctly set in config
2. Connection is established (connection === 'open')
3. Bot account isn't banned/suspended
4. Group link is valid and not expired
