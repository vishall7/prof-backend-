import mongoose, { Schema } from "mongoose";

const playlistVideoSchema = new Schema(
    {
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video"
        },
        playlist: {
            type: Schema.Types.ObjectId,
            ref: "PlayList"
        }
    },
    {
        timestamps: true
    }
);

export const PlaylistVideo = mongoose.model("PlaylistVideo",playlistVideoSchema);