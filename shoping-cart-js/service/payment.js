/* This program was written by zuhail pm*/
/* for more details :github/zuhl-c*/

var db=require('../config/connection');
var collection=require('../config/collections');
const objectId=require('mongodb').ObjectID;
var  date = require('date-and-time');
var Razorpay=require('razorpay');

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
            console.log(hmac)
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

            }else{
                console.log('payment verification failed')
                db.get().collection(collection.ORDER_COLLECTION).removeOne({_id:objectId(receipt)}).then(()=>{
                })
                reject('transaction cancelled')
            }
        })
    }
  }