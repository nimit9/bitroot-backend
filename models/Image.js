import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema({
    publicId: {
        type: String,
        required: [true, "Please provide public Id"],
    },
    imageUrl: {
        type: String,
        required: [true, "Please provide image URL"],
    },
});

export default mongoose.model("Image", ImageSchema);
