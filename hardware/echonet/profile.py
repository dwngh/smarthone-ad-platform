from echonet.packet import EchonetPacket, EchonetProperty
from echonet.sensor import EchonetSensor, MotionSensor, TemperatureSensor, HumiditySensor, LuminositySensor, \
    EchonetController, GeneralLightDevice, monitoring_sensors
from server import send_UDP_packet
import threading


def is_matching(seoj, packet_deoj):
    if (seoj[0] == packet_deoj[0] and seoj[1] == packet_deoj[1]
            and (seoj[2] == packet_deoj[2] or packet_deoj[2] == 0)):
        return True
    return False


class NodeProfileObject:
    def __init__(self, seoj=(0x0e, 0xf0, 0x01), debug=True):
        self.seoj = seoj
        self.sensors = []
        self.debug = debug
        self.controller = None
        self.actuators = []

    def default_config(self):
        self.sensors = [
            MotionSensor(),
            TemperatureSensor(),
            HumiditySensor(),
            LuminositySensor(),
        ]
        self.actuators = [
            GeneralLightDevice(),
        ]

    def start_monitoring(self):
        monitor_thread = threading.Thread(target=monitoring_sensors, args=(self,))
        monitor_thread.start()

    def handle_announcement(self, received_packet, addr):
        edt = [len(self.sensors) + len(self.actuators)]
        for sensor in self.sensors:
            edt += list(sensor.eoj)
        for actuator in self.actuators:
            edt += list(actuator.eoj)

        properties = EchonetProperty(0xd6, bytes(edt))
        response_packet = EchonetPacket(tid=received_packet.tid, seoj=bytes(self.seoj), deoj=received_packet.seoj,
                                        esv=0x72, properties=[properties])
        send_UDP_packet(response_packet.encode(), addr)
        self.controller = EchonetController(received_packet.seoj, addr)

    def handle_incoming_packet(self, data, addr):
        packet = EchonetPacket(data=data)
        if self.debug:
            print(f"Incoming message from {addr}")
            print(packet)

        if is_matching(self.seoj, packet.deoj) and packet.esv == 0x62:
            self.handle_announcement(packet, addr)

        for sensor_object in self.sensors:
            if is_matching(sensor_object.eoj, packet.deoj):
                sensor_object.handle_packet(packet, addr)

