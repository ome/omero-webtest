
// image dimensions
var imageId;


var q = window.location.search.substring(1);
var imageId = q.split('&').reduce(function(prev, p){
    var kv = p.split('=');
    if (prev) return prev;
    if (kv[0] === 'image') return kv[1];
}, undefined);

if (!imageId) {
    alert("Need imageId via query ?image=123");
}

var model = new ImageModel();
var manager = new ImageDataManager(model);

new ImageCanvas(model, manager);
new UiControls(model, manager);

model.loadImage(imageId);




