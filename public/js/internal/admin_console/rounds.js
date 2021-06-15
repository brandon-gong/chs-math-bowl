let isShowing;

let localData;

// todo consolidate if you can
function init() {
	isShowing = {};
}

firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		if(user.email !== "admin.mathbowl@brandongong.org") {
			window.location = "../dashboard/index.html";
		}
		firebase.database().ref('/').once('value').then(function(snap) {
			localData = snap.val();
			ready();
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

function toggleDrop(id) {
	if(isShowing[id] === undefined) {
		isShowing[id] = false;
		document.getElementById("dropdown-arrow-"+id).style.borderLeft = "8px solid transparent";
		document.getElementById("dropdown-arrow-"+id).style.borderTop = "7px solid black";
		document.getElementById("dropdown-content-"+id).style.display = "unset";
	} else if(isShowing[id]) {
		document.getElementById("dropdown-arrow-"+id).style.borderTop = "8px solid transparent";
		document.getElementById("dropdown-arrow-"+id).style.borderLeft = "7px solid black";
		document.getElementById("dropdown-content-"+id).style.display = "none";
	} else {
		document.getElementById("dropdown-arrow-"+id).style.borderLeft = "8px solid transparent";
		document.getElementById("dropdown-arrow-"+id).style.borderTop = "7px solid black";
		document.getElementById("dropdown-content-"+id).style.display = "unset";
	}
	isShowing[id] = !isShowing[id];
}

function triggerAdd() {
	document.getElementById("tint").style.backgroundColor = 'rgba(0,0,0,0.2)';
	document.getElementById("tint").style.pointerEvents = 'auto';
	document.getElementById("tint").innerHTML = 
			`<div class="card-plain">
			Add new round
			<div id="closeadd" onclick="unload()">×</div>
			<div id="add-options-container">
				<div class="card-plain" style="background-color: #9e1c43" onclick="triggerSimple()">
					<p>Add new simple round</p>
				</div>
				<div class="card-plain" style="background-color: black" onclick="triggerRobin()">
					<p>Generate new round robin</p>
				</div>
				<div class="card-plain" style="background-color: #ffbb00" onclick="triggerBracket()">
					<p>Create tournament bracket</p>
				</div>
			</div>
		</div>`;
}

function unload() {
	document.getElementById("tint").innerHTML = "";
	document.getElementById("tint").style.backgroundColor = 'rgba(0,0,0,0)';
	document.getElementById("tint").style.pointerEvents = 'none';
}

function triggerSimple() {
	document.getElementById("tint").innerHTML = `
			<div class="card-plain">
			Create simple round
			<div id="closeadd" onclick="unload()">×</div>
			<div class='input-group' style='flex-grow: 1'>
				<p style='margin-top: 10px; margin-right: 8px'>Round name:</p>
				<input id='roundname' placeholder='ex. Preliminary Round 1' type='text'>
			</div>
		</div>`;

	document.getElementById("roundname").addEventListener("keyup", function(k) {
		if(k.keyCode === 13) {
			k.preventDefault();
			if(document.getElementById("roundname").value.trim().length === 0) {
				return;
			}
			let key = firebase.database().ref().child('/rounds').push().key;
			if(!localData["rounds"]) localData["rounds"] = {};
			localData["rounds"][key] = {name: document.getElementById("roundname").value.trim(), started: false};
			document.getElementById("container").innerHTML += `
				<div id="round-droppable-${key}" class="round-droppable">
					<div id="dropdown-header-${key}" class="dropdown-header" onclick="toggleDrop('${key}')">
						<a id="dropdown-arrow-${key}" class="dropdown-arrow"></a>
						<h2>${localData["rounds"][key]["name"]}</h2>
					</div>
					<div id="dropdown-content-${key}" class="dropdown-content" style="display: none;">
						<div style="padding: 20px">
							<div class="card addcard" onclick="addMatch('${key}')">
								+ New match
							</div>
						</div>
					</div>
				</div>
				`;
			firebase.database().ref("/matches/"+key).on("value", function(snap) {
				if(localData["matches"] === undefined) localData["matches"] = {};
				localData["matches"][key] = snap.val();
				regenRoundCards(key);
			});
			unload();
		}
	});
}

function triggerRobin() {
	let teamSelect = "";
	let roomSelect = "";

	for(let tid of Object.keys(localData["teams"]["names"])) {
		teamSelect += `<input type="checkbox" id="cbt-use-${tid}" checked>${localData["teams"]["names"][tid]}<br>`;
	}

	for(let rid of Object.keys(localData["rooms"])) {
		if(localData["rooms"][rid]["number"] === undefined) continue;
		roomSelect += `<input type="checkbox" id="cbr-use-${rid}" checked>Room ${localData["rooms"][rid]["number"] + ((localData["rooms"][rid]["names"] != undefined && localData["rooms"][rid]["names"] != null) ? " ("+ localData["rooms"][rid]["names"] + ")" : "")}<br>`;
	}

	document.getElementById("tint").innerHTML = `
			<div class="card-plain">
			Create round robin
			<div id="closeadd" onclick="unload()">×</div>
			<div style="max-height: 500px; overflow-y: scroll; margin-top: 20px" id="rrchoicecontainer">
				<h4>Teams to include</h4>
				<form>
					${teamSelect}
					<div onclick="toggleallchecks(0)" class="invert-selection">Invert selection</div>
				</form>
				<h4>Rooms to include</h4>
				<form>
					${roomSelect}
					<div onclick="toggleallchecks(1)" class="invert-selection">Invert selection</div>
				</form>
				<div class='input-group' style='flex-grow: 1'>
					<p style='margin-top: 10px; margin-right: 8px'>Round name format:</p>
					<input style='margin-right: 15px' id='roundname' placeholder='ex. Preliminary Round {n}' type='text' value='Preliminary round {n}'>
				</div>
				<div id="rrgenbutton" onclick="genRounds()">Generate rounds</div>
			</div>
		</div>`;

}

function toggleallchecks(x) {
	Array.from(document.getElementsByTagName("form")[x].getElementsByTagName("input")).forEach(element => {
		element.checked = !element.checked;
	});
}

function genRR(rooms, teams) {

	let bye = -1; // can be anything but discourage strings because may cause clashes
	let result = [];
	let temp = [];
	let byed = false;

	if(teams.length % 2 === 1) {
		teams.push(bye);
		byed = true;
	}

	// crashes on this case so handle separately
	if(rooms.length === 0) return [];
		
	for(let i = 0; i < teams.length - 1; i++) {
			for(let j = 0; j < teams.length / 2; j++) {
					temp.push([teams[j], teams[teams.length - j - 1]]);
			}
			//temp.push("r");
			let x = teams.shift();
			teams.push(teams.shift());
			teams.unshift(x);
	}

	// temp = temp.filter((match) => {
	//   return localData["teams"]["names"][match[0]].substring(0, localData["teams"]["names"][match[0]].length - 1) !== localData["teams"]["names"][match[1]].substring(0, localData["teams"]["names"][match[1]].length - 1)});

	if(rooms.length <= teams.length / 2 - (byed ? 1 : 0)) {
		// strip all byed matches away and pad end with rests
		temp = temp.filter((match) => !match.includes(bye));
		for(let i = 0; i < temp.length % rooms.length; i++) temp.push(null);

		// now, collect all matches for each round in matrix
		// randomize matrix by rows/cols, and assign to rooms.
		for(let i = 0; i < temp.length; i += rooms.length) {
			let round = temp.slice(i, i + rooms.length);
			let j, x, k;
			for (k = round.length - 1; k > 0; k--) {
				j = Math.floor(Math.random() * (k + 1));
				x = round[k];
				round[k] = round[j];
				round[j] = x;
			}
			for(k = 0; k < round.length; k++) {
				let a,b;
				if(round[k] == null) round[k] = [rooms[k], null];
				else {
					if(Math.random() >= 0.5) {
						a = round[k][0];
						b = round[k][1];
					} else {
						a = round[k][1];
						b = round[k][0];
					}
					round[k] = [rooms[k], a, b];
				}
			}
			result.push(round);
		}
	} else {
		// some kind of overemployment happening
		// still don't want byes
		temp = temp.filter((match) => !match.includes(bye));

		let restIndex = 0;
		let rSize = teams.length / 2 - (byed ? 1 : 0);
		let dRest = rooms.length - rSize;

		for(let i = 0; i < temp.length; i+= rSize) {
			let round = temp.slice(i, i + rSize);
			let j, x, k;
			for (k = round.length - 1; k > 0; k--) {
				j = Math.floor(Math.random() * (k + 1));
				x = round[k];
				round[k] = round[j];
				round[j] = x;
			}

			for(let j = 0; j < dRest; j++) {
				round.splice((restIndex+j) % (rSize+dRest), 0, null);
			}
			restIndex += dRest;

			for(k = 0; k < round.length; k++) {
				let a,b;
				if(round[k] == null) round[k] = [rooms[k], null];
				else {
					if(Math.random() >= 0.5) {
						a = round[k][0];
						b = round[k][1];
					} else {
						a = round[k][1];
						b = round[k][0];
					}
					round[k] = [rooms[k], a, b];
				}
			}
			result.push(round);
		}
	}
	return result;
}


function processTemplate(str, n) {
	let evals = str.match(/\{[^{}]*\}/g);
	let result = str;
	for(let e of evals) {
		let i = result.indexOf(e);
		let replacement = "";
		try {
			replacement = eval(e.substring(1, e.length - 1).replace(/[^0-9+*\-/()%.n]/g, ""));
		} catch(e) {
			replacement = n;
		}
		result = result.substring(0, i) + replacement + result.substring(i + e.length);
	}
	return result;
}


function genRounds() {

	let teams = [];
	let rooms = [];
	let tmplist = document.getElementById("rrchoicecontainer").getElementsByTagName("form")[0].getElementsByTagName("input");
	for(let i = 0; i < tmplist.length; i++) {
		if(tmplist[i].checked) teams.push(tmplist[i].id.substring(8));
	}
	tmplist = document.getElementById("rrchoicecontainer").getElementsByTagName("form")[1].getElementsByTagName("input");
	for(let i = 0; i < tmplist.length; i++) {
		if(tmplist[i].checked) rooms.push(tmplist[i].id.substring(8));
	}

	let titletotal = document.getElementById("roundname").value;
	if(!titletotal) titletotal = "Preliminary Round {n}";

	let matches = genRR(rooms, teams);
	let updates = {};
	for(let i = 0; i < matches.length; i++) {
		let key = firebase.database().ref("/rounds").push().key;
		updates["/rounds/"+key] = {name: processTemplate(titletotal, i+1), started: false};
		for(let j = 0; j < matches[0].length; j++) {
			if(matches[i][j].includes(null)) continue;
			else updates["/matches/"+key+"/"+matches[i][j][0]] =  {status: 0, t1: matches[i][j][1], t2: matches[i][j][2]};
		}
	}
	firebase.database().ref().update(updates, function(e) {
		if(e) {} else {
			firebase.database().ref('/').once('value').then(function(snap) {
				localData = snap.val();
				ready();
			});
		}
	});
	unload();
}

function addMatch(id) {
	document.getElementById("tint").style.backgroundColor = 'rgba(0,0,0,0.2)';
	document.getElementById("tint").style.pointerEvents = 'auto';
	let selectText = `<option value="" disabled selected>Select...</option>`;
	for(let tid of Object.keys(localData["teams"]["names"])) {
		selectText += `<option value="${tid}">${localData["teams"]["names"][tid]}</option>`;
	}
	let rooms = `<option value="" disabled selected>Select...</option>`;
	for(let rid of Object.keys(localData["rooms"])) {
		if(localData["rooms"][rid]["number"] === undefined) continue;
		rooms += `<option value="${rid}">${localData["rooms"][rid]["number"]}</option>`;
	}
	document.getElementById("tint").innerHTML = `
		<div class="card-plain" style="padding: 40px;">
		Add new match in ${localData["rounds"][id]["name"]}
			<div style="display: flex; flex-direction: row; align-items: center; font-size: 20px; margin-top: 30px">
					<select id="nt1">
						${selectText}
					</select>
					vs.
					<select id="nt2">
						${selectText}
					</select>
					in room
					<select style="text-align: unset; text-align-last: unset" id="nr">
						${rooms}
					</select>
				</div>
				<div id="closeadd" onclick="unload()">×</div>
				<div id="rrgenbutton" onclick="addMatchHandle('${id}')" style="margin: 20px 0px 0px 0px">Add</div>
		</div>
	`;
}

function addMatchHandle(id) {
	if(!(document.getElementById("nt1").value === "" && document.getElementById("nt2").value === "" && document.getElementById("nr").value === "")) {
		let updates = {};
		updates["/matches/"+id+"/"+document.getElementById("nr").value] = {status: 0, t1: document.getElementById("nt1").value, t2: 
		document.getElementById("nt2").value};

		firebase.database().ref("/rounds/"+id).once("value").then(function(snap) {
			if(!snap.exists()) {
				updates["/rounds/"+id] = {name: localData["rounds"][id]["name"], started: false};
				firebase.database().ref().update(updates);
			}
		});
		firebase.database().ref().update(updates);
	}
	unload();
}

function ready() {

	document.getElementById("container").innerHTML = "";
	if(localData["rounds"]) {
		for(let roundID of Object.keys(localData["rounds"])) {
			document.getElementById("container").innerHTML += `
					<div id="round-droppable-${roundID}" class="round-droppable">
						<div id="dropdown-header-${roundID}" class="dropdown-header" onclick="toggleDrop('${roundID}')">
							<a id="dropdown-arrow-${roundID}" class="dropdown-arrow"></a>
							<h2>${localData["rounds"][roundID]["name"]}</h2>
						</div>
						<div id="dropdown-content-${roundID}" class="dropdown-content" style="display: none;">
							<div style="padding: 20px">
								<div class="card addcard" onclick="addMatch('${roundID}')">
									+ New match
								</div>
							</div>
						</div>
					</div>
					`;
		}
	for(let roundID of Object.keys(localData["rounds"])) {
			firebase.database().ref("/matches/"+roundID).on("value", function(snap) {
				if(localData["matches"] === undefined) localData["matches"] = {};
				localData["matches"][roundID] = snap.val();
				regenRoundCards(roundID);
			});
		}
	}
}

function regenRoundCards(roundID) {
	let statusTable = [["todo", "Waiting to begin"], ["now", "In progress"], ["done", "Completed"]];
	let tmpCards = "";

	if(localData["matches"] === undefined || localData["matches"][roundID] === undefined || localData["matches"] === null || localData["matches"][roundID] === null) {
		document.getElementById(`dropdown-content-${roundID}`).getElementsByTagName("div")[0].innerHTML =
				`<div class="card addcard" onclick="addMatch('${roundID}')">
					+ New match
				</div>`;
		return;
	}

	for(let room of Object.keys(localData["matches"][roundID])) {
		let teamsSelect = "";
		let teamsSelect1 = "";
		let roomsSelect = "";
		for(let r of Object.keys(localData["rooms"])) {
			if(localData["rooms"][r]["number"] === undefined) continue;
			roomsSelect += `<option value="${r}" ${(r == room) ? "selected" : ""}>${localData["rooms"][r]["number"]}</option>`;
		}
		for(let tid of Object.keys(localData["teams"]["names"])) {
			teamsSelect += `<option value="${tid}" ${(tid == localData["matches"][roundID][room]["t1"]) ? "selected" : ""}>${localData["teams"]["names"][tid]}</option>`;
		}
		for(let tid of Object.keys(localData["teams"]["names"])) {
			teamsSelect1 += `<option value="${tid}" ${(tid == localData["matches"][roundID][room]["t2"]) ? "selected" : ""}>${localData["teams"]["names"][tid]}</option>`;
		}

		tmpCards += `
			<div class="card" id="roundcard-${roundID}-${room}">
				<div style="display: flex; flex-direction: row; align-items: center;">
					<div id="status-circle-0" class="status-circle ${statusTable[localData["matches"][roundID][room]["status"]][0]}" title="${statusTable[localData["matches"][roundID][room]["status"]][1]}"></div>
					<select onchange="handleDdChange(['${roundID}','${room}',0])" id="select-dd-${roundID}-${room}-0">
							${teamsSelect}
					</select>
					vs.
					<select onchange="handleDdChange(['${roundID}','${room}',1])" id="select-dd-${roundID}-${room}-1">
							${teamsSelect1}
					</select>
					in room
					<select style="text-align: unset; text-align-last: unset" onchange="handleDdChange(['${roundID}','${room}',2])" id="select-dd-${roundID}-${room}-2">
							${roomsSelect}
					</select>
				</div>
				<a class="x" onclick="removeMatch('${roundID}', '${room}')">⨉</a>
			</div>
		`;
	}
	tmpCards += `<div class="card addcard" onclick="addMatch('${roundID}')">
								+ New match
							</div>`;
	document.getElementById(`dropdown-content-${roundID}`).getElementsByTagName("div")[0].innerHTML = tmpCards;
}

function handleDdChange(event) {
	let updates = {};
	if(event[2] === 2) {
		// transfer ownership
		let newRoom = document.getElementById(`select-dd-${event.join("-")}`).value;
		updates["/matches/"+event[0]+"/"+newRoom] = localData["matches"][event[0]][event[1]];
		firebase.database().ref("/matches/"+event[0]+"/"+event[1]).remove();
	} else {
		updates["/matches/"+event[0]+"/"+event[1]+"/"+["t1","t2"][event[2]]] = document.getElementById(`select-dd-${event.join("-")}`).value;
	}
	firebase.database().ref().update(updates);
}

function removeMatch(id,r) {
	firebase.database().ref("/matches/"+id+"/"+r).remove();

	// TODO if no matches remain, delete round in firebase but keep local div
	firebase.database().ref("/matches/"+id).once("value").then(function(snap) {
		if(!snap.exists()) firebase.database().ref("/rounds/"+id).remove();
	});
}