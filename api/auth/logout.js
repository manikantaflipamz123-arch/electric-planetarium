export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // To logout, we overwrite the auth_token cookie with a token that instantly expires
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieString = `auth_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict${isProduction ? '; Secure' : ''}`;

    res.setHeader('Set-Cookie', cookieString);

    return res.status(200).json({ message: 'Successfully logged out' });
}
