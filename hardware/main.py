from server import UDPServer
from echonet import NodeProfileObject


if __name__ == '__main__':
    server = UDPServer()
    server.start_server()
    node_profile = NodeProfileObject()
    node_profile.default_config()

    node_profile.start_monitoring()
    server.listen(node_profile.handle_incoming_packet)


