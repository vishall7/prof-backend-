import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/APIError.js";
import { User } from "../models/user.model.js";
import { fileUploadTOCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/APIResponse.js";

const registerUser = asyncHandler(async (req,res)=>{
    //get user data
    // validate the data
    // get files from user such as image and avtar
    // upload it to cloudinary
    // check if the user is already exitsed or not
    // if not create user
    
    const {username,fullname,email,password} = req.body;
    
    if([username,fullname,email,password].some((feild) =>
        feild?.trim() === ""
    )){
        throw new ApiError(400,"all feilds are mandetory");
    }
    
    const existedUser = await User.findOne({
        $or: [{email},{username}]
    })

    if(existedUser){
       throw new ApiError(409,"User already existed with this email and username") 
    }   

    const avatarLocalFilePath = req.files?.avatar[0]?.path;
       

    let coverImageLocalFilePath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ){
        coverImageLocalFilePath = req.files.coverImage[0].path;
    }

    if(!avatarLocalFilePath){
        throw new ApiError(400, "avatar is compulsary")
    }

    const avatar = await fileUploadTOCloudinary(avatarLocalFilePath);
    const coverImage = await fileUploadTOCloudinary(coverImageLocalFilePath);

    if(!avatar){
        throw new ApiError(400, "avatar is compulsary for upload")
    }

    const user = await User.create({
        fullname,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })

    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!userCreated){
        throw new ApiError(500,"something went wrong while registering user");
    }

    return res.status(200).json(
        new ApiResponse(201,userCreated,"user created successfully")
    )

})
export {registerUser}