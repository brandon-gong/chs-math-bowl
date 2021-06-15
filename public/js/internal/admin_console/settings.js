// table of greek
let greeks={"alpha":"α","beta":"β","gamma":"γ","delta":"δ","epsilon":"ε","zeta":"ζ","eta":"η","theta":"θ","iota":"ι","kappa":"κ","lambda":"λ","mu":"μ","nu":"ν","xi":"ξ","omicron":"ο","pi":"π","rho":"ρ","sigma":"σ","tau":"τ","upsilon":"υ","phi":"φ","chi":"χ","psi":"ψ","omega":"ω"};

firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		if(user.email !== "admin.mathbowl@brandongong.org") {
			window.location = "../dashboard/index.html";
		}
		let ih = "";
		firebase.database().ref('/rooms').once('value').then(function(snap) {
			for(let user of Object.keys(snap.val())) {
				let isDisabled = (snap.val()[user].number === undefined);
				ih += '<div class="card">' +
							'  <div class="user-header">' +
							'      <span id="greek_cardheader_' + user + '" class="greek" ' + ((isDisabled) ? 'style="color: #888"' : '') + '>' + greeks[user] + ' | ' + user +  ((isDisabled) ? ' (disabled)' : '') + '</span>' +
							// '      <a onclick=updateUserData(\"' + user + '\") class="write-changes" ' + ((isDisabled) ? 'style="background-color: #888"' : '') + '>Write changes</a>' +
							'  </div>' +
							'  <div class="inputs">' +
							'      <div style="width: 10px"></div>' +
							'    <div class="input-group" style="flex-grow: 4;">' +
							'      <p style="margin-top: 10px; margin-right: 8px;">Names:</p>' +
							'      <input id="names_' + user + '" placeholder="Names of the volunteers in this room to help you remember" type="text" value="' + ((snap.val()[user].names === undefined) ? "" : snap.val()[user].names) +'"  onchange=updateUserData(\"' + user + '\") >' +
							'    </div>' +
							'    <div style="width: 20px"></div>' +
							'    <div class="input-group" style="flex-grow: 1">' +
							'      <p style="margin-top: 10px; margin-right: 8px;">Room #:</p>' +
							'      <input id="number_' + user + '" placeholder="ex. 210" type="text" value="' + ((isDisabled) ? "" : snap.val()[user].number) +'" onchange=updateUserData(\"' + user + '\") >' +
							'    </div>' +
							'    <div style="width: 10px"></div>' +
							'  </div>' +
							'</div>';
			}
			document.getElementById("volcards").innerHTML = ih;
		});

	} else {
		window.location = "../login.html";
	}
});

function signOut() {
	firebase.auth().signOut().then(function() {
		window.location = "../login.html";
	}).catch(function(error) {});
}

function updateUserData(u) {

	let updates = {};
	updates["/rooms/" + u + "/names"] = (document.getElementById("names_" + u).value.trim()) ? (document.getElementById("names_" + u).value.trim()) : null;
	updates["/rooms/" + u + "/number"] = (document.getElementById("number_" + u).value.trim()) ? (document.getElementById("number_" + u).value.trim()) : null;
	return firebase.database().ref().update(updates);
}