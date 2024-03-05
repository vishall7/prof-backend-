import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/APIError.js";
import { ApiResponse } from "../utils/APIResponse.js";
import { fileUploadTOCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";

const uploadVideo = asyncHandler(async (req,res)=>{
    //get file path
    //check if its available 
    //check its format wether it is video or not
    // if yes upload to cloudinary
    //get url,duration
    // store it to database 
    //return res

    const videoLocalPath = req.files?.video[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;
    
    if(!videoLocalPath){
        throw new ApiError(400,"video not found");
    };
    
    const {title,description} = req.body;

    if(title === "" && title.length < 3){
        throw new ApiError(400,"please provide suitable title")
    }

    if(description === ""){
        throw new ApiError(400,"please provide some description about your video")
    }

    if(!thumbnailLocalPath){
        throw new ApiError(400,"thumbnail not found");
    };

    const videoFileFormat = req.files?.video[0].originalname.split('.').pop().toLowerCase();
    const thumbnailFileFormat = req.files?.thumbnail[0].originalname.split('.').pop().toLowerCase();
    
    if(videoFileFormat !== "mp4"){
        throw new ApiError(400,"try to upload videos not other files!")
    }

    if(thumbnailFileFormat !== "jpg" && thumbnailFileFormat !== "png"){
        throw new ApiError(400,"try to upload thumbnail in jpg or png format")
    }

    console.log("CLeard here");
    const uploadedVideo = await fileUploadTOCloudinary(videoLocalPath,"video1","");
    const uploadedThumbnail = await fileUploadTOCloudinary(thumbnailLocalPath,"thumbnail1","");

    console.log("cleared here 2")

    if(!uploadedVideo.url){
        throw new ApiError(400,"video not uploaded");
    }
    if(!uploadedThumbnail.url){
        throw new ApiError(400,"thumbnail not uploaded");
    }

    console.log("cleared here 3")


    const video = await Video.create(
        {
            videoFile: uploadedVideo.url,
            thumbnail: uploadedThumbnail.url,
            title: title,
            description: description,
            duration: uploadedVideo.duration, 
            owner: req.user?._id
        }
    ) 
    console.log("cleared here 4")
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"video uploaded successfully")
    ) 
    
})

const getAllVideos = asyncHandler(async (req,res)=>{
    //get videos by aggrigate  
    //use pagination

    const { page = 1, limit = 3 } = req.query;

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
    };

    const allVideos = await Video.aggregate(
        [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(req.user._id)
                }
            }
        ]
    )
    
    if(!allVideos.length){
        throw new ApiError(400,"videos not found") 
    }

    const result = await Video.aggregatePaginate(allVideos,options) 
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,result,"videos load successfully")
    )

})

const getVideoById = asyncHandler(async (req,res)=>{

    const {videoId} = req.params;
    console.log(videoId)
    if(!videoId?.trim()){
        throw new ApiError(400,"video id is missing") 
    }

    const video = await Video.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                fullname: 1,
                                avatar: 1,
                                coverImage: 1
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes",
                }
                
            },
            {
                $addFields: {
                    owner:{
                        $first: "$owner"
                    },
                    likesCount: {
                        $size: "$likes"
                    },
                    isLiked: {
                        $cond: {
                            if: {$in: ["$owner._id","$likes.likeBy"]},
                            then: true,
                            else: false
                        }
                    }                   
                }
            },
            {
                $project: {
                    likes: 0
                } 
            }

        ]
    )

    if(!video.length){
        throw new ApiError(400,"video not found")
    }

    return res.
    status(200)
    .json(
        new ApiResponse(200,video[0],"video fetched successfully")
    )
}) 

const updateVideoDetails = asyncHandler(async (req,res)=>{
    // get video id
    // get user data
    // query database for video 
    // get video and use patch request
    // use findByIdAndUpdate method 
    // save database and return it 

    const {videoId} = req.params;
 
    if(!videoId){
        throw new ApiError(400, "video id missing");
    };

    const {title, description} = req.body;

    const updateFeilds = {};
    
    if(title?.trim() === "" || title?.length <= 4){
        throw new ApiError(400,"please provide suitable title")
    }

    if(title){
        updateFeilds.title = title;
    }

    if(description){
        updateFeilds.description = description;
    }      
       
    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: updateFeilds
        },
        {
            new: true
        }
    )
    
    if(!video){
        throw new ApiError(400, "video updation failed")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,video, "details upadate successfully")
    )
})


export {
    uploadVideo,
    getAllVideos,
    getVideoById,
    updateVideoDetails

}