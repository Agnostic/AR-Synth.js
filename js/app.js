function initialize(){
  ARSynth.init({
    noteElm: $('#note')[0],
    frequencyElm: $('#frequency')[0]
  });

  $('#color').bind('change', function(){
    ARSynth.set('color', this.value); // hex color
  });

  $('#color-offset').bind('change', function(){
    ARSynth.set('cOffset', parseInt(this.value, 10));
  });

  $('#size-offset').bind('change', function(){
    ARSynth.set('sizeOffset', parseInt(this.value, 10));
  });

}