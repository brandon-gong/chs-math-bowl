function signOut() {
	firebase.auth().signOut().then(function() {
		window.location = "../login.html";
	}).catch(function(error) {});
}

firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		if(user.email !== "admin.mathbowl@brandongong.org") {
			window.location = "../dashboard/index.html";
		}
		firebase.database().ref('/displayMode').on('value', (snap) => {
			for(let elem of document.getElementById("wrapper").children) {
				elem.classList.remove("selected");
			}
			document.getElementById("option"+snap.val()).classList.add("selected");
		});
	} else {
		window.location = "../login.html";
	}
});

function select(x) {
	firebase.database().ref().update({"displayMode":x});
}