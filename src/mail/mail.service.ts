import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendMail(
    email: string,
    template: string,
    context: object = {},
    subject = '',
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject,
        template,
        context,
      });
    } catch (error) {
      console.error('Error sending email:', {
        to: email,
        template,
        subject,
        error: error.message,
        code: error.code,
        address: error.address,
        port: error.port,
      });
      throw new ServiceUnavailableException("Couldn't send email");
    }
  }
}
