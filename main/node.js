

var Leap = require('../lib/index');
var fs = require("fs");

var logleap = false; //flag for if we should record

//create file stream


/**
 * a barebones HTTP server in JS
 * to serve three.js easily
 *
 * @author zz85 https://github.com/zz85
 *
 * Usage: node simplehttpserver.js <port number>
 *
 * do not use in production servers
 * and try
 *     npm install http-server -g
 * instead.
 */

var port = 8000,
http = require('http'),
urlParser = require('url'),
fs = require('fs'),
path = require('path'),
currentDir = process.cwd();


port = process.argv[2] ? parseInt(process.argv[2], 0) : port;
//added parts for Cross-Origin Resource Sharing (CORS) specification
function handleOptions(request, response) {
    response.writeHead(200, {
                       "Access-Control-Allow-Origin": "*",
                       "Access-Control-Allow-Method": "POST, GET, OPTIONS",
                       "Access-Control-Allow-Headers": request.headers["access-control-request-headers"]
                       });
    response.end();
}
//function handleRequest
function handlePost(request, response) {
    
    //probably here, otherwise in handle POST event
    //if URL is our magic start URL
    // then logLeap = true;
    //else if URL is our magic stop URL
    //then logLeap = false;
    //if (request.url="action_circle.html"){logLeap=true;}else{logLeap=false;}
	request.on('data', function (chunk) {
               console.log("logleap received");
               logleap=!logleap;
               console.log(""+logleap);
           });
    
    var urlObject = urlParser.parse(request.url, true);
	var pathname = decodeURIComponent(urlObject.pathname);
    
	console.log('[' + (new Date()).toUTCString() + '] ' + '"' + request.method + ' ' + pathname + '"');
    
	var filePath = path.join(currentDir, pathname);
    
	fs.stat(filePath, function(err, stats) {
            
            if (err) {
			response.writeHead(404, {});
			response.end('File not found!');
			return;
            }
            
            if (stats.isFile()) {
            
			fs.readFile(filePath, function(err, data) {
                        
                        if (err) {
                        response.writeHead(404, {});
                        response.end('Opps. Resource not found');
                        return;
                        }
                        
                        response.writeHead(200, {});
                        response.write(data);
                        response.end();
                        });
            
            } else if (stats.isDirectory()) {
            
			fs.readdir(filePath, function(error, files) {
                       
                       if (error) {
                       response.writeHead(500, {});
                       response.end();
                       return;
                       }
                       
                       var l = pathname.length;
                       if (pathname.substring(l-1)!='/') pathname += '/';
                       
                       response.writeHead(200, {'Content-Type': 'text/html'});
                       response.write('<!DOCTYPE html>\n<html><head><meta charset="UTF-8"><title>' + filePath + '</title></head><body>');
                       response.write('<h1>' + filePath + '</h1>');
                       response.write('<ul style="list-style:none;font-family:courier new;">');
                       files.unshift('.', '..');
                       files.forEach(function(item) {
                                     
                                     var urlpath = pathname + item,
                                     itemStats = fs.statSync(currentDir + urlpath);
                                     
                                     if (itemStats.isDirectory()) {
                                     urlpath += '/';
                                     item += '/';
                                     }
                                     
                                     response.write('<li><a href="'+ urlpath + '">' + item + '</a></li>');
                                     });
                       
                       response.end('</ul></body></html>');
                       });
            }
            });
}
function handleRequest(request, response){
    if(request.method == "POST") {
    handlePost(request, response);
} else if(request.method == "OPTIONS") {
    handleOptions(request, response);
}
}

http.createServer(handleRequest).listen(port);

require('dns').lookup(require('os').hostname(), function (err, addr, fam) {
                      console.log('Running at http://' + addr  + ((port === 80) ? '' : ':') + port + '/');
                      })

console.log('Three.js server has started...');
console.log('Base directory at ' + currentDir);

var palm_pos_stream=fs.createWriteStream('palm_position.csv',{flags:'w'});
var palm_velocity_stream=fs.createWriteStream('palm_velocity.csv',{flags:'w'});
var finger_pos_stream = fs.createWriteStream('finger_position.csv', {flags : 'w'});
var finger_velocity_stream = fs.createWriteStream('finger_velocity.csv', {flags : 'w'});
var palm_rot_stream=fs.createWriteStream('palm_rotation.csv',{flags:'w'});
palm_rot_stream.write("Timestamp: "+"\t"+"\t"+ "Palm Rotation"+"\n");


var prevRot=null;
var correction=0;

var controller = new Leap.Controller()
controller.on("frame", function(frame) {

              if (!logleap) return;
              //else if (logleap=JSON.stringify(1)){
              //setTimeout(function(){alert("Time is up!");}, 60000);
              console.log("Frame: " + frame.id + " @ " + frame.timestamp);

              if (frame.hands.length>0){
              //write timestamp to files
              palm_pos_stream.write("Timestamp: "+"\t"+(frame.timestamp)/1000000 + "\t");
              palm_velocity_stream.write("Timestamp: "+"\t"+(frame.timestamp)/1000000 + "\t");
              finger_pos_stream.write("Timestamp: "+"\t"+(frame.timestamp)/1000000 + "\t");
              finger_velocity_stream.write("Timestamp: "+"\t"+(frame.timestamp)/1000000 + "\t");
              
              //recording palm data: palm position, palm velocity and rotation
              
              //var pr=frame.hands[0]._rotation;
              var pr_final=0;
              var pr=frame.hands[0].roll();
              if (prevRot==null){prevRot=pr;}
              if (pr-prevRot>3.0&&pr-prevRot<3.2){correction=correction-Math.PI;}
              else if (pr-prevRot<-3.0&&pr-prevRot>-3.2){correction=correction+Math.PI;}
              else if (pr-prevRot>6.0&&pr-prevRot<6.4){correction=correction-Math.PI*2;}
              else if (pr-prevRot<-6.0&&pr-prevRot>-6.4){correction=correction+Math.PI*2;}
              pr_final=pr+correction;
              palm_rot_stream.write((frame.timestamp)/1000000+"\t"+JSON.stringify(pr_final)+"\n")
              prevRot=pr;

              for (var handid=0;handid!=frame.hands.length;handid++){
              var hand=frame.hands[handid];
              var pp = hand.palmPosition;
              var pv=hand.palmVelocity;
              
              console.log("HandID: "+handid+"x: " + pp[0] + "y: " + pp[1] + "z: " + pp[2]);
              palm_pos_stream.write("HandID: "+handid+"\t"+"Palm Position: "+JSON.stringify(pp)+ "\t"+"||");
              palm_velocity_stream.write("HandID: "+handid+"\t"+"Palm Velocity: "+JSON.stringify(pv)+"\t"+"||");
                            //recording finger data for each palm: finger position and finger velocity
              for (var fingerid = 0;fingerid!=hand.fingers.length;fingerid++) {
              var fgs=hand.fingers[fingerid].stabilizedTipPosition;
              var fv=hand.fingers[fingerid].tipVelocity;
              //finger correction
              
              console.log("HandID: "+handid+"FingerID: "+fingerid+"x: " + fgs[0] + "y: " + fgs[1] + "z: " + fgs[2]);
              finger_pos_stream.write("HandID: "+handid+"\t"+"FingerID: "+fingerid+"\t"+"Finger Position: "+JSON.stringify(fgs)+"\t"+"||");
              finger_velocity_stream.write("HandID: "+handid+"\t"+"FingerID: "+fingerid+"\t"+"Finger Velocity: "+JSON.stringify(fv)+"\t"+"||");
              }//end finger loop
              finger_pos_stream.write("\n");
              finger_velocity_stream.write("\n");
              }//end palm loop
              palm_pos_stream.write("\n");
              palm_velocity_stream.write("\n");
              //palm_rot_stream.write("\n");
              }
              //}//end if logleap=1
              });//end controller

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