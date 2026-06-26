const prisma = require("../utils/prisma");
const {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  convertBigIntToString,
} = require("../utils/helpers");

class UserService {
  // User registration
  async signup(userData, tenantId) {
    const {
      userName,
      email,
      phoneNumber,
      password,
      address,
      neighborhoodId,
      fcmToken,
    } = userData;

    // Check if user already exists (within same tenant)
    const existingUser = await prisma.user.findFirst({
      where: {
        tenantId,
        OR: [{ email }, { userName }, { phoneNumber }],
      },
    });

    if (existingUser) {
      throw new Error(
        "User with this email, username, or phone number already exists",
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        tenantId,
        userName,
        email,
        phoneNumber,
        password: hashedPassword,
        address,
        neighborhoodId: neighborhoodId ? BigInt(neighborhoodId) : null,
        fcmToken,
      },
      select: {
        id: true,
        userName: true,
        email: true,
        address: true,
        neighborhoodId: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate tokens
    const token = generateToken(user.id, "user", tenantId);
    const refreshToken = generateRefreshToken(user.id, "user", tenantId);

    // Store refresh token in database
    await prisma.user.update({
      where: {
        id_tenantId: {
          id: user.id,
          tenantId: tenantId,
        },
      },
      data: { refreshToken },
    });

    return {
      user: convertBigIntToString(user),
      token,
      refreshToken,
    };
  }

  // User login
  async login(email, password, tenantId) {
    // Find user by email within the tenant
    const user = await prisma.user.findFirst({
      where: {
        email,
        tenantId,
      },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // Generate tokens with tenant context
    const token = generateToken(user.id, "user", tenantId);
    const refreshToken = generateRefreshToken(user.id, "user", tenantId);

    // Store refresh token in database
    await prisma.user.update({
      where: {
        id_tenantId: {
          id: user.id,
          tenantId: tenantId,
        },
      },
      data: { refreshToken },
    });

    // Return user data without password
    const userData = {
      id: user.id,
      userName: user.userName,
      email: user.email,
      address: user.address,
      phoneNumber: user.phoneNumber,
      neighborhoodId: user.neighborhoodId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      user: convertBigIntToString(userData),
      token,
      refreshToken,
    };
  }

  // Get user profile
  async getProfile(userId, tenantId) {
    const user = await prisma.user.findUnique({
      where: {
        id_tenantId: {
          id: BigInt(userId),
          tenantId,
        },
        neighborhood: {
          tenantId,
        },
      },
      select: {
        id: true,
        userName: true,
        email: true,
        address: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
        neighborhoodId: true,
        neighborhood: {
          select: {
            id: true,
            name: true,
          },
        },
        orders: {
          where: { tenantId },
          select: {
            id: true,
            status: true,
            description: true,
            userAddress: true,
            createdAt: true,
            vendor: {
              select: {
                id: true,
                vendorName: true,
                contactNumber: true,
              },
            },
            captain: {
              select: {
                id: true,
                userName: true,
                phoneNumber: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return convertBigIntToString(user);
  }

  // Update user profile
  async updateProfile(userId, updateData, tenantId) {
    const { userName, email, phoneNumber, address, neighborhoodId, fcmToken } =
      updateData;

    // Check if email or username is being changed and if it already exists within tenant
    if (email || userName || phoneNumber) {
      const existingUser = await prisma.user.findFirst({
        where: {
          tenantId,
          OR: [
            ...(email ? [{ email }] : []),
            ...(userName ? [{ userName }] : []),
            ...(phoneNumber ? [{ phoneNumber }] : []),
          ],
          NOT: { id: BigInt(userId), tenantId },
        },
      });

      if (existingUser) {
        throw new Error("Email, username, or phone number already exists");
      }
    }

    // Update user (verify tenant ownership)
    const updatedUser = await prisma.user.update({
      where: {
        id_tenantId: {
          id: BigInt(userId),
          tenantId,
        },
      },
      data: {
        ...(userName && { userName }),
        ...(email && { email }),
        ...(phoneNumber && { phoneNumber }),
        ...(address !== undefined && { address }),
        ...(neighborhoodId !== undefined && {
          neighborhoodId: neighborhoodId ? BigInt(neighborhoodId) : null,
        }),
        ...(fcmToken !== undefined && { fcmToken }),
      },
      select: {
        id: true,
        userName: true,
        email: true,
        address: true,
        neighborhoodId: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return convertBigIntToString(updatedUser);
  }

  // Update FCM token
  async updateFCMToken(userId, fcmToken, tenantId) {
    const updatedUser = await prisma.user.update({
      where: {
        id_tenantId: {
          id: BigInt(userId),
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

    return convertBigIntToString(updatedUser);
  }

  // Get user orders
  async getUserOrders(userId, tenantId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          userId: BigInt(userId),
          tenantId,
        },
        include: {
          vendor: {
            select: {
              id: true,
              vendorName: true,
              contactNumber: true,
              address: true,
            },
          },
          captain: {
            select: {
              id: true,
              userName: true,
              phoneNumber: true,
              longitude: true,
              latitude: true,
              ratingCount: true,
              ratingSum: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.order.count({
        where: {
          userId: BigInt(userId),
          tenantId,
        },
      }),
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

  // Get user by ID (for internal use)
  async getUserById(userId, tenantId) {
    const user = await prisma.user.findFirst({
      where: {
        id_tenantId: {
          id: BigInt(userId),
          tenantId,
        },
      },
      select: {
        id: true,
        userName: true,
        email: true,
        address: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return convertBigIntToString(user);
  }

  // Delete user account
  async deleteAccount(userId, tenantId) {
    const user = await prisma.user.findFirst({
      where: {
        id: BigInt(userId),
        tenantId,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Delete user (this will cascade to orders and complains)
    await prisma.user.delete({
      where: {
        id_tenantId: {
          id: BigInt(userId),
          tenantId,
        },
      },
    });

    return { message: "Account deleted successfully" };
  }

  // Get user statistics
  async getUserStats(userId, tenantId) {
    const [totalOrders, completedOrders, pendingOrders, totalComplains] =
      await Promise.all([
        prisma.order.count({
          where: {
            userId: BigInt(userId),
            tenantId,
          },
        }),
        prisma.order.count({
          where: {
            userId: BigInt(userId),
            tenantId,
            status: "DELIVERED",
          },
        }),
        prisma.order.count({
          where: {
            userId: BigInt(userId),
            tenantId,
            status: {
              in: [
                "PENDING",
                "COUNTER_OFFER_SENT",
                "COUNTER_OFFER_ACCEPTED",
                "ACCEPTED_BY_CAPTAIN",
              ],
            },
          },
        }),
        prisma.complain.count({
          where: {
            order: {
              userId: BigInt(userId),
              tenantId,
            },
            tenantId,
          },
        }),
      ]);

    return {
      totalOrders,
      completedOrders,
      pendingOrders,
      totalComplains,
      completionRate:
        totalOrders > 0
          ? ((completedOrders / totalOrders) * 100).toFixed(2)
          : 0,
    };
  }

  // Refresh token
  async refreshToken(refreshToken, tenantId) {
    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Check if user exists and refresh token matches within tenant
      const user = await prisma.user.findFirst({
        where: {
          id: BigInt(decoded.id),
          tenantId,
          refreshToken: refreshToken,
        },
        select: {
          id: true,
          userName: true,
          email: true,
          address: true,
          phoneNumber: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new Error("Invalid refresh token: no user");
      }

      // Generate new tokens with tenant context
      const newToken = generateToken(user.id, "user", tenantId);
      const newRefreshToken = generateRefreshToken(user.id, "user", tenantId);

      // Update refresh token in database
      await prisma.user.update({
        where: {
          id_tenantId: {
            id: user.id,
            tenantId: tenantId,
          },
        },
        data: { refreshToken: newRefreshToken },
      });

      return {
        user: convertBigIntToString(user),
        token: newToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      console.log(error);
      throw new Error("Invalid refresh token");
    }
  }
}

module.exports = new UserService();
