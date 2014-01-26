AR-Synth.js
===========

Color tracking synthesizer using webkitAudioContext and getUserMedia (webcam)

## Initialization
You must have two elements, video and canvas.
```html
<script src="/js/ar-synth.js"></script>
<video id="webcam" autoplay width="800" height="600" oncanplay="initialize()"></video>
<canvas id="webcamMirror"></canvas>
```

```javascript
var initialize = function(){
  var options = {
    color: '#b127b9'
  };
  ARSynth(options);
}
```

## Options
- `color`: Color to track (Defaults to: '#b127b9')
- `frequencyElm`: Element to show frequency
- `noteElm`: Where Element to show note
- `cOffset`: A bigger offset will detect a bigger range of colors (defaults to 50)
- `sizeOffset`: Detect only blocks bigger than this weight (defaults to 5)
- `trackedElm`: Tracked point element (optional)
