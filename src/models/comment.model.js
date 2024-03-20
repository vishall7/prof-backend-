import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
    {
        content: {
            type: String,
            required: [true,"comments must not be empty"]
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
        },
        commentBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true 
        },
        parentComment: {
            type: Schema.Types.ObjectId,
            ref:"Comment"
        }
    },
    {
        timestamps: true
    }
)

commentSchema.plugin(mongooseAggregatePaginate)

export const Comment = mongoose.model("Comment",commentSchema)