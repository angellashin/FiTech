package com.fitech.app

import android.view.KeyEvent
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        // BridgeActivity.onCreate runs super.onCreate and THEN load(), where
        // load() constructs the Bridge from the initialPlugins list that
        // registerPlugin() appends to. So registration must happen BEFORE
        // super.onCreate, otherwise the Bridge is built with an empty plugin
        // list and JS sees "MediaButton plugin not implemented on android".
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
