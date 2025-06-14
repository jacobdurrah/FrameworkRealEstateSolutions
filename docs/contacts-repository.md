# Contacts Repository System

## Overview

The Contacts Repository is a comprehensive system for managing all company contacts including property owners, tenants, contractors, partners, and other stakeholders. It integrates with AI agents for automated communication and tracking.

## Contact Categories

### 1. Property Owners
- Sellers and potential sellers
- Landlords we work with
- Property management companies

### 2. Tenants
- Current tenants
- Prospective tenants
- Section 8 voucher holders
- Tenant applications

### 3. Contractors & Service Providers
- General contractors
- Plumbers
- Electricians
- HVAC technicians
- Painters
- Inspectors
- Property management services

### 4. Partners & Stakeholders
- Detroit Housing Coalition
- Section 8 administrators
- Real estate agents
- Investors
- Legal advisors
- Financial institutions

### 5. Government & Regulatory
- City officials
- Housing inspectors
- Section 8 offices
- Tax assessors

### 6. Internal Team
- Employees
- AI agents
- System administrators

## Database Schema

```sql
-- Main contacts table
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_type VARCHAR(50) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(200),
    email VARCHAR(255) UNIQUE,
    phone_primary VARCHAR(20),
    phone_secondary VARCHAR(20),
    whatsapp_number VARCHAR(20),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    tags TEXT[], -- Array of tags for categorization
    source VARCHAR(100), -- How they came to us
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, do_not_contact
    preferred_contact_method VARCHAR(50) DEFAULT 'phone', -- phone, email, whatsapp, text
    language_preference VARCHAR(20) DEFAULT 'en',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    last_contact_date TIMESTAMP,
    next_follow_up_date DATE,
    total_interactions INTEGER DEFAULT 0,
    ai_communication_consent BOOLEAN DEFAULT FALSE,
    section_8_approved BOOLEAN DEFAULT FALSE,
    credit_score_range VARCHAR(50),
    annual_income_range VARCHAR(50)
);

-- Contact interactions/communications log
CREATE TABLE contact_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES contacts(id),
    interaction_type VARCHAR(50), -- call, email, whatsapp, text, meeting, ai_call
    direction VARCHAR(10), -- inbound, outbound
    channel VARCHAR(50), -- phone, email, whatsapp, in_person, ai_agent
    subject VARCHAR(255),
    content TEXT,
    summary TEXT, -- AI-generated summary
    sentiment VARCHAR(20), -- positive, neutral, negative
    duration_seconds INTEGER, -- For calls
    recording_url TEXT, -- For recorded calls
    transcription TEXT, -- AI transcription
    ai_agent_id VARCHAR(100), -- Which AI agent handled this
    outcome VARCHAR(100),
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    properties_discussed UUID[], -- Array of property IDs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255)
);

-- Contact properties relationship (many-to-many)
CREATE TABLE contact_properties (
    contact_id UUID REFERENCES contacts(id),
    property_id UUID, -- References properties table
    relationship_type VARCHAR(50), -- owner, tenant, interested_buyer, interested_renter
    start_date DATE,
    end_date DATE,
    status VARCHAR(50),
    notes TEXT,
    PRIMARY KEY (contact_id, property_id, relationship_type)
);

-- Contact documents
CREATE TABLE contact_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES contacts(id),
    document_type VARCHAR(100), -- lease, application, id, proof_of_income, etc
    document_name VARCHAR(255),
    file_path TEXT,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by VARCHAR(255),
    expiration_date DATE,
    verified BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(255),
    verified_at TIMESTAMP
);

-- Contact preferences
CREATE TABLE contact_preferences (
    contact_id UUID PRIMARY KEY REFERENCES contacts(id),
    contact_time_preference VARCHAR(50), -- morning, afternoon, evening, anytime
    contact_days_preference VARCHAR(50)[], -- Array of days
    max_rent_budget DECIMAL(10,2),
    min_bedrooms INTEGER,
    max_bedrooms INTEGER,
    preferred_neighborhoods TEXT[],
    must_have_features TEXT[],
    pets BOOLEAN DEFAULT FALSE,
    pet_types VARCHAR(100),
    move_in_date DATE,
    household_size INTEGER,
    special_requirements TEXT
);

-- Contact consent tracking
CREATE TABLE contact_consent (
    contact_id UUID REFERENCES contacts(id),
    consent_type VARCHAR(100), -- marketing, ai_calls, text_messages, data_processing
    consent_given BOOLEAN DEFAULT FALSE,
    consent_date TIMESTAMP,
    consent_method VARCHAR(100), -- website, phone, in_person, email
    ip_address INET,
    revoked_date TIMESTAMP,
    PRIMARY KEY (contact_id, consent_type)
);

-- Indexes for performance
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_phone ON contacts(phone_primary);
CREATE INDEX idx_contacts_type ON contacts(contact_type);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_last_contact ON contacts(last_contact_date);
CREATE INDEX idx_interactions_contact ON contact_interactions(contact_id);
CREATE INDEX idx_interactions_created ON contact_interactions(created_at);
CREATE INDEX idx_interactions_ai_agent ON contact_interactions(ai_agent_id);
```

## API Endpoints

### Contact Management
- `GET /api/contacts` - List all contacts with filtering
- `GET /api/contacts/:id` - Get specific contact details
- `POST /api/contacts` - Create new contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Soft delete contact
- `GET /api/contacts/:id/interactions` - Get contact's interaction history
- `POST /api/contacts/:id/interactions` - Log new interaction
- `GET /api/contacts/:id/properties` - Get contact's property relationships
- `POST /api/contacts/:id/documents` - Upload document for contact

### Search & Analytics
- `GET /api/contacts/search` - Advanced search with filters
- `GET /api/contacts/duplicates` - Find potential duplicate contacts
- `GET /api/contacts/analytics` - Contact analytics and metrics
- `GET /api/contacts/engagement-score/:id` - Calculate contact engagement score

### AI Integration
- `POST /api/contacts/:id/ai-call` - Initiate AI phone call
- `GET /api/contacts/:id/ai-summary` - Get AI-generated contact summary
- `POST /api/contacts/bulk-ai-outreach` - Schedule bulk AI outreach
- `GET /api/contacts/ai-insights` - Get AI insights on contact base

## Integration with AI Agents

### AI Phone Agent Integration
```javascript
// Example AI phone call scheduling
{
  "contact_id": "uuid",
  "call_purpose": "follow_up_rental_inquiry",
  "script_template": "rental_follow_up_v1",
  "preferred_time": "2024-01-15T14:00:00Z",
  "max_duration_minutes": 10,
  "objectives": [
    "confirm_interest",
    "schedule_viewing",
    "collect_requirements"
  ],
  "fallback_to_human": true
}
```

### WhatsApp AI Assistant Integration
- Automatic contact creation from WhatsApp conversations
- Link WhatsApp threads to contact records
- Track all WhatsApp interactions in the interactions table

## Contact Lifecycle Management

### 1. Lead Stage
- Initial inquiry via website/WhatsApp
- Basic information collection
- Automated follow-up scheduling

### 2. Qualification Stage
- Income verification
- Section 8 status check
- Property preferences collection
- Credit check consent

### 3. Active Stage
- Property viewings scheduled
- Regular communication
- Document collection
- Application processing

### 4. Customer Stage
- Lease signed
- Move-in completed
- Ongoing tenant relationship
- Maintenance requests

### 5. Retention Stage
- Regular check-ins
- Lease renewals
- Referral requests
- Satisfaction surveys

## Privacy & Compliance

### Data Protection
- Encryption at rest for sensitive fields
- PII handling compliance
- Audit trail for all data access
- Right to deletion implementation

### Consent Management
- Explicit consent tracking
- Opt-out mechanisms
- Communication preferences
- TCPA compliance for calls/texts

## Company Contacts

### Framework Real Estate Solutions Team
```json
{
  "contact_type": "internal_team",
  "first_name": "Jacob",
  "last_name": "Durrah",
  "email": "jacob@frameworkrealestatesolutions.com",
  "role": "Founder/CEO",
  "permissions": "admin"
}
```

## Reporting & Analytics

### Key Metrics
- Contact acquisition rate
- Conversion rate by source
- Average response time
- AI interaction success rate
- Tenant retention rate
- Contact lifetime value

### Regular Reports
- Weekly new contacts summary
- Monthly conversion analytics
- Quarterly engagement review
- Annual contact database health check

## Implementation Notes

1. **Phase 1**: Basic contact management (Q1 2024)
2. **Phase 2**: AI phone integration (Q2 2024)
3. **Phase 3**: Advanced analytics (Q3 2024)
4. **Phase 4**: Full automation (Q4 2024)

## Security Considerations

- Role-based access control
- API rate limiting
- Data anonymization for analytics
- Regular security audits
- Backup and disaster recovery