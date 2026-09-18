package com.lighttier.app

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : TauriActivity() {
  private var webViewRef: WebView? = null
  private var lastTopInset = 0
  private var lastBottomInset = 0

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
  }

  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    webViewRef = webView
    // edge-to-edge 下 WebView 延伸到系统栏下方，把系统栏安全区尺寸注入 CSS 变量，前端据此做 padding
    ViewCompat.setOnApplyWindowInsetsListener(webView) { _, insets ->
      val bars = insets.getInsets(
        WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
      )
      lastTopInset = bars.top
      lastBottomInset = bars.bottom
      injectSafeAreaInsets(webView)
      insets
    }
    // 首次 insets 分发早于页面加载完成，延迟多次补注入（幂等，值不变时写入无副作用）
    val handler = Handler(Looper.getMainLooper())
    for (delay in longArrayOf(300L, 1200L, 3000L)) {
      handler.postDelayed({ injectSafeAreaInsets(webView) }, delay)
    }
  }

  override fun onResume() {
    super.onResume()
    // 从后台返回（如系统设置里改变导航方式）时刷新一次
    val webView = webViewRef ?: return
    Handler(Looper.getMainLooper()).postDelayed({
      val bars = ViewCompat.getRootWindowInsets(webView)?.getInsets(
        WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
      )
      if (bars != null) {
        lastTopInset = bars.top
        lastBottomInset = bars.bottom
      }
      injectSafeAreaInsets(webView)
    }, 300L)
  }

  private fun injectSafeAreaInsets(webView: WebView) {
    // insets 为物理像素，需除以 devicePixelRatio 换算为 CSS px（否则高 DPI 机型会被放大数倍）
    val js = "if (document.documentElement) { var ltDpr = window.devicePixelRatio || 1;" +
      "document.documentElement.style.setProperty('--lt-safe-area-top', ${lastTopInset} / ltDpr + 'px');" +
      "document.documentElement.style.setProperty('--lt-safe-area-bottom', ${lastBottomInset} / ltDpr + 'px');}"
    webView.evaluateJavascript(js, null)
  }
}
