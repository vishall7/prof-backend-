import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/APIError.js";
import { User } from "../models/user.model.js";
import { fileUploadTOCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/APIResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


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

const refreshAccessToken = asyncHandler(async(req,res)=>{

    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unothourized request");
    }

    try {
        const decodeedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodeedToken._id);
        
        if(!user){
            throw new ApiError(401,"Invalid RefreshToken");
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"refreshtoken is expired or used");
        }
    
        const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id);
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        res.status(200)
        .cookie("accessTOken",accessToken,options)
        .cookie("accessTOken",refreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken},
                "accesstoken refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(404,error?.message || "Invalid Refresh Token") 
    }

})

const changeCurrentPassword = asyncHandler(async (req,res)=>{

// change current password controller
// user enters old, new, confirm passwords 
// then checks if its not empty
// check if old password is correct with user 
// if yes then compare it with user database stored password
// if it matches then update the old password with new password
// send res with user 

    const {oldPassword,newPassword,confirmPassword} = req.body

    if([oldPassword,newPassword,confirmPassword].some((feild) => 
        feild?.trim() === "")){
        throw new ApiError(401,"please enter your password"); 
    }
    if([oldPassword,newPassword,confirmPassword].some((feild) => 
        feild?.length < 4)){
        throw new ApiError(401,"password should be minimum 5 characters"); 
    }

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(401,"you have entered wrong user password");
    }
    
    if((oldPassword === newPassword)){
        throw new ApiError(401,"you've enter new password same as old password")
    }

    if(!(newPassword === confirmPassword)){
        throw new ApiError(401,"please correctly enter your new password for confirmation");
    }

    user.password = confirmPassword;
    await user.save({validateBeforeSave: false})

    // const updatedUser = user.select("-refreshToken"); 
    
    return res.status(200).json(
        new ApiResponse(200,{},"password change successfully")
    )

})

const getCurrentUser = asyncHandler(async (req,res)=>{
    // const user = req.user;
    return res
    .status(200)
    .json(
        new ApiResponse(200,{user: req.user},"heres the current user")
    )
})

const updateAccountDetails = asyncHandler(async (req,res)=>{
    const {fullname, email} = req.body
    if(!fullname || !email){
        throw new ApiError(400,"feilds are compulsory for updation");
    }
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullname,
                email
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(200,{user},"User info updated successfully")
    ) 
})

// login user
// get files from multer
// upload to cloudnary get image public url
// replace database avatar url with updated new url 

const updateUserAvatar = asyncHandler(async (req,res)=>{

    const newAvatarPath = req.file?.path;

    if(!newAvatarPath){
        throw new ApiError(400,"avatar file path not found")
    }
             
    const priviousAvatarPublicId = req.user.avatar.match(/\/upload\/v([^/]+)\/([\w\d]+)/)[2];
    
    const updatedAvatar = await fileUploadTOCloudinary(newAvatarPath,priviousAvatarPublicId);

    if (!updatedAvatar.url) {
        throw new ApiError(400,"file upload unsuccessful to cloudinary");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: updatedAvatar.url
            }
        },
        {new: true}
    ).select("-password -refreshToken")      

    return res
    .status(200)
    .json(
        new ApiResponse(200,{user},"avtar updated successfully")
    )
    
})

const updateUserCoverImage = asyncHandler(async (req,res)=>{

    const newCoverImagePath = req.file?.path;

    if(!newCoverImagePath){
        throw new ApiError(400,"cover image file path not found")
    }

    const priviousCoveImagePublicId = req.user.coverImage.match(/\/upload\/v([^/]+)\/([\w\d]+)/)[2];

    const updatedCoverImage = await fileUploadTOCloudinary(newCoverImagePath,priviousCoveImagePublicId);

    if (!updatedCoverImage.url) {
        throw new ApiError(400,"file upload unsuccessful to cloudinary");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: updatedCoverImage.url
            }
        },
        {new: true}
    ).select("-password -refreshToken");

    return res
    .status(200)
    .json(
        new ApiResponse(200,{user},"cover image updated successfully")
    )

})

const getUserChannelProfile = asyncHandler(async (req,res)=>{
    const {username} = req.params
    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subcriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },{
            $lookup: {
                from: "subcriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribeTo" 
            } 
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelSubscribedTo: {
                    $size: "$subscribeTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelSubscribedTo: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(400,"Channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"user channel fetched successfully")
    )
})

const getUserWatchHistory = asyncHandler(async (req,res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [{
                                $project: {
                                    fullname: 1,
                                    username: 1,
                                    avatar: 1
                                }
                            }]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            } 
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,user[0].watchHistory,"user watchHistory fetch successfully")
    )
} )




export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getUserWatchHistory,
}    