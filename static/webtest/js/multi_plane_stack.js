
console.log("test");

// image dimensions
var imageId;
var sizeX;
var sizeY;

var img = new Image();

var canvas,
    ctx;
var theZ = document.getElementById('theZ');

var drawPlane = function(z, t) {

    ctx.drawImage(img, sizeX * z, 0, sizeX, sizeY, 0, 0, sizeX, sizeY);
};


document.getElementById('zslider').addEventListener('input', function(){
    theZ.innerHTML = this.value;
    drawPlane(this.value);
});

var loadImageData = function(imgData) {

    sizeX = imgData.size.width;
    sizeY = imgData.size.height;
    imageId = imgData.id;

    // When we have the Image data, use it to populate the canvas
    img.onload = function() {
        canvas = document.getElementById("canvas");
        canvas.width = sizeX;
        canvas.height = sizeY;

        ctx = canvas.getContext("2d");

        z = 0;

        drawPlane(z);
    };

    img.src="/webtest/render_multi_planes/" + imageId + "/?theZ=0-10";
};

var q = window.location.search.substring(1);
var imageId = q.split('&').reduce(function(prev, p){
    var kv = p.split('=');
    if (prev) return prev;
    if (kv[0] === 'image') return kv[1];
}, undefined);

if (!imageId) {
    alert("Need imageId via query ?image=123");
}
var url = '/webgateway/imgData/' + imageId;
getJSON(url, function(data){
    console.log(data);
    loadImageData(data);
});



