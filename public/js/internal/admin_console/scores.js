let localData;
let rounds, teams;
firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		if(user.email !== "admin.mathbowl@brandongong.org") {
			window.location = "../dashboard/index.html";
		}
		firebase.database().ref('/rounds').once('value').then((snap) => {
			rounds = snap.val();
			if(rounds) {
				for(let roundID of Object.keys(rounds)) {
					document.getElementById("roundselect").innerHTML += `<option value="${roundID}">${rounds[roundID]["name"]}</option>`;
				}
			}
			firebase.database().ref('/teams').once('value').then((snap) => {
				teams = snap.val();
				if(teams) {
					for(let teamID of Object.keys(teams["names"])) {
						document.getElementById("teamselect").innerHTML += `<option value="${teamID}">${teams["names"][teamID]}</option>`;
					}
				}
				firebase.database().ref('/scores').on('value', (snap) => {
					localData = snap.val();
					buildCards();
				});
			});
		});
	} else {
		window.location = "../login.html";
	}
});

function buildCards() {
	let ih = "";
	let filterTeam = document.getElementById("teamselect").value;
	let filterRound = document.getElementById("roundselect").value;
	if(localData) {
		for(let matchID of Object.keys(localData)) {
		if(filterTeam !== "none") {
			if( !(localData[matchID]["t1"] === filterTeam || localData[matchID]["t2"] === filterTeam) ) continue;
		}
		if(filterRound !== "none") {
			if( !(localData[matchID]["roundID"] === filterRound) ) continue;
		}
		ih += `
			<div class="card" id="${matchID}">
				<div class="hbox">
					<div class="abbrev-score-group">
						<div class="abbrev">${teams["abbrev"][localData[matchID]["t1"]]}</div>
						<input type="text" value="${localData[matchID]["s1"]}" class="score" onchange="resubmitScore('${matchID}')">
					</div>
					<div class="vs">vs.</div>
					<div class="abbrev-score-group">
						<div class="abbrev">${teams["abbrev"][localData[matchID]["t2"]]}</div>
						<input type="text" value="${localData[matchID]["s2"]}" class="score" onchange="resubmitScore('${matchID}')">
					</div>
				</div>
				${(rounds[localData[matchID]["roundID"]] !== undefined) ? rounds[localData[matchID]["roundID"]]["name"] : "N/A"}
			</div>`;
		}
	}
	if(!ih) {
		ih = `<div style="font-family: 'Jost Italic', Arial, Helvetica, sans-serif; color: #aaa; font-size: 20px; font-weight: 200; margin-top: 30px;">No matches found</div>`;
	}
	document.getElementById("scores-container").innerHTML = ih;
}

function resubmitScore(matchID) {
	let t1Score = document.getElementById(matchID).getElementsByTagName("input")[0].value;
	let t2Score = document.getElementById(matchID).getElementsByTagName("input")[1].value;
	t1Score = parseInt(t1Score);
	t2Score = parseInt(t2Score);
	let updates = {};
	if(t1Score !== NaN) updates["/scores/"+matchID+"/s1"] = t1Score;
	if(t2Score !== NaN) updates["/scores/"+matchID+"/s2"] = t2Score;
	firebase.database().ref().update(updates);
}

function triggerNew() {
	document.getElementById("tint").style.backgroundColor = 'rgba(0,0,0,0.2)';
	document.getElementById("tint").style.pointerEvents = 'auto';
	document.getElementById("tint").innerHTML = `
	<div id="addcard">
		<div id="cardHeader">Record new score</div>
		Team 1:
		<select id="addnew-t1">
			<option value="" disabled selected>Select a Team</option>
		</select>
		<br>
		Team 2:
		<select id="addnew-t2">
			<option value="" disabled selected>Select a Team</option>
		</select>
		<br>
		Team 1 Score: <input type="text" class="addinput" placeholder="ex. 5" id="addnew-s1">
		<br>
		Team 2 Score: <input type="text" class="addinput" placeholder="ex. 7" id="addnew-s2">
		<div id='options-group'>
			<a id='close' onclick='unload()'>⨉ Close</a>
			<a id='save' onclick='handleAddNew()'>Submit</a>
		</div>
	</div>`;

	for(let teamID of Object.keys(teams["names"])) {
		document.getElementById("addnew-t1").innerHTML += `<option value="${teamID}">${teams["names"][teamID]}</option>`;
		document.getElementById("addnew-t2").innerHTML += `<option value="${teamID}">${teams["names"][teamID]}</option>`;
	}
}

function handleAddNew() {
	let t1 = document.getElementById("addnew-t1").value;
	let s1 = parseInt(document.getElementById("addnew-s1").value);
	let t2 = document.getElementById("addnew-t2").value;
	let s2 = parseInt(document.getElementById("addnew-s2").value);
	if(!t1 || s1 === NaN || !t2 || s2 === NaN) return;
	if(t1 === t2) return;
	if(s1 === s2 && s1 === 0) return;
	
	let updates = {};
	let scorekey = firebase.database().ref().child('/scores').push().key;
	updates["/scores/"+scorekey] = {
		"roundID" : "n/a",
		"t1": t1,
		"t2": t2,
		"s1": s1,
		"s2": s2
	};
	firebase.database().ref().update(updates);
	unload();
}

function unload() {
	document.getElementById("tint").innerHTML = "";
	document.getElementById("tint").style.backgroundColor = 'rgba(0,0,0,0)';
	document.getElementById("tint").style.pointerEvents = 'none';
}

function clean() {
	firebase.database().ref("/scores").once("value").then((snap) => {
		if(!snap.val()) return;
		else {
			let toDelete = [];
			for(let roundID of Object.keys(snap.val())) {
				if(snap.val()[roundID]["s1"] === 0 && snap.val()[roundID]["s2"] === 0) toDelete.push(roundID);
			}
			for(let roundID of toDelete) {
				firebase.database().ref("/scores/"+roundID).remove();
			}
		}
	});
}