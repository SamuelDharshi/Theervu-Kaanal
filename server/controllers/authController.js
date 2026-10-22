import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Official from '../models/Official.js';
import Petitioner from '../models/Petitioner.js';
import Admin from '../models/Admin.js';
import Grievance from '../models/Grievance.js';
import { JWT_SECRET, JWT_OPTIONS } from '../config/jwt.js';
import { supabase, isSupabaseEnabled } from '../config/supabase.js';

// Helper function to calculate token expiration
const calculateTokenExpiration = () => {
    // 24 hours from now
    return Math.floor(Date.now() / 1000) + (24 * 60 * 60);
};

const generateToken = (user) => {
    if (!user || !user._id) {
        throw new Error('Invalid user object');
    }

    const payload = {
        id: user._id.toString(),
        role: (user.role || 'petitioner').toLowerCase(), // Default to petitioner if role is undefined
        exp: calculateTokenExpiration()
    };

    // Add department for officials
    if (user.role === 'official' || user.department) {
        payload.department = user.department;
    }

    // Add jurisdiction fields for officials
    if (user.role === 'official' && user.taluk) {
        payload.taluk = user.taluk;
    }
    if (user.role === 'official' && user.district) {
        payload.district = user.district;
    }
    if (user.role === 'official' && user.division) {
        payload.division = user.division;
    }

    return jwt.sign(payload, JWT_SECRET, JWT_OPTIONS);
};

const MODELS = { petitioner: Petitioner, official: Official, admin: Admin };

const displayName = (user) => (user.firstName || user.lastName)
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
    : (user.name || user.email.split('@')[0]);

const buildUserPayload = (user, role) => ({
    id: user._id.toString(),
    name: displayName(user),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role,
    ...(role === 'official' && {
        department: user.department,
        employeeId: user.employeeId,
        designation: user.designation,
        taluk: user.taluk,
        district: user.district,
        division: user.division
    }),
    ...(role === 'admin' && { adminId: user.adminId, position: user.position })
});

// Checks the password against the bcrypt hash stored in MongoDB first, then
// (if configured) against Supabase Auth. Returns true when either succeeds.
const checkPassword = async (user, email, password) => {
    if (user?.password && await bcrypt.compare(password, user.password)) {
        return true;
    }
    if (isSupabaseEnabled) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        return !error && !!data?.user;
    }
    return false;
};

const sendLoginResponse = (res, user, role) => {
    const token = generateToken({ ...user.toObject(), role });
    res.status(200).json({
        message: 'Login successful',
        token,
        user: buildUserPayload(user, role)
    });
};

// Token verification endpoint (auth middleware has already validated the token)
export const verifyToken = async (req, res) => {
    const Model = MODELS[req.user?.role];
    const user = Model ? await Model.findById(req.user.id) : null;
    if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({
        success: true,
        user: buildUserPayload(user, req.user.role)
    });
};

// Token Refresh - issues a fresh app token for an authenticated user
export const refreshToken = async (req, res) => {
    try {
        const Model = MODELS[req.user?.role];
        const user = Model ? await Model.findById(req.user.id) : null;
        if (!user) {
            return res.status(401).json({ message: 'User not found', code: 'USER_NOT_FOUND' });
        }
        res.json({
            token: generateToken({ ...user.toObject(), role: req.user.role }),
            user: buildUserPayload(user, req.user.role)
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({ message: 'Failed to refresh token', code: 'REFRESH_FAILED' });
    }
};

// Petitioner Login
export const loginPetitioner = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const petitioner = await Petitioner.findOne({ email: email.trim() });
        if (!petitioner || !(await checkPassword(petitioner, email, password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        sendLoginResponse(res, petitioner, 'petitioner');
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Official Login
export const loginOfficial = async (req, res) => {
    try {
        const { email, password, department, employeeId } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const official = await Official.findOne({ email: email.trim() });
        if (!official || !(await checkPassword(official, email, password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        if (department && department !== official.department) {
            return res.status(401).json({ error: `This account belongs to the ${official.department} department` });
        }
        if (employeeId && employeeId.trim() !== official.employeeId) {
            return res.status(401).json({ error: 'Employee ID does not match this account' });
        }

        sendLoginResponse(res, official, 'official');
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Admin Login
export const loginAdmin = async (req, res) => {
    try {
        const { email, password, adminId } = req.body;
        if ((!email && !adminId) || !password) {
            return res.status(400).json({ error: 'Admin ID or email, and password are required' });
        }

        const admin = email ? await Admin.findOne({ email: email.trim() }) : await Admin.findOne({ adminId });
        if (!admin || !(await checkPassword(admin, admin?.email || email, password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        if (adminId && adminId.trim() !== admin.adminId) {
            return res.status(401).json({ error: 'Admin ID does not match this account' });
        }

        sendLoginResponse(res, admin, 'admin');
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get current user
export const getCurrentUser = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        // Return user data without sensitive information
        res.json({
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            ...(user.department && { department: user.department }),
            ...(user.taluk && { taluk: user.taluk }),
            ...(user.district && { district: user.district }),
            ...(user.division && { division: user.division })
        });
    } catch (error) {
        console.error('Error getting current user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Register Petitioner
export const registerPetitioner = async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields',
                errors: {
                    name: !name ? 'Name is required' : undefined,
                    email: !email ? 'Email is required' : undefined,
                    password: !password ? 'Password is required' : undefined
                }
            });
        }

        // Check if user already exists in MongoDB
        const existingUser = await Petitioner.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Optionally mirror the account in Supabase Auth
        let supabaseUserId;
        if (isSupabaseEnabled) {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { name, role: 'petitioner' } }
            });
            if (authError) {
                console.warn('Supabase sign-up failed, continuing with local account:', authError.message);
            }
            supabaseUserId = authData?.user?.id;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [firstName, ...rest] = name.trim().split(/\s+/);

        const petitioner = new Petitioner({
            firstName,
            lastName: rest.join(' ') || '-',
            email,
            password: hashedPassword,
            phone: phone || 'N/A',
            address
        });

        await petitioner.save();

        // Return success response
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                token: generateToken({ ...petitioner.toObject(), role: 'petitioner' }),
                user: { ...buildUserPayload(petitioner, 'petitioner'), ...(supabaseUserId && { supabaseId: supabaseUserId }) }
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
};

// Get resource management data from all departments
export const getResourceManagementData = async (req, res) => {
    try {
        const grievances = await Grievance.find({
            resourceManagement: { $exists: true }
        })
            .select('department resourceManagement status petitionId taluk division district')
            .lean();

        const resources = grievances.map(grievance => ({
            _id: grievance._id,
            department: grievance.department,
            petitionId: grievance.petitionId,
            taluk: grievance.taluk || 'N/A',
            division: grievance.division || 'N/A',
            district: grievance.district || 'N/A',
            startDate: grievance.resourceManagement?.startDate || new Date(),
            endDate: grievance.resourceManagement?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            requirementsNeeded: grievance.resourceManagement?.requirementsNeeded || 'Not specified',
            fundsRequired: grievance.resourceManagement?.fundsRequired || 0,
            resourcesRequired: grievance.resourceManagement?.resourcesRequired || 'Not specified',
            manpowerNeeded: grievance.resourceManagement?.manpowerNeeded || 'Not specified',
            status: grievance.status === 'resolved' ? 'Completed' : 'In Progress'
        }));

        res.json({ resources });
    } catch (error) {
        console.error('Error fetching resource management data:', error);
        res.status(500).json({ message: 'Error fetching resource management data' });
    }
};