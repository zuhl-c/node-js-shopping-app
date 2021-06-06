/* This program was written by zuhail pm*/
/* for more details :github/zuhl-c*/

var collection=require('../config/collections')
var db=require('../config/connection')
var Message=require('./messages')
var objectId=require('mongodb').ObjectID;
const bcrypt=require('bcrypt')
const date = require('date-and-time');

var message=new Message()

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
        var status;
        var tracking;
        var deliverd;
        //console.log(status)
        if(status=="25%"){
            tracking="25%";
            tstatus="processing"
            message.makePlaceMessage(data.id,data.user)
        }
        else if(status=="50%"){
            tracking="50%";
            tstatus="shipped"
            message.makeShipMessage(data.id,data.user)
        }
        else if(status=="75%"){
            tracking="75%";
            tstatus="out of delivery"
            message.makeOutOfDelMessage(data.id,data.user)
        }
        else if(status=="100%"){
            tracking="100%";
            tstatus="delivered"
            deliverd=true;
            message.makeDeliveryMessage(data.id,data.user)
        }
        return new Promise(async(reslove,reject)=>{
            if(deliverd){
                db.get().collection(collection.ORDER_COLLECTION).updateOne(
                    {_id:objectId(id)},
                    {$set:{tracking:tracking,
                        status:'delivered',
                        tstatus:tstatus,
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
    getInbox(){
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.INBOX).find().sort({time: -1}).toArray().then((response)=>{
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
                message.makeCancelMessage(data.orderid,data.userid)
                db.get().collection(collection.INBOX).updateOne({order:objectId(data.id)},{
                    $set:{'cancelled':true}
                })
                resolve()
            })
        })
    }
}











