"use strict";

/** 
	Base type for instructions to advisors. Can be used directly or sub-typed
 */
types.InstructionStanza = function (id, stanza) {
	types.Stanza.call(this, id, stanza);
};

$.extend(types.InstructionStanza.prototype, Object.create(types.Stanza.prototype), {
	getType: function () {
		return "instruction";
	},
	
	toHTML: function () {
		console.log("Hello");
		var text = this.getText();
		
		if (text === undefined) {
			return buildElement("p", "empty");		
		}
	
		text = this.getText().split(" ");
		
		var result = buildElement("span", this.getType(), 
			buildElement("strong", "first", text.shift()),
			" ",
			text.join(" ")
		)
					
		result.dataset.id = this.getIdString();
		
		if (this.data.howto) {
			attachHowto(result, this.data.howto);
		}
		
		return result;
	},
	
	/**
		Instructions 'stack' by default, but can be over-ruled in specific cases.
	 */
	isStacked: function () {
		if ('stack' in this.data) {
			return this.data.stack;
		} else {
			return true;
		}
	},
	getTabs: function () {
		var tabs = [];
		
		if (this.hasRouting()) {
			tabs.push(this.buildRoutingTab());
		} else {
			tabs.push(this.buildNextTab());
		}
				
		return tabs.concat(this.getDefaultTabs());
	},
			
	buildNextTab: function () {
		var scratch = buildElement("div", "form-inline d-flex",
			buildNextInput(this, 0, this.getNext(0)),
			buildNextButton(this.getNext(0))
		);
		return ["Next stanza", scratch];
	}
});


/**
	Gives advisors a textbox and a 'copy' button, to copy arbitary text onto the clipboard.
	
 */
types.CopyNoteStanza = function (id, stanza) {
	types.InstructionStanza.call(this, id, stanza);
};

$.extend(types.CopyNoteStanza .prototype, Object.create(types.InstructionStanza.prototype), {
	getType: function () {
		return "copy_note";
	},
	
	
	_toText : function (html) {
		var result = "";
		var i, node;
		
		for (i =0 ; i < html.childNodes.length; i +=1 ) {
			node = html.childNodes[i];
			if (node.nodeType === 3) { // text nodes
				result += node.nodeValue;
			} else if (node.nodeType === 1) { // element node
				if (node.nodeName === 'BR') {
					result += "\n";
				} else {
					result += this._toText(node);
				}
			}	
		}
		
		result = result.replace(/ +/, ' ');
		
		return result;
	
	},
	
	toHTML: function () {
		var cols = 60, rows = 0;
		var text = this.getText();
		var i, lines = text.split("\n");
		var scratch = buildElement("span", undefined);
		
		for (i = 0; i < lines.length; i += 1) {
			scratch.appendChild(textNode(lines[i]));
			scratch.appendChild(buildElement("br"));		
		}

		replacePlaceholders(scratch);

		text = this._toText(scratch);
		
		text.split("\n").forEach(function (line) {
			rows += Math.ceil(line.length / cols);
		});

		var outer = buildElement("div", "self-render form-group");
		
		var textarea = buildElement("textarea", "copynote form-control", text);
		textarea.setAttribute("spellcheck", "false");
		textarea.rows = Math.max(rows + 1, 4);
		textarea.cols = cols;
		
		outer.appendChild(textarea);
		
		var button = buildElement("button", "btn btn-primary", "Copy note");
				
		function _onClick() {
			$(button).off("click");
			var buttonText = $(button).text();
			
			// Copy to clipboard stuff
			var copyText = buildElement("textarea", undefined, $(textarea).val());
			this.appendChild(copyText);		
			copyText.select();
			document.execCommand("copy");	
			copyText.parentNode.removeChild(copyText);
			
			var width = $(button).width();
			
			$(button)		
				.on("animationend", function () {
					$(button)
						.removeClass("flash")
						.on("click", _onClick)
						.text(buttonText);
				})
				.text("Copied")
				.width(width)
				.addClass("flash");
		}
		
		$(button).on("click", _onClick);
		
		outer.appendChild(button);
		
		return outer;
	},
	
	isStacked: function () {
		return false;
	},
	
	isSelfRender: function () {
		return true;
	},
});


/** 
	There should be exactly one 'end' type stanza per process.
	The front-end doesn't display it, its just a marker that the author finished a strand on purpose.
 */

types.EndStanza = function (id, stanza) {
	types.InstructionStanza.call(this, id, stanza);
};

$.extend(types.EndStanza.prototype, Object.create(types.InstructionStanza.prototype), {
	getType: function () {
		return "end";
	},
	
	isTerminal: function () {
		return true;
	},
	
	getNext: function () {
		return -1;
	},
	getTabs: function () {
		return [];
	},
	buildText: function () {
		return buildElement("div", "mr-3", "End of this process");
	}
});

/**
	Notes are Instructions with fancy formatting.
 */
types.NoteStanza = function (id, stanza) {
	types.InstructionStanza.call(this, id, stanza);
};
$.extend(types.NoteStanza.prototype, Object.create(types.InstructionStanza.prototype), {
	getType: function () {
		return "note";
	},

	toHTML: function () {
		var result = buildElement("div", "bs-callout bs-callout-info");
		result.appendChild(buildElement("h4", "card-title", "Note:"));

		var note = buildElement("div", "card-text", this.getText());
		note.dataset.id = this.getIdString();
		
		result.appendChild(note);
		return result;
	},
	isStacked: function () {
		if ('stack' in this.data) {
			return this.data.stack;
		} else {
			return false;
		}
	}
});

/**
	Importants are Instructions with fancy formatting.
 */
types.ImportantStanza = function (id, stanza) {
	types.InstructionStanza.call(this, id, stanza);
};
$.extend(types.ImportantStanza.prototype, Object.create(types.InstructionStanza.prototype), {
	getType: function () {
		return "important";
	},

	toHTML: function () {
		var result = buildElement("div", "bs-callout bs-callout-danger");
		result.appendChild(buildElement("h4", "card-title", "Important:"));

		var note = buildElement("div", "card-text", this.getText());
		note.dataset.id = this.getIdString();
		
		result.appendChild(note);
		return result;
	},
	isStacked: function () {
		if ('stack' in this.data) {
			return this.data.stack;
		} else {
			return false;
		}
	}
});
/**
	PTA Notes are Instructions with fancy formatting.
 */
types.PTAStanza = function (id, stanza) {
	types.InstructionStanza.call(this, id, stanza);
};
$.extend(types.PTAStanza.prototype, Object.create(types.InstructionStanza.prototype), {
	getType: function () {
		return "PTA";
	},

	toHTML: function () {
		var result = buildElement("div", "bs-callout bs-callout-PTA");
		result.appendChild(buildElement("h4", "card-title", "Personal Tax Account"));

		var note = buildElement("div", "card-text", this.getText());
		note.dataset.id = this.getIdString();
		
		result.appendChild(note);
		return result;
	},
	isStacked: function () {
		if ('stack' in this.data) {
			return this.data.stack;
		} else {
			return true;
		}
	}
});

types.QuestionStanza = function (id, stanza) {
	types.Stanza.call(this, id, stanza);
};

$.extend(types.QuestionStanza.prototype, Object.create(types.Stanza.prototype), {
	getType: function () {
		return "question";
	},
	
	isQuestion: function () {
		return true;
	},

	getAnswerCount: function() {
		return this.data.answers.length;
	},

	getAnswer: function (index) {
		var thizz = this;
		var answerText = UCFirst(getPhrase(this.data.answers[index]));

		var answer = buildElement("button", "list-group-item list-group-item-action cmd-answer", 
			buildElement("div", undefined, 
				buildFA("arrow-circle-right"),
				buildElement("span", undefined, answerText)
			)
		);
		
		var next = this.getNext(index);
				
		$(answer)
			.on("click", function () {
				var scratch = buildElement("span", "answer", " - ", answerText);
				replacePlaceholders(scratch);
			
				$(this).closest(".collapse").slideUp();
				$(this).closest(".card").find(".card-header").slideDown();
				$(this).closest(".card").find(".questionHistory").append(scratch);
	
				questionHistory[questionHistory.length - 1][1] = index;
																	
				if (thizz.data.label) {
					customer[thizz.data.label] = answerText;
				} else {
					customer[getPhrase(thizz.data.text)] = answerText;
				}
				
				render(next);
	
				return false;
			});					
		return answer;
	},
	
	getAnswerText: function (index) {
		return getPhrase( this.data.answers[index]);
	},
	
	toHTML: function () {
		var actionWords = arrayToHash(["ask", "check", "select"]);
		var text = this.getText().split(" ");
		
		var result = buildElement("span", this.getType() + (text[0].toLowerCase() in actionWords ? " action" : ""), 
			buildElement("span", "first", text.shift()),
			" ",
			text.join(" ")
		)
		
		if ('link' in this.data) {
			attachLink(this, result);
		} else if ('howto' in this.data) {
			attachHowto(result, this.data.howto);
		}
					
		result.dataset.id = this.getIdString();
		if (this.hasWebchat()) {
			result.dataset.webchat = this.getWebchat();
		}

		return result;
	},
	
	getTabs: function () {
		var tabs = [this.buildAnswerTab(), this.buildLabelTab()];
		
		if (this.hasRouting()) {
			tabs.push(this.buildRoutingTab());
		}
		
		return tabs.concat(this.getDefaultTabs());
	
	},
	
	buildAnswerTab: function () {	
		var scratch, ul, i, div;
	
		var div = buildElement("div");
		
		if (this.hasAnswers()) {
			ul = buildElement("ul", "list-group list-group-flush mb-sm-3");
	
			for (i =0 ; i < this.data.answers.length; i += 1) {
				
				ul.appendChild(
					buildAnswerInput(this, i)
				);
				
			}
			div.appendChild(ul);
		}
		
		div.appendChild($("<div class='mb-sm-3'><button type='button' class='btn btn-primary cmd-add-answer' data-which='" + this.data.id + "'>Add new answer</button></div>")[0]);
	
		return ["Answers", div];
	}
});

types.ToolStanza = function (id, stanza) {
	if (!("answers" in stanza)) {
		stanza.answers = [];
	}
	
	if (!("next" in stanza)) {
		stanza.next = [];
	}
	
	types.QuestionStanza.call(this, id, stanza);
};

$.extend(types.ToolStanza.prototype, Object.create(types.QuestionStanza.prototype), {
	getType: function () {
		return "tool";
	},
	getAnswerCount: function() {
		return 1;
	},
	
	isQuestion: function () {
		var tool = Tools.getTool(this.data.tool);
		
		if (tool !== undefined) {
			return !tool.inline;
		} else {
			return false;
		}
	},
	
	hasAnswers: function () {
		return this.isQuestion();
	},
	
	isSelfRender: function () {
		return true;
	},
	
	getAnswerText : function(index) {
		var tool = Tools.getTool(this.data.tool);
		
		if (tool !== undefined) {	
			return tool.answers[index];
		} else {
			return "";
		}	
	},

	buildAnswerTab: function () {	
		var scratch, ul, i, div;
	
		var div = buildElement("div");

		var tool = Tools.getTool(this.data.tool);
		
		if (tool !== undefined) {			
			ul = buildElement("ul", "list-group list-group-flush mb-sm-3");
	
			for (i =0 ; i < tool.answers.length; i += 1) {
				
				ul.appendChild(
					buildAnswerInput(this, i)
				);
				
			}
			div.appendChild(ul);
		}
	
		$(div).find(".ipt-answer-text").prop("disabled", true);
	
		return ["Answers", div];
	},

	
	getTabs: function () {

		return [this.buildAnswerTab(), this.buildLabelTab()];
	},

	getText: function () {
		var tool = Tools.getTool(this.data.tool);
		if (tool !== undefined) {
			return tool.name;
		} else {
			return "Tool";
		}	
	},
	
	buildText : function () {
		var thizz = this, tool;
		var id, option, description;
		
		var result = buildElement("div", "form-group mb-3");		
		var select = buildElement("select", "form-control cmd-tool-type");

		description = buildElement("div");
		
		option = buildElement("option", undefined, "Please select tool from list");

		select.appendChild(option);
		$(result).on("change",  select, function () {
			thizz.data.tool = select.value;
			
			thizz.data.next = [];			
			
			if (!thizz.data.tool.match(/^tool\d{5}$/)) {
				delete thizz.data.tool;
				return;
			}
			
			var tabId = buildTabId(thizz, "Answers");
			
			var tab = thizz.buildAnswerTab();
			
			tab[1].id = tabId;
			tab[1].classList.add("tab-pane");
			tab[1].classList.add("active");	
			tab[1].setAttribute("role", "tabpanel");
	
			$("#" + tabId).replaceWith(tab[1]);
			
			$(description).text(Tools.getTool(thizz.data.tool).description);	
		});
	
		for (id in Tools.getTools()) {
			tool = Tools.getTool(id);
			option = buildElement("option", undefined, tool.name);
			option.value = id ;
			
			if (id === this.data.tool) {
				option.selected = true;
				$(description).text(tool.description);				
			}
						
			select.appendChild(option);
		}
	
		result.appendChild(select);
	
		result.appendChild(buildElement("div", "mt-3 mb-3", description));
						
		return result;
	
	},
	
	getAnswer: function () {			
		this.answer = buildElement("button", "list-group-item list-group-item-action cmd-answer", 
			buildElement("div", undefined, 
				buildFA("arrow-circle-right"),
				" Continue"
			)
		);
		
		$(this.answer).prop("disabled", true);
		
		
		return this.answer;
	},
	
	toHTML: function () {
		var thizz = this;
		
		var id = this.data.tool;
		var iframe = buildElement("iframe", "tool");
		
		Tools.onLoad(function () {
			var tool = Tools.getTool(id);
		
			if (tool.inline) {
				iframe.classList.add("inline");
			}
			
			$(iframe).on("load", function () {			
				var iframeCount;

				// Count the instructions in this iframe, record it, and update the counter.
				iframeCount = $($(iframe).contents()).find("div.instruction").length;
				iframe.dataset.count = iframeCount;					
				$(iframe).css("counter-increment", "instructions " + iframeCount);
				
				// Run through every iframe and make sure their internal counters are right				
				$(iframe).closest("ul").find("iframe.tool.inline").each(function (index) {
					var count;
					var instructionCount = $(this).prevAll("li.instruction").length;
					
					$(this).prevAll("iframe.tool.inline").each(function (index) {
						count = parseInt(this.dataset.count, 10);
						if (!isNaN(count)) {
							instructionCount += count;
						}					
					});
					
					$($(this).contents()).find("div.instruction").first().css("counter-reset", "x " + instructionCount);								
				
					if ((instructionCount + iframeCount) !== 1) {
						$(iframe).closest("ul.solo").removeClass("solo");
					}					
				});
								
				// Tag the iframe as inline
				if (tool.inline) {
					iframe.contentWindow.document.body.classList.add("inline");								
				}
								
				// Fix the height
				$(iframe).height(iframe.contentWindow.document.body.offsetHeight + 4);
						
				if (typeof iframe.contentWindow.init === "function") {				
					// Trigger iframe code.
					try {			
						iframe.contentWindow.init(customer, function (c2, result) {						
							if (result >= 0) {
								Object.assign(customer, c2);
								
								$(thizz.answer)
									.prop("disabled", false)
									.off("click")
									.on("click", function () {
										$(this).closest(".collapse").slideUp();
										$(this).closest(".card").find(".card-header").slideDown();
										$(this).closest(".card").find(".questionHistory").append(" - <span class='answer'>" + tool.answers[result]  + "</span>");
										
										questionHistory[questionHistory.length - 1][1] = result;
										render(thizz.getNext(result));
										
										return false;
									});
							} else {
								$(thizz.answer)
									.prop("disabled", true)
									.off("click");
							}
						});
					} catch (ex) {
						console.log("Problem running tool " + id, ex);
					}
				} else {
					console.log("Problem running tool " + id + ": Missing init");
				}
			});
			

			// Trigger loading			
			iframe.src = "tools/" + id + ".htm";
		});
		
		return iframe;
	}
});



types.DateStanza = function (id, stanza) {
	types.QuestionStanza.call(this, id, stanza);
};

$.extend(types.DateStanza.prototype, Object.create(types.QuestionStanza.prototype), {
	getType: function () {
		return "date";
	},
	
	formatDate: function (date) {
		return pad(date.getDate(), 2) + "/" + pad(date.getMonth() + 1, 2) + "/" + pad(date.getFullYear(), 4);	
	},
	
	setDate: function (date) {	
		this.data.date = date;
	},
	
	getDate: function () {
		return this.data.date;
	},
	
	hasValidDate: function () {
		return ("date" in this.data && !isNaN(this.data.date));
	},
	
	hasAnswers: function () {
		return true;
	},
	
	getTimescaleDate: function(timescale) {
		var date = new Date();
		date.setHours(0, 0, 0, 0);
		var match = timescale.match(/^(\d+)\s+(working\s+)?(day|week)s?$/);
		var number;
		if (match) {
			number = parseInt(match[1], 10);
			if (match[2] !== undefined) {
				// Working days
				number *= (match[3] === 'week' ? 7 : 1);
				while (number > 0) {
					date.setDate(date.getDate() - 1);
					if (!Timescales.isBankHoliday(date) && date.getDay() !== 0 && date.getDay() !== 6) {
						number -= 1;
					}
				}
			} else {
				number *= (match[2] === 'week' ? 7 : 1);
				date.setDate(date.getDate() - number);
			}
		} else {
			// Always in working days
			return date.setDate(date.getDate() - Math.round(5 * (Timescales.getRaw(timescale) / 7)));
		}
		return date;
	},
	
	moveOn: function () {
		var timescale, date = this.getDate(),  next, card, answer;
		date.setHours(0, 0, 0, 0);
		timescale = this.getTimescaleDate(this.data.timescale);
		
		if (date < timescale) {
			// Outside timescale
			next = this.data.next[1];
			answer = 'outside';
		} else {
			// Within timescale
			next = this.data.next[0];
			answer = 'inside';
		}
					
		questionHistory[questionHistory.length - 1][1] = "[Date:" + this.formatDate(this.getDate()) + "]";
													
		card = $("[data-id=" + this.getIdString() + "]").closest(".card");
		
		card.find(".process").closest(".collapse").slideUp();
		card.find(".card-header").slideDown();
		card.find(".questionHistory").append(" - <span class='answer'>" + this.formatDate(this.getDate())  + "</span>");
	
		if (this.data.label) {
			customer[this.data.label] = date;
		} else {
			customer[getPhrase(this.data.text)] = date;
		}
	
		render(next);
	
		return false;
	},
	
	getAnswerCount: function() {
		return 1;
	},
	
	getAnswer: function (index) {			
		var thizz = this;
		var answer = buildElement("button", "list-group-item list-group-item-action cmd-answer", 
			buildElement("div", undefined, 
				buildFA("arrow-circle-right"),
				" Continue"
			)
		);
		
		$(answer).prop("disabled", !this.hasValidDate());
		
		var next = this.getNext(index);
		
		if (next.match(/^[a-z]{3}[0-9]{5}$/)) {
			$(answer).on("click", function () {
				window.location.assign(buildLegacyLink(next));
				return false;
			});
		} else {
			$(answer).on("click", this.moveOn.bind(this));
		}

		return answer;
	},

	toHTML: function () {
		var scratch = buildElement("input", "form-control");
		scratch.type = "text";
		scratch.value = this.getDate() === undefined ? "" : this.formatDate(this.getDate());
		
		var thizz = this;
		var _onEvent = function () {
			$(scratch).datepicker("change", thizz.setDate.bind(thizz));
			$(scratch).datepicker("endDate", new Date());
			$(scratch).datepicker("close", function () {				
				if (thizz.hasValidDate()) {
					$(scratch).closest(".card").find(".cmd-answer").prop("disabled", false);
				} else {
					$(scratch).closest(".card").find(".cmd-answer").prop("disabled", true);
				}
			});
			$(scratch).datepicker("show");
		}.bind(this);
		
		$(scratch).on("focus", _onEvent);
		
		var button = buildElement("button", "btn btn-secondary", buildFA("calendar"));
		button.type = "button";
		$(button).on("click", _onEvent);

		var actionWords = arrayToHash(["ask", "check"]);
		var text = this.getText().split(" ");
		
		var result = buildElement("span", "question date" + (text[0].toLowerCase() in actionWords ? " action" : ""), 
			buildElement("span", "first", text.shift()),
		
			"\u00a0",
			text.join(" "),
	
			buildElement("span", "form-inline", 
				buildElement("div", "input-group ml-3 mb-3",
					scratch,
					buildElement("span", "input-group-button",
						button
					)
				)
			)
		);
		
		result.normalize();
					
		result.dataset.id = this.getIdString();
		
		if (this.data.howto) {
			attachHowto(result, this.data.howto);
		}
	

		return result;
	},
	
	getTabs: function () {
		var tabs = [this.buildAnswerTab(), this.buildLabelTab()];
		
		if (this.hasRouting()) {
			tabs.push(this.buildRoutingTab());
		}
		
		return tabs.concat(this.getDefaultTabs());
	
	},
		
	buildAnswerTab: function () {
		if (!("next" in this.data)) {
			this.data.next = [undefined, undefined];
		}
						
		function _buildRow(when, index) {
			var row = buildElement("div", "list-group-item form-inline border-0 pl-0");

			var ipt = buildElement("input", "form-control ipt-answer-next")
			ipt.placeholder = "Destination";
			ipt.dataset.which = this.data.id;
			ipt.dataset.index = index;
			if ("next" in this.data && this.data.next[index] !== undefined) {
				ipt.value = this.data.next[index];	
			}
			
			row.appendChild(
				buildElement("div", "input-group mr-3", 
					buildElement("div", "input-group-addon", when),
					ipt
				)
			);
			
			var scratch = buildElement("div", "btn-group");
			var button, next;		
				
			if ("next" in this.data && !this.hasRouting()) {
				next = this.data.next[index];
				if (stanzaExists(next)) {
					button = buildElement("a", "btn btn-primary cmd-next", buildFA("chevron-right"));
					button.href = "#!q" + next;
				} else if (next !== undefined && next.match(/^[a-z]{3}[0-9]{5}$/)) {
					button = buildElement("a", "btn btn-primary text-white", buildFA(getIconType(next)));
					button.href = buildLegacyLink(next);
					button.target = "_blank";
					button.dataset.next = next;
					button.title = "External link. Click to open in new window";
				} else {
					button = buildElement("button", "btn btn-danger cmd-new", buildFA("chevron-right"));
					
					if (next !== undefined) {
						button.dataset.next = next;
					}
					
					button.title = "Stanza doesn't exist, click here to create";
				}
				
				scratch.appendChild(button);
			}
	
			row.appendChild(scratch);
			
			return row;
		}
		
		var input = buildElement("input", "form-control ipt-timescale");
		if ("timescale" in this.data) {
			input.value = this.data.timescale;
		}
		
		$(input)
			.autocomplete({
				source: Timescales.autocompleteSource,
			})
			.on("change blur", function () {
				var timescale = $(input).val();
				
				if (timescale !== undefined && timescale.length > 0) {
					this.data.timescale = timescale;				
				} else {
					delete this.data.timescale;
				}			
			}.bind(this));
		
		var div = buildElement("div", undefined, 
			buildElement("div", "input-group mr-3 mb-3",
					buildElement("div", "input-group-addon", "Timescale"),
					input
			),
			buildElement("hr", "mb-1 w-75"),
			buildElement("div", "list-group",
				_buildRow.bind(this)("Within timescale", 0),
				_buildRow.bind(this)("Outside timescale", 1)
			)
		);
		
		return ["Answers", div];
	}
});

types.AnnualCodingStanza = function (id, stanza) {
	types.Stanza.call(this, id, stanza);
};

$.extend(types.AnnualCodingStanza.prototype, Object.create(types.Stanza.prototype), {
	getType: function () {
		return "annual_coding";
	},
	
	isQuestion: function () {
		return false;
	},

	toHTML: function () {
		return buildElement("span", "hidden");
	},
	
	hasDisplay: function () {
		return false;
	},
	
	getNext: function () {
		var inside = this.isInside();
	
		if ($("body.preview").length > 0 && this.data.preview) {
			inside = !inside;
		}
			
		if (inside) {
			return this.data.next[0];
		} else {
			return this.data.next[1];
		}
	},
	
	getDates: function () {
		if ("dates" in this.data) {
			return this.data.dates;
		} else {
			// Historical remnent. This stanza type was originaly just for the Annual Coding Run
			// so if no dates are given, use Feb 1 to April 5.
			// Remmeber, months go from 0 - 11.
			return [1, 1, 3, 5];
		}
	},
	
	isInside: function () {
		var today = new Date();
		var startMonth, startDay, endMonth, endDay, thisMonth, thisDay, dates;
		
		dates = this.getDates();
		
		startMonth = dates[0];
		startDay   = dates[1];
		endMonth   = dates[2];
		endDay     = dates[3];
		
		thisMonth = today.getMonth();
		thisDay   = today.getDate();
		
		if (startMonth < endMonth || (startMonth === endMonth && startDay < endDay)) {
			// Excluding year end
			return ((thisMonth > startMonth || (thisMonth === startMonth && thisDay >= startDay)) && (thisMonth < endMonth || (thisMonth === endMonth && thisDay <= endDay)))
		} else if (startMonth > endMonth || (startMonth === endMonth && startDay > endDay)) {
			// Including year end
			return ((thisMonth > startMonth || (thisMonth === startMonth && thisDay >= startDay)) || (thisMonth < endMonth || (thisMonth === endMonth && thisday <= endDay)))	
		} else if (startMonth === endMonth && startDay === endDay) {
			// Both start and end are the same date. Only inside on that date.
			return (thisMonth === startMonth && thisDay === startDay);
		}
	},
	
	getTabs: function () {				
		return [this.buildAnswerTab(), this.buildLabelTab()];
	},
	
	buildAnswerTab: function () {	
		if (!("next" in this.data)) {
			this.data.next = [undefined, undefined];
		}
						
		function _buildRow(when, index) {
			var row = buildElement("div", "list-group-item form-inline border-0 pl-0");

			var ipt = buildElement("input", "form-control ipt-answer-next")
			ipt.placeholder = "Destination";
			ipt.dataset.which = this.data.id;
			ipt.dataset.index = index;
			if ("next" in this.data && this.data.next[index] !== undefined) {
				ipt.value = this.data.next[index];	
			}
			
			row.appendChild(
				buildElement("div", "input-group mr-3", 
					buildElement("div", "input-group-addon", when),
					ipt
				)
			);
			
			var scratch = buildElement("div", "btn-group");
			var button, next;		
				
			if ("next" in this.data && !this.hasRouting()) {
				next = this.data.next[index];
				if (stanzaExists(next)) {
					button = buildElement("a", "btn btn-primary cmd-next", buildFA("chevron-right"));
					button.href = "#!q" + next;
				} else if (next !== undefined && next.match(/^[a-z]{3}[0-9]{5}$/)) {
					button = buildElement("a", "btn btn-primary text-white", buildFA(getIconType(next)));
					button.href = buildLegacyLink(next);
					button.target = "_blank";
					button.dataset.next = next;
					button.title = "External link. Click to open in new window";
				} else {
					button = buildElement("button", "btn btn-danger cmd-new", buildFA("chevron-right"));
					
					if (next !== undefined) {
						button.dataset.next = next;
					}
					
					button.title = "Stanza doesn't exist, click here to create";
				}
				
				scratch.appendChild(button);
			}
	
			row.appendChild(scratch);
			
			return row;
		}
				
		var tab = buildElement("div", "tab-annual-coding", 		
			buildElement("div", "list-group",
				_buildRow.bind(this)("Within ", 0),
				_buildRow.bind(this)("Outside", 1)
			)
		);
		
		return ["Answers", tab];
	},
	
	buildText: function () {
		var months = ["January", "Febuary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		var monthLengths = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];		
		
		var i, option, fromMonthSelect, fromDaySelect, toMonthSelect, toDaySelect, block, dates, inside;
		
		dates = this.getDates();
	
		var input = buildElement("input", "form-check-input chk-override-annual-coding mr-3");
		input.type = "checkbox";
		if (this.data.preview) {
			input.checked = true;
		}
		
		var result = buildElement("div");
		
		// Help
		result.appendChild(buildElement("p", "help", "See help (? in top right of the stanza) for more information about using this stanza"));
		
		
		// From - Month
		block = buildElement("div", "form-inline mb-3",
			buildElement("label", "mr-3", "Start")
		);
		
		fromMonthSelect= buildElement("select", "form-control sel-from-month mr-3");
		
		for (i = 0; i < months.length; i += 1) {
			option = buildElement("option", undefined, months[i]);
			option.value = i;
			
			if (i === dates[0]) {
				option.selected = true;
			}
			
			fromMonthSelect.appendChild(option);
		}
		
		block.appendChild(fromMonthSelect);
		
		
		// From - Day
		fromDaySelect = buildElement("select", "form-control sel-from-day mr-3");
		for (i = 1; i <= 31; i += 1) {
			option = buildElement("option", undefined, i);
			if (i === dates[1]) {
				option.selected = true;
			}
			
			fromDaySelect.appendChild(option);
		}
		
		block.appendChild(fromDaySelect);
		
		result.appendChild(block);
		
		// To - Month		
		block = buildElement("div", "form-inline mb-3",
			buildElement("label", "mr-3", "End")
		);
		
		toMonthSelect= buildElement("select", "form-control sel-to-month mr-3");
		
		for (i = 0; i < months.length; i += 1) {
			option = buildElement("option", undefined, months[i]);
			option.value = i;
			
			if (i === dates[2]) {
				option.selected = true;
			}
			
			toMonthSelect.appendChild(option);
		}
		
		block.appendChild(toMonthSelect);
		
		// To - Day		
		toDaySelect = buildElement("select", "form-control sel-to-day mr-3");
		for (i = 1; i <= 31; i += 1) {
			option = buildElement("option", undefined, i);
			if (i === dates[3]) {
				option.selected = true;
			}
			
			toDaySelect.appendChild(option);
		}
		
		block.appendChild(toDaySelect);
		
		result.appendChild(block);	
		
		// show inside
		inside = buildElement("strong", undefined, this.isInside() ? "inside" : "outside");
		result.appendChild(buildElement("div", "mb-3", "Today is ", inside, " the date range."));
		
		$(result).on("change", "select", function () {
			var fromMonth = parseInt(fromMonthSelect.value, 10);
			var fromDay = parseInt(fromDaySelect.value, 10);
			var toMonth = parseInt(toMonthSelect.value, 10);
			var toDay = parseInt(toDaySelect.value, 10);									
			
			if (!isNaN(fromMonth) && !isNaN(fromDay) && !isNaN(toMonth) && !isNaN(toDay)) {
				this.data.dates = [fromMonth, fromDay, toMonth, toDay];
			}
		
			$(inside).text(this.isInside() ? "inside" : "outside");		
		}.bind(this));

		// Reverse test for preview
		result.appendChild(buildElement("div", "form-check", 
				buildElement("label", "form-check-label",
					input,
					" Reverse the check in preview mode for testing"
				)
			)
		);
		
		return result;
	},	
	
	
});

