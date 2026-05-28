# Iteration 1: Establishing an Overall System Structure — View 4

**Extracted:** 2026-05-27T20:20:20.408917800

```mermaid
C4Container
title Hotel Pricing System - Container Diagram

Person(user, "Hotel User")

System_Ext(uis, "User Identity Service")
System_Ext(cms, "Channel Management System")

Container(wf, "Web Frontend", "Angular SPA", "Renders UI; enforces client-side routing and role-based UI visibility")
Container(ag, "API Gateway / BFF", "Java-based gateway", "Authenticates requests, routes to services, aggregates responses")
Container(ps, "Pricing Service", "Java microservice", "Simulates and publishes prices; calculates derived rates")
Container(hrms, "Hotel & Rate Management Service", "Java microservice", "Manages hotels, room types, tax rates, and rate rules")
Container(ups, "User & Permission Service", "Java microservice", "Resolves hotel-level permissions from identity claims")
ContainerDb(kafka, "Kafka Event Streaming", "Event log", "Durable transport for price update events")

System_Boundary(hps, "Hotel Pricing System") {
    wf
    ag
    ps
    hrms
    ups
    kafka
}

Rel(user, wf, "Uses via browser", "HTTPS")
Rel(wf, ag, "Invokes API", "REST/HTTPS")
Rel(ag, ups, "Validates permissions", "Internal REST")
Rel(ups, uis, "Fetches user profile", "OAuth2")
Rel(ag, ps, "Queries/simulates prices", "Internal REST")
Rel(ag, hrms, "Manages hotels/rates", "Internal REST")
Rel(ps, kafka, "Publishes price updates", "Kafka producer")
Rel(kafka, cms, "Consumes price updates", "Kafka consumer")
```