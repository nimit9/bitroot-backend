import {
    createContact,
    deleteContact,
    getAllContacts,
    searchContact,
    updateContact,
} from "../controllers/contactsController.js";

import express from "express";
import upload from "../utils/fileUpload.js";

const router = express.Router();

router
    .route("/")
    .post(upload.single("file"), createContact)
    .get(getAllContacts);
router.route("/search").post(searchContact);
router
    .route("/:id")
    .delete(deleteContact)
    .patch(upload.single("file"), updateContact);

export default router;
