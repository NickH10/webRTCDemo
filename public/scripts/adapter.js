var RTCPeerConnection = null;
var getUserMedia = null;
var webrtcDetectedBrowser = null;
var iceServer = null;

function trace(text) {
  // This function is used for logging.
  if (text[text.length - 1] == '\n') {
    text = text.substring(0, text.length - 1);
  }
  console.log((performance.now() / 1000).toFixed(3) + ": " + text);
}

if (navigator.mozGetUserMedia) {

  webrtcDetectedBrowser = "firefox";
  iceServer = {"iceServers":[{ "url": "stun:stun.services.mozilla.com" }]};

  // The RTCPeerConnection object.
  RTCPeerConnection = mozRTCPeerConnection;

  // The RTCSessionDescription object.
  RTCSessionDescription = mozRTCSessionDescription;

  // The RTCIceCandidate object.
  RTCIceCandidate = mozRTCIceCandidate;

  // Get UserMedia (only difference is the prefix).
  // Code from Adam Barth.
  getUserMedia = navigator.mozGetUserMedia.bind(navigator);

} else if (navigator.webkitGetUserMedia) {
  webrtcDetectedBrowser = "chrome";
  iceServer = {"iceServers": [{ "url": "stun:stun.l.google.com:19302" }]};

  // The RTCPeerConnection object.
  RTCPeerConnection = webkitRTCPeerConnection;

  // Get UserMedia (only difference is the prefix).
  // Code from Adam Barth.
  getUserMedia = navigator.webkitGetUserMedia.bind(navigator);

} else {
  console.log("Browser does not appear to be WebRTC-capable");
}