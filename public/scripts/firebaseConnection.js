var firebaseConnection = this;
var firebaseRef = new Firebase('https://nhughes.firebaseio.com/webRTC');
var self = this;

self.init = function() {
	var usersRef = firebaseRef.child('users');
	myId = "anonymous-" + Math.random().toString(36).slice(2);
	usersRef.child(myId).set({name: 'Anonymous'});
	usersRef.child(myId).onDisconnect().remove();
	// self.getOtherUser();
};
self.init();

self.watchForChange = function(targetRef, change, callback) {
	targetRef.on(change, function(ss){
		if(ss.val() && myId && ss.name() !== myId) {
		  callback(ss);
		}
	});
};

self.pushToFirebase = function(targetRef, object) {
	targetRef.update(object);
};

self.getOtherUser = function(callback) {
	firebaseRef.child('users').once('value', function(ss) {
		ss.forEach(function(userSnapshot) {
			// console.log(userSnapshot.name());
			if(userSnapshot.val() && myId && userSnapshot.name() !== myId) {
				// console.log('returning usersnapshot');
				callback(userSnapshot.name());
			}
		});
	});
};
