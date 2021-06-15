function signOut() {
	firebase.auth().signOut().then(function() {
		window.location = "../login.html";
	}).catch(function(error) {});
}

let _user = null;
let localRounds = {};
let localMatches = {};
let localTeams = {};

firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		if(user.email === "admin.mathbowl@brandongong.org") {
			window.location = "../admin-console/index.html";
		} else {
			_user = user.email.split("\.")[0];

			firebase.database().ref("/rooms/"+_user).on('value', (snap) => {
				let rn = snap.val()["number"], ih = "";
				if(rn.toLowerCase().includes("room")) ih = rn;
				else ih = "Room " + rn;
				document.getElementsByTagName("h4")[0].innerHTML = ih;
			});
			firebase.database().ref("/rounds").on('value', (snap) => {localRounds = snap.val()});
			firebase.database().ref("/matches").on('value', (snap) => {
				localMatches = snap.val();
				localMatches = Object.fromEntries(Object.entries(localMatches).filter(([k,v]) => (v[_user] && v[_user]["status"] !== 2)));
				regenMatchCards();
			});
		}
	} else {
		window.location = "../login.html";
	}
});

function regenMatchCards() {
	firebase.database().ref("/teams/abbrev").once('value').then((snap) => {
		localTeams = snap.val();
		let ih = "";
		for(let i of Object.keys(localMatches)) {
			ih += `
				<div class="card listitem" onclick="renderMatch('${i}')">
					<div class="round-name-card">${localRounds[i]["name"]}</div>
					<div class="round-competitors-card">${localTeams[localMatches[i][_user]["t1"]]} vs. ${localTeams[localMatches[i][_user]["t2"]]}</div>
				</div>
			`;
		}
		ih += `
				<div class="card listitem" onclick="renderMatch('special')">
					<div class="round-name-card">Create special round</div>
					<div class="round-competitors-card">(Run custom match not in queue)</div>
				</div>
			`;
		document.getElementById("matches-list").innerHTML = ih;
	});
}

function renderMatch(roundID) {
	let pre = window.location.href;
	let iom = pre.match("index\.html").index;
	if(iom) window.location.href = pre.substring(0, iom)+"in_game.html?roundID="+roundID;
}
