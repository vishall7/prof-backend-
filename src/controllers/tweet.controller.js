import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/APIError.js";
import { ApiResponse } from "../utils/APIResponse.js";
import { Tweet } from "../models/tweet.model.js";


const createTweet = asyncHandler(async (req,res)=>{
    //get content 
    // pass the userid to tweets owner feild
    // check content is available or not
    // if so then create object to mongodb 
    
    const {content} = req.body;
    if(!content.trim()){
        throw new ApiError(401,"content is missing")
    }
    const tweet = await Tweet.create(
        {
          owner: req.user?._id,
          content: content.toLowerCase()  
        }
    )

    if(!tweet){
        throw new ApiError(400,"tweet was not created")
    }

    return res.status(200)
    .json(
        new ApiResponse(200,tweet,"tweet created successfully")
    )
})

const getAllTweets = asyncHandler(async (req,res)=>{
    const tweets = await Tweet.aggregate(
        [
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline:[
                        {
                            $project: {
                                username: 1,
                                fullname: 1,
                                avatar: 1
                            }
                        }
                    ]
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
    )

    if(!tweets?.length){
        throw new ApiError(400,"tweets are not there")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,tweets,"tweets fetched successfully")
    )
})

export {
    createTweet,
    getAllTweets
}