import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken"
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import uploadOnCloudinary from "../utils/cloudinary.js"


const generateAccessTokenAndRefreshToken = async(userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
    user.refreshToken = refreshToken
    await user.save({ValidateBeforeSave : false})

    return {
        accessToken,
        refreshToken
    }

    }catch(error){
        throw new ApiError(500, 'Failed to create token', error)
    }
}

const registerUser = asyncHandler(async (req, res) => {
    
    const { fullName , email , userName , password } = req.body;
    // if(fullName === ""){
    //     throw new ApiError(400 , "fullName is required")
    // }

    if([fullName , email , userName ,password].some((field)=>
    field?.trim() === "")
    ){
        throw new ApiError(400 , "All fields are required")
    }

   const existUser = await User.findOne({
        $or: [{userName} , {email}]
    })

    if(existUser){
    throw new ApiError(409 , "User with email or username exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath ;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar image is required")
    }

    const avatar =  await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400 , "Avatar image is required")
    }
    

    const user =  await User.create({
        fullName,
        email,
        password,
        userName :userName.toLowerCase(),
        avatar : avatar.url,
        coverImage :coverImage ?.url || "",
    })

     const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
     )
     
    if(!createdUser){
        throw new ApiError(500 , "something went wrong hile registring the user")
    }

    return res.status(201).json(
        new ApiResponse(200 , createdUser , "User register successfully")
    )


});


const loginUser = asyncHandler(async (req , res) => {

    const {userName , email , password} = req.body;
    if (!(userName || email)) {
        throw new ApiError(400 , "username or email is required")
    }

    const existUser = await User.findOne({
        $or : [{userName},{email}]
    })

    if(!existUser){
        throw new ApiError(404 , "User does not exist")
    }

   const isPasswordCorrect =  await existUser.isPasswordCorrect(password)

   if(!isPasswordCorrect){
    throw new ApiError(401 , "Invalid passwod")
   }

    const {accessToken , refreshToken} = await generateAccessTokenAndRefreshToken(existUser._id);

    const loggedUser = await User.findById(existUser._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" ,refreshToken , options)
    .json(
        new ApiResponse(200, {user :loggedUser , refreshToken, accessToken} ,"user logged is successfully")
    )

})


const logoutUser = asyncHandler( async(req ,res) => {
    await User.findByIdAndUpdate(req.user._id , {$set : {refreshToken : undefined}} , {new : true})

    const options = {
        httpOnly : true,
        secure : true
    }
    
    return res.status(200).clearCookie(req.cookies.accessToken , options).clearCookie(req.cookies.refreshToken ,options)
    .json(
        new ApiResponse(200 , {} , "user logged out successfully")
    )
})


const refreshAccessToken = asyncHandler( async (req , res) => {
    const incomingRefeshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefeshToken) {
        throw new ApiError(403 , 'No token provided')
    }

    try {
        const decodedToken =jwt.verify(incomingRefeshToken , process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken._id)
        if (!user) {
            throw new ApiError(403 , 'Invalid refresh token')
        }
        
        if(incomingRefeshToken !== user?.refreshToken){
            throw new ApiError(401 , "Refresh token is used or expired")
        }
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        const {accessToken , newRefreshToken} = await generateAccessTokenAndRefreshToken(user._id)
    
        return res.status(200)
        .cookie("accessToken" , accessToken , options)
        .cookie("refreshToken" ,newRefreshToken , options)
        .json(
            new ApiResponse(200 ,{accessToken ,refreshToken : newRefreshToken} , "AccessToken refreshed"
        ))
    
    } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid refresh token")
    }
})

export  {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}
