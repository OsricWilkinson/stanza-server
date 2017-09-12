'use strict'

/**
 A bunch of stuff used by both the author and the advisor front ends.
 */

var types = {}, processStack, phrasebook = []
var bullet = '<i class=" fa fa-arrow-circle-right" aria-hidden="true"></i>'
var questionHistory = []
var builtStanzas = {}
var customer = {}

var features = {
  progress: false,
  modular: false
}

// IE polyfil for Object.assign
// From https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
if (typeof Object.assign != 'function') {
  Object.assign = function (target, varArgs) { // .length of function is 2
    'use strict'
    if (target == null) { // TypeError if undefined or null
      throw new TypeError('Cannot convert undefined or null to object')
    }

    var to = Object(target)

    for (var index = 1; index < arguments.length; index++) {
      var nextSource = arguments[index]

      if (nextSource != null) { // Skip over if undefined or null
        for (var nextKey in nextSource) {
          // Avoid bugs when hasOwnProperty is shadowed
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey]
          }
        }
      }
    }
    return to
  }
}

var Tools = (function () {

  var tools = {}
  var loaded = false
  var onLoads = []
  var source

  if (window.location.pathname.indexOf('tools') !== -1) {
    source = '../tools.asp'
  } else if (window.location.pathname.indexOf('system') !== -1) {
    source = 'tools.asp'
  } else {
    source = '../../system/ocelot/tools.asp'
  }

  /** TODO: Implement a tools backend
   $.getJSON(source)
   .done(function (json) {
			if ("success" in json) {
				tools = json.success;
			}
			loaded = true;
			var i;
			for (i = 0; i < onLoads.length; i += 1) {
				onLoads[i]();						
			}
		})
   .fail(function (jqxhr) {
			throw new Error("Can't get tools database from " + source);
		});
   */

  return {
    onLoad: function (callback) {
      if (!loaded) {
        onLoads.push(callback)
      } else {
        callback()
      }
    },
    hasLoaded: function () {
      return loaded
    },

    getTools: function () {
      return tools
    },

    getTool: function (id) {
      return tools[id]
    },

    toolExists: function (id) {
      return id in tools
    }
  }

})()

function formatDate (date) {
  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  return date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear()
}

function escapeHTML (text) {
  if (text === undefined || text.length === 0) {
    return ''
  }
  return text.replace(/[\"&<>]/g, function (c) {
    return {'"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;'}[c]
  })
}

// From http://stackoverflow.com/a/1395954
function decodeHTML (encodedString) {
  var textArea = document.createElement('textarea')
  textArea.innerHTML = encodedString
  return textArea.value
}

function inflateHTML (htmlString) {
  var div = buildElement('div')
  div.innerHTML = htmlString
  return div
}

function inflateHTMLInto (target, htmlString) {
  var div = buildElement('div')
  div.innerHTML = htmlString
  while (div.firstChild) {
    target.appendChild(div.firstChild)
  }
  return target
}

function textNode (text) {
  return document.createTextNode(text)
}

function getCurrentProcess () {
  return processStack
}

function isWebchat () {
  return $('body.webchat').length > 0
}

function buildFA (name) {
  var i = buildElement('i', 'fa fa-fw fa-' + name)
  i.setAttribute('aria-hidden', 'true')
  return i
}

function getAnswerFromquestionHistory (qId) {
  var i
  for (i = 0; i < questionHistory.length; i += 1) {
    if (questionHistory[i][0] === qId) {
      return questionHistory[i][1]
    }
  }
  return undefined
}

function getPhrase (phraseId) {
  var webchat
  if (phraseId === undefined || phraseId === '') {
    return ''
  } else if (phraseId === '-1') {
    return 'Missing text'
  } else {
    return phrasebook[phraseId]
//		return getCurrentProcess().phrases[phraseId];
  }
}

/**
 Lookup a string in the phrasebook, and return its ID.
 Will add the string to the phrasebook if it can't find it.
 */
function getPhraseId (phrase) {
  var i

  var phraseList = getCurrentProcess().phrases

  for (var i = 0; i < phraseList.length; i += 1) {
    if (typeof phraseList[i] === 'string' && phraseList[i] === phrase) {
      return i
    } else if (phraseList[i][0] === phrase) {
      return i
    }
  }
  getCurrentProcess().phrases.push(phrase)
  return getCurrentProcess().phrases.length - 1
}

function changePhrase (id, phrase) {
  getCurrentProcess().phrases[id] = phrase
}

function replaceStanza (id, stanza) {
  getCurrentProcess().flow[id] = stanza
}

function buildTabId (stanza, name) {
  return stanza.getIdString() + '-tab-' + name.toLowerCase().replace(/[^a-z]/g, '')
}

/**
 Return the next unused stanza id.
 'Unused' in this context means doesn't appear in a 'id' property, or in a 'next' list.
 */

function getNextId () {
  var id = 1, idString, used

  while (true) {
    idString = id.toString()
    if (!stanzaExists(idString)) {
      used = false
      forAllStanzas(function (stanza) {
        var i
        if (!('next' in stanza.data)) {
          return
        }

        var children = stanza.getChildren()

        for (i = 0; i < children.length; i += 1) {
          if (children[i] === idString) {
            used = true
            return
          }
        }
      })

      if (!used) {
        return idString
      }
    }
    id += 1
  }
}

function validateLink () {
  var parent = $(this).closest('.list-group-item')
  var row = parent[0]
  var dest = parent.find('.ipt-link-dest').val()

  if (dest === undefined || dest === '') {
    handleInvalidLink.bind(row)()
  } else if (dest.match(/^[a-z]{3}[0-9]{5}$/)) {
    if (dest.substr(3, 1) === '1') {
      validateHowtoLink.bind(row)(dest)
    } else {
      handleValidLink.bind(row)()
    }
  } else if (dest.match(/^\//)) {
    $.get(dest)
      .done(handleValidLink.bind(row))
      .fail(handleInvalidLink.bind(row))
  } else if (dest.match(/^(https?|ftp|mailto|file):\/\/.+/)) {
    // Assume external links are valid, because we cant test them
    handleValidLink.bind(row)()
  } else {
    handleInvalidLink.bind(row)()
  }
}

var validateHowtoLinkQueue = {}
var validateHowtoLinkTimeout

function validateHowtoLink (target) {
  // Gah. This was being called 10s of times on process load
  // So now we batch up calls.

  if (target in validateHowtoLinkQueue) {
    validateHowtoLinkQueue[target].push(this)
  } else {
    validateHowtoLinkQueue[target] = [this]
  }

  clearTimeout(validateHowtoLinkTimeout)
  validateHowtoLinkTimeout = setTimeout(function () {

    var targetList = Object.keys(validateHowtoLinkQueue).join('|')

    $.getJSON('../../system/ocelot/howto_backend.asp', {h: targetList})
      .done(function (json) {
        var howto, current, i, j, thizz, id

        if ('success' in json) {
          // Check for howtos that exist

          for (i = 0; i < json.success.length; i += 1) {
            howto = json.success[i]
            id = howto.meta.id

            if (howto.meta.id in validateHowtoLinkQueue) {
              for (j = 0; j < validateHowtoLinkQueue[id].length; j += 1) {
                thizz = validateHowtoLinkQueue[id][j]

                current = $(thizz).find('.ipt-link-dest').val()
                if (current !== id) {
                  console.log('Too late for ' + id)
                  continue
                }

                thizz.dataset.validationState = 'success'
                handleValidLink.bind(thizz)()
              }

              delete validateHowtoLinkQueue[id]
            }
          }

          // Anything left over doesn't exist
          for (id in validateHowtoLinkQueue) {
            for (j = 0; j < validateHowtoLinkQueue[id].length; j += 1) {
              thizz = validateHowtoLinkQueue[id][j]

              current = $(thizz).find('.ipt-link-dest').val()
              if (current !== id) {
                console.log('too late for ' + id)
                continue
              }

              thizz.dataset.validationState = 'warning'
              handleValidLink.bind(thizz)()
            }
          }
        }

        validateHowtoLinkQueue = {}
      }.bind(this))

  }, 250)
}

function updateValidationState (target, state) {
  target.find('.grp-link')
    .removeClass('has-success')
    .removeClass('has-warning')
    .removeClass('has-danger')
    .addClass('has-' + state)
  target.find('.ipt-link-dest')
    .removeClass('form-control-success')
    .removeClass('form-control-warning')
    .removeClass('form-control-danger')
    .addClass('form-control-' + state)
}

function handleInvalidLink () {
  var parent = $(this)

  var id = this.dataset.id, thizz = getStanza(id)

  // Update UI
  updateValidationState(parent, 'danger')
  parent.find('.lbl-icon i')
    .removeClass()
    .addClass('fa fa-fw')

  // update data
  delete thizz.data.link
}

function getLinkDest (dest) {
  var process = getCurrentProcess()
  var i
  for (i = 0; i < process.meta.links.length; i += 1) {
    if (process.meta.links[i].dest === dest) {
      process.meta.links[i].id = i
      return process.meta.links[i]
    }
  }
  return undefined
}

function getLinkId (id) {
  var process = getCurrentProcess()
  return process.meta.links[id]
}

function addLink (link) {
  var process = getCurrentProcess()
  process.meta.links.push(link)
  return process.meta.links.length - 1
}

function updateLinks (thizz, type, link) {
  return function (stanza) {
    var i
    if (type === 'moreinfo' || stanza.data.id !== thizz.data.id) {
      if ('link' in stanza.data && stanza.data.link === link.id) {
        $('#' + stanza.getIdString()).find('.tab-howto .ipt-link-title').val(link.title)
        $('#' + stanza.getIdString()).find('.tab-howto .chk-link-window').prop('checked', link.window)
        $('#' + stanza.getIdString()).find('.tab-howto .chk-link-leftbar').prop('checked', link.leftbar)
      }
    }
    if (type === 'link' || stanza.data.id !== thizz.data.id) {
      if ('moreinfo' in stanza.data) {
        for (i = 0; i < stanza.data.moreinfo.length; i += 1) {
          if (stanza.data.moreinfo[i] === link.id) {
            $('#' + stanza.getIdString()).find('.tab-moreinfo .ipt-link-title').eq(i).val(link.title)
            $('#' + stanza.getIdString()).find('.tab-moreinfo .chk-link-window').eq(i).prop('checked', link.window)
            $('#' + stanza.getIdString()).find('.tab-moreinfo .chk-link-leftbar').eq(i).prop('checked', link.leftbar)
          }
        }
      }
    }
  }
}

function handleValidLink () {
  var i, link, found = false, parent = $(this), process = getCurrentProcess()
  var id = this.dataset.id, thizz = getStanza(id)
  var type = this.dataset.type, globalLink

  // Update UI
  updateValidationState(parent, this.dataset.validationState !== undefined ? this.dataset.validationState : 'success')
  parent.find('.lbl-icon i')
    .removeClass('fa-fw')
    .addClass('fa-' + getIconType(parent.find('.ipt-link-dest').val()))

  // Update data

  link = {
    dest: parent.find('.ipt-link-dest').val(),
    title: parent.find('.ipt-link-title').val(),
    window: parent.find('.chk-link-window')[0].checked,
    leftbar: parent.find('.chk-link-leftbar')[0].checked
  }

  globalLink = getLinkDest(link.dest)

  if (globalLink !== undefined) {
    link.id = globalLink.id
    if (type === 'link') {
      if ('link' in thizz.data) {
        process.meta.links[globalLink.id] = link
        forAllStanzas(updateLinks(thizz, type, link))
      } else {
        thizz.data.link = link.id
        parent.find('.ipt-link-title').val(globalLink.title)
        parent.find('.chk-link-window')[0].checked = globalLink.window
        parent.find('.chk-link-leftbar')[0].checked = globalLink.leftbar
      }
    } else {
      if (!('moreinfo' in thizz.data)) {
        thizz.data.moreinfo = []
      }

      if (globalLink.id in arrayToHash(thizz.data.moreinfo)) {
        process.meta.links[globalLink.id] = link
        forAllStanzas(updateLinks(thizz, type, link))
      } else {
        thizz.data.moreinfo.push(globalLink.id)
        parent.find('.ipt-link-title').val(globalLink.title)
        parent.find('.chk-link-window')[0].checked = globalLink.window
        parent.find('.chk-link-leftbar')[0].checked = globalLink.leftbar
      }

      if (thizz.data.moreinfo.length === 0) {
        delete thizz.data.moreinfo
      }
    }

  } else {
    if (type === 'link') {
      thizz.data.link = addLink(link)
    } else {
      if (!('moreinfo' in thizz.data)) {
        thizz.data.moreinfo = []
      }
      thizz.data.moreinfo.push(addLink(link))
    }
  }
}

function buildLinkRow (thizz, type, link) {

  var input, inputGroup, row, type, col, timeout

  row = buildElement('div', 'list-group-item d-flex form-inline border-0')
  row.dataset.id = thizz.data.id
  row.dataset.type = type

  col = buildElement('div', 'd-flex flex-column justify-content-between mr-3')
  col.style.flex = '2 1 auto'
  // TITLE

  input = buildElement('input', 'form-control ipt-link-title')
  input.type = 'text'
  input.required = false
  input.placeholder = 'This is displayed to the user'
  if (link !== undefined && 'title' in link) {
    input.value = link.title
  }

  col.appendChild(buildElement('div', 'input-group mb-3',
    buildElement('div', 'input-group-addon', 'Title'),
    input
  ))

  //LINK

  inputGroup = buildElement('div', 'grp-link input-group has-danger')
  inputGroup.appendChild(buildElement('div', 'input-group-addon', 'Link'))

  input = buildElement('input', 'form-control ipt-link-dest form-control-danger')
  input.setAttribute('spellecheck', 'false')
  if (link !== undefined && 'dest' in link) {
    input.value = link.dest
  }

  input.required = true
  input.placeholder = 'Where the link goes'
  inputGroup.appendChild(input)

  col.appendChild(inputGroup)

  row.appendChild(col)

  col = buildElement('div', 'd-flex flex-column mr-3 justify-content-between align-items-start')
  // LEFTBAR

  input = buildElement('input', 'form-check-input chk-link-leftbar')
  input.type = 'checkbox'
  input.checked = (link !== undefined ? link.leftbar : true)
  inputGroup = buildElement('div', 'form-check  mb-3',
    buildElement('label', 'form-check-label',
      input,
      ' Include on leftbar'
    )
  )

  col.appendChild(inputGroup)

  // WINDOW

  input = buildElement('input', 'form-check-input chk-link-window')
  input.type = 'checkbox'
  input.checked = true
  inputGroup = buildElement('div', 'form-check',
    buildElement('label', 'form-check-label',
      input,
      ' Open in new window'
    )
  )

  col.appendChild(inputGroup)

  row.appendChild(col)

  validateLink.bind(row)()

  return row
}

/**
 This defines the parent Stanza type. Should never be instanced directly.

 It's got sensible defaults for most methods.

 */

types.Stanza = function Stanza (id, stanza) {
  stanza.id = id
  this.data = stanza
}

types.Stanza.prototype = {

  /**
   Return the type of this Stanza, as a string.
   Must be overridden by sub-types
   */
  getType: function () {
    throw new Error('getType not overriden')
  },

  /**
   Return true if this stanza has answers, false otherwise.
   Not quite the same thing as 'isQuestion'
   */
  hasAnswers: function () {
    return this.data.answers !== undefined
  },

  /**
   Are we looking at a leaf node? True only for 'End' types.
   */
  isTerminal: function () {
    return false
  },

  /**
   Is this stanza a question?
   */
  isQuestion: function () {
    return false
  },

  /* Should this stanza stack?
   */
  isStacked: function () {
    if ('stack' in this.data) {
      return this.data.stack
    } else {
      return false
    }
  },

  /**
   Does this stanza have complex routing?
   */
  hasRouting: function () {
    return ('from' in this.data)
  },

  /**
   Does this stanza have any display?
   */
  hasDisplay: function () {
    return true
  },

  /**
   Does this stanza draw itself?
   */
  isSelfRender: function () {
    return false
  },
  /**
   Does this stanza have a webchat version?
   */
  hasWebchat: function () {
    // Webchat data is stored as an array in phrasebook
    // If the phrase is not a string, then we've got webchat
    return typeof getPhrase(this.data.text) !== 'string'
  },

  /**
   Returns a string sutable to be used as a HTML id.
   */
  getIdString: function () {
    return this.data.id
  },

  /**
   Returns the text of this stanza, as a string
   */
  getText: function () {
    var phrase
    if (typeof this.data.text === 'number') {
      phrase = getPhrase(this.data.text)
      if (typeof phrase === 'string') {
        return phrase
      } else {
        return phrase[0]
      }
    } else {
      return this.data.text
    }
  },

  /**
   Return the webchat version of this stanza, as a string.
   If there isn't a webchat version, return the regular version
   */
  getWebchat: function () {
    var phrase
    if (typeof this.data.text === 'number') {
      phrase = getPhrase(this.data.text)
      if (typeof phrase === 'string') {
        return phrase
      } else {
        return phrase[1]
      }
    } else {
      return this.data.text
    }
  },

  /**
   Returns the id of the next stanza after this one.
   I think this method tries to do too many things.
   */
  getNext: function (index) {
    var i, j, match, answers = []
    if (this.hasRouting()) {
      for (i = 0; i < this.data.from.length; i += 1) {
        if (this.data.from[i] === this.data.id) {
          answers.push(index)
        } else {
          answers.push(getAnswerFromquestionHistory(this.data.from[i]))
        }
      }

      for (i = 0; i < this.data.next.length; i += 1) {
        match = true
        for (j = 0; j < this.data.from.length; j += 1) {
          if (this.data.next[i][j] !== -1 && this.data.next[i][j] !== answers[j]) {
            match = false
          }
        }
        if (match) {
          return this.data.next[i][this.data.from.length]
        }
      }

      return ''
    } else if ('next' in this.data) {
      return this.data.next[index]
    } else {
      return ''
    }
  },

  /**
   Returns a list of ids of stanzas that follow this one.
   May return an empty list.
   */
  getChildren: function () {
    var next, i

    if (this.isTerminal()) {
      return []
    }

    if (this.hasRouting()) {
      next = {}
      for (i = 0; i < this.data.next.length; i += 1) {
        next[this.data.next[i][this.data.from.length]] = i
      }

    } else {
      next = {}
      for (i = 0; i < this.data.next.length; i += 1) {
        next[this.data.next[i]] = i
      }
    }

    return Object.keys(next).sort(function (a, b) {
      return next[a] - next[b]
    }.bind(this))

  },

  /**
   Returns a list of ids of stanzas that lead directly to this one.
   */
  getParents: function () {
    var parents = {}, ids, id, stanza, i, j

    if ('parents' in this.data) {
      return Object.keys(this.data.parents)
    }

    ids = getStanzaIdList()

    if (this.hasRouting()) {
      for (i = 0; i < this.data.from.length; i += 1) {
        parents[this.data.from[i]] = 1
      }
    }

    for (i = 0; i < ids.length; i += 1) {
      id = ids[i]
      stanza = getStanza(id)

      if (!stanza.data.next) {
        continue
      }
      var children = stanza.getChildren()

      for (j = 0; j < children.length; j += 1) {
        if (children[j] === this.data.id) {
          parents[id] = 1
        }
      }
    }

    return Object.keys(parents).sort(idSort)
  },

  /** Returns a list of all ancesors of this stanza up to the root
   */
  getAncestors: function () {
    var queue = [this.data.id]
    var next, i, parents, result = {}
    while (queue.length > 0) {
      next = queue.shift()

      if (stanzaExists(next)) {
        next = getStanza(next)

        parents = next.getParents()

        for (i = 0; i < parents.length; i += 1) {
          if (!(parents[i] in result)) {
            result[parents[i]] = 1
            queue.push(parents[i])
          }
        }
      }
    }
    return Object.keys(result).sort(idSort)
  },

  getDefaultTabs: function () {
    var tabs = [this.buildHowtoTab(), this.buildMoreInfoTab()]
    return tabs
  },

  getTabs: function () {
    return []
  },

  buildText: function () {
    var text = buildElement('textarea', 'form-control ipt-text', this.getText())
    text.setAttribute('spellcheck', 'true')
    text.dataset.which = this.data.id

    return buildElement('div', 'input-group mr-3', text)
  },

  buildHowtoTab: function () {
    var result = buildElement('div', 'tab-howto link-group'), input, timeout, process, current, thizz = this

    result.dataset.id = this.data.id

    process = getCurrentProcess()

    if ('link' in this.data) {
      current = process.meta.links[this.data.link]
    }

    result.appendChild(buildLinkRow(this, 'link', current))

    result.appendChild(buildElement('div', 'info',
      buildElement('p', undefined, 'Add links to cases, howtos, or other processes (call guides and action guides) by reference (e.g. \'tax00001\')'),
      buildElement('p', undefined, 'Add links to other parts of the guidance platform (e.g. navmenus) with relative links (e.g.\'/chb/\') '),
      buildElement('p', undefined, 'All other links need a full URL (e.g. for Bing \'https://bing.com/\') (Note: These are not checked for validity) ')
    ))

    return ['Link', result]
  },

  buildLabelTab: function () {
    var result = buildElement('div', 'tab-label link-group'), input

    result.appendChild(buildElement('p', 'info', 'Tag this stanza with a label so its answer can be used in a later stanza'))

    input = buildElement('input', 'form-control ipt-stanza-label')

    var thizz

    $(input).on('change', function () {
      if (this.value !== '') {
        thizz.data.label = this.value
      } else {
        delete thizz.data.label
      }
    })

    if ('label' in this.data) {
      input.value = this.data.label
    }

    result.appendChild(buildElement('div', 'input-group',
      buildElement('span', 'input-group-addon', 'Label'),
      input
    ))

    return ['Label', result]
  },

  buildMoreInfoTab: function () {
    var outer = buildElement('div', 'tab-moreinfo'), listBlock, timeout, i, thizz = this

    function buildRow (link) {

      var row = buildLinkRow(thizz, 'moreinfo', link)

      // BUTTONS

      row.appendChild(buildElement('div', 'btn-group',
        buildElement('button', 'btn btn-primary cmd-moreinfo-up', buildFA('arrow-up')),
        buildElement('button', 'btn btn-primary cmd-moreinfo-down', buildFA('arrow-down')),
        buildElement('button', 'btn btn-primary cmd-moreinfo-delete', buildFA('trash'))
      ))

      return row
    }

    outer.appendChild(buildElement('div', 'mb-3',
      buildElement('button', 'btn btn-primary cmd-moreinfo-add', buildFA('plus'))
    ))

    listBlock = buildElement('div', 'list-group')

    if ('moreinfo' in this.data) {
      for (i = 0; i < this.data.moreinfo.length; i += 1) {
        listBlock.appendChild(buildRow(getLinkId(this.data.moreinfo[i])))
      }
    }

    outer.appendChild(listBlock)

    $(outer).on('click', '.cmd-moreinfo-add', function () {
      listBlock.appendChild(buildRow())
    })
      .on('click', '.cmd-moreinfo-delete', function () {
        var index = $(this).closest('.list-group-item').index()

        $(listBlock).find('.list-group-item').eq(index).remove()

        refreshMoreInfo()

      })
      .on('click', '.cmd-moreinfo-up', function () {
        var me = $(this).closest('.list-group-item')
        var prev = me.prev()

        if (prev.length === 0) {
          return
        }

        var index = me.index()

        var distance = prev.offset().top - me.offset().top

        $.when(
          me.animate({top: '+=' + distance}, 400),
          prev.animate({top: '-=' + distance}, 400)
        ).done(function () {
          me.css('top', '0')
          prev.css('top', '0')
          me.after(prev)
          refreshMoreInfo()
        })
      })
      .on('click', '.cmd-moreinfo-down', function () {
        var me = $(this).closest('.list-group-item')
        var next = me.next()

        if (next.length === 0) {
          return
        }

        var index = me.index()

        var distance = me.offset().top - next.offset().top

        $.when(
          me.animate({top: '-=' + distance}, 400),
          next.animate({top: '+=' + distance}, 400)
        ).done(function () {
          me.css('top', '0')
          next.css('top', '0')
          me.before(next)
          refreshMoreInfo()
        })
      })
    return ['More Info', outer]

  },

  buildRoutingTab: function () {

    var table = '<div>', i, j, k, froms

    table += '<table class=\'table table-hover table-sm data-routing\'><thead><tr>'
    froms = []
    for (i = 0; i < this.data.from.length; i += 1) {
      if (stanzaExists(this.data.from[i])) {

        froms.push(getStanza(this.data.from[i]))
        k = getStanza(this.data.from[i])
        table += '<th class=\'h-100 align-top\' data-from=\'' + this.data.from[i] + '\'><div class=\'d-flex flex-column justify-content-between align-items-center\'>'
        table += '<div class=\'btn-group\'>'
        if (i === 0) {
          table += '<button type=\'button\' class=\'btn btn-secondary\' disabled><i class=\'fa fa-arrow-left\' aria-hidden=\'true\'></i></button>'
        } else {
          table += '<button type=\'button\' class=\'btn btn-primary cmd-left-question\' data-which=\''
          table += this.data.id
          table += '\' data-index=\'' + i + '\''
          table += '><i class=\'fa fa-arrow-left\' aria-hidden=\'true\'></i></button>'
        }

        table += '<button type=\'button\' class=\'btn btn-primary cmd-delete-question\' data-which=\''
        table += this.data.id
        table += '\' data-index=\'' + i + '\''
        table += '><i class=\'fa fa-trash\' aria-hidden=\'true\'></i></button>'

        if (i === this.data.from.length - 1) {
          table += '<button type=\'button\' class=\'btn btn-secondary\' disabled><i class=\'fa fa-arrow-right\' aria-hidden=\'true\'></i></button>'
        } else {
          table += '<button type=\'button\' class=\'btn btn-primary cmd-right\' data-which=\''
          table += this.data.id
          table += '\' data-index=\'' + i + '\''
          table += '><i class=\'fa fa-arrow-right\' aria-hidden=\'true\'></i></button>'
        }

        table += '</div>'
        table += '<div><a href=\'#q' + this.data.from[i] + '\'>' + k.getText() + '</a></div>'
        table += '</th>'
      } else {
        froms.push(undefined)
        table += '<th data-from=\'' + this.data.from[i] + '\'>'
        table += '<span class=\'text-warn\'>Missing question</span><br>'
        table += '<span class=\'btn-group\'>'
        if (i === 0) {
          table += '<button type=\'button\' class=\'btn btn-secondary\' disabled><i class=\'fa fa-arrow-left\' aria-hidden=\'true\'></i></button>'
        } else {
          table += '<button type=\'button\' class=\'btn btn-primary cmd-left\'><i class=\'fa fa-arrow-left\' aria-hidden=\'true\'></i></button>'
        }

        table += '<button type=\'button\' class=\'btn btn-primary cmd-left\'><i class=\'fa fa-trash\' aria-hidden=\'true\'></i></button>'

        if (i === this.data.from.length - 1) {
          table += '<button type=\'button\' class=\'btn btn-secondary\' disabled><i class=\'fa fa-arrow-right\' aria-hidden=\'true\'></i></button>'
        } else {
          table += '<button type=\'button\' class=\'btn btn-primary cmd-right\'><i class=\'fa fa-arrow-right\' aria-hidden=\'true\'></i></button>'
        }
        table += '</span>'
        table += '</th>'

      }
    }

    table += '<th class=\'align-top text-center\'><button class=\'btn btn-primary cmd-add-question\' data-which=\'' + this.data.id + '\'><i class=\'fa fa-plus\' aria-hidden=\'true\'></i></button></th></thead><tbody>'

    // Build combination of possible answers
    var rows = []

    function buildCombinations (stanza, col, indexes) {
      var i, j, row, match

      if (col < froms.length) {
        if (froms[col] !== undefined) {
          for (i = 0; i < froms[col].data.answers.length; i += 1) {
            buildCombinations(stanza, col + 1, indexes.concat(i))
          }
        } else {
          buildCombinations(stanza, col + 1, indexes.concat(0))
        }
      } else {
        row = []
        for (i = 0; i < indexes.length; i += 1) {
          row.push(indexes[i])
        }

        // Check to see if there is already an answer known.
        // If there is, use that. Otherwise, don't bother.
        row.push('')

        for (i = 0; i < stanza.data.next.length; i += 1) {
          match = true
          for (j = 0; j < (row.length - 1); j += 1) {
            if (stanza.data.next[i][j] !== row[j]) {
              match = false
              break
            }
          }
          if (match) {
            row[row.length - 1] = stanza.data.next[i][stanza.data.from.length]
          }
        }

        rows.push(row)
      }
    }

    buildCombinations(this, 0, [])

    // Now we've got the combinations, write them out in a table

    for (i = 0; i < rows.length; i += 1) {
      table += '<tr>'

      for (j = 0; j < (rows[i].length - 1); j += 1) {
        if (froms[j] !== undefined) {
          table += '<td data-answer=\'' + rows[i][j] + '\'>' + escapeHTML(froms[j].getAnswerText(rows[i][j])) + '</td>'
        } else {
          table += '<td></td>'
        }
      }

      table += '<td data-next=\'' + rows[i][froms.length] + '\'>'
      table += '<div class=\'form-inline\'>'
      table += drawNextInput(this, i, rows[i][froms.length])
      table += '<span class=\'btn-group\'>'
      table += drawNextButton(rows[i][froms.length])
      table += '</span>'
      table += '</div>'
      table += '</td>'
      table += '</tr>'
    }

    table += '<tbody></table>'

    table += '</div>'

    return ['Routing', $(table)[0]]
  }

}

/**
 returns a DOM element of type 'type', with classes 'classes' and content 'content'.

 If classes or content are undefined, they are ignored.

 classes should be a space seperated list of CSS classes to add to the element

 If content is a String, it is converted to a text node before being appended to the element.
 If content is a function, the return value of the funciton is assumeed to be a DOM node, and that is appended to the element.
 Otherwise, content is assumend to be a DOM node, and that is appended to the element

 */
function buildElement (type, classes) {
  var result = document.createElement(type)
  var i, classList
  if (classes) {
    classList = classes.split(/\s+/)
    for (i = 0; i < classList.length; i += 1) {
      result.classList.add(classList[i])
    }
  }


  var index = 2

  while (index < arguments.length) {
    switch (typeof arguments[index]) {
      case 'undefined':
        // do nothing
        break
      case 'string':
      case 'number':
        result.appendChild(document.createTextNode(arguments[index]))
        break
      case 'function':
        result.appendChild(arguments[index]())
        break
      default:
        result.appendChild(arguments[index])
        break
    }
    index += 1
  }

  return result
}

function buildLegacyLink (product) {
  var types = ['callguides', 'howtos', 'referrals', 'cases', 'actionguides', 'helpcards', 'tools', 'webguides']
  var depths = [1, 1, 0, 1, 1, 0, 1, 1]
  var suffix = ['_01.htm', '_01.htm', '.htm', '.htm', '_main.htm', '.pdf', '_01.htm', '_01.htm']

  var lob, id, result, type, depth

  var parts = product.match(/^([a-z]{3})([0-9])([0-9]{4})$/)
  if (parts) {
    lob = parts[1]
    type = parseInt(parts[2], 10)
    id = parseInt(parts[3], 10)

    if (type === 9) {
      // Ocelot

      result = '?p=' + product + '#Yolo'

    } else {

      result = '/' + lob + '/' + types[type] + '/'

      if (depths[type] === 1) {
        depth = Math.floor(id / 100)
        if (id % 100 !== 0) {
          depth += 1
        }
        depth *= 100
        result += type + pad(depth, 4) + '/'
      }

      result += lob + type + pad(id, 4) + suffix[type]
    }
  } else {
    result = 'Invalid input'
  }
  return result
}

/**
 Remove the content of the HTML element with id 'id'
 */
function clear (id) {
  $('#' + id).empty()
}

/**
 Returns the stanza object identified by 'id'.
 May use caching.
 */
function getStanza (id) {

  //if (id.indexOf("-") === -1) {
//		id = getCurrentProcess().meta.id + "-" + id;
//	}

  var stanza = getCurrentProcess().flow[id]
  if (stanza === undefined) {
    throw new Error('Can\'t find stanza with id : ' + id)
  } else {
    return buildStanza(id, stanza)
  }
}

/**
 Turns a raw object into a Stanza type
 */
function buildStanza (id, stanzaData) {
  if (stanzaData.type in types) {
    return new types[stanzaData.type](id, stanzaData)
  } else {
    throw new Error('Unknown stanza type: [' + stanzaData.type + ']')
  }
}

/**
 Add a new stanza to the list of known stanzas.
 Does not update the backing store.
 */

function addStanza (id, stanzaData) {
  if (!(id in getCurrentProcess().flow)) {
    getCurrentProcess().flow[id] = stanzaData
  }
  return buildStanza(id, stanzaData)
}

/**
 Remove a stanza from the list of known stanzas
 */
function deleteStanza (id) {
  delete getCurrentProcess().flow[id]
}

/**
 Returns true if the stanza exists, false otherwise
 */
function stanzaExists (id) {
  if (id === undefined || id === '') {
    return false
  }

  return (id in getCurrentProcess().flow)
}

/**
 Loops through all stanzas and calls 'callback' with each stanza as an argument
 */
function forAllStanzas (callback) {
  var i, ids = getStanzaIdList()
  for (i = 0; i < ids.length; i += 1) {
    if (stanzaExists(ids[i])) {
      callback(getStanza(ids[i]))
    }
  }
}

/**
 Sort function (for Array.sort()) that sorts 'start' before everything else, 'end' last
 and everything else in numeric order
 */

function idSort (a, b) {
  if (a === 'start') {
    return -1
  } else if (b === 'start') {
    return 1
  } else if (a === 'end') {
    return 1
  } else if (b === 'end') {
    return -1
  } else {
    return a - b
  }
}

/**
 Returns a list of known ids
 */
function getStanzaIdList () {
  var process = getCurrentProcess()

  if (process === undefined) {
    return []
  }

  var result = Object.keys(getCurrentProcess().flow)

  result.sort(idSort)

  return result
}

/**
 Return a list of known stanza types.
 */
function getStanzaTypes () {

  // The keys of the types Object are all of the form 'SoemthingStanza'
  // We want to return a list of 'Something'(s), without the 'Stanza'

  // A list of types to ignore
  var ignore = arrayToHash(['Stanza', 'EndStanza'])

  var result = Object.keys(types).filter(function (x) { if (!(x in ignore)) return x }).map(function (x) { return x.substring(0, x.length - 'Stanza'.length) })

  result.sort()

  return result
}

/**
 Return a string with its first character in upper case.
 */
function UCFirst (text) {
  return text.substring(0, 1).toUpperCase() + text.substring(1)
}

/**
 Returns a string with the first letter in upper case and the
 first word surrounded by '<strong>' tags
 */
function boldAndUpper (text) {
  text = UCFirst(text)
  text = text.split(' ')
  return '<strong>' + text.shift() + '</strong> ' + text.join(' ')
}

/**
 Turns a string into a 'strong' DOM element
 */
function boldAndUpperDOM (word) {
  return buildElement('strong', undefined, UCFirst(word))
}

/**
 Turns an array into a hash (where each element of the array
 is a hash key with the value true;
 */
function arrayToHash (array) {
  var i, hash

  if (array === undefined || array === null || array.length === 0) {
    return {}
  }

  hash = {}

  for (i = 0; i < array.length; i += 1) {
    hash[array[i]] = true
  }

  return hash
}

/** Get an icon type (that can be passed to buildFA) from a link
 (Link in this case includes 'tax10024' type references)
 */

function getIconType (link) {
  var type
  if (link.match(/^[a-z]{3}[0-9]{5}$/)) {
    type = link.substr(3, 1)
    switch (type) {
      case '0':
        return 'comments-o'
      case '1':
        return 'question-circle'
      case '2':
        return 'paper-plane-o'
      case '3':
        return 'puzzle-piece'
      case '4':
        return 'book'
      case '5':
        return 'file'
      case '6':
        return 'wrench'
      default:
        return 'link'
    }
  } else if (link.match(/^\//)) {
    return 'link'
  } else {
    return 'globe'
  }
}

function buildSpinner () {
  return buildElement('div', 'd-flex flex-row align-items-center',
    buildElement('i', 'fa fa-refresh fa-spin fa-3x fa-fw'),
    'Loading...'
  )
}

function buildModalFramework (options) {

  var i, btnClose, footer

  footer = buildElement('div', 'modal-footer')

  btnClose = buildElement('button', 'btn btn-secondary', 'Close')
  btnClose.dataset.dismiss = 'modal'

  footer.appendChild(btnClose)

  if ('buttons' in options) {
    if (Array.isArray(options.buttons)) {
      for (i = 0; i < options.buttons.length; i += 1) {
        footer.appendChild(options.buttons[i])
      }
    } else {
      footer.appendChild(options.buttons)
    }
  }

  // Build close button
  var btnClose = buildElement('span', undefined, '\u00D7')
  btnClose.setAttribute('aria-hidden', 'true')

  btnClose = buildElement('button', 'close', btnClose)
  btnClose.dataset.dismiss = 'modal'
  btnClose.setAttribute('aria-label', 'Close')

  var modal = buildElement('div', 'modal fade',
    buildElement('div', 'modal-dialog modal-' + ('size' in options ? options.size : 'md'),
      buildElement('div', 'modal-content',
        buildElement('div', 'modal-header',
          buildElement('h5', 'modal-title', options.title),
          btnClose
        ),
        buildElement('div', 'modal-body', options.body),
        footer
      )
    )
  )

  modal.setAttribute('role', 'dialog')

  return modal
}

function confirm (data) {
  var scratch = ''
  var modal = $('#confirmModal')
  if (modal.length !== 0) {
    modal.remove()
  }

  scratch += '<div id="confirmModal" class="modal"><div class="modal-dialog modal-md" role="document"><div class="modal-content">'
  scratch += '<div class="modal-header"><h5 class="modal-title">'
  if ('title' in data) {
    scratch += data.title
  } else {
    scratch += 'Confirm'
  }

  scratch += '</h5>'
  scratch += '<button type="button" class="close" data-dismiss="modal" aria-label="Close">'
  scratch += '<span aria-hidden="true">&times;</span></button></div><div class="modal-body">'

  if ('body' in data) {
    scratch += data.body
  } else {
    scratch += 'Are you sure?'
  }

  scratch += '</div><div class="modal-footer">'
  scratch += '<button type="button" class="btn btn-primary" data-answer="yes">' + ('yes' in data ? data.yes : 'Yes') + '</button>'
  scratch += '<button type="button" class="btn btn-primary" data-answer="no">' + ('no' in data ? data.no : 'no') + '</button>'
  scratch += '</div></div></div></div>'
  modal = $(scratch)

  modal.on('click', '.btn', function () {
    var answer = this.dataset.answer

    if (answer === 'yes') {
      if ('pass' in data) {
        data.pass(modal)
      }
    } else {
      if ('fail' in data) {
        data.fail(modal)
      }
    }

    modal.modal('hide')
  })

  modal.modal('show')
}

function message (body, title) {
  var scratch = ''
  var modal = $('#messageModal')
  if (modal.length !== 0) {
    modal.remove()
  }

  modal = buildModalFramework({title: title === undefined ? 'Message' : title, body: body})

  modal.id = 'messageModal'

  $(modal).modal('show')
}

function convertTags (strHTML) {

  // check for tag closures - only on cc

  var found = false

  if (~window.location.href.indexOf('.cc')) {

    if (~strHTML.indexOf('&lt;note&gt;')) {

      if (!~strHTML.indexOf('&lt;/note&gt;')) {

        found = true

      }

    }

    if (~strHTML.indexOf('&lt;important&gt;')) {

      if (!~strHTML.indexOf('&lt;/important&gt;')) {

        found = true

      }

    }

    if (~strHTML.indexOf('&lt;more&gt;')) {

      if (!~strHTML.indexOf('&lt;/more&gt;')) {

        found = true

      }

    }

    if (found === true) {

      strHTML += '&nbsp;<p class="bg-danger text-white"><strong>Warning!</strong> Unclosed tags detected</p>'

    }

  }

  // standard note

  strHTML = strHTML.replace('&lt;note&gt;', '<div class="bs-callout bs-callout-note"><div class="noMinMax"><h4>Note:</h4>')
  strHTML = strHTML.replace('&lt;/note&gt;', '</div></div>')

  // important note

  strHTML = strHTML.replace('&lt;important&gt;', '<div class="bs-callout bs-callout-danger"><div class="noMinMax"><h4 class="text-danger">Important:</h4>')
  strHTML = strHTML.replace('&lt;/important&gt;', '</div></div>')

  // more information

  strHTML = strHTML.replace('&lt;more&gt;', '<div class="bs-callout bs-callout-moreinfo"><h4 class="text-moreinfo">More Information:</h4>')
  strHTML = strHTML.replace('&lt;/more&gt;', '</div>')

  // more information customisation

  strHTML = $.parseHTML(strHTML)

  $(strHTML).filter('div.bs-callout.bs-callout-moreinfo').find('ul').attr('style', 'list-style-type: none; margin: 0; padding: 0;')
  $(strHTML).filter('div.bs-callout.bs-callout-moreinfo').find('li').each(function () {

    var title
    var li = $(this)

    if (~$(this).text().indexOf('(') && ~$(this).text().indexOf(')')) {

      var title = $(this).text().substring($(this).text().indexOf('(') + 1, $(this).text().indexOf(')'))
      title = title.trim()

    }

    if ($(this).text().match(/^[a-z]{3}[0-9]{5}/)) {

      $.getJSON('../backend/getProduct.asp', {ref: $(this).text().substring(0, 8)}, function (data) {

        var fa

        switch (data.type) {

          case 'call guide':
            fa = '<i class="fa fa-fw fa-comments-o" aria-hidden="true"></i>'
            break
          case 'how to':
            fa = '<i class="fa fa-question-circle-o" aria-hidden="true"></i>'
            break
          case 'referral':
            fa = '<i class="fa fa-fw fa-paper-plane-o" aria-hidden="true"></i>'
            break
          case 'case':
            fa = '<i class="fa fa-fw fa-puzzle-piece" aria-hidden="true"></i>'
            break
          case 'action guide':
            fa = '<i class="fa fa-fw fa-book" aria-hidden="true"></i>'
            break
          case 'helpcard':

            if (data.filetype.legacy === 'pdf' || data.filetype.ocelot === 'pdf') {

              fa = '<i class="fa fa-fw fa-file-pdf-o" aria-hidden="true"></i>' // pdf

            } else if (data.filetype.legacy === 'doc' || data.filetype.legacy === 'docx' || data.filetype.ocelot === 'doc' || data.filetype.ocelot === 'docx') {

              fa = '<i class="fa fa-fw fa-file-word-o" aria-hidden="true"></i>' // word

            } else if (data.filetype.legacy === 'xls' || data.filetype.legacy === 'xlsx' || data.filetype.ocelot === 'xls' || data.filetype.ocelot === 'xlsx') {

              fa = '<i class="fa fa-fw fa-file-excel-o" aria-hidden="true"></i>' // excel

            } else if (data.filetype.legacy === 'ppt' || data.filetype.legacy === 'pptx' || data.filetype.legacy === 'pps' || data.filetype.legacy === 'ppsx' || data.filetype.ocelot === 'ppt' || data.filetype.ocelot === 'pptx' || data.filetype.ocelot === 'pps' || data.filetype.ocelot === 'ppsx') {

              fa = '<i class="fa fa-fw fa-file-powerpoint-o" aria-hidden="true"></i>' // powerpoint

            } else {

              fa = '<i class="fa fa-fw fa-file-o" aria-hidden="true"></i>' // default file

            }

            break
          case 'tool':
            fa = '<i class="fa fa-fw fa-wrench" aria-hidden="true"></i>'
            break
          case 'process':
            fa = '<i class="fa fa-fw fa-comments-o" aria-hidden="true"></i>'
            break
          default:
            fa = '<i class="fa fa-fw fa-link" aria-hidden="true"></i>'

        }

        if (data.exists.legacy === false || data.exists.ocelot === false) {

          if (~window.location.href.indexOf('.cc')) {

            $(li).html('&nbsp;<strong>Warning!</strong> The product reference you have entered has not been found').addClass('bg-warning text-white')

          }

        } else {

          if (title !== undefined) {

            if (data.exists.ocelot === true) {

              $(li).html(fa + '&nbsp;&nbsp;<a href="' + data.path.ocelot + '">' + title + '</a>')

            } else if (data.exists.legacy === true) {

              $(li).html(fa + '&nbsp;&nbsp;<a href="' + data.path.legacy + '">' + title + '</a>')

            }

          } else {

            if (data.exists.ocelot === true) {

              $(li).html(fa + '&nbsp;&nbsp;<a href="' + data.path.ocelot + '">' + data.title.ocelot + '</a>')

            } else if (data.exists.legacy === true) {

              $(li).html(fa + '&nbsp;&nbsp;<a href="' + data.path.legacy + '">' + data.title.legacy + '</a>')

            }

          }

        }

      })

    } else if (~$(this).text().indexOf('_telephone')) {

      $.get('../backend/contacts.asp', {id: $(this).text().substring(0, $(this).text().indexOf('_telephone'))}, function (data) {

        data = JSON.parse(data)

        $(li).html('<i class="fa fa-fw fa-phone" aria-hidden="true"></i>&nbsp;&nbsp;' + data[Object.keys(data)[0]].Name)

      })

    } else if (~$(this).text().indexOf('_address')) {

      $.get('../backend/contacts.asp', {id: $(this).text().substring(0, $(this).text().indexOf('_address'))}, function (data) {

        data = JSON.parse(data)

        $(li).html('<i class="fa fa-fw fa-envelope" aria-hidden="true"></i>&nbsp;&nbsp;' + data[Object.keys(data)[0]].Name)

      })

    } else if (~$(this).text().indexOf('http://www.')) {

      if (title !== undefined) {

        $(this).html('<i class="fa fa-fw fa-globe" aria-hidden="true"></i>&nbsp;&nbsp;<a href="' + $(this).text().substring(0, $(this).text().indexOf('(')) + '">' + title + '</a>')

      } else {

        $(this).html('<i class="fa fa-fw fa-globe" aria-hidden="true"></i>&nbsp;&nbsp;<a href="' + $(this).text() + '">' + $(this).text().replace('http://www.', '') + '</a>')

      }

    } else if (~$(this).text().indexOf('https://www.')) {

      if (title !== undefined) {

        $(this).html('<i class="fa fa-fw fa-globe" aria-hidden="true"></i>&nbsp;&nbsp;<a href="' + $(this).text().substring(0, $(this).text().indexOf('(')) + '">' + title + '</a>')

      } else {

        $(this).html('<i class="fa fa-fw fa-globe" aria-hidden="true"></i>&nbsp;&nbsp;<a href="' + $(this).text() + '">' + $(this).text().replace('https://www.', '') + '</a>')

      }

    } else if (~$(this).text().indexOf('www.')) {

      if (title !== undefined) {

        $(this).html('<i class="fa fa-fw fa-globe" aria-hidden="true"></i>&nbsp;&nbsp;<a href="http://' + $(this).text().substring(0, $(this).text().indexOf('(')) + '">' + title + '</a>')

      } else {

        $(this).html('<i class="fa fa-fw fa-globe" aria-hidden="true"></i>&nbsp;&nbsp;<a href="http://' + $(this).text() + '">' + $(this).text().replace('www.', '') + '</a>')

      }

    } else if (~$(this).text().indexOf('http://')) {

      if (title !== undefined) {

        $(this).html('<i class="fa fa-fw fa-link" aria-hidden="true"></i>&nbsp;&nbsp;<a href="' + $(this).text().substring(0, $(this).text().indexOf('(')) + '">' + title + '</a>')

      } else {

        $(this).html('<i class="fa fa-fw fa-link" aria-hidden="true"></i>&nbsp;&nbsp;<a href="' + $(this).text() + '">' + $(this).text().replace('http://', '') + '</a>')

      }

    } else if (~$(this).text().indexOf('https://')) {

      if (title !== undefined) {

        $(this).html('<i class="fa fa-fw fa-link" aria-hidden="true"></i>&nbsp;&nbsp;<a href="' + $(this).text().substring(0, $(this).text().indexOf('(')) + '">' + title + '</a>')

      } else {

        $(this).html('<i class="fa fa-fw fa-link" aria-hidden="true"></i>&nbsp;&nbsp;<a href="' + $(this).text() + '">' + $(this).text().replace('https://', '') + '</a>')

      }

    } else {

      if (~window.location.href.indexOf('.cc')) {

        //$(this).empty();
        $(this).html('&nbsp;<strong>Warning!</strong> Unknown link').addClass('bg-danger text-white')

      }

    }

  })

  return strHTML

}

$('#selectPrimaryTheme').change(function () {
  $('head link#themePrimary').attr('href', 'ColourSchemes/Primary/' + $(this).val())
})
$('#selectSecondaryTheme').change(function () {
  $('head link#themeSecondary').attr('href', 'ColourSchemes/Secondary/' + $(this).val())
})
$(function () {
  if ('tooltip' in $) {
    $('[data-toggle="tooltip"]').tooltip()
  }
})