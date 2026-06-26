const prisma = require('../utils/prisma');
const { successResponse, errorResponse, convertBigIntToString } = require('../utils/helpers');
const wasabiService = require('./wasabiService');



class MenuService {
  // Helper function to add pre-signed URLs to menu objects
  addImageUrls(menu) {
    if (menu.photo) {
      menu.photoUrl = wasabiService.generatePreSignedUrl(menu.photo);
    }
    return menu;
  }

  // Helper function to add pre-signed URLs to multiple menus
  addImageUrlsToArray(menus) {
    return menus.map(menu => this.addImageUrls(menu));
  }
  
  // Create a new menu item
  async createMenu(vendorId, photo, tenantId) {
    try {
      // Validate vendor exists within tenant
      const vendor = await prisma.vendor.findFirst({
        where: {
          id: BigInt(vendorId),
          tenantId
        }
      });

      if (!vendor) {
        throw new Error('Vendor not found');
      }

      // Upload photo to Wasabi
      if (!photo) {
        throw new Error('Photo is required');
      }
      if (!photo.buffer) {
        throw new Error('Invalid photo file');
      }

      // Upload to Wasabi and get URL
      const photoUrl = await wasabiService.uploadMenuImage(photo.buffer, vendorId);

      const menu = await prisma.menu.create({
        data: {
          tenantId,
          vendorId: BigInt(vendorId),
          photo: photoUrl
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

      // Convert BigInt to string for JSON serialization
      const menuWithStringIds = convertBigIntToString(menu);

      // Add pre-signed URL for photo access
      return this.addImageUrls(menuWithStringIds);
    } catch (error) {
      throw error;
    }
  }

  // Get all menu items for a vendor
  async getVendorMenus(vendorId, tenantId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const whereClause = {
        vendorId: BigInt(vendorId),
        tenantId
      };

      const [menus, total] = await Promise.all([
        prisma.menu.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { id: 'desc' },
        }),
        prisma.menu.count({ where: whereClause })
      ]);

      // Convert BigInt to string and add pre-signed URLs
      const menusWithStringIds = menus.map(menu => {
        return this.addImageUrls(convertBigIntToString(menu));
      });

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      };

      return {
        menus: menusWithStringIds,
        pagination
      };
    } catch (error) {
      throw error;
    }
  }

  // Get a specific menu item by ID
  async getMenuById(menuId, tenantId) {
    try {
      const menu = await prisma.menu.findFirst({
        where: {
          id: BigInt(menuId),
          tenantId
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

      if (!menu) {
        throw new Error('Menu item not found');
      }

      // Convert BigInt to string and add pre-signed URL
      const menuWithStringIds = convertBigIntToString(menu);
      return this.addImageUrls(menuWithStringIds);
    } catch (error) {
      throw error;
    }
  }

  // Update a menu item
  async updateMenu(menuId, vendorId, photo, tenantId) {
    try {
      // Check if menu exists and belongs to vendor within tenant
      const existingMenu = await prisma.menu.findFirst({
        where: {
          id: BigInt(menuId),
          vendorId: BigInt(vendorId),
          tenantId
        }
      });

      if (!existingMenu) {
        throw new Error('Menu item not found or access denied');
      }

      // Upload new photo to Wasabi
      if (!photo) {
        throw new Error('Photo is required');
      }
      if (!photo.buffer) {
        throw new Error('Invalid photo file');
      }

      // Delete old image from Wasabi if it exists
      if (existingMenu.photo) {
        try {
          const oldFileKey = wasabiService.extractFileKeyFromUrl(existingMenu.photo);
          if (oldFileKey) {
            await wasabiService.deleteImage(oldFileKey);
          }
        } catch (deleteError) {
          console.error('Error deleting old image from Wasabi:', deleteError);
          // Continue with upload even if old image deletion fails
        }
      }

      // Upload new photo to Wasabi and get URL
      const photoUrl = await wasabiService.uploadMenuImage(photo.buffer, vendorId);

      const updatedMenu = await prisma.menu.update({
        where: {
          id_tenantId: {
            id: BigInt(menuId),
            tenantId
          }
        },
        data: { photo: photoUrl },
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

      // Convert BigInt to string and add pre-signed URL
      const menuWithStringIds = convertBigIntToString(updatedMenu);

      return this.addImageUrls(menuWithStringIds);
    } catch (error) {
      throw error;
    }
  }

  // Delete a menu item
  async deleteMenu(menuId, vendorId, tenantId) {
    try {
      // Check if menu exists and belongs to vendor within tenant
      const existingMenu = await prisma.menu.findFirst({
        where: {
          id: BigInt(menuId),
          vendorId: BigInt(vendorId),
          tenantId
        }
      });

      if (!existingMenu) {
        throw new Error('Menu item not found or access denied');
      }

      // Delete from Wasabi if photo URL exists
      if (existingMenu.photo) {
        try {
          const fileKey = wasabiService.extractFileKeyFromUrl(existingMenu.photo);
          if (fileKey) {
            await wasabiService.deleteImage(fileKey);
          }
        } catch (deleteError) {
          console.error('Error deleting image from Wasabi:', deleteError);
          // Continue with database deletion even if Wasabi deletion fails
        }
      }

      await prisma.menu.delete({
        where: {
          id_tenantId: {
            id: BigInt(menuId),
            tenantId
          }
        }

      });

      return { message: 'Menu item deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Get menu statistics for a vendor
  async getMenuStats(vendorId, tenantId) {
    try {
      const totalMenus = await prisma.menu.count({
        where: {
          vendorId: BigInt(vendorId),
          tenantId
        }
      });

      return successResponse({
        totalMenus
      }, 'Menu statistics retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  // Get all menu items for a vendor (simplified - no search needed)
  async getAllMenus(vendorId, tenantId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const whereClause = {
        vendorId: BigInt(vendorId),
        tenantId
      };

      const [menus, total] = await Promise.all([
        prisma.menu.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { id: 'desc' },
          include: {
            vendor: {
              select: {
                id: true,
                vendorName: true,
                contactNumber: true
              }
            }
          }
        }),
        prisma.menu.count({ where: whereClause })
      ]);

      // Convert BigInt to string and add pre-signed URLs
      const menusWithStringIds = menus.map(menu => {
        return this.addImageUrls(convertBigIntToString(menu));
      });

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      };

      return {
        menus: menusWithStringIds,
        pagination
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new MenuService(); 