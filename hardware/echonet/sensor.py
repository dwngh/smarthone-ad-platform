from echonet.packet import EchonetProperty, EchonetPacket
from server import send_UDP_packet
import time
import smbus
import adafruit_dht
import board
import RPi.GPIO as GPIO

dht_sensor = adafruit_dht.DHT22(board.D26)
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
PIR_PIN = 27
light = 17
GPIO.setup(light, GPIO.OUT)
GPIO.setup(PIR_PIN, GPIO.IN)

print('Starting up the PIR Module (click on STOP to exit)')
time.sleep(1)
print ('Ready')
GPIO.output(light, 0)

class EchonetDevice:
    def __init__(self, eoj):
        self.eoj = eoj


class EchonetController(EchonetDevice):
    def __init__(self, eoj, address):
        super().__init__(eoj)
        self.address = address


class EchonetSensor(EchonetDevice):
    def __init__(self, eoj, is_passive=False):
        super().__init__(eoj)
        self.passive = is_passive
        self.last_value = None

    def get_value(self):
        return None

    def handle_packet(self, packet, address):
        return None

    def notif_packet(self, value, controller):
        pass

    def need_update(self, new_value):
        return self.last_value != new_value


class GeneralLightDevice(EchonetDevice):
    def __init__(self, sid=0x1):
        super().__init__(bytes((0x02, 0x90, sid)))


light_state = False


def switch_the_light(current_light_state, addr, seoj):
    new_state = None
    if current_light_state:
        GPIO.output(light, 0)
        new_state = 0x31
    else:
        GPIO.output(light, 1)
        new_state = 0x30

    properties = EchonetProperty(0x80, bytes([new_state]))
    response_packet = EchonetPacket(seoj=bytes((0x02, 0x90, 0x01)), deoj=seoj, esv=0x70,
                                    properties=[properties])
    send_UDP_packet(response_packet.encode(), addr)



class TemperatureSensor(EchonetSensor):
    def __init__(self, sid=0x1):
        super().__init__(bytes((0x0, 0x11, sid)))

    def get_value(self):
        value = 0
        try:
            value = dht_sensor.temperature
        except Exception as e:
            print(e)
        return value

    def handle_packet(self, packet, addr):
        if packet.esv == 0x62 and packet.properties[0].epc == 0xe0:
            value = self.get_value()
            value = int(value * 10)
            properties = EchonetProperty(0xe0, value.to_bytes(2, byteorder='big', signed=False))
            response_packet = EchonetPacket(tid=packet.tid, seoj=bytes(self.eoj), deoj=packet.seoj, esv=0x72, properties=[properties])
            send_UDP_packet(response_packet.encode(), addr)

    def notif_packet(self, value, controller):
        value = int(value * 10)
        properties = EchonetProperty(0xe0, value.to_bytes(2, byteorder='big', signed=False))
        response_packet = EchonetPacket(seoj=bytes(self.eoj), deoj=controller.eoj, esv=0x70,
                                        properties=[properties])
        send_UDP_packet(response_packet.encode(), controller.address)

    def need_update(self, new_value):
        return True if self.last_value is None else (new_value - self.last_value) > 0.5


class LuminositySensor(EchonetSensor):
    def __init__(self, sid=0x1):
        super().__init__(bytes((0x0, 0x0d, sid)))
        self.bus = smbus.SMBus(1)
        # TSL2561 address, 0x39(57)
        # Select control register, 0x00(00) with command register, 0x80(128)
        #       0x03(03)    Power ON mode
        self.bus.write_byte_data(0x39, 0x00 | 0x80, 0x03)
        # TSL2561 address, 0x39(57)
        # Select timing register, 0x01(01) with command register, 0x80(128)
        #       0x02(02)    Nominal integration time = 402ms
        self.bus.write_byte_data(0x39, 0x01 | 0x80, 0x02)

    def get_value(self):
        data = self.bus.read_i2c_block_data(0x39, 0x0C | 0x80, 2)

        # Convert the data
        ch0 = data[1] * 256 + data[0]
        return int(ch0)

    def handle_packet(self, packet, addr):
        if packet.esv == 0x62 and packet.properties[0].epc == 0xe0:
            value = self.get_value()
            properties = EchonetProperty(0xe0, value.to_bytes(2, byteorder='big', signed=False))
            response_packet = EchonetPacket(tid=packet.tid, seoj=bytes(self.eoj), deoj=packet.seoj, esv=0x72, properties=[properties])
            send_UDP_packet(response_packet.encode(), addr)

    def notif_packet(self, value, controller):
        value = self.get_value()
        properties = EchonetProperty(0xe0, value.to_bytes(2, byteorder='big', signed=False))
        response_packet = EchonetPacket(seoj=bytes(self.eoj), deoj=controller.eoj, esv=0x70,
                                        properties=[properties])
        send_UDP_packet(response_packet.encode(), controller.address)

    def need_update(self, new_value):
        return True if self.last_value is None else abs(new_value - self.last_value) > 100


class HumiditySensor(EchonetSensor):
    def __init__(self, sid=0x1):
        super().__init__(bytes((0x0, 0x12, sid)))

    def get_value(self):
        value = 0
        try:
            value = int(dht_sensor.humidity)
        except Exception as e:
            print(e)
        return value

    def handle_packet(self, packet, addr):
        if packet.esv == 0x62 and packet.properties[0].epc == 0xe0:
            value = self.get_value()
            properties = EchonetProperty(0xe0, value.to_bytes(1, byteorder='big', signed=False))
            response_packet = EchonetPacket(tid=packet.tid, seoj=bytes(self.eoj), deoj=packet.seoj, esv=0x72, properties=[properties])
            send_UDP_packet(response_packet.encode(), addr)

    def notif_packet(self, value, controller):
        value = self.get_value()
        properties = EchonetProperty(0xe0, value.to_bytes(1, byteorder='big', signed=False))
        response_packet = EchonetPacket(seoj=bytes(self.eoj), deoj=controller.eoj, esv=0x70,
                                        properties=[properties])
        send_UDP_packet(response_packet.encode(), controller.address)

    def need_update(self, new_value):
        return True if self.last_value is None else  abs(new_value - self.last_value) > 20


class MotionSensor(EchonetSensor):
    def __init__(self, sid=0x1):
        super().__init__(bytes((0x0, 0x07, sid)))
        self.light_state = False

    def get_value(self):
        return GPIO.input(PIR_PIN)

    def notif_packet(self, value, controller):
        if value > 0 and not self.light_state:
            switch_the_light(self.light_state, controller.address, controller.eoj)
            self.light_state = True
        elif value == 0 and self.light_state:
            switch_the_light(self.light_state, controller.address, controller.eoj)
            self.light_state = False

        value = 0x41 if value > 0 else 0x42
        properties = EchonetProperty(0xb1, value.to_bytes(1, byteorder='big', signed=False))
        response_packet = EchonetPacket(seoj=bytes(self.eoj), deoj=controller.eoj, esv=0x70,
                                        properties=[properties])
        send_UDP_packet(response_packet.encode(), controller.address)

    def handle_packet(self, packet, addr):
        if packet.esv == 0x62 and packet.properties[0].epc == 0xb1:
            value = self.get_value()
            properties = EchonetProperty(0xe0, value.to_bytes(1, byteorder='big', signed=False))
            response_packet = EchonetPacket(tid=packet.tid, seoj=bytes(self.eoj), deoj=packet.seoj, esv=0x72, properties=[properties])
            send_UDP_packet(response_packet.encode(), addr)


def monitoring_sensors(profile):
    try:
        print("Start monitoring loop...")
        while True:
            sensors = profile.sensors
            controller = profile.controller
            if controller:
                for sensor in sensors:
                    value = sensor.get_value()
                    if sensor.need_update(value):
                        sensor.notif_packet(value, controller)
                        print(f"sensor {sensor.eoj} need updated")
                        sensor.last_value = value
            time.sleep(2)
    except KeyboardInterrupt:
        print("Stop monitoring...")
