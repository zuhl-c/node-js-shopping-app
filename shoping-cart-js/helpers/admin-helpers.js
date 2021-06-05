/* This program was written by zuhail pm*/
/* for more details :github/zuhl-c*/

var collection=require('../config/collections')
var db=require('../config/connection')
var objectId=require('mongodb').ObjectID;
const bcrypt=require('bcrypt')
const date = require('date-and-time');

class Message{

    async makeCancelMessage(orderid,userid){
        var message={
            type:'order cancellation',
            order:orderid,
            user:userid,
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
}

async function makeadmin() {
    var Admin = {name:'zuhl-c',phone:8086900574,password:'zuhl-c/github'}
    Admin.password = await  bcrypt.hash(Admin.password,10,)
    db.get().collection(collection.ADMIN).insertOne(Admin,function (err,data) {
        if(data){
            console.log(data.ops[0])
        console.log('admin created')
        }else{
            console.log(err)
        }
        
    })
}


module.exports={
    adminLogin(logindata){
        logindata.phone=parseInt(logindata.phone)
        var status;
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ADMIN).findOne({phone:logindata.phone},function (err,data) {
                if(data&&data.password!=null){
                    bcrypt.compare(logindata.password,data.password,function (err,res) {
                        if(res){
                            //console.log(data)
                            db.get().collection(collection.ADMIN).findOne({_id:objectId(data._id)},{projection:{password:0}},
                            function(err,data){
                                if(data){
                                    //console.log(data)
                                    let admin={};
                                    admin.data=data
                                    admin.pswrd=true;
                                    resolve(admin)
                                }else{
                                    console.log(err)
                                }
                            })
                        }else{
                            status='Password incorrect';
                            reject(status)
                        }
                    })
                }else{
                    status='Admin not found';
                    reject(status)
                }
            })
        })
    },
    getAllorders(){
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).find().toArray().then((data)=>{
                resolve(data)
            })
        })
    },
    getOrderDetails(id){
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).findOne({_id:objectId(id)}).then((details)=>{
                resolve(details)
            })
        })
    },
    changeStatus(data){
        var id=data.id;
        var status=data.value;
        var tracking;
        var tStatus;
        var deliverd;
        //console.log(status)
        if(status=="25%"){
            tracking="25%";
            tstatus="processing"
        }
        else if(status=="50%"){
            tracking="50%";
            tstatus="shipped"
        }
        else if(status=="75%"){
            tracking="75%";
            tstatus="out of delivery"
        }
        else if(status=="100%"){
            tracking="100%";
            tstatus="delivered"
            deliverd=true;
        }
        return new Promise(async(reslove,reject)=>{
            if(deliverd){
                db.get().collection(collection.ORDER_COLLECTION).updateOne(
                    {_id:objectId(id)},
                    {$set:{tracking:tracking,
                        status:'delivered',
                        delivered:date.format(new Date(), 'DD-MM-YYYY hh:mm A')
                    }})
                    console.log("status updated to delivery")
                    reslove()
            }else{
                db.get().collection(collection.ORDER_COLLECTION).updateOne(
                    {_id:objectId(id)},
                    {$set:{tracking:tracking,tstatus:tstatus}})
                    console.log("status updated")
                    reslove()
            }
        })
    },
    getAllusers(){
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).find({},{projection:{password:0}}).toArray().then((data)=>{
                console.log(data)
                resolve(data)
            })
        })
    },
    getAlerts(){
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ALERTS).find().sort({time: -1}).toArray().then((response)=>{
                console.log(response)
                resolve(response)
            })
        })
    },
    cancelOrder(data){
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(data.orderid)},{
                $set:{status:'cancelled',cancelled:date.format(new Date(), 'DD-MM-YYYY hh:mm A')}
            }).then(()=>{
                console.log('order cancelled ' + data.orderid)
                var message =new Message()
                message.makeCancelMessage(data.orderid,data.userid)
                db.get().collection(collection.ALERTS).updateOne({orderid:data.orderid},{
                    $set:{'cancelled':true}
                })
                resolve()
            })
        })
    }
}











