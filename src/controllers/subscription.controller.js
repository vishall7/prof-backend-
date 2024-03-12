import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/APIError.js";
import { ApiResponse } from "../utils/APIResponse.js";
import { Subscription } from "../models/subscription.model.js";
import {User} from "../models/user.model.js";

const toggleSubscribeAndUnsubscribe = asyncHandler(async (req,res)=>{
    const {username} = req.params;

    if(!username?.trim()){
        throw new ApiError(400,"username id missing")
    }

    const channel = await User.findOne({username: username})

    if(!channel){
        throw new ApiError(400,"channel not found")
    }

    const isSubscribed = await Subscription.findOne(
        {
            subscriber: req.user?._id,
            channel: channel._id
        }
    )

    if(!isSubscribed){
        const subscribe = await Subscription.create(
            {
                subscriber: req.user?._id,
                channel: channel._id 
            }
        )

        if(!subscribe){
            throw new ApiError(400,"something went wrong")
        }

        return res.status(200)
        .json(
            new ApiResponse(200,subscribe,"channel subscribed successfully")
        ) 
    }

    await Subscription.findByIdAndDelete(isSubscribed._id)
    return res
    .status(200)
    .json(
        new ApiResponse(200,isSubscribed,"channel unscubscribed")
    )

}) 


export {
    toggleSubscribeAndUnsubscribe
}
