/* This program was written by zuhail pm*/
/* for more details :github/zuhl-c*/


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
               console.log('order cancelled message inserted')
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
               console.log('order placed message inserted')
           }else{
               console.log(err)
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
            console.log('order shipped message inserted')
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
                console.log('out of delivery message inserted')
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
                 console.log('delivered message inserted')
             }else{
                 console.log(err)
             }
         })
     }
}

module.exports= Message;