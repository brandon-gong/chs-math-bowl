let numquestions = 18;
let currentQuestion = 0;
let timePerQuestion = 30000;

let timerIsRunning = false;
let timeRemaining = timePerQuestion;
let t1Score = 0;
let t2Score = 0;
let matchResults = new Array(numquestions).fill(0);
let t0,tInt;

let listen = false;

let title = "";
let userr = "";

let roundID;
let ar = window.location.href.match(/in_game\.html\?roundID=(.+)/);
if(!ar) window.location = "index.html";
else roundID = ar[1];

let t1id = "";
let t2id = "";

let t1special = 0;
let t2special = 0;

firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		if(user.email === "admin.mathbowl@brandongong.org") {
			window.location = "../admin-console/index.html";
		} else {
			if(roundID === "special") {
				document.body.style.cursor = "unset";
				document.body.setAttribute('spellcheck', false);
				document.getElementById("container").innerHTML = `
					<div id="title" contentEditable="true">Custom round</div>
					<div id="time">
						Loading...
					</div>
					<div id="scores-container">
						<div class="card">
							<div class="score" contentEditable="true">0</div>
							<div class="abbrev" contentEditable="true">TEAM1</div>
						</div>
						<div class="card">
							<div class="score" contentEditable="true">0</div>
							<div class="abbrev" contentEditable="true">TEAM2</div>
						</div>
					</div>`;
					document.getElementById("time").style.fontSize = "250px";
					document.getElementById("time").style.fontFamily = "Roboto Mono";
					document.getElementById("time").style.margin = "30px";
					renderTime(timeRemaining);
					document.addEventListener("keydown", (event) => {
						if(event.keyCode === 220 && !timerIsRunning) window.location = "index.html";
						switch(event.keyCode) {
							case 32:
								toggleTimer();
								break;
							case 82:
								t0 = null; clearInterval(tInt); tInt = null; timerIsRunning = false; timeRemaining = timePerQuestion; renderTime(timeRemaining);
								break;
							case 87:
								if(!timerIsRunning) {
									triggerLeft();
									setTimeout(detriggerLeft, 400);
									document.getElementsByClassName("score")[0].innerHTML = ++t1special;
								}
								break;
							case 83:
								if(!timerIsRunning) {
									triggerLeft();
									setTimeout(detriggerLeft, 400);
									document.getElementsByClassName("score")[0].innerHTML = --t1special;
								}
								break;
							case 38:
								if(!timerIsRunning) {
									triggerRight();
									setTimeout(detriggerRight, 400);
									document.getElementsByClassName("score")[1].innerHTML = ++t2special;
								}
								break;
							case 40:
								if(!timerIsRunning) {
									triggerRight();
									setTimeout(detriggerRight, 400);
									document.getElementsByClassName("score")[1].innerHTML = --t2special;
								}
								break;
						}
					});
			} else {
				userr = user;
				firebase.database().ref("/matches/"+roundID+"/"+user.email.split("\.")[0]).once('value').then((snap) => {

					if(!snap.val()) window.location = "index.html";
					else {
						document.getElementById("container").innerHTML = `
							<div id="title">Loading... - Question 1</div>
							<div id="time">
								Waiting for round to start...
							</div>
							<div id="scores-container">
								<div class="card">
									<div class="score">0</div>
									<div class="abbrev">TEAM1</div>
								</div>
								<div class="card">
									<div class="score">0</div>
									<div class="abbrev">TEAM2</div>
								</div>
							</div>`;

						let updates = {};
						updates["/matches/"+roundID+"/"+user.email.split("\.")[0]+"/status"] = 1;
						firebase.database().ref().update(updates);

						t1id = snap.val()["t1"];
						t2id = snap.val()["t2"];
						renderProgressDots();
						document.addEventListener("keydown", (event) => {
							if(event.keyCode === 220 && !timerIsRunning) window.location = "index.html";
							if(listen) {
								switch(event.keyCode) {
									case 32:
										toggleTimer();
										break;
									case 82:
										t0 = null; clearInterval(tInt); tInt = null; timerIsRunning = false; timeRemaining = timePerQuestion; renderTime(timeRemaining);
										break;
									case 37:
										if(!timerIsRunning) prev();
										break;
									case 39:
										if(!timerIsRunning) next();
										break;
									case 65:
										if(!timerIsRunning) {
											triggerLeft();
											detriggerRight();
											matchResults[currentQuestion] = 1;
											let qupdates = {};
											qupdates["/matches/"+roundID+"/"+user.email.split("\.")[0]+"/score/"+currentQuestion] = 1;
											firebase.database().ref().update(qupdates);
											updateScores();
											if(isLatest()) setTimeout(next, 800);
										}
										break;
									case 68:
										if(!timerIsRunning) {
											triggerRight();
											detriggerLeft();
											matchResults[currentQuestion] = 2;
											let qupdates = {};
											qupdates["/matches/"+roundID+"/"+user.email.split("\.")[0]+"/score/"+currentQuestion] = 2;
											firebase.database().ref().update(qupdates);
											updateScores();
											if(isLatest()) setTimeout(next, 800);
										}
										break;
									case 83:
										if(!timerIsRunning) {
											detriggerLeft();
											detriggerRight();
											matchResults[currentQuestion] = 3;
											let qupdates = {};
											qupdates["/matches/"+roundID+"/"+user.email.split("\.")[0]+"/score/"+currentQuestion] = 3;
											firebase.database().ref().update(qupdates);
											updateScores();
											if(isLatest()) setTimeout(next, 10);
										}
										break;
								}
							}
						});
						
						firebase.database().ref("/teams/abbrev").on('value', (s) => {
							s = s.val();
							toggleEnabled(s["started"]);
							document.getElementsByClassName("abbrev")[0].innerHTML = s[snap.val()["t1"]];
							document.getElementsByClassName("abbrev")[1].innerHTML = s[snap.val()["t2"]];
						});

						firebase.database().ref("/rounds/"+roundID).on('value', (s) => {
							s = s.val();
							toggleEnabled(s["started"]);
							document.getElementById("title").innerHTML = s["name"] + document.getElementById("title").innerHTML.substring(document.getElementById("title").innerHTML.indexOf("-") - 1);
							title = s["name"];
						});

						if(!snap.val()["score"]) {
							let updates = {};
							updates["/matches/"+roundID+"/"+user.email.split("\.")[0]+"/score"] = matchResults;
							firebase.database().ref().update(updates);
						} else {
							matchResults = snap.val()["score"];
						}
						if(matchResults[currentQuestion] === 0 || matchResults[currentQuestion] === 3) {
							detriggerRight(); detriggerLeft();
						} else if(matchResults[currentQuestion] === 1) {
							detriggerRight(); triggerLeft();
						} else {
							detriggerLeft(); triggerRight();
						}
						updateScores();
					}
				});
			}
		}
	} else {
		window.location = "../login.html";
	}
});

function toggleEnabled(enabled) {
	listen = enabled;
	if(enabled) {
		document.getElementById("time").style.fontSize = "250px";
		document.getElementById("time").style.fontFamily = "Roboto Mono";
		document.getElementById("time").style.margin = "30px";
		renderTime(timeRemaining);
	} else {
		document.getElementById("time").style.fontSize = "100px";
		document.getElementById("time").style.fontFamily = "Jost Bold";
		document.getElementById("time").style.margin = "100px 0px";
		document.getElementById("time").innerHTML = "Waiting for round to start...";
	}
}

function renderTime(millis) {
	let mins = Math.floor(millis/60000);
	let secs = Math.floor((millis % 60000) / 1000);
	let centi = Math.round((millis % 1000) / 10);
	if(secs == 60) {mins++; secs=0};
	if(secs < 10) secs = "0"+secs;
	if(centi > 99) centi %= 100;
	if(centi < 10) centi = "0"+centi;
	//document.getElementById("time").innerHTML = `${mins}:${secs}.${centi}`; // SHIM JAN 29 2020 REMOVE MINS
	document.getElementById("time").innerHTML = `${secs}:${centi}`;
}

function toggleTimer() {
	if(!timerIsRunning) {
		t0 = Date.now();
		timerIsRunning = true;
		tInt = setInterval(() => {
			let tr = timeRemaining - (Date.now() - t0);
			if(tr <= 0) toggleTimer();
			else renderTime(tr);
		}, 10);
	} else {
		clearInterval(tInt);
		timerIsRunning = false;
		timeRemaining -= Date.now() - t0;
		timeRemaining = Math.max(timeRemaining, 0);
		renderTime(timeRemaining);
	}
}

function next() {
	if(currentQuestion === numquestions - 1) {
		return;
	}
	currentQuestion++;
	let curscore = getScores();
	if(currentQuestion === numquestions - 1) {
		if(curscore[0] !== curscore[1]) promptCompletion();
		document.getElementById("title").innerHTML = title + " - Sudden Death";
	} else if(currentQuestion === numquestions - 3) {
		if(curscore[0] !== curscore[1]) promptCompletion();
		document.getElementById("title").innerHTML = title + " - Tiebreaker 1";
	} else if(currentQuestion === numquestions - 2) {
		if(curscore[0] !== curscore[1]) promptCompletion();
		document.getElementById("title").innerHTML = title + " - Tiebreaker 2";
	} else {
		document.getElementById("title").innerHTML = title + " - Question " + (currentQuestion+1);
	}
	t0 = null;
	clearInterval(tInt);
	tInt = null;
	timerIsRunning = false;
	timeRemaining = timePerQuestion;
	renderTime(timeRemaining);
	if(matchResults[currentQuestion] === 0 || matchResults[currentQuestion] === 3 || matchResults[currentQuestion] === undefined) {
		detriggerRight(); detriggerLeft();
	} else if(matchResults[currentQuestion] === 1) {
		detriggerRight(); triggerLeft();
	} else {
		detriggerLeft(); triggerRight();
	}
	renderProgressDots();
}
function prev() {
	if(currentQuestion === 0) {
		return;
	}
	currentQuestion--;
	if(currentQuestion === numquestions - 3) {
		// todo check sum here
		document.getElementById("title").innerHTML = title + " - Tiebreaker 1";
	} else if(currentQuestion === numquestions - 2) {
		// todo check sum here
		document.getElementById("title").innerHTML = title + " - Tiebreaker 2";
	} else {
		document.getElementById("title").innerHTML = title + " - Question " + (currentQuestion+1);
	}
	
	t0 = null;
	clearInterval(tInt);
	tInt = null;
	timerIsRunning = false;
	timeRemaining = timePerQuestion;
	renderTime(timeRemaining);
	if(matchResults[currentQuestion] === 0 || matchResults[currentQuestion] === 3 || matchResults[currentQuestion] === undefined) {
		detriggerRight(); detriggerLeft();
	} else if(matchResults[currentQuestion] === 1) {
		detriggerRight(); triggerLeft();
	} else {
		detriggerLeft(); triggerRight();
	}
	renderProgressDots();
}

function triggerLeft() { document.getElementsByClassName("card")[0].classList.add("card-clicked"); }
function triggerRight() { document.getElementsByClassName("card")[1].classList.add("card-clicked"); }
function detriggerLeft() { document.getElementsByClassName("card")[0].classList.remove("card-clicked"); }
function detriggerRight() { document.getElementsByClassName("card")[1].classList.remove("card-clicked"); }

function isLatest() {
	// generally: all previous indices up to and including currentQuestion are non-zero, and all future indices are zero.
	for(let i = 0; i <= currentQuestion; i++) {
		if(matchResults[i] === 0) return false;
	}
	for(let i = currentQuestion+1; i < numquestions; i++) {
		if(matchResults[i] !== 0) return false;
	}
	return true;
}

function getScores() {
	let t1Score = 0;
	let t2Score = 0;
	for(let i = 0; i <= numquestions; i++) {
		if(matchResults[i] === 1) t1Score++;
		else if(matchResults[i] === 2) t2Score++;
	}
	return [t1Score, t2Score];
}

function updateScores() {
	let a = getScores();
	document.getElementsByClassName("score")[0].innerHTML = a[0];
	document.getElementsByClassName("score")[1].innerHTML = a[1];
}

function promptCompletion() {
	document.getElementById("overlay").style.backgroundColor = "rgba(0,0,0,0.2)";
	document.getElementById("overlay").style.pointerEvents = 'auto';
	document.getElementById("overlay").style.cursor = 'auto';
	document.getElementById("overlay").innerHTML = `
		<div style="background-color:white;padding:20px;border-radius:10px;width:300px;position:relative">
			<div style="position:absolute;color:#aaa;font-size:20px;cursor:pointer;top: 25px; right: 25px;" onclick="unloadCompletion()">⨉</div>
			<div style="font-family: 'Jost', Arial, Helvetica, sans-serif; font-size: 30px;margin-bottom: 5px">Round complete</div>
			<div style="background-color:#9e1c43;color:white;font-family:'Jost Bold';cursor:pointer;border-radius:5px;padding:5px;font-size:20px;text-align:center" onclick="end()">
				Submit round results
			</div>
		</div>
	`;
}
function unloadCompletion() {
	document.getElementById("overlay").style.backgroundColor = "rgba(0,0,0,0)";
	document.getElementById("overlay").style.pointerEvents = 'none';
	document.getElementById("overlay").style.cursor = 'none';
	document.getElementById("overlay").innerHTML = "";
}

function end() {
	let scores = getScores();
	let updates = {};
	updates["/matches/"+roundID+"/"+userr.email.split("\.")[0]+"/status"] = 2;
	let scorekey = firebase.database().ref().child('/scores').push().key;
	updates["/scores/"+scorekey] = {
		"roundID" : roundID,
		"t1": t1id,
		"t2": t2id,
		"s1": scores[0],
		"s2": scores[1]
	};
	firebase.database().ref().update(updates);
	document.getElementById("overlay").style.backgroundColor = "white";
	document.getElementById("overlay").style.pointerEvents = 'auto';
	firebase.database().ref("/teams/names").once("value").then((snap) => {
		document.getElementById("overlay").innerHTML = `
			<div>
				<h4>${title} Match Results</h4>
				<div class="resbox ${(scores[0] > scores[1]) ? "winner" : "loser"}">
					<div class="finalScore">${scores[0]}</div>
					<div class="teamname">${snap.val()[t1id]}</div>
				</div>
				<div class="resbox ${(scores[0] < scores[1]) ? "winner" : "loser"}">
					<div class="finalScore">${scores[1]}</div>
					<div class="teamname">${snap.val()[t2id]}</div>
				</div>
			</div>`;
		document.getElementById("dots").style.display = "none";
	});
}

function renderProgressDots() {
	if(!document.getElementById("dots")) document.getElementById("container").innerHTML += "<div id='dots'></div>";
	document.getElementById("dots").innerHTML = "";
	for(let i = 0; i < matchResults.length; i++) {
		document.getElementById("dots").innerHTML += `<div class="dot ${(matchResults[i] === 0) ? "unanswered" : "answered"} ${(i === currentQuestion) ? "activedot" : ""}"></div>`;
	}
}