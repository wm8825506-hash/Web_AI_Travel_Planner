# Iteration 2: Identifying Structures to Support Primary Functionality — View 3

**Extracted:** 2026-05-27T20:20:20.409948200

```mermaid
graph TD
    subgraph "Hotel Pricing System"
        subgraph "API Gateway"
            RESTAdapter[REST Adapter]
            gRPCAdapter[(gRPC Adapter\n- Future)]
        end

        subgraph "Core Application"
            Auth[Authentication & Authorization Service]
            HotelCfg[Hotel Configuration Service]
            RateDef[Rate Definition Service]
            Pricing[Pricing Engine]
            PriceQry[Price Query Service]
            UserPerm[User Permission Manager]
            
            Auth -->|Enforces access before| HotelCfg
            Auth -->|Enforces access before| RateDef
            Auth -->|Enforces access before| Pricing
            Auth -->|Enforces access before| PriceQry
            Auth -->|Enforces access before| UserPerm
            
            Pricing -->|Uses rules from| RateDef
            Pricing -->|Uses config from| HotelCfg
            PriceQry -.->|Reads from| PublishedPrices[(Published Prices\nRead-Optimized Store)]
            Pricing -->|Writes to| PublishedPrices
        end

        RESTAdapter -->|Calls via internal interfaces| Auth
        gRPCAdapter -->|Will call same interfaces| Auth
    end

    UserIdentityService[(User Identity Service)] -->|Validates credentials| Auth
    ChannelMgmt[(Channel Management System)] <-- Publishes prices -- Pricing

    classDef service fill:#e6f3ff,stroke:#0066cc;
    classDef adapter fill:#ffe6cc,stroke:#cc6600;
    classDef external fill:#f0f0f0,stroke:#666;
    
    class Auth,HotelCfg,RateDef,Pricing,PriceQry,UserPerm service;
    class RESTAdapter,gRPCAdapter adapter;
    class UserIdentityService,ChannelMgmt,PublishedPrices external;
```