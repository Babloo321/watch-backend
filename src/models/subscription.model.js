import mongoose, {Schema} from "mongoose"

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // one who is subscribing
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, // one to whom 'subscriber' is subscribing
        ref: "User"
    },
    channelName:{
        type:String,
        required:true
    }
}, {timestamps: true})



const Subscription = mongoose.model("Subscription", subscriptionSchema)
export default Subscription