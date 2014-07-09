var localStream, localPeerConnection, remotePeerConnection;
var mediaConstraints = {
	optional: [],
	mandatory: {
		// OfferToReceiveAudio: true,
		OfferToReceiveVideo: true
	}
};

window.onload = init;
function init(){
	var localVideo = document.getElementById("localVideo");
	var remoteVideo = document.getElementById("remoteVideo");

	getUserMedia({video:true}, setLocalStream,
		function(error) {
		  console.log("getUserMedia error: ", error);
		}
	);

	usersRef = new Firebase("https://nhughes.firebaseio.com/webRTC/users");
	firebaseConnection.watchForChange(usersRef, "child_added", offer);
	firebaseConnection.watchForChange(usersRef, "child_removed", endCall);
	firebaseConnection.watchForChange(usersRef.child(myId+'/offer'),"value", answer);
}

function setLocalStream(stream){
	localVideo.src = URL.createObjectURL(stream);
	localStream = stream;
}

function offer(snapshot) {
	if(localStream) {
		otherUserId = snapshot.name();
	    offerer = new RTCPeerConnection(iceServer);
	    offerer.addStream(localStream);

	    offerer.onicecandidate = function (event) {
	        if (!event || !event.candidate) return;
	        firebaseConnection.pushToFirebase(usersRef.child(otherUserId), {iceCandidate: event.candidate});
	        usersRef.child(myId).on('child_added', function(ss) {
	        	var candidate = ss.val();
	        	if(candidate && ss.name() === 'iceCandidate') {
	        		console.log(candidate);
	        		offerer.addIceCandidate(new RTCIceCandidate({
					    sdpMLineIndex: candidate.sdpMLineIndex,
					    candidate: candidate.candidate
					}));
					// usersRef.child(myId+'/iceCandidate').remove();
				}
	        });
	    };

	    offerer.onaddstream = function (event) {
	    	console.log('got video!', event);
		    if (!event) return;
		    remoteVideo.src = URL.createObjectURL(event.stream);
		};

	    offerer.createOffer(function (offer) {
	        offerer.setLocalDescription(offer);
	        firebaseConnection.pushToFirebase(usersRef.child(otherUserId), {offer: offer});
	        usersRef.child(myId).on('child_added', function(ss) {
	        	if(ss.val() && ss.name() === 'answer') {
		        	console.log(new RTCSessionDescription(ss.val()));
		        	offerer.setRemoteDescription(new RTCSessionDescription(ss.val()));
		        	// usersRef.child(myId+'/answer').remove();
		        }
	        });
	    }, handleError, mediaConstraints);

	}
	else {
		// console.log('hey turn on camera');
		setTimeout(function(){ offer(snapshot) }, 5000);
	}
}

function answer(snapshot) {
	if(localStream) {
		answerer = new RTCPeerConnection(iceServer);
		answerer.addStream(localStream);
		firebaseConnection.getOtherUser( function(otherUser) {
			answerer.setRemoteDescription(new RTCSessionDescription(snapshot.val()), function() {
				answerer.createAnswer(function(answer) {
					answerer.setLocalDescription(answer);
					firebaseConnection.pushToFirebase(usersRef.child(otherUser), {answer: answer});
					// usersRef.child(myId+'/offer').remove();
				}, handleError, mediaConstraints);
			});
		});
	}
	else {
		// console.log('hey turn on camera');
		setTimeout(function(){ answer(snapshot) }, 1000);
	}

    // answerer = new RTCPeerConnection(iceServer);
    // answerer.addStream(video_stream);

    // answerer.onicecandidate = function (event) {
    //     if (!event || !event.candidate) return;
    //     offerer.addIceCandidate(event.candidate);
    // };

    // answerer.onaddstream = function (event) {
    //     remoteVideo.src = URL.createObjectURL(event.stream);
    // };

    // answerer.setRemoteDescription(offer);
    // answerer.createAnswer(function (answer) {
    //     answerer.setLocalDescription(answer);
    //     offerer.setRemoteDescription(answer);
    // }, handleError, mediaConstraints);
}

function call() {
	console.log("Starting call");
	var servers = null;

	localPeerConnection = new RTCPeerConnection(servers);
	localPeerConnection.onicecandidate = setUpLocalIceCandidate;

	remotePeerConnection = new RTCPeerConnection(servers);
	remotePeerConnection.onicecandidate = setUpRemoteIceCandidate;
	remotePeerConnection.onaddstream = setUpRemoteStream;

	localPeerConnection.addStream(localStream);
	localPeerConnection.createOffer(setUpLocalDescription,handleError);
}

function setUpLocalDescription(description){
	localPeerConnection.setLocalDescription(description);
	console.log("Offer from localPeerConnection: \n" + description.sdp);
	remotePeerConnection.setRemoteDescription(description);
	remotePeerConnection.createAnswer(setUpRemoteDescription,handleError);
}

function setUpRemoteDescription(description){
	remotePeerConnection.setLocalDescription(description);
	console.log("Answer from remotePeerConnection: \n" + description.sdp);
	localPeerConnection.setRemoteDescription(description);
}


function setUpRemoteStream(event){
	remoteVideo.src = URL.createObjectURL(event.stream);
	console.log("Received remote stream");
}

function setUpLocalIceCandidate(event){
	if (event.candidate) {
		remotePeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
		console.log("Local ICE candidate: \n" + event.candidate.candidate);
	}
}

function setUpRemoteIceCandidate(event){
	if (event.candidate) {
		localPeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
		console.log("Remote ICE candidate: \n " + event.candidate.candidate);
	}
}


function endCall() {
	console.log("Ending call");
	if(localPeerConnection && remotePeerConnection) {
		localPeerConnection.close();
		remotePeerConnection.close();
		localPeerConnection = null;
		remotePeerConnection = null;
	}
	otherUserId = null;
}

function handleError(error){
	endCall();
	console.log("there was an error: ", error);
}