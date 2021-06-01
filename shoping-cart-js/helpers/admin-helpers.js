var collection=require('../config/collections')
var db=require('../config/connection')
var objectId=require('mongodb').ObjectID;
const bcrypt=require('bcrypt')
const date = require('date-and-time');

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
        //console.log(status)
        if(status=="25%"){
            var track_status="25%"
        }
        else if(status=="50%"){
            track_status="50%";
        }
        else if(status=="75%"){
            track_status="75%";
        }
        else if(status=="100%"){
            track_status="100%";
            var deliverd=true;
        }
        return new Promise(async(reslove,reject)=>{
            if(deliverd){
                db.get().collection(collection.ORDER_COLLECTION).updateOne(
                    {_id:objectId(id)},
                    {$set:{trackstatus:track_status,
                        status:'delivered',
                        delivered:date.format(new Date(), 'DD-MM-YYYY hh:mm A')
                    }})
                    console.log("status updated to delivery")
                    reslove()
            }else{
                db.get().collection(collection.ORDER_COLLECTION).updateOne(
                    {_id:objectId(id)},
                    {$set:{trackstatus:track_status}})
                    console.log("status updated")
                    reslove()
            }
        })
    }
}











