import json
from datetime import datetime
import requests

def get_numerical_value(value):
    if value in ['ON', 'OPEN']:
        return 1
    if value in ['OFF', 'CLOSE']:
        return 0
    return int(value)


class DeviceValueInstance:
    def __init__(self, timestamp=None, device_id=None, value=None, mode=None):
        self.timestamp = timestamp
        self.device_id = device_id
        self.value = value
        self.is_generated = None

    def parse(self, packet_data):
        # packet_data = packet_data[:-1].decode("utf-8")
        # print(packet_data)
        ins_object = json.loads(packet_data.decode("utf-8"))
        # tmp = packet_data.split('\t')
        # # print(f"Mode: {self.mode}")
        # if '.' not in tmp[0]:
        #     tmp[0] += '.000000'
        self.timestamp = datetime.strptime(ins_object["datetime"], '%Y-%m-%d %H:%M:%S.%f')
        self.device_id = ins_object["name"]
        self.value = ins_object["value"]
        # # firestore.publish_event(self.device_id, self.value, self.timestamp)
        # self.is_generated = True if tmp[3] == 'True' else False


    def to_string(self):
        packet = {
            'timestamp': self.timestamp.strftime("%Y-%m-%d %H:%M:%S.%f"),
            'id': self.device_id,
            'value': self.value
        }

        return json.dumps(packet)

    @staticmethod
    def get_channel():
        return "/home_1/devices"

