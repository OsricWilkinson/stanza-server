$(function () {
  'use strict'

  var answers = []
  var baseURL = window.location.pathname
  var currentProcess;
  var stanzaCache = {};
  var phraseCache = [];

  function replacePlaceholders (r) {
    var monthNames = ['January', 'Febuary', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    // *** Known placeholder types ***

    // Add your new placeholders to this hash. Authors will use the key of the hash to
    // use your placeholder
    var vec = {
      glossary: _buildGlossary,
      timescale: _buildTimescale
    }

    // *** Utility functions ***

    function _formatDate (date) {
      return [date.getDate(), monthNames[date.getMonth()], date.getFullYear()].join(' ')
    }

    // **** Placeholder functions ****

    // Add new placeholders here

    function _buildTimescale (id, display) {
      var timescale
      var now = new Date()

      var match = id.match(/^(\d+)\s+(day|week)s?$/)
      if (match) {
        timescale = parseInt(match[1], 10) * (match[2] === 'week' ? 7 : 1)
      } else {
        timescale = 0
      }

      switch (display) {
        case 'date_ago':
          now.setDate(now.getDate() - timescale)
          break
      }

      return buildElement('span', 'timescale', _formatDate(now))
    }

    function _buildGlossary (id, text) {
      return buildElement('span', 'glossary', text ? text : id)
    }

    // *** Infrastructure ***

    function _doReplace (node) {
      var text = node.nodeValue, parts, type, replacement

      // Strip leading [ and trailing ]
      text = text.substr(1, text.length - 2)

      // Split the placeholder on ':'
      parts = text.split(':')

      // Get the type
      type = parts[0].toLowerCase()

      // Apply the placeholder function
      if (type in vec) {
        replacement = vec[type].apply(node, parts.slice(1))
        node.parentNode.replaceChild(replacement, node)
      }
    }

    function _doSplit (node) {
      var text = node.nodeValue, chunk

      /* Wallk through the text of a node, looking for square bracket parirs.

      When we find one, split the node at the left and right brackets
      and then trigger the replacement on the newly created node
      */

      while (text.indexOf('[') !== -1 && text.indexOf(']') !== -1) {
        node.splitText(text.indexOf('['))
        node = node.nextSibling
        text = node.nodeValue
        node.splitText(text.indexOf(']') + 1)
        chunk = node
        node = node.nextSibling
        text = node.nodeValue

        _doReplace(chunk)
      }
    }

    function _checkNode (node) {
      /* Walk the tree looking for text nodes. When we find any, pass them to
      a function that starts looking for placeholders
      */

      var i, child, interestingNodes = []
      for (i = 0; i < node.childNodes.length; i += 1) {
        child = node.childNodes[i]
        if (child.nodeType === Node.ELEMENT_NODE) {
          _checkNode(child)
        } else if (child.nodeType === Node.TEXT_NODE) {
          interestingNodes.push(child)
        }
      }

      // This is split out from the loop above to try to avoid an infinate loop
      // when a replacement contians a placeholder.
      for (i = 0; i < interestingNodes.length; i += 1) {
        _doSplit(interestingNodes[i])
      }

      // As part of the process, we split text nodes, so tidy up after ourselves.
      node.normalize()
    }

    // Start the process
    _checkNode(r)
  }

  function showError (text) {
    $('#alert').empty().append(buildElement('div', 'alert alert-danger', text))
  }

  function showStanza (stanzaId, next) {

    function lookupPhrases(phrases, stanza) {
      $.getJSON(['/process', currentProcess, 'phrases'].join('/'), {ids: phrases.join(',')})
        .done(function (phraseList) {
          var i

          for (i = 0; i < phrases.length; i += 1) {
            phrasebook[phrases[i]] = phraseList[i]
          }

          next(buildStanza(stanzaId, stanza))
        })
    }

    function dealWithStanza(stanza) {
      stanzaCache[stanzaId] = stanza
      var phrases = [], i

      if ('text' in stanza) {
        phrases.push(stanza.text)
      }

      if ('answers' in stanza) {
        phrases = phrases.concat(stanza.answers)
      }

      for (i = 0; i < phrases.length; i += 1) {
        if (phrasebook[phrases[i]] !== undefined) {
          phrases.splice(i, 1);
          i -= 1;
        }
      }

      if (phrases.length > 0) {
        lookupPhrases(phrases, stanza);
      } else {
        next(buildStanza(stanzaId, stanza))
      }
    }

    if (stanzaId in stanzaCache) {
      dealWithStanza(stanzaCache[stanzaId])
    } else {
      $.getJSON(['/process', currentProcess, 'stanza', stanzaId].join('/'))
        .done(dealWithStanza)
        .fail(function (jqXHR) {
          showError(jqXHR.responseText)
        })
    }


  }

  function change () {
    var $this = $(this)
    var $row = $this.closest('.row')
    var next = this.dataset.target

    var count = $row.index() + 1
    $row.prevAll().remove()
    $row.remove()

    answers.splice(-count, count)
    updateUrl()

    if (answers.length === 0) {
      $('#previous-holder').addClass('js-hidden')
    }

    $('#holder').empty()
    currentResponse = undefined


    showStanza(next, drawStanza)
  }

  function updateUrl () {
    var target;
    if (answers.length > 0) {
      target = baseURL + '/h/' + answers.join('/')
    } else {
      target = baseURL;
    }
    history.pushState(answers, undefined, target)
  }

  function answerClick () {
    var answer, changeLink, question
    answers.push($(this).closest('.answer-holder').index())
    updateUrl()

    answer = buildElement('div', 'col')

    while (this.firstChild) {
      answer.appendChild(this.firstChild)
    }

    $('#previous-holder').removeClass('js-hidden')

    changeLink = buildElement('a', 'col change-answer click-target', 'Change')
    changeLink.dataset.target = $("#holder .line").first().get(0).dataset.id
    $(changeLink).on('click', change)

    question = currentResponse.querySelector('.question')
    question.classList.add('col')

    $('#previous').prepend(buildElement('div', 'row',
      question,
      answer,
      changeLink
    ))

    $('#holder').empty()
    currentResponse = undefined

    showStanza(this.dataset.next, drawStanza)
  }

  function popState (state) {
    console.log(state)
  }

  var currentResponse

  function getLink (id, el) {
    $.getJSON(['/process', currentProcess, 'link', id].join('/'))
      .done(function (link) {
        el.href = link.dest
        el.title = link.title
      })
  }

  function drawStanza (stanza) {

    var i, answer, answerBlock, link, line, text

    if (currentResponse === undefined) {
      currentResponse = buildElement('div', 'complex-response')
      $('#holder').prepend(currentResponse)
    }

    if (stanza.isTerminal()) {
      currentResponse = undefined
      return
    }

    text = stanza.hasWebchat() ? stanza.getWebchat() : stanza.getText()
    if (text === "") {
      showStanza(stanza.data.next[0], drawStanza)
      return
    }

    line = buildElement('div', "line " + stanza.getType(), text)

    if ('link' in stanza.data) {
      link = buildElement('a', 'click-target')
      getLink(stanza.data.link, link)
      link.target = '_blank'

      while (line.firstChild) {
        link.appendChild(line.firstChild)
      }
      line.appendChild(link)
    }

    line.dataset.id = stanza.data.id

    replacePlaceholders(line)
    currentResponse.appendChild(line)

    if (!stanza.isQuestion()) {
      showStanza(stanza.data.next[0], drawStanza)
      return
    } else {
      answerBlock = buildElement('ul', 'answer-block')

      for (i = 0; i < stanza.data.answers.length; i += 1) {
        answer = buildElement('a', 'answer click-target', getPhrase(stanza.data.answers[i]))

        answer.dataset.next = stanza.data.next[i]
        $(answer).on('click', answerClick)

        answerBlock.appendChild(buildElement('li', 'answer-holder', answer))
      }

      replacePlaceholders(answerBlock)
      currentResponse.appendChild(answerBlock)
    }
  }

  function reset () {
    answers = []
    updateUrl()
    $('#holder').empty()
    $('#previous-holder').addClass('js-hidden')
    $('#previous').empty()
    $('#alert').empty()
    currentResponse = undefined

    showStanza('start', drawStanza)
  }

  $('#restart').on('click', reset)

  window.addEventListener('popstate', popState)

  function onLoad() {
    var answers = [],raw, i
    var match = baseURL.match(/^\/smart\/([a-z]{3}\d{5})(\/h(?:\/\d+)+)?$/)
    currentProcess = match[1];
    if (match[2] !== undefined) {
      baseURL = "/smart/" + currentProcess
      raw = match[2].split("/")
      raw.splice(0, 2) // First two entries are always "" and "h"
      for (i = 0; i < raw.length; i += 1) {
        answers.push(parseInt(raw[i], 10))
        if (isNaN(answers[i])) {
          answers = [];
          break;
        }
      }
    }
    if (answers.length > 0) {

    }
  }

  onLoad()
  reset()

})



