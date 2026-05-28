# Iteration 1: Establishing an Overall System Structure — View 2

**Extracted:** 2026-05-27T20:20:20.408151

```mermaid
flowchart TD
    subgraph External
        UIS[User Identity Service]
        CMS[Channel Management System]
    end

    subgraph Hotel Pricing System
        WF[Web Frontend\n(Angular SPA)]
        AG[API Gateway / BFF\n(REST)]
        PS[Pricing Service\n(Java)]
        HRMS[Hotel & Rate Mgmt Service\n(Java)]
        UPS[User & Permission Service\n(Java)]
        KAFKA[(Kafka:\nhotel-pricing.price-updates)]
    end

    WF -->|1. HTTPS/REST| AG
    AG -->|2a. Validate Token| UPS
    UPS -->|2b. OAuth2/User Profile| UIS
    AG -->|3a. Price Query/Simulate| PS
    AG -->|3b. Hotel/Rate Mgmt| HRMS
    PS -->|4. Publish Event| KAFKA
    KAFKA -->|5. Consume Event| CMS

    style WF fill:#e6f3ff,stroke:#0066cc
    style AG fill:#ffe6cc,stroke:#cc6600
    style PS fill:#e6ffe6,stroke:#009900
    style HRMS fill:#e6ffe6,stroke:#009900
    style UPS fill:#e6ffe6,stroke:#009900
    style KAFKA fill:#f9f,stroke:#939
```