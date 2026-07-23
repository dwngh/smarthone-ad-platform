# src/tools/basic_home_tools.py
import time
from typing import Literal, Optional

MOCK_DEVICES = {
    "light_living": {"name": "Đèn phòng khách", "type": "light", "status": "OFF", "value": None},
    "air_con": {"name": "Điều hòa phòng ngủ", "type": "air_conditioner", "status": "ON", "value": 26},
}


def get_device_status_tool(device_id: str) -> str:
    device = MOCK_DEVICES.get(device_id)
    if not device:
        return "NOT_FOUND"
    return f"STATUS:{device['status']}|VALUE:{device['value']}"


def set_device_status_tool(device_id: str, status: Literal["ON", "OFF"], value: Optional[int] = None) -> str:
    if device_id not in MOCK_DEVICES:
        return f"ERROR  {device_id} NOT FOUND."

    print(f"[HARDWARE] {device_id} -> {status} (Value: {value})")
    MOCK_DEVICES[device_id]["status"] = status
    if value is not None:
        MOCK_DEVICES[device_id]["value"] = value

    max_retries = 3
    delay_seconds = 0.5

    for attempt in range(1, max_retries + 1):
        print(f"[CHECK] Kiểm tra lại trạng thái lần {attempt}...")
        time.sleep(delay_seconds)  # Đợi một khoảng nhỏ để thiết bị cập nhật trạng thái

        current_state = MOCK_DEVICES[device_id]

        status_match = (current_state["status"] == status)
        value_match = (value is None or current_state["value"] == value)

        if status_match and value_match:
            # Nếu đã khớp (Cập nhật thành công)
            log_success = f"Đã chuyển {current_state['name']} sang {status}"
            if value: log_success += f" ({value} độ)"
            return f"Thành công: {log_success}."

    return f"Thất bại: Quá trình thiết lập trạng thái cho {MOCK_DEVICES[device_id]['name']} bị lỗi (Thiết bị không phản hồi hoặc phản hồi sai)."

home_tools_list = [get_device_status_tool, set_device_status_tool]