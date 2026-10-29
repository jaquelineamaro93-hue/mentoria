import {createHmac,timingSafeEqual} from 'node:crypto';
export function newsletterToken(id:string,secret:string){return createHmac('sha256',secret).update('soma-newsletter:'+id).digest('hex');}
export function validNewsletterToken(id:string,token:string,secret:string|undefined){if(!secret||!/^[a-f0-9-]{36}$/i.test(id)||!/^[a-f0-9]{64}$/i.test(token))return false;return timingSafeEqual(Buffer.from(newsletterToken(id,secret)),Buffer.from(token.toLowerCase()));}
