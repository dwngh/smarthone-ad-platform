import pickle
from instance import DeviceValueInstance  # Assuming this is a custom class for your event instances
from data import FirestoreStorage  # Assuming this is a custom class for Firestore interactions
from datetime import timedelta
import math
import re
import pandas as pd  # Assuming pandas is available for DataFrame operations
from notify_events import Message
from firebase_admin import messaging

TIME_WINDOW = 120  # seconds


def dequeue_in_time_window(events_queue, event_instance, interval=TIME_WINDOW / 2):
    """
    Removes events from the beginning of the queue that fall outside the specified time interval
    relative to the latest event.
    """
    while events_queue and (event_instance.timestamp - events_queue[0].timestamp).total_seconds() > interval:
        events_queue.pop(0)


def is_actuator_by_id(device_id):
    """
    Helper function to check if a device ID corresponds to an actuator.
    This function is taken from the notebook.
    """
    if re.search(r"^[LD]\d+$", device_id):  # Adjusted regex to match the notebook's intent for LD followed by digits
        return True
    return False


class FrequentPatternMiningAD:
    def __init__(self, device_info_file, firestore: FirestoreStorage):
        self.rules = None
        self.events_queue = []
        self.actuator_event_queue = []
        self.firestore = firestore
        self.detection_window_events = None
        self.recent_values = {}  # To store the last known value for each device
        self.missing_devices_map = {}  # To track consecutive missing events for devices within rules
        self.rule_recent_datapoint = {}  # To store the last processed datapoint for each rule
        self.true_positive = 0
        self.false_positive = 0
        self.false_negative = 0
        self.true = 0
        self.false = 0

        with open(device_info_file, 'rb') as file:
            self.device_info = pickle.load(file)
            print(self.device_info)

    def process_new_event(self, event_instance: DeviceValueInstance):
        """
        Processes a new incoming device event. This is the core real-time function.
        """        # Ignore new value after the value get high
        if event_instance.device_id == 'luminosity1':
            if event_instance.value < self.recent_values['luminosity1']:
                return

        self.recent_values[event_instance.device_id] = event_instance.value

        # Only get recent value, not process command

        self.events_queue.append(event_instance)

        # Ensure events_queue only contains events within TIME_WINDOW relative to the latest event
        dequeue_in_time_window(self.events_queue, event_instance, TIME_WINDOW)

        if self.device_info[self.device_info['device_id'] == event_instance.device_id]['is_actuator'].iloc[0]:
            # This is an actuator event
            self.actuator_event_queue.append(event_instance)
            # Dequeue events from the main queue that are too old relative to the *oldest* actuator event
            # This ensures the main events_queue has enough context for the actuator's window
            if len(self.actuator_event_queue) > 0:
                dequeue_in_time_window(self.events_queue, self.actuator_event_queue[0], TIME_WINDOW)
        else:
            # This is a sensor event. Check for anomalies if there are actuator events to process.
            # Process actuator events one by one from the queue
            while self.actuator_event_queue and \
                    (event_instance.timestamp - self.actuator_event_queue[
                        0].timestamp).total_seconds() > TIME_WINDOW / 2:

                current_actuator_event = self.actuator_event_queue[0]
                window_start_time = current_actuator_event.timestamp - timedelta(seconds=TIME_WINDOW / 2)
                window_end_time = current_actuator_event.timestamp + timedelta(seconds=TIME_WINDOW / 2)

                # Filter events for the current detection window
                self.detection_window_events = [
                    e for e in self.events_queue if window_start_time <= e.timestamp <= window_end_time
                ]

                anomalous_devices = self.detect_anomalies(current_actuator_event.timestamp)
                # Assuming warning_devices takes timestamp and device_id of the actuator that triggered the detection
                # and now also takes the list of anomalous devices
                # self.firestore.warning_devices(current_actuator_event.timestamp, anomalous_devices)
                if anomalous_devices:
                    print(
                        f"=============== Anomaly Detected for Actuator {current_actuator_event.device_id} at {current_actuator_event.timestamp} =============== ")
                    print(f"Anomalous Devices in this pattern: {anomalous_devices}")
                    message = Message(f"Anomalous Devices: {anomalous_devices} at {current_actuator_event.timestamp}", "Anomaly Warning", Message.PRIORITY_HIGH, Message.LEVEL_ERROR)
                    message.send("qgs8up_wz5xt6l-zcpwfrzra-tbikqbr")
                    message_to_topic = messaging.Message(
                        notification=messaging.Notification(
                            title="Anomaly Warning",
                            body=f"Abnormal behavior of sensor {anomalous_devices}"
                        ),
                        topic="anomaly_warning"
                    )
                    response_topic = messaging.send(message_to_topic)
                else:
                    print("Nothing wrong.........")

                self.actuator_event_queue.pop(0)
                # After processing an actuator event, ensure the main events_queue is still relevant
                if len(self.actuator_event_queue) > 0:
                    dequeue_in_time_window(self.events_queue, self.actuator_event_queue[0], TIME_WINDOW)
                else:
                    # If actuator queue is empty, ensure main queue is based on the latest sensor event
                    dequeue_in_time_window(self.events_queue, event_instance, TIME_WINDOW)

    def load_pretrained_rule(self, rule_file):
        """
        Loads pre-trained anomaly detection rules.
        """
        with open(rule_file, 'rb') as file:
            self.rules = pickle.load(file)
            # Initialize missing_devices_map and rule_recent_datapoint based on loaded rules
            self.missing_devices_map = self._get_initial_missing_devices_map()
            for rule_index, ru in self.rules.iterrows():
                self.rule_recent_datapoint[rule_index] = []

    def _get_initial_missing_devices_map(self):
        """
        Initializes a map to track consecutive missing events for devices within each rule.
        This function is adapted from the notebook.
        """
        missing_device_map = {}
        if self.rules is not None:
            for rule_index, ru in self.rules.iterrows():
                new_rule_map = {key: 0 for key in ru['itemsets']}
                missing_device_map[rule_index] = new_rule_map
        return missing_device_map

    def _is_only_binaries_rule(self, itemset):
        """
        Checks if all devices in an itemset are binary devices.
        This function is adapted from the notebook.
        """
        for item in itemset:
            is_binary = self.device_info[self.device_info['device_id'] == item]['is_binary_device'].iloc[0]
            if not is_binary:
                return False
        return True

    def detect_anomalies(self, current_timestamp):
        """
        Detects anomalies within the current detection_window_events and identifies the specific
        anomalous devices.
        Returns a list of device IDs that are anomalous, or an empty list if no anomaly is detected.
        """
        if self.rules is None or self.detection_window_events is None or not self.detection_window_events:
            return []

        anomalies_in_window = []

        # Convert detection_window_events to a DataFrame for easier querying
        window_df = pd.DataFrame([
            {'datetime': e.timestamp, 'device_id': e.device_id, 'device_value': e.value, 'is_generated': e.is_generated}
            for e in self.detection_window_events
        ])

        anomaly_devices = window_df[window_df['is_generated'] == True]['device_id'].unique()

        for rule_index, ru in self.rules.iterrows():
            itemset = list(ru['itemsets'])
            threshold = ru['threshold']
            nbrs = ru['model']  # NearestNeighbors model

            datapoint = []
            missing_devices_in_current_rule = []
            num_of_devices_in_window = 0

            for device in itemset:
                device_events_in_window = window_df[window_df['device_id'] == device]
                value = 0

                if device_events_in_window.empty:
                    # If there is no event for the device in the current window, take the past value
                    missing_devices_in_current_rule.append(device)
                    value = self.recent_values.get(device, 0)  # Use 0 as a default if no recent value
                else:
                    value = math.ceil(device_events_in_window['device_value'].mean())
                    num_of_devices_in_window += 1

                # Apply binary device value transformation if applicable
                is_binary = self.device_info[self.device_info['device_id'] == device]['is_binary_device'].iloc[0]
                if is_binary:
                    value = 50 if value > 0 else 0  # As observed in the notebook

                datapoint.append(value)

            # If there are not enough devices in the current window to consider the rule
            if num_of_devices_in_window / len(itemset) < 0.5:
                continue

            # Check for repeated datapoints (for non-binary rules) to avoid redundant calculations
            if self.rule_recent_datapoint.get(rule_index) == datapoint and not self._is_only_binaries_rule(
                    ru['itemsets']):
                continue

            # Update missing devices map and identify anomalies due to consecutive missing events
            anomaly_by_missing_devices = []
            for device in ru['itemsets']:
                if device in missing_devices_in_current_rule:
                    self.missing_devices_map[rule_index][device] += 1
                    if self.missing_devices_map[rule_index][device] >= 3:  # Threshold for consecutive missing events
                        anomaly_by_missing_devices.append(device)
                else:
                    if self.missing_devices_map[rule_index][device] != 0:
                        self.missing_devices_map[rule_index][device] = 0

            Y = [datapoint]
            self.rule_recent_datapoint[rule_index] = datapoint
            dis, inc = nbrs.kneighbors(Y)
            # print(f"Y = [datapoint] {Y}")
            # print(f"dis, inc = nbrs.kneighbors(Y) {dis}  ///  {inc}")

            # For binary rules, check if the datapoint exactly matches a neighbor
            if self._is_only_binaries_rule(ru['itemsets']):
                check_neighbor = False
                for indice in inc[0]:
                    if datapoint == list(ru['input'][indice]):
                        check_neighbor = True
                        break
                if check_neighbor:
                    continue  # No anomaly if it matches a known pattern

            current_rule_anomalies = []
            if dis.min() > threshold:
                # Anomaly detected based on distance. Now identify specific anomalous devices.
                potential_anomalies_count = {key: 0 for key in list(ru['itemsets'])}

                for point_index in range(len(datapoint)):
                    # Create a copy of the datapoint and change one device's value to a neighbor's value
                    copy_datapoint = datapoint.copy()

                    # Iterate through the nearest neighbors to see if changing this point makes it normal
                    for neighbor_index_in_rule_input in inc[0]:
                        neighbor_point = ru['input'][neighbor_index_in_rule_input]
                        # print(f"neighbor_point = ru['input'][indice]  {neighbor_point}")
                        copy_datapoint[point_index] = neighbor_point[point_index]

                        temp_dis, _ = nbrs.kneighbors([copy_datapoint])
                        if temp_dis.min() <= threshold:
                            # If changing this device's value makes the pattern normal, it's a potential anomaly
                            potential_anomalies_count[list(ru['itemsets'])[point_index]] += 1

                # Select top potential anomalies (e.g., those with count > 1 as in notebook)
                sorted_anomalies_dict = sorted(potential_anomalies_count.items(), key=lambda x: x[1], reverse=True)

                # The notebook uses a heuristic where if changing a device's value makes the pattern normal
                # more than once (i.e., for multiple neighbors), it's considered anomalous.
                # Here, we'll consider any device that, when changed, results in a normal pattern for at least one neighbor.
                # A more robust approach might involve a higher count or a different metric.
                for device, count in sorted_anomalies_dict:
                    if count > 1:  # If changing this device's value helped reduce the distance to a normal pattern
                        current_rule_anomalies.append(device)
                        if len(current_rule_anomalies) > 2:
                            break

            # Combine anomalies from distance-based detection and missing devices
            for missing_device in anomaly_by_missing_devices:
                if missing_device not in current_rule_anomalies:
                    current_rule_anomalies.append(missing_device)

            if current_rule_anomalies:
                print(
                    f"Anomaly detected for rule {rule_index} at {current_timestamp}: Devices {current_rule_anomalies}, Distance: {dis.min():.2f}, Threshold: {threshold:.2f}")
                anomalies_in_window.extend(current_rule_anomalies)

                if len(anomaly_devices) > 0 and anomaly_devices[0] in current_rule_anomalies:
                    self.true += 1
                elif current_rule_anomalies:
                    self.false += 1
            else:
                for device in anomaly_devices:
                    if device in list(ru['itemsets']):
                        self.false_negative += 1
        self.print_metric()
        return list(set(anomalies_in_window))  # Return unique anomalous devices found in this window

    def print_metric(self):
        if self.true_positive + self.false_positive == 0:
            precision = -1
        else:
            precision = self.true_positive / (self.true_positive + self.false_positive) * 100
        if self.true_positive + self.false_negative == 0:
            recall = -1
        else:
            recall = self.true_positive / (self.true_positive + self.false_negative) * 100
        print(f"Accuracy {0 if self.true + self.false == 0 else self.true / (self.true + self.false)* 100}% Precision {precision}%  Recall {recall}%")