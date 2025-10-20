import socket


class SocketServer:
    # Init the socket server
    def __init__(self, host, port):
        print(f"Initializing server {host}:{port}")
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock.bind((host, port))

    # Repeatly receive new data instance
    # Receive:
    #   + <packet_length>
    #   + <packet_payload>
    # To confirm send the byte 0 to the client
    def loop(self, process_function):
        while True:
            data, address = self.sock.recvfrom(1024)

            # Decode the received bytes to a string
            decoded_data = data.decode("utf-8")

            print(f"Received message from {address}: {decoded_data}")
            process_function(data)
