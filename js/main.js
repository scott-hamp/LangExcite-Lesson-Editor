var xmlSourceTextArea;
var xmlSource, xmlParser, xmlDoc;

var fileInput, fileInputFile;
var fileInputFileSet = false;
var fileReader = new FileReader();

var addNodeButton, recordButton;

var transcriptLanguagesSelect;

var transcriptNodesRoot;
var transcriptNodes;

var transcriptLanguages;
var transcriptTimes;
var transcriptText;

var transcriptLanguageSelected, transcriptLanguageSelectedIndex;

var nodesTable;

var videoID;

var videoViewSetUp = false;
var videoPlayer;
var videoReady = false;
var videoTime;
var videoHasBeenPlayed = false;

var videoPlayPauseButton;

var currentTranscriptText;

var recordStarted = false;
var recordTimeStartInSeconds = 0;


document.addEventListener("DOMContentLoaded", function(){

	fileInput = document.getElementById("fileInput");

	fileReader.addEventListener("load", FileReader_OnLoad);

	addNodeButton = document.getElementById("addNodeButton");
	addNodeButton.disabled = true;
	recordButton = document.getElementById("recordButton");
	recordButton.disabled = true;

	transcriptLanguagesSelect = document.getElementById("transcriptLanguagesSelect");

	nodesTable = document.getElementById("nodesTable");

	nodesTable.innerHTML += "<tbody>";

	nodesTable.innerHTML += "<tr><td><div class='buttonGroup'><button class='nodeTableAction' " 
			+ "disabled='true'>Seek</button>" 
		+ "<button class='nodeTableAction' disabled='true'>Remove</button><div>" 
		+ "<div class='buttonGroup'><button class='nodeTableAction' disabled='true'>Split" 
			+ "</button></div></td>"
		+ "<td><input class='time' value='0:00'></input></td><td>" 
		+ "<textarea rows='3' cols='50'></textarea></td></tr>";

	nodesTable.innerHTML += "</tbody>";

	videoTime = document.getElementById("videoTime");
	videoPlayPauseButton = document.getElementById("videoPlayPauseButton");

	currentTranscriptText = document.getElementById("currentTranscriptText");
});

document.addEventListener("keypress", OnKeyPress, false);


function ChangeTranscriptLanguage()
{
	transcriptLanguageSelected = transcriptLanguagesSelect.value;
	transcriptLanguageSelectedIndex = transcriptLanguagesSelect.selectedIndex;

	LoadTranscriptNodes();
}

function DebugLog(text)
{
	document.getElementById("debug").innerHTML = "<i>" + text + "</i>";
}

function DebugLogAdd(text)
{
	document.getElementById("debug").innerHTML += "<i>" + text + "</i>";
}

function FileReader_OnLoad(event)
{
	xmlSourceTextArea = document.getElementById("xmlSourceTextArea");
	xmlSourceTextArea.value = fileReader.result;

	LoadXMLSource();

	if(!videoViewSetUp)
		SetupVideoView();
	else
		ResetVideoView();

	DebugLog("Loaded: " + fileInputFile.name);
}

function FileInput_OnChanged(event)
{
	var file = fileInput.files[0];

	fileInputFile = file;

	fileInputFileSet = true;

	Load();
}

function FormatTimeToString(timeInSeconds)
{
	var minutes = Math.floor((timeInSeconds / 60));
	var seconds = Math.floor(timeInSeconds - (minutes * 60));

	var secondsString = seconds;
	if(seconds < 10)
		secondsString = "0" + secondsString;

	return minutes + ":" + secondsString;
}

function Load()
{
	LoadFile();
}

function LoadFile()
{
	fileReader.readAsText(fileInputFile);
}

function LoadTranscriptNodes()
{
	nodesTable.innerHTML = "<thead><tr><th>Actions</th><th>Time</th><th>Text</th></tr></thead>";

	transcriptNodesRoot = xmlDoc.getElementsByTagName("nodes")[0];
	transcriptNodes = xmlDoc.getElementsByTagName("node");

	transcriptTimes = new Array(transcriptNodes.length);
	transcriptText = new Array(transcriptNodes.length);

	nodesTable.innerHTML += "<tbody>";

	for (i = 0; i < transcriptNodes.length; i++) 
	{
		var timeElement = transcriptNodes[i].firstChild;
		var textElement = timeElement.nextSibling;

		while(textElement.nodeName != transcriptLanguageSelected)
			textElement = textElement.nextSibling;

		var time = timeElement.childNodes[0].nodeValue;
		var text = textElement.childNodes[0].nodeValue;

		transcriptTimes[i] = time;
		transcriptText[i] = text;

		var disabled = "disabled = 'true'";
		if(transcriptNodes.length > 1)
			disabled = "";

		nodesTable.innerHTML += 
			"<tr><td><div class='buttonGroup'><button class='nodeTableAction' " 
				+ "onclick='SeekInVideo(" + 
				ParseFormattedTimeStringToSeconds(transcriptTimes[i]) + ")'>Seek</button>" 
			+ "<button class='nodeTableAction' onclick='TranscriptRemoveNode(" + i + ")' " 
				+ disabled + ">Remove</button></div>" 
			+ "<div class='buttonGroup'><button class='nodeTableAction' " 
				+ "onclick='TranscriptSplitNode(" + i + ")'>Split</button></td><div>" 
			+ "<td><input id='nodesTableCell_" + 0 + "_" + i + "' class='time' value='" + transcriptTimes[i] + 
				"' onchange='NodesTable_OnChanged(" + 0 + "," + i + ")'></input>" 
			+ "</td><td><textarea id='nodesTableCell_" + 1 + "_" + i + "' rows='3' cols='50'" 
				+ "onchange='NodesTable_OnChanged(" + 1 + "," + i + ")'>" 
				+ transcriptText[i] + "</textarea></td></tr>";
	}

	nodesTable.innerHTML += "</tbody>";
}

function LoadXMLSource()
{
	xmlSourceTextArea = document.getElementById("xmlSourceTextArea");
	xmlSource = xmlSourceTextArea.value;

	xmlSource = xmlSource.replace(
		new RegExp( "\\n", "g" ), 
		"" 
	);

	xmlSource = xmlSource.replace(/>\s*/g, '>');
	xmlSource = xmlSource.replace(/\s*</g, '<');

	xmlSourceTextArea.value = xmlSource;

	xmlParser = new DOMParser();
	xmlDoc = xmlParser.parseFromString(xmlSource, "text/xml");

	var transcriptLanguagesNode = xmlDoc.getElementsByTagName("transcript_languages")[0];

	transcriptLanguages = transcriptLanguagesNode.childNodes[0].nodeValue.split(',');

	transcriptLanguagesSelect.innerHTML = "";

	for (i = 0; i < transcriptLanguages.length; i++)
	{
		transcriptLanguagesSelect.innerHTML += "<option value='" + transcriptLanguages[i] + "'>" 
			+ transcriptLanguages[i] + "</option>";
	}

	transcriptLanguageSelected = transcriptLanguages[0];
	transcriptLanguageSelectedIndex = 0;

	var videoIDNode = xmlDoc.getElementsByTagName("id")[0];

	videoID = videoIDNode.childNodes[0].nodeValue;

	LoadTranscriptNodes();

	xmlSourceTextArea.disabled = true;

	addNodeButton.disabled = false;
	recordButton.disabled = false;
}

function NodesTable_OnChanged(col, row)
{
	var cell = document.getElementById("nodesTableCell_" + col + "_" + row);

	if(col == 0)
	{
		if(ParseFormattedTimeStringToSeconds(cell.value) != -1)
			transcriptTimes[row] = cell.value;
		else
			cell.value = transcriptTimes[row];
	}
	else
	{
		if(cell.value.trim().length > 0)
			transcriptText[row] = cell.value;
		else
			cell.value = transcriptText[row];
	}

	SaveXMLSource();
	LoadXMLSource();
}

function OnKeyPress(event) 
{
	var char = event.which || event.keyCode;
	// DebugLog("Unicode CHARACTER code: " + char);

	// Equals / plus
	if(char == 61)
		TranscriptAddNode("0:00", "...");

	// Backslash
	if(char == 92)
		StartStopRecord();
}

function onYouTubeIframeAPIReady() 
{
	SetupVideoPlayer();
}

function OnPlayerReady(event) 
{
	videoPlayerReady = true;

	UpdateVideoTime();
}

function OnPlayerStateChange(event) 
{
	if (event.data == YT.PlayerState.PLAYING)
	{
		videoPlayPauseButton.innerHTML = "Pause";
	}

	if (event.data == YT.PlayerState.PAUSED)
	{
		videoPlayPauseButton.innerHTML = "Play";
	}
}

function ParseFormattedTimeStringToSeconds(formattedTimeString)
{
	var parts = formattedTimeString.split(':');

	if(parts.length == 2)
	{
		var minutes = parseInt(parts[0]);
		var seconds = parseInt(parts[1]);

		seconds += (minutes * 60);

		return seconds;
	}

	return -1;
}

function PlayPauseVideo()
{
	if(videoPlayer.getPlayerState() == YT.PlayerState.PLAYING)
		videoPlayer.pauseVideo();
	else
	{
		videoPlayer.playVideo();
		videoHasBeenPlayed = true;
	}
}

function ResetVideoView()
{
	var videoViewContainer = document.getElementById("videoViewContainer");
	videoViewContainer.innerHTML = "<div id='videoView'>Player</div>";

	SetupVideoPlayer();
}

function SaveXMLSource()
{
	for (i = 0; i < transcriptNodes.length; i++) 
	{
		var time = transcriptTimes[i];
		var text = transcriptText[i];

		var timeElement = transcriptNodes[i].firstChild;
		var textElement = timeElement.nextSibling;

		while(textElement.nodeName != transcriptLanguageSelected)
			textElement = textElement.nextSibling;

		timeElement.childNodes[0].nodeValue = transcriptTimes[i];
		textElement.childNodes[0].nodeValue = transcriptText[i];
	}

	xmlSource = new XMLSerializer().serializeToString(xmlDoc);
	xmlSourceTextArea.value = xmlSource;
}

function SeekInVideo(seconds)
{
	if(seconds >= 0 && seconds < videoPlayer.getDuration())
		videoPlayer.seekTo(seconds, true);
}

function SetupVideoView()
{
	var tag = document.createElement('script');

	tag.src = "https://www.youtube.com/iframe_api";
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

	videoViewSetUp = true;
}

function SetupVideoPlayer()
{
	videoPlayer = new YT.Player('videoView', {
		height: '390',
		width: '640',
		videoId: videoID,
		playerVars: { 'rel': 0, 'fs': 0 },
		events: {
		'onReady': OnPlayerReady,
		'onStateChange': OnPlayerStateChange
		}
	});
}

function StartStopRecord()
{
	if(!recordStarted)
	{
		recordStarted = true;
		videoHasBeenPlayed = true;

		recordTimeStartInSeconds = videoPlayer.getCurrentTime();

		videoPlayer.playVideo();

		recordButton.innerHTML = "Stop Record (\\)";
		videoPlayPauseButton.disabled = true;
	}
	else
	{
		recordStarted = false;

		var formattedTime = FormatTimeToString(recordTimeStartInSeconds);
		var timeExists = false;

		for(i = 0; i < transcriptTimes.length; i++)
		{
			if(transcriptTimes[i] != formattedTime) 
				continue;

			timeExists = true;
			break;
		}

		if(!timeExists)
			TranscriptAddNode(formattedTime, "(Record)");

		videoPlayer.pauseVideo();

		recordButton.innerHTML = "Start Record (\\)";
		videoPlayPauseButton.disabled = false;

		SaveXMLSource();
		LoadXMLSource();
	}
}

function TranscriptAddNode(time, text)
{
	if(time == '>')
	{
		var lastTimeInSeconds = ParseFormattedTimeStringToSeconds(transcriptTimes[
			transcriptTimes.length - 1]);

		time = FormatTimeToString(lastTimeInSeconds + 1);
	}

	transcriptTimes.push(time);
	transcriptText.push(text);

	var newNode = xmlDoc.createElement("node");

	var newNodeTime = xmlDoc.createElement("time");
	var newNodeTimeValue = xmlDoc.createTextNode(time);

	newNodeTime.appendChild(newNodeTimeValue);

	newNode.appendChild(newNodeTime);

	for (j = 0; j < transcriptLanguages.length; j++)
	{ 
		var newNodeText = xmlDoc.createElement(transcriptLanguages[j]);
		var newNodeTextValue = xmlDoc.createTextNode(text);

		newNodeText.appendChild(newNodeTextValue);

		newNode.appendChild(newNodeText);
	}

	transcriptNodesRoot.appendChild(newNode);

	transcriptNodes = xmlDoc.getElementsByTagName("node");

	SaveXMLSource();
	LoadXMLSource();
}

function TranscriptRemoveNode(atIndex)
{
	if(atIndex >= 0 && atIndex < transcriptNodes.length && transcriptNodes.length > 1)
	{
		var transcriptTimesNew = new Array(transcriptNodes.length - 1);
		var transcriptTextNew = new Array(transcriptNodes.length - 1);

		for(i = 0; i < transcriptNodes.length - 1; i++)
		{
			if(i < atIndex)
			{
				transcriptTimesNew[i] = transcriptTimes[i];
				transcriptTextNew[i] = transcriptText[i];
			}
			else
			{
				transcriptTimesNew[i] = transcriptTimes[i + 1];
				transcriptTextNew[i] = transcriptText[i + 1];
			}
		}

		transcriptTimes = new Array(transcriptTimesNew.length);
		transcriptText = new Array(transcriptTextNew.length);

		for(i = 0; i < transcriptTimesNew.length; i++)
		{
			transcriptTimes[i] = transcriptTimesNew[i];
			transcriptText[i] = transcriptTextNew[i];
		}

		transcriptNodesRoot.removeChild(transcriptNodes[transcriptNodes.length - 1]);
		transcriptNodes = xmlDoc.getElementsByTagName("node");

		SaveXMLSource();
		LoadXMLSource();
	}
}

function TranscriptSplitNode(atIndex)
{
	if(atIndex >= 0 && atIndex < transcriptNodes.length)
	{
		var transcriptTimesNew = new Array(transcriptNodes.length + 1);
		var transcriptTextNew = new Array(transcriptNodes.length + 1);

		for(i = transcriptNodes.length; i >= 0; i--)
		{
			if(i > atIndex)
			{
				transcriptTimesNew[i] = transcriptTimes[i - 1];
				transcriptTextNew[i] = transcriptText[i - 1];

				if(i == atIndex + 1)
				{
					var seconds = ParseFormattedTimeStringToSeconds(transcriptTimesNew[i]);
					transcriptTimesNew[i] = FormatTimeToString(seconds + 1);

					var breakLengthFirst = Math.round(transcriptTextNew[i].length / 2);
					var breakLengthSecond = transcriptTextNew[i].length - breakLengthFirst;

					var partFirst = transcriptTextNew[i].substring(0, breakLengthFirst);
					var partSecond = transcriptTextNew[i].substring(breakLengthFirst, 
						breakLengthFirst + breakLengthSecond);

					transcriptText[i - 1] = partFirst + "... ";
					transcriptTextNew[i] = "... " + partSecond;
				}
			}
			else
			{
				transcriptTimesNew[i] = transcriptTimes[i];
				transcriptTextNew[i] = transcriptText[i];
			}
		}

		transcriptTimes = new Array(transcriptTimesNew.length);
		transcriptText = new Array(transcriptTextNew.length);

		for(i = 0; i < transcriptTimesNew.length; i++)
		{
			transcriptTimes[i] = transcriptTimesNew[i];
			transcriptText[i] = transcriptTextNew[i];
		}

		TranscriptAddNode("0:00", "...");
	}
}

function UpdateVideoTime()
{
	var currentTimeFormatted = FormatTimeToString(videoPlayer.getCurrentTime());

	videoTime.innerHTML =  currentTimeFormatted + " / " + FormatTimeToString(videoPlayer.getDuration());

	var transcriptNodeIndex = 0;

	for(i = 0; i < transcriptText.length; i++)
	{
		if(ParseFormattedTimeStringToSeconds(transcriptTimes[i]) > videoPlayer.getCurrentTime())
			break;

		transcriptNodeIndex = i;
	}

	currentTranscriptText.innerHTML = transcriptText[transcriptNodeIndex];

	setTimeout(UpdateVideoTime, 100);
}