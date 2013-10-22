

var Leap = require('../lib/index');

var port = 8000;
var serverUrl = "127.0.0.1";

var http = require("http");
var path = require("path");
var fs = require("fs");

//console.log("Starting web server at " + serverUrl + ":" + port);

http.createServer( function(req, res) {
                  
                  var now = new Date();
                  
                  var filename = req.url || "postural.html";
                  var ext = path.extname(filename);
                  var localPath = __dirname;
                  var validExtensions = {
                  ".html" : "text/html",
                  ".js": "application/javascript",
                  ".css": "text/css",
                  ".txt": "text/plain",
                  ".jpg": "image/jpeg",
                  ".gif": "image/gif",
                  ".png": "image/png"
                  };
                  var isValidExt = validExtensions[ext];
                  
                  if (isValidExt) {
                  
                  localPath += filename;
                  path.exists(localPath, function(exists) {
                              if(exists) {
                              console.log("Serving file: " + localPath);
                              getFile(localPath, res, ext);
                              } else {
                              console.log("File not found: " + localPath);
                              res.writeHead(404);
                              res.end();
                              }
                              });
                  
                  } else {
                  console.log("Invalid file extension detected: " + ext)
                  }
                  
                  }).listen(port, serverUrl);

function getFile(localPath, res, mimeType) {
	fs.readFile(localPath, function(err, contents) {
                if(!err) {
                res.setHeader("Content-Length", contents.length);
                res.setHeader("Content-Type", mimeType);
                res.statusCode = 200;
                res.end(contents);
                } else {
                res.writeHead(500);
                res.end();
                }
                });
}

//create file stream
var stream = fs.createWriteStream('testfile.csv', {flags : 'w'});

var controller = new Leap.Controller()
controller.on("frame", function(frame) {
setTimeout(function(){alert("Time is up!");}, 60000);
  console.log("Frame: " + frame.id + " @ " + frame.timestamp);
  if (frame.pointables.length>0)
  {
  //var pp = frame.hands[0].palmPosition;
            
              var fgs=frame.pointables[0].stabilizedTipPosition;
              var fv=frame.pointables[0].tipVelocity;
  //console.log("x: " + pp[0] + "y: " + pp[1] + "z: " + pp[2]);
  //stream.write(JSON.stringify(pp) + "\t"+ (frame.timestamp)/1000000 + "\n");
    console.log("x: " + fgs[0] + "y: " + fgs[1] + "z: " + fgs[2]);
    stream.write(JSON.stringify(fgs) + "\t"+ (frame.timestamp)/1000000 + "\t"+JSON.stringify(fv)+"\n");
  }
});

var frameCount = 0;
controller.on("frame", function(frame) {
  frameCount++;
});

setInterval(function() {
  var time = frameCount/2;
  console.log("received " + frameCount + " frames @ " + time + "fps");
  frameCount = 0;
}, 2000);

controller.on('ready', function() {
    console.log("ready");
});
controller.on('connect', function() {
    console.log("connect");
});
controller.on('disconnect', function() {
    console.log("disconnect");
});
controller.on('focus', function() {
    console.log("focus");
});
controller.on('blur', function() {
    console.log("blur");
});
controller.on('deviceConnected', function() {
    console.log("deviceConnected");
});
controller.on('deviceDisconnected', function() {
    console.log("deviceDisconnected");
});

controller.connect();
console.log("\nWaiting for device to connect...");
