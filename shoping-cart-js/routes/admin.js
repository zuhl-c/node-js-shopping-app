/* This program was written by zuhail pm*/
/* for more details :github/zuhl-c*/

//modules importing//
var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product')
const adminHelpers =require('../helpers/admin');
const sharp = require('sharp');
const fs =require('fs');
const { response } = require('express');

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
  let products = await productHelpers.getAllProducts()
  console.log(products)
  res.render('admin/view-products',{admin,header,products})

})
//admin login//
router.post('/admin-login',async(req,res)=>{
  adminHelpers.adminLogin(req.body).then((status)=>{
    if(status.pswrd){
      req.session.admin=status.data;
      req.session.LoggedIn=true;
      console.log('admin login')
      res.redirect('/admin')
    }
  }).catch((err)=>{
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
  productHelpers.addProduct(req.body).then(async(id)=>{
    await sharp(req.files.image.data).resize(640,640).toFile('./public/images/'+id+'.png')
    res.redirect('/admin')
    //console.log(req.files)/
 })
 //console.log(req.files.image.data)
})
//edit product//
router.get('/edit-product',verifyAdmin, async function(req,res){
  //console.log(req.query)
  let product= await productHelpers.getProductDetails(req.query.id)
  res.render('admin/edit-product',{product,header,admin})
  console.log('product details collected')

})

router.post('/edit-product/:id',function(req,res){
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
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
  productHelpers.deleteProduct(productId).then((response)=>{
    if(response){
      console.log('product deleted')
    res.redirect('/admin/')
    }else{
      console.log('error to delete')
    }

  })
})
//all orders//
router.get('/all-orders',verifyAdmin,async function (req,res) {
 let orders = await adminHelpers.getAllorders()
 console.log(orders)
 res.render('admin/all-orders',{orders,header,admin})

})
//view orders//
router.get('/view-order',verifyAdmin, async function (req,res) {
  console.log(req.query.id)
  let details= await adminHelpers.getOrderDetails(req.query.id)
  console.log(details)
  res.render('admin/view-order',{admin,header,details})
})
//cahnge status//
router.post('/change-status',function (req,res){
  adminHelpers.changeStatus(req.body).then((response)=>{
    console.log(response)
    res.json({status:true})
  })
})
//all users//
router.get('/all-users',verifyAdmin,async function(req,res){
  let customers= await adminHelpers.getAllusers()
  res.render('admin/view-users',{customers,admin,header})
})

router.get('/inbox',verifyAdmin,async function(req,res){
  let inbox = await adminHelpers.getInbox()
  res.render('admin/inbox',{inbox,admin,header})
})
router.post('/cancel-order',function(req,res){
  console.log(req.body)
  adminHelpers.cancelOrder(req.body).then(()=>{
    res.json({status:true})
  })
})
module.exports = router;
