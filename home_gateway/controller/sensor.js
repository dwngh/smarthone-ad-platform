const dgram = require('dgram');
const mqtt = require('mqtt')

const HOST = "127.0.0.1"
const PORT = 8834
const MQTT_BROKER = 'mqtt://broker.hivemq.com:1883'

function getFormattedDateTime() {
    const now = new Date();

    // Get date parts
    const YYYY = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const DD = String(now.getDate()).padStart(2, '0');

    // Get time parts
    const HH = String(now.getHours()).padStart(2, '0');
    const MI = String(now.getMinutes()).padStart(2, '0');
    const SS = String(now.getSeconds()).padStart(2, '0');
    const MS = String(now.getMilliseconds()).padStart(3, '0'); // Milliseconds

    return `${YYYY}-${MM}-${DD} ${HH}:${MI}:${SS}.${MS}`;
}

function publishMqttMessage(message, brokerUrl = MQTT_BROKER, topic="/home_1/devices") {
    const client = mqtt.connect(brokerUrl);

    client.on('connect', () => {
        client.publish(topic, message, { qos: 1, retain: false }, (err) => {
            if (err) {
                console.error('Error publishing message:', err);
            } else {
                console.log(`Message published to topic '${topic}': ${message}`);
            }

            client.end(true); 
        });
    });

    client.on('error', (err) => {
        console.error('Connection error:', err);
        client.end(true); // Close on error
    });
}

function sendUDPTo(message, host, port) {
    const client = dgram.createSocket('udp4'); // 'udp4' for IPv4
    client.send(message, port, host, (err) => {
        if (err) {
            console.error(`Error sending UDP packet: ${err}`);
        } else {
            console.log(`UDP message sent to ${host}:${port}`);
            console.log(`Payload: ${message.toString()}`);
        }

        client.close();
    });
}

function publishEvent(device, host, port) {
    if (device.name == "AIR_CONDITIONER") {
        device.update_list.forEach(item => {
            const dataToSend = {
                datetime: getFormattedDateTime(), // Use ISO format for consistent timestamp
                name: device.name + "_" + device.eoj[2].toString() + "_" + item.toUpperCase(),
                value: device.value[item]
            };
            if (dataToSend.value != undefined) {
                const message = Buffer.from(JSON.stringify(dataToSend));
                sendUDPTo(message, host, port)
                publishMqttMessage(message)
                // console.log(dataToSend)
            }
            
        })
    } else {
        const dataToSend = {
            datetime: getFormattedDateTime(), // Use ISO format for consistent timestamp
            name: device.name + "_" + device.eoj[2].toString(),
            value: device.value
        };

        const message = Buffer.from(JSON.stringify(dataToSend));
        sendUDPTo(message, host, port)
    }
}

class DumpDevice {
    constructor(eoj, address) {
        this.eoj = eoj;
        this.address = address;
        this.name = "DUMP";
        this.value = -1;
    }

    get_measured_value(el) {
    }
}

class LuminositySensor {
    constructor(eoj, address) {
        this.eoj = eoj;
        this.action_epc = {
            "status": 0x80,
            "luminosity": 0xe0,
        };
        this.name = "LUMINOSITY"
        this.address = address;
        this.value = -1;
    }

    get_measured_value(el) {
        let epc = this.action_epc["luminosity"];
        let eoj = this.eoj;
        let address = this.address;
        el.getPropertyValue(address, eoj, epc, (err, res) => {
            if (err) {
                console.log(err)
            }
            this.value = res.buffer.readUInt16BE(res.buffer.length - 2)
            console.log("Do sang: " + this.value)
        });
    }

    parse_updated_value(res) {
        this.value = res.buffer.readUInt16BE(res.buffer.length - 2)
        console.log("Illumiance: " + this.value)
        publishEvent(this, HOST, PORT)
    }
}

class TemperatureSensor {
    constructor(eoj, address) {
        this.eoj = eoj;
        this.action_epc = {
            "status": 0x80,
            "temperature": 0xe0,
        };
        this.address = address;
        this.value = -1;
        this.name = "TEMPERATURE"
    }

    get_measured_value(el) {
        let epc = this.action_epc["temperature"];
        let eoj = this.eoj;
        let address = this.address;
        el.getPropertyValue(address, eoj, epc, (err, res) => {
            if (err) {
                console.log(err)
            }
            this.value = res.buffer.readUInt16BE(res.buffer.length - 2) / 10
            console.log("Nhiet Do: " + this.value)
        });
    }

    parse_updated_value(res) {
        this.value = res.buffer.readUInt16BE(res.buffer.length - 2) / 10
        console.log("Temperature: " + this.value)
        publishEvent(this, HOST, PORT)
    }
}

class HumiditySensor {
    constructor(eoj, address) {
        this.eoj = eoj;
        this.action_epc = {
            "status": 0x80,
            "humidity": 0xe0,
        };
        this.address = address;
        this.value = -1;
        this.name = "HUMIDITY"
    }

    get_measured_value(el) {
        let epc = this.action_epc["humidity"];
        let eoj = this.eoj;
        let address = this.address;
        el.getPropertyValue(address, eoj, epc, (err, res) => {
            if (err) {
                console.log(err)
            }
            this.value = res.buffer[res.buffer.length - 1]
            console.log("Do am: " + this.value)
        });
    }

    parse_updated_value(res) {
        this.value = res.buffer[res.buffer.length - 1]
        console.log("Humidity: " + this.value)
        publishEvent(this, HOST, PORT)
    }
}

class MotionSensor {
    constructor(eoj, address) {
        this.eoj = eoj;
        this.action_epc = {
            "status": 0x80,
            "human_detect": 0xb1,
        };
        this.address = address;
        this.value = -1;
        this.name = "MOTION"
    }

    get_measured_value(el) {
        let epc = this.action_epc["human_detect"];
        let eoj = this.eoj;
        let address = this.address;
        el.getPropertyValue(address, eoj, epc, (err, res) => {
            if (err) {
                console.log(err)
            }
            this.value = 66 - res.buffer[res.buffer.length - 1]
            console.log("Chuyen Dong: " + this.value)
        });
    }

    parse_updated_value(res) {
        this.value = 66 - res.buffer[res.buffer.length - 1]
        console.log("Motion: " + this.value)
        publishEvent(this, HOST, PORT)
    }
}

class GeneralLightDevice {
    constructor(eoj, address) {
        this.eoj = eoj;
        this.action_epc = {
            "status": 0x80,
        };
        this.address = address;
        this.value = -1;
        this.name = "LIGHT"
    }

    parse_updated_value(res) {
        this.value = 49 - res.buffer[res.buffer.length - 1]
        console.log("Light: " + this.value)
        publishEvent(this, HOST, PORT)
    }
}

class AirConditionerDevice {
    constructor(eoj, address) {
        this.eoj = eoj;
        this.action_epc = {
            "status": 0x80,
            "temperature": 0xb3,
            "mode": 0xb0
        };
        this.address = address;
        this.value = {
            "status": null,
            "temperature": null,
            "mode": null
        };

        this.update_list = []
        this.name = "AIR_CONDITIONER"
    }


    get_status(el, eoj, address) {
        let epc = this.action_epc["status"];
        let r = el.getPropertyValue(address, eoj, epc, (err, res) => {
            if (err) {
                console.log(err)
            }
            // console.log(res['message']['data'])
            let status = res['message']['data']['status'];
            if (status != this.value["status"]) {
                console.log("New status:" + status)
                this.value["status"] = status
                if (status) {
                    this.update_list = ['status', 'mode', 'temperature']            
                } else {
                    this.update_list = ['status']
                }
                publishEvent(this, HOST, PORT)
            }
        });
    }

    get_temp(el, eoj, address) {
        let epc = this.action_epc["temperature"];
        el.getPropertyValue(address, eoj, epc, (err, res) => {
            if (err) {
                console.log(err)
            }
            // let status = res['message']['data']['status'];
            // console.log(res['message']['data'])
            let temp = res['message']['data']['temperature'];
            if (this.value["status"] && temp != this.value["temperature"]) {
                console.log("New tmp:" + temp)
                this.value["temperature"] = temp
                this.update_list = ['temperature']
                publishEvent(this, HOST, PORT)

            }
        });
    }

    get_mode(el, eoj, address) {
        let epc = this.action_epc["mode"];
        el.getPropertyValue(address, eoj, epc, (err, res) => {
            if (err) {
                console.log(err)
            }
            // let status = res['message']['data']['status'];
            // console.log(res['message']['data'])
            let mode = res['message']['data']['mode']
            if (this.value["status"] && mode != this.value["mode"]) {
                console.log("New mode:" + mode)
                this.value["mode"] = mode
                this.update_list = ['mode']
                publishEvent(this, HOST, PORT)
            }
        });
    }

    async get_measured_value(el) {
        let eoj = this.eoj;
        let address = this.address;
        this.get_mode(el, eoj, address)
        this.get_status(el, eoj, address)
        this.get_temp(el, eoj, address)

    }

    parse_updated_value(res) {
        // this.value = 49 - res.buffer[res.buffer.length - 1]
        // console.log("Light: " + this.value)
        // publishEvent(this, HOST, PORT)
        console.log("Do nothing")
    }
}

module.exports = {
    handle_new_device: function (eoj, device_map, passive_device_map, address) {
        let device_id = eoj[0].toString() + "-" + eoj[1].toString() + "-" + eoj[2].toString();

        if (eoj[0] == 0x00 && eoj[1] == 0x0d) {
            console.log("New luminosity: " + device_id)
            device_map.set(device_id, new LuminositySensor(eoj, address))
        } else if (eoj[0] == 0x00 && eoj[1] == 0x11) {
            console.log("New temperature: " + device_id)
            device_map.set(device_id, new TemperatureSensor(eoj, address))
        } else if (eoj[0] == 0x00 && eoj[1] == 0x12) {
            console.log("New humidity: " + device_id)
            device_map.set(device_id, new HumiditySensor(eoj, address))
        } else if (eoj[0] == 0x00 && eoj[1] == 0x07) {
            console.log("New motion: " + device_id)
            device_map.set(device_id, new MotionSensor(eoj, address))
        } else if (eoj[0] == 0x02 && eoj[1] == 0x90) {
            console.log("New Light: " + device_id)
            device_map.set(device_id, new GeneralLightDevice(eoj, address))
        }  else if (eoj[0] == 0x01 && eoj[1] == 0x30) {
            console.log("New Home Airconditioner: " + device_id)
            passive_device_map.set(device_id, new AirConditionerDevice(eoj, address))
        }else {
            console.log("New dummy device " + device_id)
            passive_device_map.set(device_id, new DumpDevice(eoj, address))
        }
    },

    update_device_value: function (device_map, el) {
        // console.log(device_map.get("0-7-1"));
        device_map.forEach((sensor_object, key, map) => {
            // console.log(key);
            sensor_object.get_measured_value(el);
        });
    },
}