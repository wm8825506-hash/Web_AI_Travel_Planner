# Iteration 2: Identifying Structures to Support Primary Functionality — View 2

**Extracted:** 2026-05-27T20:20:20.409948200

```mermaid
graph TD
    subgraph Core Application
        Auth[Authentication & Authorization Service]
        HotelCfg[Hotel Configuration Service]
        RateDef[Rate Definition Service]
        Pricing[Pricing Engine]
        PriceQry[Price Query Service]
        UserPerm[User Permission Manager]
        
        Auth -->|Validates & checks| HotelCfg
        Auth -->|Validates & checks| RateDef
        Auth -->|Validates & checks| Pricing
        Auth -->|Validates & checks| PriceQry
        Auth -->|Validates & checks| UserPerm
        
        Pricing -->|Reads rules from| RateDef
        Pricing -->|Reads config from| HotelCfg
        PriceQry -->|Reads published prices from| Pricing
    end

    APIGateway[API Gateway] -->|Calls via internal interfaces| Auth
    APIGateway -->|REST/gRPC Adapters| Core Application

    classDef service fill:#e6f3ff,stroke:#0066cc;
    class Auth,HotelCfg,RateDef,Pricing,PriceQry,UserPerm service;
```