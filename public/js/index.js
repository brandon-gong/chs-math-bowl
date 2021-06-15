let e = document.getElementById("wrapper");
let localData;
let listenerPaths = [];
firebase.database().ref().once("value").then((snap) => {
	localData = snap.val();
	firebase.database().ref("/displayMode").on("value", (s) => {
		switchScreen(s.val());
	});
});

function switchScreen(displayType) {
	for(let path of listenerPaths) {
		firebase.database().ref(path).off();
	}
	listenerPaths = [];
	e.innerHTML = "";
	switch(displayType) {
		case 0: renderDragon(); break;
		case 1: renderLiveScore(); break;
		case 2: renderRank(); break;
		case 3: renderSchedule(); break;
		case 4: renderRoundLocations(); break;
	}
}

function renderDragon() {
	e.innerHTML = `
	<div style="display:flex;align-items:center;justify-content:center;flex-direction:column">
		<img src='whitedragon.svg' style="height: 30vh">
		<div style="font-family:'Jost Bold';color:white;margin-top:3vh;font-size:4vh">CHS MATH BOWL</div>
	</div>
	`;
}

let scheduleih = `
<div>
	<b>8:15 – 8:30</b> Registration<br>
	<b>8:30 – 8:45</b> Welcome<br>
	<b>8:50 – 9:00</b> Preliminary Round 1<br>
	<b>9:05 – 9:15</b> Preliminary Round 2<br>
	<b>9:20 – 9:30</b> Preliminary Round 3<br>
	<b>9:35 – 9:45</b> Preliminary Round 4<br>
	<b>9:50 – 10:00</b> Preliminary Round 5<br>
	<b>10:05 – 10:15</b> Preliminary Round 6<br>
	<b>10:20 – 10:30</b> Preliminary Round 7<br>
	<b>10:35 – 10:45</b> Preliminary Round 8<br>
	<b>10:45 – 12:20</b> Lunch<br>
</div>
<div style="width: 3px; background-color: white; margin: 0px 40px;"></div>
<div>
	<b>12:25 – 12:35</b> Bracket Round 1<br>
	<b>12:40 – 12:50</b> Bracket Round 2<br>
	<b>12:55 – 1:05</b> Bracket Round 3<br>
	<b>1:10 – 1:20</b> Bracket Round 4<br>
	<b>1:25 – 1:35</b> Bracket Round 5<br>
	<b>1:40 – 1:50</b> Bracket Round 6<br>
	<b>1:55 – 2:05</b> Bracket Round 7<br>
	<b>2:10 – 2:20</b> Bracket Round 8<br>
	<b>2:25 – 2:35</b> Bracket Round 9<br>
	<b>2:40 – 2:50</b> Bracket Round 10<br>
	<b>2:55 – 3:05</b> Bracket Round 11<br>
	<b>3:10 – 3:30</b> Awards Ceremony
</div>
`;

function renderSchedule() {
	// todo make editable from firebase
	e.innerHTML = `
	<div style="display:flex;align-items:center;justify-content:center;flex-direction:column">
		<h1>Competition Schedule</h1>
		<div id="schedule" style="display:flex; flex-direction: row;" oninput="scheduleih=document.getElementById('schedule').innerHTML">${scheduleih}</div>
	</div>
	`;
}

function renderRoundLocations() {
	firebase.database().ref("/lastActiveRound").once("value").then((larSnap) => {
		let lastRoundID = larSnap.val();
		if(lastRoundID) {
			firebase.database().ref("/rounds").once("value").then((roundsSnap) => {
				let rounds = roundsSnap.val();
				let keys = Object.keys(rounds);
				let nextRound = keys[keys.indexOf(lastRoundID)+1];
				firebase.database().ref("/matches/"+nextRound).once("value").then((matchSnap) => {
					let roomih = "<div>", t1ih = "<div>", vsih = "<div>", t2ih = "<div>";
					for(let roomName of Object.keys(matchSnap.val())) {
						roomih += "<b>Room " + localData["rooms"][roomName]["number"] + "</b><br>";
						t1ih += localData["teams"]["names"][matchSnap.val()[roomName]["t1"]] + "<br>";
						vsih += "vs.<br>"
						t2ih += localData["teams"]["names"][matchSnap.val()[roomName]["t2"]] + "<br>";
					}
					roomih += "</div>";
					t1ih += "</div>";
					vsih += "</div>";
					t2ih += "</div>";
					let spacer = "<div style='width:30px'></div>"
					e.innerHTML = `
					<div style="display:flex;align-items:center;justify-content:center;flex-direction:column">
						<h1>${rounds[nextRound]["name"]} Locations</h1>
						<div id="schedule" style="display:flex; flex-direction:row;">${roomih + spacer + t1ih + spacer + vsih + spacer + t2ih}</div>
					</div>
					`;
				});
			});
		}
	});
}

function renderLiveScore() {
	firebase.database().ref("/rounds").once("value").then((snap) => {
		// find last active round
		let rIDs = Object.keys(snap.val());
		let activeRound = null;
		for(let i = rIDs.length - 1; i >= 0; i--) {
			if(snap.val()[rIDs[i]]["started"]) {
				activeRound = rIDs[i];
				break;
			}
		}
		if(activeRound) {
			firebase.database().ref("/matches/"+activeRound).once("value").then((snap1) => {
				let scoreElems = [];
				let matchVs = [];
				for(let roomName of Object.keys(snap1.val())) {
					matchVs.push(`${localData["teams"]["names"][snap1.val()[roomName]["t1"]]} vs. ${localData["teams"]["names"][snap1.val()[roomName]["t2"]]}`);
					let path = `/matches/${activeRound}/${roomName}/score`;
					let x = document.createElement("b");
					firebase.database().ref(path).on("value", (scoreSnap) => {
						if(!scoreSnap.val()) x.innerHTML = "0 - 0";
						else {
							let a = 0, b = 0;
							for(let val of Object.values(scoreSnap.val())) {
								if(val === 1) a++;
								else if(val === 2) b++;
							}
							x.innerHTML = `${a} - ${b}`;
						}
					});
					scoreElems.push(x);
				}
				let vsih = "<div>";
				for(let x of matchVs) {
					vsih += x + "<br>";
				}
				vsih += "</div>";
				let sih = "<div id='sih'></div>";
				let spacer = '<div style="width: 3px; background-color: white; margin: 0px 30px;"></div>';
				e.innerHTML = `
					<div style="display:flex;align-items:center;justify-content:center;flex-direction:column">
						<h1>${snap.val()[activeRound]["name"]} Live Score</h1>
						<div id="schedule" style="display:flex; flex-direction:row;">${vsih + spacer + sih}</div>
					</div>
					`;
				for(let i = 0; i < scoreElems.length; i++) {
					document.getElementById("sih").appendChild(scoreElems[i]);
					document.getElementById("sih").appendChild(document.createElement("br"));
				}
			});
		}
	});
}

function renderRank() {
	listenerPaths.push("/scores");
	// {tid: [w, l, p]}

	firebase.database().ref("/scores").on("value", (snap) => {
		let scorestable = {};
		let scores = snap.val();
		if(!scores) return;
		for(let teamID of Object.keys(localData["teams"]["abbrev"])) {
			scorestable[teamID] = [0,0,0];
		}
		for(let matchID of Object.keys(scores)) {
			if(scores[matchID]["s1"] > scores[matchID]["s2"]) {
				scorestable[scores[matchID]["t1"]][0] += 1;
				scorestable[scores[matchID]["t2"]][1] += 1;
			} else if(scores[matchID]["s1"] > scores[matchID]["s2"]) {
				scorestable[scores[matchID]["t2"]][0] += 1;
				scorestable[scores[matchID]["t1"]][1] += 1;
			}
			scorestable[scores[matchID]["t1"]][2] += scores[matchID]["s1"];
			scorestable[scores[matchID]["t2"]][2] += scores[matchID]["s2"];
		}
		
		let scorearr = Object.entries(scorestable);
		let rank = 1;
		let rih = "<div style='text-align: center'><b>Rank</b><br>";
		let tih = "<div style='text-align: center'><b>Team Name</b><br>";
		let wlih = "<div style='text-align: center'><b>W - L</b><br>";
		let pih = "<div style='text-align: center'><b>Points</b><br>";


		while(scorearr.length > 0) {
			let maxW = -1;
			let maxIdx = -1;
			for(let i = 0; i < scorearr.length; i++) {
				if(scorearr[i][1][0] > maxW) {
					maxIdx = i; maxW = scorearr[i][1][0];
				}
			}
			let ties = [];
			for(let i = 0; i < scorearr.length; i++) {
				if(scorearr[i][1][0] === maxW) {
					ties.push(...scorearr.splice(i, 1));
					i--;
				}
			}
			console.log(ties);
			while(ties.length > 0) {
				let offset = 0;
				let maxP = -1;
				let maxIdxP = -1;
				for(let i = 0; i < ties.length; i++) {
					if(ties[i][1][2] > maxP) {
						maxIdxP = i; maxP = ties[i][1][2];
					}
				}
				for(let i = 0; i < ties.length; i++) {
					if(ties[i][1][2] === maxP) {
						rih += rank + "<br>";
						tih += localData["teams"]["names"][ties[i][0]] + "<br>";
						wlih += `${ties[i][1][0]} - ${ties[i][1][1]}<br>`;
						pih += `${ties[i][1][2]}<br>`;
						ties.splice(i, 1);
						i--;
						offset++;
					}
				}
				rank += offset;
			}
		}

		rih += "</div>";
		tih += "</div>";
		wlih += "</div>";
		pih += "</div>";
		let spacer = "<div style='width: 60px'></div>";

		e.innerHTML = `
		<div style="display:flex;align-items:center;justify-content:center;flex-direction:column">
			<h1>Live Rankings</h1>
			<div id="schedule" style="display:flex; flex-direction: row; font-size: 25px">${rih + spacer + tih + spacer + wlih + spacer + pih}</div>
		</div>
		`;
	});
}