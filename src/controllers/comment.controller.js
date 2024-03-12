import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/APIError.js";
import { ApiResponse } from "../utils/APIResponse.js";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import mongoose from "mongoose";

const writeCommentOnVideo = asyncHandler(async (req,res)=>{
    const {videoId} = req.params;

    const {content} = req.body;

    if(!videoId){
        throw new ApiError(400,"video id missing")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400,"video not found") 
    }   
                    
    const comment = await Comment.create({
        content: content,
        video: video._id,
        commentBy: req.user?._id 
    })   
     
    if(!comment){
        throw new ApiError(400,"comment not created") 
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,comment,"commented on video successfully")
    )  
})

const updateVideoComment = asyncHandler(async (req,res)=>{
    const {commentId} = req.params;
    const {content} = req.body;

    if(!commentId){
        throw new ApiError(400,"comment id not found");
    };
    
    if (!content.trim()) {
        throw new ApiError(400,"comment should not be empty"); 
    }

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: content
            }
        },
        {new: true} 
    )

    if (!comment) {
        throw new ApiError(400,"comment not update"); 
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,comment,"comment update successfully")
    )
})

const deleteVideoComment = asyncHandler(async (req,res)=>{
    const {commentId} = req.params;

    if(!commentId){
        throw new ApiError(400,"comment id not found");
    };

    const comment = await Comment.findByIdAndDelete(commentId);

    if(!comment){
        throw new ApiError(400,"comment not deleted");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,comment,"comment deleted successfully")
    )
})

const getVideoComments = asyncHandler(async (req,res)=>{
    let video_id = req.params.video_id;

    const { page = 1, limit = 10 } = req.query;

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
    };

    const skip = (options.page - 1) * options.limit;

    if(!video_id){
        throw new ApiError(400,'video_id is required');
    }

    
    const comments = await Comment.aggregate(
        [
            {
                $match:{ video :new mongoose.Types.ObjectId(video_id)}
            },
            {
                $lookup: {
                    from: "users",
                    localField: "commentBy",
                    foreignField: "_id",
                    as:"commentBy",
                    pipeline:[
                        {
                            $project:{
                                fullname: 1,
                                avatar: 1
                               }
                        }
                    ]                      
                }
            },
            {
                $addFields: {
                   commentBy: {
                    $first: "$commentBy"
                   } 
                }
            },
            { $skip: skip },
            { $limit: options.limit }
            
        ]   
    );

    // const result = await Comment.aggregatePaginate(comments,options)   

    return res
    .status(200)
    .json(
        new ApiResponse(200,comments,"comments fetched successfully")
        );
});
        

    



export {
    writeCommentOnVideo,
    updateVideoComment,
    deleteVideoComment,
    getVideoComments
}