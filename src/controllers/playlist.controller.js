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
            new ApiResponse(200,addedPlaylistVideo,"playlist created successfully and added video to new playlist")
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
    const {videoId,playlistId} = req.params
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
                        $arrayElemAt: ['$videos', 0]
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
            }
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


export {
    saveToPlayList,
    getPlaylistInfo,
    getPlaylistVideos
}