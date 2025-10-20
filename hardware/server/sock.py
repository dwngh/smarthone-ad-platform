import socket
import struct


MULTICAST_GROUP = '224.0.23.0'


class UDPServer:
    def __init__(self, addr='0.0.0.0', port=3610):
        self.addr = addr
        self.port = port
        self.server_socket = None

    def start_server(self):
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        # SO_REUSEPORT is also recommended on some systems
        if hasattr(socket, 'SO_REUSEPORT'):
            self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)

        self.server_socket.bind((self.addr, self.port))

        mreq = struct.pack('4sl', socket.inet_aton(MULTICAST_GROUP), socket.INADDR_ANY)
        self.server_socket.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, mreq)

        print(f"   Server started on {self.addr}:{self.port}")
        print(f"   Listening for local traffic and joined Multicast Group: {MULTICAST_GROUP}")

    def listen(self, callback_func):
        while True:
            try:
                # Block until a packet is received (Max buffer size is 1024 bytes)
                data, addr = self.server_socket.recvfrom(1024)
                callback_func(data, addr)

            except KeyboardInterrupt:
                print("\nShutting down server...")
                break
            except Exception as e:
                print(f"An error occurred: {e}")
                break

        self.server_socket.close()
        print("Server shut down.")


def send_UDP_packet(data, addr):
    print(f"Data {data} {addr}")
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    sock.sendto(data, addr)

