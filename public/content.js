chrome.runtime.onMessage.addListener(
  (msg) => {
    window.postMessage(msg)
    // window.alert('got message')
  }
)