package com.fitech.app

import android.view.KeyEvent
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        registerPlugin(MediaButtonPlugin::class.java)
        super.onCreate(savedInstanceState)
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
