import { asyncHandler } from "../utils/asyncHandler.js" 
import {ApiError} from '../utils/ApiError.js' 
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) =>{
      try {
        
        // if (!userId) {
        //     throw new Error("User ID is required");
        // }
        // console.log(userId , "check user id ")

          const user = await User.findById(userId)
           
        //   console.log(user , 'this data from user')

        //   if (!user) {
        //     throw new Error("User not found");
        //   }
        //   console.log(user.generateAccessToken(), "check token value")
          
          const accessToken = await  user.generateAccessToken()
          const refreshToken = await user.generateRefreshToken()

          
          user.refreshToken = refreshToken
          await user.save({validateBeforeSave : false})
          
          console.log(accessToken , refreshToken)
          return { accessToken , refreshToken}

          
      } catch (error) {
          throw new ApiError(500 , "SomeThing went wrong while generating refresh and access token")
      }
}

const registerUser = asyncHandler( async (req , res) =>{
    
    const {fullname, username , email , password} = req.body
    console.log(email)

    if(
        [fullname, username, password ,email].some((field)=>
        field?.trim() === "" )
    ){
        throw new ApiError(400 , "all fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ email } , { username }]
    })
    
    if(existedUser){
        throw new ApiError(409 , "User  with email or username already exists")
    }
    
    const avatarLocalPath =  req.files?.avatar[0]?.path;
    console.log(avatarLocalPath , "avatar local path")
    console.log(req.files.avatar , "show avatar path or output ")
    
    // const coverImageLocalPath =  req.files?.coverImage[0]?.path ;
    
    let coverImageLocalPath;
    if (
        req.files && 
            Array.isArray(req.files.coverImage) 
            && req.files.coverImage.length > 0
            ){
                coverImageLocalPath = req.files.coverImage[0].path;
        }
        
        console.log(coverImageLocalPath, "coverImagePath SEEE ME IN USER CONTROLLER")
        
        console.log(coverImageLocalPath)

        if(!avatarLocalPath){
            throw new ApiError(400 , "avatar is required")           
        }
        
        
        const avatar = await uploadOnCloudinary(avatarLocalPath) ;
        
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);
     
    console.log(avatarLocalPath)
    console.log(avatar , "avatar error for file if file is here and error in code")

    if(!avatar){
        throw new ApiError(400 , "avatar file is required")
    }


    const user = await User.create({
        fullname,
        avatar: avatar.url,
        email,
        coverImage: coverImage?.url || "",
        username : username.toLowerCase() ,
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500 , "Something went wrong while register user")
    }

    return res.status(201).json(
        new ApiResponse(200 , createdUser , "User registered successfully")
    )
        

})


const loginUser  = asyncHandler( async (req, res) =>{
    // todo for this login user
    // req.body -> data 
    // username or email for login
    // find user 
    // password check
    // access and refresh token 
    // send cookie 
    // res for login

    const {username, email, password} = req.body

    if(!(username || email)){
         throw new ApiError(400 , "username or email is required")
    }
    
    const user = await User.findOne({
        $or : [ { username } ,{ email } ]
    })

    if(!user) {
       throw new ApiError(404 , "user does not exist")
    }
    console.log(user)

    const isPasswordValid =  await user.isPasswordCorrect(password)
     
    if(!isPasswordValid){
        throw new ApiError(401 ," invalid user password or crendentials")
    }

    const {accessToken , refreshToken} = await generateAccessAndRefreshTokens(user._id)
    console.log(accessToken ,refreshToken , "token avavaible")
    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken ")

    const options = {
        httpOnly : true ,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
        new ApiResponse(
            200 , 
            {
                 user : loggedInUser , accessToken , refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async (req, res)=>{
    
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken : 1
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true ,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json(new ApiResponse(200 , {} , "User Logged Out"))

})

const refreshAccessToken = asyncHandler(async (req ,res) =>{
    const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401 , "unathorized request")
    }
   
    const decodedToken =  jwt.verify(
        incomingRefreshToken ,
        process.env.REFRESH_TOKEN_SECRET
    )
    
    const user = await User.findById(decodedToken?._id)

    if(!user){
        throw new ApiError(401 , "Invalid refresh Token")
    }

    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401 , "Refresh Token is expired or used")
    }

    const options ={
        httpOnly : true ,
        secure  : true
    }
    const {accessToken  , newRefreshToken } = await generateAccessAndRefreshTokens(user._id)


    return res
    .status(200)
    .cookie("accessToken" , accessToken) 
    .cookie("accessToken" , newRefreshToken) 
    .json(
        new ApiResponse(
            200,
            {accessToken , newRefreshToken},
            "Access Token refreshed"
        )
    )

})


export {
    registerUser,
    loginUser,
    logoutUser,
    incomingRefreshToken
}