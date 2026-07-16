const prisma = require("../utils/prisma");
const { convertBigIntToString } = require("../utils/helpers");
const notificationService = require("./notificationService");
const {
  getCaptainLocation,
  updateCaptainLockInCache,
  updateCaptainOrderCountsInCache,
} = require("./captainService");
const wasabiService = require("./wasabiService");

class OrderService {
  // Helper function to add pre-signed URLs to attachments
  addAttachmentUrls(order) {
    if (order.attachments && Array.isArray(order.attachments)) {
      order.attachments = order.attachments.map((attachment) => {
        if (attachment.link) {
          attachment.linkUrl = wasabiService.generatePreSignedUrl(
            attachment.link,
          );
        }
        return attachment;
      });
    }
    return order;
  }

  // Helper function to add pre-signed URLs to multiple orders
  addAttachmentUrlsToArray(orders) {
    return orders.map((order) => this.addAttachmentUrls(order));
  }
  addCaptainUrlsToArray(orders) {
    return orders.map((order) => {
      if (order.captain && order.captain.photo) {
        order.captain.photoUrl = wasabiService.generatePreSignedUrl(
          order.captain.photo,
        );
      }
      return order;
    });
  }
  // Create order by user
  // Create special admin order (vendor_id == -1)
  async createSpecialOrder(userId, orderData, tenantId) {
    const {
      description,
      additionalNotes,
      userAddress,
      userLongitude,
      userLatitude,
      phoneNumber,
      neighborhoodId,
      attachments,
      waitingTime,
      deliveryPrice,
    } = orderData;

    // Create special admin order with COUNTER_OFFER_ACCEPTED status
    const order = await prisma.order.create({
      data: {
        tenantId,
        userId: userId ? BigInt(userId) : null,
        vendorId: BigInt(-1),
        neighborhoodId: neighborhoodId ? BigInt(neighborhoodId) : null,
        status: "COUNTER_OFFER_ACCEPTED",
        description,
        additionalNotes,
        userAddress,
        userLongitude: userLongitude ? parseFloat(userLongitude) : null,
        userLatitude: userLatitude ? parseFloat(userLatitude) : null,
        phoneNumber,
        deliveryPrice: deliveryPrice ? parseFloat(deliveryPrice) : null,
        waitingTime: waitingTime ? parseInt(waitingTime) : null,
        attachments:
          attachments && attachments.length > 0
            ? {
                create: attachments.map((att) => ({
                  type: att.type,
                  link: att.link,
                })),
              }
            : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            phoneNumber: true,
          },
        },
        neighborhood: {
          select: {
            id: true,
            name: true,
          },
        },
        attachments: true,
      },
    });

    // Send notifications to admin and all available captains
    setImmediate(async () => {
      try {
        const orderDetails = {
          userName: order.user?.userName,
          neighborhoodName: order.neighborhood?.name,
          description: order.description,
          notes: order.additionalNotes,
        };
        const detailsText =
          notificationService.buildOrderDetailsText(orderDetails);
        const captainBody = detailsText
          ? `يوجد طلب توصيل خاص جديد. ${detailsText}`
          : "يوجد طلب توصيل خاص جديد. تحقق من التطبيق للقبول وتحديد سعر التوصيل.";

        await Promise.all([
          notificationService.notifyAdminSpecialOrder(
            order.id,
            tenantId,
            orderDetails,
          ),
          notificationService.sendToAllAvailableCaptains(
            "طلب توصيل خاص متاح",
            captainBody,
            { orderId: order.id.toString(), type: "SPECIAL_ORDER_AVAILABLE" },
            tenantId,
          ),
        ]);
      } catch (error) {
        console.error("Failed to send special order notifications:", error);
      }
    });

    return this.addAttachmentUrls(convertBigIntToString(order));
  }

  async createByUser(userId, orderData, tenantId) {
    const {
      vendorId,
      description,
      price,
      additionalNotes,
      userAddress,
      userLongitude,
      userLatitude,
      phoneNumber,
      neighborhoodId,
      attachments,
    } = orderData;

    // Check for special admin order (vendorId -1)
    if (vendorId === -1 || vendorId === "-1") {
      return await this.createSpecialOrder(userId, orderData, tenantId);
    }

    // Verify vendor exists and is open within tenant
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: BigInt(vendorId),
        tenantId,
      },
    });

    if (!vendor) {
      throw new Error("Vendor not found");
    }

    if (vendor.isOpen !== "true") {
      throw new Error("Vendor is currently closed");
    }

    if (vendor.isLocked) {
      throw new Error("Vendor is currently locked and cannot accept orders");
    }

    // Get delivery price from vendor-neighborhood pricing within tenant
    let deliveryPrice = null;
    if (neighborhoodId) {
      const pricing = await prisma.vendorNeighborhoodPrice.findFirst({
        where: {
          vendorId: BigInt(vendorId),
          neighborhoodId: BigInt(neighborhoodId),
          tenantId,
        },
      });
      deliveryPrice = pricing ? pricing.price : null;
      if (!deliveryPrice) {
        throw new Error(
          "Delivery price not found for the selected neighborhood",
        );
      }
    }

    // Create order with attachments
    const order = await prisma.order.create({
      data: {
        tenantId,
        userId: BigInt(userId),
        vendorId: BigInt(vendorId),
        neighborhoodId: neighborhoodId ? BigInt(neighborhoodId) : null,
        status: "PENDING",
        description,
        additionalNotes,
        userAddress,
        price: price ? parseFloat(price) : null,
        userLongitude: userLongitude ? parseFloat(userLongitude) : null,
        userLatitude: userLatitude ? parseFloat(userLatitude) : null,
        phoneNumber,
        deliveryPrice,
        attachments:
          attachments && attachments.length > 0
            ? {
                create: attachments.map((att) => ({
                  type: att.type,
                  link: att.link,
                })),
              }
            : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            phoneNumber: true,
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
        attachments: true,
      },
    });

    // Send notifications to the vendor and the admin
    try {
      const orderDetails = {
        userName: order.user?.userName,
        vendorName: order.vendor?.vendorName,
        description: order.description,
        notes: order.additionalNotes,
      };
      await Promise.all([
        notificationService.notifyNewOrder(
          vendorId,
          order.id,
          tenantId,
          orderDetails,
        ),
        notificationService.notifyAdminNewVendorOrder(
          order.id,
          tenantId,
          orderDetails,
        ),
      ]);
    } catch (error) {
      console.error("Failed to send order notifications:", error);
    }
    return this.addAttachmentUrls(convertBigIntToString(order));
  }

  // Create an admin-initiated order for a specific vendor (no delivery-price requirement)
  async createAdminOrderForVendor(userId, orderData, tenantId, force = false) {
    const {
      vendorId,
      description,
      additionalNotes,
      userAddress,
      userLongitude,
      userLatitude,
      phoneNumber,
      neighborhoodId,
      attachments,
      skipApproval,
      waitingTime,
      deliveryPrice,
    } = orderData;

    const vendor = await prisma.vendor.findFirst({
      where: { id: BigInt(vendorId), tenantId },
    });

    if (!vendor) {
      throw new Error("Vendor not found");
    }

    if (!force && vendor.isOpen !== "true") {
      const error = new Error("Vendor is currently closed");
      error.code = "VENDOR_CLOSED";
      throw error;
    }

    if (!force && vendor.isLocked) {
      const error = new Error(
        "Vendor is currently locked and cannot accept orders",
      );
      error.code = "VENDOR_LOCKED";
      throw error;
    }

    const order = await prisma.order.create({
      data: {
        tenantId,
        userId: userId ? BigInt(userId) : null,
        vendorId: BigInt(vendorId),
        neighborhoodId: neighborhoodId ? BigInt(neighborhoodId) : null,
        status: skipApproval ? "COUNTER_OFFER_ACCEPTED" : "PENDING",
        description,
        additionalNotes,
        userAddress,
        userLongitude: userLongitude ? parseFloat(userLongitude) : null,
        userLatitude: userLatitude ? parseFloat(userLatitude) : null,
        phoneNumber,
        deliveryPrice: deliveryPrice ? parseFloat(deliveryPrice) : null,
        waitingTime: waitingTime ? parseInt(waitingTime) : null,
        acceptedByVend: skipApproval ? new Date() : null,
        attachments:
          attachments && attachments.length > 0
            ? {
                create: attachments.map((att) => ({
                  type: att.type,
                  link: att.link,
                })),
              }
            : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            phoneNumber: true,
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
        attachments: true,
      },
    });

    // Send notifications to the vendor and the admin
    const orderDetails = {
      userName: order.user?.userName,
      vendorName: order.vendor?.vendorName,
      neighborhoodName: order.neighborhood?.name,
      description: order.description,
      notes: order.additionalNotes,
    };

    try {
      await Promise.all([
        notificationService.notifyNewOrder(
          vendorId,
          order.id,
          tenantId,
          orderDetails,
        ),
        notificationService.notifyAdminNewVendorOrder(
          order.id,
          tenantId,
          orderDetails,
        ),
      ]);
    } catch (error) {
      console.error("Failed to send order notifications:", error);
    }
    return this.addAttachmentUrls(convertBigIntToString(order));
  }

  // Create order by vendor
  async createByVendor(vendorId, orderData, tenantId) {
    const {
      description,
      additionalNotes,
      userAddress,
      userLongitude,
      userLatitude,
      phoneNumber,
      neighborhoodId,
      price,
      waitingTime,
    } = orderData;

    // // Verify user exists if userId is provided
    // if (userId) {
    //   const user = await prisma.user.findUnique({
    //     where: {
    //       id: BigInt(userId),
    //       tenantId
    //     }
    //   });

    //   if (!user) {
    //     throw new Error('User not found');
    //   }
    // }

    // Get delivery price from vendor-neighborhood pricing
    let deliveryPrice = null;
    if (neighborhoodId) {
      const pricing = await prisma.vendorNeighborhoodPrice.findFirst({
        where: {
          vendorId: BigInt(vendorId),
          neighborhoodId: BigInt(neighborhoodId),
          tenantId,
        },
      });
      deliveryPrice = pricing ? pricing.price : null;
    }
    if (!deliveryPrice) {
      throw new Error("Delivery price not found");
    }
    // Create order with COUNTER_OFFER_ACCEPTED status for vendor-created orders
    const order = await prisma.order.create({
      data: {
        tenantId,
        userId: null,
        vendorId: BigInt(vendorId),
        neighborhoodId: neighborhoodId ? BigInt(neighborhoodId) : null,
        status: "COUNTER_OFFER_ACCEPTED", // Vendor orders skip the counter-offer phase
        description,
        additionalNotes,
        userAddress,
        userLongitude: userLongitude ? parseFloat(userLongitude) : null,
        userLatitude: userLatitude ? parseFloat(userLatitude) : null,
        phoneNumber,
        deliveryPrice,
        acceptedByVend: new Date(), // Mark as accepted by vendor immediately
        price: price ? price : null,
        waitingTime: waitingTime ? parseInt(waitingTime) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            phoneNumber: true,
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
      },
    });

    // Send notifications to all available captains and the admin
    try {
      await Promise.all([
        notificationService.sendToAllAvailableCaptains(
          "طلب توصيل جديد",
          "يوجد طلب توصيل جديد متاح. تحقق من التطبيق للقبول.",
          { orderId: order.id.toString(), type: "DELIVERY_AVAILABLE" },
          tenantId,
        ),
        notificationService.notifyAdminNewVendorOrder(order.id, tenantId, {
          vendorName: order.vendor?.vendorName,
          description: order.description,
          notes: order.additionalNotes,
        }),
      ]);
    } catch (error) {
      console.error("Failed to send order notifications:", error);
    }

    return convertBigIntToString(order);
  }

  // Vendor counter offer
  async vendorCounterOffer(orderId, vendorId, counterOfferData, tenantId) {
    const { description, additionalNotes, price, waitingTime } =
      counterOfferData;

    // Verify order exists and belongs to vendor
    const order = await prisma.order.findFirst({
      where: {
        id: BigInt(orderId),
        vendorId: BigInt(vendorId),
        tenantId,
        status: "PENDING",
      },
    });

    if (!order) {
      throw new Error("Order not found or cannot be modified");
    }

    // Update order directly to COUNTER_OFFER_ACCEPTED (skip counter offer step)
    const updatedOrder = await prisma.order.update({
      where: {
        id_tenantId: {
          id: BigInt(orderId),
          tenantId,
        },
      },
      data: {
        description,
        additionalNotes,
        price: parseFloat(price),
        status: "COUNTER_OFFER_ACCEPTED",
        counterOfferSentAt: new Date(),
        acceptedByVend: new Date(),
        waitingTime: waitingTime ? parseInt(waitingTime) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            phoneNumber: true,
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
        attachments: true,
      },
    });

    // Send notifications to user and all available captains
    setImmediate(async () => {
      try {
        await Promise.all([
          // Notify user that order is accepted with price
          updatedOrder.userId
            ? notificationService.sendToUser(
                updatedOrder.userId,
                "تمت الموافقة على طلبك",
                `تمت الموافقة على طلبك بسعر ${price} جنيه، سعر التوصيل ${updatedOrder.deliveryPrice} جنيه. سيتم تعيين كابتن قريباً.`,
                tenantId,
                {
                  orderId: orderId.toString(),
                  price: price.toString(),
                  deliveryPrice: updatedOrder.deliveryPrice?.toString(),
                  type: "ORDER_APPROVED",
                },
              )
            : Promise.resolve(true),
          // Notify all available captains
          notificationService.sendToAllAvailableCaptains(
            "طلب توصيل جديد",
            "يوجد طلب توصيل جديد متاح. تحقق من التطبيق للقبول.",
            { orderId: orderId.toString(), type: "DELIVERY_AVAILABLE" },
            tenantId,
          ),
        ]);
      } catch (error) {
        console.error("Failed to send order approval notifications:", error);
      }
    });

    return this.addAttachmentUrls(convertBigIntToString(updatedOrder));
  }

  // Vendor accept order as-is (using the order's existing price)
  async vendorAccept(orderId, vendorId, tenantId) {
    // Verify order exists and belongs to vendor
    const order = await prisma.order.findFirst({
      where: {
        id: BigInt(orderId),
        vendorId: BigInt(vendorId),
        tenantId,
        status: "PENDING",
      },
    });

    if (!order) {
      throw new Error("Order not found or cannot be modified");
    }

    if (!order.price) {
      throw new Error(
        "Order has no price set. Please send an offer with a price instead",
      );
    }

    // Update order directly to COUNTER_OFFER_ACCEPTED using the existing price
    const updatedOrder = await prisma.order.update({
      where: {
        id_tenantId: {
          id: BigInt(orderId),
          tenantId,
        },
      },
      data: {
        status: "COUNTER_OFFER_ACCEPTED",
        counterOfferSentAt: new Date(),
        acceptedByVend: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            phoneNumber: true,
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
        attachments: true,
      },
    });

    // Send notifications to user and all available captains
    setImmediate(async () => {
      try {
        await Promise.all([
          updatedOrder.userId
            ? notificationService.sendToUser(
                updatedOrder.userId,
                "تمت الموافقة على طلبك",
                `تمت الموافقة على طلبك بسعر ${updatedOrder.price} جنيه، سعر التوصيل ${updatedOrder.deliveryPrice} جنيه. سيتم تعيين كابتن قريباً.`,
                tenantId,
                {
                  orderId: orderId.toString(),
                  price: updatedOrder.price?.toString(),
                  deliveryPrice: updatedOrder.deliveryPrice?.toString(),
                  type: "ORDER_APPROVED",
                },
              )
            : Promise.resolve(true),
          notificationService.sendToAllAvailableCaptains(
            "طلب توصيل جديد",
            "يوجد طلب توصيل جديد متاح. تحقق من التطبيق للقبول.",
            { orderId: orderId.toString(), type: "DELIVERY_AVAILABLE" },
            tenantId,
          ),
        ]);
      } catch (error) {
        console.error("Failed to send order approval notifications:", error);
      }
    });

    return this.addAttachmentUrls(convertBigIntToString(updatedOrder));
  }

  // User approve order
  async userApprove(orderId, userId, tenantId) {
    // Verify order exists and belongs to user
    const order = await prisma.order.findFirst({
      where: {
        id: BigInt(orderId),
        userId: BigInt(userId),
        tenantId,
        status: "COUNTER_OFFER_SENT",
      },
    });

    if (!order) {
      throw new Error("Order not found or cannot be approved");
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: {
        id_tenantId: {
          id: BigInt(orderId),
          tenantId,
        },
      },
      data: {
        status: "COUNTER_OFFER_ACCEPTED",
        acceptedByVend: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            phoneNumber: true,
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
      },
    });

    // Send notifications to vendor and all available captains
    try {
      await notificationService.notifyOrderApproved(
        updatedOrder.vendorId,
        orderId,
        tenantId,
      );
    } catch (error) {
      console.error("Failed to send order approval notifications:", error);
    }

    return convertBigIntToString(updatedOrder);
  }
  // Captain approve order
  async captainApprove(orderId, captainId, tenantId, deliveryPrice = null) {
    return await prisma.$transaction(async (tx) => {
      // Verify captain is available and get current status
      const captain = await tx.captain.findUnique({
        where: {
          id_tenantId: {
            id: BigInt(captainId),
            tenantId,
          },
        },
        select: {
          isAvailable: true,
          currentNumberOfOrders: true,
          maxCurrentOrders: true,
          userName: true,
        },
      });

      // if (!captain || !captain.isAvailable) {
      //   throw new Error('Captain not available');
      // }

      // Check if captain can take more orders
      if (captain.currentNumberOfOrders >= captain.maxCurrentOrders) {
        throw new Error("Captain has reached maximum order capacity");
      }

      // Check if this is a special order and deliveryPrice is required
      const existingOrder = await tx.order.findFirst({
        where: {
          id: BigInt(orderId),
          tenantId,
          status: "COUNTER_OFFER_ACCEPTED",
          captainId: null,
        },
        select: {
          vendorId: true,
          userId: true,
        },
      });

      if (!existingOrder) {
        throw new Error("Order not found or not available for pickup");
      }

      const isSpecialOrder = existingOrder.vendorId.toString() === "-1";

      // For special orders, deliveryPrice is required
      if (isSpecialOrder && !deliveryPrice) {
        throw new Error("Delivery price is required for special orders");
      }

      // Update order with delivery price if it's a special order
      const updateData = {
        captainId: BigInt(captainId),
        status: "ACCEPTED_BY_CAPTAIN",
        acceptedByCapta: new Date(),
      };

      if (isSpecialOrder && deliveryPrice) {
        updateData.deliveryPrice = parseFloat(deliveryPrice);
      }

      const updatedOrder = await tx.order.updateMany({
        where: {
          id: BigInt(orderId),
          tenantId,
          status: "COUNTER_OFFER_ACCEPTED",
          captainId: null,
        },
        data: updateData,
      });

      if (updatedOrder.count === 0) {
        throw new Error("Order not found or not available for pickup");
      }

      // Atomically increment currentNumberOfOrders
      const newCurrentOrders = captain.currentNumberOfOrders + 1;

      await tx.captain.update({
        where: {
          id_tenantId: {
            id: BigInt(captainId),
            tenantId,
          },
        },
        data: {
          currentNumberOfOrders: { increment: 1 },
        },
      });

      // Update cache with new currentNumberOfOrders
      updateCaptainOrderCountsInCache(captainId.toString(), tenantId, {
        currentNumberOfOrders: newCurrentOrders,
      });

      // Notifications can safely happen after commit
      setImmediate(async () => {
        try {
          if (isSpecialOrder) {
            // For special orders, notify admin and user
            await Promise.all([
              notificationService.sendToAdmin(
                "تم قبول طلب خاص",
                `الكابتن ${captain.userName} قبل الطلب الخاص رقم ${orderId} بسعر توصيل ${deliveryPrice} جنيه.`,
                {
                  orderId: orderId.toString(),
                  captainId: captainId.toString(),
                  deliveryPrice: deliveryPrice.toString(),
                  type: "SPECIAL_ORDER_ACCEPTED",
                },
                tenantId,
              ),
              existingOrder.userId
                ? notificationService.sendToUser(
                    existingOrder.userId,
                    "تم تعيين كابتن",
                    `تم تعيين كابتن لطلبك الخاص بسعر توصيل ${deliveryPrice} جنيه. الكابتن في الطريق إليك.`,
                    tenantId,
                    {
                      orderId: orderId.toString(),
                      captainId: captainId.toString(),
                      deliveryPrice: deliveryPrice.toString(),
                      type: "CAPTAIN_ASSIGNED",
                    },
                  )
                : Promise.resolve(true),
            ]);
          } else {
            // Regular order notifications
            await notificationService.notifyCaptainAccepted(
              existingOrder.vendorId,
              existingOrder.userId,
              orderId,
              captainId,
              tenantId,
              captain.userName,
            );
          }
        } catch (error) {
          console.error(
            "Failed to send captain acceptance notifications:",
            error,
          );
        }
      });

      return convertBigIntToString(updatedOrder);
    });
  }

  // Get orders by user
  async getByUser(userId, tenantId, page = 1, limit = 10, status = null) {
    const skip = (page - 1) * limit;

    const whereClause = { userId: BigInt(userId), tenantId };
    if (status) {
      whereClause.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
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
          captain: {
            select: {
              id: true,
              userName: true,
              phoneNumber: true,
              longitude: true,
              latitude: true,
              photo: true,
            },
          },
          attachments: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.order.count({ where: whereClause }),
    ]);

    let ordersWithUrls = this.addAttachmentUrlsToArray(
      convertBigIntToString(orders),
    );
    ordersWithUrls = this.addCaptainUrlsToArray(ordersWithUrls);

    return {
      orders: ordersWithUrls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get orders by vendor
  async getByVendor(vendorId, tenantId, page = 1, limit = 10, status = null) {
    const skip = (page - 1) * limit;

    const whereClause = { vendorId: BigInt(vendorId), tenantId };
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
          captain: {
            select: {
              id: true,
              userName: true,
              phoneNumber: true,
              longitude: true,
              latitude: true,
            },
          },
          neighborhood: {
            select: {
              id: true,
              name: true,
            },
          },
          attachments: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.order.count({ where: whereClause }),
    ]);

    const ordersWithUrls = this.addAttachmentUrlsToArray(
      convertBigIntToString(orders),
    );

    return {
      orders: ordersWithUrls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get orders by captain
  async getByCaptain(captainId, tenantId, page = 1, limit = 10, status = null) {
    const skip = (page - 1) * limit;

    const whereClause = { captainId: BigInt(captainId), tenantId };
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
              longitude: true,
              latitude: true,
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
          attachments: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.order.count({ where: whereClause }),
    ]);

    const ordersWithUrls = this.addAttachmentUrlsToArray(
      convertBigIntToString(orders),
    );

    return {
      orders: ordersWithUrls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get available orders for captains
  async getAvailableOrders(tenantId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          tenantId,
          status: "COUNTER_OFFER_ACCEPTED",
          captainId: null,
        },
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
          attachments: true,
        },
        orderBy: { createdAt: "asc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.order.count({
        where: {
          tenantId,
          status: "COUNTER_OFFER_ACCEPTED",
          captainId: null,
        },
      }),
    ]);

    const ordersWithUrls = this.addAttachmentUrlsToArray(
      convertBigIntToString(orders),
    );

    return {
      orders: ordersWithUrls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Re-send the "delivery available" notification to all available captains
  // for every order that is still waiting for a captain to accept it
  // (vendor-approved but not yet picked up).
  async resendPendingOrderNotificationsToCaptains(tenantId) {
    const pendingOrders = await prisma.order.findMany({
      where: {
        tenantId,
        status: "COUNTER_OFFER_ACCEPTED",
        captainId: null,
      },
      select: { id: true },
    });

    if (pendingOrders.length === 0) {
      return { notifiedOrders: 0 };
    }

    await Promise.all(
      pendingOrders.map((order) =>
        notificationService.sendToAllAvailableCaptains(
          "طلب توصيل جديد",
          "يوجد طلب توصيل جديد متاح. تحقق من التطبيق للقبول.",
          { orderId: order.id.toString(), type: "DELIVERY_AVAILABLE" },
          tenantId,
        ),
      ),
    );

    return { notifiedOrders: pendingOrders.length };
  }

  // Get order by ID
  async getOrderById(orderId, tenantId) {
    const order = await prisma.order.findFirst({
      where: {
        id: BigInt(orderId),
        tenantId,
      },
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
        captain: {
          select: {
            id: true,
            userName: true,
            phoneNumber: true,
            longitude: true,
            latitude: true,
            ratingSum: true,
            ratingCount: true,
            photo: true,
          },
        },
        neighborhood: {
          select: {
            id: true,
            name: true,
          },
        },
        attachments: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Get cached location
    if (order.captain) {
      const captainLocation = await getCaptainLocation(
        order.captain.id,
        tenantId,
      );
      order.captain.longitude = captainLocation.longitude;
      order.captain.latitude = captainLocation.latitude;
    }

    // Calculate captain rating if captain exists
    if (order.captain) {
      order.captain.rating =
        order.captain.ratingCount > 0
          ? order.captain.ratingSum / order.captain.ratingCount
          : 5.0;
    }

    const orderResponse = convertBigIntToString(order);
    return this.addAttachmentUrls(
      this.addCaptainUrlsToArray([orderResponse])[0],
    );
  }

  // Vendor reject order
  async vendorReject(orderId, vendorId, tenantId) {
    // Verify order exists and belongs to vendor
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          {
            id: BigInt(orderId),
            vendorId: BigInt(vendorId),
            status: "PENDING",
            tenantId,
          },
          {
            id: BigInt(orderId),
            vendorId: BigInt(vendorId),
            status: "COUNTER_OFFER_ACCEPTED",
            tenantId,
          },
        ],
      },
    });

    if (!order) {
      throw new Error("Order not found or cannot be rejected");
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: {
        id_tenantId: {
          id: BigInt(orderId),
          tenantId,
        },
      },
      data: { status: "CANCELLED" },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            phoneNumber: true,
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
      },
    });

    // Send notification to user about order rejection
    try {
      if (updatedOrder.userId) {
        await notificationService.sendToUser(
          updatedOrder.userId,
          "تم رفض طلبك",
          `تم رفض طلبك من قبل ${updatedOrder.vendor.vendorName}. يمكنك تقديم طلب جديد أو تجربة تاجر آخر.`,
          { orderId: orderId.toString(), type: "ORDER_REJECTED" },
        );
      }
    } catch (error) {
      console.error("Failed to send order rejection notification:", error);
    }

    return convertBigIntToString(updatedOrder);
  }

  // Finalize order (mark as delivered) - User only
  async finalize(orderId, userId, tenantId) {
    // Verify order exists and belongs to user
    const order = await prisma.order.findFirst({
      where: {
        id: BigInt(orderId),
        userId: BigInt(userId),
        tenantId,
        status: "DELIVERED",
      },
    });

    if (!order) {
      throw new Error("Order not found or cannot be finalized");
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: {
        id_tenantId: {
          id: BigInt(orderId),
          tenantId,
        },
      },
      data: {
        finalizedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            phoneNumber: true,
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
        captain: {
          select: {
            id: true,
            userName: true,
            phoneNumber: true,
            currentLocation: true,
          },
        },
      },
    });

    return convertBigIntToString(updatedOrder);
  }

  // Mark order as delivered by captain
  async markDelivered(orderId, captainId, tenantId) {
    // Execute transaction for order update and earnings update
    const result = await prisma.$transaction(async (tx) => {
      // Verify order exists and belongs to captain
      const order = await tx.order.findFirst({
        where: {
          id: BigInt(orderId),
          captainId: BigInt(captainId),
          status: "ACCEPTED_BY_CAPTAIN",
          tenantId,
        },
        select: {
          id: true,
          deliveryPrice: true,
          userId: true,
          vendorId: true,
        },
      });

      if (!order) {
        throw new Error("Order not found or cannot be marked as delivered");
      }

      // Update order status
      const updatedOrder = await tx.order.update({
        where: {
          id_tenantId: {
            id: BigInt(orderId),
            tenantId,
          },
        },
        data: {
          status: "DELIVERED",
          deliveredAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              userName: true,
              phoneNumber: true,
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
          captain: {
            select: {
              id: true,
              userName: true,
              phoneNumber: true,
              longitude: true,
              latitude: true,
            },
          },
        },
      });

      // Update captain: decrement orders and add earnings
      const deliveryPrice = parseFloat(order.deliveryPrice || 0);
      const updatedCaptain = await tx.captain.update({
        where: {
          id_tenantId: {
            id: BigInt(captainId),
            tenantId,
          },
        },
        data: {
          currentNumberOfOrders: { decrement: 1 },
          earningSinceLastActivation: { increment: deliveryPrice },
        },
        select: {
          currentNumberOfOrders: true,
          earningSinceLastActivation: true,
          maxEarningsSinceLastActivation: true,
          userName: true,
        },
      });

      return { updatedOrder, deliveryPrice, updatedCaptain };
    });

    // Update cache with new currentNumberOfOrders
    const newCurrentOrders = result.updatedCaptain.currentNumberOfOrders;
    updateCaptainOrderCountsInCache(captainId.toString(), tenantId, {
      currentNumberOfOrders: newCurrentOrders,
    });

    // After transaction, check earnings and handle locking/notifications
    const captain = result.updatedCaptain;

    if (captain) {
      const newEarnings = parseFloat(captain.earningSinceLastActivation || 0);
      const maxEarnings = parseFloat(
        captain.maxEarningsSinceLastActivation || 0,
      );
      const exceededMaxEarnings = maxEarnings > 0 && newEarnings >= maxEarnings;

      if (exceededMaxEarnings) {
        const shouldLockCaptain = captain.currentNumberOfOrders === 0;

        // Update captain lock status if needed
        if (shouldLockCaptain) {
          await prisma.captain.update({
            where: {
              id_tenantId: {
                id: BigInt(captainId),
                tenantId,
              },
            },
            data: {
              isLocked: true,
            },
          });
          updateCaptainLockInCache(captainId, tenantId, true);
        }

        // Send max earnings notifications
        setImmediate(async () => {
          try {
            await notificationService.notifyMaxEarningsExceeded(
              captainId,
              captain.userName,
              tenantId,
            );
          } catch (error) {
            console.error("Failed to send max earnings notification:", error);
          }
        });
      }
    }

    // Send delivery notifications (customer, if any, and always the admin)
    setImmediate(async () => {
      try {
        await Promise.all([
          notificationService.notifyOrderDelivered(
            result.updatedOrder.userId,
            orderId,
            tenantId,
          ),
          notificationService.notifyAdminOrderDelivered(orderId, tenantId, {
            userName: result.updatedOrder.user?.userName,
            vendorName: result.updatedOrder.vendor?.vendorName,
            neighborhoodName: result.updatedOrder.vendor?.neighborhood?.name,
            captainName: result.updatedOrder.captain?.userName,
          }),
        ]);
      } catch (error) {
        console.error("Failed to send delivery notification:", error);
      }
    });

    return convertBigIntToString(result.updatedOrder);
  }

  // Captain arrived at user location
  async captainArrived(orderId, captainId, tenantId) {
    // Verify order exists and belongs to captain
    const order = await prisma.order.findFirst({
      where: {
        id: BigInt(orderId),
        captainId: BigInt(captainId),
        status: "ACCEPTED_BY_CAPTAIN",
        tenantId,
      },
    });

    if (!order) {
      throw new Error("Order not found or not assigned to this captain");
    }

    // Send notification to user about captain arrival
    try {
      await notificationService.notifyCaptainArrived(
        order.userId,
        orderId,
        tenantId,
      );
    } catch (error) {
      console.error("Failed to send captain arrival notification:", error);
    }

    return {
      success: true,
      message: "User notified about captain arrival",
      orderId: orderId.toString(),
    };
  }

  // Rate captain (by user) - Updated rating system
  async rateCaptain(orderId, userId, rating, tenantId) {
    // Verify order exists, belongs to user, and is delivered
    const order = await prisma.order.findFirst({
      where: {
        id: BigInt(orderId),
        userId: BigInt(userId),
        tenantId,
        status: "DELIVERED",
        captainId: { not: null },
      },
    });

    if (!order) {
      throw new Error("Order not found or cannot be rated");
    }

    const ratingValue = parseFloat(rating);

    // Update captain's rating sum and count
    const updatedCaptain = await prisma.captain.update({
      where: {
        id_tenantId: {
          id: order.captainId,
          tenantId,
        },
      },
      data: {
        ratingSum: { increment: ratingValue },
        ratingCount: { increment: 1 },
      },
      select: {
        id: true,
        userName: true,
        phoneNumber: true,
        ratingSum: true,
        ratingCount: true,
      },
    });

    // Mark order as rated
    await prisma.order.update({
      where: {
        id_tenantId: {
          id: BigInt(orderId),
          tenantId,
        },
      },
      data: { isRated: true },
    });

    // Calculate current rating
    const currentRating =
      updatedCaptain.ratingCount > 0
        ? updatedCaptain.ratingSum / updatedCaptain.ratingCount
        : 5.0;

    return convertBigIntToString({
      ...updatedCaptain,
      currentRating,
    });
  }

  // Update order status to in delivery
  async startDelivery(orderId, captainId, tenantId) {
    // Verify order exists and belongs to captain
    const order = await prisma.order.findFirst({
      where: {
        id: BigInt(orderId),
        captainId: BigInt(captainId),
        status: "ACCEPTED_BY_CAPTAIN",
        tenantId,
      },
    });

    if (!order) {
      throw new Error("Order not found or cannot start delivery");
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: {
        id_tenantId: {
          id: BigInt(orderId),
          tenantId,
        },
      },
      data: { status: "IN_DELIVERY" },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            phoneNumber: true,
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
        captain: {
          select: {
            id: true,
            userName: true,
            phoneNumber: true,
            currentLocation: true,
          },
        },
      },
    });

    return convertBigIntToString(updatedOrder);
  }

  // Delete order (only if pending OR COUNTER OFFER! and belongs to user)
  async deleteOrder(orderId, userId, tenantId) {
    // Verify order exists, belongs to user, and no captain has accepted it yet.
    // Once a captain accepts (ACCEPTED_BY_CAPTAIN), only an admin can cancel
    // (see adminCancelOrder) since a real captain is already committed.
    const order = await prisma.order.findFirst({
      where: {
        id: BigInt(orderId),
        userId: BigInt(userId),
        tenantId,
        status: {
          in: ["PENDING", "COUNTER_OFFER_SENT", "COUNTER_OFFER_ACCEPTED"],
        },
      },
    });

    if (!order) {
      throw new Error("Order not found or cannot be cancelled");
    }

    // Mark as cancelled (keep the row for history/stats) instead of deleting it
    const updatedOrder = await prisma.order.update({
      where: {
        id_tenantId: {
          id: BigInt(orderId),
          tenantId,
        },
      },
      data: { status: "CANCELLED" },
    });

    // Notify vendor of the cancellation
    try {
      if (order.vendorId && order.vendorId !== BigInt(-1)) {
        await notificationService.notifyOrderCancelled(
          order.vendorId,
          orderId,
          tenantId,
        );
      }
    } catch (error) {
      console.error("Failed to send order cancellation notification:", error);
    }

    return convertBigIntToString(updatedOrder);
  }

  // Get order statistics
  async getOrderStats(tenantId) {
    const [
      totalOrders,
      pendingOrders,
      inDeliveryOrders,
      deliveredOrders,
      cancelledOrders,
    ] = await Promise.all([
      prisma.order.count({ where: { tenantId } }),
      prisma.order.count({ where: { status: "PENDING", tenantId } }),
      prisma.order.count({ where: { status: "IN_DELIVERY", tenantId } }),
      prisma.order.count({ where: { status: "DELIVERED", tenantId } }),
      prisma.order.count({
        where: {
          status: { in: ["CANCELLED", "REJECTED_BY_VENDOR"] },
          tenantId,
        },
      }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      inDeliveryOrders,
      deliveredOrders,
      cancelledOrders,
      completionRate:
        totalOrders > 0
          ? ((deliveredOrders / totalOrders) * 100).toFixed(2)
          : 0,
    };
  }

  // Get all orders for admin with filters
  async getAllOrders(
    tenantId,
    page = 1,
    limit = 10,
    status = null,
    startDate = null,
    endDate = null,
  ) {
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause = { tenantId };

    // Add status filter if provided (supports comma-separated multiple statuses)
    if (status) {
      const statuses = status
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      whereClause.status =
        statuses.length === 1 ? statuses[0] : { in: statuses };
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Set to end of day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = endDateTime;
      }
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
              email: true,
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
          captain: {
            select: {
              id: true,
              userName: true,
              phoneNumber: true,
              ratingCount: true,
              ratingSum: true,
              currentNumberOfOrders: true,
              maxCurrentOrders: true,
              earningSinceLastActivation: true,
              maxEarningsSinceLastActivation: true,
              photo: true,
            },
          },
          neighborhood: {
            select: {
              id: true,
              name: true,
            },
          },
          attachments: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.order.count({ where: whereClause }),
    ]);

    // Convert BigInt to string and add signed URLs for attachments
    const ordersWithUrls = this.addCaptainUrlsToArray(
      this.addAttachmentUrlsToArray(convertBigIntToString(orders)),
    );

    return {
      orders: ordersWithUrls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Admin change delivery price for special orders
  async adminChangeDeliveryPrice(orderId, newDeliveryPrice, tenantId) {
    // Get the order details
    const order = await prisma.order.findFirst({
      where: {
        id: BigInt(orderId),
        tenantId,
        status: { notIn: ["DELIVERED", "CANCELLED", "REJECTED_BY_VENDOR"] },
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
          },
        },
        captain: {
          select: {
            id: true,
            userName: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error(
        "Order not found or cannot be modified (already delivered/cancelled)",
      );
    }

    const oldDeliveryPrice = order.deliveryPrice;

    // Update the delivery price
    const updatedOrder = await prisma.order.update({
      where: {
        id_tenantId: {
          id: BigInt(orderId),
          tenantId,
        },
      },
      data: {
        deliveryPrice: parseFloat(newDeliveryPrice),
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            phoneNumber: true,
          },
        },
        captain: {
          select: {
            id: true,
            userName: true,
            phoneNumber: true,
            ratingCount: true,
            ratingSum: true,
            currentNumberOfOrders: true,
            maxCurrentOrders: true,
            earningSinceLastActivation: true,
            maxEarningsSinceLastActivation: true,
          },
        },
        attachments: true,
      },
    });

    // Send notifications to user and captain
    setImmediate(async () => {
      try {
        await Promise.all([
          // Notify captain
          order.captain
            ? notificationService.sendToCaptain(
                order.captain.id,
                "تم تغيير سعر التوصيل",
                `تم تغيير سعر التوصيل للطلب رقم ${orderId} من ${oldDeliveryPrice} جنيه إلى ${newDeliveryPrice} جنيه من قبل المدير.`,
                tenantId,
                {
                  orderId: orderId.toString(),
                  oldDeliveryPrice: oldDeliveryPrice?.toString(),
                  newDeliveryPrice: newDeliveryPrice.toString(),
                  type: "DELIVERY_PRICE_CHANGED",
                },
              )
            : Promise.resolve(true),
          // Notify user
          order.user
            ? notificationService.sendToUser(
                order.user.id,
                "تم تحديث سعر التوصيل",
                `تم تحديث سعر التوصيل لطلبك الخاص رقم ${orderId} إلى ${newDeliveryPrice} جنيه.`,
                tenantId,
                {
                  orderId: orderId.toString(),
                  newDeliveryPrice: newDeliveryPrice.toString(),
                  type: "DELIVERY_PRICE_UPDATED",
                },
              )
            : Promise.resolve(true),
        ]);
      } catch (error) {
        console.error(
          "Failed to send delivery price change notifications:",
          error,
        );
      }
    });

    return this.addAttachmentUrls(convertBigIntToString(updatedOrder));
  }

  // Admin: release captain from order → back to available pool
  async releaseCaptain(orderId, tenantId) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: BigInt(orderId), tenantId, status: "ACCEPTED_BY_CAPTAIN" },
        select: { id: true, captainId: true, userId: true, vendorId: true },
      });
      if (!order)
        throw new Error("Order not found or not in ACCEPTED_BY_CAPTAIN status");

      // Decrement old captain's order count
      await tx.captain.update({
        where: { id_tenantId: { id: order.captainId, tenantId } },
        data: { currentNumberOfOrders: { decrement: 1 } },
      });

      const captain = await tx.captain.findUnique({
        where: { id_tenantId: { id: order.captainId, tenantId } },
        select: { currentNumberOfOrders: true },
      });
      updateCaptainOrderCountsInCache(order.captainId.toString(), tenantId, {
        currentNumberOfOrders: Math.max(0, captain.currentNumberOfOrders),
      });

      const updated = await tx.order.update({
        where: { id_tenantId: { id: BigInt(orderId), tenantId } },
        data: {
          captainId: null,
          status: "COUNTER_OFFER_ACCEPTED",
          acceptedByCapta: null,
        },
      });

      // Notify all available captains
      setImmediate(async () => {
        try {
          await notificationService.sendToAllAvailableCaptains(
            "طلب توصيل متاح",
            "طلب توصيل أصبح متاحًا مجددًا. تحقق من التطبيق للقبول.",
            { orderId: orderId.toString(), type: "DELIVERY_AVAILABLE" },
            tenantId,
          );
        } catch (e) {
          console.error("releaseCaptain notify error:", e);
        }
      });

      return convertBigIntToString(updated);
    });
  }

  // Admin: cancel an order at any point (including after captain acceptance)
  async adminCancelOrder(orderId, tenantId) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          id: BigInt(orderId),
          tenantId,
          status: { notIn: ["DELIVERED", "CANCELLED"] },
        },
        select: { id: true, captainId: true, userId: true, vendorId: true },
      });
      if (!order)
        throw new Error(
          "Order not found or cannot be cancelled (already delivered/cancelled)",
        );

      if (order.captainId) {
        await tx.captain.update({
          where: { id_tenantId: { id: order.captainId, tenantId } },
          data: { currentNumberOfOrders: { decrement: 1 } },
        });

        const captain = await tx.captain.findUnique({
          where: { id_tenantId: { id: order.captainId, tenantId } },
          select: { currentNumberOfOrders: true },
        });
        updateCaptainOrderCountsInCache(order.captainId.toString(), tenantId, {
          currentNumberOfOrders: Math.max(0, captain.currentNumberOfOrders),
        });
      }

      const updated = await tx.order.update({
        where: { id_tenantId: { id: BigInt(orderId), tenantId } },
        data: { status: "CANCELLED" },
      });

      setImmediate(async () => {
        try {
          if (order.captainId) {
            await notificationService.sendToCaptain(
              order.captainId,
              "تم إلغاء الطلب",
              "قام المدير بإلغاء أحد الطلبات المسندة إليك.",
              tenantId,
              { orderId: orderId.toString(), type: "ORDER_CANCELLED" },
            );
          }
          if (order.vendorId && order.vendorId !== BigInt(-1)) {
            await notificationService.notifyOrderCancelled(
              order.vendorId,
              orderId,
              tenantId,
            );
          }
        } catch (e) {
          console.error("adminCancelOrder notify error:", e);
        }
      });

      return convertBigIntToString(updated);
    });
  }

  // Admin: assign a specific captain to an order
  async assignCaptain(orderId, captainId, tenantId) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          id: BigInt(orderId),
          tenantId,
          status: {
            in: ["PENDING", "COUNTER_OFFER_ACCEPTED", "ACCEPTED_BY_CAPTAIN"],
          },
        },
        select: {
          id: true,
          captainId: true,
          userId: true,
          vendorId: true,
          deliveryPrice: true,
        },
      });
      if (!order) throw new Error("Order not found or not assignable");

      const newCaptain = await tx.captain.findUnique({
        where: { id_tenantId: { id: BigInt(captainId), tenantId } },
        select: {
          currentNumberOfOrders: true,
          maxCurrentOrders: true,
          userName: true,
          isLocked: true,
        },
      });
      if (!newCaptain) throw new Error("Captain not found");
      if (newCaptain.isLocked) throw new Error("Captain is locked");
      if (newCaptain.currentNumberOfOrders >= newCaptain.maxCurrentOrders) {
        throw new Error("Captain has reached maximum order capacity");
      }

      // If order already had a captain, decrement their count
      if (order.captainId) {
        await tx.captain.update({
          where: { id_tenantId: { id: order.captainId, tenantId } },
          data: { currentNumberOfOrders: { decrement: 1 } },
        });
        const oldCaptain = await tx.captain.findUnique({
          where: { id_tenantId: { id: order.captainId, tenantId } },
          select: { currentNumberOfOrders: true },
        });
        updateCaptainOrderCountsInCache(order.captainId.toString(), tenantId, {
          currentNumberOfOrders: Math.max(0, oldCaptain.currentNumberOfOrders),
        });
      }

      // Assign new captain
      await tx.captain.update({
        where: { id_tenantId: { id: BigInt(captainId), tenantId } },
        data: { currentNumberOfOrders: { increment: 1 } },
      });
      updateCaptainOrderCountsInCache(captainId.toString(), tenantId, {
        currentNumberOfOrders: newCaptain.currentNumberOfOrders + 1,
      });

      const updated = await tx.order.update({
        where: { id_tenantId: { id: BigInt(orderId), tenantId } },
        data: {
          captainId: BigInt(captainId),
          status: "ACCEPTED_BY_CAPTAIN",
          acceptedByCapta: new Date(),
        },
      });

      // Notify new captain and user
      setImmediate(async () => {
        try {
          await Promise.all([
            notificationService.sendToCaptain(
              captainId,
              "تم تعيينك لطلب",
              `تم تعيينك لطلب رقم ${orderId} من قِبل الإدارة.`,
              tenantId,
              { orderId: orderId.toString(), type: "CAPTAIN_ASSIGNED" },
            ),
            order.userId
              ? notificationService.sendToUser(
                  order.userId,
                  "تم تعيين كابتن",
                  "تم تعيين كابتن جديد لطلبك وهو في الطريق إليك.",
                  tenantId,
                  { orderId: orderId.toString(), type: "CAPTAIN_ASSIGNED" },
                )
              : Promise.resolve(),
          ]);
        } catch (e) {
          console.error("assignCaptain notify error:", e);
        }
      });

      return convertBigIntToString(updated);
    });
  }
}

module.exports = new OrderService();
