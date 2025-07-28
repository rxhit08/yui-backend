import { Router } from 'express';
import { sendMessages, getMessagedUsers, showMessageOfRequestedUser, getMessagedUsersWithLastMessage } from '../controllers/message.controllers.js';
import { verifyToken } from '../middlewares/verifyToken.middlewares.js'

const router = Router();

router.route("/sendmessage/:userName").post(verifyToken, sendMessages)

router.route("/getmessagedusers").get(verifyToken, getMessagedUsers)

router.route("/showmessage/:userName").get(verifyToken, showMessageOfRequestedUser)

router.route("/showlastmessage").get(verifyToken, getMessagedUsersWithLastMessage)

export default router;