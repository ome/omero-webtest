
console.log("test");

// image dimensions
var imageId;
var sizeX;
var sizeY;
var currZ = 0;
var currZoom = 100;

var img = new Image();

var canvas,
    ctx;
var theZ = document.getElementById('theZ');
var zoomSpan = document.getElementById('zoom');

var drawPlane = function(z, zoom) {

    zoom = zoom || currZoom;
    z = z || currZ;
    currZ = z;
    currZoom = zoom;

    console.log(z, zoom);
    zoom = zoom/100;

    srcX = sizeX * z;
    srcY = 0;
    srcW = sizeX;
    srcH = sizeY;

    canvW = sizeX * zoom;
    canvH = sizeY * zoom;

    canvX = (srcW - canvW) / 2;
    canvY = (srcH - canvH) / 2;

    ctx.fillRect(0, 0, sizeX, sizeY);
    ctx.drawImage(img, srcX, srcY, srcW, srcH, canvX, canvY, canvW, canvH);
};


document.getElementById('zslider').addEventListener('input', function(){
    theZ.innerHTML = this.value;
    drawPlane(this.value);
});


document.getElementById('zoomslider').addEventListener('input', function(){
    zoomSpan.innerHTML = this.value;
    drawPlane(undefined, this.value);
});

var loadImageData = function(imgData) {

    sizeX = imgData.size.width;
    sizeY = imgData.size.height;
    imageId = imgData.id;
    canvas = document.getElementById("canvas");
    canvas.width = sizeX;
    canvas.height = sizeY;
    ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgb(200,200,200)";

    // When we have the Image data, use it to populate the canvas
    img.onload = function() {
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



