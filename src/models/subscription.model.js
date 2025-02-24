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
    name:{
        type: String,
        required: true
    },
    details:{
        type: String
    }
}, {timestamps: true})



const Subscription = mongoose.model("Subscription", subscriptionSchema)
export default Subscription