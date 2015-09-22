/*
* Color tracking Synth (Theremin Like)
*
* By Gilberto Avalos <avalosagnostic@gmail.com>
* http//github.com/Agnostic
*/

(function(root){

  var playing = false,
    audioContext,
    jsNode,
    theremin;

  var CONFIG = {};

  function setConfig(){
    CONFIG = {

      // RGB Color to detect
      color: '#b127b9',

      // Webcam element to capture
      webcamElm: document.getElementById('webcam'),

      // Our view
      webcamMirror: document.getElementById('webcamMirror'),

      // Tracked point element
      trackedElm: document.getElementById('tracked'),

      // Element to show frequency
      frequencyElm: false,

      // Element to show note
      noteElm: false,

      // Color offset  (+/-)
      // A bigger offset will detect a bigger range of colors
      cOffset: 50,

      // Detect only blocks bigger than this weight
      sizeOffset: 5,

      // Experimental (requires timbre.js)
      useTimbre: false
    };
  }
  setConfig();

  function initializeCamera(){
    var video = CONFIG.webcamElm;
    var webcamError = function(e) {
      alert('Webcam error!', e);
    };

    if (navigator.getUserMedia) {
      navigator.getUserMedia({audio: false, video: true}, function(stream) {
        video.src = stream;
      }, webcamError);
    } else if (navigator.webkitGetUserMedia) {
      navigator.webkitGetUserMedia({ audio:false, video:true }, function(stream) {
        video.src = window.URL.createObjectURL(stream);
      }, webcamError);
    }
  }

  function extend(destination, source) {
    for (var property in source) {
      destination[property] = source[property];
    }
    return destination;
  }

  function zeroPad(v, num_digits) {
    var s = String(v);
    if(s.length < num_digits) {
      var dif = num_digits - s.length;
      for(var i = 0; i < dif; i++) {
        s = '<span class="inactive">0</span>' + s;
      }
    }
    return s;
  }

  function noteNumberToNote(n) {
    var notes = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],
      name = n % 12,
      octave = Math.floor(n / 12) - 1,
      note = notes[name];

    return note + (note.length < 2 ? '-' : '') + octave;
  }

  function frequencyToNoteNumber(f) {
    return Math.round(12 * Math.log(f / 440.0) + 69);
  }

  function frequencyToNote(f) {
    return noteNumberToNote(frequencyToNoteNumber(f));
  }

  function updateDisplay() {
    if(CONFIG.frequencyElm){
      CONFIG.frequencyElm.innerHTML = zeroPad(Math.round(theremin.frequency), 4) + ' Hz';
    }

    if(CONFIG.noteElm){
      CONFIG.noteElm.innerHTML = frequencyToNote(theremin.frequency);
    }
  }

  /* Therermin code */
  function Theremin() {
    var position        = 0, frequency,
    inverseSamplingRate,
    TWO_PI              = Math.PI * 2.0;
    this.samplingRate   = 44100;
    inverseSamplingRate = 1.0 / this.samplingRate;
    this.pitchBase      = 50;
    this.pitchBend      = 0;
    this.pitchRange     = 2000;
    this.volume         = 0.5;
    this.maxVolume      = 0.5;
    this.frequency      = this.pitchBase;
    frequency           = this.pitchBase;

    this.getBuffer = function(numSamples) {
      var out = [];
      var v   = this.volume * this.maxVolume;

      for(var i = 0; i < numSamples; i++) {

        out[i] = v * Math.sin(position * TWO_PI);
        // out[i] = v * Math.floor(127.5 * Math.sin(i * numSamples) + 127.5) * position;

        position += frequency * inverseSamplingRate;
        while(position > 1.0) {
          position -= 1;
        }
      }
      return out;
    };

    this.setPitchBend = function(v) {
      this.pitchBend = v;
      this.frequency = this.pitchBase + this.pitchBend * this.pitchRange;
      frequency      = this.frequency;
    };

    return this;
  }

  function audioProcess(event) {
    var buffer        = event.outputBuffer,
    bufferLeft        = buffer.getChannelData( 0 ),
    bufferRight       = buffer.getChannelData( 1 ),
    numSamples        = bufferLeft.length,
    synthOutputBuffer = [];

    if(playing) {
      synthOutputBuffer = theremin.getBuffer( numSamples );
      for(var i = 0; i < synthOutputBuffer.length; i++) {
        bufferLeft[i] = synthOutputBuffer[i];
        bufferRight[i] = synthOutputBuffer[i];
      }
    } else {
      for(var i = 0; i < numSamples; i++) {
        bufferLeft[i] = 0;
        bufferRight[i] = 0;
      }
    }
  }

  function initAudio() {
    theremin              = new Theremin();
    audioContext          = new AudioContext();
    jsNode                = audioContext.createScriptProcessor(4096);
    jsNode.onaudioprocess = audioProcess;
    jsNode.connect( audioContext.destination );
  }

  window.onload = function() {
    setConfig();
    initializeCamera();
    try{
      initAudio();
    } catch(e) {
      console.log(e);
      alert("Your browser does not support webkitAudioContext");
    }
  };
  /* End of theremin */

  function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
  }

  var processor = {
    doLoad: function() {
      var self            = this;
      this.video          = CONFIG.webcamElm;
      this.mirrorVideo    = CONFIG.webcamMirror;
      this.mirrorVideoCtx = this.mirrorVideo.getContext('2d');
      this.twElement      = CONFIG.trackedElm;
      this.pageLoaded     = true;
      this.startPlayer();
    },
    videoIsPlaying: function() {
      this.timerCallback();
    },
    videoIsReady: function() {
      this.videoLoaded = true;
      this.startPlayer();
    },
    startPlayer: function() {
      if (!this.videoLoaded || !this.pageLoaded) return;
      this.width                      = this.video.width;
      this.height                     = this.video.height;
      this.mirrorVideo.width          = this.width;
      this.mirrorVideo.height         =  this.height;
      this.mirrorVideoCtx.fillStyle   = 'white';
      this.mirrorVideoCtx.strokeStyle = 'black';

      this.mirrorVideoCtx.translate(this.mirrorVideo.width, 0);
      this.mirrorVideoCtx.scale(-1, 1);
      this.playVideo();
    },
    // Videos control
    playVideo: function() {
      this.video.play();
      this.videoIsPlaying();
    },
    stopVideo: function() {
      this.video.pause();
      clearTimeout(this.timeout);
    },
    // Main loop
    timerCallback: function() {
      if (this.video.paused || this.video.ended) {
        return;
      }
      this.computeFrame();
      var self = this;
      this.timeout = setTimeout(function () {
        self.timerCallback();
      }, 50);
    },
    dist: function(x1, y1, x2, y2) {
      return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
    },
    computeFrame: function() {
      var RGB = hexToRgb(CONFIG.color);
      var cR  = RGB.r,
      cG      = RGB.g,
      cB      = RGB.b;

      var sizeOffset = CONFIG.sizeOffset;
      var cOffset    = CONFIG.cOffset;

      this.mirrorVideoCtx.clearRect(0, 0, this.width, this.height);
      try {
        this.mirrorVideoCtx.drawImage(this.video, 0, 0, this.width, this.height);
      } catch(e) {
        return;
      }
      var frame = this.mirrorVideoCtx.getImageData(0, 0, this.width, this.height);

      var x, y;

      var shape1 = null;

      var r, g, b, x, y;

      var D = 20;

      var l = frame.data.length / 4;

      // We dont' need to compute each pixels
      var step = 4;

      for (var i = 0; i < l; i += step) {

        r = frame.data[i * 4 + 0];
        g = frame.data[i * 4 + 1];
        b = frame.data[i * 4 + 2];


        x = i % this.width;
        y = Math.round(i / this.width);

          // Is the pixel in our color range?
          if ((r > (cR - cOffset) && r < (cR + cOffset) ) && (g > (cG - cOffset) && g < (cG + cOffset) ) && (b > (cB - cOffset) && b < (cB + cOffset) )) {
            if (!shape1) {
                  // no shape yet
                  shape1 = {};
                  shape1.x = x;
                  shape1.y = y;
                  shape1.rgb = r + ',' + g + ',' + b;
                  shape1.weight = 1;
                } else {
                  var d = this.dist(x, y, shape1.x, shape1.y);
                  if (d < D) {
                    shape1.x += 1/(shape1.weight + 1) * (x - shape1.x);
                    shape1.y += 1/(shape1.weight + 1) * (y - shape1.y);
                    shape1.rgb = r + ',' + g + ',' + b;
                    shape1.weight++;
                  }
                }
              }
          // Too shaking
          //if (x >= (this.width - step)) i+= step * this.width;
        }

      // We didn't find any shape
      if (!shape1){
        playing = false;
        return;
      }
      if(shape1.weight > sizeOffset) {
        // console.log('Color detectado', shape1);
        // this.twElement.style.top = shape1.y;
        // this.twElement.style.left = shape1.x;

        this.twElement.style.top = shape1.y + 'px';
        this.twElement.style.left = shape1.x + 'px';
        this.twElement.style.backgroundColor = 'rgb('+shape1.rgb+')';
        playing = true;

        theremin.setPitchBend( shape1.x / this.width );
        theremin.volume = 1 - shape1.y / this.height;
        updateDisplay();
      } else {
        playing = false;
      }
      return;
    }
  };

  var ARSynth = {
    init: function(config){
      extend(CONFIG,  config);
      processor.doLoad();
      processor.videoIsReady();
    },
    set: function(option, value){
      CONFIG[option] = value;
    }
  };

  root.ARSynth = ARSynth;

})(window);
