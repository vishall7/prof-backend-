import { ApiError } from "../utils/APIError.js";
import { ApiResponse } from "../utils/APIResponse.js";
import { PlayList } from "../models/playlist.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { PlaylistVideo } from "../models/playlistvideo.model.js";
import mongoose from "mongoose";

const saveToPlayList = asyncHandler(async (req,res)=>{
    //check if playlist is available or not in params
    //if yes then add video to it 
    // if not then create new playlist and add video to it  
    //get user data
    //create playlist 
    const {playlistId,videoId} = req.params;

    const {name,description} = req.body;
    
    if(!videoId?.trim()){
        throw new ApiError(400,"video id not passed")
    }

    const video = await Video.findById(videoId);
    
    if(!video){
        throw new ApiError(400,"video not found");
    }

    if(!playlistId?.trim()){

        if(!name?.trim()){
            throw new ApiError(400,"please provide some name for playlist")
        }

        const newPlaylist = await PlayList.create({
            name: name,
            description: description,
            owner: req.user?._id
        });
                
        if(!newPlaylist){
            throw new ApiError(400,"playlist not created")
        }

        const addedPlaylistVideo = await PlaylistVideo.create({
            video: video._id,
            playlist: newPlaylist._id
        });

        if(!addedPlaylistVideo){
            throw new ApiError(400,"video not added to playlist");
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200,newPlaylist,"playlist created successfully and added video to new playlist")
        )
    }

    const existedPlaylist = await PlayList.findById(playlistId);

    if(!existedPlaylist){
        throw new ApiError(400,"playlist not found")
    }

    const videoExisted = await PlaylistVideo.findOne(
        {
            playlist: existedPlaylist._id,
            video: video._id
        }
    );
    
    if(videoExisted){
        await PlaylistVideo.findByIdAndDelete(videoExisted._id);

        return res
        .status(200)
        .json(
            new ApiResponse(200,existedPlaylist,"video removed from playlist")
        )
    }

    await PlaylistVideo.create({
        video: video._id,
        playlist: playlistId
    }) 

    return res
   .status(200)
   .json(new ApiResponse(200,existedPlaylist,"video added to this playlist"))

})

const removeVideoFromPlaylist = asyncHandler(async (req,res)=>{
    //get playlist and video id from params
    //search for video exists or not 
    // if yes then search for playlist 
    //check if video exists in a playlist 
    //if yes then deletes it
    const {videoId,playlistId} = req.params;

    if(!videoId && !playlistId){
        throw new ApiError(400,"both ids are mandetory");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400,"video not found");
    }

    const playlist = await PlayList.findById(playlistId);

    if(!playlist){
        throw new ApiError(400,"playlist not found");
    }

    const videoExists = await PlaylistVideo.findOne(
        {
            video: video._id,
            playlist: playlist._id
        }
    );

    if(!videoExists){
        throw new ApiError(400,"video has been already deleted")
    };

    await PlaylistVideo.findByIdAndDelete(videoExists._id);

    return res
    .status(200)
    .json(
        new ApiResponse(200,videoExists,"video deleted successfully")
    )

})

const getPlaylistInfo = asyncHandler(async (req,res)=>{

    const {playlistId} = req.params;

    if (!playlistId) {
        throw new ApiError(400,"playlist id missing");
    }
    
   const playlist = await PlayList.aggregate(
    [
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        
        {
            $lookup: {
                from: "playlistvideos",
                localField: "_id",
                foreignField: "playlist",
                as: "videos"
            }
        },
        {
           $addFields: {
            
            videoCount: {
                $size: "$videos"
            }
           }  
        },
        {
            $project:{
                videos: 0
            }
        }
    ]
   )

    if(!playlist.length){
        throw new ApiError(400,"playlist not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"here is your playlist")
    )
}); 

const getPlaylistVideos = asyncHandler(async (req,res)=>{
    const {playlistId} = req.params;

    const{page = 1,limit = 10} = req.query;

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    }

    const skip = (options.page - 1) * options.limit;

    if(!playlistId){
        throw new ApiError(400,"playlist id is missing");
    }
    
    const playlistVideos = await PlaylistVideo.aggregate(
        [
            {
                $match: {
                    playlist: new mongoose.Types.ObjectId(playlistId)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "videos"
                } 
            },
            {
                $addFields: {
                    videos: {
                        $first: '$videos'
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    playlist: 0,
                    
                }
            },
            {
                $replaceRoot: {
                    newRoot: "$videos"
                }
            },
            {$skip: skip},
            {$limit: options.limit},            
        ]
    );
    
    if(!playlistVideos.length){
        throw new ApiError(400,"videos not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlistVideos,"playlist videos fetched successfully")
    )
})

const getUserPlaylists = asyncHandler(async (req,res)=>{
    //get user id 
    // query database and match results

    const userId = req.user._id;

    const playlists = await PlayList.aggregate(
        [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            
            {
                $lookup: {
                    from: "playlistvideos",
                    localField: "_id",
                    foreignField: "playlist",
                    as: "videos"
                }
            },
            {
               $addFields: {
                
                videoCount: {
                    $size: "$videos"
                }
               }  
            },
            {
                $project:{
                    videos: 0
                }
            }
        ]
    )

    if(!playlists.length){
        throw new ApiError(400,"user not have any playlist");
    };

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlists,"user playlists fetched successfully")
    )
})

const deletePlaylist = asyncHandler(async (req,res)=>{
    //get playlist id
    //check if it exists
    //delete all videos from playlist 
    //then deletes playlist

    const  {playlistId} = req.params;
    
    if(!playlistId){
        throw new ApiError(400,"playlist id is missing")
    }

    const playlistExists = await PlayList.findById(playlistId)

    if(!playlistExists){
        throw new ApiError(400,"playlist not found")
    }

    await PlaylistVideo.deleteMany({
        playlist: playlistExists._id
    });

    await PlayList.findByIdAndDelete(playlistExists._id)

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlistExists,"playlist deleted along with videos")
    )
})

export {
    saveToPlayList,
    getPlaylistInfo,
    getPlaylistVideos,
    removeVideoFromPlaylist,
    getUserPlaylists,
    deletePlaylist
}