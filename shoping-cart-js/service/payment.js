/* This program was written by zuhail pm*/
/* for more details :github/zuhl-c*/

var db=require('../config/connection');
var collection=require('../config/collections');
var Message=require('./messages')
const objectId=require('mongodb').ObjectID;
var  date = require('date-and-time');
var Razorpay=require('razorpay');
var message = new Message()

var instance = new Razorpay({
    key_id: 'rzp_test_uWu157JMmfMDhI',
    key_secret: 'u4SJ2vhKNTU6cbNS6JEra6Pi',
  });

  module.exports={

    generateRazorPay(orderId,totalAmt){
        return new Promise((resolve,reject)=>{
            var options = {  
            amount: totalAmt*100,  // amount in the smallest currency unit  
            currency: "INR",  
            receipt:''+orderId,
        }
            instance.orders.create(options, function(err, order){
                if(err){
                    console.log(err)
                    console.log('razrorpay order generation failed')
                    db.get().collection(collection.ORDER_COLLECTION).removeOne({_id:objectId(orderId)}).then(()=>{
                        console.log('order removed')
                    })
                    reject(err)
                }else{
                    resolve(order)
                }
            })
        })
    },
    verifyPayment(details,userId){
        return new Promise(async(resolve,reject)=>{
            var receipt = details['order[receipt]']
            const crypto = require('crypto')
            //creating hmac hash key using razorpay secret key //
            let hmac = crypto.createHmac('sha256','u4SJ2vhKNTU6cbNS6JEra6Pi')
            //push this order-data to hmac //
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
            // creating signature //
            hmac=hmac.digest('hex')
            // checking recieved signature parameter equal to created hmac signature //
            if(hmac==details['payment[razorpay_signature]']){

                console.log('created signature: '+hmac)
                console.log('received signature: '+details['payment[razorpay_signature]'])
                console.log('payment verified')

                await db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(receipt)},{$set:{'status':'placed',date:date.format(new Date(), 'DD-MM-YYYY hh:mm A')}})
                await db.get().collection(collection.CART_COLLECTION).removeOne({user:objectId(userId)})
                console.log('cart itmes removed ')
                resolve()
                message.makePlaceMessage(receipt,userId)
                saveThePayment(details,userId)

            }else{
                console.log('payment verification failed')
                db.get().collection(collection.ORDER_COLLECTION).removeOne({_id:objectId(receipt)}).then(()=>{
                })
                reject('transaction cancelled')
            }
        })
    }
  }

  async function saveThePayment(details,userId) {

      let paymentID=details['payment[razorpay_payment_id]']
      let paymentOdrId=details['payment[razorpay_order_id]']
      let paySign=details['payment[razorpay_signature]']
      let username=details['order[user][name]']
    //   let userphone = parseInt(details['order[[order[user][phone]]'])
    //   let useremail=details['order[order[user][email]]']
      var payOrderData;
      var paymentData;

      let getUser = await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)},{projection:{password:0,Address:0}})

      await instance.orders.fetch(paymentOdrId, function (err,data){
          if(data){
            payOrderData=data;
          }else{
              console.log(err)
          }
      })

     await  instance.payments.fetch(paymentID, function (err,data){
        if(data){
            paymentData=data;
        }else{
            console.log(err)
        }
    })

      console.log(payOrderData)
      console.log(paymentData)

      const PAYMENTDATA={

          order_id:payOrderData.id,
          payment_id:paymentData.id,
          signature:paySign,
          amount:payOrderData.amount/100,
          currency:payOrderData.currency,
          status:payOrderData.status,
          amount_paid:paymentData.amount/100,
          method:paymentData.method,
          pay_attempts:payOrderData.attempts,
          receipt:objectId(payOrderData.receipt),
          paided_email:paymentData.email,
          paided_phone:parseInt(paymentData.contact),
          paided_customer:username,
          user_name:getUser.name,
          user_phone:getUser.phone,
          user_email:getUser.email

      }
      if(PAYMENTDATA){
        db.get().collection(collection.PAYMENT).insertOne(PAYMENTDATA,function(err,data){
            if(data){
                console.log('payment saved')
                const PAYDATA={
                    user:userId,
                    order:PAYMENTDATA.receipt,
                    payid:PAYMENTDATA.payment_id,
                    amount:PAYMENTDATA.amount_paid,
                    name:PAYMENTDATA.user_name,
                    phone:PAYMENTDATA.paided_phone,
                    email:PAYMENTDATA.paided_email,
                }
                message.makePAYmessage(PAYDATA)
                db.get().collection(collection.ORDER_COLLECTION).updateOne(
                    {_id:objectId(PAYMENTDATA.receipt)},
                    {$set:{'payment':'success','payment_id':PAYMENTDATA.payment_id}})
            }else{
                console.log(err)
            }
        })
      }else{
          console.log('payment data not found')
      }
  }
