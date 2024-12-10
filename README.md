# System architecture:

<img width="1236" alt="Screenshot 2024-12-10 at 20 15 09" src="https://github.com/user-attachments/assets/44ef947d-c3aa-4e47-8451-57ce739fdae8">

The Network Monitoring Platform is designed to provide real-time metrics and logs for IT infrastructure components, such as network devices, servers, and IoT devices. This platform operates on a single virtual machine and combines monitoring, logging, and device interaction capabilities within a unified system.

The system is hosted on VM1 (10.2.13.12) and includes the following components:

## Monitoring Core:

1. Prometheus: Collects and stores metrics from network devices and services using SNMP Exporter and Blackbox Exporter.
2. SNMP Exporter: Retrieves device metrics like bandwidth utilization and error rates.
3. Blackbox Exporter: Monitors the availability of devices and services through ICMP/TCP/UDP probes.
4. Logging System: Manages logs for troubleshooting and historical analysis.

## Database:

MongoDB: Stores user credentials and role-based access control data for secure authentication and authorization.

## Backend:

Built with Express.js, the backend provides REST APIs for authentication, role management, and integration with Prometheus and the logging system.

## Frontend:

1. Developed using React.js, the frontend offers a modern user interface for:
2. Viewing real-time metrics and historical logs.

## Key Features
1. Metrics Collection: Prometheus gathers metrics from network devices and services to provide insights into bandwidth usage, error rates, and device health.
2. Log Management: A centralized logging system aggregates and stores logs, making it easier to troubleshoot issues.
3. Role-Based Access Control: Users are authenticated and authorized based on roles stored in MongoDB.
4. Unified Hosting: All services are hosted on a single virtual machine (10.2.13.12) for simplicity and efficiency.

# API Endpoints

## Authentication:

1. POST /api/login: Authenticate users and issue JWT tokens.
2. GET /api/users: Retrieve a list of users (Admin only).
3. POST /api/users: Add a new user (Admin only).

## Metrics and Logs:

1. GET /api/metrics/:deviceId: Fetch metrics for a device from Prometheus.
GET /api/logs/:deviceId: Fetch logs for a device from the logging system.
