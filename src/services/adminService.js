const prisma = require('../utils/prisma');
const { hashPassword, comparePassword, generateToken, generateRefreshToken, verifyRefreshToken, convertBigIntToString } = require('../utils/helpers');
const wasabiService = require('./wasabiService');
const notificationService = require('./notificationService');
const captainService = require('./captainService');
const ordersService = require('./orderService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


class AdminService {
  // Helper function to add pre-signed URLs to vendor objects
  addVendorImageUrls(vendor) {
    if (vendor.image) {
      vendor.imageUrl = wasabiService.generatePreSignedUrl(vendor.image);
    }
    return vendor;
  }

  // Helper function to add pre-signed URLs to multiple vendors
  addVendorImageUrlsToArray(vendors) {
    return vendors.map(vendor => this.addVendorImageUrls(vendor));
  }

  // Admin registration (3-in-1: creates tenant, neighborhood, and system vendor)
  async signup(adminData) {
    const { userName, email, phoneNumber, password, address, tenantId, fcmToken, neighborhood_name } = adminData;

    // Check if tenant already exists
    const existingAdmin = await prisma.tenant.findUnique({
      where: {
        id: tenantId
      }
    });

    if (existingAdmin) {
      throw new Error('Tenant already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Start transaction for 3-in-1 creation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create admin (tenant)
      const admin = await tx.tenant.create({
        data: {
          id: tenantId,
          tenantName: userName,
          email,
          phoneNumber,
          password: hashedPassword,
          address,
          fcmToken
        },
        select: {
          id: true,
          tenantName: true,
          email: true,
          phoneNumber: true,
          address: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // 2. Create neighborhood
      const neighborhood = await tx.neighborhood.create({
        data: {
          name: neighborhood_name || 'Default Neighborhood',
          tenantId: tenantId
        },
        select: {
          id: true,
          name: true,
          tenantId: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // 3. Create system vendor with ID -1 but with same data as admin:

      const systemVendorData = {
        id: BigInt(-1),
        tenantId: tenantId,
        vendorName: admin.tenantName,
        contactNumber: admin.phoneNumber,
        password: hashedPassword,
        address: admin.address,
        longitude: 0.1,
        latitude: 0.1,
        description: 'System vendor for order processing',
        isOpen: "true",
        isLocked: false,
        image: null,
        fcmToken: 'system_vendor_fcm_token',
        refreshToken: null,
        neighborhoodId: neighborhood.id
      };

      const systemVendor = await tx.vendor.create({
        data: systemVendorData,
        select: {
          id: true,
          tenantId: true,
          vendorName: true,
          contactNumber: true,
          address: true,
          longitude: true,
          latitude: true,
          description: true,
          isOpen: true,
          isLocked: true,
          neighborhoodId: true
        }
      });

      // Generate tokens for admin
      const token = generateToken(-1, 'admin', admin.id);
      const refreshToken = generateRefreshToken(-1, 'admin', admin.id);

      // Store refresh token in admin database
      await tx.tenant.update({
        where: {
          id: admin.id
        },
        data: { refreshToken }
      });

      return {
        admin: convertBigIntToString(admin),
        neighborhood: convertBigIntToString(neighborhood),
        systemVendor: {
          ...convertBigIntToString(systemVendor),
        },
        token,
        refreshToken
      };
    });

    return result;
  }

  // Admin login
  async login(email, password, tenantId) {
    const admin = await prisma.tenant.findUnique({
      where: {
        id: tenantId
      }
    });

    if (!admin || admin.email !== email) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await comparePassword(password, admin.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens with tenant context
    const token = generateToken(-1, 'admin', tenantId);
    const refreshToken = generateRefreshToken(-1, 'admin', tenantId);



    // Decode the token to check expiration
    const decoded = jwt.decode(token); // does not verify signature
    if (decoded && decoded.exp) {
      // exp is in seconds since epoch → convert to Date
      const expirationDate = new Date(decoded.exp * 1000);
      console.log("Token expires at:", expirationDate.toISOString());
    } else {
      console.log("No expiration found in token.");
    }



    // Store refresh token in database
    await prisma.tenant.update({
      where: {
        id: admin.id
      },
      data: { refreshToken }
    });

    const adminData = {
      id: admin.id,
      tenantName: admin.tenantName,
      email: admin.email,
      phoneNumber: admin.phoneNumber,
      address: admin.address,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt
    };

    return {
      admin: convertBigIntToString(adminData),
      token,
      refreshToken
    };
  }

  // Update admin profile
  async updateProfile(adminId, updateData, tenantId) {
    const { userName, email, phoneNumber, address, fcmToken } = updateData;

    // Check if email, tenantName, or phone number is being changed and if it already exists
    if (email || userName || phoneNumber) {
      const conflictingTenant = await prisma.tenant.findFirst({
        where: {
          NOT: { id: tenantId },
          OR: [
            ...(email ? [{ email }] : []),
            ...(userName ? [{ tenantName: userName }] : []),
            ...(phoneNumber ? [{ phoneNumber }] : [])
          ]
        }
      });

      if (conflictingTenant) {
        throw new Error('Email, tenant name, or phone number already exists');
      }
    }

    const updatedAdmin = await prisma.tenant.update({
      where: {
        id: tenantId
      },
      data: {
        ...(userName && { tenantName: userName }),
        ...(email && { email }),
        ...(phoneNumber && { phoneNumber }),
        ...(address !== undefined && { address }),
        ...(fcmToken !== undefined && { fcmToken })
      },
      select: {
        id: true,
        tenantName: true,
        email: true,
        phoneNumber: true,
        address: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return convertBigIntToString(updatedAdmin);
  }

  // Get admin profile
  async getProfile(tenantId) {
    const admin = await prisma.tenant.findUnique({
      where: {
        id: tenantId
      },
      select: {
        id: true,
        tenantName: true,
        email: true,
        phoneNumber: true,
        address: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!admin) {
      throw new Error('Admin not found');
    }

    return convertBigIntToString(admin);
  }

  // Update FCM token
  async updateFCMToken(adminId, fcmToken, tenantId) {
    const updatedAdmin = await prisma.tenant.update({
      where: {
        id: tenantId
      },
      data: { fcmToken },
      select: {
        id: true,
        tenantName: true,
        fcmToken: true
      }
    });

    return convertBigIntToString(updatedAdmin);
  }

  // Lock/Unlock Captain (with write-through cache)
  async updateCaptainLockStatus(captainId, isLocked, tenantId) {
    const captain = await prisma.captain.findFirst({
      where: {
        id: BigInt(captainId),
        tenantId
      }
    });

    if (!captain) {
      throw new Error('Captain not found');
    }

    // Update database first
    const updatedCaptain = await prisma.captain.update({
      where: {
        id_tenantId: {
          id: BigInt(captainId),
          tenantId
        }
      },
      data: { isLocked },
      select: {
        id: true,
        userName: true,
        email: true,
        phoneNumber: true,
        isLocked: true,
        isAvailable: true,
        ratingCount: true,
        ratingSum: true
      }
    });

    // Write-through: Update cache immediately
    captainService.updateCaptainLockInCache(captainId, tenantId, isLocked);

    return convertBigIntToString(updatedCaptain);
  }

  // Lock/Unlock Vendor
  async updateVendorLockStatus(vendorId, isLocked, tenantId) {
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: BigInt(vendorId),
        tenantId
      }
    });

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const updatedVendor = await prisma.vendor.update({
      where: {
        id_tenantId: {
          id: BigInt(vendorId),
          tenantId
        }
      },
      data: { isLocked },
      select: {
        id: true,
        vendorName: true,
        contactNumber: true,
        description: true,
        address: true,
        isOpen: true,
        isLocked: true,
        image: true,
        longitude: true,
        latitude: true,
        neighborhood: {
          select: {
            id: true,
            name: true
          }
        }
      },
    });
    const updatedVendorWithImages = convertBigIntToString(updatedVendor);
    return this.addVendorImageUrls(updatedVendorWithImages);
  }

  // Get all captains for admin management (no pagination, sorted by rating)
  async getAllCaptains(tenantId, isLocked = null, search = null) {
    const whereClause = {
      tenantId,
      ...(isLocked !== null ? { isLocked } : {}),
      ...(search ? {
        OR: [
          { userName: { contains: search, mode: 'insensitive' } },
          { phoneNumber: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ]
      } : {}),
    };

    const captains = await prisma.captain.findMany({
      where: whereClause,
      select: {
        id: true,
        userName: true,
        email: true,
        phoneNumber: true,
        longitude: true,
        latitude: true,
        workingHoursStart: true,
        workingHoursEnd: true,
        isAvailable: true,
        isLocked: true,
        lastActivated: true,
        ratingSum: true,
        ratingCount: true,
        nationalId: true,
        photo: true,
        currentNumberOfOrders: true,
        maxCurrentOrders: true,
        maxEarningsSinceLastActivation: true,
        earningSinceLastActivation: true,
        createdAt: true
      }
    });

    // Calculate ratings and sort by rating
    const captainsWithRating = captains
      .map(captain => ({
        ...captain,
        rating: captain.ratingCount > 0 ? captain.ratingSum / captain.ratingCount : 5.0
      }))
      .sort((a, b) => b.rating - a.rating);

    const captainsConverted = convertBigIntToString(captainsWithRating);
    const captainsWithPhotoUrls = captainsConverted.map(captain => {
      if (captain.photo) {
        captain.photoUrl = wasabiService.generatePreSignedUrl(captain.photo);
      }
      return captain;
    });

    return {
      captains: captainsWithPhotoUrls,
      total: captains.length
    };
  }

  // Get all vendors for admin management
  async getAllVendors(tenantId, page = 1, limit = 10, isLocked = null, category = null) {
    const skip = (page - 1) * limit;

    const whereClause = { tenantId };
    if (isLocked !== null) {
      whereClause.isLocked = isLocked;
    }

    // Filter by category if provided
    if (category) {
      whereClause.vendorCategories = {
        some: {
          categoryId: BigInt(category),
          tenantId
        }
      };
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where: whereClause,
        select: {
          id: true,
          vendorName: true,
          contactNumber: true,
          description: true,
          address: true,
          isOpen: true,
          isLocked: true,
          image: true,
          longitude: true,
          latitude: true,
          neighborhood: {
            select: {
              id: true,
              name: true
            }
          },
          vendorCategories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.vendor.count({ where: whereClause })
    ]);
    const vendorsWithImages = vendors.map(vendor => {
      const vendorResponse = convertBigIntToString(vendor);

      // Extract categories from vendorCategories
      if (vendorResponse.vendorCategories) {
        vendorResponse.categories = vendorResponse.vendorCategories.map(vc => vc.category);
        delete vendorResponse.vendorCategories;
      }

      return this.addVendorImageUrls(vendorResponse);
    });
    return {
      vendors: vendorsWithImages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Reply to captain request (admin function)
  async replyToCaptainRequest(requestId, status, reply, tenantId) {
    const request = await prisma.captainRequest.findFirst({
      where: {
        id: BigInt(requestId),
        tenantId
      }
    });

    if (!request) {
      throw new Error('Request not found');
    }

    if (request.status !== 'PENDING') {
      throw new Error('Request has already been processed');
    }

    const updatedRequest = await prisma.captainRequest.update({
      where: {
        id_tenantId: {
          id: BigInt(requestId),
          tenantId
        }
      },
      data: {
        ...request,
        status,
        reply,
        repliedAt: new Date()
      },
      include: {
        captain: {
          select: {
            id: true,
            userName: true,
            email: true,
            phoneNumber: true,
            ratingSum: true,
            ratingCount: true
          }
        }
      }
    });

    // Send notification to captain
    try {
      await notificationService.notifyCaptainRequestReply(request.captainId, requestId, status, tenantId);
    } catch (error) {
      console.error('Failed to send captain request reply notification:', error);
    }

    return convertBigIntToString(updatedRequest);
  }

  // Activate captain profile (update lastActivated)
  async activateCaptain(captainId, tenantId) {
    const captain = await prisma.captain.findFirst({
      where: {
        id: BigInt(captainId),
        tenantId
      }
    });

    if (!captain) {
      throw new Error('Captain not found');
    }

    const updatedCaptain = await prisma.captain.update({
      where: {
        id_tenantId: {
          id: BigInt(captainId),
          tenantId
        }
      },
      data: {
        lastActivated: new Date(),
        earningSinceLastActivation: 0,
        isLocked: false,
        isAvailable: true
      },
      select: {
        id: true,
        userName: true,
        email: true,
        phoneNumber: true,
        lastActivated: true,
        isLocked: true,
        isAvailable: true,
        ratingCount: true,
        ratingSum: true,
        earningSinceLastActivation: true
      }
    });

    // Write-through: Update cache immediately
    captainService.updateCaptainLockInCache(captainId, tenantId, false);

    return convertBigIntToString(updatedCaptain);
  }

  // Set captain max limits
  async setCaptainMaxLimits(captainId, maxNumberOfOrders, maxEarnings, tenantId) {
    const captain = await prisma.captain.findFirst({
      where: {
        id: BigInt(captainId),
        tenantId
      }
    });

    if (!captain) {
      throw new Error('Captain not found');
    }

    const updatedCaptain = await prisma.captain.update({
      where: {
        id_tenantId: {
          id: BigInt(captainId),
          tenantId
        }
      },
      data: {
        maxCurrentOrders: maxNumberOfOrders ? parseInt(maxNumberOfOrders) : undefined,
        maxEarningsSinceLastActivation: maxEarnings ? parseFloat(maxEarnings) : undefined
      },
      select: {
        id: true,
        userName: true,
        email: true,
        phoneNumber: true,
        ratingSum: true,
        ratingCount: true,
        maxCurrentOrders: true,
        currentNumberOfOrders: true,
        maxEarningsSinceLastActivation: true,
        earningSinceLastActivation: true,
        isAvailable: true,
        isLocked: true
      }
    });

    // Update cache with new max limits
    if (maxNumberOfOrders) {
      const captainService = require('./captainService');
      captainService.updateCaptainOrderCountsInCache(
        captainId.toString(),
        tenantId,
        { maxCurrentOrders: parseInt(maxNumberOfOrders) }
      );
    }

    return convertBigIntToString(updatedCaptain);
  }

  // Get all users for admin management
  async getAllUsers(tenantId, page = 1, limit = 10, search = null) {
    const skip = (page - 1) * limit;
    const where = {
      tenantId,
      ...(search ? {
        OR: [
          { userName: { contains: search, mode: 'insensitive' } },
          { phoneNumber: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ]
      } : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          userName: true,
          email: true,
          phoneNumber: true,
          address: true,
          createdAt: true,
          neighborhood: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.user.count({ where })
    ]);

    return {
      users: convertBigIntToString(users),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Update captain working hours (admin only)
  async updateCaptainWorkingHours(captainId, workingHoursStart, workingHoursEnd, tenantId) {
    const captain = await prisma.captain.findFirst({
      where: {
        id: BigInt(captainId),
        tenantId
      }
    });

    if (!captain) {
      throw new Error('Captain not found');
    }

    const updatedCaptain = await prisma.captain.update({
      where: {
        id_tenantId: {
          id: BigInt(captainId),
          tenantId
        }
      },
      data: {
        ...(workingHoursStart !== undefined && { workingHoursStart }),
        ...(workingHoursEnd !== undefined && { workingHoursEnd })
      },
      select: {
        id: true,
        userName: true,
        workingHoursStart: true,
        workingHoursEnd: true,
        phoneNumber: true,
        ratingCount: true,
        ratingSum: true
      }
    });

    return convertBigIntToString(updatedCaptain);
  }

  // Get orders by captain
  async getOrdersByCaptain(captainId, tenantId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          captainId: BigInt(captainId),
          tenantId
        },
        include: {
          user: {
            select: { id: true, userName: true, phoneNumber: true }
          },
          vendor: {
            select: {
              id: true,
              vendorName: true,
              contactNumber: true,
              address: true
            }
          },
          attachments: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.order.count({ where: { captainId: BigInt(captainId), tenantId } })
    ]);

    // Convert BigInt to string and add signed URLs for attachments
    const ordersWithUrls = ordersService.addAttachmentUrlsToArray(convertBigIntToString(orders));

    return {
      orders: ordersWithUrls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get orders by user
  async getOrdersByUser(userId, tenantId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          userId: BigInt(userId),
          tenantId
        },
        include: {
          captain: {
            select: {
              id: true,
              userName: true,
              phoneNumber: true,
              ratingCount: true,
              ratingSum: true
            }
          },
          vendor: {
            select: {
              id: true,
              vendorName: true,
              contactNumber: true,
              address: true
            }
          },
          attachments: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.order.count({ where: { userId: BigInt(userId), tenantId } })
    ]);

    // Convert BigInt to string and add signed URLs for attachments
    const ordersWithUrls = ordersService.addAttachmentUrlsToArray(convertBigIntToString(orders));

    return {
      orders: ordersWithUrls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get orders by vendor
  async getOrdersByVendor(vendorId, tenantId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          vendorId: BigInt(vendorId),
          tenantId
        },
        include: {
          user: {
            select: {
              id: true,
              userName: true,
              phoneNumber: true
            }
          },
          captain: {
            select: {
              id: true,
              userName: true,
              phoneNumber: true,
              ratingCount: true,
              ratingSum: true
            }
          },
          attachments: true 
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.order.count({ where: { vendorId: BigInt(vendorId), tenantId } })
    ]);

    // Convert BigInt to string and add signed URLs for attachments
    const ordersWithUrls = ordersService.addAttachmentUrlsToArray(convertBigIntToString(orders));

    return {
      orders: ordersWithUrls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get captain statistics
  async getCaptainStatistics(captainId, tenantId, startDate, endDate) {
    const whereClause = {
      captainId: BigInt(captainId),
      tenantId,
      status: 'DELIVERED'
    };

    if (startDate && endDate) {
      whereClause.deliveredAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [orderCount, totalEarnings] = await Promise.all([
      prisma.order.count({ where: whereClause }),
      prisma.order.aggregate({
        where: whereClause,
        _sum: { deliveryPrice: true }
      })
    ]);

    return {
      captainId,
      orderCount,
      totalEarnings: totalEarnings._sum.deliveryPrice || 0,
      period: { startDate, endDate }
    };
  }

  // Get user statistics
  async getUserStatistics(userId, tenantId, startDate, endDate) {
    const whereClause = {
      userId: BigInt(userId),
      tenantId,
      status: 'DELIVERED'
    };

    if (startDate && endDate) {
      whereClause.deliveredAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [orderCount, totalSpent] = await Promise.all([
      prisma.order.count({ where: whereClause }),
      prisma.order.aggregate({
        where: whereClause,
        _sum: { deliveryPrice: true }
      })
    ]);

    return {
      userId,
      orderCount,
      totalSpent: totalSpent._sum.deliveryPrice || 0,
      period: { startDate, endDate }
    };
  }

  // Get vendor statistics
  async getVendorStatistics(vendorId, tenantId, startDate, endDate) {
    const whereClause = {
      vendorId: BigInt(vendorId),
      tenantId,
      status: 'DELIVERED'
    };

    if (startDate && endDate) {
      whereClause.deliveredAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [orderCount, totalEarnings] = await Promise.all([
      prisma.order.count({ where: whereClause }),
      prisma.order.aggregate({
        where: whereClause,
        _sum: { deliveryPrice: true }
      })
    ]);

    return {
      vendorId,
      orderCount,
      totalEarnings: totalEarnings._sum.deliveryPrice || 0,
      period: { startDate, endDate }
    };
  }

  // Get all captains statistics overview
  async getAllCaptainsStatistics(tenantId, startDate, endDate) {
    const captains = await prisma.captain.findMany({
      where: { tenantId },
      select: {
        id: true,
        userName: true
      }
    });

    const whereClause = {
      tenantId,
      status: 'DELIVERED'
    };

    // Add date range filter if provided
    if (startDate && endDate) {
      whereClause.deliveredAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const captainsStats = await Promise.all(
      captains.map(async (captain) => {
        const captainWhereClause = {
          ...whereClause,
          captainId: captain.id
        };

        const [orderCount, totalEarnings] = await Promise.all([
          prisma.order.count({ where: captainWhereClause }),
          prisma.order.aggregate({
            where: captainWhereClause,
            _sum: { deliveryPrice: true }
          })
        ]);

        return {
          captainId: captain.id.toString(),
          userName: captain.userName,
          totalOrders: orderCount,
          totalEarnings: totalEarnings._sum.deliveryPrice || 0
        };
      })
    );

    const totalOrdersSum = captainsStats.reduce((sum, captain) => sum + captain.totalOrders, 0);
    const totalEarningsSum = captainsStats.reduce((sum, captain) => sum + captain.totalEarnings, 0);
    const activeCaptains = captainsStats.filter(captain => captain.totalOrders > 0);
    const avgOrdersPerCaptain = activeCaptains.length > 0 ? totalOrdersSum / activeCaptains.length : 0;
    const avgEarningsPerCaptain = activeCaptains.length > 0 ? totalEarningsSum / activeCaptains.length : 0;

    return {
      captainsStats,
      summary: {
        totalOrdersSum,
        totalEarningsSum,
        avgOrdersPerCaptain: parseFloat(avgOrdersPerCaptain.toFixed(2)),
        avgEarningsPerCaptain: parseFloat(avgEarningsPerCaptain.toFixed(2))
      },
      period: { startDate, endDate }
    };
  }

  // Bulk set vendor neighborhood pricing
  async bulkSetVendorNeighborhoodPricing(vendorId, neighborhoodPrices, tenantId) {
    // Verify vendor exists within tenant
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: BigInt(vendorId),
        tenantId
      }
    });

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // Delete existing pricing for the vendor within tenant
    await prisma.vendorNeighborhoodPrice.deleteMany({
      where: {
        vendorId: BigInt(vendorId),
        tenantId
      }
    });

    // Create new pricing entries
    const pricingData = neighborhoodPrices.map(item => ({
      vendorId: BigInt(vendorId),
      neighborhoodId: BigInt(item.neighborhoodId),
      price: parseFloat(item.price),
      tenantId
    }));

    await prisma.vendorNeighborhoodPrice.createMany({
      data: pricingData
    });

    // Fetch updated pricing to return
    const updatedPricing = await prisma.vendorNeighborhoodPrice.findMany({
      where: {
        vendorId: BigInt(vendorId),
        tenantId
      },
      include: {
        neighborhood: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return convertBigIntToString(updatedPricing);
  }

  // Admin counter offer (similar to vendor counter offer but with delivery price setting)
  async adminCounterOffer(orderId, counterOfferData, tenantId) {
    const { description, additionalNotes, price, deliveryPrice } = counterOfferData;

    // Verify order exists and is in PENDING status within tenant
    const order = await prisma.order.findFirst({
      where: {
        id: BigInt(orderId),
        tenantId,
        status: 'PENDING'
      }
    });

    if (!order) {
      throw new Error('Order not found or cannot be modified');
    }

    // Update order with counter offer and set delivery price
    const updatedOrder = await prisma.order.update({
      where: {
        id_tenantId: {
          id: BigInt(orderId),
          tenantId
        }
      },
      data: {
        description,
        additionalNotes,
        price: parseFloat(price),
        deliveryPrice: deliveryPrice ? parseFloat(deliveryPrice) : null,
        status: 'COUNTER_OFFER_SENT',
        counterOfferSentAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            phoneNumber: true
          }
        },
        vendor: {
          select: {
            id: true,
            vendorName: true,
            contactNumber: true,
            address: true
          }
        }
      }
    });

    // Send notification to user about counter offer
    try {
      if (updatedOrder.userId) {
        await notificationService.notifyCounterOffer(updatedOrder.userId, orderId, price, updatedOrder.deliveryPrice, tenantId);
      }
    } catch (error) {
      console.error('Failed to send counter offer notification:', error);
    }

    return convertBigIntToString(updatedOrder);
  }

  // Get all user complaints with pagination
  async getAllUserComplaints(tenantId, page = 1, limit = 10, type = null) {
    const skip = (page - 1) * limit;

    const whereClause = { tenantId };
    if (type) {
      whereClause.type = type;
    }

    const [complaints, total] = await Promise.all([
      prisma.complain.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              userName: true,
              email: true,
              phoneNumber: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.complain.count({ where: whereClause })
    ]);

    return {
      complaints: convertBigIntToString(complaints),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Admin reply to user complaint
  async replyToUserComplaint(complainId, reply, tenantId) {
    const complain = await prisma.complain.findUnique({
      where: {
        id_tenantId: {
          id: BigInt(complainId),
          tenantId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true
          }
        }
      }
    });

    if (!complain) {
      throw new Error('Complaint not found');
    }

    const updatedComplain = await prisma.complain.update({
      where: {
        id_tenantId: {
          id: BigInt(complainId),
          tenantId
        }
      },
      data: {
        reply,
        repliedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            email: true,
            phoneNumber: true
          }
        }
      }
    });

    // Send notification to user
    try {
      await notificationService.notifyUserComplaintReply(complain.userId, complainId, tenantId);
    } catch (error) {
      console.error('Failed to send complaint reply notification:', error);
    }

    return convertBigIntToString(updatedComplain);
  }

  // Get all vendor complaints with pagination
  async getAllVendorComplaints(tenantId, page = 1, limit = 10, type = null) {
    const skip = (page - 1) * limit;

    const whereClause = { tenantId };
    if (type) {
      whereClause.type = type;
    }

    const [complaints, total] = await Promise.all([
      prisma.vendorComplain.findMany({
        where: whereClause,
        include: {
          vendor: {
            select: {
              id: true,
              vendorName: true,
              contactNumber: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.vendorComplain.count({ where: whereClause })
    ]);

    return {
      complaints: convertBigIntToString(complaints),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Admin reply to vendor complaint
  async replyToVendorComplaint(complainId, reply, tenantId) {
    const complain = await prisma.vendorComplain.findUnique({
      where: {
        id_tenantId: {
          id: BigInt(complainId),
          tenantId
        }
      },
      include: {
        vendor: {
          select: {
            id: true,
            vendorName: true
          }
        }
      }
    });

    if (!complain) {
      throw new Error('Complaint not found');
    }

    const updatedComplain = await prisma.vendorComplain.update({
      where: {
        id_tenantId: {
          id: BigInt(complainId),
          tenantId
        }
      },
      data: {
        reply,
        repliedAt: new Date()
      },
      include: {
        vendor: {
          select: {
            id: true,
            vendorName: true,
            contactNumber: true
          }
        }
      }
    });

    // Send notification to vendor
    try {
      await notificationService.notifyVendorComplaintReply(complain.vendorId, complainId, tenantId);
    } catch (error) {
      console.error('Failed to send complaint reply notification:', error);
    }

    return convertBigIntToString(updatedComplain);
  }

  // Search users by username
  async searchUsers(query, page = 1, limit = 10, tenantId) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          tenantId,
          userName: { contains: query, mode: 'insensitive' }
        },
        select: {
          id: true,
          userName: true,
          email: true,
          phoneNumber: true,
          address: true,
          createdAt: true,
          neighborhood: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { userName: 'asc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.user.count({
        where: {
          tenantId,
          userName: { contains: query, mode: 'insensitive' }
        }
      })
    ]);

    return {
      users: convertBigIntToString(users),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Search captains by username
  async searchCaptains(query, page = 1, limit = 10, tenantId) {
    const skip = (page - 1) * limit;

    const [captains, total] = await Promise.all([
      prisma.captain.findMany({
        where: {
          tenantId,
          userName: { contains: query, mode: 'insensitive' }
        },
        select: {
          id: true,
          userName: true,
          email: true,
          phoneNumber: true,
          longitude: true,
          latitude: true,
          workingHoursStart: true,
          workingHoursEnd: true,
          isAvailable: true,
          isLocked: true,
          lastActivated: true,
          ratingSum: true,
          ratingCount: true,
          createdAt: true
        },
        orderBy: { userName: 'asc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.captain.count({
        where: {
          tenantId,
          userName: { contains: query, mode: 'insensitive' }
        }
      })
    ]);

    // Calculate rating for each captain
    const captainsWithRating = captains.map(captain => ({
      ...captain,
      rating: captain.ratingCount > 0 ? captain.ratingSum / captain.ratingCount : 5.0
    }));

    return {
      captains: convertBigIntToString(captainsWithRating),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Refresh token
  async refreshToken(refreshToken, tenantId) {
    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Check if admin exists and refresh token matches
      const admin = await prisma.tenant.findUnique({
        where: {
          id: tenantId
        },
        select: {
          id: true,
          tenantName: true,
          email: true,
          phoneNumber: true,
          address: true,
          refreshToken: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!admin || admin.refreshToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens with tenant context
      const newToken = generateToken(-1, 'admin', tenantId);
      const newRefreshToken = generateRefreshToken(-1, 'admin', tenantId);

      // Update refresh token in database
      await prisma.tenant.update({
        where: {
          id: admin.id
        },
        data: { refreshToken: newRefreshToken }
      });

      return {
        admin: convertBigIntToString(admin),
        token: newToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      console.log('another error occured');
      console.log(error);
      throw new Error('Invalid refresh token');
    }
  }

  async deleteUser(id, tenantId) {
    const user = await prisma.user.findFirst({ where: { id: BigInt(id), tenantId } });
    if (!user) throw new Error('User not found');
    await prisma.user.delete({ where: { id_tenantId: { id: BigInt(id), tenantId } } });
  }

  async deleteCaptain(id, tenantId) {
    const captain = await prisma.captain.findFirst({ where: { id: BigInt(id), tenantId } });
    if (!captain) throw new Error('Captain not found');
    await prisma.captain.delete({ where: { id_tenantId: { id: BigInt(id), tenantId } } });
  }

  async deleteVendor(id, tenantId) {
    const vendor = await prisma.vendor.findFirst({ where: { id: BigInt(id), tenantId } });
    if (!vendor) throw new Error('Vendor not found');
    await prisma.vendor.delete({ where: { id_tenantId: { id: BigInt(id), tenantId } } });
  }
}

module.exports = new AdminService();