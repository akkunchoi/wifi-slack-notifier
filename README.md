## Summary

This provides to send a text and update your profile icon on slack when you connect in your wifi network.

## Dependencies

- MacOS (launchctl, networksetup)
- node >= 8.x

## Install

    cp private.example.json private.json
    npm install
    launchctl load arrived.plist
    launchctl start akkunchoi.arrived

## Uninstall

    launchctl unload arrived.plist 
