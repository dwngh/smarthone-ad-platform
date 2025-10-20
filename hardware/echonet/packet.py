import struct
from typing import List, Dict, Union


class EchonetProperty:
    """Represents a single ECHONET property (EPC, PDC, EDT)."""

    def __init__(self, epc: int, edt: bytes):
        if not isinstance(epc, int) or not (0 <= epc <= 0xFF):
            raise ValueError(f"EPC must be a single byte integer (0x00-0xFF), got {epc}.")
        if not isinstance(edt, bytes):
            raise TypeError("EDT must be a bytes object.")

        self.epc = epc  # ECHONET Property Code (1 byte)
        self.pdc = len(edt)  # Property Data Count (1 byte - derived from EDT length)
        self.edt = edt  # ECHONET Data (PDC bytes)

    def __repr__(self):
        return (f"EchonetProperty(EPC=0x{self.epc:02X}, "
                f"PDC={self.pdc}, EDT=0x{self.edt.hex().upper()})")


class EchonetPacket:
    """Parses/Generates a raw ECHONET Lite packet from/to bytes."""

    # ECHONET Lite Header fixed value (0x1081)
    EHD_FIXED = 0x1081

    # Common ECHONET Service Codes (ESV) for reference
    SERVICE_CODES = {
        0x60: "Set (Request)", 0x61: "SetC (Request with Response)",
        0x62: "Get (Request)", 0x63: "Inf_Req (Notification Request)",
        0x74: "Inf (Notification)", 0x72: "Get_Res (Get Response)",
        0x5A: "Set_Res_SNA (Service Not Available Response)",  # Catch-all for SNA responses
    }

    def __init__(self,
                 tid: int = 0x0000,
                 seoj: bytes = b'\x05\xFF\x01',  # Default Controller Profile
                 deoj: bytes = b'\x0E\xF0\x01',  # Default Node Profile
                 esv: int = 0x62,  # Default Get Service
                 properties: List[EchonetProperty] = None,
                 data: bytes = None):
        """
        Initialize the packet either by parsing 'data' bytes or by specifying fields.
        """
        print("Constructing")
        self.tid: int = tid
        self.seoj: bytes = seoj
        self.deoj: bytes = deoj
        self.esv: int = esv
        self.properties: List[EchonetProperty] = properties if properties is not None else []
        self._raw_data = data

        if data:
            self._parse(data)
        else:
            # Ensure OPC is set correctly based on properties list
            self.opc: int = len(self.properties)

    # ------------------ Decoding (Parsing) -------------------

    def _parse(self, data: bytes):
        """Internal method to decode the raw bytes."""
        print("Parse")
        if len(data) < 12:
            raise ValueError(f"Packet too short: expected at least 12 bytes, got {len(data)}.")

        # 1. EHD and TID (Bytes 0-3)
        ehd, self.tid = struct.unpack('>HH', data[0:4])
        print(f"EHD: {ehd}")
        print(f"TID: {self.tid}")
        if ehd != self.EHD_FIXED:
            print(f"Warning: EHD mismatch, expected 0x{self.EHD_FIXED:04X}, got 0x{ehd:04X}.")

        # 2. SEOJ and DEOJ (Bytes 4-9)
        self.seoj = data[4:7]
        self.deoj = data[7:10]

        # 3. ESV and OPC (Bytes 10-11)
        self.esv, self.opc = struct.unpack('>BB', data[10:12])

        # 4. Properties (EPC, PDC, EDT)
        offset = 12
        self.properties = []
        for _ in range(self.opc):
            if offset + 2 > len(data):
                raise ValueError("Incomplete property definition (EPC/PDC) in packet.")

            # EPC (1 byte) and PDC (1 byte)
            epc, pdc = struct.unpack('>BB', data[offset:offset + 2])
            offset += 2

            # EDT (PDC bytes)
            if offset + pdc > len(data):
                raise ValueError("Incomplete property data (EDT) in packet.")

            edt = data[offset:offset + pdc]
            offset += pdc

            self.properties.append(EchonetProperty(epc, edt))  # PDC is calculated inside EchonetProperty

        # Check for trailing junk data
        if offset != len(data):
            print(f"Warning: Packet has {len(data) - offset} unparsed bytes (junk data).")

    # ------------------ Encoding (Generation) -------------------

    def encode(self) -> bytes:
        """Serializes the EchonetPacket object back into a raw ECHONET Lite byte string."""
        # Update OPC just before encoding to ensure consistency
        self.opc = len(self.properties)

        # 1. EHD and TID (4 bytes)
        # >HH: Big-endian unsigned short (2 bytes) x 2
        header = struct.pack('>HH', self.EHD_FIXED, self.tid)

        # 2. SEOJ and DEOJ (6 bytes)
        eoj_data = self.seoj + self.deoj

        # 3. ESV and OPC (2 bytes)
        # >BB: Big-endian unsigned char (1 byte) x 2
        esv_opc = struct.pack('>BB', self.esv, self.opc)

        # 4. Properties (Variable length)
        properties_data = b''
        for prop in self.properties:
            # EPC (1 byte), PDC (1 byte)
            prop_header = struct.pack('>BB', prop.epc, prop.pdc)
            # EDT (PDC bytes)
            properties_data += prop_header + prop.edt
        # Combine all parts
        full_packet = header + eoj_data + esv_opc + properties_data
        return full_packet

    # ------------------ Utility Methods -------------------

    def get_service_name(self) -> str:
        """Returns the human-readable name of the ECHONET Service."""
        return self.SERVICE_CODES.get(self.esv, f"Unknown Service (0x{self.esv:02X})")

    def get_object_info(self, obj_bytes: bytes) -> Dict[str, str]:
        """Converts an EOJ (3 bytes) into human-readable components."""
        group_code = obj_bytes[0]
        class_code = obj_bytes[1]
        instance_code = obj_bytes[2]

        return {
            "Group_Code": f"0x{group_code:02X}",
            "Class_Code": f"0x{class_code:02X}",
            "Instance_Code": f"0x{instance_code:02X}",
            "Formatted": f"{group_code:02X}{class_code:02X}{instance_code:02X}"
        }

    def to_dict(self) -> Dict[str, Union[int, str, Dict, List]]:
        """Returns a comprehensive dictionary representation of the parsed packet."""

        parsed_properties = [
            {
                "EPC": f"0x{prop.epc:02X}",
                "PDC": prop.pdc,
                "EDT": f"0x{prop.edt.hex().upper()}",
                "Raw_Bytes": prop.edt
            } for prop in self.properties
        ]

        return {
            "EHD": f"0x{self.EHD_FIXED:04X}",
            "TID": f"0x{self.tid:04X}",
            "ESV": f"0x{self.esv:02X} ({self.get_service_name()})",
            "OPC": self.opc,
            "Source_Object": self.get_object_info(self.seoj),
            "Destination_Object": self.get_object_info(self.deoj),
            "Properties": parsed_properties,
            "Raw_Packet_Length": len(self.encode())
        }

    def __str__(self):
        """Provides a user-friendly summary of the packet."""
        d = self.to_dict()
        s = f"--- ECHONET Lite Packet Analysis (TID: {d['TID']}) ---\n"
        s += f"  Service: {d['ESV']}\n"
        s += f"  Source (SEOJ): {d['Source_Object']['Formatted']}\n"
        s += f"  Destination (DEOJ): {d['Destination_Object']['Formatted']}\n"

        for i, prop in enumerate(d['Properties']):
            s += f"  - Property {i + 1}:\n"
            s += f"    -> EPC: {prop['EPC']}\n"
            s += f"    -> PDC: {prop['PDC']} bytes\n"
            s += f"    -> EDT: {prop['EDT']}\n"

        return s