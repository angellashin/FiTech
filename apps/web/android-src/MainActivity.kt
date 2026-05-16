package com.fitech.app

import android.view.KeyEvent
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        // Capacitor's plugin registry is initialized inside BridgeActivity.onCreate,
        // so registration must happen after super.onCreate (otherwise the plugin
        // is silently dropped and JS never receives tap events).
        super.onCreate(savedInstanceState)
        registerPlugin(MediaButtonPlugin::class.java)
    }

    // Backup handler for wired earbuds that send direct KeyEvents to the activity
    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.action == KeyEvent.ACTION_DOWN) {
            val plugin = MediaButtonPlugin.instance
            if (plugin != null && plugin.handleTap(event.keyCode)) {
                return true
            }
        }
        return super.dispatchKeyEvent(event)
    }
}
