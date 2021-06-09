/* This program was written by zuhail pm*/
/* for more details :www.github.com/zuhl-c*/

var collection=require('../config/collections')
var db=require('../config/connection')
var Message=require('../service/messages')
var objectId=require('mongodb').ObjectID;
const bcrypt=require('bcrypt')
const date = require('date-and-time');
var message=new Message()

async function makeadmin() {
    var Admin = {name:'zuhl-c',phone:1234,password:'github/zuhl-c'}
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
    adminSignup(data){
        return new Promise(async(resolve,reject)=>{
            data.phone=parseInt(data.phone)
            data.password=await bcrypt.hash(data.password,10)
            //console.log(data)
            db.get().collection(collection.ADMIN).insertOne(data,function(err,data){
                if(data.ops[0]){
                    //console.log(data.ops[0])
                    let session={};
                    session._id=data.ops[0]._id;
                    session.admin=data.ops[0].name;
                    session.phone=data.ops[0].phone;
                    session.pswrd=true;
                    resolve(session)
                }else{
                    reject(err)
                }
            })
        })
    },

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
                                    let session={};
                                    session._id=data._id;
                                    session.admin=data.name;
                                    session.phone=data.phone;
                                    session.pswrd=true;
                                    //console.log(session)
                                    resolve(session)

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
        var tstatus;
        var tracking;
        var deliverd;
        //console.log(status)
        if(status=="25%"){
            tracking="25%";
            tstatus="processing"
            //message.makePlaceMessage(data.id,data.user)
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
    },
    async getUser(id){
        let user =db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(id)},{projection:{password:0,_id:0,Address:0}})
        return user;
    },
    async getTotalPayment(){
        var payment = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            // {
            //     $project:{totalAmount:1}
            // },
            {
                $group: { _id : null, total : { $sum: "$totalAmount" } }
            },
            {
                $unwind:'$total'
            },
            {
                $project:{_id:0,total:1}
            }
        ]).toArray()
        //console.log(payment[0].total)
        return payment[0].total;
    },
    async getProductCount(){
        var Count = await db.get().collection(collection.PRODUCT_COLLECTION).find().count()
        //console.log(count)
        return Count;
    },
    async getUserCount(){
        var Count = await db.get().collection(collection.USER_COLLECTION).find().count()
        return Count;
    }

}











