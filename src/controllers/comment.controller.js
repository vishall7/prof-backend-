import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/APIError.js";
import { ApiResponse } from "../utils/APIResponse.js";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import mongoose from "mongoose";

const writeVideoComment = asyncHandler(async (req,res)=>{
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
                $match:{
                     video :new mongoose.Types.ObjectId(video_id),
                     parentComment: { $exists: false },
                }
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
                $lookup: {
                    from: "comments",
                    localField: "_id",
                    foreignField: "parentComment",
                    as: "replies"
                }
                    
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "comment",
                    as: "commentLikes"
                }
                    
            },
            
            {
                $addFields: {
                   commentBy: {
                    $first: "$commentBy"
                   },
                   commentLikes: {
                    $size: "$commentLikes"
                   },
                   replies: {
                    $size: "$replies"
                   }
                }
            },
            {
                $sort:{
                    commentLikes: -1
                }                    
            },
            { $skip: skip },
            { $limit: options.limit }
            
        ]   
    );

    return res
    .status(200)
    .json(
        new ApiResponse(200,comments,"comments fetched successfully")
        );
});

const addReplyToComment = asyncHandler(async  (req,res)=>{
    const commentId = req.params.commentId;
    const {content} = req.body;
 
    if (!commentId) {
        throw new ApiError(400,"comment id not found")
    }

    const comment = await Comment.findById(commentId)

    if(comment.parentComment){
        throw new ApiError(400,"you can not reply to reply")
    }

    const reply = await Comment.create({
        content: content,
        commentBy: req.user?._id,
        parentComment: comment._id
    })

    if(!reply){
        throw new ApiError(400,"reply not created")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,reply,"reply successfully")
    )
})

        
const getCommentReplies = asyncHandler(async (req,res)=>{
    const commentId= req.params.commentId;
    const { page = 1, limit = 10 } = req.query;

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
    };

    const skip = (options.page - 1) * options.limit;   // Skip the records that already in the current page 
       
    if(!commentId){
        throw  new Error(400,"No Comment Id Provided");
    }

    const replies = await Comment.aggregate([
        {
            $match:{
                parentComment : new mongoose.Types.ObjectId(commentId)
            }
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
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "commentLikes"
            }
                
        },
        {
            $addFields: {
                commentBy: {
                    $first: "$commentBy"
                },
                commentLikes: {
                    $size: "$commentLikes"
                }
            }
        },
        {
            $sort: {
                commentLikes: -1
            }
        },
        {$skip : skip},
        {$limit : options.limit},
      
    ]);

    if(!replies.length){
        throw new ApiError(400, 'No replies found');
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,replies,"replies fetched successfully")
    )


})
    
export {
    writeVideoComment,
    updateVideoComment,
    deleteVideoComment,
    getVideoComments,
    getCommentReplies,
    addReplyToComment
}