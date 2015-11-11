var Lume = function() {};

Lume.prototype.init = function() {
  console.log('hey there!');
};


document.addEventListener('DOMContentLoaded', function() {
  var lightbox = new Lume();
  lightbox.init();
});