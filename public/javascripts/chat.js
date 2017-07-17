$(function () {
	"use strict";
	
	var knownWords = {
		tea: {message: "I can help you make a cup of tea", process:"oct90001"}
	};

	var currentProcess;

	function getNextStanza( stanzaId) {
	    $.getJSON(["process", currentProcess, "stanza", stanzaId].join("/"))
	        .done(function (stanza) {
	            var phrases = [];

	            if ("text" in stanza) {
	                phrases.push(stanza.text);
	            }

	            if ("answers" in stanza) {
	                phrases = phrases.concat(stanza.answers);
	            }

	            if (phrases.length > 0) {
	                $.getJSON(["process", currentProcess, "phrases"].join("/"), {ids: phrases.join(",")})
	                    .done(function (phraseList) {
	                        var i;

	                        for (i = 0; i < phrases.length; i += 1) {
	                            phrasebook[phrases[i]] = phraseList[i];
	                        }

	                        showNextStanza(buildStanza(stanzaId, stanza));
	                    });
	            } else {
	                showNextStanza(buildStanza(stanzaId, stanza));
	            }
	        });
	}
		
	function matchInput(text) {			
		for (keyword in knownWords) {
			if (text.match(keyword)) {
				return knownWords[keyword];
			}
		}
		
		return undefined;		
	}
	
	function buildResponse(text, source) {				
		var response = buildElement("div", "response " + source, buildElement("div", "text", text));	
		
		if (source === "bot") {
			response.appendChild(buildElement("div", "icon", buildFA("cogs")));
		} else if (source === "user") {
			response.insertBefore(buildElement("div", "icon", buildFA("user")), response.firstChild);
		}
		
		return response;
	}

	function addResponse(text, source) {
		var history = document.getElementById("responses");
		
		history.appendChild( buildResponse(text,source), history);
		
		updateScroll();
	}

	function updateScroll() {
		var history = document.getElementById("responses");	
		history.scrollTop = history.scrollHeight;
	}

	function pre_answer(text) {
		$(".answer").off("click");
		$(".answer-block").hide();
		
		addResponse(text, "user");
		updateScroll();
	}

	function answerClick() {
		pre_answer($(this).text());
		$("#input").focus();
		
		getNextStanza(this.dataset.next)
	}
	
	var currentResponse;

	function showNextStanza(stanza) {

		var i, answer, answerBlock;
		
		if (currentResponse === undefined) {
			currentResponse = buildElement("div", "complex-response");		
			addResponse(currentResponse, "bot");
		}
						
		if (!stanza.isQuestion()) {
			if (stanza.isTerminal()) {
				currentResponse = undefined;
				doClose();
				return;
			} else if (stanza.hasWebchat()) {
				currentResponse.appendChild(buildElement("div", "instruction", stanza.getWebchat()));

			} else {
			    currentResponse.appendChild(buildElement("div", "instruction", stanza.getText()));
			}

            getNextStanza(stanza.data.next[0]);
		} else {
			
			currentResponse.appendChild(buildElement("div", "question", stanza.getWebchat()));
			
			answerBlock = buildElement("div", "answer-block");
			
			for (i =0 ; i < stanza.data.answers.length; i += 1) {
				answer = buildElement("a", "answer", getPhrase(stanza.data.answers[i]));
				
				answer.dataset.next = stanza.data.next[i];
				$(answer).on("click", answerClick);
	
				answerBlock.appendChild(buildElement("div", "answer-holder", answer));
			}
			
			currentResponse.appendChild(answerBlock);
			currentResponse = undefined;
		}
		updateScroll();		
	}
	
	function doRestart() {	
		pre_answer($(this).text());	
	
		addResponse("How can I help?", "bot");
		currentStanza = "start";		
		$("#input")
			.prop("disabled", false)
			.focus();
	}
	
	function doWrap() {
		pre_answer($(this).text());		
		addResponse("Thanks for your time. Please come back if you have questions in the future", "bot");		
	}
	
	function doWebchat() {
		pre_answer($(this).text());	
		
		var link = buildElement("a", undefined, "Click here to start a conversation with a human");
		
		link.target = "_blank";
		link.href = "https://online.hmrc.gov.uk/webchatprod/templates/chat/hmrc7/chat.html?entryPointId=1025";
		
		addResponse(buildElement("div", "complex-response",
			buildElement("div", undefined, 
				"Thanks for your time. ", 
				link
			)		
		), "bot");	
	}
	
	function doClose() {
		
		var phrases = [
			["I'd like to ask another question", doRestart],
			["That's all for now", doWrap],
			["Can I speak to a human?",	doWebchat]
		], block, answerBlock, answer, i;
	
		
		block = buildElement("div", "complex-response");	
		answerBlock = buildElement("div", "answer-block");
		
		block.appendChild( buildElement("div", "question","Does that answer your question, or would you like to speak to a human?"));			
				
		for (i =0 ; i < phrases.length; i += 1) {
			answer = buildElement("a", "answer", phrases[i][0]);				
			answerBlock.appendChild(buildElement("div", "answer-holder", answer));
			$(answer).on("click", phrases[i][1]);
		}
		
		block.appendChild(answerBlock);
			
		addResponse(block, "bot");		
	}

	function handleUserInput() {
		var input = $("#input"), text, keyword;
		
		text = input.val();
		input.val("");
		
		addResponse(text, "user");
		
		for (keyword in knownWords) {
			if (text.match(keyword)) {
				addResponse(knownWords[keyword].message, "bot");

				currentProcess = knownWords[keyword].process;

				getNextStanza( "start");
				return;			
			}
		}
		
		addResponse("I'm sorry, I don't know what that means.", "bot");
	}

	function handleKeys(e) {
		if (e.originalEvent.code === "Enter") {
			handleUserInput();
		}
	}

	function doReload() {
		window.location.reload(true);
	}

	$("#input").on("keyup", handleKeys);
	$(".cmd-restart").on("click",  doReload);
		
});



