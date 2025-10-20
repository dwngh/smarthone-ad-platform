from server import SocketServer
from data import FirestoreStorage
from instance import DeviceValueInstance
from method import FrequentPatternMiningAD


HOST = '127.0.0.1'
PORT = 8834
method = None
firestore = None


def process_new_event(e):
    ins = DeviceValueInstance()
    ins.parse(e)
    # ins.send_to_hgw()
    method.process_new_event(ins)
    # mqtt_client.publish_device_value(ins)
    print(f"-{ins.to_string()}-")


if __name__ == '__main__':
    print("Hi")
    firestore = FirestoreStorage()
    method = FrequentPatternMiningAD('device_info.pkl', firestore)
    method.load_pretrained_rule('mahalanobis_home_1.model')

    server = SocketServer(HOST, PORT)
    server.loop(process_new_event)
