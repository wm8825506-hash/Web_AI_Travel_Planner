# Iteration 1: Establishing an Overall System Structure — View 1

**Extracted:** 2026-05-27T20:20:20.405568400

```mermaid
graph TD
    subgraph Hotel Pricing System
        WF[Web Frontend]
        AG[API Gateway / BFF]
        PS[Pricing Service]
        HRMS[Hotel & Rate Management Service]
        UPS[User & Permission Service]
        KAFKA[(Kafka Event Streaming)]
    end

    UIS[User Identity Service] -->|AuthN/Z| UPS
    CMS[Channel Management System] <--|Price Updates| KAFKA

    WF -->|HTTP/REST| AG
    AG -->|Internal API| PS
    AG -->|Internal API| HRMS
    AG -->|Internal API| UPS
    PS -->|Publish Events| KAFKA
```