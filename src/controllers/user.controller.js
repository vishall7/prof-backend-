import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/APIError.js";
import { User } from "../models/user.model.js";
import { fileUploadTOCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/APIResponse.js";

    // generating access and refresh token 

    const generateAccessAndRefreshTokens = async (userId)=>{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});

        return {accessToken,refreshToken}
    }

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

const loginUser = asyncHandler(async (req,res)=>{
    // hit the login route
    // enter username,email,password
    //check if the user or email presents in database 
    // if yes then proceed to get password if not show the user that he/she is not authorize after entering password
    // if user presents then dont show user that error and procceds to check password
    //if password is correct generate access and refresh tokens 
    //if not redirect to login page and tells that password is incorrect 

    const {username,email,password} = req.body;

    if(!(username && email)){
        throw new ApiError(400,"username or email required");
    } 

    const userFounded = await User.findOne({
        $and: [{username},{email}]
    })

    if(!userFounded){
        throw new ApiError(409,"user not found");
    }

    const isPasswordValid = await userFounded.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(400,"password incorrect")
    }

    const {accessToken,refreshToken} =  await generateAccessAndRefreshTokens(userFounded._id);

    const loggedInUser = await User.findById(userFounded._id).select(
        "-password -refreshToken")
    
    const options = {
        httpOnly: true,
        secure: true 
    }
        
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,accessToken,refreshToken
            },
            "user logged in successfully"
        )
    )
})

const logoutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {refreshToken: undefined}
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true 
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,{},"User Logged out")
    )
})






export {
    registerUser,
    loginUser,
    logoutUser
}