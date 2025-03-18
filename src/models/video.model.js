import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile: {
            type: String, //cloudinary url
            required: true
        },
        thumbnail: {
            type: String, //cloudinary url
            required: true
        },
        videoFileId:{
            type:String,
            required:true
        },
        thumbnailId:{
            type:String
        },
        title: {
            type: String, 
            required: true
        },
        description: {
            type: String, 
            required: true
        },
        duration: {
            type: Number, 
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            required: false,
            // default: true
        },
       owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
//      allowAnonymous: {
//     type: Boolean, // ✅ Ensure this is correctly defined
//     default: true, // Default can be false (private)
//   },
    }, 
    {
        timestamps: true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)

const Video = mongoose.model("Video", videoSchema)
export default Video