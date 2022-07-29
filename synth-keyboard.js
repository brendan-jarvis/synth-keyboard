window.onload = function () {
  let audioContext = new (window.AudioContext || window.webkitAudioContext)()
  let oscList = [] // Contains all currently playing oscillators
  let mainGainNode = null // Oscillators will connect to this gain node to control volume with a single slider

  let keyboard = document.querySelector('.keyboard')
  let wavePicker = document.querySelector("select[name='waveform']")
  let volumeControl = document.querySelector("input[name='volume']")

  // array of arrays; each array represents one octave, each of which contains one entry for each note in that octave.
  // The value for each is the frequency, in Hertz, of the note's tone.
  let noteFreq = null

  // PeriodicWave describing the waveform to use when the user selects "Custom" from the waveform picker
  let customWaveform = null

  // Store the data for generating the waveform
  let sineTerms = null
  let cosineTerms = null

  // function builds the array noteFreq to contain an array of objects representing each octave.
  // Each octave, in turn, has one named property for each note in that octave; the property's name is the note's name (such as "C#" to represent C-sharp),
  // and the value is the frequency, in Hertz, of that note
  // If we want the frequency for the note G# in octave 1, we use noteFreq[1]["G#"] and get the value 51.9 as a result
  function createNoteTable() {
    let noteFreq = []
    for (let i = 0; i < 9; i++) {
      noteFreq[i] = []
    }

    noteFreq[3]['C'] = 130.81
    noteFreq[3]['C#'] = 138.59
    noteFreq[3]['D'] = 146.83
    noteFreq[3]['D#'] = 155.56
    noteFreq[3]['E'] = 164.81
    noteFreq[3]['F'] = 174.61
    noteFreq[3]['F#'] = 185.0
    noteFreq[3]['G'] = 196.0
    noteFreq[3]['G#'] = 207.65
    noteFreq[3]['A'] = 220.0
    noteFreq[3]['A#'] = 233.08
    noteFreq[3]['B'] = 246.94

    noteFreq[4]['C'] = 261.6255653005986
    noteFreq[4]['C#'] = 277.182630976872045
    noteFreq[4]['D'] = 293.6647679174075
    noteFreq[4]['D#'] = 311.12698372208089
    noteFreq[4]['E'] = 329.6275569128699
    noteFreq[4]['F'] = 349.2282314330039
    noteFreq[4]['F#'] = 369.9944227116344
    noteFreq[4]['G'] = 391.99543598174927
    noteFreq[4]['G#'] = 415.3046975799451
    noteFreq[4]['A'] = 440
    noteFreq[4]['A#'] = 466.1637615180899
    noteFreq[4]['B'] = 493.8833012561241

    noteFreq[5]['C'] = 523.25113060119744
    noteFreq[5]['C#'] = 554.36526195374415
    noteFreq[5]['D'] = 587.329535834815
    noteFreq[5]['D#'] = 622.2539674441618
    noteFreq[5]['E'] = 659.2551138257401
    noteFreq[5]['F'] = 698.4564628660077
    noteFreq[5]['F#'] = 739.9888454232688
    noteFreq[5]['G'] = 783.9908719634985
    noteFreq[5]['G#'] = 830.6093951598907
    noteFreq[5]['A'] = 880
    noteFreq[5]['A#'] = 932.3275230361799
    noteFreq[5]['B'] = 987.7666025122483

    return noteFreq
  }

  function setup() {
    noteFreq = createNoteTable()

    volumeControl.addEventListener('change', changeVolume, false)

    mainGainNode = audioContext.createGain()
    mainGainNode.connect(audioContext.destination)
    mainGainNode.gain.value = volumeControl.value

    // Create the keys; skip any that are sharp or flat; for
    // our purposes we don't need them. Each octave is inserted
    // into a <div> of class "octave".

    noteFreq.forEach(function (keys, idx) {
      let keyList = Object.entries(keys)
      let octaveElem = document.createElement('div')
      octaveElem.className = 'octave'

      keyList.forEach(function (key) {
        // Skips sharp notes
        if (key[0].length == 1) {
          octaveElem.appendChild(createKey(key[0], idx, key[1]))
        }
        // Draws the sharp notes
        // octaveElem.appendChild(createKey(key[0], idx, key[1]))
      })

      keyboard.appendChild(octaveElem)
    })

    sineTerms = new Float32Array([0, 0, 1, 0, 1])
    cosineTerms = new Float32Array(sineTerms.length)
    customWaveform = audioContext.createPeriodicWave(cosineTerms, sineTerms)

    for (i = 0; i < 9; i++) {
      oscList[i] = {}
    }
  }

  setup()

  function createKey(note, octave, freq) {
    let keyElement = document.createElement('div')
    let labelElement = document.createElement('div')

    keyElement.className = 'key'
    keyElement.dataset['octave'] = octave
    keyElement.dataset['note'] = note
    keyElement.dataset['frequency'] = freq

    labelElement.innerHTML = `${note}<sub>${octave}</sub>`
    keyElement.appendChild(labelElement)

    keyElement.addEventListener('mousedown', notePressed, false)
    keyElement.addEventListener('mouseup', noteReleased, false)
    keyElement.addEventListener('mouseover', notePressed, false)
    keyElement.addEventListener('mouseleave', noteReleased, false)

    return keyElement
  }

  function playTone(freq) {
    let osc = audioContext.createOscillator()
    osc.connect(mainGainNode)

    let type = wavePicker.options[wavePicker.selectedIndex].value

    if (type === 'custom') {
      osc.setPeriodicWave(customWaveform)
    } else {
      osc.type = type
    }

    osc.frequency.value = freq
    osc.start()

    return osc
  }

  function notePressed(event) {
    if (event.buttons & 1) {
      let dataset = event.target.dataset

      if (!dataset['pressed']) {
        let octave = +dataset['octave']
        oscList[octave][dataset['note']] = playTone(dataset['frequency'])
        dataset['pressed'] = 'yes'
      }
    }
  }

  function noteReleased(event) {
    let dataset = event.target.dataset

    if (dataset && dataset['pressed']) {
      let octave = +dataset['octave']
      oscList[octave][dataset['note']].stop()
      delete oscList[octave][dataset['note']]
      delete dataset['pressed']
    }
  }

  function changeVolume(event) {
    mainGainNode.gain.value = volumeControl.value
  }
}
