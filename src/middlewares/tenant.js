const prisma = require('../utils/prisma');



const extractTenant = async (req, res, next) => {
  try {
    // Extract tenant_id from X-Tenant-ID header
    const tenantId = req.headers['x-tenant-id'];

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required. Please provide X-Tenant-ID header.'
      });
    }

    // Validate that the tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, tenantName: true }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    // Add tenant information to request object
    req.tenant = {
      id: tenant.id,
      name: tenant.tenantName
    };

    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during tenant validation'
    });
  }
};

module.exports = { extractTenant };