# Microservices Architecture - Real Estate Investment Platform

## Architecture Overview

This document provides detailed architectural diagrams and service definitions for Framework Real Estate Solutions' AI-powered real estate investment platform. The architecture is designed to support automated property analysis, WhatsApp-based interactions, and affordable housing operations at scale.

## System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web App<br/>Next.js]
        MOBILE[Mobile Apps<br/>React Native]
        ADMIN[Admin Dashboard<br/>React]
    end

    subgraph "API Gateway Layer"
        GATEWAY[API Gateway<br/>Kong/AWS]
        AUTH[Auth Service<br/>JWT/OAuth2]
    end

    subgraph "Core Services"
        PROP[Property Service]
        DEAL[Deal Service]
        FIN[Financial Service]
        CONST[Construction Service]
        USER[User Service]
        DOC[Document Service]
    end

    subgraph "AI Services"
        VOICE[Voice Agent Service]
        VAL[Valuation AI Service]
        NLP[NLP Service]
        ANALYTICS[Analytics Service]
        CV[Computer Vision Service]
        WHATSAPP[WhatsApp Assistant]
        MARKET[Market Monitor Service]
    end

    subgraph "Integration Services"
        MLS[MLS Integration]
        PAY[Payment Service]
        EMAIL[Email/SMS Service]
        STORAGE[Storage Service]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL<br/>Primary DB)]
        MONGO[(MongoDB<br/>Documents)]
        REDIS[(Redis<br/>Cache)]
        ELASTIC[(Elasticsearch)]
        S3[S3/MinIO<br/>Object Storage]
    end

    subgraph "Message Layer"
        KAFKA[Apache Kafka]
        RABBIT[RabbitMQ]
    end

    WEB --> GATEWAY
    MOBILE --> GATEWAY
    ADMIN --> GATEWAY
    
    GATEWAY --> AUTH
    AUTH --> USER
    
    GATEWAY --> PROP
    GATEWAY --> DEAL
    GATEWAY --> FIN
    GATEWAY --> CONST
    GATEWAY --> DOC
    
    PROP --> PG
    PROP --> REDIS
    PROP --> ELASTIC
    
    DEAL --> PG
    DEAL --> KAFKA
    
    FIN --> PG
    FIN --> PAY
    
    CONST --> PG
    CONST --> MONGO
    CONST --> S3
    
    DOC --> MONGO
    DOC --> S3
    
    VOICE --> RABBIT
    VAL --> ANALYTICS
    
    KAFKA --> ANALYTICS
    ANALYTICS --> ELASTIC
```

## Service Communication Patterns

### Synchronous Communication
- REST APIs for client-service communication
- gRPC for inter-service communication
- GraphQL for complex data queries

### Asynchronous Communication
- Event-driven architecture using Kafka
- Task queues with RabbitMQ
- WebSockets for real-time updates

## Service Definitions

### 1. Property Service
```yaml
service: property-service
port: 3001
dependencies:
  - postgresql
  - redis
  - elasticsearch
endpoints:
  - GET /properties
  - GET /properties/:id
  - POST /properties
  - PUT /properties/:id
  - DELETE /properties/:id
  - POST /properties/search
  - GET /properties/:id/comps
  - GET /properties/:id/valuation
events:
  publishes:
    - property.created
    - property.updated
    - property.deleted
  subscribes:
    - valuation.completed
    - market.data.updated
```

### 2. Deal Service
```yaml
service: deal-service
port: 3002
dependencies:
  - postgresql
  - kafka
endpoints:
  - GET /deals
  - GET /deals/:id
  - POST /deals
  - PUT /deals/:id
  - POST /deals/:id/offers
  - PUT /deals/:id/status
  - GET /deals/:id/timeline
events:
  publishes:
    - deal.created
    - deal.status.changed
    - offer.received
  subscribes:
    - property.created
    - document.generated
    - payment.completed
```

### 3. Financial Service
```yaml
service: financial-service
port: 3003
dependencies:
  - postgresql
  - redis
endpoints:
  - GET /transactions
  - POST /transactions
  - GET /reports/pnl
  - GET /reports/cashflow
  - POST /budgets
  - GET /projections/:dealId
  - POST /expenses
events:
  publishes:
    - transaction.created
    - budget.exceeded
    - payment.processed
  subscribes:
    - deal.created
    - construction.expense.added
```

### 4. Construction Service
```yaml
service: construction-service
port: 3004
dependencies:
  - postgresql
  - mongodb
  - s3
endpoints:
  - GET /projects
  - POST /projects
  - GET /contractors
  - POST /contractors
  - POST /projects/:id/bids
  - POST /projects/:id/tasks
  - POST /projects/:id/photos
  - GET /projects/:id/progress
events:
  publishes:
    - project.created
    - bid.received
    - task.completed
    - milestone.reached
  subscribes:
    - deal.created
    - contractor.responded
    - inspection.completed
```

### 5. Voice Agent Service
```yaml
service: voice-agent-service
port: 3005
dependencies:
  - redis
  - rabbitmq
  - twilio
  - openai
endpoints:
  - POST /calls/initiate
  - GET /calls/:id/transcript
  - POST /calls/schedule
  - GET /agents/availability
events:
  publishes:
    - call.completed
    - appointment.scheduled
    - action.items.created
  subscribes:
    - contractor.call.requested
    - lead.qualification.needed
```

### 6. Valuation AI Service
```yaml
service: valuation-ai-service
port: 3006
dependencies:
  - postgresql
  - tensorflow
  - redis
endpoints:
  - POST /valuations/calculate
  - GET /valuations/:propertyId
  - POST /valuations/arv
  - GET /market/analysis
  - POST /comparables/analyze
  - POST /valuations/component-costs
events:
  publishes:
    - valuation.completed
    - market.insight.generated
  subscribes:
    - property.created
    - market.data.updated
    - walkthrough.completed
```

### 7. Computer Vision Service
```yaml
service: computer-vision-service
port: 3007
dependencies:
  - tensorflow
  - redis
  - s3
endpoints:
  - POST /analyze/property-photos
  - POST /analyze/component-condition
  - GET /analysis/:propertyId
  - POST /compare/before-after
events:
  publishes:
    - photo.analysis.completed
    - condition.assessed
  subscribes:
    - property.photos.uploaded
    - analysis.requested
```

### 8. WhatsApp Assistant Service
```yaml
service: whatsapp-assistant-service
port: 3008
dependencies:
  - twilio
  - redis
  - rabbitmq
endpoints:
  - POST /webhook/whatsapp
  - GET /conversations/:phoneNumber
  - POST /reports/generate
  - GET /reports/:reportId
events:
  publishes:
    - analysis.requested
    - report.generated
    - conversation.completed
  subscribes:
    - analysis.completed
    - report.ready
```

### 9. Market Monitor Service
```yaml
service: market-monitor-service
port: 3009
dependencies:
  - postgresql
  - redis
  - elasticsearch
endpoints:
  - POST /monitor/start
  - GET /monitor/status
  - GET /opportunities/latest
  - POST /alerts/configure
  - GET /market/trends
events:
  publishes:
    - listing.found
    - opportunity.identified
    - market.update
  subscribes:
    - monitor.configured
    - analysis.completed
```

### 10. Audio Processing Service
```yaml
service: audio-processing-service
port: 3010
dependencies:
  - redis
  - s3
  - openai
endpoints:
  - POST /transcribe/walkthrough
  - GET /transcripts/:id
  - POST /extract/conditions
  - POST /parse/components
events:
  publishes:
    - transcription.completed
    - conditions.extracted
  subscribes:
    - audio.uploaded
    - walkthrough.started
```

## Database Schema per Service

### Property Service Schema
```sql
-- Property Service Tables
CREATE SCHEMA property_service;

CREATE TABLE property_service.properties (
    id UUID PRIMARY KEY,
    mls_number VARCHAR(50) UNIQUE,
    address JSONB NOT NULL,
    property_type VARCHAR(50),
    status VARCHAR(50),
    list_price DECIMAL(12,2),
    square_feet INTEGER,
    bedrooms INTEGER,
    bathrooms DECIMAL(3,1),
    year_built INTEGER,
    lot_size DECIMAL(10,2),
    location GEOGRAPHY(POINT),
    features JSONB,
    section8_approved BOOLEAN DEFAULT FALSE,
    target_rent DECIMAL(10,2),
    fmr_compliant BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE property_service.property_images (
    id UUID PRIMARY KEY,
    property_id UUID REFERENCES property_service.properties(id),
    url VARCHAR(500),
    type VARCHAR(50),
    caption TEXT,
    order_index INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE property_service.market_data (
    id UUID PRIMARY KEY,
    property_id UUID REFERENCES property_service.properties(id),
    data_type VARCHAR(50),
    value JSONB,
    source VARCHAR(100),
    recorded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Section 8 FMR Reference Table
CREATE TABLE property_service.section8_fmr (
    id UUID PRIMARY KEY,
    year INTEGER,
    bedrooms INTEGER,
    fmr_amount DECIMAL(10,2),
    payment_standard DECIMAL(10,2),
    utility_allowance DECIMAL(10,2),
    effective_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert current Detroit FMR values
INSERT INTO property_service.section8_fmr (year, bedrooms, fmr_amount, payment_standard) VALUES
(2024, 0, 715, 715),
(2024, 1, 858, 858),
(2024, 2, 1024, 1024),
(2024, 3, 1329, 1329),
(2024, 4, 1628, 1628);
```

### Deal Service Schema
```sql
-- Deal Service Tables
CREATE SCHEMA deal_service;

CREATE TABLE deal_service.deals (
    id UUID PRIMARY KEY,
    property_id UUID NOT NULL,
    deal_type VARCHAR(50),
    status VARCHAR(50),
    purchase_price DECIMAL(12,2),
    estimated_repairs DECIMAL(12,2),
    expected_profit DECIMAL(12,2),
    strategy VARCHAR(50),
    timeline JSONB,
    team JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE deal_service.offers (
    id UUID PRIMARY KEY,
    deal_id UUID REFERENCES deal_service.deals(id),
    offer_amount DECIMAL(12,2),
    terms JSONB,
    status VARCHAR(50),
    submitted_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE deal_service.deal_documents (
    id UUID PRIMARY KEY,
    deal_id UUID REFERENCES deal_service.deals(id),
    document_type VARCHAR(100),
    document_url VARCHAR(500),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Financial Service Schema
```sql
-- Financial Service Tables
CREATE SCHEMA financial_service;

CREATE TABLE financial_service.accounts (
    id UUID PRIMARY KEY,
    name VARCHAR(200),
    type VARCHAR(50),
    balance DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE financial_service.transactions (
    id UUID PRIMARY KEY,
    deal_id UUID,
    account_id UUID REFERENCES financial_service.accounts(id),
    type VARCHAR(50),
    category VARCHAR(100),
    amount DECIMAL(12,2),
    date DATE,
    description TEXT,
    receipt_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE financial_service.budgets (
    id UUID PRIMARY KEY,
    deal_id UUID,
    category VARCHAR(100),
    allocated_amount DECIMAL(12,2),
    spent_amount DECIMAL(12,2),
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### AI Services Schema
```sql
-- Computer Vision Service Schema
CREATE SCHEMA cv_service;

CREATE TABLE cv_service.property_analyses (
    id UUID PRIMARY KEY,
    property_id UUID NOT NULL,
    photo_url VARCHAR(500),
    component VARCHAR(100),
    condition VARCHAR(50), -- excellent, good, fair, poor
    confidence_score DECIMAL(3,2),
    issues_detected JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cv_service.component_conditions (
    id UUID PRIMARY KEY,
    property_id UUID NOT NULL,
    component_name VARCHAR(100),
    condition_score INTEGER, -- 0-100
    replacement_needed BOOLEAN,
    repair_priority VARCHAR(20), -- high, medium, low
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- WhatsApp Assistant Schema
CREATE SCHEMA whatsapp_service;

CREATE TABLE whatsapp_service.conversations (
    id UUID PRIMARY KEY,
    phone_number VARCHAR(20),
    property_address TEXT,
    analysis_id UUID,
    report_url VARCHAR(500),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE whatsapp_service.messages (
    id UUID PRIMARY KEY,
    conversation_id UUID REFERENCES whatsapp_service.conversations(id),
    direction VARCHAR(10), -- inbound, outbound
    message_type VARCHAR(20), -- text, voice, image
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Market Monitor Schema
CREATE SCHEMA market_monitor;

CREATE TABLE market_monitor.tracked_listings (
    id UUID PRIMARY KEY,
    source VARCHAR(50), -- zillow, redfin, mls
    external_id VARCHAR(100),
    address JSONB,
    list_price DECIMAL(12,2),
    property_data JSONB,
    score DECIMAL(5,2),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE market_monitor.opportunities (
    id UUID PRIMARY KEY,
    listing_id UUID REFERENCES market_monitor.tracked_listings(id),
    score DECIMAL(5,2),
    roi_estimate DECIMAL(5,2),
    rehab_estimate DECIMAL(12,2),
    strategy VARCHAR(50),
    alert_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audio Processing Schema
CREATE SCHEMA audio_service;

CREATE TABLE audio_service.walkthroughs (
    id UUID PRIMARY KEY,
    property_id UUID NOT NULL,
    audio_url VARCHAR(500),
    transcript TEXT,
    duration_seconds INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audio_service.extracted_conditions (
    id UUID PRIMARY KEY,
    walkthrough_id UUID REFERENCES audio_service.walkthroughs(id),
    component VARCHAR(100),
    condition VARCHAR(50),
    notes TEXT,
    confidence DECIMAL(3,2),
    timestamp_seconds INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Component Pricing Schema
CREATE SCHEMA pricing_service;

CREATE TABLE pricing_service.component_costs (
    id UUID PRIMARY KEY,
    component_name VARCHAR(100),
    unit VARCHAR(50), -- sqft, unit, linear ft
    material_cost DECIMAL(10,2),
    labor_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    vendor VARCHAR(200),
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pricing_service.cost_history (
    id UUID PRIMARY KEY,
    component_id UUID REFERENCES pricing_service.component_costs(id),
    old_cost DECIMAL(10,2),
    new_cost DECIMAL(10,2),
    reason TEXT,
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Service Deployment Configuration

### Kubernetes Deployment Example
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: property-service
  namespace: realestate-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: property-service
  template:
    metadata:
      labels:
        app: property-service
    spec:
      containers:
      - name: property-service
        image: realestate/property-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: redis-config
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: property-service
  namespace: realestate-platform
spec:
  selector:
    app: property-service
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: ClusterIP
```

## Service Mesh Configuration

### Istio Service Mesh
```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: property-service
  namespace: realestate-platform
spec:
  hosts:
  - property-service
  http:
  - match:
    - uri:
        prefix: /api/v1/properties
    route:
    - destination:
        host: property-service
        port:
          number: 80
      weight: 100
    timeout: 30s
    retries:
      attempts: 3
      perTryTimeout: 10s
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: property-service
  namespace: realestate-platform
spec:
  host: property-service
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        http2MaxRequests: 100
    loadBalancer:
      simple: ROUND_ROBIN
    outlierDetection:
      consecutiveErrors: 5
      interval: 30s
      baseEjectionTime: 30s
```

## Monitoring and Observability

### Prometheus Metrics
```yaml
# Service metrics to track
- http_requests_total
- http_request_duration_seconds
- database_query_duration_seconds
- cache_hit_ratio
- message_queue_depth
- error_rate
- business_metrics:
  - properties_created_total
  - deals_completed_total
  - revenue_processed_total
```

### Distributed Tracing
- Jaeger for request tracing
- Correlation IDs for request tracking
- Service dependency mapping
- Performance bottleneck identification

### Logging Strategy
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "service": "property-service",
  "level": "INFO",
  "correlation_id": "abc-123-def",
  "user_id": "user-456",
  "message": "Property created successfully",
  "metadata": {
    "property_id": "prop-789",
    "mls_number": "MLS123456",
    "duration_ms": 150
  }
}
```

## Security Architecture

### API Security
- OAuth 2.0 / JWT authentication
- API rate limiting
- Request validation
- CORS configuration
- TLS/SSL encryption

### Service-to-Service Security
- mTLS for internal communication
- Service mesh security policies
- Network segmentation
- Secret management with Vault

### Data Security
- Encryption at rest
- Encryption in transit
- PII data masking
- Audit logging
- RBAC implementation

## Scalability Patterns

### Horizontal Scaling
- Kubernetes HPA (Horizontal Pod Autoscaler)
- Load balancing strategies
- Database read replicas
- Caching layers

### Performance Optimization
- Connection pooling
- Query optimization
- Batch processing
- Async processing for heavy tasks

### Resilience Patterns
- Circuit breakers
- Retry mechanisms
- Bulkheads
- Timeout handling
- Graceful degradation

## Development Workflow

### CI/CD Pipeline
```yaml
stages:
  - build
  - test
  - security-scan
  - deploy-staging
  - integration-tests
  - deploy-production

build:
  script:
    - docker build -t $SERVICE_NAME:$CI_COMMIT_SHA .
    - docker push $SERVICE_NAME:$CI_COMMIT_SHA

test:
  script:
    - npm test
    - npm run test:integration

deploy:
  script:
    - kubectl set image deployment/$SERVICE_NAME $SERVICE_NAME=$SERVICE_NAME:$CI_COMMIT_SHA
    - kubectl rollout status deployment/$SERVICE_NAME
```

This microservices architecture provides:
- Scalability through independent service scaling
- Resilience through service isolation
- Flexibility for technology choices per service
- Easy maintenance and updates
- Clear service boundaries and responsibilities