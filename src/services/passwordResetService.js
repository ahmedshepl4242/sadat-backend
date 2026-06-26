const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../utils/prisma');
const { hashPassword } = require('../utils/helpers');
const { sendOtpEmail } = require('./emailService');

const OTP_EXPIRY_MINUTES = 10;
const RESET_TOKEN_EXPIRY_SECONDS = 300; // 5 minutes

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Step 1 — send OTP to email
const sendOtp = async (email, role, tenantId) => {
  // Verify the email belongs to a real account in this tenant
  let record;
  if (role === 'user') {
    record = await prisma.user.findFirst({
      where: { email, tenantId },
      select: { id: true },
    });
  } else if (role === 'captain') {
    record = await prisma.captain.findFirst({
      where: { email, tenantId },
      select: { id: true },
    });
  } else {
    throw new Error('نوع المستخدم غير صحيح');
  }

  if (!record) {
    // Return success anyway to avoid email enumeration
    return { message: 'إذا كان البريد الإلكتروني مسجلاً، ستصل رسالة بالرمز' };
  }

  // Invalidate any previous unused tokens for this email+role+tenant
  await prisma.passwordResetToken.updateMany({
    where: { email, role, tenantId, used: false },
    data: { used: true },
  });

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { tenantId, email, role, otpHash, expiresAt },
  });

  await sendOtpEmail(email, otp);

  return { message: 'إذا كان البريد الإلكتروني مسجلاً، ستصل رسالة بالرمز' };
};

// Step 2 — verify OTP, return short-lived reset token
const verifyOtp = async (email, role, otp, tenantId) => {
  const token = await prisma.passwordResetToken.findFirst({
    where: {
      email,
      role,
      tenantId,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!token) {
    throw new Error('الرمز غير صحيح أو منتهي الصلاحية');
  }

  const valid = await bcrypt.compare(otp, token.otpHash);
  if (!valid) {
    throw new Error('الرمز غير صحيح أو منتهي الصلاحية');
  }

  // Mark token as used
  await prisma.passwordResetToken.update({
    where: { id: token.id },
    data: { used: true },
  });

  // Issue a short-lived reset JWT (not an auth token — role prefixed)
  const resetToken = jwt.sign(
    { email, role, tenantId, purpose: 'password_reset' },
    process.env.JWT_SECRET,
    { expiresIn: RESET_TOKEN_EXPIRY_SECONDS }
  );

  return { resetToken };
};

// Step 3 — set new password using the reset token
const resetPassword = async (resetToken, newPassword) => {
  let decoded;
  try {
    decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
  } catch {
    throw new Error('رمز إعادة التعيين غير صحيح أو منتهي الصلاحية');
  }

  if (decoded.purpose !== 'password_reset') {
    throw new Error('رمز غير صالح');
  }

  const { email, role, tenantId } = decoded;
  const hashed = await hashPassword(newPassword);

  if (role === 'user') {
    const user = await prisma.user.findFirst({
      where: { email, tenantId },
      select: { id: true, tenantId: true },
    });
    if (!user) throw new Error('المستخدم غير موجود');
    await prisma.user.update({
      where: { id_tenantId: { id: user.id, tenantId } },
      data: { password: hashed },
    });
  } else if (role === 'captain') {
    const captain = await prisma.captain.findFirst({
      where: { email, tenantId },
      select: { id: true, tenantId: true },
    });
    if (!captain) throw new Error('الكابتن غير موجود');
    await prisma.captain.update({
      where: { id_tenantId: { id: captain.id, tenantId } },
      data: { password: hashed },
    });
  } else {
    throw new Error('نوع المستخدم غير صحيح');
  }

  return { message: 'تم تغيير كلمة المرور بنجاح' };
};

module.exports = { sendOtp, verifyOtp, resetPassword };
