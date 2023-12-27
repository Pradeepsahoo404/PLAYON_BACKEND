import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import uploadOnCloudinary from "../utils/cloudinary.js"

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
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

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

export  {
    registerUser
}
