package uz.ekg10.app;

import android.app.Activity;
import android.app.Dialog;
import android.content.ContentValues;
import android.content.Context;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Message;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.*;
import android.widget.Toast;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends Activity {
    private WebView main, popup;
    private Dialog popupDialog;

    // Blob yuklab olishni va window.print ni Android'ga ulaydi
    private static final String JS =
        "(function(){if(window.__ekg)return;window.__ekg=1;" +
        "var c=HTMLAnchorElement.prototype.click;" +
        "HTMLAnchorElement.prototype.click=function(){var a=this;" +
        "if(a.download&&/^blob:/.test(a.href)){fetch(a.href).then(function(r){return r.blob()}).then(function(b){" +
        "var f=new FileReader();f.onloadend=function(){Android.save(a.download,b.type||'application/octet-stream',String(f.result).split(',')[1])};f.readAsDataURL(b)});return}" +
        "return c.apply(a,arguments)};" +
        "window.print=function(){Android.print()};})();";

    private WebView makeWebView() {
        WebView w = new WebView(this);
        WebSettings s = w.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setSupportMultipleWindows(true);
        s.setJavaScriptCanOpenWindowsAutomatically(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        w.addJavascriptInterface(new Bridge(w), "Android");
        w.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView v, String url) { v.evaluateJavascript(JS, null); }
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                String u = r.getUrl().toString();
                if (u.startsWith("file:") || u.startsWith("about:") || u.startsWith("blob:")) return false;
                try { startActivity(new android.content.Intent(android.content.Intent.ACTION_VIEW, r.getUrl())); } catch (Exception e) {}
                return true;
            }
        });
        w.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onCreateWindow(WebView v, boolean d, boolean g, Message msg) {
                closePopup();
                popup = makeWebView();
                popupDialog = new Dialog(MainActivity.this, android.R.style.Theme_Material_NoActionBar);
                popupDialog.setContentView(popup, new ViewGroup.LayoutParams(-1, -1));
                popupDialog.show();
                WebView.WebViewTransport t = (WebView.WebViewTransport) msg.obj;
                t.setWebView(popup); msg.sendToTarget();
                return true;
            }
            @Override public void onCloseWindow(WebView v) { closePopup(); }
        });
        return w;
    }

    private void closePopup() {
        if (popupDialog != null) { popupDialog.dismiss(); popupDialog = null; }
        if (popup != null) { popup.destroy(); popup = null; }
    }

    class Bridge {
        final WebView w;
        Bridge(WebView w) { this.w = w; }

        @JavascriptInterface public void save(String name, String mime, String b64) {
            try {
                byte[] data = Base64.decode(b64, Base64.DEFAULT);
                String safe = name.replaceAll("[\\\\/:*?\"<>|]", "_");
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues cv = new ContentValues();
                    cv.put(MediaStore.Downloads.DISPLAY_NAME, safe);
                    cv.put(MediaStore.Downloads.MIME_TYPE, mime);
                    cv.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                    Uri u = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                    try (OutputStream o = getContentResolver().openOutputStream(u)) { o.write(data); }
                } else {
                    File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                    dir.mkdirs();
                    try (FileOutputStream o = new FileOutputStream(new File(dir, safe))) { o.write(data); }
                }
                toast("Saqlandi: Yuklashlar/" + safe);
            } catch (Exception e) { toast("Saqlab bo'lmadi: " + e.getMessage()); }
        }

        @JavascriptInterface public void print() {
            runOnUiThread(() -> {
                PrintManager pm = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                pm.print("EKG-10", w.createPrintDocumentAdapter("EKG-10"), null);
            });
        }
    }

    private void toast(String m) { runOnUiThread(() -> Toast.makeText(this, m, Toast.LENGTH_LONG).show()); }

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setStatusBarColor(Color.parseColor("#101b2d"));
        getWindow().setNavigationBarColor(Color.parseColor("#0b1220"));
        main = makeWebView();
        main.setBackgroundColor(Color.parseColor("#0b1220"));
        setContentView(main);
        if (b != null) main.restoreState(b); else main.loadUrl("file:///android_asset/index.html");
    }

    @Override protected void onSaveInstanceState(Bundle b) { super.onSaveInstanceState(b); main.saveState(b); }

    @Override public void onBackPressed() {
        if (popupDialog != null) closePopup();
        else if (main.canGoBack()) main.goBack();
        else super.onBackPressed();
    }
}
