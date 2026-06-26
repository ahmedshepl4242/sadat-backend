const userService = require('../services/userService');
const vendorService = require('../services/vendorService');
const captainService = require('../services/captainService');
const adminService = require('../services/adminService');
const passwordResetService = require('../services/passwordResetService');
const { successResponse, errorResponse } = require('../utils/helpers');

class AuthController {
  // User signup
  async userSignup(req, res) {
    try {
      const result = await userService.signup(req.body, req.tenant.id);
      return successResponse(res, result, 'User registered successfully', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // User login
  async userLogin(req, res) {
    try {
      const { email, password } = req.body;
      const result = await userService.login(email, password, req.tenant.id);
      return successResponse(res, result, 'User logged in successfully');
    } catch (error) {
      return errorResponse(res, error.message, 401);
    }
  }

  // Vendor signup
  async vendorSignup(req, res) {
    try {
      const result = await vendorService.signup(req.body, req.tenant.id);
      return successResponse(res, result, 'Vendor registered successfully', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Vendor login
  async vendorLogin(req, res) {
    try {
      const { contactNumber, password } = req.body;
      const result = await vendorService.login(contactNumber, password, req.tenant.id);
      return successResponse(res, result, 'Vendor logged in successfully');
    } catch (error) {
      return errorResponse(res, error.message, 401);
    }
  }

  // Captain signup
  async captainSignup(req, res) {
    try {
      const photo = req.file; // Multer populates this with the uploaded file
      const result = await captainService.signup(req.body, photo, req.tenant.id);
      return successResponse(res, result, 'Captain registered successfully', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Captain login
  async captainLogin(req, res) {
    try {
      const { email, password } = req.body;
      const result = await captainService.login(email, password, req.tenant.id);
      return successResponse(res, result, 'Captain logged in successfully');
    } catch (error) {
      return errorResponse(res, error.message, 401);
    }
  }

  // Admin signup
  async adminSignup(req, res) {
    try {
      const result = await adminService.signup(req.body);
      return successResponse(res, result, 'Admin registered successfully', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Admin login
  async adminLogin(req, res) {
    try {
      const { email, password } = req.body;
      const result = await adminService.login(email, password, req.tenant.id);
      return successResponse(res, result, 'Admin logged in successfully');
    } catch (error) {
      return errorResponse(res, error.message, 401);
    }
  }

  // User refresh token
  async userRefreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      const result = await userService.refreshToken(refreshToken, req.tenant.id);
      return successResponse(res, result, 'Tokens refreshed successfully');
    } catch (error) {
      return errorResponse(res, error.message, 401);
    }
  }

  // Vendor refresh token
  async vendorRefreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      const result = await vendorService.refreshToken(refreshToken, req.tenant.id);
      return successResponse(res, result, 'Tokens refreshed successfully');
    } catch (error) {
      return errorResponse(res, error.message, 401);
    }
  }

  // Captain refresh token
  async captainRefreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      const result = await captainService.refreshToken(refreshToken, req.tenant.id);
      return successResponse(res, result, 'Tokens refreshed successfully');
    } catch (error) {
      return errorResponse(res, error.message, 401);
    }
  }

  // Admin refresh token
  async adminRefreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      const result = await adminService.refreshToken(refreshToken, req.tenant.id);
      return successResponse(res, result, 'Tokens refreshed successfully');
    } catch (error) {
      return errorResponse(res, error.message, 401);
    }
  }

  // Unified refresh token handler
  async refreshToken(req, res) {
    try {
      const { refreshToken, type } = req.body;
      
      if (!refreshToken || !type) {
        return errorResponse(res, 'Refresh token and type are required', 400);
      }

      let result;
      
      switch (type.toLowerCase()) {
        case 'user':
          result = await userService.refreshToken(refreshToken, req.tenant.id);
          break;
        case 'vendor':
          result = await vendorService.refreshToken(refreshToken, req.tenant.id);
          break;
        case 'captain':
          result = await captainService.refreshToken(refreshToken, req.tenant.id);
          break;
        default:
          return errorResponse(res, 'Invalid user type', 400);
      }

      return successResponse(res, result, 'Tokens refreshed successfully');
    } catch (error) {
      return errorResponse(res, error.message, 401);
    }
  }
  // Forgot password — step 1: send OTP
  async forgotPassword(req, res) {
    try {
      const { email, role } = req.body;
      if (!email || !role) {
        return errorResponse(res, 'البريد الإلكتروني ونوع الحساب مطلوبان', 400);
      }
      if (!['user', 'captain'].includes(role)) {
        return errorResponse(res, 'نوع الحساب غير صحيح', 400);
      }
      const result = await passwordResetService.sendOtp(email, role, req.tenant.id);
      return successResponse(res, null, result.message);
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  // Forgot password — step 2: verify OTP
  async verifyOtp(req, res) {
    try {
      const { email, role, otp } = req.body;
      if (!email || !role || !otp) {
        return errorResponse(res, 'البريد الإلكتروني ونوع الحساب والرمز مطلوبة', 400);
      }
      const result = await passwordResetService.verifyOtp(email, role, otp, req.tenant.id);
      return successResponse(res, result, 'تم التحقق من الرمز بنجاح');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Forgot password — step 3: set new password
  async resetPassword(req, res) {
    try {
      const { resetToken, newPassword } = req.body;
      if (!resetToken || !newPassword) {
        return errorResponse(res, 'رمز إعادة التعيين وكلمة المرور الجديدة مطلوبان', 400);
      }
      if (newPassword.length < 6) {
        return errorResponse(res, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', 400);
      }
      const result = await passwordResetService.resetPassword(resetToken, newPassword);
      return successResponse(res, null, result.message);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Vendor forgot password — step 1: send OTP to contactNumber (stored as email field)
  async forgotPasswordVendor(req, res) {
    try {
      const { contactNumber } = req.body;
      if (!contactNumber) {
        return errorResponse(res, 'رقم التواصل مطلوب', 400);
      }
      const result = await passwordResetService.sendOtpVendor(contactNumber, req.tenant.id);
      return successResponse(res, null, result.message);
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  // Vendor forgot password — step 2: verify OTP
  async verifyOtpVendor(req, res) {
    try {
      const { contactNumber, otp } = req.body;
      if (!contactNumber || !otp) {
        return errorResponse(res, 'رقم التواصل والرمز مطلوبان', 400);
      }
      const result = await passwordResetService.verifyOtpVendor(contactNumber, otp, req.tenant.id);
      return successResponse(res, result, 'تم التحقق من الرمز بنجاح');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Vendor forgot password — step 3: reset password
  async resetPasswordVendor(req, res) {
    try {
      const { resetToken, newPassword } = req.body;
      if (!resetToken || !newPassword) {
        return errorResponse(res, 'رمز إعادة التعيين وكلمة المرور الجديدة مطلوبان', 400);
      }
      if (newPassword.length < 6) {
        return errorResponse(res, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', 400);
      }
      const result = await passwordResetService.resetPasswordVendor(resetToken, newPassword);
      return successResponse(res, null, result.message);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new AuthController(); 