let localData;

function buildUI() {
	let ih = "";
	if(localData != null) {
		for(let tid of Object.keys(localData["abbrev"])) {
			ih += '<div class="card ib" id="card_' + tid + '">' +
				'<a onclick=triggerEdit(\"' + tid + '\") style="cursor: pointer; padding: 20px; margin-top: -30px; margin-left: -30px">' +
					'<img src="../../more.svg" style="height: 15px">' +
				'</a>' +
				'<div style="margin-top: 40px">' +
					'<div class="abbrev">' + localData["abbrev"][tid] + '</div>' +
					'<div class="name">' + localData["names"][tid] + '</div>' +
				'</div>' +
			'</div>';
		}
	}
	ih += '<div class="card ib special">' +
		'<div id="plus"><a id="plustext" onclick=triggerEdit(\"special\")>+</a></div>' +
		'<div style="height: 20px"></div>' +
		'<div class="name">Add new team</div>' +
	'</div>';
	document.getElementById("teamscards").innerHTML = ih;
}

firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		if(user.email !== "admin.mathbowl@brandongong.org") {
			window.location = "../dashboard/index.html";
		}
		firebase.database().ref('/teams').once('value').then(function(snap) {
			localData = snap.val();
			buildUI();
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

function triggerEdit(e) {
	document.getElementById("tint").style.backgroundColor = 'rgba(0,0,0,0.2)';
	document.getElementById("tint").style.pointerEvents = 'auto';
	if(e === "special") {
		document.getElementById("tint").innerHTML =
		"<div class='card' id='editCard'>" +
			"<div id='ecardHeader'>Create team</div>" +
			"<div id='err'></div>" +
			"<div class='input-group' style='flex-grow: 1'>" +
				"<p style='margin-top: 10px; margin-right: 8px'>School name:</p>" +
				"<input id='name' placeholder='ex. Collierville High School' type='text'>" +
			"</div>" +
			"<div class='input-group' style='flex-grow: 1'>" +
				"<p style='margin-top: 10px; margin-right: 8px'>Abbreviation:</p>" +
				"<input id='abbrev' placeholder='ex. CHS' type='text'>" +
			"</div>" +
			"<div id='options-group'>" +
				"<a id='close' onclick='unloadEdit()'>⨉ Close</a>" +
				"<a id='save' onclick=writeEdit(\'special\')>Create</a>" +
			"</div>" +
		"</div>";
	}
	else {
		document.getElementById("tint").innerHTML =
		"<div class='card' id='editCard'>" +
			"<div id='ecardHeader'>Edit team</div>" +
			"<div id='err'></div>" +
			"<div class='input-group' style='flex-grow: 1'>" +
				"<p style='margin-top: 10px; margin-right: 8px'>School name:</p>" +
				"<input id='name' placeholder='ex. Collierville High School' type='text' value='" + (localData["names"][e]) +"'>" +
			"</div>" +
			"<div class='input-group' style='flex-grow: 1'>" +
				"<p style='margin-top: 10px; margin-right: 8px'>Abbreviation:</p>" +
				"<input id='abbrev' placeholder='ex. CHS' type='text' value='" + (localData["abbrev"][e]) +"'>" +
			"</div>" +
			"<div id='options-group'>" +
				"<a id='close' onclick='unloadEdit()'>⨉ Close</a>" +
				"<a id='save' onclick=writeEdit(\'" + e + "\')>Save Changes</a>" +
				"<a id='delete' onclick=warn(\'" + e + "\')>Delete team</a>" +
			"</div>" +
		"</div>";
	}
}

function unloadEdit() {
	document.getElementById("tint").innerHTML = "";
	document.getElementById("tint").style.backgroundColor = 'rgba(0,0,0,0)';
	document.getElementById("tint").style.pointerEvents = 'none';
}

function writeEdit(e) {
	if(document.getElementById("abbrev").value.trim().length === 0 || document.getElementById("name").value.trim().length === 0) {
		document.getElementById("err").innerHTML = "One of the fields is blank.";
		return;
	}
	let updates = {};
	if(e === "special") {
		e = firebase.database().ref().child('/teams/abbrev').push().key;
	}
	updates['/teams/abbrev/' + e] = document.getElementById("abbrev").value.trim().toUpperCase();
	updates['/teams/names/' + e] = document.getElementById("name").value.trim();
	x = firebase.database().ref().update(updates);
	if(!x) return;
	if(!localData) { localData = {}; localData["abbrev"] = {}; localData["names"] = {};}
	localData["abbrev"][e] = document.getElementById("abbrev").value.trim().toUpperCase();
	localData["names"][e] = document.getElementById("name").value.trim();
	// update ui synthetically
	buildUI();
	unloadEdit();
}

function warn(e) {
	document.getElementById("tint").innerHTML =
		"<div class='card' id='warncard'>" +
			"<div id='warn-header'>Are you sure?</div>" +
			"<div id='warn-explain'>Deleting this team will delete all past and future matches that this team is/was scheduled to take part in!</div>" +
			"<div id='warn-option-container'>" +
				"<a id='goback' onclick='unloadEdit()'>No, cancel</a>" +
				"<a id='goforward' onclick=handleDelete(\'" + e + "\')>Delete</a>" +
		"</div>";
}

function handleDelete(e) {
	//*****************************************
	// TODO MATCH CLEARING
	//*****************************************
	// TODOOOOo
	// adsfadsfdafadfauheawgaeg
	//awt3at 0a32t83q2np98q3ynctq73gbnoeia]
	//awb4/aw3ba/32
	//asdf3ba325a3f4

	firebase.database().ref('/teams/abbrev/' + e).remove();
	firebase.database().ref('/teams/names/' + e).remove();
	firebase.database().ref('/teams').once('value').then(function(snap) {
		localData = snap.val();
		buildUI();
	});
	unloadEdit();
}
