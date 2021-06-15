async function login() {
	let userCredential = await firebase.auth()
		.signInWithEmailAndPassword(
			document.getElementById("username").value + ".mathbowl@brandongong.org",
			document.getElementById("password").value)
		.catch(function(error) {
			if(error.code === "auth/user-not-found") {
				document.getElementById("message").innerHTML = "Your username does not exist."
				document.getElementById("username").focus();
			} else if(error.code === "auth/wrong-password") {
				if(document.getElementById("password").value === "") {
					document.getElementById("message").innerHTML = "Please enter a password."
				} else {
					document.getElementById("message").innerHTML = "Double-check that password is entered correctly."
				}
				document.getElementById("password").focus();
			}
		});
	if(userCredential !== undefined) {
		if(userCredential.user.email === "admin.mathbowl@brandongong.org") {
			window.location = "admin-console/index.html"
		} else {
			window.location = "dashboard/index.html";
		}
	}
}