import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheManagerStore } from 'cache-manager';
import nodemailer from 'nodemailer'
import { VerifyOtpDto } from 'src/features/users/auth/dto/verify-otp.dto';

@Injectable()
export class OtpService {
    private readonly tabanSmsUrl: string
    private readonly tabanSmsKey: string

    constructor(
      @Inject(CACHE_MANAGER) private cacheManager: CacheManagerStore,
      private readonly configService: ConfigService,
    ) {
      this.tabanSmsUrl = this.configService.get<string>('TABAN_SMS_URL', ''),
      this.tabanSmsKey = this.configService.get<string>('TABAN_SMS_key', '')
    }

    private generateOtp(): string {
        return Math.floor(1000 + Math.random() * 9000).toString()
    }

    async sendOtpToPhone(phoneNumber: string): Promise<string> {
        const otp = this.generateOtp()
        await this.cacheManager.set(phoneNumber, otp, 300000)

        try {
            // const response = await axios.post(this.tabanSmsUrl, {
            //     apiKey: this.tabanSmsKey,
            //     mobile: phoneNumber,
            //     message: `کد تایید شما: ${otp}`,
            // });

            // if (response.data.status !== 'success') {
            //     throw new Error('Failed to send SMS');
            // }
            console.log(`Mock SMS sent to ${phoneNumber}: otp: ${otp}`);
            return 'OTP sent successfully to phone';
        } catch (err) {
            throw new HttpException('Failed to send SMS', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


  async verifyOtp(identifier: string, otp: string): Promise<boolean> {
    const storedOtp = await this.cacheManager.get(identifier);

    console.log(storedOtp, otp)
    if (!storedOtp) {
      throw new HttpException('otp expired', HttpStatus.BAD_REQUEST);
    }
    
    if (storedOtp !== otp) {
      throw new HttpException('otp not correct', HttpStatus.BAD_REQUEST);
    }

    await this.cacheManager.del(identifier); 
    return true;
  }

  async sendOtpToEmail(email: string): Promise<string> {
    const otp = this.generateOtp();
    await this.cacheManager.set(email, otp, 300000); // Store OTP for 5 minutes

    // const transporter = nodemailer.createTransport({
    //   host: 'smtp.ethereal.email', // Use a local email provider in Iran
    //   port: 587, // Change to 465 if SSL is required
    //   secure: false,
    //   auth: {
    //     user: testAccount.user, 
    //     pass: testAccount.pass,     
    //   },
    // });

    // const mailOptions = {
    //   from: 'your-email@yourdomain.com',
    //   to: email,
    //   subject: 'کد تایید شما',
    //   text: `کد تایید شما: ${otp}`,
    // };

    // Mock email transporter
    const transporter = nodemailer.createTransport({
        jsonTransport: true, // Prevents actual sending, logs email as JSON
    });

    const mailOptions = {
        from: 'your-email@yourdomain.com',
        to: email,
        subject: 'کد تایید شما',
        text: `کد تایید شما: ${otp}`,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Mock email sent:', info);
        return 'OTP sent successfully to email (mock)';
    } catch (error) {
        throw new HttpException('Failed to send email', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
