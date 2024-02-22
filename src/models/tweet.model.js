import mongoose,{Schema} from "mongoose";

const tweetSchema = new Schema(
    {
        
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true,"Tweet should have an owner"]
        },
        content: {
            type: String,
            trim: true,
            required: [true,"Tweet must have some content"] 
        }

    },
    {
        timestamps: true
    }
)

export const Tweet = mongoose.model("Tweet",tweetSchema)
