"use strict";

// START of jQuery extensions

(function ($) 
{
	$.fn.extend
	({
		enable: function () 
		{
			return this.removeAttr('disabled');
		},
		disable: function () 
		{	
			return this.attr('disabled', 'disabled');
		}
	});
})(jQuery); 

// END of jQuery extensions

function pad(number, count) 
{
	number = number.toString();	
	while (number.length < count) 
	{
		number = "0" + number;
	}
	
	return number;
}

/*
 * Function to return ISO date string without daylight saving changes applied
*/
function JStoISO(date)
{
	var day = date.getDate();
	var month = date.getMonth();
	var year = date.getFullYear();

	return year + '-' + pad((month + 1), 2) + '-' + pad(day, 2) + 'T00:00:00Z';
}

/*
 * Function to return javascript date from ISO string without daylight saving changes applied
*/
function ISOtoJS(ISO)
{
	var day = ISO.substring(8, 10);
	var month = ISO.substring(5, 7);
	var year = ISO.substring(0, 4);

	return new Date(year, (month - 1), day);
}

/*
 * Function to retrieve user data based on pid
 * @param - pid
*/ 
function getUser(pid)
{
	var ajaxData;

	$.ajax
	({	
		url: '../backend/getUser.asp',
		data: {pid: pid},
		async: false,
		success: function(data)
		{		
			ajaxData = data;		
		}	
	});

	this.forename = ajaxData.forename;
	this.surname = ajaxData.surname;
	this.fullname = ajaxData.forename + ' ' + ajaxData.surname;
	this.manager = ajaxData.manager;
	this.grade = ajaxData.grade;
	this.role = ajaxData.role;
	
	if(ajaxData.pid != undefined)
		this.pid = ajaxData.pid;
}

/*
 * Function to find all replace all using regex g modifier
 * @param - string to search, what to find, what to replace with
*/
function replaceAll(str, find, replace) 
{
  return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

/*
 * Function to escape special regex characters
 * @param - string
*/

function escapeRegExp(str) 
{
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

/*
 * Function that accepts an ISO date and returns the day and month ie. 1 March
*/
function ISOtoDayMonth(ISO)
{			
	return Number(ISO.substring(8, 10)) + ' ' + getNamedMonth(ISO.substring(5, 7)) + ' ' + ISO.substring(0, 4) + ' @ ' + ISO.substring(11, 16);
	
	function getNamedMonth(month)
	{	
		switch (month)
		{		
			case '01':
				return 'January';
				break;
			case '02':
				return 'February';						
				break;
			case '03':
				return 'March';						
				break;
			case '04':
				return 'April';						
				break;
			case '05':
				return 'May';						
				break;
			case '06':
				return 'June';						
				break;
			case '07':
				return 'July';						
				break;
			case '08':
				return 'August';						
				break;
			case '09':
				return 'September';						
				break;
			case '10':
				return 'October';						
				break;
			case '11':
				return 'Novemeber';						
				break;
			case '12':
				return 'December';						
				break;	
		}	
	}			
}

/*
 * Function to set bootstrap button colour
 * @param - element, outline - is the button a bootstrap outline button - boolean
*/
function changeButtonColour(element, colour, outline)
{
	if (element === undefined || colour === undefined)
	{
		throw 'changeButtonColour error';	
	} 
	else 
	{	
		if (outline === undefined || outline === false)
		{		
			outline = '';		
		} 
		else 
		{		
			outline = outline + '-';		
		}
	
		$(element).removeClass('btn-' + outline + 'primary');
		$(element).removeClass('btn-' + outline + 'secondary');
		$(element).removeClass('btn-' + outline + 'success');
		$(element).removeClass('btn-' + outline + 'info');
		$(element).removeClass('btn-' + outline + 'warning');
		$(element).removeClass('btn-' + outline + 'danger');
		
		$(element).addClass('btn-' + colour);	
	}
}

/*
 * Function that accepts an ISO date and returns the day, month and year ie. 1 March 2017
*/ 
function ISOtoWordedDate(ISO)
{			
	return Number(ISO.substring(8, 10)) + ' ' + getNamedMonth(ISO.substring(5, 7)) + ' ' + ISO.substring(0, 4);			
}

/*
 * Function that accepts an ISO date and returns the day, month and year + time ie. 1 March 2017 @ 14:36
*/ 
function ISOtoWordedDateTime(ISO)
{			
	return Number(ISO.substring(8, 10)) + ' ' + getNamedMonth(ISO.substring(5, 7)) + ' ' + ISO.substring(0, 4) + ' @ ' + ISO.substring(11, 16);
}

/*
 * Parse the query string and return a hash of key/value pairs.
 * If any key is duplicated in the query string, then the matching value in the hash will be a list of the values
*/
function getParam() 
{
	var raw = window.location.search;
	var parts, tmp, key, value, i, param = {};
	
	if (raw === undefined || raw === "") 
		return param;	
	
	raw = raw.substring(1); // remove leading '?';
	
	parts = raw.split("&");

	for (i =0 ; i < parts.length; i += 1) 
	{
		tmp = parts[i].split("=");
		key = decodeURIComponent(tmp[0]);
		value = decodeURIComponent(tmp[1]);
		
		if (key in param) 
		{
			if (typeof param[key] === "string") 
			{
				param[key] = [param[key], value];
			} 
			else 
			{
				param[key].push(value);
			}
		} 
		else 
		{
			param[key] = value;
		}		
	}
	
	return param;
}

/*
 * Function to auto adjust the height of a textbox.
*/
function textAreaAdjust(o) 
{
  o.style.height = "1px";
  o.style.height = o.scrollHeight+"px";
}

/*
 * Function to check if browser is IE.
 * @return - true if browser is IE, false otherwise.
*/
function isIE() 
{ 
	return ((navigator.appName == 'Microsoft Internet Explorer') || ((navigator.appName == 'Netscape') && (new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})").exec(navigator.userAgent) != null))); 
}

/*
 * Function to find PID of the user, only works if browser is IE.
*/
function FindPID()
{
	if (isIE())
	{
		try 
		{
			var wshshell=new ActiveXObject("wscript.shell");
			var username=wshshell.ExpandEnvironmentStrings("%username%");
			return username;
		}
		catch(err)
		{
			var FSO, drvName;
		    FSO = new ActiveXObject("scripting.FileSystemObject");
			drvName = FSO.GetDrive(FSO.GetDriveName("Z:"));
			var drvParts = drvName.ShareName.split("\\");
			if (isNaN(drvParts[4]))
			{
			  	return drvParts[5];
			}
			else
			{
			  	return drvParts[4];
			}
		}
    }
    else
    {
    	return 0
    }
       
}

/*
 * Function to get PID of the user.
 * @return - PID to be returned.
*/
function getPID()
{
	return FindPID();
}

/*
 * Create a dom with a root node <rootName> and a child node <elementName> that is filled with whatever is in object.
 * @param - root node of dom <rootName>.
 * @param - child node of dom <elementName>.
 * @param - child node is filled with this object.
 * @return - dom to be returned.
*/ 

function buildDocument(rootName, elementName, object) 
{
	var dom = createDom(rootName);
	var node = dom.createElement(elementName);
	
	jsToXML(dom, node, object);
	
	dom.documentElement.appendChild(node);

	return dom;
}

/*
 * Creates a dom object.
 * @param - rootName of dom created.
 * @return - returns dom created.
*/
function createDom(rootName) 
{
	var dom = new ActiveXObject("Microsoft.XMLDOM");	
	dom.appendChild(dom.createProcessingInstruction("xml", "version=\"1.0\" encoding=\"UTF-8\""));
	dom.documentElement = dom.createElement(rootName);

	return dom;
}

/*
 * Recursive function that adds new nodes based on the object, new nodes are children of parent.
 * @param - dom to be updated
 * @param - parent of new nodes created
 * @param - object data
*/
function jsToXML(dom, parent, obj) 
{
	var newNode, v, i;

	for (var k in obj) 
	{
		if (obj.hasOwnProperty(k)) 
		{
			v = obj[k];
			
			newNode = dom.createElement(k);
			
			switch (typeof v) 
			{
				case "string":
				case "number":
					newNode.appendChild(dom.createTextNode(v));
					break;
				case "object":
					if (v !== null) 
					{
						jsToXML(dom, newNode, v);
					}
					break;
			}	
			parent.appendChild(newNode);
		}
	}
}

/*
 * Function to return process path.
 * @return - path to be returned.
*/
function getProcessHistory()
{
	var processHistory = '';
	for(var i = 0; i < questionHistory.length; i++)
	{
		processHistory += (i+1) + ': ' + questionHistory[i][0] + ', ';
	}
	
	return processHistory;
}

/*
 * Function to return subWeb currently in through searching the URL.
 * @param - URL of current page should be passed in.
 * @return - subWeb string, undefined if not found.
*/
function getSubWeb(URL)
{
	if (~URL.indexOf("adv")){return 'adv';}
	else if (~URL.indexOf("bag")){return 'bag';}
	else if (~URL.indexOf("chb")){return 'chb';}
	else if (~URL.indexOf("cis")){return 'cis';}
	else if (~URL.indexOf("csc")){return 'csc';}
	else if (~URL.indexOf("ctx")){return 'ctx';}
	else if (~URL.indexOf("digital")){return 'digital';}
	else if (~URL.indexOf("dmb")){return 'dmb';}
	else if (~URL.indexOf("dms")){return 'dms';}
	else if (~URL.indexOf("emp")){return 'emp';}
	else if (~URL.indexOf("esi")){return 'esi';}
	else if (~URL.indexOf("exc")){return 'exc';}
	else if (~URL.indexOf("GuidanceAuthor")){return 'GuidanceAuthor';}
	else if (~URL.indexOf("nes")){return 'nes';}
	else if (~URL.indexOf("nic")){return 'nic';}
	else if (~URL.indexOf("ntc")){return 'ntc';}
	else if (~URL.indexOf("ord")){return 'ord';}
	else if (~URL.indexOf("osh")){return 'osh';}
	else if (~URL.indexOf("pel")){return 'pel';}
	else if (~URL.indexOf("sar")){return 'sar';}
	else if (~URL.indexOf("slc")){return 'slc';}
	else if (~URL.indexOf("spt")){return 'spt';}
	else if (~URL.indexOf("sta")){return 'sta';}
	else if (~URL.indexOf("tax")){return 'tax';}
	else if (~URL.indexOf("tfc")){return 'tfc';}
	else if (~URL.indexOf("tru")){return 'tru';}
	else if (~URL.indexOf("vat")){return 'vat';}
	else {return undefined}
}

/*
 * Function to return content owner of any LOB, requires to be used with function getSubWeb due to Ocelot URL
 * @param - LOB to search owner for.
 * @return - owner of content.
*/
function getContentOwner(lob)
{
	//Key 
	//owners[0] -> Kevin Newton
	//owners[1] -> Tracey Henney
	//owners[2] -> Vicki Cavagin
	//owners[3] -> Lesley Jack
	//owners[4] -> Karen Broadhead
	//owners[5] -> Mark Rutherford
	//owners[6] -> Astra Annan
	
	var owners = ['Kevin Newton', 'Tracey Henney', 'Vicki Cavagin', 'Lesley Jack', 'Karen Broadhead', 'Mark Rutherford', 'Astra Annan'];
		
	switch(lob)
	{
		case 'adv':	return owners[0]; break;
		case 'bag': return owners[0]; break;
		case 'chb': return owners[1]; break;
		case 'cis': return owners[2]; break;
		case 'csc': return owners[3]; break;
		case 'ctx':	return owners[1]; break;
		case 'digital': return owners[0]; break;
		case 'dmb': return owners[0]; break;
		case 'dms': return owners[4]; break;
		case 'emp': return owners[2]; break;
		case 'esi': return owners[0]; break;
		case 'exc': return owners[1]; break;
		case 'GuidanceAuthor': return owners[0]; break;
		case 'nes': return owners[0]; break;
		case 'nic': return owners[5]; break;
		case 'ntc': return owners[1]; break;
		case 'ord': return owners[5]; break;
		case 'osh': return owners[1]; break;
		case 'pel': return owners[2]; break;	
		case 'sar': return owners[3]; break;
		case 'slc': return owners[1]; break;
		case 'spt': return owners[3]; break;
		case 'sta': return owners[1]; break;
		case 'tax': return owners[3]; break;
		case 'tfc': return owners[6]; break;
		case 'tru': return owners[3]; break;
		case 'vat': return owners[1]; break;
		default: return owners[0];
	}
}

/*
 * Function to return the time and date of a date variable, ensures 0 added to values under 10. 
 * @param - date data.
 * @return - updated date in format (HH:MM DD/MM/YY).
*/
function returnTimeDate(date)
{
	date = ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2) + ' ' + ('0' + date.getDate()).slice(-2) + '/' + ('0' + (date.getMonth()+1)).slice(-2) + '/' +  ('0' + date.getFullYear()).slice(-2)
	return date;
}

/* 
 * Enables the platform to send emails with address, body and subject
*/
function SendMail(to,body,sub)
{ 
    var theApp //Reference to Outlook.Application
    var theMailItem //Outlook.mailItem 
    var subject = sub
    var msg = body
    try 
	{ 
		window.clipboardData.setData("text", body);
	    var theApp = new ActiveXObject("Outlook.Application") 
	    var theMailItem = theApp.CreateItem(0) // value 0 = MailItem 
		theMailItem.to = to 
		theMailItem.Subject = (subject); 
		theMailItem.HTMLBody = (msg); 
	  	theMailItem.display()
	  	return true; 
	}
    catch(err)
	{ 
		alert("The following may have caused this error: \n"+ 
		"1. The Outlook express 2007 is not installed on the machine.\n"+ 
		"2. The msoutl.olb is not availabe at the location "+ 
		"C:\\Program Files\\Microsoft Office\\OFFICE11\\msoutl.old on client's machine "+ 
		"due to bad installation of the office 2010."+ 
		"Re-Install office2010 with default settings.\n"+ 
		"3. The Initialize and Scripts ActiveX controls not marked as safe is not set to enable.\n"+
		"4. You are not using Internet Explorer.")
		return false;
	}
}

function showPopup()
{		
	var linkClicked = $(this);	
	
	$('.modal.show').modal('hide'); //hide popups already displayed
	
	if(!linkClicked.hasClass('popup_loaded'))
	{
		var file = getFile(linkClicked.attr('data-which'), 'html');
		file.done(function(data)
		{			
			data = $(data);
			var modalTitle = data.find('.modal-title').text();
			var modalBody = data.find('div#modalBody').html();
			var modalFooter = data.find('div#modalFooter').html();
			$('body').append(createPopup(linkClicked.attr('id') + '_popup', modalTitle.trim(), modalBody.trim(), modalFooter.trim(), linkClicked.attr('data-size')));
			linkClicked.addClass('popup_loaded');
		}),
		file.fail(function()
		{
			alert('Popup failed to load.')
		});	
	}
	$('#' + linkClicked.attr('id') + '_popup').modal('show');
	
	if(linkClicked.attr('id') === 'fre')
		LoadFRETool();
}

function createPopup(id, title, body, footer, size)
{
	var scratch = '<div id="' + id + '" class="modal fade"><div class="modal-dialog modal-' + size + '" role="document"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">' + title + '</h5>';
	scratch += '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button></div><div class="modal-body">' + body + '</div>';	
	scratch += '<div class="modal-footer">' + footer + '</div></div></div>';			
	return $(scratch);
}

function getFile(ref, type, input)
{	
	return $.ajax(
	{ 
		url: ref,
		dataType: type,
		async: false,
		data: input
	});	
}

function LoadFRETool()
{
	$.ajax
	({
		url: "/cagdata/FRE.xml",
		dataType: "xml",
		success: function( xmlResponse ) 
		{
			var data = $( "Entry", xmlResponse ).map(function() 
			{
				return {
					value: $( "Job", this ).text() + " (" + $( "Industry", this ).text() + ")",
					id: "<br>Industry:" + $( "Industry", this ).text() + "<br><br>Allowances:<br><br><table width='40%'><tr><td width='50%'>Year</td><td>Amount</td></tr><tr id='CY'><td>2014/15</td><td>" + $( "CY", this ).text() + "</td></tr><tr id='CYMinus1'><td>2013/14</td><td>" + $( "CY-1", this ).text() + "</td></tr><tr id='CYMinus2'><td>2012/13</td><td>" + $( "CY-2", this ).text() + "</td></tr><tr id='CYMinus3'><td>2011/12</td><td>" + $( "CY-3", this ).text() + "</td></tr><tr id='CYMinus4'><td>2010/11</td><td>" + $( "CY-4", this ).text() + "</td></tr><tr id='CYMinus5'><td>2009/10</td><td>" + $( "CY-5", this ).text() + "</td></tr></table> " + $( "SpecialNotes", this ).text() + "<br><br>"
				};					
			}).get();
				
			$( "#FRETool" ).autocomplete
			({
				source: function(request, response)
				{
					var matcher = request.term.toLowerCase().split(" ");
					response($.grep(data, function(value) 
					{
						var blnResponse = false
							
						for (var i = 0; i < matcher.length; i++) 
						{
		   					if(~value.value.toLowerCase().indexOf(matcher[i]) || ~value.id.toLowerCase().indexOf(matcher[i]))
			   				{		   								
			   					blnResponse = true
							}
							else
							{
			   					blnResponse = false
			   					break;
							}
						}    
						return blnResponse;
					}));				    
				},
				minLength: 3,
				response: function(event, ui) 
				{
		    		if (ui.content.length === 0) 
					{
						$("#FREToolResult").html("<br>Industry:<br><br>Allowance:<br><br>");
						$("#FREToolNotFound").show();
					}
					else if (ui.content.length==1)
					{
						$("#FREToolResult").html= (ui.content[0].id);
						$("#FREToolNotFound").hide();
					}
					else
					{
						$("#FREToolResult").html("<br>Industry:<br><br>Allowance:<br><br>");
						$("#FREToolNotFound").hide();
					}
        		},
				select: function( event, ui ) 
				{
					$("#FREToolResult").html(ui.item.id);
				}
			});
			$("#FRETool").autocomplete('option', 'appendTo','#ajaxmodal')
			$("#FREToolClear").click(function() 
			{  
				$("#FRETool").val('')
			});
		}
	});		
}
