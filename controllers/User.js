import { User } from "../models/users.js";
import { sendMail } from "../utils/sendMail.js";
import {sendToken} from "../utils/sendToken.js"

export const register = async(req,res)=> {
    try {
        const {name, email, password} = req.body;
        // const {avatar} = req.files;

        let user = await User.findOne({email});

        if(user){
            return res.status(400).json({
                success: false,
                message: "User already exists",
            })
        }
        const otp = Math.floor(Math.random() * 1000000);
        user = await User.create({name, email, password, avatar: {
            public_id: "",
            url: ""
        }, otp, otp_expiry: new Date(Date.now() + 5*60*1000)});

        await sendMail(email, "Verify Your account", `Your otp is ${otp}`);
        sendToken(res, user, 201, "Otp is send to your email. Please verify your email");
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
};

export const verify = async(req,res)=> {
    try {
        const otp = Number(req.body.otp);
        const user = await User.findById(req.user._id);

        if(user.otp !== otp || user.otp_expiry < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP or has been expired"
            });
        }
        user.verified = true;
        user.otp = null;
        user.otp_expiry = null;

        await user.save();

        sendToken(res,user,200, "Account verified");
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
};

export const login = async(req,res) => {
    try {
        const {email,password} = req.body;
        if(!email || !password) {
            res.status(400).json({
                success: false,
                message: "Please enter all the fields"
            })
        }

        const user = await User.findOne({email}).select("+password");

        if(!user) {
            res.status(400).json({
                success: false,
                message: "Invalid email"
            });
        }

        const isMatch = await user.comparePassword(password);
        if(!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid Password",
            })
        };
        sendToken(res, user, 200, "Login Successful");
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export const logout = async(req,res) => {
    try {
        res.status(200).cookie("token", null).json({
            success: true,
            message: "Logged out successfully"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
};

export const addTask = async(req, res) => {
    try {
        const {title, description} = req.body;
        const user = await User.findById(req.user._id);

        user.tasks.push({
            title,
            description,
            completed: false,
            createdAt: new Date(Date.now()),
        });

        await user.save();

        res.status(200).json({
            success: true,
            message: "Task added successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
};

export const removeTask = async(req,res) => {
    try {
        const {taskId} = req.params;
        const user = await User.findById(req.user._id);

        user.tasks = user.tasks.filter((task) => task._id.toString() !== taskId.toString());

        await user.save();

        res.status(200).json({
            success: true,
            message: "Task removed successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}