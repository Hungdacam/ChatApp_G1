const User = require("../models/user.model");
const Message = require("../models/message.model");
const { cloudinary } = require("../config/cloudinary");

const getUserForsidebar = async(req,res)=>{
    try {
        const loggedInUserId = req.user._id;
        const filterredUsers = await User.find({_id:{$ne:loggedInUserId}}).select("-password");

        res.status(200).json(filterredUsers);
    } catch (error) {
        console.log("Error in getUserForsidebar controller",error.message);
        res.status(500).json({message:"internal Server Error"});
    }
};

const getMessages = async(req,res)=>{
    try {
        const { id:userToChatId}= req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or:[
                {senderId:myId, receiverId:userToChatId},
                {senderId:userToChatId,receiverId:myId}
            ]
        })

        res.status(200).json(messages)
    } catch (error) {
        console.log("Error in getMessages controller",error.message);
        res.status(500).json({message:"internal Server Error"});
    }
}

const sendMessage = async(req,res)=>{
    try {
        const {text,image} = req.body;
        const { id:receiverId}= req.params;
        const senderId = req.user._id;

        let imageUrl;
       if(image){
         //tai anh len va gui lai phan hoi 
         const uploadResponse = await cloudinary.uploader.upload(image);
         imageUrl = uploadResponse.secure_url;
       }

       const newMessage = new Message({
        senderId,
        receiverId,
        text,
        image:imageUrl,
       });

       await newMessage.save();

       //chức năng thời gian thực sẽ được thực hiện ở đây => socket.io

       res.status(201).json(newMessage);

    } catch (error) {
        console.log("Error in sendMessages controller",error.message);
        res.status(500).json({message:"internal Server Error"});
    }
}
module.exports= {getUserForsidebar,getMessages,sendMessage}