import * as nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

export class EmailService {
  private transporter: nodemailer.Transporter;
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
    // For development, we'll use a test account
    // In production, configure with your actual SMTP settings
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  /**
   * Get studio settings for email templates
   */
  private async getStudioSettings() {
    try {
      const settings = await this.prisma.studioSettings.findFirst();
      if (settings) {
        return {
          studioName: settings.studioName,
          address: settings.address,
          city: settings.city,
          phone: settings.phone,
          email: settings.email,
          website: settings.website
        };
      }
    } catch (error) {
      console.error('Error fetching studio settings:', error);
    }
    
    // Fallback values if database query fails
    return {
      studioName: 'Kinetica Fisioterapia Genova',
      address: 'Via Giovanni Tommaso Invrea 20/2',
      city: 'Genova',
      phone: '+39 010 817 6855',
      email: 'amministrazione.kinetica@gmail.com',
      website: null
    };
  }

  /**
   * Generate footer HTML with studio info
   */
  private async getEmailFooter(): Promise<string> {
    const studio = await this.getStudioSettings();
    return `
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      
      <p style="color: #666; font-size: 14px;">
        <strong>${studio.studioName}</strong><br>
        ${studio.address}, ${studio.city}<br>
        Tel: ${studio.phone}<br>
        Email: ${studio.email}
      </p>
    `;
  }

  /**
   * Send verification email for new registration
   */
  async sendVerificationEmail(email: string, otp: string, firstName: string): Promise<void> {
    const studio = await this.getStudioSettings();
    const footer = await this.getEmailFooter();
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || `noreply@${studio.email.split('@')[1]}`,
      to: email,
      subject: `Verifica il tuo account - ${studio.studioName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #3da4db; color: white; padding: 20px; text-align: center;">
            <h1>Benvenuto in ${studio.studioName}!</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Ciao ${firstName},</p>
            
            <p>Grazie per esserti registrato su ${studio.studioName}. Per completare la registrazione, inserisci il seguente codice di verifica:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #3da4db; color: white; padding: 20px; font-size: 24px; font-weight: bold; border-radius: 8px; display: inline-block; letter-spacing: 3px;">
                ${otp}
              </div>
            </div>
            
            <p>Questo codice è valido per 10 minuti.</p>
            
            <p>Se non hai richiesto questa registrazione, puoi ignorare questa email.</p>
            
            ${footer}
          </div>
        </div>
      `,
    };

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email would be sent to:', email);
        console.log('🔐 OTP Code:', otp);
        console.log('📝 Subject:', mailOptions.subject);
        return;
      }
      
      await this.transporter.sendMail(mailOptions);
      console.log('📧 Verification email sent to:', email);
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send OTP for login verification
   */
  async sendLoginOTP(email: string, otp: string, firstName: string): Promise<void> {
    const studio = await this.getStudioSettings();
    const footer = await this.getEmailFooter();
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || `noreply@${studio.email.split('@')[1]}`,
      to: email,
      subject: `Codice di accesso - ${studio.studioName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #3da4db; color: white; padding: 20px; text-align: center;">
            <h1>Accesso Sicuro</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Ciao ${firstName},</p>
            
            <p>È stato richiesto l'accesso al tuo account. Inserisci il seguente codice per completare il login:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #3da4db; color: white; padding: 20px; font-size: 24px; font-weight: bold; border-radius: 8px; display: inline-block; letter-spacing: 3px;">
                ${otp}
              </div>
            </div>
            
            <p>Questo codice è valido per 10 minuti.</p>
            
            <p>Se non hai richiesto questo accesso, contattaci immediatamente.</p>
            
            ${footer}
          </div>
        </div>
      `,
    };

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Login OTP email would be sent to:', email);
        console.log('🔐 OTP Code:', otp);
        return;
      }
      
      await this.transporter.sendMail(mailOptions);
      console.log('📧 Login OTP email sent to:', email);
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send login OTP email');
    }
  }

  /**
   * Send OTP for password reset
   */
  async sendPasswordResetOTP(email: string, otp: string, firstName: string): Promise<void> {
    const studio = await this.getStudioSettings();
    const footer = await this.getEmailFooter();
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || `noreply@${studio.email.split('@')[1]}`,
      to: email,
      subject: `Reset Password - ${studio.studioName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;">
            <h1>Reset Password</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Ciao ${firstName},</p>
            
            <p>È stata richiesta la reimpostazione della password per il tuo account. Inserisci il seguente codice per procedere:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #dc3545; color: white; padding: 20px; font-size: 24px; font-weight: bold; border-radius: 8px; display: inline-block; letter-spacing: 3px;">
                ${otp}
              </div>
            </div>
            
            <p>Questo codice è valido per 10 minuti.</p>
            
            <p><strong>Se non hai richiesto la reimpostazione della password, ignora questa email e contattaci immediatamente.</strong></p>
            
            ${footer}
          </div>
        </div>
      `,
    };

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Password reset email would be sent to:', email);
        console.log('🔐 OTP Code:', otp);
        return;
      }
      
      await this.transporter.sendMail(mailOptions);
      console.log('📧 Password reset email sent to:', email);
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(
    email: string, 
    firstName: string, 
    bookingDetails: {
      id: string;
      serviceName: string;
      date: string;
      time: string;
      therapistName: string;
      duration: number;
      price: number;
      notes?: string;
    }
  ): Promise<void> {
    const studio = await this.getStudioSettings();
    const footer = await this.getEmailFooter();
    
    const formattedDate = new Date(bookingDetails.date).toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const mailOptions = {
      from: process.env.FROM_EMAIL || `noreply@${studio.email.split('@')[1]}`,
      to: email,
      subject: `Conferma Prenotazione - ${studio.studioName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #3da4db; color: white; padding: 20px; text-align: center;">
            <h1>Prenotazione Confermata!</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Ciao ${firstName},</p>
            
            <p>La tua prenotazione è stata confermata con successo!</p>
            
            <div style="background-color: white; border: 2px solid #3da4db; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #3da4db; margin-top: 0;">Dettagli Prenotazione</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">ID Prenotazione:</td>
                  <td style="padding: 8px 0; color: #666;">#${bookingDetails.id.slice(-8).toUpperCase()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Servizio:</td>
                  <td style="padding: 8px 0; color: #666;">${bookingDetails.serviceName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Data:</td>
                  <td style="padding: 8px 0; color: #666;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Orario:</td>
                  <td style="padding: 8px 0; color: #666;">${bookingDetails.time}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Durata:</td>
                  <td style="padding: 8px 0; color: #666;">${bookingDetails.duration} minuti</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Terapista:</td>
                  <td style="padding: 8px 0; color: #666;">${bookingDetails.therapistName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Costo:</td>
                  <td style="padding: 8px 0; color: #666;">€${bookingDetails.price}</td>
                </tr>
              </table>
              ${bookingDetails.notes ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                  <p style="margin: 0; font-weight: bold; color: #333;">Note:</p>
                  <p style="margin: 5px 0 0 0; color: #666;">${bookingDetails.notes}</p>
                </div>
              ` : ''}
            </div>
            
            <div style="background-color: #e8f4f8; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h4 style="color: #3da4db; margin-top: 0;">Informazioni Importanti</h4>
              <ul style="color: #666; padding-left: 20px;">
                <li>Ti inviamo questo promemoria 24 ore prima del tuo appuntamento</li>
                <li>Se hai bisogno di modificare o cancellare, fallo almeno 48 ore prima</li>
                <li>Porta con te un documento d'identità</li>
                <li>Arriva 10 minuti prima per completare eventuali pratiche</li>
              </ul>
            </div>
            
            <p>Se hai domande o hai bisogno di modificare la prenotazione, non esitare a contattarci.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="tel:${studio.phone.replace(/\s/g, '')}" style="background-color: #3da4db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                📞 Chiama: ${studio.phone}
              </a>
            </div>
            
            ${footer}
          </div>
        </div>
      `,
    };

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Booking confirmation email would be sent to:', email);
        console.log('📋 Booking Details:', bookingDetails);
        return;
      }
      
      await this.transporter.sendMail(mailOptions);
      console.log('📧 Booking confirmation email sent to:', email);
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send booking confirmation email');
    }
  }

  /**
   * Send booking reminder email (24h before appointment)
   */
  async sendBookingReminder(
    email: string, 
    firstName: string, 
    bookingDetails: {
      id: string;
      serviceName: string;
      date: string;
      time: string;
      therapistName: string;
      duration: number;
      notes?: string;
    }
  ): Promise<void> {
    const studio = await this.getStudioSettings();
    const footer = await this.getEmailFooter();
    
    const formattedDate = new Date(bookingDetails.date).toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const mailOptions = {
      from: process.env.FROM_EMAIL || `noreply@${studio.email.split('@')[1]}`,
      to: email,
      subject: `Promemoria Appuntamento - Domani - ${studio.studioName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center;">
            <h1>🕒 Promemoria Appuntamento</h1>
            <h2 style="margin: 0;">Il tuo appuntamento è domani!</h2>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Ciao ${firstName},</p>
            
            <p>Ti ricordiamo che hai un appuntamento <strong>domani</strong> presso il nostro centro.</p>
            
            <div style="background-color: white; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #f59e0b; margin-top: 0;">Dettagli Appuntamento</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Servizio:</td>
                  <td style="padding: 8px 0; color: #666;">${bookingDetails.serviceName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Data:</td>
                  <td style="padding: 8px 0; color: #666;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Orario:</td>
                  <td style="padding: 8px 0; color: #666; font-size: 18px; font-weight: bold;">${bookingDetails.time}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Durata:</td>
                  <td style="padding: 8px 0; color: #666;">${bookingDetails.duration} minuti</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Terapista:</td>
                  <td style="padding: 8px 0; color: #666;">${bookingDetails.therapistName}</td>
                </tr>
              </table>
              ${bookingDetails.notes ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                  <p style="margin: 0; font-weight: bold; color: #333;">Note:</p>
                  <p style="margin: 5px 0 0 0; color: #666;">${bookingDetails.notes}</p>
                </div>
              ` : ''}
            </div>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <h4 style="color: #92400e; margin-top: 0;">⚠️ Promemoria Importante</h4>
              <ul style="color: #92400e; padding-left: 20px; margin: 0;">
                <li><strong>Arriva 10 minuti prima</strong> per completare le pratiche</li>
                <li><strong>Porta un documento d'identità</strong></li>
                <li>Se devi cancellare, <strong>fallo il prima possibile</strong></li>
                <li>Per modifiche urgenti chiama direttamente il centro</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #666; margin-bottom: 15px;">Hai domande o hai bisogno di modificare l'appuntamento?</p>
              <a href="tel:${studio.phone.replace(/\s/g, '')}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 10px;">
                📞 Chiama Ora
              </a>
              <a href="https://wa.me/${studio.phone.replace(/\s/g, '').replace('+', '')}" style="background-color: #25d366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 10px;">
                💬 WhatsApp
              </a>
            </div>
            
            <p style="text-align: center; color: #666;">
              <strong>Ci vediamo domani!</strong><br>
              Lo staff di ${studio.studioName}
            </p>
            
            ${footer}
          </div>
        </div>
      `,
    };

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Booking reminder email would be sent to:', email);
        console.log('⏰ Reminder Details:', bookingDetails);
        return;
      }
      
      await this.transporter.sendMail(mailOptions);
      console.log('📧 Booking reminder email sent to:', email);
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send booking reminder email');
    }
  }

  /**
   * Send booking cancellation confirmation email
   */
  async sendBookingCancellation(
    email: string, 
    firstName: string, 
    bookingDetails: {
      id: string;
      serviceName: string;
      date: string;
      time: string;
      therapistName: string;
    }
  ): Promise<void> {
    const studio = await this.getStudioSettings();
    const footer = await this.getEmailFooter();
    
    const formattedDate = new Date(bookingDetails.date).toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const mailOptions = {
      from: process.env.FROM_EMAIL || `noreply@${studio.email.split('@')[1]}`,
      to: email,
      subject: `Prenotazione Annullata - ${studio.studioName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;">
            <h1>Prenotazione Annullata</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Ciao ${firstName},</p>
            
            <p>La tua prenotazione è stata annullata come richiesto.</p>
            
            <div style="background-color: white; border: 2px solid #dc3545; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #dc3545; margin-top: 0;">Prenotazione Annullata</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">ID Prenotazione:</td>
                  <td style="padding: 8px 0; color: #666;">#${bookingDetails.id.slice(-8).toUpperCase()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Servizio:</td>
                  <td style="padding: 8px 0; color: #666;">${bookingDetails.serviceName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Data:</td>
                  <td style="padding: 8px 0; color: #666;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Orario:</td>
                  <td style="padding: 8px 0; color: #666;">${bookingDetails.time}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Terapista:</td>
                  <td style="padding: 8px 0; color: #666;">${bookingDetails.therapistName}</td>
                </tr>
              </table>
            </div>
            
            <p>Speriamo di rivederti presto nel nostro centro!</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/prenota" style="background-color: #3da4db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                📅 Prenota Nuovo Appuntamento
              </a>
            </div>
            
            ${footer}
          </div>
        </div>
      `,
    };

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Booking cancellation email would be sent to:', email);
        console.log('🚫 Cancellation Details:', bookingDetails);
        return;
      }
      
      await this.transporter.sendMail(mailOptions);
      console.log('📧 Booking cancellation email sent to:', email);
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send booking cancellation email');
    }
  }
}