import { Controller, Get } from '@nestjs/common';
import { MailService } from './mail.service';

//Test email
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get('/')
  async sendEmail() {
    return await this.mailService.sendMail(
      'feldmanaaron406@gmail.com',
      'email',
      { name: 'Aaron' },
    );
  }
}
