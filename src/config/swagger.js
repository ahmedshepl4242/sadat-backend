const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SADAT Delivery API',
      version: '1.0.0',
      description: `A comprehensive multi-tenant delivery application API with multi-role authentication and order management.

**Multi-Tenancy Support:**
This API supports multiple tenants (organizations) on the same platform. Each tenant has isolated data and users.

**Required Headers:**
- \`X-Tenant-ID\`: Required for all API requests to identify the tenant
- \`Authorization\`: Required for authenticated endpoints (Bearer token)

**Available Tenants:**
- \`sadat\`: Sadat Delivery (default tenant)
- \`xyz-delivery\`: XYZ Delivery (example second tenant)

**Authentication Roles:**
- User: End customers who place orders
- Vendor: Restaurants/stores that fulfill orders  
- Captain: Delivery drivers who transport orders
- Admin/Tenant: Administrative users who manage the platform`,
      contact: {
        name: 'SADAT Delivery Team',
        email: 'support@sadat-delivery.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'http://localhost:3004',
        description: 'Development server'
      },
      {
        url: 'https://api.sadat-delivery.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication'
        },
        TenantHeader: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Tenant-ID',
          description: 'Tenant ID header required for all API requests. This identifies which tenant/organization the request belongs to.'
        }
      },
      parameters: {
        TenantId: {
          name: 'X-Tenant-ID',
          in: 'header',
          required: true,
          schema: {
            type: 'string',
            example: 'sadat'
          },
          description: 'Tenant identifier. Each tenant represents a separate organization using the delivery platform.'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'User ID' },
            userName: { type: 'string', description: 'Username' },
            email: { type: 'string', format: 'email', description: 'Email address' },
            address: { type: 'string', description: 'User address' },
            phoneNumber: { type: 'string', description: 'Phone number' },
            neighborhoodId: { type: 'string', description: 'Neighborhood ID' },
            createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
          }
        },
        Vendor: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Vendor ID' },
            vendorName: { type: 'string', description: 'Vendor name' },
            contactNumber: { type: 'string', description: 'Contact number' },
            address: { type: 'string', description: 'Vendor address' },
            longitude: { type: 'number', format: 'float', description: 'Longitude coordinate' },
            latitude: { type: 'number', format: 'float', description: 'Latitude coordinate' },
            description: { type: 'string', description: 'Vendor description' },
            isOpen: { type: 'string', enum: ['true', 'false'], description: 'Vendor status' },
            isLocked: { type: 'boolean', description: 'Locked status (admin controlled)' },
            image: { type: 'byte', format: 'binary', description: 'Vendor image (base64 encoded)' }
          }
        },
        Menu: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Menu item ID' },
            photo: { type: 'byte', format: 'binary', description: 'Menu item photo' },
            vendorId: { type: 'string', description: 'Vendor ID' }
          }
        },
        Captain: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Captain ID' },
            userName: { type: 'string', description: 'Username' },
            email: { type: 'string', format: 'email', description: 'Email address' },
            longitude: { type: 'number', format: 'float', description: 'Longitude coordinate' },
            latitude: { type: 'number', format: 'float', description: 'Latitude coordinate' },
            phoneNumber: { type: 'string', description: 'Phone number' },
            workingHoursStart: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$', description: 'Working hours start time (HH:MM)' },
            workingHoursEnd: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$', description: 'Working hours end time (HH:MM)' },
            isAvailable: { type: 'boolean', description: 'Availability status' },
            isLocked: { type: 'boolean', description: 'Locked status (admin controlled)' },
            lastActivated: { type: 'string', format: 'date-time', description: 'Last time admin activated this profile' },
            ratingSum: { type: 'number', format: 'float', description: 'Total rating sum' },
            ratingCount: { type: 'integer', description: 'Total rating count' },
            createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
          }
        },
        CaptainRequest: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Request ID' },
            captainId: { type: 'string', description: 'Captain ID' },
            description: { type: 'string', description: 'Request description' },
            status: { 
              type: 'string', 
              enum: ['PENDING', 'APPROVED', 'REJECTED'],
              description: 'Request status'
            },
            reply: { type: 'string', description: 'Admin reply to the request' },
            submittedAt: { type: 'string', format: 'date-time', description: 'Submission timestamp' },
            repliedAt: { type: 'string', format: 'date-time', description: 'Reply timestamp' },
            captain: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                userName: { type: 'string' },
                email: { type: 'string' },
                phoneNumber: { type: 'string' }
              }
            }
          }
        },
        Admin: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Admin ID' },
            userName: { type: 'string', description: 'Username' },
            email: { type: 'string', format: 'email', description: 'Email address' },
            phoneNumber: { type: 'string', description: 'Phone number' },
            address: { type: 'string', description: 'Admin address' },
            neighborhoodId: { type: 'string', description: 'Neighborhood ID' },
            createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' },
            neighborhood: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' }
              }
            }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Order ID' },
            userId: { type: 'string', description: 'User ID' },
            captainId: { type: 'string', description: 'Captain ID' },
            vendorId: { type: 'string', description: 'Vendor ID' },
            neighborhoodId: { type: 'string', description: 'Neighborhood ID' },
            status: { 
              type: 'string', 
              enum: ['PENDING', 'COUNTER_OFFER_SENT', 'COUNTER_OFFER_ACCEPTED', 'ACCEPTED_BY_CAPTAIN', 'DELIVERED', 'CANCELLED'],
              description: 'Order status'
            },
            description: { type: 'string', description: 'Order description' },
            additionalNotes: { type: 'string', description: 'Additional notes' },
            userAddress: { type: 'string', description: 'Delivery address' },
            userLongitude: { type: 'number', format: 'float', description: 'User longitude coordinate (optional)' },
            userLatitude: { type: 'number', format: 'float', description: 'User latitude coordinate (optional)' },
            phoneNumber: { type: 'string', description: 'Contact phone number' },
            price: { type: 'number', format: 'float', description: 'Order price' },
            deliveryPrice: { type: 'number', format: 'float', description: 'Delivery price from vendor-neighborhood pricing' },
            createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            counterOfferSentAt: { type: 'string', format: 'date-time', description: 'Counter offer sent timestamp' },
            acceptedByVend: { type: 'string', format: 'date-time', description: 'Vendor acceptance timestamp' },
            acceptedByCapta: { type: 'string', format: 'date-time', description: 'Captain acceptance timestamp' },
            deliveredAt: { type: 'string', format: 'date-time', description: 'Delivery timestamp' },
            finalizedAt: { type: 'string', format: 'date-time', description: 'User finalization timestamp' }
          }
        },
        Neighborhood: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Neighborhood ID' },
            name: { type: 'string', description: 'Neighborhood name' },
            createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
          }
        },
        VendorNeighborhoodPrice: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Pricing ID' },
            vendorId: { type: 'string', description: 'Vendor ID' },
            neighborhoodId: { type: 'string', description: 'Neighborhood ID' },
            price: { type: 'number', format: 'float', description: 'Delivery price' },
            createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
          }
        },
        Complain: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Complaint ID' },
            description: { type: 'string', description: 'Complaint description' },
            type: {
              type: 'string',
              enum: ['USER', 'VENDOR', 'CAPTAIN'],
              description: 'Source of complaint'
            },
            userId: { type: 'string', description: 'User ID who submitted the complaint' },
            submittedAt: { type: 'string', format: 'date-time', description: 'Submission timestamp' },
            reply: { type: 'string', description: 'Admin reply to the complaint', nullable: true },
            repliedAt: { type: 'string', format: 'date-time', description: 'Reply timestamp', nullable: true }
          }
        },
        VendorComplain: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Complaint ID' },
            description: { type: 'string', description: 'Complaint description' },
            type: {
              type: 'string',
              enum: ['USER', 'VENDOR', 'CAPTAIN'],
              description: 'Source of complaint'
            },
            vendorId: { type: 'string', description: 'Vendor ID who submitted the complaint' },
            submittedAt: { type: 'string', format: 'date-time', description: 'Submission timestamp' },
            reply: { type: 'string', description: 'Admin reply to the complaint', nullable: true },
            repliedAt: { type: 'string', format: 'date-time', description: 'Reply timestamp', nullable: true },
            vendor: {
              type: 'object',
              description: 'Vendor details',
              properties: {
                id: { type: 'string', description: 'Vendor ID' },
                vendorName: { type: 'string', description: 'Vendor name' },
                contactNumber: { type: 'string', description: 'Vendor contact number' }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', description: 'Error message' },
            timestamp: { type: 'string', format: 'date-time', description: 'Error timestamp' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object', description: 'Response data' },
            message: { type: 'string', description: 'Success message' },
            timestamp: { type: 'string', format: 'date-time', description: 'Response timestamp' }
          }
        }
      }
    },
    security: [
      {
        TenantHeader: []
      }
    ],
    tags: [
      { name: 'Authentication', description: 'User, Vendor, and Captain authentication endpoints' },
      { name: 'Users', description: 'User profile and order management' },
      { name: 'Vendors', description: 'Vendor profile and order management' },
      { name: 'Captains', description: 'Captain profile and order management' },
      { name: 'Orders', description: 'Order creation and management' },
      { name: 'Menus', description: 'Menu item management for vendors' },
      { name: 'Complains', description: 'Generic complaint management' },
      { name: 'Neighborhoods', description: 'Neighborhood management' },
      { name: 'Vendor Pricing', description: 'Dynamic pricing management for vendors' },
      { name: 'Captain Requests', description: 'Captain request management for admin purposes' },
      { name: 'Admin', description: 'Admin authentication and management operations' }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs; 