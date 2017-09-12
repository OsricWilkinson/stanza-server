$(function () {
  'use strict'

  function showError (text) {
    $('#alert').empty().append(buildElement('div', 'alert alert-danger', text))
  }

  var currentProcess = 'oct90001'

  function getNextStanza (stanzaId) {
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

              showNextStanza(buildStanza(stanzaId, stanza))
            })
        } else {
          showNextStanza(buildStanza(stanzaId, stanza))
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

    getNextStanza(this.dataset.id)
  }

  function answerClick () {
    $(this).off()

    var changeLink = buildElement('a', 'change-answer', 'Change')
    changeLink.dataset.id = this.dataset.id

    $(changeLink).on('click', change)

    $('#previous').prepend(buildElement('div', 'row',
      currentResponse.querySelector('.question'),
      this,
      changeLink
    ))

    $('#holder').empty()
    getNextStanza(this.dataset.next)

    currentResponse = undefined
  }

  var currentResponse

  function showNextStanza (stanza) {

    var i, answer, answerBlock

    if (currentResponse === undefined) {
      currentResponse = buildElement('div', 'complex-response')
      $('#holder').prepend(currentResponse)
    }

    if (!stanza.isQuestion()) {
      if (stanza.isTerminal()) {
        currentResponse = undefined
        return
      } else if (stanza.hasWebchat()) {
        currentResponse.appendChild(buildElement('div', 'instruction', stanza.getWebchat()))
      } else {
        currentResponse.appendChild(buildElement('div', 'instruction', stanza.getText()))
      }
      getNextStanza(stanza.data.next[0])
    } else {
      if (stanza.hasWebchat()) {
        currentResponse.appendChild(buildElement('div', 'question', stanza.getWebchat()))
      } else {
        currentResponse.appendChild(buildElement('div', 'question', stanza.getText()))
      }

      answerBlock = buildElement('div', 'answer-block')

      for (i = 0; i < stanza.data.answers.length; i += 1) {
        answer = buildElement('a', 'answer', getPhrase(stanza.data.answers[i]))

        answer.dataset.next = stanza.data.next[i]
        answer.dataset.id = stanza.data.id

        $(answer).on('click', answerClick)

        answerBlock.appendChild(buildElement('div', 'answer-holder', answer))
      }

      currentResponse.appendChild(answerBlock)
    }
  }

  function reset () {
    $('#holder').empty()
    $('#previous').empty()
    $('#alert').empty()
    currentResponse = undefined

    getNextStanza('start')
  }

  $('#restart').on('click', reset)

  reset()

})



