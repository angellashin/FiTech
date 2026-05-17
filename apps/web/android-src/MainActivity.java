package com.fitech.app;

import android.os.Bundle;
import android.view.KeyEvent;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Must be before super.onCreate: BridgeActivity.onCreate calls load()
        // which builds the Bridge from initialPlugins. After that it's too late.
        registerPlugin(MediaButtonPlugin.class);
        registerPlugin(FiTechTTSPlugin.class);
        super.onCreate(savedInstanceState);
    }

    // Backup handler for wired earbuds that send direct KeyEvents to the activity
    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_DOWN) {
            MediaButtonPlugin plugin = MediaButtonPlugin.instance;
            if (plugin != null && plugin.handleTap(event.getKeyCode())) {
                return true;
            }
        }
        return super.dispatchKeyEvent(event);
    }
}
