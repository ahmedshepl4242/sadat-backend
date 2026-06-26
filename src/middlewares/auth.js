const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const captainService = require('../services/captainService');



const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token without querying the database
      req.user = {
        id: BigInt(decoded.id),
        role: decoded.role,
        tenantId: req.tenant?.id || decoded.tenantId
      };
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

const protectVendor = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const vendor = await prisma.vendor.findFirst({
        where: {
          id: BigInt(decoded.id),
          tenantId: req.tenant?.id || decoded.tenantId
        },
        select: {
          id: true,
          tenantId: true,
          vendorName: true,
          password: true,
          contactNumber: true,
          address: true,
          description: true,
          isLocked: true,
          isOpen: true,
          image: true
        }
      });

      if (!vendor) {
        return res.status(401).json({
          success: false,
          error: 'Vendor not found'
        });
      }
      if (vendor.isLocked) {
        return res.status(401).json({
          success: false,
          error: 'Vendor is locked'
        });
      }
      req.vendor = vendor;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

const protectCaptain = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.role !== 'captain') {
        return res.status(401).json({
          success: false,
          error: 'Not authorized as a captain'
        });
      }

      // Get captain data from cache with DB fallback
      const captain = await captainService.getCaptainFromCache(
        decoded.id,
        req.tenant?.id || decoded.tenantId
      );

      if (!captain) {
        return res.status(401).json({
          success: false,
          error: 'Captain not found'
        });
      }

      if (captain.isLocked) {
        return res.status(401).json({
          success: false,
          error: 'Captain is locked'
        });
      }

      // Set captain data from token and cache
      req.captain = {
        id: BigInt(decoded.id),
        tenantId: req.tenant?.id || decoded.tenantId,
        role: decoded.role
      };

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

// Protect admin routes
const protectAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    if (!decoded.tenantId || !req.tenant || decoded.tenantId !== req.tenant.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Token tenant mismatch.'
      });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: decoded.tenantId || req.tenant?.id },
      select: {
        id: true,
        tenantName: true,
        email: true,
        phoneNumber: true,
        address: true
      }
    });

    if (!tenant) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Tenant not found.'
      });
    }

    req.admin = {
      id: tenant.id,
      tenantName: tenant.tenantName,
      email: tenant.email,
      phoneNumber: tenant.phoneNumber,
      address: tenant.address
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

module.exports = { protect, protectVendor, protectCaptain, protectAdmin }; 