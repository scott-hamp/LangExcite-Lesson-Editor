var xmlSource, xmlParser, xmlDoc;
var xmlSourceTextArea;

var fileInput, fileInputFile, fileInputFileName;
var fileInputFileSet = false;
var fileReader = new FileReader();

var saveButton;

var lessonTitleInput, lessonVideoTitleInput, lessonVideoURLInput;
var changeVideoIDButton;
var videoLanguageCheckboxes, transcriptLanguageCheckboxes;

var addNodeButton, startEndSectionButton;

var transcriptLanguagesSelect;

var transcriptNodesRoot;
var transcriptNodes;

var videoLanguages, transcriptLanguages;
var transcriptTimes;
var transcriptText;

var transcriptLanguageSelected = "en-us"; 
var transcriptLanguageSelectedIndex = 0;

var nodesTable;

var videoID;

var videoViewSetUp = false;
var videoPlayer;
var videoReady = false;
var videoTime;
var videoHasBeenPlayed = false;

var videoPlayPauseButton;

var currentTranscriptText;

var sectionStarted = false;
var sectionTimeStartInSeconds = 0;


document.addEventListener("DOMContentLoaded", SetupPage, false);

document.addEventListener("keypress", OnKeyPress, false);


function ChangeLessonTitle(titleIndex, value)
{
	if(titleIndex < 0 || titleIndex > 1) return;
	if(value.trim().length == 0) return;

	var titleNodes = xmlDoc.getElementsByTagName("title");

	var titleElement = titleNodes[titleIndex].childNodes[0];

	while(titleElement.nodeName != transcriptLanguageSelected)
		titleElement = titleElement.nextSibling;

	titleElement.childNodes[0].nodeValue = value;

	SaveXMLSource();
}

function ChangeLessonVideoID(fromURL)
{
	if(!StringIsValidYouTubeVideoURL(fromURL)) return;

	fromURL = fromURL.trim();
	fromURL = fromURL.replace("https://www.youtube.com/watch?v=", "");

	videoID = fromURL;

	lessonVideoURLInput.value = "https://www.youtube.com/watch?v=" + videoID;

	var idNode = xmlDoc.getElementsByTagName("id")[0];
	idNode.childNodes[0].nodeValue = videoID;

	SaveXMLSource();
	ResetVideoView();
}

function ChangeLessonVideoLanguages()
{
	var atLeastOneCheckboxIsChecked = false;
	for(i = 0; i < videoLanguageCheckboxes.length; i++)
	{
		if(!videoLanguageCheckboxes[i].checked)
			continue;

		atLeastOneCheckboxIsChecked = true;
		break;
	}

	if(!atLeastOneCheckboxIsChecked)
		videoLanguageCheckboxes[0].checked = true;

	var checkedBoxes = new Array(0);

	for(i = 0; i < videoLanguageCheckboxes.length; i++)
	{
		if(!videoLanguageCheckboxes[i].checked)
			continue;

		checkedBoxes.push(videoLanguageCheckboxes[i]);
	}

	var videoLanguages = new Array(checkedBoxes.length);

	for(i = 0; i < videoLanguages.length; i++)
		videoLanguages[i] = checkedBoxes[i].value;

	var videoLanguagesNode = xmlDoc.getElementsByTagName("video_languages")[0];

	var videoLanguagesNodeValue = "";

	for(i = 0; i < videoLanguages.length; i++)
	{
		videoLanguagesNodeValue += videoLanguages[i];

		if(i < videoLanguages.length - 1)
			videoLanguagesNodeValue += ",";
	}

	videoLanguagesNode.childNodes[0].nodeValue = videoLanguagesNodeValue;

	SaveXMLSource();
}

function ChangeTranscriptLanguage()
{
	transcriptLanguageSelected = transcriptLanguagesSelect.value;
	transcriptLanguageSelectedIndex = transcriptLanguagesSelect.selectedIndex;

	LoadLessonDetails();
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
	xmlSource = fileReader.result;
	xmlSourceTextArea.value = xmlSource;

	LoadXMLSource();

	if(!videoViewSetUp)
		SetupVideoView();
	else
		ResetVideoView();

	saveButton.disabled = false;
	addNodeButton.disabled = false;
	startEndSectionButton.disabled = false;

	DebugLog("Loaded: " + fileInputFile.name);
}

function FileInput_OnChanged(event)
{
	var file = fileInput.files[0];

	fileInputFile = file;
	fileInputFileName = file.name;

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

function LessonDetail_OnChanged(elementName)
{
	if(elementName == "lessonTitleInput")
		ChangeLessonTitle(0, lessonTitleInput.value);

	if(elementName == "lessonVideoTitleInput")
		ChangeLessonTitle(1, lessonVideoTitleInput.value);

	if(elementName == "lessonVideoURL")
		ChangeLessonVideoID(lessonVideoURLInput.value);

	if(elementName == "videoLanguageCheckbox")
		ChangeLessonVideoLanguages();
}

function LessonVideoURLInput_OnChanged(event)
{
	UpdateLessonVideoURLInput();
}

function Load()
{
	LoadFile();
}

function LoadFile()
{
	fileReader.readAsText(fileInputFile);
}

function LoadLessonDetails()
{
	var videoLanguagesNode = xmlDoc.getElementsByTagName("video_languages")[0];

	videoLanguages = videoLanguagesNode.childNodes[0].nodeValue.split(',');

	var transcriptLanguagesNode = xmlDoc.getElementsByTagName("transcript_languages")[0];

	transcriptLanguages = transcriptLanguagesNode.childNodes[0].nodeValue.split(',');

	transcriptLanguagesSelect.innerHTML = "";

	transcriptLanguageSelectedIndex = -1;

	for (i = 0; i < transcriptLanguages.length; i++)
	{
		var languageName;

		switch(transcriptLanguages[i])
		{
			case "en-us":
				languageName = "English (US)";
				break;
			case "zh-tw":
				languageName = "中文（台灣）";
				break;
			case "pinyin-tw":
				languageName = "Pinyin (TW)";
				break;
			default:
				languageName = "English (US)";
		}

		transcriptLanguagesSelect.innerHTML += "<option value='" + transcriptLanguages[i] + "'>" 
			+ languageName + "</option>";

		if(transcriptLanguageSelected != transcriptLanguages[i])
			continue;

		transcriptLanguageSelectedIndex = i;
		transcriptLanguagesSelect.selectedIndex = i;
	}

	if(transcriptLanguageSelectedIndex == -1)
	{
		transcriptLanguageSelected = transcriptLanguages[0];
		transcriptLanguagesSelect.selectedIndex = 0;
	}

	var videoIDNode = xmlDoc.getElementsByTagName("id")[0];

	videoID = videoIDNode.childNodes[0].nodeValue;

	var titleNodes = xmlDoc.getElementsByTagName("title");

	var titleElement = titleNodes[0].childNodes[0];

	while(titleElement.nodeName != transcriptLanguageSelected)
		titleElement = titleElement.nextSibling;

	lessonTitleInput.value = titleElement.childNodes[0].nodeValue;

	titleElement = titleNodes[1].childNodes[0];

	while(titleElement.nodeName != transcriptLanguageSelected)
		titleElement = titleElement.nextSibling;

	lessonVideoTitleInput.value = titleElement.childNodes[0].nodeValue;

	lessonVideoURLInput.value = "https://www.youtube.com/watch?v=" + videoID;

	for(i = 0; i < videoLanguageCheckboxes.length; i++)
	{
		videoLanguageCheckboxes[i].disabled = false;

		videoLanguageCheckboxes[i].checked = false;

		var languageCheck = false;
		for(j = 0; j < videoLanguages.length; j++)
		{
			if(videoLanguageCheckboxes[i].value != videoLanguages[j])
				continue;

			languageCheck = true;
			break;
		}

		if(languageCheck)
			videoLanguageCheckboxes[i].checked = true;
	}

	for(i = 0; i < transcriptLanguageCheckboxes.length; i++)
	{
		// transcriptLanguageCheckboxes[i].disabled = false;

		transcriptLanguageCheckboxes[i].checked = false;

		var languageCheck = false;
		for(j = 0; j < transcriptLanguages.length; j++)
		{
			if(transcriptLanguageCheckboxes[i].value != transcriptLanguages[j])
				continue;

			languageCheck = true;
			break;
		}

		if(languageCheck)
			transcriptLanguageCheckboxes[i].checked = true;
	}
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

		var removeDisabled = "disabled = 'true'";
		if(transcriptNodes.length > 1)
			removeDisabled = "";

		var shiftUpDisabled = "disabled = 'true'";
		if(i > 0)
			shiftUpDisabled = "";

		var shiftDownDisabled = "disabled = 'true'";
		if(i < transcriptNodes.length - 1)
			shiftDownDisabled = "";

		nodesTable.innerHTML += 
			"<tr><td><div class='buttonGroup'><button class='nodeTableAction' " 
				+ "onclick='SeekInVideo(" + 
				ParseFormattedTimeStringToSeconds(transcriptTimes[i]) + ")'>Seek</button>" 
			+ "<button class='nodeTableAction' onclick='TranscriptRemoveNode(" + i + ")' " 
				+ removeDisabled + ">Remove</button></div>" 
			+ "<div class='buttonGroup'><button class='nodeTableAction' " 
				+ "onclick='TranscriptSplitNode(" + i + ")'>Split</button>" 
			+ "<button class='nodeTableActionHalf' onclick='TranscriptShiftNode(" + i + ", -1)'" 
				+ shiftUpDisabled + ">🡹</button>"
			+ "<button class='nodeTableActionHalf' onclick='TranscriptShiftNode(" + i + ", 1)'" 
				+ shiftDownDisabled + ">🡻</button></div></td>"
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

	LoadLessonDetails();

	LoadTranscriptNodes();

	UpdateLessonVideoURLInput();
}

function New()
{
	xmlSource = "<?xml version='1.0' encoding='utf-8'?><lesson><title><en-us>(New Lesson)" 
		+ "</en-us><zh-tw>(新的課程)</zh-tw></title><languages><video_languages>en-us,zh-tw" 
		+ "</video_languages><transcript_languages>en-us,zh-tw</transcript_languages>" 
		+ "</languages><video><title><en-us>(Video Title)</en-us><zh-tw>(視頻標題)</zh-tw>" 
		+ "</title><id>AUl771jkMqk</id></video><transcript><nodes><node><time>0:00</time>" 
		+ "<en-us>...</en-us><zh-tw>...</zh-tw></node></nodes></transcript></lesson>";

	xmlSourceTextArea.value = xmlSource;

	LoadXMLSource();

	if(!videoViewSetUp)
		SetupVideoView();
	else
		ResetVideoView();

	saveButton.disabled = false;
	addNodeButton.disabled = false;
	startEndSectionButton.disabled = false;

	DebugLog("New lesson created.");
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
		StartEndSection();
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

function ParseYouTubeVideoURLForVideoID(value)
{
	if(!StringIsValidYouTubeVideoURL(value))
		return "";

	value = value.replace("https://www.youtube.com/watch?v=", "");

	return value;
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

function Save()
{
	xmlSource = xmlSourceTextArea.value;

    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(xmlSource));
    element.setAttribute('download', fileInputFileName);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
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

function SetupPage()
{
	fileInput = document.getElementById("fileInput");

	fileReader.addEventListener("load", FileReader_OnLoad);

	lessonTitleInput = document.getElementById("lessonTitleInput"); 
	lessonVideoTitleInput = document.getElementById("lessonVideoTitleInput"); 
	lessonVideoURLInput = document.getElementById("lessonVideoURLInput"); 
	changeVideoIDButton = document.getElementById("changeVideoIDButton");
	changeVideoIDButton.disabled = true;

	videoLanguageCheckboxes = document.getElementsByName("videoLanguageCheckbox");
	for(i = 0; i < videoLanguageCheckboxes.length; i++)
		videoLanguageCheckboxes[i].disabled = true;

	transcriptLanguageCheckboxes = document.getElementsByName("transcriptLanguageCheckbox");
	for(i = 0; i < transcriptLanguageCheckboxes.length; i++)
		transcriptLanguageCheckboxes[i].disabled = true;

	saveButton = document.getElementById("saveButton");
	saveButton.disabled = true;

	xmlSourceTextArea = document.getElementById("xmlSourceTextArea");

	addNodeButton = document.getElementById("addNodeButton");
	addNodeButton.disabled = true;
	startEndSectionButton = document.getElementById("startEndSectionButton");
	startEndSectionButton.disabled = true;

	transcriptLanguagesSelect = document.getElementById("transcriptLanguagesSelect");

	nodesTable = document.getElementById("nodesTable");

	nodesTable.innerHTML += "<tbody>";

	nodesTable.innerHTML += "<tr><td><div class='buttonGroup'><button class='nodeTableAction' " 
			+ "disabled='true'>Seek</button>" 
		+ "<button class='nodeTableAction' disabled='true'>Remove</button><div>" 
		+ "<div class='buttonGroup'><button class='nodeTableAction' disabled='true'>Split" 
			+ "</button>" 
		+ "<button class='nodeTableActionHalf' disabled='true'>🡹</button>"
		+ "<button class='nodeTableActionHalf' disabled='true'>🡻</button></div></td>"
		+ "<td><input class='time' value='0:00'></input></td><td>" 
		+ "<textarea rows='3' cols='50'></textarea></td></tr>";

	nodesTable.innerHTML += "</tbody>";

	videoTime = document.getElementById("videoTime");
	videoPlayPauseButton = document.getElementById("videoPlayPauseButton");

	currentTranscriptText = document.getElementById("currentTranscriptText");
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

function StartEndSection()
{
	if(!sectionStarted)
	{
		sectionStarted = true;
		videoHasBeenPlayed = true;

		sectionTimeStartInSeconds = videoPlayer.getCurrentTime();

		videoPlayer.playVideo();

		startEndSectionButton.innerHTML = "End Section (\\)";
		videoPlayPauseButton.disabled = true;
	}
	else
	{
		sectionStarted = false;

		var formattedTime = FormatTimeToString(sectionTimeStartInSeconds);
		var timeExists = false;

		for(i = 0; i < transcriptTimes.length; i++)
		{
			if(transcriptTimes[i] != formattedTime) 
				continue;

			timeExists = true;
			break;
		}

		if(!timeExists)
			TranscriptAddNode(formattedTime, "...");

		videoPlayer.pauseVideo();

		startEndSectionButton.innerHTML = "Start Section (\\)";
		videoPlayPauseButton.disabled = false;

		SaveXMLSource();
		LoadXMLSource();
	}
}

function StringIsValidYouTubeVideoURL(value)
{
	value = value.trim();

	if(value.length == 0) return false;
	if(!value.includes("https://www.youtube.com/watch?v=")) return false;

	value = value.replace("https://www.youtube.com/watch?v=", "");

	if(value.length != 11) return false;

	return true;
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

function TranscriptShiftNode(atIndex, direction)
{
	if(direction != -1 && direction != 1) return;

	if(atIndex + direction < 0 || atIndex + direction >= transcriptNodes.length)
		return;

	var transcriptNodeFirst = transcriptNodes[atIndex];
	var transcriptNodeSecond = transcriptNodes[atIndex + direction];

	if(direction == 1)
	{
		transcriptNodeSecond.parentNode.insertBefore(transcriptNodeSecond, 
			transcriptNodeFirst);
	}
	else
	{
		transcriptNodeFirst.parentNode.insertBefore(transcriptNodeFirst, 
			transcriptNodeSecond);
	}

	xmlSource = new XMLSerializer().serializeToString(xmlDoc);
	xmlSourceTextArea.value = xmlSource;

	LoadXMLSource();
}

function TranscriptSplitNode(atIndex)
{
	if(atIndex < 0 || atIndex >= transcriptNodes.length)
		return;

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

function UpdateLessonVideoURLInput()
{
	var newVideoID = ParseYouTubeVideoURLForVideoID(lessonVideoURLInput.value);

	var disabled = false;

	if(newVideoID == "" || videoID == newVideoID)
		disabled = true;

	changeVideoIDButton.disabled = disabled;
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