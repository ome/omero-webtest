

var getJSON = function(url, callback) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);

    request.onload = function() {
      if (this.status >= 200 && this.status < 400) {
        // Success!
        var data = JSON.parse(this.response);
        callback(data);
      } else {
        // We reached our target server, but it returned an error
        console.log('ERROR on getJSON');
      }
    };

    request.onerror = function() {
      // There was a connection error of some sort
      console.log('Connection ERROR on getJSON');
    };

    request.send();
};
