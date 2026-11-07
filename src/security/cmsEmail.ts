import type { EmailAdapter } from 'payload'
import { Resend } from 'resend'
/** Never use Payload's console fallback: reset tokens must not be written to logs. */
export const cmsEmail: EmailAdapter = () => ({
 name:'dealer-resend',defaultFromAddress:process.env.EMAIL_FROM || 'unconfigured@example.invalid',defaultFromName:process.env.DEALER_NAME || 'Dealer website',
 async sendEmail(message){
  if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM)throw new Error('CMS email delivery is not configured')
  const recipients=(Array.isArray(message.to)?message.to:[message.to]).flatMap(value=>typeof value==='string'?[value]:value&&typeof value==='object'&&'address' in value?[value.address]:[])
  if(!recipients.length)throw new Error('CMS email recipient missing')
  const html=typeof message.html==='string'?message.html:undefined
  const text=typeof message.text==='string'?message.text:undefined
  const result=await new Resend(process.env.RESEND_API_KEY).emails.send({from:process.env.EMAIL_FROM,to:recipients,subject:message.subject || 'Website account',...(html?{html}:{text:text || 'Please contact your website administrator.'})})
  if(result.error)throw new Error('CMS email delivery failed')
  return result.data
 }
})
