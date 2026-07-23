const prisma = require("../utils/prisma");
const {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  convertBigIntToString,
} = require("../utils/helpers");
const wasabiService = require("./wasabiService");

// In-memory cache for captain location, order counts, and lock status
// Format: { "tenantId:captainId": { longitude, latitude, maxCurrentOrders, currentNumberOfOrders, isLocked } }
const captainLocationCache = new Map();

// Helper function to create cache key
const createCacheKey = (tenantId, captainId) => `${tenantId}:${captainId}`;

class CaptainService {
  // Helper function to add pre-signed URL to captain photo
  addPhotoUrl(captain) {
    if (captain.photo) {
      captain.photoUrl = wasabiService.generatePreSignedUrl(captain.photo);
    }
    return captain;
  }

  // Helper function to add pre-signed URLs to multiple captains
  addPhotoUrlsToArray(captains) {
    return captains.map((captain) => this.addPhotoUrl(captain));
  }

  // Captain registration
  async signup(captainData, photoFile, tenantId) {
    const {
      userName,
      email,
      phoneNumber,
      password,
      longitude,
      latitude,
      fcmToken,
      workingHoursStart,
      workingHoursEnd,
      nationalId,
    } = captainData;

    // Check if captain already exists within tenant
    const existingCaptain = await prisma.captain.findFirst({
      where: {
        tenantId,
        OR: [{ email }, { userName }, { phoneNumber }],
      },
    });

    if (existingCaptain) {
      throw new Error(
        "Captain with this email, username, or phone number already exists",
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Upload photo to Wasabi if provided
    let photoKey = null;
    if (photoFile && photoFile.buffer) {
      // Generate a temporary unique ID for the folder since we don't have captain ID yet
      const tempId = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      photoKey = await wasabiService.uploadCaptainPhoto(
        photoFile.buffer,
        tempId,
      );
    }

    // Create captain
    const captain = await prisma.captain.create({
      data: {
        tenantId,
        userName,
        email,
        phoneNumber,
        password: hashedPassword,
        longitude: longitude ? parseFloat(longitude) : null,
        latitude: latitude ? parseFloat(latitude) : null,
        fcmToken,
        workingHoursStart,
        workingHoursEnd,
        nationalId,
        photo: photoKey,
        isAvailable: true,
        isLocked: true, // Locked by default until admin approval
        ratingSum: 0,
        ratingCount: 0,
      },
      select: {
        id: true,
        userName: true,
        email: true,
        longitude: true,
        latitude: true,
        phoneNumber: true,
        isAvailable: true,
        isLocked: true,
        ratingSum: true,
        ratingCount: true,
        createdAt: true,
        updatedAt: true,
        nationalId: true,
        photo: true,
      },
    });

    // Generate tokens with tenant context
    const token = generateToken(captain.id, "captain", tenantId);
    const refreshToken = generateRefreshToken(captain.id, "captain", tenantId);

    // Store refresh token in database
    await prisma.captain.update({
      where: {
        id_tenantId: {
          id: captain.id,
          tenantId: tenantId,
        },
      },
      data: { refreshToken },
    });

    // Send notification to admin about new captain signup
    const notificationService = require("./notificationService");
    setImmediate(async () => {
      try {
        await notificationService.notifyAdminNewCaptainSignup(
          captain.id,
          userName,
          tenantId,
        );
      } catch (error) {
        console.error("Failed to send new captain signup notification:", error);
      }
    });

    const captainResponse = convertBigIntToString(captain);
    return {
      captain: this.addPhotoUrl(captainResponse),
      token,
      refreshToken,
    };
  }

  // Captain login
  async login(email, password, tenantId) {
    // Find captain by email within tenant
    const captain = await prisma.captain.findFirst({
      where: {
        email,
        tenantId,
      },
    });

    if (!captain) {
      throw new Error("Invalid credentials");
    }

    // Check password
    const isPasswordValid = await comparePassword(password, captain.password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // Generate tokens with tenant context
    const token = generateToken(captain.id, "captain", tenantId);
    const refreshToken = generateRefreshToken(captain.id, "captain", tenantId);

    // Store refresh token in database
    await prisma.captain.update({
      where: {
        id_tenantId: {
          id: captain.id,
          tenantId: tenantId,
        },
      },
      data: { refreshToken },
    });

    // Return captain data without password
    const captainData = {
      id: captain.id,
      userName: captain.userName,
      email: captain.email,
      longitude: captain.longitude,
      latitude: captain.latitude,
      phoneNumber: captain.phoneNumber,
      isAvailable: captain.isAvailable,
      isLocked: captain.isLocked,
      workingHoursStart: captain.workingHoursStart,
      workingHoursEnd: captain.workingHoursEnd,
      lastActivated: captain.lastActivated,
      rating:
        captain.ratingCount > 0 ? captain.ratingSum / captain.ratingCount : 5.0,
      ratingCount: captain.ratingCount,
      ratingSum: captain.ratingSum,
      nationalId: captain.nationalId,
      photo: captain.photo,
      createdAt: captain.createdAt,
      updatedAt: captain.updatedAt,
    };

    const captainResponse = convertBigIntToString(captainData);
    return {
      captain: this.addPhotoUrl(captainResponse),
      token,
      refreshToken,
    };
  }

  // Get captain profile
  async getProfile(captainId, tenantId) {
    const captain = await prisma.captain.findUnique({
      where: {
        id_tenantId: {
          id: BigInt(captainId),
          tenantId,
        },
      },
      select: {
        id: true,
        userName: true,
        email: true,
        longitude: true,
        latitude: true,
        phoneNumber: true,
        isAvailable: true,
        isLocked: true,
        workingHoursEnd: true,
        workingHoursStart: true,
        ratingSum: true,
        ratingCount: true,
        nationalId: true,
        photo: true,
        currentNumberOfOrders: true,
        maxCurrentOrders: true,
        earningSinceLastActivation: true,
        maxEarningsSinceLastActivation: true,
        lastActivated: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!captain) {
      throw new Error("Captain not found");
    }

    const captainConverted = convertBigIntToString(captain);
    if (captainConverted.photo) {
      captainConverted.photoUrl = wasabiService.generatePreSignedUrl(
        captainConverted.photo,
      );
    }
    return this.addPhotoUrl(captainConverted);
  }

  // Update captain profile
  async updateProfile(captainId, updateData, tenantId, photoFile) {
    const {
      userName,
      email,
      phoneNumber,
      longitude,
      latitude,
      fcmToken,
      workingHoursStart,
      workingHoursEnd,
    } = updateData;

    // Check if email or username is being changed and if it already exists within tenant
    if (email || userName || phoneNumber) {
      const existingCaptain = await prisma.captain.findFirst({
        where: {
          tenantId,
          OR: [
            ...(email ? [{ email }] : []),
            ...(userName ? [{ userName }] : []),
            ...(phoneNumber ? [{ phoneNumber }] : []),
          ],
          NOT: { id: BigInt(captainId) },
        },
      });

      if (existingCaptain) {
        throw new Error("Email, username, or phone number already exists");
      }
    }

    // Upload photo to Wasabi if provided
    let photoKey = undefined;
    if (photoFile && photoFile.buffer) {
      photoKey = await wasabiService.uploadCaptainPhoto(
        photoFile.buffer,
        captainId,
      );
    }

    // Update captain (verify tenant ownership)
    const updatedCaptain = await prisma.captain.update({
      where: {
        id_tenantId: {
          id: BigInt(captainId),
          tenantId,
        },
      },
      data: {
        ...(userName && { userName }),
        ...(email && { email }),
        ...(phoneNumber && { phoneNumber }),
        ...(longitude !== undefined && {
          longitude: longitude ? parseFloat(longitude) : null,
        }),
        ...(latitude !== undefined && {
          latitude: latitude ? parseFloat(latitude) : null,
        }),
        ...(fcmToken !== undefined && { fcmToken }),
        ...(workingHoursStart !== undefined && { workingHoursStart }),
        ...(workingHoursEnd !== undefined && { workingHoursEnd }),
        ...(photoKey && { photo: photoKey }),
      },
      select: {
        id: true,
        userName: true,
        email: true,
        longitude: true,
        latitude: true,
        phoneNumber: true,
        isAvailable: true,
        ratingSum: true,
        ratingCount: true,
        createdAt: true,
        updatedAt: true,
        photo: true,
      },
    });

    const captainConverted = convertBigIntToString(updatedCaptain);
    if (captainConverted.photo) {
      captainConverted.photoUrl = wasabiService.generatePreSignedUrl(
        captainConverted.photo,
      );
    }
    return captainConverted;
  }

  // Update captain availability status
  async updateStatus(captainId, isAvailable, tenantId) {
    const captain = await prisma.captain.findFirst({
      where: {
        id: BigInt(captainId),
        tenantId,
      },
    });

    if (!captain) {
      throw new Error("Captain not found");
    }

    const updatedCaptain = await prisma.captain.update({
      where: {
        id_tenantId: {
          id: BigInt(captainId),
          tenantId,
        },
      },
      data: { isAvailable },
    });

    return convertBigIntToString(updatedCaptain);
  }
  // Update FCM token
  async updateFCMToken(captainId, fcmToken, tenantId) {
    const updatedCaptain = await prisma.captain.update({
      where: {
        id_tenantId: {
          id: BigInt(captainId),
          tenantId,
        },
      },
      data: { fcmToken },
      select: {
        id: true,
        userName: true,
        fcmToken: true,
      },
    });

    return convertBigIntToString(updatedCaptain);
  }

  // Update working hours
  async updateWorkingHours(
    captainId,
    workingHoursStart,
    workingHoursEnd,
    tenantId,
  ) {
    const captain = await prisma.captain.findFirst({
      where: {
        id: BigInt(captainId),
        tenantId,
      },
    });

    if (!captain) {
      throw new Error("Captain not found");
    }

    const updatedCaptain = await prisma.captain.update({
      where: {
        id_tenantId: {
          id: BigInt(captainId),
          tenantId,
        },
      },
      data: {
        workingHoursStart,
        workingHoursEnd,
      },
      select: {
        id: true,
        userName: true,
        workingHoursStart: true,
        workingHoursEnd: true,
      },
    });

    return convertBigIntToString(updatedCaptain);
  }

  // This duplicate getProfile method has been removed - using the first one instead

  // Get captain status
  async getStatus(captainId, tenantId) {
    const captain = await prisma.captain.findFirst({
      where: {
        id_tenantId: {
          id: BigInt(captainId),
          tenantId,
        },
      },
      select: {
        id: true,
        isAvailable: true,
      },
    });

    if (!captain) {
      throw new Error("Captain not found");
    }

    // Check if captain has active delivery within tenant
    const activeOrder = await prisma.order.findFirst({
      where: {
        captainId: BigInt(captainId),
        tenantId,
        status: { in: ["ACCEPTED_BY_CAPTAIN", "DELIVERED"] },
      },
    });

    return convertBigIntToString({
      ...captain,
      isDelivering: !!activeOrder,
      activeOrderId: activeOrder ? activeOrder.id.toString() : null,
    });
  }

  // Get captain location
  async getLocation(captainId, tenantId) {
    const captain = await prisma.captain.findFirst({
      where: {
        id_tenantId: {
          id: BigInt(captainId),
          tenantId,
        },
      },
      select: {
        id: true,
        longitude: true,
        latitude: true,
        isAvailable: true,
        isLocked: true,
      },
    });

    if (!captain) {
      throw new Error("Captain not found");
    }

    return convertBigIntToString(captain);
  }

  // Get captain orders
  async getCaptainOrders(
    captainId,
    tenantId,
    page = 1,
    limit = 10,
    status = null,
  ) {
    const skip = (page - 1) * limit;

    const whereClause = {
      captainId: BigInt(captainId),
      tenantId,
    };
    if (status) {
      whereClause.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              userName: true,
              phoneNumber: true,
              address: true,
            },
          },
          vendor: {
            select: {
              id: true,
              vendorName: true,
              contactNumber: true,
              address: true,
              neighborhood: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          neighborhood: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.order.count({ where: whereClause }),
    ]);

    return {
      orders: convertBigIntToString(orders),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get available captains
  async getAvailableCaptains(tenantId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [captains, total] = await Promise.all([
      prisma.captain.findMany({
        where: {
          tenantId,
          isAvailable: true,
          isLocked: false,
        },
        select: {
          id: true,
          userName: true,
          longitude: true,
          latitude: true,
          phoneNumber: true,
          ratingSum: true,
          ratingCount: true,
        },
        orderBy: { ratingSum: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.captain.count({
        where: {
          tenantId,
          isAvailable: true,
          isLocked: false,
        },
      }),
    ]);

    // Calculate ratings for each captain
    const captainsWithRating = captains.map((captain) => ({
      ...captain,
      rating:
        captain.ratingCount > 0 ? captain.ratingSum / captain.ratingCount : 5.0,
    }));

    return {
      captains: convertBigIntToString(captainsWithRating),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get captain by ID (for internal use)
  async getCaptainById(captainId, tenantId) {
    const captain = await prisma.captain.findFirst({
      where: {
        id_tenantId: {
          id: BigInt(captainId),
          tenantId,
        },
      },
      select: {
        id: true,
        userName: true,
        email: true,
        longitude: true,
        latitude: true,
        phoneNumber: true,
        isAvailable: true,
        ratingSum: true,
        ratingCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!captain) {
      throw new Error("Captain not found");
    }

    return convertBigIntToString(captain);
  }

  // Update captain rating
  async updateRating(captainId, newRating, tenantId) {
    const captain = await prisma.captain.findFirst({
      where: {
        id: BigInt(captainId),
        tenantId,
      },
    });

    if (!captain) {
      throw new Error("Captain not found");
    }

    // Calculate new average rating
    const currentRating = captain.rating || 0;
    const totalOrders = await prisma.order.count({
      where: {
        captainId: BigInt(captainId),
        tenantId,
        status: "DELIVERED",
      },
    });

    const newAverageRating =
      totalOrders > 0
        ? (currentRating * (totalOrders - 1) + newRating) / totalOrders
        : newRating;

    const updatedCaptain = await prisma.captain.update({
      where: {
        id_tenantId: {
          id: BigInt(captainId),
          tenantId,
        },
      },
      data: { rating: newAverageRating },
    });

    return convertBigIntToString(updatedCaptain);
  }

  // Get captain statistics
  // Both totalOrders and totalEarnings are scoped to orders delivered since
  // the captain's last account settlement (lastActivated), so they reset to
  // zero whenever admin settles/reactivates the captain's account.
  async getCaptainStats(captainId, tenantId) {
    const captain = await prisma.captain.findFirst({
      where: { id: BigInt(captainId), tenantId },
      select: { lastActivated: true },
    });

    const deliveredSinceActivation = {
      captainId: BigInt(captainId),
      tenantId,
      status: "DELIVERED",
      ...(captain?.lastActivated && {
        deliveredAt: { gte: captain.lastActivated },
      }),
    };

    const [totalOrders, totalEarnings] = await Promise.all([
      prisma.order.count({ where: deliveredSinceActivation }),
      prisma.order.aggregate({
        where: deliveredSinceActivation,
        _sum: { deliveryPrice: true },
      }),
    ]);

    return {
      totalOrders,
      totalEarnings: totalEarnings._sum.deliveryPrice || 0,
    };
  }

  // Search captains by location (using coordinates)
  async searchCaptainsByLocation(
    longitude,
    latitude,
    tenantId,
    radiusKm = 10,
    page = 1,
    limit = 10,
  ) {
    const skip = (page - 1) * limit;

    // For now, we'll get all available captains and filter client-side
    // In production, you'd want to use PostGIS or similar for efficient geo queries
    const [captains, total] = await Promise.all([
      prisma.captain.findMany({
        where: {
          tenantId,
          isAvailable: true,
          isLocked: false,
          longitude: { not: null },
          latitude: { not: null },
        },
        select: {
          id: true,
          userName: true,
          longitude: true,
          latitude: true,
          phoneNumber: true,
          ratingSum: true,
          ratingCount: true,
        },
        orderBy: { ratingSum: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.captain.count({
        where: {
          tenantId,
          isAvailable: true,
          isLocked: false,
          longitude: { not: null },
          latitude: { not: null },
        },
      }),
    ]);

    // Calculate ratings for each captain
    const captainsWithRating = captains.map((captain) => ({
      ...captain,
      rating:
        captain.ratingCount > 0 ? captain.ratingSum / captain.ratingCount : 5.0,
    }));

    return {
      captains: convertBigIntToString(captainsWithRating),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Update captain location (in-memory cache only)
  async updateLocation(captainId, longitude, latitude, tenantId) {
    // const captain = await prisma.captain.findFirst({
    //   where: {
    //     id_tenantId: {
    //       id: BigInt(captainId),
    //       tenantId
    //     }
    //   },
    //   select: { id: true, isAvailable: true, isLocked: true }
    // });

    // if (!captain) {
    //   throw new Error('Captain not found');
    // }

    // if (captain.isLocked) {
    //   throw new Error('Captain account is locked');
    // }
    // Update cache
    const cacheKey = createCacheKey(tenantId, captainId);
    const currentCache = captainLocationCache.get(cacheKey) || {};
    captainLocationCache.set(cacheKey, {
      ...currentCache,
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude),
    });

    return {
      id: captainId,
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude),
      message: "Location updated successfully",
    };
  }

  // Update captain order counts in cache
  updateCaptainOrderCountsInCache(captainId, tenantId, updates) {
    const cacheKey = createCacheKey(tenantId, captainId);
    const currentCache = captainLocationCache.get(cacheKey) || {};

    const cacheUpdates = {};
    if (updates.maxCurrentOrders !== undefined) {
      cacheUpdates.maxCurrentOrders = updates.maxCurrentOrders;
    }
    if (updates.currentNumberOfOrders !== undefined) {
      cacheUpdates.currentNumberOfOrders = updates.currentNumberOfOrders;
    }

    captainLocationCache.set(cacheKey, {
      ...currentCache,
      ...cacheUpdates,
    });

    return captainLocationCache.get(cacheKey);
  }

  // Get cached captain data
  getCachedCaptainData(tenantId = null) {
    const result = {};
    for (const [cacheKey, data] of captainLocationCache.entries()) {
      const [keyTenantId, captainId] = cacheKey.split(":");
      if (!tenantId || keyTenantId === tenantId) {
        result[captainId] = data;
      }
    }
    return result;
  }

  // Get captain data from cache with DB fallback (for middleware)
  async getCaptainFromCache(captainId, tenantId) {
    const cacheKey = createCacheKey(tenantId, captainId);
    let cached = captainLocationCache.get(cacheKey);

    // If not in cache or missing critical data, fetch from DB
    if (!cached || cached.isLocked === undefined) {
      const captain = await prisma.captain.findFirst({
        where: {
          id: BigInt(captainId),
          tenantId,
        },
        select: {
          id: true,
          tenantId: true,
          userName: true,
          email: true,
          longitude: true,
          latitude: true,
          phoneNumber: true,
          maxCurrentOrders: true,
          currentNumberOfOrders: true,
          isLocked: true,
          ratingSum: true,
          ratingCount: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!captain) {
        return null;
      }

      // Update cache with fresh data
      captainLocationCache.set(cacheKey, {
        longitude: captain.longitude,
        latitude: captain.latitude,
        maxCurrentOrders: captain.maxCurrentOrders,
        currentNumberOfOrders: captain.currentNumberOfOrders,
        isLocked: captain.isLocked,
      });

      return convertBigIntToString(captain);
    }

    // Return from cache (we still need basic info from token)
    return {
      id: captainId,
      tenantId: tenantId,
      isLocked: cached.isLocked,
      maxCurrentOrders: cached.maxCurrentOrders,
      currentNumberOfOrders: cached.currentNumberOfOrders,
      longitude: cached.longitude,
      latitude: cached.latitude,
    };
  }

  // Update cache entry for lock status
  updateCaptainLockInCache(captainId, tenantId, isLocked) {
    const cacheKey = createCacheKey(tenantId, captainId);
    const currentCache = captainLocationCache.get(cacheKey) || {};
    captainLocationCache.set(cacheKey, {
      ...currentCache,
      isLocked,
    });
  }

  // Get captain location by ID (for user tracking)
  async getCaptainLocation(captainId, tenantId) {
    // First check cache
    const cacheKey = createCacheKey(tenantId, captainId);
    const cached = captainLocationCache.get(cacheKey);
    if (
      cached &&
      cached.longitude !== undefined &&
      cached.latitude !== undefined
    ) {
      return {
        id: captainId,
        longitude: cached.longitude,
        latitude: cached.latitude,
        maxCurrentOrders: cached.maxCurrentOrders,
        currentNumberOfOrders: cached.currentNumberOfOrders,
      };
    }

    const captain = await prisma.captain.findUnique({
      where: {
        id_tenantId: {
          id: BigInt(captainId),
          tenantId,
        },
      },
      select: {
        id: true,
        longitude: true,
        latitude: true,
        maxCurrentOrders: true,
        currentNumberOfOrders: true,
        isLocked: true,
      },
    });

    if (!captain) {
      throw new Error("Captain not found");
    }

    // if (captain.isLocked) {
    //   throw new Error('Captain information not available');
    // }

    return {
      id: captain.id.toString(),
      longitude: captain.longitude,
      latitude: captain.latitude,
      maxCurrentOrders: captain.maxCurrentOrders,
      currentNumberOfOrders: captain.currentNumberOfOrders,
      isLocked: captain.isLocked,
    };
  }

  // Initialize cache from database (call on server start)
  async initializeCache(tenantId) {
    const captains = await prisma.captain.findMany({
      where: {
        tenantId,
      },
      select: {
        id: true,
        longitude: true,
        latitude: true,
        maxCurrentOrders: true,
        currentNumberOfOrders: true,
        isLocked: true,
      },
    });

    captains.forEach((captain) => {
      if (captain.longitude !== null && captain.latitude !== null) {
        const cacheKey = createCacheKey(tenantId, captain.id.toString());
        captainLocationCache.set(cacheKey, {
          longitude: captain.longitude,
          latitude: captain.latitude,
          maxCurrentOrders: captain.maxCurrentOrders,
          currentNumberOfOrders: captain.currentNumberOfOrders,
          isLocked: captain.isLocked,
        });
      }
    });

    console.log(
      `Initialized captain cache with ${captainLocationCache.size} captains`,
    );
  }

  // Refresh token
  async refreshToken(refreshToken, tenantId) {
    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Check if captain exists and refresh token matches within tenant
      const captain = await prisma.captain.findFirst({
        where: {
          id: BigInt(decoded.id),
          tenantId,
          refreshToken: refreshToken,
        },
        select: {
          id: true,
          userName: true,
          email: true,
          longitude: true,
          latitude: true,
          phoneNumber: true,
          isAvailable: true,
          isLocked: true,
          workingHoursStart: true,
          workingHoursEnd: true,
          lastActivated: true,
          ratingSum: true,
          ratingCount: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!captain) {
        throw new Error("Invalid refresh token: no captain");
      }

      // Only issue a new access token. The refresh token is intentionally NOT
      // rotated: it stays valid for its full lifetime. Rotating it on every
      // refresh caused persistent "session expired" errors whenever the client
      // failed to persist the newly-issued token in time (e.g. the app was
      // killed mid-refresh, a secure-storage write failed, or two refreshes
      // raced), because the stored token would then no longer match the DB.
      const newToken = generateToken(captain.id, "captain", tenantId);

      // Return captain data without password
      const captainData = {
        ...captain,
        rating:
          captain.ratingCount > 0
            ? captain.ratingSum / captain.ratingCount
            : 5.0,
      };

      return {
        captain: convertBigIntToString(captainData),
        token: newToken,
        refreshToken: refreshToken,
      };
    } catch (error) {
      console.log(error);
      throw new Error("Invalid refresh token");
    }
  }
  // Delete captain account
  async deleteAccount(captainId, tenantId) {
    const captain = await prisma.captain.findFirst({
      where: { id: BigInt(captainId), tenantId },
    });

    if (!captain) {
      throw new Error("Captain not found");
    }

    // put the any table that has foreign key to captain to  set null
    // Example:
    await prisma.order.updateMany({
      where: { captainId: BigInt(captainId) },
      data: { captainId: null },
    });

    await prisma.captain.delete({
      where: { id_tenantId: { id: BigInt(captainId), tenantId } },
    });

    return { message: "Account deleted successfully" };
  }
}

module.exports = new CaptainService();
