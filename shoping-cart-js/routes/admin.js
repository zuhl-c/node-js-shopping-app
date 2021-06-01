//modules importing//
var express = require('express');
const session = require('express-session')
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')
const adminHelpers =require('../helpers/admin-helpers');
const userHelpers = require('../helpers/user-helpers');
const { response } = require('express');

var header=true;
var admin=true;
//checking admin loggedIn
function verifyAdmin(req,res,next) {
  if(req.session.LoggedIn&&req.session.admin){
    next()
  }else{
    res.render('admin/admin-login',{admin})
  }
}

// GET admin listing
router.get('/',verifyAdmin,async function(req, res,next) {
  let products = await productHelpers.getAllProducts()
  console.log(products)
  res.render('admin/view-products',{admin,header,products})
})

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

router.get('/logout',function (req,res){
  req.session.destroy();
  console.log('admin logout')
  res.redirect('/admin')
})

//add product
router.get('/add-product',verifyAdmin,function(req,res){
  res.render('admin/add-product',{admin,header})
})

router.post('/add-product',function(req,res){
  productHelpers.addProduct(req.body).then((id)=>{
    let image = req.files.image
    image.mv('./public/images/'+id+'.jpg',(err)=>{
      if (!err){
        console.log('product upload done')
      }else{
        console.log(err)
      }
    })
    res.redirect('/admin')
  })
})
//edit product
router.get('/edit-product',verifyAdmin, async function(req,res){
  //console.log(req.query)
  let product= await productHelpers.getProductDetails(req.query.id)
  res.render('admin/edit-product',{product,header,admin})
  console.log('product details collected')

})

router.post('/edit-product/:id',function(req,res){
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{

    console.log('product updated')
    res.redirect('/admin/')

    let id =req.params.id;
    let image=req.files.image;

    if(req.files){
      image.mv('./public/images/'+id+'.jpg')
      console.log('image updated')

    }else{
      console.log('image not updated')
    }
  })
})
//delete product
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
router.get('/view-order',verifyAdmin, async function (req,res) {
  console.log(req.query.id)
  let details= await adminHelpers.getOrderDetails(req.query.id)
  console.log(details)
  res.render('admin/view-order',{admin,header,details})
})
router.post('/change-status',function (req,res){
  adminHelpers.changeStatus(req.body).then((response)=>{
    console.log(response)
    res.json({status:true})
  })
})
module.exports = router;
