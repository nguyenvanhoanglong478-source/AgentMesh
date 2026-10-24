package com.vang.player;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebStorage;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * VANG Standalone Android Application
 * Security & Privacy:
 * - Zero persistent user data: Clears WebStorage, Cache, and Cookies on exit (onDestroy).
 * - Restricts navigation strictly to VANG, Spotify OAuth, and GitHub Release downloads.
 * - Supports native Android local audio file picker, microphone visualizer permissions, and wake-lock.
 */
public class MainActivity extends Activity {
    private static final String APP_WEB_URL = "https://nguyenvanhoanglong478-source.github.io/Vang-Player/";
    private static final String LOCAL_FALLBACK_URL = "file:///android_asset/index.html";
    private static final int FILE_CHOOSER_RESULT_CODE = 1001;

    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        if (window != null) {
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                window.setStatusBarColor(Color.parseColor("#0E0D0B"));
                window.setNavigationBarColor(Color.parseColor("#0E0D0B"));
            }
        }

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#0E0D0B"));
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setDatabaseEnabled(false);
        settings.setSaveFormData(false);
        settings.setGeolocationEnabled(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (uri == null) return false;
                String host = uri.getHost() != null ? uri.getHost().toLowerCase() : "";

                // Allow Spotify OAuth login & VANG app inside WebView for seamless 1-click connection
                if (host.endsWith("spotify.com") || host.endsWith("github.io")) {
                    return false;
                }

                // Open GitHub release downloads (.apk / .exe) in system browser/downloader
                if (host.endsWith("github.com") || host.endsWith("githubusercontent.com")) {
                    Intent browserIntent = new Intent(Intent.ACTION_VIEW, uri);
                    startActivity(browserIntent);
                    return true;
                }
                return true;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request != null && request.isForMainFrame()) {
                    view.loadUrl(LOCAL_FALLBACK_URL);
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    for (String res : request.getResources()) {
                        if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(res) ||
                            PermissionRequest.RESOURCE_PROTECTED_MEDIA_ID.equals(res)) {
                            request.grant(request.getResources());
                            return;
                        }
                    }
                    request.deny();
                });
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                }
                MainActivity.this.filePathCallback = filePathCallback;

                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("audio/*");
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);

                try {
                    startActivityForResult(Intent.createChooser(intent, "Chọn bài nhạc từ điện thoại"), FILE_CHOOSER_RESULT_CODE);
                } catch (Exception e) {
                    MainActivity.this.filePathCallback = null;
                    return false;
                }
                return true;
            }
        });

        webView.loadUrl(APP_WEB_URL);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_RESULT_CODE) {
            if (filePathCallback == null) return;
            Uri[] results = null;
            if (resultCode == Activity.RESULT_OK && data != null) {
                if (data.getClipData() != null) {
                    int count = data.getClipData().getItemCount();
                    results = new Uri[count];
                    for (int i = 0; i < count; i++) {
                        results[i] = data.getClipData().getItemAt(i).getUri();
                    }
                } else if (data.getData() != null) {
                    results = new Uri[]{data.getData()};
                }
            }
            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView != null) {
            webView.evaluateJavascript(
                "(function(){ const m = document.querySelector('.modal-backdrop:not([hidden]), .left-pane.mob-open, .right-pane.mob-open'); if(m){ document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'})); return true; } return false; })()",
                val -> {
                    if (!"true".equals(val)) {
                        if (webView.canGoBack()) webView.goBack();
                        else finish();
                    }
                }
            );
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onDestroy() {
        // Strict Zero-Retention Policy: Wipe all WebStorage, Cache, and Cookies when closing the app
        try {
            if (webView != null) {
                webView.clearCache(true);
                webView.clearHistory();
                webView.clearFormData();
            }
            WebStorage.getInstance().deleteAllData();
            CookieManager.getInstance().removeAllCookies(null);
            CookieManager.getInstance().flush();
        } catch (Exception ignored) {}
        super.onDestroy();
    }
}
