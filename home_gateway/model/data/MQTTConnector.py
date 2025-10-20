import paho.mqtt.client as paho


class MQTTConnector:
    def __init__(self, host, port=1883):
        self.client = paho.Client()
        self.host = host
        self.port = port

    def start(self):
        self.client.connect(self.host, self.port)
        self.client.loop_start()

    def publish_device_value(self, device_instance):
        (rc, mid) = self.client.publish(device_instance.get_channel(), device_instance.to_string(), qos=2)
        print(device_instance.to_string())
        print(f"Published with return code {rc} and message ID {mid}")

    def close(self):
        self.client.loop_stop()
        self.client.disconnect()
