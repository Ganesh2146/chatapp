import jwt from 'jsonwebtoken';

const generateToken = (userId, res) => {
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId },
            process.env.JWT_SECRET,
            { expiresIn: '15d' }
        );

        // Set HTTP-only cookie with secure settings
        res.cookie('jwt', token, {
            maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days in milliseconds
            httpOnly: true, // Prevents XSS attacks
            sameSite: 'strict', // CSRF protection
            secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
            path: '/', // Make cookie available on all routes
            domain: process.env.NODE_ENV === 'production' ? '.onrender.com' : undefined // Set domain in production
        });

        return token;
    } catch (error) {
        console.error('Error generating token:', error);
        throw error;
    }
};

export default generateToken;