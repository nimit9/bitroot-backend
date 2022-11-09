import { BadRequestError, NotFoundError } from "../errors/index.js";

import Contact from "../models/Contact.js";
import Image from "../models/Image.js";
import { StatusCodes } from "http-status-codes";
import cloudinary from "../utils/cloundinary.js";
import fs from "fs";
import { hasOnlyDigits } from "../utils/hasOnlyDigits.js";
import moment from "moment-timezone";
import mongoose from "mongoose";
import path from "path";
import url from "url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createContact = async (req, res, next) => {
    var { firstName, phoneNumbers, birthDate, email } = req.body;

    if (!firstName || !phoneNumbers) {
        throw new BadRequestError("Please provide all values");
    }
    if (!req.file) {
        throw new BadRequestError("Please provide image");
    }

    if (!Array.isArray(phoneNumbers)) {
        throw new BadRequestError(
            "please provide phone numbers in correct format"
        );
    }

    var providedNumbers = [];
    phoneNumbers.forEach((numberObj) => {
        const currNumber = numberObj.number;
        if (!currNumber) {
            throw new BadRequestError(
                "please provide correct phone number format"
            );
        }
        if (currNumber.length !== 10 || !hasOnlyDigits(currNumber)) {
            throw new BadRequestError(
                `${currNumber} is not a valid phone number`
            );
        }
        if (providedNumbers.includes(currNumber)) {
            throw new BadRequestError(
                `${currNumber} already exists. Please provide unique phone number`
            );
        }

        providedNumbers.push(currNumber);
    });

    const phoneNumberExists = await Contact.findOne({
        "phoneNumbers.number": { $in: providedNumbers },
    });
    if (phoneNumberExists) {
        throw new BadRequestError(
            "Mobile Number already exists, please provide unique number"
        );
    }

    if (email) {
        const emailExists = await Contact.findOne({ email });
        if (emailExists) {
            throw new BadRequestError("Email Already exists");
        }
    }

    // ###########################################
    // ****** Storing Image on Cloudinary ******
    // ###############################################
    const upload = await cloudinary.v2.uploader.upload(req.file.path);
    const image = await Image.create({
        publicId: upload.public_id,
        imageUrl: upload.secure_url,
    });
    req.body.image = image;

    // ###########################################################
    // ****** Storing Image on Server WIthout extra table ******
    // ############################################################

    // if (!path.extname(req.file.originalname).toLowerCase() === ".jpg") {
    //     fs.unlink(tempPath);
    //     throw new BadRequestError("Only .jpg files are allowed");
    // }
    // const tempPath = req.file.path;
    // const fileName = contactId.toString() + ".jpg";
    // const targetPath = path.join(__dirname, `../public/asset/img/${fileName}`);

    // fs.rename(tempPath, targetPath, (err) => {
    //     if (err) {
    //         next(err);
    //     }
    // });
    // req.body.image =
    //     req.protocol + "://" + req.get("host") + `/asset/img/${fileName}`;

    if (birthDate) {
        req.body.birthDate = moment(birthDate).format("YYYY-MM-DDT06:30:00Z");
    }

    var createdContact = await Contact.create({
        ...req.body,
    });
    res.status(StatusCodes.OK).json({
        msg: "Contact created!",
        data: createdContact,
    });
};

const getAllContacts = async (req, res) => {
    const allContacts = await Contact.find({}).populate("image");
    res.status(StatusCodes.OK).json({
        msg: `Total ${allContacts.length} ${
            allContacts.length !== 1 ? "contacts" : "contact"
        }`,
        data: allContacts,
    });
};
const updateContact = async (req, res) => {
    const { id: contactId } = req.params;
    const contact = await Contact.findOne({ _id: contactId }).populate("image");

    if (!contact) {
        throw new NotFoundError(`No contact with id: ${contactId}`);
    }

    const { firstName, phoneNumbers, email, birthDate } = req.body;

    if (!firstName || !phoneNumbers) {
        throw new BadRequestError("Please provide all values");
    }

    if (!Array.isArray(phoneNumbers)) {
        throw new BadRequestError(
            "please provide phone numbers in correct format"
        );
    }

    var providedNumbers = [];
    phoneNumbers.forEach((numberObj) => {
        if (!numberObj.number) {
            throw new BadRequestError(
                "please provide correct phone number format"
            );
        }
        if (numberObj.number.length !== 10) {
            throw new BadRequestError("please provide number of 10 digits");
        }
        if (providedNumbers.includes(numberObj.number)) {
            throw new BadRequestError("Please provide unique phone numbers");
        }

        providedNumbers.push(numberObj.number);
    });

    const phoneNumberExists = await Contact.findOne({
        "phoneNumbers.number": { $in: providedNumbers },
        _id: { $ne: contactId },
    });
    if (phoneNumberExists) {
        throw new BadRequestError(
            "Mobile Number already exists, please provide unique number"
        );
    }

    if (email) {
        const emailAlreadyExists = await Contact.findOne({
            email,
            _id: { $ne: contactId },
        });
        if (emailAlreadyExists) {
            throw new BadRequestError("Email Already Exists");
        }
    }

    // ***** Updating Image on Cloudinary *************

    if (req.file) {
        const upload = await cloudinary.v2.uploader.upload(req.file.path, {
            public_id: contact.image.publicId,
            invalidate: true,
        });
        await Image.findByIdAndUpdate(contact.image._id, {
            publicId: upload.public_id,
            imageUrl: upload.secure_url,
        });
    }

    // ***** Updating Image on local without extra table *************

    // if (
    //     req.file &&
    //     req.file.originalname.split(".")[0] !== contactId.toString()
    // ) {
    //     if (!path.extname(req.file.originalname).toLowerCase() === ".jpg") {
    //         fs.unlink(tempPath);
    //         throw new BadRequestError("Only .jpg files are allowed");
    //     }
    //     const tempPath = req.file.path;
    //     const fileName = contactId.toString() + ".jpg";
    //     const targetPath = path.join(
    //         __dirname,
    //         `../public/asset/img/${fileName}`
    //     );

    //     fs.rename(tempPath, targetPath, (err) => {
    //         if (err) {
    //             next(err);
    //         }
    //     });
    //     req.body.image =
    //         req.protocol + "://" + req.get("host") + `/asset/img/${fileName}`;
    // }

    if (birthDate) {
        req.body.birthDate = moment(birthDate).format("YYYY-MM-DDT06:30:00Z");
    }
    var updatedContact = await Contact.findByIdAndUpdate(contactId, req.body, {
        new: true,
    }).populate("image");

    res.status(StatusCodes.OK).json({
        msg: "Updated successfully!",
        updatedContact,
    });
};

const deleteContact = async (req, res) => {
    const { id: contactId } = req.params;
    const contact = await Contact.findOne({ _id: contactId });
    if (!contact) {
        throw new NotFoundError(`No contact with id: ${contactId}`);
    }
    await contact.remove();
    res.status(StatusCodes.OK).json({ msg: "Success! Contact Removed" });
};

const searchContact = async (req, res) => {
    const { name, number } = req.body;
    var searchedContacts = [];
    if (name) {
        const searchString = new RegExp(name, "ig");

        searchedContacts = await Contact.aggregate([
            {
                $lookup: {
                    from: "images",
                    localField: "image",
                    foreignField: "_id",
                    as: "image",
                },
            },
        ])
            .project({
                fullName: { $concat: ["$firstName", " ", "$lastName"] },
                firstName: 1,
                lastName: 1,
                phoneNumbers: 1,
                birthDate: 1,
                company: 1,
                email: 1,
                image: { $arrayElemAt: ["$image", 0] },
            })
            .match({ fullName: searchString })
            .project({ fullName: 0 });
    }

    if (number) {
        const searchString = new RegExp(number, "ig");
        searchedContacts = await Contact.aggregate([
            {
                $lookup: {
                    from: "images",
                    localField: "image",
                    foreignField: "_id",
                    as: "image",
                },
            },
        ]).match({ "phoneNumbers.number": searchString });
    }
    res.status(StatusCodes.OK).json({
        msg: `Found ${searchedContacts.length} ${
            searchedContacts.length !== 1 ? "contacts" : "contact"
        }`,
        searchedContacts,
    });
};

export {
    createContact,
    getAllContacts,
    updateContact,
    deleteContact,
    searchContact,
};
