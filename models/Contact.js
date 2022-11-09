import mongoose from "mongoose";
import validator from "validator";

const PhoneNumberSchema = new mongoose.Schema({
    number: {
        type: String,
        required: [true, "Please provide a number"],
        trim: true,
    },
    label: {
        type: String,
        enum: ["Mobile", "Home", "Work"],
        default: "Mobile",
    },
});

const ContactSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, "Please provide first name"],
            maxlength: 50,
        },
        lastName: {
            type: String,
            maxlength: 50,
        },
        phoneNumbers: [PhoneNumberSchema],
        email: {
            type: String,
            validate: {
                validator: validator.isEmail,
                message: "Please provide a valid email",
            },
        },
        birthDate: {
            type: Date,
        },
        company: {
            type: String,
            maxlength: 100,
        },
        image: {
            type: mongoose.Types.ObjectId,
            ref: "Image",
            required: [true, "Please provide image"],
        },
    },
    { timestamps: true }
);

export default mongoose.model("Contact", ContactSchema);
