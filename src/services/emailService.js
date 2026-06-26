const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const sendOtpEmail = async (to, otp) => {
  await transporter.sendMail({
    from: `"تعالالي - T3alaly" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'رمز إعادة تعيين كلمة المرور',
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #1565C0;">إعادة تعيين كلمة المرور</h2>
        <p>مرحباً،</p>
        <p>استخدم الرمز التالي لإعادة تعيين كلمة المرور الخاصة بك:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1565C0; text-align: center; padding: 16px; background: #E3F2FD; border-radius: 8px; margin: 16px 0;">
          ${otp}
        </div>
        <p style="color: #666;">صالح لمدة <strong>10 دقائق</strong> فقط.</p>
        <p style="color: #666;">إذا لم تطلب هذا، تجاهل الرسالة.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 16px 0;" />
        <p style="font-size: 12px; color: #999;">تعالالي لخدمات التوصيل</p>
      </div>
    `,
  });
};

module.exports = { sendOtpEmail };
