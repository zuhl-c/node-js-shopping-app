/* This program was written by zuhail pm*/
/* for more details :www.github.com/zuhl-c*/

const date = require('date-and-time');
var collection=require('../config/collections')
var db=require('../config/connection')
var objectId=require('mongodb').ObjectID;

class Message{
    
    MakeCancelRequest(orderid,reason){
        var message ={
            type:"cancel request",
            order:objectId(orderid),
            reason:reason,
            time:date.format(new Date(), 'DD-MM-YYYY hh:mm A')
        }
        db.get().collection(collection.INBOX).insertOne(message,function(err,data){
            if(data){
                console.log('cancellation request inserted')
            }else{
                console.log(err)
            }
        })
    }

    makeCancelMessage(orderid,userid){
       var message={
           type:'order cancelled',
           order:objectId(orderid),
           user:objectId(userid),
           content:'your order has been cancelled',
           time:date.format(new Date(), 'DD-MM-YYYY hh:mm A')
       }
       db.get().collection(collection.USERINBOX).insertOne(message,function(err,data){
           if(data){
               console.log('order cancelled message sended')
           }else{
               console.log(err)
           }
       })
   }
   makePlaceMessage(orderid,userid){
       var message={
           type:'order placed',
           order:objectId(orderid),
           user:objectId(userid),
           content:'Your order has been placed ',
           time:date.format(new Date(), 'DD-MM-YYYY hh:mm A')
       }
       db.get().collection(collection.USERINBOX).insertOne(message,function(err,data){
           if(data){
               console.log('order placed message sended')
           }else{
               console.log(err)
           }
       })
   }
   makePAYmessage(data){
       let message={
           type:'payment success',
           order:objectId(data.order),
           user:objectId(data.user),
           content:'Hi ' + data.name + ' your payment was successfull ',
           payment_id:data.payid,
           amount:data.amount,
           time:date.format(new Date(), 'DD-MM-YYYY hh:mm A')
       }
       db.get().collection(collection.USERINBOX).insertOne(message,function(err,data){
           if(data){
               console.log('payment message sended')
           }
       })
   }
   makeShipMessage(orderid,userid){
       var message={
           type:'order shipped',
           order:objectId(orderid),
           user:objectId(userid),
           content:'Your order has been shipped',
           time:date.format(new Date(), 'DD-MM-YYYY hh:mm A')
       }
       db.get().collection(collection.USERINBOX).insertOne(message,function(err,data){
        if(data){
            console.log('order shipped message sended')
        }else{
            console.log(err)
        }
       })
   }
    makeOutOfDelMessage(orderid,userid){
       var message={
           type:'out of delivery',
           order:objectId(orderid),
           user:objectId(userid),
           content:'your order has been out of delivery',
           time:date.format(new Date(), 'DD-MM-YYYY hh:mm A')
        }
        db.get().collection(collection.USERINBOX).insertOne(message,function(err,data){
            if(data){
                console.log('out of delivery message sended')
            }else{
                console.log(err)
            }
        })
    }
    makeDeliveryMessage(orderid,userid){
        var message={
            type:'delivered',
            order:objectId(orderid),
            user:objectId(userid),
            content:'your order has been delivered',
            time:date.format(new Date(), 'DD-MM-YYYY hh:mm A')
         }
         db.get().collection(collection.USERINBOX).insertOne(message,function(err,data){
             if(data){
                 console.log('delivered message sended')
             }else{
                 console.log(err)
             }
         })
     }

     ReadInbox(userid){
         db.get().collection(collection.USERINBOX).updateMany({user:objectId(userid)},{$set:{read:true}})
     }

     async GetNotif(userid){
         let unread = await db.get().collection(collection.USERINBOX).find({user:objectId(userid),read:{$exists:false}}).toArray()
         return unread.length;
     }
     
     async GetInbox(userid){
        
        let inbox = await db.get().collection(collection.USERINBOX).find({user:objectId(userid)}).sort({time: -1}).toArray()
        console.log(inbox)
        return inbox;
    }
    async getAdminInbox(){
       let inbox = await db.get().collection(collection.INBOX).find().sort({time: -1}).toArray()
        console.log(inbox)
        return inbox;
    }
}

module.exports= Message;