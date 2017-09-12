$(function () {
  'use strict'

  function replacePlaceholders (r) {
    var monthNames = ["January", "Febuary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    // *** Known placeholder types ***

    // Add your new placeholders to this hash. Authors will use the key of the hash to
    // use your placeholder
    var vec = {
      glossary: _buildGlossary,
      timescale: _buildTimescale
    }

    // *** Utility functions ***

    function _formatDate (date) {
      return [date.getDate(), monthNames[date.getMonth()], date.getFullYear()].join(" ")
    }

    // **** Placeholder functions ****

    // Add new placeholders here

    function _buildTimescale(id, display) {
      var timescale;
      var now = new Date();

      var match = id.match(/^(\d+)\s+(day|week)s?$/);
      if (match) {
        timescale = parseInt(match[1], 10) * (match[2] === "week" ? 7 : 1);
      } else {
        timescale = 0;
      }

      switch (display) {
        case "date_ago":
          now.setDate(now.getDate() - timescale);
          break;
      }

      return buildElement("span", "timescale", _formatDate(now));
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

  var currentProcess = 'oct90002'

  function showStanza (stanzaId) {
    $.getJSON(['/process', currentProcess, 'stanza', stanzaId].join('/'))
      .done(function (stanza) {
        var phrases = []

        if ('text' in stanza) {
          phrases.push(stanza.text)
        }

        if ('answers' in stanza) {
          phrases = phrases.concat(stanza.answers)
        }

        if (phrases.length > 0) {
          $.getJSON(['/process', currentProcess, 'phrases'].join('/'), {ids: phrases.join(',')})
            .done(function (phraseList) {
              var i

              for (i = 0; i < phrases.length; i += 1) {
                phrasebook[phrases[i]] = phraseList[i]
              }

              drawStanza(buildStanza(stanzaId, stanza))
            })
        } else {
          drawStanza(buildStanza(stanzaId, stanza))
        }
      })
      .fail(function (jqXHR) {
        showError(jqXHR.responseText)
      })
  }

  function change () {
    $(this).closest('.row').before().remove()

    $('#holder').empty()
    currentResponse = undefined

    showStanza(this.dataset.id)
  }

  function answerClick () {

    var answer = buildElement("div", "col")

    while (this.firstChild) {
      answer.appendChild(this.firstChild)
    }

    $('#previous-holder').removeClass('js-hidden')

    var changeLink = buildElement('a', 'col change-answer click-target', 'Change')
    changeLink.dataset.id = this.dataset.id
    $(changeLink).on('click', change)

    var question = currentResponse.querySelector('.question')
    question.classList.add('col')

    $('#previous').prepend(buildElement('div', 'row',
      question,
      answer,
      changeLink
    ))

    $('#holder').empty()
    showStanza(this.dataset.next)

    currentResponse = undefined
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

    var i, answer, answerBlock, link, line

    if (currentResponse === undefined) {
      currentResponse = buildElement('div', 'complex-response')
      $('#holder').prepend(currentResponse)
    }

    if (stanza.isTerminal()) {
      currentResponse = undefined
      return
    }

    if (stanza.hasWebchat()) {
      line = buildElement('div', stanza.getType(), stanza.getWebchat())
    } else {
      line = buildElement('div', stanza.getType(), stanza.getText())
    }

    if ('link' in stanza.data) {
      link = buildElement('a', 'click-target')
      getLink(stanza.data.link, link)
      link.target = '_blank'

      while (line.firstChild) {
        link.appendChild(line.firstChild)
      }
      line.appendChild(link)
    }

    replacePlaceholders(line)
    currentResponse.appendChild(line)

    if (!stanza.isQuestion()) {
      showStanza(stanza.data.next[0])
      return
    } else {
      answerBlock = buildElement('ul', 'answer-block')

      for (i = 0; i < stanza.data.answers.length; i += 1) {
        answer = buildElement('a', 'answer click-target', getPhrase(stanza.data.answers[i]))

        answer.dataset.next = stanza.data.next[i]
        answer.dataset.id = stanza.data.id

        $(answer).on('click', answerClick)

        answerBlock.appendChild(buildElement('li', 'answer-holder', answer))
      }

      replacePlaceholders(answerBlock)
      currentResponse.appendChild(answerBlock)
    }
  }

  function reset () {
    $('#holder').empty()
    $('#previous-holder').addClass('js-hidden')
    $('#previous').empty()
    $('#alert').empty()
    currentResponse = undefined

    showStanza('start')
  }

  $('#restart').on('click', reset)

  window.addEventListener('popstate', popState)

  reset()

})



