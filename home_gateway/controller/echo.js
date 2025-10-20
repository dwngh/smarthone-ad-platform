// Load the node-echonet-lite module
var EchonetLite = require('node-echonet-lite');
var EchonetSensor = require("./sensor.js")

var el = new EchonetLite({'type': 'lan'});
var echonet_devices = new Map();
var passive_echonet_devices = new Map();

// Initialize the EchonetLite object
el.init((err) => {
  if(err) { // An error was occurred
    showErrorExit(err);
  } else { // Start to discover devices
    discoverDevices();
  }
});

// Start to discover devices
function discoverDevices() {
  // Start to discover a smart electric energy meter
  // on Wi-SUN B-route using a Wi-SUN USB dongle
  el.startDiscovery((err, res) => {
    // Error handling
    if(err) {
      showErrorExit(err);
    }
    // Determine the type of the found device
    var device = res['device'];
    var address = device['address'];
    device["eoj"].forEach(eoj => {
        EchonetSensor.handle_new_device(eoj, echonet_devices, passive_echonet_devices, address)
    });
    

    el.on('notify', (res) => {
       console.log('[NOTIFY] From: ' + res['device']['address'] + ' --------------------------');
       //console.log(JSON.stringify(res['message'], null, '  '));
      //  console.log(res['message']['seoj'])
      //  console.log(res['message']['prop'][0]['edt'])
       let eoj = res['message']['seoj']
       let sid = eoj[0].toString() + "-" + eoj[1].toString() + "-" + eoj[2].toString();
       console.log(eoj)
       console.log(sid)
       let sensor = echonet_devices.get(sid)
       console.log(sensor)
       if (sensor) {
          sensor.parse_updated_value(res)
       }
     });

     const intervalId = setInterval(EchonetSensor.update_device_value, 1000, passive_echonet_devices, el);
  });
}

// Get the measured values
function getMeasuredValue(address, eoj) {
  var epc = 0xE7; // An property code which means "Measured instantaneous electric energy"
  el.getPropertyValue(address, eoj, epc, (err, res) => {
    var energy = res['message']['data']['energy'];
    console.log('Measured instantaneous electric energy is ' + energy + ' W.');
    el.close(() => {
      console.log('Closed.');
      process.exit();
    });
  });
}

// Print an error then terminate the process of this script
function showErrorExit(err) {
  console.log('[ERROR] '+ err.toString());
  process.exit();
}