import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { userCredentialsModel } from '../../models/mongodb.mjs';

const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const signUpPage = (req, res) => {
    const userLoginCredentialsError = '';
    res.render('user/userSignUpPage', { userLoginCredentialsError });
};

export const signUpForm = async (req, res) => {
    const data = req.body;
    const saltRounds = 10;
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString(); // Use ISO format for consistent date storage
    const accessTokenSecret = req.session.ACCESS_TOKEN_SECRET;
    const refreshTokenSecret = req.session.REFRESH_TOKEN_SECRET;
    let userHashedPassword = '';

    // Initialize error object if not present
    if (!req.session.userLoginCredentialsError) {
        req.session.userLoginCredentialsError = {};
    }

    if (!data.email) {
        req.session.userLoginCredentialsError.email = 'Please enter valid Email';
    } else if (!isValidEmail(data.email)) {
        req.session.userLoginCredentialsError.email = 'Invalid Email format';
    }

    if (!data.password) {
        req.session.userLoginCredentialsError.password = 'Please enter valid Password';
    } else {
        const salt = await bcrypt.genSalt(saltRounds);
        userHashedPassword = await bcrypt.hash(data.password, salt);
    }

    if (Object.keys(req.session.userLoginCredentialsError).length > 0) {
        return res.render('user/userSignUpPage', { userLoginCredentialsError: req.session.userLoginCredentialsError });
    }

    const newUser = new userCredentialsModel({
        first_name: data.first_name,
        second_name: data.second_name,
        email: data.email,
        phone_number: data.phone_number,
        password: userHashedPassword,
        joined_date: formattedDate,
        status: true
    });

    try {
        const user = await newUser.save();

        const userId = user.id;

        req.userId = userId;

        const accessToken = jwt.sign( { userId }, accessTokenSecret, { expiresIn: '5m' });
        const refreshToken = jwt.sign( { userId }, refreshTokenSecret, { expiresIn: '7d' });

        // Update the user document with the new refresh token
        await userCredentialsModel.updateOne( { _id: user._id }, { $set: { refreshToken: refreshToken } });

        res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE === 'production', sameSite: 'Strict' });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE === 'production', sameSite: 'Strict' });

        res.redirect('homePage');
    } catch (error) {
        console.error(`Failed to signup: `, error);
        res.status(500).send('Internal Server Error');
    }
};