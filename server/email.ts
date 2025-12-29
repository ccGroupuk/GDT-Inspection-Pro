// Email service using Replit Resend Integration
import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email};
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
export async function getUncachableResendClient() {
  const credentials = await getCredentials();
  return {
    client: new Resend(credentials.apiKey),
    fromEmail: credentials.fromEmail
  };
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export function isEmailConfigured(): boolean {
  return !!process.env.REPLIT_CONNECTORS_HOSTNAME;
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<EmailResult> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    // Use delivered@resend.dev for testing until a custom domain is verified
    const senderEmail = 'CCC Group <delivered@resend.dev>';
    
    const result = await client.emails.send({
      from: senderEmail,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    });

    if (result.error) {
      console.error('[email] Send error:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log('[email] Sent successfully to:', to, 'ID:', result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('[email] Exception:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('Resend not connected')) {
      return { success: false, error: 'Email service not configured. Please set up the Resend integration.' };
    }
    
    return { success: false, error: errorMessage };
  }
}

export async function sendEmployeeLoginCredentials(
  to: string,
  firstName: string,
  email: string,
  password: string,
  portalUrl: string
): Promise<EmailResult> {
  const subject = 'Your CCC Group Employee Portal Login Details';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0;">CCC Group</h1>
        <p style="color: #cccccc; margin: 5px 0 0 0;">Employee Portal</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h2 style="color: #333; margin-top: 0;">Welcome, ${firstName}!</h2>
        
        <p style="color: #555; line-height: 1.6;">
          Your employee portal account has been created. You can now log in to access your timecard, view schedules, and more.
        </p>
        
        <div style="background-color: #ffffff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Your Login Details</h3>
          <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 10px 0;"><strong>Password:</strong> ${password}</p>
        </div>
        
        <p style="color: #555; line-height: 1.6;">
          For security, we recommend changing your password after your first login.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${portalUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Login to Portal
          </a>
        </div>
        
        <p style="color: #888; font-size: 12px;">
          If you didn't expect this email or have questions, please contact your manager.
        </p>
      </div>
      
      <div style="background-color: #333; padding: 15px; text-align: center;">
        <p style="color: #888; font-size: 12px; margin: 0;">
          Cardiff & Caerphilly Carpentry | CCC Group
        </p>
      </div>
    </div>
  `;

  return sendEmail(to, subject, html);
}

export async function sendClientPortalAccess(
  to: string,
  clientName: string,
  portalUrl: string,
  accessToken: string
): Promise<EmailResult> {
  const subject = 'Access Your CCC Group Client Portal';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0;">CCC Group</h1>
        <p style="color: #cccccc; margin: 5px 0 0 0;">Client Portal</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h2 style="color: #333; margin-top: 0;">Hello, ${clientName}!</h2>
        
        <p style="color: #555; line-height: 1.6;">
          You've been granted access to your CCC Group Client Portal. Here you can view your projects, accept quotes, and track progress.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${portalUrl}?token=${accessToken}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Access Your Portal
          </a>
        </div>
        
        <p style="color: #888; font-size: 12px;">
          This link is unique to you. Please don't share it with others.
        </p>
      </div>
      
      <div style="background-color: #333; padding: 15px; text-align: center;">
        <p style="color: #888; font-size: 12px; margin: 0;">
          Cardiff & Caerphilly Carpentry | CCC Group
        </p>
      </div>
    </div>
  `;

  return sendEmail(to, subject, html);
}

export async function sendPartnerPortalAccess(
  to: string,
  partnerName: string,
  portalUrl: string,
  accessToken: string
): Promise<EmailResult> {
  const subject = 'Access Your CCC Group Partner Portal';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0;">CCC Group</h1>
        <p style="color: #cccccc; margin: 5px 0 0 0;">Trade Partner Portal</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h2 style="color: #333; margin-top: 0;">Hello, ${partnerName}!</h2>
        
        <p style="color: #555; line-height: 1.6;">
          You've been granted access to your CCC Group Partner Portal. Here you can view assigned jobs, check schedules, and submit proposals.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${portalUrl}?token=${accessToken}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Access Your Portal
          </a>
        </div>
        
        <p style="color: #888; font-size: 12px;">
          This link is unique to you. Please don't share it with others.
        </p>
      </div>
      
      <div style="background-color: #333; padding: 15px; text-align: center;">
        <p style="color: #888; font-size: 12px; margin: 0;">
          Cardiff & Caerphilly Carpentry | CCC Group
        </p>
      </div>
    </div>
  `;

  return sendEmail(to, subject, html);
}

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  resetUrl: string,
  expiresIn: string = '1 hour'
): Promise<EmailResult> {
  const subject = 'Reset Your CCC Group Password';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0;">CCC Group</h1>
        <p style="color: #cccccc; margin: 5px 0 0 0;">Password Reset</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h2 style="color: #333; margin-top: 0;">Hi ${firstName},</h2>
        
        <p style="color: #555; line-height: 1.6;">
          We received a request to reset your password. Click the button below to create a new password.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #888; font-size: 12px;">
          This link expires in ${expiresIn}. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
      
      <div style="background-color: #333; padding: 15px; text-align: center;">
        <p style="color: #888; font-size: 12px; margin: 0;">
          Cardiff & Caerphilly Carpentry | CCC Group
        </p>
      </div>
    </div>
  `;

  return sendEmail(to, subject, html);
}

export async function sendJobReminder(
  to: string,
  recipientName: string,
  jobTitle: string,
  jobAddress: string,
  scheduledDate: string,
  scheduledTime: string,
  notes?: string
): Promise<EmailResult> {
  const subject = `Reminder: ${jobTitle} - ${scheduledDate}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0;">CCC Group</h1>
        <p style="color: #cccccc; margin: 5px 0 0 0;">Job Reminder</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h2 style="color: #333; margin-top: 0;">Hi ${recipientName},</h2>
        
        <p style="color: #555; line-height: 1.6;">
          This is a reminder about an upcoming job:
        </p>
        
        <div style="background-color: #ffffff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">${jobTitle}</h3>
          <p style="margin: 10px 0;"><strong>Date:</strong> ${scheduledDate}</p>
          <p style="margin: 10px 0;"><strong>Time:</strong> ${scheduledTime}</p>
          <p style="margin: 10px 0;"><strong>Location:</strong> ${jobAddress}</p>
          ${notes ? `<p style="margin: 10px 0;"><strong>Notes:</strong> ${notes}</p>` : ''}
        </div>
        
        <p style="color: #888; font-size: 12px;">
          Please ensure you arrive on time and have all necessary equipment.
        </p>
      </div>
      
      <div style="background-color: #333; padding: 15px; text-align: center;">
        <p style="color: #888; font-size: 12px; margin: 0;">
          Cardiff & Caerphilly Carpentry | CCC Group
        </p>
      </div>
    </div>
  `;

  return sendEmail(to, subject, html);
}

export async function sendQuoteNotification(
  to: string,
  clientName: string,
  jobTitle: string,
  quoteAmount: string,
  portalUrl: string,
  accessToken: string
): Promise<EmailResult> {
  const subject = `New Quote Available: ${jobTitle}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0;">CCC Group</h1>
        <p style="color: #cccccc; margin: 5px 0 0 0;">Quote Notification</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h2 style="color: #333; margin-top: 0;">Hello ${clientName},</h2>
        
        <p style="color: #555; line-height: 1.6;">
          A new quote is ready for your review:
        </p>
        
        <div style="background-color: #ffffff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <h3 style="color: #333; margin-top: 0;">${jobTitle}</h3>
          <p style="font-size: 24px; color: #4f46e5; font-weight: bold; margin: 15px 0;">${quoteAmount}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${portalUrl}?token=${accessToken}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Quote Details
          </a>
        </div>
        
        <p style="color: #888; font-size: 12px;">
          Log in to your client portal to review the full quote and accept or request changes.
        </p>
      </div>
      
      <div style="background-color: #333; padding: 15px; text-align: center;">
        <p style="color: #888; font-size: 12px; margin: 0;">
          Cardiff & Caerphilly Carpentry | CCC Group
        </p>
      </div>
    </div>
  `;

  return sendEmail(to, subject, html);
}

export async function sendMotReminder(
  to: string,
  employeeName: string,
  assetName: string,
  registrationNumber: string,
  motDate: string,
  daysUntilDue: number
): Promise<EmailResult> {
  const urgencyText = daysUntilDue < 0 
    ? `is ${Math.abs(daysUntilDue)} days overdue` 
    : daysUntilDue === 0 
    ? 'expires today' 
    : `expires in ${daysUntilDue} days`;
  
  const subject = `MOT Reminder: ${assetName} ${urgencyText}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0;">CCC Group</h1>
        <p style="color: #cccccc; margin: 5px 0 0 0;">Asset Management</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h2 style="color: #333; margin-top: 0;">MOT Reminder</h2>
        
        <p style="color: #555; line-height: 1.6;">
          Hi ${employeeName},
        </p>
        
        <p style="color: #555; line-height: 1.6;">
          This is a reminder that the MOT for the following vehicle ${urgencyText}:
        </p>
        
        <div style="background-color: #ffffff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 10px 0;"><strong>Vehicle:</strong> ${assetName}</p>
          <p style="margin: 10px 0;"><strong>Registration:</strong> ${registrationNumber}</p>
          <p style="margin: 10px 0;"><strong>MOT Expiry:</strong> ${motDate}</p>
          <p style="margin: 10px 0; color: ${daysUntilDue <= 7 ? '#dc2626' : '#d97706'};"><strong>Status:</strong> ${daysUntilDue < 0 ? 'OVERDUE' : daysUntilDue === 0 ? 'EXPIRES TODAY' : `${daysUntilDue} days remaining`}</p>
        </div>
        
        <p style="color: #555; line-height: 1.6;">
          Please ensure the MOT is renewed promptly to avoid any disruption to vehicle use.
        </p>
      </div>
      
      <div style="background-color: #333; padding: 15px; text-align: center;">
        <p style="color: #888; font-size: 12px; margin: 0;">
          Cardiff & Caerphilly Carpentry | CCC Group
        </p>
      </div>
    </div>
  `;

  return sendEmail(to, subject, html);
}

export async function sendGenericEmail(
  to: string,
  subject: string,
  message: string,
  recipientName?: string
): Promise<EmailResult> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0;">CCC Group</h1>
      </div>
      
      <div style="padding: 30px; background-color: #f9f9f9;">
        ${recipientName ? `<h2 style="color: #333; margin-top: 0;">Hi ${recipientName},</h2>` : ''}
        
        <div style="color: #555; line-height: 1.6;">
          ${message.replace(/\n/g, '<br>')}
        </div>
      </div>
      
      <div style="background-color: #333; padding: 15px; text-align: center;">
        <p style="color: #888; font-size: 12px; margin: 0;">
          Cardiff & Caerphilly Carpentry | CCC Group
        </p>
      </div>
    </div>
  `;

  return sendEmail(to, subject, html);
}
