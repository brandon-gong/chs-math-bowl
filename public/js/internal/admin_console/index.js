function startTime() {
	var today = new Date();
	var h = today.getHours();
	var m = today.getMinutes();
	var s = today.getSeconds();
	m = checkTime(m);
	s = checkTime(s);
	document.getElementById('time').innerHTML =
	h + ":" + m + ":" + s;
	var t = setTimeout(startTime, 500);
}
function checkTime(i) {
	if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
	return i;
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////


let localData;
let listenerPaths;
let numquestions;
let breakTiesWithTotalPoints;

firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		if(user.email !== "admin.mathbowl@brandongong.org") {
			window.location = "../dashboard/index.html";
		}
		firebase.database().ref('/').once('value').then(function(snap) {
			localData = snap.val();
			listenerPaths = [];
			listenerPaths2 = [];
			numquestions = 18;
			trs = [];
			tic = [0,0,0];
			rankTable = {};
			breakTiesWithTotalPoints = true;
			ready();
		});
	} else {
		window.location = "../login.html";
	}
});

function ready() {
	if(localData["rounds"]) {
		let ih = "";
		let isfirst = true;
		for(let roundID of Object.keys(localData["rounds"])) {
			ih += `<option value="rid-${roundID}" ${isfirst ? "selected" : ""}>${localData["rounds"][roundID]["name"]}</option>`;
			isfirst = false;
		}
		document.getElementById("rounds-optgroup").innerHTML = ih;
	}
	if(localData["teams"]) {
		let ih = "";
		for(let teamID of Object.keys(localData["teams"]["names"])) {
			ih += `<option value="tid-${teamID}">${localData["teams"]["names"][teamID]}</option>`;
		}
		document.getElementById("teams-optgroup").innerHTML = ih;
	}
	switchContext();
	prepareRounds();
	prepareRanks();
}

function switchContext() {

	for(let path of listenerPaths) firebase.database().ref(path).off();
	listenerPaths = [];

	let args = document.getElementsByTagName("select")[0].value;

	if(args.substring(0, 3) === "rid") {
		if(localData["matches"]) {
			let lblRooms = [];
			for(let roomName of Object.keys(localData["matches"][args.substring(4)])) {
				lblRooms.push("Room " + localData["rooms"][roomName]["number"]);
				if(localData["matches"][args.substring(4)][roomName]["score"]) numquestions = Math.max(numquestions, localData["matches"][args.substring(4)][roomName]["score"].length);
			}
			let lblQs = [];
			for(let i = 1; i <= numquestions; i++) {
				let label = "";
				if(i === numquestions - 2) label = "Tiebreaker 1";
				else if(i === numquestions - 1) label = "Tiebreaker 2";
				else if(i === numquestions) label = "Sudden Death";
				else label = "Question " + i;
				lblQs.push(label);
			}
			let squares = renderGrid(lblQs, lblRooms);

			for(let [idx, roomName] of Object.keys(localData["matches"][args.substring(4)]).entries()) {
				let t1name = localData["teams"]["names"][localData["matches"][args.substring(4)][roomName]["t1"]];
				let t2name = localData["teams"]["names"][localData["matches"][args.substring(4)][roomName]["t2"]];
				for(let m = 0; m < numquestions; m++) {
					let path = `/matches/${args.substring(4)}/${roomName}/score/${m}`;
					firebase.database().ref(path).on("value", (snap) => {
						
						if(!snap.val()) return;
						else if(snap.val() === 0) {
							squares[m][idx].style.backgroundColor = "#aaa";
							squares[m][idx].title = "Question has not been asked yet"
						} else if(snap.val() === 1) {
							squares[m][idx].style.backgroundColor = "#9e1c43";
							squares[m][idx].title = "Point awarded to " + t1name;
						} else if(snap.val() === 2) {
							squares[m][idx].style.backgroundColor = "#ffbb00";
							squares[m][idx].title = "Point awarded to " + t2name;
						} else if(snap.val() === 3) {
							squares[m][idx].style.backgroundColor = "#000000";
							squares[m][idx].title = "Neither team answered correctly";
						}
					});
					listenerPaths.push("path");
				}
			}
		} else {
			document.getElementById("grid").innerHTML = "<div class='undef margin-shim'>No matches in queue</div>";
		}
	} else if(args.substring(0,3) === "tid") {
		if(!localData["rounds"] || !localData["matches"]) {
			document.getElementById("grid").innerHTML = "<div class='undef margin-shim'>No matches in queue</div>";
			return;
		}
		let rounds = Object.keys(localData["matches"]);
		for(let roundID of Object.keys(localData["matches"])) {
			let keep = false;
			for(let _ of Object.keys(localData["matches"][roundID])) {
				if(localData["matches"][roundID][_]["t1"] === args.substring(4) || localData["matches"][roundID][_]["t2"] === args.substring(4)) {
					keep = true;
				}
				if(localData["matches"][roundID][_]["score"]) numquestions = Math.max(numquestions, localData["matches"][roundID][_]["score"].length);
			}
			if(!keep) rounds.filter(x => x !== roundID);
		}
		let roundN = [];
		for(let i = 0; i < rounds.length; i++) {
			roundN[i] = localData["rounds"][rounds[i]]["name"];
		}
		let lblQs = [];
		for(let i = 1; i <= numquestions; i++) {
			let label = "";
			if(i === numquestions - 2) label = "Tiebreaker 1";
			else if(i === numquestions - 1) label = "Tiebreaker 2";
			else if(i === numquestions) label = "Sudden Death";
			else label = "Question " + i;
			lblQs.push(label);
		}
		let squares = renderGrid(lblQs, roundN);
		for(let [idx, roundID] of rounds.entries()) {
			for(let _ of Object.keys(localData["matches"][roundID])) {
				if(localData["matches"][roundID][_]["t1"] === args.substring(4)) {
					for(let i = 0; i < numquestions; i++) {
						let path = `/matches/${roundID}/${_}/score/${i}`;
						firebase.database().ref(path).on("value", (snap) => {
							if(snap.val() === 1) {
								squares[i][idx].style.backgroundColor = "#9e1c43";
								squares[i][idx].title = "Point awarded";
							} else {
								squares[i][idx].style.backgroundColor = "#aaa";
								squares[i][idx].title = "Point not awarded";
							}
						});
						listenerPaths.push(path);
					}
				} else if(localData["matches"][roundID][_]["t2"] === args.substring(4)) {
					for(let i = 0; i < numquestions; i++) {
						let path = `/matches/${roundID}/${_}/score/${i}`;
						firebase.database().ref(path).on("value", (snap) => {
							if(snap.val() === 2) {
								squares[i][idx].style.backgroundColor = "#9e1c43";
								squares[i][idx].title = "Point awarded";
							} else {
								squares[i][idx].style.backgroundColor = "#aaa";
								squares[i][idx].title = "Point not awarded";
							}
						});
						listenerPaths.push(path);
					}
				}
			}
		}
	} else {
		if(args === "rankings") {
			drawRankTable();
		}
	}
}

function renderGrid(ml, nl) {
	let space = 4;
	let br = 2;
	let m = ml.length;
	let n = nl.length;
	//let squares = new Array(m).fill(new Array(n).fill(null));
	let squares = [];
	for(let i = 0; i < m; i++) squares.push([]);
	let margins = 30;

	let size = (document.getElementById("grid").clientWidth - margins*4 - (m - 1) * space - 100) / m;
	document.getElementById("grid").innerHTML = "";
	document.getElementById("leftlabels").innerHTML = "";
	document.getElementById("upperlabels").innerHTML = "";

	let fontSize = 12;

	let maxClientWidth = 0;
	for(let i = 0; i < n; i++) {
		let x = document.createElement("div");
		x.innerHTML = nl[i];
		x.style.cssText = `font-family:"Jost";font-size:${fontSize}px;left:${margins}px;top:${i*(size+space) + 0.5*size - 8.5}px;color:black;position:absolute`;
		document.getElementById("leftlabels").appendChild(x);
		if(x.clientWidth > maxClientWidth) maxClientWidth = x.clientWidth;
	}

	let upperlabelgap = size + space; // some gore to get the sizing right
	
	let maxClientHeight = 0;
	let maxClientWidth1 = 0;
	for(let i = 0; i < m; i++) {
		let x = document.createElement("div");
		x.innerHTML = ml[i];
		x.style.cssText = `font-family:"Jost";font-size:${fontSize}px;left:${margins + i*upperlabelgap+size/2 + maxClientWidth + 7 }px;color:black;transform:rotate(-45deg);transform-origin:top left;position:absolute`;
		document.getElementById("upperlabels").appendChild(x);
		if(x.clientHeight > maxClientHeight) maxClientHeight = x.clientHeight;
		if(x.clientWidth > maxClientWidth1) maxClientWidth1 = x.clientWidth;
		x.style.top = maxClientHeight + "px";
	}
	document.getElementById("upperlabels").style.height = maxClientHeight / Math.sqrt(2) + 25 +"px";

	for(let i = 0; i < m; i++) {
		for(let j = 0; j < n; j++) {
			squares[i][j] = document.createElement("div");
			squares[i][j].style.cssText = `width:${size}px; height:${size}px; background-color:#aaa; position:absolute; top:${j*(size + space)}px; left:${margins + maxClientWidth + 10 +i*(size + space)}px;`;
			document.getElementById("grid").appendChild(squares[i][j]);
		}
	}
	document.getElementById("grid").style.height = 2*margins + n*(space + size) - space + "px";

	return squares;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let trs = [];
let listenerPaths2 = [];
let tic = [];

function prepareRounds() {
	if(!localData["rounds"]) {
		// TODO display something actually useful here
		return;
	}
	for(let roundID of Object.keys(localData["rounds"])) {
		let x = document.createElement("tr");
		x.id = "row_" + roundID;
		x.innerHTML = `<td class="expand"></td><td class="ecol" ondblclick="toggleActive('${roundID}')"><div class="status-circle"></div></td>`;
		firebase.database().ref("/rounds/"+roundID+"/name").on("value", (snap) => {
			x.getElementsByClassName("expand")[0].innerHTML = snap.val();
		});
		firebase.database().ref("/rounds/"+roundID+"/started").on("value", (snap) => {
			if(snap.val()) {
				x.getElementsByClassName("status-circle")[0].style.backgroundColor = "green";
			} else {
				x.getElementsByClassName("status-circle")[0].style.backgroundColor = "#666";
			}
		});
		x.getElementsByClassName("expand")[0].addEventListener("click", () => handleSelect(roundID));
		document.getElementsByTagName("table")[0].appendChild(x);
		trs.push(x);
	}
	trs[0].getElementsByClassName("expand")[0].dispatchEvent(new Event("click"));
}

function handleSelect(roundID) {

	for(let path of listenerPaths2) firebase.database().ref(path).off();
	listenerPaths2 = [];

	for(let [idx,elem] of trs.entries()) {
		if(elem.id !== "row_"+roundID) {
			elem.style.setProperty("background-color", (idx % 2 === 0) ? "#eee": "#fff");
			elem.style.color = "black";
		} else {
			elem.style.setProperty("background-color", "#9e1c43", "important");
			elem.style.color = "white";
		}
	}
	tic = [0,0,0];

	if(!localData["matches"] || !localData["matches"][roundID]) {
		document.getElementById("piebox").innerHTML = "<div class='undef' style='margin-top: 0px'>No matches in queue</div>";
		return;
	}
	for(let roomName of Object.keys(localData["matches"][roundID])) {
		tic[localData["matches"][roundID][roomName]["status"]] += 1;
		firebase.database().ref("/matches/"+roundID+"/"+roomName+"/status").on("value", (snap) => {
			tic[localData["matches"][roundID][roomName]["status"]] -= 1;
			localData["matches"][roundID][roomName]["status"] = snap.val();
			tic[snap.val()] += 1;
			redrawPie();
		});
		listenerPaths2.push("/matches/"+roundID+"/"+roomName+"/status");
		redrawPie();
	}
}

function redrawPie() {
	// get percents;
	let sum = tic[0]+tic[1]+tic[2];
	let tP = Math.round(tic[0]/sum*10000)/100, iP = Math.round(tic[1]/sum*10000)/100, cP = Math.round(tic[2]/sum*10000)/100;

	document.getElementsByClassName("pie")[0].innerHTML = `
		<div class="pie__segment" style="--offset: 0; --value: ${tP}; --bg: #008cff; ${(tP > 50) ? "--over50: 1" : ""}"></div>
		<div class="pie__segment" style="--offset: ${tP}; --value: ${iP}; --bg: #ffbb00; ${(iP > 50) ? "--over50: 1" : ""}"></div>
		<div class="pie__segment" style="--offset: ${tP+iP}; --value: ${cP}; --bg: #18ca00; ${(cP > 50) ? "--over50: 1" : ""}"></div>
	`;
	document.getElementsByClassName("pie-label-text")[0].innerHTML = `Todo (${tP}%)`;
	document.getElementsByClassName("pie-label-text")[1].innerHTML = `In progress (${iP}%)`;
	document.getElementsByClassName("pie-label-text")[2].innerHTML = `Completed (${cP}%)`;
}

function toggleActive(roundID) {
	localData["rounds"][roundID]["started"] = !localData["rounds"][roundID]["started"];
	let updates = {};
	updates["/rounds/"+roundID+"/started"] = localData["rounds"][roundID]["started"];
	updates["/lastActiveRound"] = roundID;
	firebase.database().ref().update(updates);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//$teamid {w: n, l: n, p: n}
let rankTable;
function prepareRanks() {
	rankTable = {};
	if(!localData["teams"]) return;
	for(let teamID of Object.keys(localData["teams"]["names"])) {
		rankTable[teamID] = {"w": 0, "l": 0, "p": 0};
	}
	firebase.database().ref("/scores").on("child_added", (snap) => {
		let match = snap.val();
		if(!rankTable[match["t1"]]) rankTable[match["t1"]] = {"w": 0, "l": 0, "p": 0};
			if(!rankTable[match["t2"]]) rankTable[match["t2"]] = {"w": 0, "l": 0, "p": 0};
			if(match["s1"] > match["s2"]) { // avoid == case
				rankTable[match["t1"]]["w"] += 1;
				rankTable[match["t2"]]["l"] += 1;
			} else if(match["s1"] < match["s2"]) {
				rankTable[match["t2"]]["w"] += 1;
				rankTable[match["t1"]]["l"] += 1;
			}
			rankTable[match["t1"]]["p"] += match["s1"];
			rankTable[match["t2"]]["p"] += match["s2"];
			if(document.getElementsByTagName("select")[0].value === "rankings") drawRankTable();
	});
}

function sortSpecial(arr, idx) {
	if(arr.length === 0) return;
	let tmp = arr.sort((a,b) => b[idx] - a[idx]);
	let colArr = [], i = 0, res = [], prevval = tmp[0][idx];
	while(1) {
		if(i === tmp.length) {
			res.push((colArr.length === 1) ? colArr[0] : colArr);
			break;
		}
		if(tmp[i][idx] !== prevval) {
			res.push((colArr.length === 1) ? colArr[0] : colArr);
			prevval = tmp[i][idx]; colArr = [];
		}
		colArr.push(tmp[i]);
		i++;
	}
	return res;
}

function calculateRanks() {
	let unpacked = Object.entries(rankTable).map(x => [x[0], ...Object.values(x[1])]);
	if(!unpacked) return;
	let result = sortSpecial(unpacked, 1);
	if(result === undefined) return false;
	if(breakTiesWithTotalPoints) {
		let tmp = result;
		result = [];
		for(let elem of tmp) {
			if(Array.isArray(elem[0])) {
				result.push(...sortSpecial(elem, 3));
			} else result.push(elem);
		}
	}
	return result;
}

function getTr(stat, idx) {
	return `<tr>
						<td>${idx+1}</td>
						<td>${localData["teams"]["names"][stat[0]]}</td>
						<td>${stat[1]} - ${stat[2]}</td>
						<td>${stat[3]}</td>
					</tr>`;
}

function drawRankTable() {

	let ranks = calculateRanks();
	if(!ranks) {
		document.getElementById("table-container").innerHTML = "<div class='undef'>No rounds found</div>";
	}

	document.getElementById("leftlabels").innerHTML = "";
	document.getElementById("upperlabels").innerHTML = "";
	document.getElementById("upperlabels").style.height = "unset";
	document.getElementById("grid").style.height = "unset";

	document.getElementById("grid").innerHTML = `
		<div id="rankings-container">
			<table id="ranktable" style="width: 100%; text-align: center;">
				<tr style="color: white; background-color: #9e1c43">
					<th style="width: 10%">Rank #</th>
					<th style="width: 60%">Team Name</th>
					<th style="width: 20%">Matches Record (W-L)</th>
					<th style="width: 10%">Total Points</th>
				</tr>
			</table>
		</div>
	`;

	let offset = 0;
	for(let i = 0; i < ranks.length; i++) {
		if(Array.isArray(ranks[i][0])) {
			let m = i+offset;
			offset--;
			for(let sub of ranks[i]) {
				document.getElementById("ranktable").innerHTML += getTr(sub,m);
				offset = offset+1;
			}
		} else {
			document.getElementById("ranktable").innerHTML += getTr(ranks[i],i+offset);
		}
	}
}