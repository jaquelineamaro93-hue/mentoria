const MP_API='https://api.mercadopago.com';

function token(){
 const value=process.env.MERCADOPAGO_ACCESS_TOKEN;
 if(!value)throw Error('Mercado Pago não está configurado.');
 return value;
}

export async function criarAssinaturaModuloMP(params:{
  email:string;valorMensal:number;titulo:string;externalReference:string;
}):Promise<{id:string;init_point:string}> {
 const site=process.env.NEXT_PUBLIC_SITE_URL || 'https://somamentoria.com';
 const response=await fetch(MP_API+'/preapproval',{
  method:'POST',cache:'no-store',
  headers:{Authorization:'Bearer '+token(),'Content-Type':'application/json'},
  body:JSON.stringify({
   reason:'SOMA | '+params.titulo,
   payer_email:params.email,
   external_reference:params.externalReference,
   back_url:site+'/modulos',
   auto_recurring:{
    frequency:1,frequency_type:'months',
    transaction_amount:params.valorMensal,currency_id:'BRL',
   },
   status:'pending',
  }),
 });
 if(!response.ok)throw Error('Mercado Pago não conseguiu criar a assinatura ('+response.status+').');
 const body=await response.json();
 if(typeof body.id!=='string'||typeof body.init_point!=='string'||
   !/^https:\/\/[^ ]+$/.test(body.init_point))
   throw Error('Resposta de cobrança inválida.');
 return{id:body.id,init_point:body.init_point};
}

export async function cancelarAssinaturaModuloMP(preapprovalId:string){
 if(!preapprovalId)throw Error('Assinatura não encontrada');
 const response=await fetch(MP_API+'/preapproval/'+encodeURIComponent(preapprovalId),{
  method:'PUT',cache:'no-store',headers:{
   Authorization:'Bearer '+token(),'Content-Type':'application/json',
  },body:JSON.stringify({status:'cancelled'}),
 });
 if(!response.ok)throw Error('Não foi possível cancelar no Mercado Pago ('+response.status+').');
 const data=await response.json();
 // Só cancela localmente depois da confirmação da operadora.
 if(!['cancelled','canceled'].includes(String(data.status)))
   throw Error('O Mercado Pago ainda não confirmou o cancelamento.');
 return data;
}
