const prisma = require('../utils/prisma');
const { hashPassword, comparePassword, generateToken, generateRefreshToken, verifyRefreshToken, convertBigIntToString } = require('../utils/helpers');
const wasabiService = require('./wasabiService');



class VendorService {
  // Helper function to add pre-signed URLs to vendor objects
  addImageUrls(vendor) {
    if (vendor.image) {
      vendor.imageUrl = wasabiService.generatePreSignedUrl(vendor.image);
    }
    return vendor;
  }

  // Helper function to add pre-signed URLs to multiple vendors
  addImageUrlsToArray(vendors) {
    return vendors.map(vendor => this.addImageUrls(vendor));
  }
  // Vendor registration
  async signup(vendorData, imageFile, tenantId) {
    const { vendorName, contactNumber, password, address, longitude, latitude, description, neighborhoodId, fcmToken, categories } = vendorData;

    if (!imageFile || !imageFile.buffer) {
      throw new Error('Vendor image is required');
    }

    // Check if vendor already exists within tenant
    const existingVendor = await prisma.vendor.findFirst({
      where: {
        tenantId,
        OR: [
          { vendorName },
          { contactNumber }
        ]
      }
    });

    if (existingVendor) {
      throw new Error('Vendor with this name or contact number already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Upload image to Wasabi (temp ID since vendor doesn't exist yet)
    const tempId = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const imageKey = await wasabiService.uploadVendorProfileImage(imageFile.buffer, tempId);

    // categories may arrive as an array (JSON) or a comma-separated string (multipart form)
    const categoriesList = Array.isArray(categories)
      ? categories
      : (categories ? categories.split(',').map(s => s.trim()).filter(Boolean) : []);

    // Create vendor with categories
    const vendor = await prisma.vendor.create({
      data: {
        tenantId,
        vendorName,
        contactNumber,
        password: hashedPassword,
        address,
        longitude: longitude ? parseFloat(longitude) : null,
        latitude: latitude ? parseFloat(latitude) : null,
        description,
        image: imageKey,
        neighborhoodId: neighborhoodId ? BigInt(neighborhoodId) : null,
        fcmToken,
        isOpen: 'true',
        isLocked: true, // Locked by default until admin approval
        vendorCategories: categoriesList.length > 0 ? {
          create: categoriesList.map(categoryId => ({
            categoryId: BigInt(categoryId)
          }))
        } : undefined,
      }
    });

    // Generate tokens with tenant context
    const token = generateToken(vendor.id, 'vendor', tenantId);
    const refreshToken = generateRefreshToken(vendor.id, 'vendor', tenantId);

    // Store refresh token in database
    await prisma.vendor.update({
      where: {
        id_tenantId: {
          id: vendor.id,       // use BigInt(…) if your schema defines BigInt
          tenantId: tenantId
        }
      },
      data: { refreshToken }
    });

    // Send notification to admin about new vendor signup
    const notificationService = require('./notificationService');
    setImmediate(async () => {
      try {
        await notificationService.notifyAdminNewVendorSignup(vendor.id, vendorName, tenantId);
      } catch (error) {
        console.error('Failed to send new vendor signup notification:', error);
      }
    });

    // Return vendor response with image URL
    const vendorResponse = convertBigIntToString(vendor);

    return {
      vendor: vendorResponse,
      token,
      refreshToken
    };
  }

  // Vendor login (using contact number as identifier)
  async login(contactNumber, password, tenantId) {
    // Find vendor by contact number within tenant
    const vendor = await prisma.vendor.findFirst({
      where: {
        contactNumber,
        tenantId
      }
    });

    if (!vendor) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, vendor.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens with tenant context
    const token = generateToken(vendor.id, 'vendor', tenantId);
    const refreshToken = generateRefreshToken(vendor.id, 'vendor', tenantId);

    // Store refresh token in database
    await prisma.vendor.update({
      where: {
        id_tenantId: {
          id: vendor.id,
          tenantId: tenantId
        }
      },
      data: { refreshToken }
    });

    const vendorResponse = convertBigIntToString(vendor);

    return {
      vendor: vendorResponse,
      token,
      refreshToken
    };
  }

  // // Get vendor profile
  // async getProfile(vendorId) {
  //   const vendor = await prisma.vendor.findUnique({
  //     where: { id: BigInt(vendorId) },
  //     include: {
  //       orders: {
  //         select: {
  //           id: true,
  //           status: true,
  //           description: true,
  //           userAddress: true,
  //           createdAt: true,
  //           user: {
  //             select: {
  //               id: true,
  //               userName: true,
  //               phoneNumber: true
  //             }
  //           },
  //           captain: {
  //             select: {
  //               id: true,
  //               userName: true,
  //               phoneNumber: true
  //             }
  //           }
  //         },
  //         orderBy: { createdAt: 'desc' },
  //         take: 10
  //       }
  //     }
  //   });

  //   if (!vendor) {
  //     throw new Error('Vendor not found');
  //   }

  //   return convertBigIntToString(vendor);
  // }

  // Update vendor profile
  async updateProfile(vendorId, updateData, image, tenantId) {
    const { vendorName, contactNumber, address, longitude, latitude, description, neighborhoodId, fcmToken, categories } = updateData;

    // Check if name or contact number is being changed and if it already exists within tenant
    if (vendorName || contactNumber) {
      const existingVendor = await prisma.vendor.findFirst({
        where: {
          tenantId,
          OR: [
            ...(vendorName ? [{ vendorName }] : []),
            ...(contactNumber ? [{ contactNumber }] : [])
          ],
          NOT: { id: BigInt(vendorId) }
        }
      });

      if (existingVendor) {
        throw new Error('Vendor name or contact number already exists');
      }
    }

    // Handle image upload to Wasabi if provided
    let imageUrl = undefined;
    if (image !== undefined) {
      if (image === null) {
        imageUrl = null;
      } else if (image?.buffer) {
        // Get current vendor to access old image URL if exists
        const currentVendor = await prisma.vendor.findFirst({
          where: {
            id: BigInt(vendorId),
            tenantId
          },
          select: { image: true }
        });

        // Delete old image from Wasabi if it exists
        if (currentVendor?.image) {
          try {
            const oldFileKey = wasabiService.extractFileKeyFromUrl(currentVendor.image);
            if (oldFileKey) {
              await wasabiService.deleteImage(oldFileKey);
            }
          } catch (deleteError) {
            console.error('Error deleting old image from Wasabi:', deleteError);
            // Continue with upload even if old image deletion fails
          }
        }

        // Upload to Wasabi and get URL
        imageUrl = await wasabiService.uploadVendorProfileImage(image.buffer, vendorId);
      }
    }
    const categoriesList = categories.split(',').map(s => s.trim());
    if (categoriesList.length === 1 && categoriesList[0] === '') {
      categoriesList.pop();
    }
    // Handle categories update if provided
    if (categoriesList !== undefined) {
      // Delete existing categories
      await prisma.vendorCategory.deleteMany({
        where: {
          vendorId: BigInt(vendorId),
          tenantId
        }
      });

      // Add new categories
      if (categoriesList && categoriesList.length > 0) {
        await prisma.vendorCategory.createMany({
          data: categoriesList.map(categoryId => ({
            tenantId,
            vendorId: BigInt(vendorId),
            categoryId: BigInt(categoryId)
          }))
        });
      }
    }

    // Update vendor (verify tenant ownership)
    const updatedVendor = await prisma.vendor.update({
      where: {
        id_tenantId: {
          id: BigInt(vendorId),
          tenantId: tenantId
        }
      },
      data: {
        ...(vendorName && { vendorName }),
        ...(contactNumber && { contactNumber }),
        ...(address !== undefined && { address }),
        ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
        ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
        ...(description !== undefined && { description }),
        ...(neighborhoodId !== undefined && { neighborhoodId: neighborhoodId ? BigInt(neighborhoodId) : null }),
        ...(fcmToken !== undefined && { fcmToken }),
        ...(imageUrl !== undefined && { image: imageUrl })
      }
    });

    // Return vendor response with pre-signed image URL
    const vendorResponse = convertBigIntToString(updatedVendor);
    return this.addImageUrls(vendorResponse);
  }

  // Update FCM token
  async updateFCMToken(vendorId, fcmToken, tenantId) {
    const updatedVendor = await prisma.vendor.update({
      where: {
        id_tenantId: {
          id: BigInt(vendorId),
          tenantId
        }
      },
      data: { fcmToken },
      select: {
        id: true,
        vendorName: true,
        fcmToken: true
      }
    });

    return convertBigIntToString(updatedVendor);
  }

  // Get vendor profile
  async getProfile(vendorId, tenantId) {
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: BigInt(vendorId),
        tenantId
      },
      select: {
        id: true,
        vendorName: true,
        contactNumber: true,
        address: true,
        longitude: true,
        latitude: true,
        description: true,
        neighborhoodId: true,
        isOpen: true,
        image: true,
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
      }
    });

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // Return vendor response with pre-signed image URL
    const vendorResponse = convertBigIntToString(vendor);

    // Extract categories from vendorCategories
    if (vendorResponse.vendorCategories) {
      vendorResponse.categories = vendorResponse.vendorCategories.map(vc => vc.category);
      delete vendorResponse.vendorCategories;
    }

    return this.addImageUrls(vendorResponse);
  }

  // Get vendor status
  async getStatus(vendorId, tenantId) {
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: BigInt(vendorId),
        tenantId
      },
      select: {
        id: true,
        isOpen: true
      }
    });

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    return convertBigIntToString(vendor);
  }

  // Update vendor status (open/closed)
  async updateStatus(vendorId, isOpen, tenantId) {
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
      data: { isOpen: isOpen.toString() }
    });

    const vendorResponse = convertBigIntToString(updatedVendor);
    return this.addImageUrls(vendorResponse);
  }

  // Get vendor orders
  async getVendorOrders(vendorId, tenantId, page = 1, limit = 10, status = null) {
    const skip = (page - 1) * limit;

    const whereClause = {
      vendorId: BigInt(vendorId),
      tenantId
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
              address: true
            }
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
              photo: true
            }
          },
          attachments: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.order.count({ where: whereClause })
    ]);

    // Add signed URLs to attachments
    const orderService = require('./orderService');
    const ordersWithUrls = orderService.addAttachmentUrlsToArray(convertBigIntToString(orders));
    const orderWithCaptainAndAttachments = orderService.addCaptainUrlsToArray(ordersWithUrls);

    return {
      orders: orderWithCaptainAndAttachments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get vendor by ID (for internal use)
  async getVendorById(vendorId, tenantId) {
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: BigInt(vendorId),
        tenantId
      },
      include: {
        menus: {
          where: { tenantId },
          select: {
            id: true,
            photo: true
          }
        }
      }
    });

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const vendorWithStringIds = convertBigIntToString(vendor);

    // Return menus with pre-signed photo URLs
    if (vendorWithStringIds.menus) {
      vendorWithStringIds.menus = vendorWithStringIds.menus.map(menu => {
        const convertedMenu = convertBigIntToString(menu);
        if (convertedMenu.photo) {
          convertedMenu.photoUrl = wasabiService.generatePreSignedUrl(convertedMenu.photo);
        }
        return convertedMenu;
      });
    }

    // Add pre-signed URL for vendor image
    return this.addImageUrls(vendorWithStringIds);
  }

  // Get all vendors (for users to browse)
  async getAllVendors(tenantId, page = 1, limit = 10, isOpen = null, category = null) {
    const skip = (page - 1) * limit;

    const whereClause = {
      tenantId,
      isLocked: false,
      id: {
        not: -1
      }
    }; // Only show non-locked vendors within tenant
    if (isOpen !== null) {
      whereClause.isOpen = isOpen.toString();
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
          address: true,
          longitude: true,
          latitude: true,
          description: true,
          isOpen: true,
          image: true,
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
        orderBy: { vendorName: 'asc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.vendor.count({ where: whereClause })
    ]);

    // Return vendors with pre-signed image URLs and categories
    const vendorsWithImages = vendors.map(vendor => {
      const vendorResponse = convertBigIntToString(vendor);

      // Extract categories from vendorCategories
      if (vendorResponse.vendorCategories) {
        vendorResponse.categories = vendorResponse.vendorCategories.map(vc => vc.category);
        delete vendorResponse.vendorCategories;
      }

      return this.addImageUrls(vendorResponse);
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

  // Get vendor statistics
  async getVendorStats(vendorId, tenantId) {
    const [totalOrders, completedOrders, pendingOrders, rejectedOrders] = await Promise.all([
      prisma.order.count({
        where: {
          vendorId: BigInt(vendorId),
          tenantId
        }
      }),
      prisma.order.count({
        where: {
          vendorId: BigInt(vendorId),
          tenantId,
          status: 'DELIVERED'
        }
      }),
      prisma.order.count({
        where: {
          vendorId: BigInt(vendorId),
          tenantId,
          status: { in: ['PENDING', 'COUNTER_OFFER_SENT', 'COUNTER_OFFER_ACCEPTED', 'ACCEPTED_BY_CAPTAIN'] }
        }
      }),
      prisma.order.count({
        where: {
          vendorId: BigInt(vendorId),
          tenantId,
          status: 'REJECTED_BY_VENDOR'
        }
      })
    ]);

    return {
      totalOrders,
      completedOrders,
      pendingOrders,
      rejectedOrders,
      completionRate: totalOrders > 0 ? (completedOrders / totalOrders * 100).toFixed(2) : 0,
      rejectionRate: totalOrders > 0 ? (rejectedOrders / totalOrders * 100).toFixed(2) : 0
    };
  }

  // Search vendors
  async searchVendors(query, tenantId, page = 1, limit = 10, category = null) {
    const skip = (page - 1) * limit;

    const whereClause = {
      AND: [
        { tenantId },
        { isLocked: false }, // Only show non-locked vendors
        { id: { not: -1 } },
        {
          OR: [
            { vendorName: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { address: { contains: query, mode: 'insensitive' } }
          ]
        }
      ]
    };

    // Filter by category if provided
    if (category) {
      whereClause.AND.push({
        vendorCategories: {
          some: {
            categoryId: BigInt(category),
            tenantId
          }
        }
      });
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where: whereClause,
        select: {
          id: true,
          vendorName: true,
          contactNumber: true,
          address: true,
          longitude: true,
          latitude: true,
          isLocked: true,
          description: true,
          isOpen: true,
          image: true,
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
        orderBy: { vendorName: 'asc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.vendor.count({
        where: {
          AND: [
            { tenantId },
            { isLocked: false }, // Only show non-locked vendors
            { id: { not: -1 } },
            {
              OR: [
                { vendorName: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { address: { contains: query, mode: 'insensitive' } }
              ]
            }
          ]
        }
      })
    ]);

    // Return vendors with pre-signed image URLs and categories
    const vendorsWithImages = vendors.map(vendor => {
      const vendorResponse = convertBigIntToString(vendor);

      // Extract categories from vendorCategories
      if (vendorResponse.vendorCategories) {
        vendorResponse.categories = vendorResponse.vendorCategories.map(vc => vc.category);
        delete vendorResponse.vendorCategories;
      }

      return this.addImageUrls(vendorResponse);
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

  // Refresh token
  async refreshToken(refreshToken, tenantId) {
    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Check if vendor exists and refresh token matches within tenant
      const vendor = await prisma.vendor.findFirst({
        where: {
          id: BigInt(decoded.id),
          tenantId,
          refreshToken: refreshToken
        },
        select: {
          id: true,
          vendorName: true,
          contactNumber: true,
          address: true,
          longitude: true,
          latitude: true,
          description: true,
          isOpen: true,
          isLocked: true,
          image: true,
          neighborhoodId: true
        }
      });

      if (!vendor) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens with tenant context
      const newToken = generateToken(vendor.id, 'vendor', tenantId);
      const newRefreshToken = generateRefreshToken(vendor.id, 'vendor', tenantId);

      // Update refresh token in database
      await prisma.vendor.update({
        where: {
          id_tenantId: {
            id: vendor.id,
            tenantId: tenantId
          }
        },
        data: { refreshToken: newRefreshToken }
      });

      const vendorResponse = convertBigIntToString(vendor);

      return {
        vendor: vendorResponse,
        token: newToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
  // Delete vendor account
  async deleteAccount(vendorId, tenantId) {
    const vendor = await prisma.vendor.findFirst({
      where: { id: BigInt(vendorId), tenantId },
    });

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    await prisma.vendor.delete({
      where: { id_tenantId: { id: BigInt(vendorId), tenantId } },
    });

    return { message: 'Account deleted successfully' };
  }
}

module.exports = new VendorService(); 