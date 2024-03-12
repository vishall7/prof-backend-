import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/APIError.js";
import { ApiResponse } from "../utils/APIResponse.js";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";



const toggleLikeAndUnlikeVideo = asyncHandler(async (req,res)=>{
    const {videoId} = req.params;

    if(!videoId){
        throw new ApiError(400,"video ID missing") 
    } 
    
    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400,"video not found") 
    }
    
    const isLiked = await Like.findOne({
        video: video._id,
        likeBy: req.user?._id
    });

    if(!isLiked){
        const like = await Like.create(
            {
                video: videoId,
                likeBy: req.user?._id
            }
        )
        if(!like){
            throw new ApiError(400,"something went wrong")
        }
        return res
        .status(200)
        .json(
            new ApiResponse(200,like,"video Liked")
        )
    }

    await Like.findByIdAndDelete(isLiked._id);
    return res
    .status(200)
    .json(
        new ApiResponse(200,isLiked,"video unliked")
    )
    
    
})

const toggleLikeAndUnlikeComment = asyncHandler(async (req,res)=>{
    const {commentId} = req.params;

    if(!commentId){
        throw new ApiError(400,"comment ID missing") 
    } 
    
    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(400,"comment not found") 
    }
    
    const isLiked = await Like.findOne({
        comment: comment._id,
        likeBy: req.user?._id
    });

    if(!isLiked){
        const commentLike = await Like.create(
            {
                comment: commentId,
                likeBy: req.user?._id
            }
        )
        if(!commentLike){
            throw new ApiError(400,"something went wrong")
        }
        return res
        .status(200)
        .json(
            new ApiResponse(200,commentLike,"comment Liked")
        )
    }

    await Like.findByIdAndDelete(isLiked._id);
    return res
    .status(200)
    .json(
        new ApiResponse(200,isLiked,"comment unliked")
    )
    
    
})



export {
    toggleLikeAndUnlikeVideo,
    toggleLikeAndUnlikeComment
}