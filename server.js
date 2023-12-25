
import express  from 'express'
import ejs from 'ejs'
import path  from 'path'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import  jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const app = express()
const port = 80
const host = "127.0.0.1"

app.use(express.static(path.join(path.resolve(),'public')))
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())

app.set('view engine','ejs')

mongoose.connect('mongodb://127.0.0.1:27017',{
    dbName:"backend"
}).then((value)=>{
    console.log("Database Connected")
}).catch((error)=> console.log("database can't connect... \n ",error))


const userSchema = new mongoose.Schema({
    name:String,
    email:String,
    password:String
})

const User = mongoose.model("User",userSchema)



const isAuthanticated =  async (req,res,next)=>{
    let {token} = req.cookies
    if(token){
       const decodeData =  jwt.verify(token,"fahsafmsdfer")
       console.log(decodeData)
       req.user = await User.findById(decodeData._id)
        next()
    }
    else{
        res.render('index')
    }
}

 



app.get('/',isAuthanticated,(req,res)=>{
    console.log(req.user)
    res.render('logout',{name:req.user.name})
})



app.get('/login',(req,res)=>{
    res.render('index')
})

app.get('/regester',(req,res)=>{
    res.render('regester')
})


app.post('/login',async  (req,res)=>{
    const {email,password} = req.body
    let user = await User.findOne({email})
    if(!user){
        return res.redirect('/regester')
    }
    const isMatch = await bcrypt.compare(password,user.password)
    console.log(isMatch)
    if(!isMatch) return res.render("index",{email:email,message:"incorrect Password "})
        
    const token = jwt.sign({_id:user._id},"fahsafmsdfer")

    res.cookie("token",token,{
        httpOnly:true,
        expires:new Date(Date.now()+60*1000)
    })
    res.redirect("/")

})


app.post('/regester', async (req,res)=>{
    // console.log(req.body)
    const {name,email,password} = req.body
    let user = await User.findOne({email})
    const hashPassword = await bcrypt.hash(password,10)

    if(user){
         return res.redirect('/login')
    }

    user =  await  User.create({
        name,
        email,
        password:hashPassword
    })
    
    const token = jwt.sign({_id:user._id},"fahsafmsdfer")
    // console.log(token)

    res.cookie("token",token,{
        httpOnly:true,
        expires:new Date(Date.now()+60*1000)
    })
    res.redirect("/")

})

app.get('/logout',(req,res)=>{
    res.cookie("token",null,{
        httpOnly:true,
        expires: new Date(Date.now())
    })
    res.redirect('/')
})
app.listen(port,()=>{
    console.log(`server is listening on http://${host}:${port}`)
})
