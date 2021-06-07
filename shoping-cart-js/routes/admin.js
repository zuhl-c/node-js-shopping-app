/* This program was written by zuhail pm*/
/* for more details :github/zuhl-c*/

//modules importing//
var express = require('express');
var router = express.Router();
const productControl = require('../controller/productControl');
const adminControl =require('../controller/adminControl');
const sharp = require('sharp');
const fs =require('fs');
const { response } = require('express');
const Message = require('../service/messages');

var message=new Message()
var header=true;
var admin=true;

//checking admin loggedIn//
function verifyAdmin(req,res,next) {
  if(req.session.LoggedIn&&req.session.admin){
    next()
  }else{
    res.render('admin/admin-login',{admin})
  }
}

// GET admin listing//
router.get('/',verifyAdmin,async function(req, res) {
  let products = await productControl.getAllProducts()
  console.log(products)
  res.render('admin/view-products',{admin,header,products})

})
//admin login//
router.post('/admin-login',async function(req,res){
  adminControl.adminLogin(req.body).then(async function (status){
    if(status.pswrd){
      req.session.admin=status.data;
      req.session.LoggedIn=true;
      console.log('admin login')
      res.redirect('/admin')
    }
  }).catch( function (err){
    console.log(err)
    res.render('admin/admin-login',{err,admin})
  })
})
//admin logout//
router.get('/logout',function (req,res){
  req.session.destroy();
  console.log('admin logout')
  res.redirect('/admin')
})

//add product//
router.get('/add-product',verifyAdmin,function(req,res){
  res.render('admin/add-product',{admin,header})
})

router.post('/add-product', function(req,res){
  productControl.addProduct(req.body).then(async function (id){
    await sharp(req.files.image.data).resize(640,640).toFile('./public/images/'+id+'.png')
    res.redirect('/admin')
    //console.log(req.files)/
 })
 //console.log(req.files.image.data)
})
//edit product//
router.get('/edit-product',verifyAdmin, async function(req,res){
  //console.log(req.query)
  let product= await productControl.getProductDetails(req.query.id)
  res.render('admin/edit-product',{product,header,admin})
  console.log('product details collected')

})

router.post('/edit-product/:id',function(req,res){
  productControl.updateProduct(req.params.id,req.body).then(function (){
    let id =req.params.id;
    if(req.files){
     sharp(req.files.image.data).resize(640,640).toFile('./public/images/'+id+'.png')
      console.log('image updated')

    }else{
      console.log('image not updated')
    }
    console.log('product updated')
    res.redirect('/admin/')
  })
})

// router.post('/upload-photo',(req,res)=>{
//   console.log(req.body)
//   if(req.body.image){

//     let image=req.body.image;
//     console.log('files')
//     image.mv('./public')
//   }
// })

//delete product//
router.get('/delete-product/:id',verifyAdmin,function(req,res){
  let productId=req.params.id;
  productControl.deleteProduct(productId).then(function (response){
    if(response){
      console.log('product deleted')
    res.redirect('/admin/')
    }else{
      console.log('error to delete')
    }

  })
})
//all orders//
router.get('/all-orders',verifyAdmin,async function (req,res){
 let orders = await adminControl.getAllorders()
 console.log(orders)
 res.render('admin/all-orders',{orders,header,admin})

})
//view orders//
router.get('/view-order',verifyAdmin, async function (req,res) {
  console.log(req.query.id)
  let details= await adminControl.getOrderDetails(req.query.id)
  console.log(details)
  res.render('admin/view-order',{admin,header,details})
})
//cahnge status//
router.post('/change-status',function (req,res){
  adminControl.changeStatus(req.body).then(function(response){
    console.log(response)
    res.json({status:true})
  })
})
//all users//
router.get('/all-users',verifyAdmin,async function(req,res){
  let customers= await adminControl.getAllusers()
  res.render('admin/view-users',{customers,admin,header})
})
//get the user//
router.put('/get-user/:id',verifyAdmin,async function (req,res) {
  console.log(req.params.id)
  let user=await adminControl.getUser(req.params.id)
  res.json(user)
})
//admin inbox//
router.get('/inbox',verifyAdmin,async function(req,res){
  let inbox = await message.getAdminInbox()
  res.render('admin/inbox',{inbox,admin,header})
})
//cancel order//
router.post('/cancel-order',function(req,res){
  console.log(req.body)
  adminControl.cancelOrder(req.body).then(function(){
    res.json({status:true})
  })
})
module.exports = router;
